<template>
  <div class="banner-manager">
    <div class="header-section">
      <h2 class="section-title">🖼️ 메인 배너 관리</h2>
      <p class="section-description">메인 페이지에 표시될 배너를 추가, 수정, 삭제할 수 있습니다.</p>
    </div>

    <!-- 배너 추가 버튼 -->
    <div class="add-banner-section">
      <button @click="showAddModal = true" class="add-banner-btn">
        <i class="fas fa-plus"></i>
        새 배너 추가
      </button>
    </div>

    <!-- 배너 목록 -->
    <div class="banners-grid">
      <div 
        v-for="banner in banners" 
        :key="banner.id"
        class="banner-card"
        :class="{ 'inactive': !banner.isActive }"
      >
        <div class="banner-image">
          <img :src="banner.imageUrl" :alt="banner.title" />
          <div class="banner-overlay">
            <button @click="editBanner(banner)" class="edit-btn">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="toggleBanner(banner)" class="toggle-btn" :class="{ active: banner.isActive }">
              <i class="fas" :class="banner.isActive ? 'fa-eye' : 'fa-eye-slash'"></i>
            </button>
            <button @click="deleteBanner(banner.id)" class="delete-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="banner-info">
          <h3>{{ banner.title }}</h3>
          <p>{{ banner.description }}</p>
          <div class="banner-details">
            <span class="detail-item">
              <i class="fas fa-link"></i>
              {{ banner.linkUrl || '링크 없음' }}
            </span>
            <span class="detail-item">
              <i class="fas fa-eye"></i>
              {{ banner.viewCount }} 조회
            </span>
            <span class="detail-item">
              <i class="fas fa-mouse-pointer"></i>
              {{ banner.clickCount }} 클릭
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 배너 추가/수정 모달 -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingBanner ? '배너 수정' : '새 배너 추가' }}</h3>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <!-- 배너 이미지 업로드 -->
          <div class="form-section">
            <h4>배너 이미지</h4>
            <div class="image-upload-area">
              <input ref="imageInput" type="file" accept="image/*" @change="handleImageUpload" style="display: none" />
              <div v-if="!bannerForm.imagePreview" class="upload-placeholder" @click="$refs.imageInput.click()">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>배너 이미지를 업로드하세요</p>
                <span class="recommended-size">권장 크기: 1200x400px</span>
              </div>
              <div v-else class="image-preview">
                <img :src="bannerForm.imagePreview" alt="Preview" />
                <button @click="removeImage" class="remove-image">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- 배너 정보 -->
          <div class="form-section">
            <h4>배너 정보</h4>
            <div class="form-group">
              <label>배너 제목</label>
              <input v-model="bannerForm.title" type="text" placeholder="배너 제목을 입력하세요" />
            </div>
            <div class="form-group">
              <label>배너 설명</label>
              <textarea v-model="bannerForm.description" placeholder="배너에 대한 간단한 설명을 입력하세요" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>링크 URL (선택사항)</label>
              <input v-model="bannerForm.linkUrl" type="url" placeholder="https://example.com" />
            </div>
            <div class="form-group">
              <label>새 탭에서 열기</label>
              <label class="checkbox-label">
                <input v-model="bannerForm.openInNewTab" type="checkbox" />
                <span class="checkmark"></span>
                링크를 새 탭에서 열기
              </label>
            </div>
          </div>

          <!-- 미리보기 -->
          <div v-if="bannerForm.imagePreview" class="form-section">
            <h4>미리보기</h4>
            <div class="banner-preview">
              <div class="preview-banner" @click="previewClick">
                <img :src="bannerForm.imagePreview" :alt="bannerForm.title" />
                <div class="preview-content">
                  <h3>{{ bannerForm.title || '배너 제목' }}</h3>
                  <p>{{ bannerForm.description || '배너 설명' }}</p>
                </div>
              </div>
              <p class="preview-note">
                <i class="fas fa-info-circle"></i>
                실제 메인 페이지에서는 이와 같이 표시됩니다.
              </p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="cancel-btn">취소</button>
          <button @click="saveBanner" :disabled="!canSaveBanner || loading" class="save-btn">
            {{ editingBanner ? '수정' : '추가' }}
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
const editingBanner = ref(null)

