<template>
  <div class="theme-manager">
    <div class="header-section">
      <h2 class="section-title">🎨 테마 모드 관리</h2>
      <p class="section-description">테마를 추가, 수정, 삭제하고 테마별 좌표를 관리할 수 있습니다.</p>
    </div>

    <!-- 테마 목록 및 관리 인터페이스 -->
    <div class="theme-grid">
      <div 
        v-for="theme in themes" 
        :key="theme.id"
        class="theme-card"
        :class="{ 'disabled': !theme.isActive }"
      >
        <div class="theme-image">
          <img :src="theme.bannerImage" :alt="theme.name" />
          <div class="theme-overlay">
            <button @click="editTheme(theme)" class="edit-btn">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="toggleTheme(theme)" class="toggle-btn" :class="{ active: theme.isActive }">
              <i class="fas" :class="theme.isActive ? 'fa-eye' : 'fa-eye-slash'"></i>
            </button>
            <button @click="deleteTheme(theme.id)" class="delete-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="theme-info">
          <h3>{{ theme.name }}</h3>
          <p>{{ theme.description }}</p>
          <div class="theme-stats">
            <span class="stat">좌표 {{ theme.locationCount }}개</span>
            <span class="stat">플레이 {{ theme.playCount }}회</span>
          </div>
        </div>
      </div>

      <!-- 새 테마 추가 카드 -->
      <div class="add-theme-card" @click="showAddModal = true">
        <div class="add-content">
          <i class="fas fa-plus"></i>
          <p>새 테마 추가</p>
        </div>
      </div>
    </div>

    <!-- 테마 추가/수정 모달 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTheme ? '테마 수정' : '새 테마 추가' }}</h3>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-section">
            <h4>기본 정보</h4>
            <div class="form-group">
              <label>테마 이름</label>
              <input v-model="themeForm.name" type="text" placeholder="예: K-POP 뮤직비디오" />
            </div>
            <div class="form-group">
              <label>테마 설명</label>
              <textarea v-model="themeForm.description" placeholder="테마에 대한 설명을 입력하세요..." rows="3"></textarea>
            </div>
          </div>

          <div class="form-section">
            <h4>배너 이미지</h4>
            <div class="banner-upload">
              <input ref="bannerInput" type="file" accept="image/*" @change="handleBannerUpload" style="display: none" />
              <div v-if="!themeForm.bannerPreview" class="upload-placeholder" @click="$refs.bannerInput.click()">
                <i class="fas fa-image"></i>
                <p>배너 이미지 업로드</p>
              </div>
              <div v-else class="banner-preview">
                <img :src="themeForm.bannerPreview" alt="Banner preview" />
                <button @click="removeBanner" class="remove-banner">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>테마 좌표</h4>
            <div class="coordinates-section">
              <div class="coord-input-row">
                <input v-model="newCoord.lat" type="number" step="any" placeholder="위도" />
                <input v-model="newCoord.lng" type="number" step="any" placeholder="경도" />
                <input v-model="newCoord.name" type="text" placeholder="장소명" />
                <button @click="addCoordinate" :disabled="!canAddCoord" class="add-coord-btn">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              
              <div class="coordinates-list">
                <div 
                  v-for="(coord, index) in themeForm.coordinates" 
                  :key="index"
                  class="coord-item"
                >
                  <span class="coord-name">{{ coord.name }}</span>
                  <span class="coord-pos">{{ coord.lat }}, {{ coord.lng }}</span>
                  <button @click="removeCoordinate(index)" class="remove-coord">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="cancel-btn">취소</button>
          <button @click="saveTheme" :disabled="!canSaveTheme || loading" class="save-btn">
            {{ editingTheme ? '수정' : '추가' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>처리 중...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import apiClient from '@/core/api/apiClient.js'

const loading = ref(false)
const showAddModal = ref(false)
const editingTheme = ref(null)

// 테마 목록
const themes = ref([
  {
    id: 1,
    name: 'K-POP 뮤직비디오',
    description: 'K-POP 뮤직비디오 촬영지를 찾아보세요',
    bannerImage: '/images/theme/k-pop-music-video-theme.jpg',
    isActive: true,
    locationCount: 15,
    playCount: 234
  },
  {
    id: 2,
    name: '인스타그램 핫플레이스',
    description: '인스타그램에서 인기 있는 핫플레이스들',
    bannerImage: '/images/theme/instgram-hot-place-theme.png',
    isActive: true,
    locationCount: 28,
    playCount: 456
  }
])

// 테마 폼 데이터
const themeForm = reactive({
  name: '',
  description: '',
  bannerFile: null,
  bannerPreview: '',
  coordinates: []
})

// 새 좌표 입력
const newCoord = reactive({
  lat: '',
  lng: '',
  name: ''
})

// 좌표 추가 가능 여부
const canAddCoord = computed(() => {
  return newCoord.lat && newCoord.lng && newCoord.name
})

// 테마 저장 가능 여부
const canSaveTheme = computed(() => {
  return themeForm.name && themeForm.description && themeForm.coordinates.length > 0
})

// 배너 업로드 처리
const handleBannerUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    themeForm.bannerFile = file
    themeForm.bannerPreview = URL.createObjectURL(file)
  }
}

// 배너 제거
const removeBanner = () => {
  if (themeForm.bannerPreview) {
    URL.revokeObjectURL(themeForm.bannerPreview)
  }
  themeForm.bannerFile = null
  themeForm.bannerPreview = ''
}

