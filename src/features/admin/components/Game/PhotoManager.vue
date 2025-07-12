<template>
  <div class="photo-manager">
    <div class="header-section">
      <h2 class="section-title">📸 포토 모드 관리</h2>
      <p class="section-description">포토 게임에 사용될 사진들을 업로드하고 관리할 수 있습니다.</p>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <button 
        @click="activeTab = 'single'"
        :class="{ active: activeTab === 'single' }"
        class="tab-btn"
      >
        <i class="fas fa-plus"></i>
        개별 업로드
      </button>
      <button 
        @click="activeTab = 'multiple'"
        :class="{ active: activeTab === 'multiple' }"
        class="tab-btn"
      >
        <i class="fas fa-images"></i>
        다중 업로드
      </button>
      <button 
        @click="activeTab = 'list'"
        :class="{ active: activeTab === 'list' }"
        class="tab-btn"
      >
        <i class="fas fa-list"></i>
        사진 목록
      </button>
    </div>

    <!-- 개별 업로드 -->
    <div v-if="activeTab === 'single'" class="single-upload">
      <div class="upload-container">
        <div class="image-upload-section">
          <h3>사진 업로드</h3>
          <div class="upload-area" @click="$refs.singleFileInput.click()">
            <input 
              ref="singleFileInput" 
              type="file" 
              accept="image/*" 
              @change="handleSingleFileSelect"
              style="display: none"
            />
            <div v-if="!selectedImage" class="upload-placeholder">
              <i class="fas fa-camera"></i>
              <p>사진을 선택하세요</p>
            </div>
            <div v-else class="image-preview">
              <img :src="selectedImage.preview" alt="Preview" />
              <button @click.stop="selectedImage = null" class="remove-image">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="photo-info-section">
          <h3>사진 정보</h3>
          <div class="form-group">
            <label>사진 이름 (관광지명)</label>
            <input 
              v-model="photoInfo.name" 
              type="text" 
              placeholder="예: 경복궁"
            />
          </div>
          <div class="form-group">
            <label>지역</label>
            <select v-model="photoInfo.region">
              <option value="">지역 선택</option>
              <option value="seoul">서울</option>
              <option value="busan">부산</option>
              <option value="incheon">인천</option>
              <option value="daegu">대구</option>
              <option value="gwangju">광주</option>
              <option value="daejeon">대전</option>
              <option value="ulsan">울산</option>
              <option value="sejong">세종</option>
              <option value="gyeonggi">경기도</option>
              <option value="gangwon">강원도</option>
              <option value="chungbuk">충청북도</option>
              <option value="chungnam">충청남도</option>
              <option value="jeonbuk">전라북도</option>
              <option value="jeonnam">전라남도</option>
              <option value="gyeongbuk">경상북도</option>
              <option value="gyeongnam">경상남도</option>
              <option value="jeju">제주도</option>
            </select>
          </div>
          <div class="form-group">
            <label>사진 설명</label>
            <textarea 
              v-model="photoInfo.description" 
              placeholder="이 관광지에 대한 설명을 입력하세요..."
              rows="4"
            ></textarea>
          </div>
          <button 
            @click="uploadSinglePhoto" 
            :disabled="!canUploadSingle || loading"
            class="upload-btn"
          >
            <i class="fas fa-upload"></i>
            사진 업로드
          </button>
        </div>
      </div>
    </div>

    <!-- 다중 업로드 -->
    <div v-if="activeTab === 'multiple'" class="multiple-upload">
      <div class="upload-container">
        <div class="multiple-upload-area" @drop="handleMultipleFileDrop" @dragover.prevent>
          <input 
            ref="multipleFileInput" 
            type="file" 
            accept="image/*" 
            multiple 
            @change="handleMultipleFileSelect"
            style="display: none"
          />
          <div class="upload-content" @click="$refs.multipleFileInput.click()">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>여러 사진을 드래그하거나 클릭하여 업로드</p>
            <span class="file-types">지원 형식: JPG, PNG, WebP</span>
          </div>
        </div>

        <div v-if="multipleFiles.length > 0" class="multiple-files-section">
          <h3>업로드할 사진들 ({{ multipleFiles.length }}개)</h3>
          <div class="files-grid">
            <div 
              v-for="(file, index) in multipleFiles" 
              :key="index"
              class="file-card"
            >
              <div class="file-image">
                <img :src="file.preview" alt="Preview" />
                <button @click="removeMultipleFile(index)" class="remove-file">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="file-info">
                <input 
                  v-model="file.name" 
                  type="text" 
                  placeholder="관광지명"
                  class="file-name-input"
                />
                <select v-model="file.region" class="file-region-select">
                  <option value="">지역 선택</option>
                  <option value="seoul">서울</option>
                  <option value="busan">부산</option>
                  <!-- 다른 지역들... -->
                </select>
                <textarea 
                  v-model="file.description" 
                  placeholder="설명"
                  rows="2"
                  class="file-description-input"
                ></textarea>
              </div>
            </div>
          </div>
          <button 
            @click="uploadMultiplePhotos" 
            :disabled="!canUploadMultiple || loading"
            class="upload-all-btn"
          >
            <i class="fas fa-upload"></i>
            모든 사진 업로드
          </button>
        </div>
      </div>
    </div>

    <!-- 사진 목록 -->
    <div v-if="activeTab === 'list'" class="list-section">
      <div class="list-controls">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="사진명 또는 지역으로 검색..."
          class="search-input"
        />
        <select v-model="filterRegion" class="filter-select">
          <option value="">모든 지역</option>
          <option value="seoul">서울</option>
          <option value="busan">부산</option>
          <!-- 다른 지역들... -->
        </select>
      </div>

      <div class="photos-grid">
        <div 
          v-for="photo in filteredPhotos" 
          :key="photo.id"
          class="photo-card"
        >
          <div class="photo-image">
            <img :src="photo.imageUrl" :alt="photo.name" />
            <div class="photo-overlay">
              <button @click="editPhoto(photo)" class="edit-btn">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deletePhoto(photo.id)" class="delete-btn">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="photo-details">
            <h4>{{ photo.name }}</h4>
            <span class="region-badge">{{ getRegionLabel(photo.region) }}</span>
            <p>{{ photo.description }}</p>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>업로드 중...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import apiClient from '@/core/api/apiClient.js'