// 배너 목록
const banners = ref([
  {
    id: 1,
    title: '겨울 특별 이벤트',
    description: '겨울 시즌 한정 특별 이벤트가 진행 중입니다!',
    imageUrl: '/images/banner/Seoul-Dongdaemun-Gate.jpg',
    linkUrl: '/event/winter-2024',
    openInNewTab: false,
    isActive: true,
    viewCount: 1247,
    clickCount: 89,
    createdAt: '2024-12-01'
  },
  {
    id: 2,
    title: '새로운 게임 모드 출시',
    description: '테마 모드가 새롭게 추가되었습니다. 지금 바로 체험해보세요!',
    imageUrl: '/images/banner/Seoul-temp1.jpg',
    linkUrl: '/game/theme',
    openInNewTab: false,
    isActive: true,
    viewCount: 892,
    clickCount: 156,
    createdAt: '2024-11-25'
  }
])

// 배너 폼 데이터
const bannerForm = reactive({
  title: '',
  description: '',
  linkUrl: '',
  openInNewTab: false,
  imageFile: null,
  imagePreview: ''
})

// 배너 저장 가능 여부
const canSaveBanner = computed(() => {
  return bannerForm.title && bannerForm.description && bannerForm.imagePreview
})

// 이미지 업로드 처리
const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    bannerForm.imageFile = file
    bannerForm.imagePreview = URL.createObjectURL(file)
  }
}

// 이미지 제거
const removeImage = () => {
  if (bannerForm.imagePreview && bannerForm.imagePreview.startsWith('blob:')) {
    URL.revokeObjectURL(bannerForm.imagePreview)
  }
  bannerForm.imageFile = null
  bannerForm.imagePreview = ''
}

// 미리보기 클릭
const previewClick = () => {
  if (bannerForm.linkUrl) {
    const url = bannerForm.linkUrl.startsWith('http') ? bannerForm.linkUrl : `https://${bannerForm.linkUrl}`
    if (bannerForm.openInNewTab) {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
  }
}

// 배너 수정
const editBanner = (banner) => {
  editingBanner.value = banner
  Object.assign(bannerForm, {
    title: banner.title,
    description: banner.description,
    linkUrl: banner.linkUrl || '',
    openInNewTab: banner.openInNewTab,
    imagePreview: banner.imageUrl
  })
  showAddModal.value = true
}

// 배너 토글
const toggleBanner = async (banner) => {
  try {
    loading.value = true
    
    const response = await apiClient.post(`/admin/banners/${banner.id}/toggle`, {
      isActive: !banner.isActive
    })
    
    if (response.data.isSuccess) {
      banner.isActive = !banner.isActive
      console.log(`배너 "${banner.title}"이(가) ${banner.isActive ? '활성화' : '비활성화'}되었습니다.`)
    }
  } catch (error) {
    console.error('배너 토글 실패:', error)
  } finally {
    loading.value = false
  }
}

// 배너 삭제
const deleteBanner = async (id) => {
  if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) return

  try {
    loading.value = true
    
    const response = await apiClient.delete(`/admin/banners/${id}`)
    
    if (response.data.isSuccess) {
      const index = banners.value.findIndex(b => b.id === id)
      if (index !== -1) {
        banners.value.splice(index, 1)
      }
      console.log('배너가 삭제되었습니다.')
    }
  } catch (error) {
    console.error('배너 삭제 실패:', error)
  } finally {
    loading.value = false
  }
}