// 좌표 추가
const addCoordinate = () => {
  if (!canAddCoord.value) return
  
  themeForm.coordinates.push({
    lat: parseFloat(newCoord.lat),
    lng: parseFloat(newCoord.lng),
    name: newCoord.name
  })
  
  // 입력 초기화
  Object.assign(newCoord, {
    lat: '',
    lng: '',
    name: ''
  })
}

// 좌표 제거
const removeCoordinate = (index) => {
  themeForm.coordinates.splice(index, 1)
}

// 테마 수정
const editTheme = (theme) => {
  editingTheme.value = theme
  Object.assign(themeForm, {
    name: theme.name,
    description: theme.description,
    bannerPreview: theme.bannerImage,
    coordinates: [...theme.coordinates || []]
  })
  showAddModal.value = true
}

// 테마 토글
const toggleTheme = async (theme) => {
  try {
    loading.value = true
    
    const response = await apiClient.post(`/admin/themes/${theme.id}/toggle`, {
      isActive: !theme.isActive
    })
    
    if (response.data.isSuccess) {
      theme.isActive = !theme.isActive
      console.log(`테마 "${theme.name}"이(가) ${theme.isActive ? '활성화' : '비활성화'}되었습니다.`)
    }
  } catch (error) {
    console.error('테마 토글 실패:', error)
  } finally {
    loading.value = false
  }
}

// 테마 삭제
const deleteTheme = async (id) => {
  if (!confirm('정말로 이 테마를 삭제하시겠습니까?')) return

  try {
    loading.value = true
    
    const response = await apiClient.delete(`/admin/themes/${id}`)
    
    if (response.data.isSuccess) {
      const index = themes.value.findIndex(t => t.id === id)
      if (index !== -1) {
        themes.value.splice(index, 1)
      }
      console.log('테마가 삭제되었습니다.')
    }
  } catch (error) {
    console.error('테마 삭제 실패:', error)
  } finally {
    loading.value = false
  }
}

// 테마 저장
const saveTheme = async () => {
  try {
    loading.value = true
    
    const formData = new FormData()
    formData.append('name', themeForm.name)
    formData.append('description', themeForm.description)
    formData.append('coordinates', JSON.stringify(themeForm.coordinates))
    
    if (themeForm.bannerFile) {
      formData.append('bannerImage', themeForm.bannerFile)
    }
    
    let response
    if (editingTheme.value) {
      response = await apiClient.put(`/admin/themes/${editingTheme.value.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      response = await apiClient.post('/admin/themes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    
    if (response.data.isSuccess) {
      console.log(`테마가 성공적으로 ${editingTheme.value ? '수정' : '추가'}되었습니다.`)
      closeModal()
      loadThemes()
    }
  } catch (error) {
    console.error('테마 저장 실패:', error)
  } finally {
    loading.value = false
  }
}

// 모달 닫기
const closeModal = () => {
  showAddModal.value = false
  editingTheme.value = null
  resetForm()
}

// 폼 초기화
const resetForm = () => {
  Object.assign(themeForm, {
    name: '',
    description: '',
    bannerFile: null,
    bannerPreview: '',
    coordinates: []
  })
  Object.assign(newCoord, {
    lat: '',
    lng: '',
    name: ''
  })
}

// 테마 목록 로드
const loadThemes = async () => {
  try {
    const response = await apiClient.get('/admin/themes')
    
    if (response.data.isSuccess) {
      themes.value = response.data.result
    }
  } catch (error) {
    console.error('테마 목록 로드 실패:', error)
  }
}

onMounted(() => {
  loadThemes()
})
</script>

<style scoped>
.theme-manager {
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

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.theme-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.theme-card.disabled {
  opacity: 0.6;
}

.theme-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.theme-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.theme-overlay {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.theme-card:hover .theme-overlay {
  opacity: 1;
}

.edit-btn,
.toggle-btn,
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

.toggle-btn {
  background: #6b7280;
}

.toggle-btn.active {
  background: #10b981;
}

.delete-btn {
  background: #ef4444;
}

.theme-info {
  padding: 1rem;
}

.theme-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.theme-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.theme-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #374151;
}

.add-theme-card {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 300px;
}

.add-theme-card:hover {
  border-color: #4f46e5;
  background-color: #f8fafc;
}

.add-content {
  text-align: center;
  color: #6b7280;
}

.add-content i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #6b7280;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
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
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.banner-upload {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.banner-upload:hover {
  border-color: #4f46e5;
  background-color: #f8fafc;
}

.upload-placeholder {
  text-align: center;
  color: #6b7280;
}

.upload-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.banner-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.banner-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.remove-banner {
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

.coord-input-row {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr auto;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.add-coord-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem;
  cursor: pointer;
}

.add-coord-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.coordinates-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.coord-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.coord-item:last-child {
  border-bottom: none;
}

.coord-name {
  font-weight: 500;
  color: #1f2937;
  flex: 1;
}

.coord-pos {
  color: #6b7280;
  font-size: 0.9rem;
  flex: 1;
}

.remove-coord {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.8rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #6b7280;
  color: white;
}

.save-btn {
  background: #4f46e5;
  color: white;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

@media (max-width: 768px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
  
  .coord-input-row {
    grid-template-columns: 1fr;
  }
}
</style> 