const activeTab = ref('single')
const loading = ref(false)

// 단일 업로드 관련
const selectedImage = ref(null)
const photoInfo = reactive({
  name: '',
  region: '',
  description: ''
})

// 다중 업로드 관련
const multipleFiles = ref([])

// 사진 목록 관련
const photos = ref([])
const searchQuery = ref('')
const filterRegion = ref('')
const currentPage = ref(1)
const itemsPerPage = 12

// 단일 업로드 가능 여부
const canUploadSingle = computed(() => {
  return selectedImage.value && 
         photoInfo.name && 
         photoInfo.region
})

// 다중 업로드 가능 여부
const canUploadMultiple = computed(() => {
  return multipleFiles.value.length > 0 && 
         multipleFiles.value.every(file => file.name && file.region)
})

// 필터링된 사진 목록
const filteredPhotos = computed(() => {
  let filtered = photos.value

  if (searchQuery.value) {
    filtered = filtered.filter(photo => 
      photo.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (filterRegion.value) {
    filtered = filtered.filter(photo => photo.region === filterRegion.value)
  }

  const start = (currentPage.value - 1) * itemsPerPage
  return filtered.slice(start, start + itemsPerPage)
})

// 총 페이지 수
const totalPages = computed(() => {
  const total = photos.value.length
  return Math.ceil(total / itemsPerPage)
})

// 단일 파일 선택
const handleSingleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedImage.value = {
      file: file,
      preview: URL.createObjectURL(file)
    }
  }
}

// 다중 파일 선택
const handleMultipleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  addMultipleFiles(files)
}

// 다중 파일 드롭
const handleMultipleFileDrop = (e) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer.files)
  addMultipleFiles(files)
}

// 다중 파일 추가
const addMultipleFiles = (files) => {
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      multipleFiles.value.push({
        file: file,
        preview: URL.createObjectURL(file),
        name: '',
        region: '',
        description: ''
      })
    }
  })
}

// 다중 파일 제거
const removeMultipleFile = (index) => {
  URL.revokeObjectURL(multipleFiles.value[index].preview)
  multipleFiles.value.splice(index, 1)
}