// 배너 저장
const saveBanner = async () => {
  try {
    loading.value = true
    
    const formData = new FormData()
    formData.append('title', bannerForm.title)
    formData.append('description', bannerForm.description)
    formData.append('linkUrl', bannerForm.linkUrl)
    formData.append('openInNewTab', bannerForm.openInNewTab)
    
    if (bannerForm.imageFile) {
      formData.append('image', bannerForm.imageFile)
    }
    
    let response
    if (editingBanner.value) {
      response = await apiClient.put(`/admin/banners/${editingBanner.value.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      response = await apiClient.post('/admin/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    
    if (response.data.isSuccess) {
      console.log(`배너가 성공적으로 ${editingBanner.value ? '수정' : '추가'}되었습니다.`)
      closeModal()
      loadBanners()
    }
  } catch (error) {
    console.error('배너 저장 실패:', error)
  } finally {
    loading.value = false
  }
}

// 모달 닫기
const closeModal = () => {
  showAddModal.value = false
  editingBanner.value = null
  resetForm()
}

// 폼 초기화
const resetForm = () => {
  if (bannerForm.imagePreview && bannerForm.imagePreview.startsWith('blob:')) {
    URL.revokeObjectURL(bannerForm.imagePreview)
  }
  Object.assign(bannerForm, {
    title: '',
    description: '',
    linkUrl: '',
    openInNewTab: false,
    imageFile: null,
    imagePreview: ''
  })
}

// 배너 목록 로드
const loadBanners = async () => {
  try {
    const response = await apiClient.get('/admin/banners')
    
    if (response.data.isSuccess) {
      banners.value = response.data.result
    }
  } catch (error) {
    console.error('배너 목록 로드 실패:', error)
  }
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-manager {
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

.add-banner-section {
  margin-bottom: 2rem;
}

.add-banner-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.add-banner-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.banners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

.banner-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.banner-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.banner-card.inactive {
  opacity: 0.6;
}

.banner-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.banner-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.banner-card:hover .banner-overlay {
  opacity: 1;
}

.edit-btn,
.toggle-btn,
.delete-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.edit-btn {
  background: rgba(59, 130, 246, 0.9);
}

.edit-btn:hover {
  background: #3b82f6;
}

.toggle-btn {
  background: rgba(107, 114, 128, 0.9);
}

.toggle-btn.active {
  background: rgba(16, 185, 129, 0.9);
}

.toggle-btn:hover {
  background: #6b7280;
}

.toggle-btn.active:hover {
  background: #10b981;
}

.delete-btn {
  background: rgba(239, 68, 68, 0.9);
}

.delete-btn:hover {
  background: #ef4444;
}

.banner-info {
  padding: 1.5rem;
}

.banner-info h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.banner-info p {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.banner-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.detail-item i {
  width: 1rem;
  color: #9ca3af;
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
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.image-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.image-upload-area:hover {
  border-color: #667eea;
  background-color: #f8fafc;
}

.upload-placeholder {
  text-align: center;
  color: #6b7280;
}

.upload-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.upload-placeholder p {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.recommended-size {
  font-size: 0.85rem;
  color: #9ca3af;
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
  border-radius: 10px;
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
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.banner-preview {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
}

.preview-banner {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.preview-banner:hover {
  transform: scale(1.02);
}

.preview-banner img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.preview-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 1.5rem 1rem 1rem;
}

.preview-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.preview-content p {
  font-size: 0.9rem;
  opacity: 0.9;
}

.preview-note {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 2rem;
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

.cancel-btn:hover {
  background: #4b5563;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  border-radius: 16px;
  z-index: 10;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #6b7280;
}

.loading-spinner i {
  font-size: 2rem;
}

@media (max-width: 768px) {
  .banners-grid {
    grid-template-columns: 1fr;
  }
  
  .banner-details {
    gap: 0.25rem;
  }
  
  .detail-item {
    font-size: 0.8rem;
  }
  
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1.5rem;
  }
}
</style> 