// 단일 사진 업로드
const uploadSinglePhoto = async () => {
  try {
    loading.value = true
    
    const formData = new FormData()
    formData.append('image', selectedImage.value.file)
    formData.append('name', photoInfo.name)
    formData.append('region', photoInfo.region)
    formData.append('description', photoInfo.description)
    
    const response = await apiClient.post('/admin/photo/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (response.data.isSuccess) {
      console.log('사진이 성공적으로 업로드되었습니다.')
      resetSingleForm()
      loadPhotos()
    }
  } catch (error) {
    console.error('사진 업로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// 다중 사진 업로드
const uploadMultiplePhotos = async () => {
  try {
    loading.value = true
    
    const formData = new FormData()
    
    multipleFiles.value.forEach((fileData, index) => {
      formData.append(`images[${index}]`, fileData.file)
      formData.append(`names[${index}]`, fileData.name)
      formData.append(`regions[${index}]`, fileData.region)
      formData.append(`descriptions[${index}]`, fileData.description)
    })
    
    const response = await apiClient.post('/admin/photo/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (response.data.isSuccess) {
      console.log('모든 사진이 성공적으로 업로드되었습니다.')
      resetMultipleForm()
      loadPhotos()
    }
  } catch (error) {
    console.error('다중 사진 업로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// 단일 폼 초기화
const resetSingleForm = () => {
  if (selectedImage.value) {
    URL.revokeObjectURL(selectedImage.value.preview)
  }
  selectedImage.value = null
  Object.assign(photoInfo, {
    name: '',
    region: '',
    description: ''
  })
}

// 다중 폼 초기화
const resetMultipleForm = () => {
  multipleFiles.value.forEach(file => {
    URL.revokeObjectURL(file.preview)
  })
  multipleFiles.value = []
}

// 사진 목록 로드
const loadPhotos = async () => {
  try {
    const response = await apiClient.get('/admin/photo/list')
    
    if (response.data.isSuccess) {
      photos.value = response.data.result
    }
  } catch (error) {
    console.error('사진 목록 로드 실패:', error)
  }
}

// 사진 수정
const editPhoto = (photo) => {
  // 수정 모달 또는 폼 열기
  console.log('사진 수정:', photo)
}

// 사진 삭제
const deletePhoto = async (id) => {
  if (!confirm('정말로 이 사진을 삭제하시겠습니까?')) return

  try {
    loading.value = true
    
    const response = await apiClient.delete(`/admin/photo/${id}`)
    
    if (response.data.isSuccess) {
      console.log('사진이 삭제되었습니다.')
      loadPhotos()
    }
  } catch (error) {
    console.error('사진 삭제 실패:', error)
  } finally {
    loading.value = false
  }
}

// 지역 라벨 가져오기
const getRegionLabel = (region) => {
  const labels = {
    seoul: '서울',
    busan: '부산',
    incheon: '인천',
    // 다른 지역들...
  }
  return labels[region] || region
}

onMounted(() => {
  loadPhotos()
})
</script>

<style scoped>
/* 기본 스타일은 RoadviewManager와 유사하게 구성 */
.photo-manager {
  position: relative;
}

.header-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #6b7280;
  font-size: 0.95rem;
}

.tab-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6b7280;
}

.tab-btn:hover {
  color: #4f46e5;
}

.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.upload-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.upload-area:hover {
  border-color: #4f46e5;
  background-color: #f8fafc;
}

.upload-placeholder {
  text-align: center;
  color: #6b7280;
}

.upload-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.remove-image {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.upload-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
}

.upload-btn:hover:not(:disabled) {
  background: #059669;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.multiple-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 2rem;
}

.multiple-upload-area:hover {
  border-color: #4f46e5;
  background-color: #f8fafc;
}

.upload-content i {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.upload-content p {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.file-types {
  color: #6b7280;
  font-size: 0.9rem;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.file-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.file-image {
  position: relative;
  height: 200px;
}

.file-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-file {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.file-info {
  padding: 1rem;
}

.file-name-input,
.file-region-select,
.file-description-input {
  width: 100%;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.upload-all-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  width: 100%;
}

.upload-all-btn:hover:not(:disabled) {
  background: #4338ca;
}

.list-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-input {
  flex: 1;
}

.filter-select {
  min-width: 150px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.photo-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.photo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.photo-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.photo-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-card:hover .photo-overlay {
  opacity: 1;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
}

.edit-btn {
  background: #3b82f6;
}

.edit-btn:hover {
  background: #2563eb;
}

.delete-btn {
  background: #ef4444;
}

.delete-btn:hover {
  background: #dc2626;
}

.photo-details {
  padding: 1rem;
}

.photo-details h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.region-badge {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.photo-details p {
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.page-btn {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 500;
  color: #374151;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.loading-spinner i {
  font-size: 2rem;
}

@media (max-width: 768px) {
  .upload-container {
    grid-template-columns: 1fr;
  }
  
  .list-controls {
    flex-direction: column;
  }
  
  .files-grid,
  .photos-grid {
    grid-template-columns: 1fr;
  }
}
</style> 