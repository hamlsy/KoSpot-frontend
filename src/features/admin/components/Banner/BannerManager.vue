<template>
  <div class="banner-manager">
    <!-- 헤더 섹션 -->
    <div class="header-section">
      <div class="header-content">
        <div class="header-text">
          <h2 class="section-title">
            <i class="fas fa-images"></i>
            메인 배너 관리
          </h2>
          <p class="section-description">메인 페이지에 표시될 배너를 추가, 수정, 삭제할 수 있습니다.</p>
        </div>
        <button @click="showAddModal = true" class="add-banner-btn">
          <i class="fas fa-plus"></i>
          새 배너 추가
        </button>
      </div>
      
      <!-- 통계 카드 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon total">
            <i class="fas fa-layer-group"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ banners.length }}</span>
            <span class="stat-label">전체 배너</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <i class="fas fa-eye"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ activeBannerCount }}</span>
            <span class="stat-label">활성 배너</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon inactive">
            <i class="fas fa-eye-slash"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ inactiveBannerCount }}</span>
            <span class="stat-label">비활성 배너</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 배너 목록 -->
    <!-- 로딩 상태 -->
    <div v-if="bannersLoading" class="banners-loading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>배너 목록을 불러오는 중...</span>
      </div>
    </div>
    
    <!-- 에러 상태 -->
    <div v-else-if="bannersError" class="banners-error">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ bannersError }}</p>
        <button @click="loadBanners" class="retry-btn">다시 시도</button>
      </div>
    </div>
    
    <!-- 빈 상태 -->
    <div v-else-if="banners.length === 0" class="banners-empty">
      <div class="empty-message">
        <i class="fas fa-image"></i>
        <p>등록된 배너가 없습니다.</p>
        <p class="empty-hint">새 배너를 추가해보세요.</p>
      </div>
    </div>
    
    <!-- 배너 목록 -->
    <div v-else class="banners-grid">
      <div 
        v-for="banner in sortedBanners" 
        :key="banner.id"
        class="banner-card"
        :class="{ 'inactive': !banner.isActive }"
      >
        <!-- 상태 배지 -->
        <div class="banner-status-badge" :class="{ active: banner.isActive, inactive: !banner.isActive }">
          <i class="fas" :class="banner.isActive ? 'fa-check-circle' : 'fa-pause-circle'"></i>
          {{ banner.isActive ? '활성' : '비활성' }}
        </div>
        
        <!-- 순서 배지 -->
        <div class="banner-order-badge">
          #{{ banner.displayOrder }}
        </div>
        
        <div class="banner-image">
          <img :src="banner.imageUrl" :alt="banner.title" @error="handleImageError" />
          <div class="banner-overlay">
            <button 
              @click="editBanner(banner)" 
              class="edit-btn" 
              title="배너 수정"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button 
              @click="toggleBanner(banner)" 
              class="toggle-btn" 
              :class="{ active: banner.isActive }"
              :title="banner.isActive ? '비활성화' : '활성화'"
            >
              <i class="fas" :class="banner.isActive ? 'fa-eye' : 'fa-eye-slash'"></i>
            </button>
            <button 
              @click="deleteBanner(banner.id)" 
              class="delete-btn"
              title="배너 삭제"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="banner-info">
          <h3>{{ banner.title }}</h3>
          <p class="banner-description">{{ banner.description || '설명 없음' }}</p>
          
          <div class="banner-meta">
            <div class="meta-item" v-if="banner.linkUrl">
              <i class="fas fa-external-link-alt"></i>
              <a :href="banner.linkUrl" target="_blank" rel="noopener" class="link-url">
                {{ truncateUrl(banner.linkUrl) }}
              </a>
            </div>
            <div class="meta-item" v-else>
              <i class="fas fa-link"></i>
              <span class="no-link">링크 없음</span>
            </div>
          </div>
          
          <div class="banner-dates">
            <span class="date-item" v-if="banner.createdAt">
              <i class="fas fa-calendar-plus"></i>
              생성: {{ formatDate(banner.createdAt) }}
            </span>
            <span class="date-item" v-if="banner.updatedAt">
              <i class="fas fa-calendar-check"></i>
              수정: {{ formatDate(banner.updatedAt) }}
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
            <div 
              class="image-upload-area"
              :class="{ 'drag-over': isDragOver }"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleDrop"
              @click="!bannerForm.imagePreview && $refs.imageInput.click()"
            >
              <input ref="imageInput" type="file" accept="image/*" @change="handleImageUpload" style="display: none" />
              <div v-if="!bannerForm.imagePreview" class="upload-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>배너 이미지를 업로드하세요</p>
                <p class="drag-hint">또는 이미지를 여기에 끌어다 놓으세요</p>
                <span class="recommended-size">권장 크기: 1200x400px</span>
              </div>
              <div v-else class="image-preview">
                <img :src="bannerForm.imagePreview" alt="Preview" />
                <button @click.stop="removeImage" class="remove-image">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <!-- URL로 이미지 가져오기 -->
            <div class="url-upload-section">
              <label>또는 이미지 URL로 가져오기</label>
              <div class="url-input-group">
                <input 
                  v-model="imageUrlInput" 
                  type="url" 
                  placeholder="https://example.com/image.jpg" 
                  @keyup.enter="loadImageFromUrl"
                  @input="clearUrlError"
                />
                <button @click="loadImageFromUrl" class="url-load-btn" :disabled="!imageUrlInput.trim()">
                  <i class="fas fa-link"></i>
                  가져오기
                </button>
              </div>
              <p v-if="urlError" class="url-error">{{ urlError }}</p>
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
              <label>노출 순서 <span class="required">*</span></label>
              <input 
                v-model.number="bannerForm.displayOrder" 
                type="number" 
                min="0" 
                placeholder="0" 
              />
              <p class="input-hint">숫자가 작을수록 먼저 표시됩니다.</p>
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
import { bannerAdminService } from '@/features/admin/services/bannerAdmin.service.js'

const loading = ref(false)
const showAddModal = ref(false)
const editingBanner = ref(null)
const isDragOver = ref(false)
const imageUrlInput = ref('')
const urlError = ref('')

// 배너 목록
const banners = ref([])
const bannersLoading = ref(false)
const bannersError = ref(null)

// 배너 폼 데이터
const bannerForm = reactive({
  title: '',
  description: '',
  linkUrl: '',
  displayOrder: 0,
  imageFile: null,
  imagePreview: ''
})

// 배너 저장 가능 여부
const canSaveBanner = computed(() => {
  // 수정 모드: 제목만 필수 (이미지는 기존 것 유지 가능)
  if (editingBanner.value) {
    return bannerForm.title && bannerForm.displayOrder !== null
  }
  // 생성 모드: 제목, 이미지 필수
  return bannerForm.title && bannerForm.imagePreview && bannerForm.displayOrder !== null
})

// 활성 배너 수
const activeBannerCount = computed(() => {
  return banners.value.filter(b => b.isActive).length
})

// 비활성 배너 수
const inactiveBannerCount = computed(() => {
  return banners.value.filter(b => !b.isActive).length
})

// 순서별 정렬된 배너
const sortedBanners = computed(() => {
  return [...banners.value].sort((a, b) => a.displayOrder - b.displayOrder)
})

// URL 자르기
const truncateUrl = (url, maxLength = 40) => {
  if (!url) return ''
  if (url.length <= maxLength) return url
  return url.substring(0, maxLength) + '...'
}

// 날짜 포맷팅
const formatDate = (dateString) => {
  return bannerAdminService.formatDate(dateString)
}

// 이미지 로드 에러 처리
const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgNDAwIDIwMCI+PHJlY3QgZmlsbD0iI2YzZjRmNiIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiLz48dGV4dCBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7snbTrr7jsp4Ag66Gc65OcIOyLpO2MqDwvdGV4dD48L3N2Zz4='
}

// 이미지 업로드 처리
const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (file) {
    processImageFile(file)
  }
}

// 드래그 오버 처리
const handleDragOver = (e) => {
  isDragOver.value = true
  e.dataTransfer.dropEffect = 'copy'
}

// 드래그 떠남 처리
const handleDragLeave = () => {
  isDragOver.value = false
}

// 드롭 처리
const handleDrop = (e) => {
  isDragOver.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('image/')) {
      processImageFile(file)
    } else {
      alert('이미지 파일만 업로드 가능합니다.')
    }
  }
}

// 이미지 파일 처리
const processImageFile = (file) => {
  // 파일 크기 제한 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB 이하여야 합니다.')
    return
  }
  
  bannerForm.imageFile = file
  bannerForm.imagePreview = URL.createObjectURL(file)
  urlError.value = ''
  imageUrlInput.value = ''
}

// URL에서 이미지 가져오기
const loadImageFromUrl = async () => {
  const url = imageUrlInput.value.trim()
  if (!url) {
    urlError.value = 'URL을 입력해주세요.'
    return
  }
  
  try {
    urlError.value = ''
    loading.value = true
    
    // 이미지를 Canvas를 통해 Blob으로 변환
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })
              processImageFile(file)
              resolve()
            } else {
              reject(new Error('이미지 변환 실패'))
            }
          }, 'image/jpeg')
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => {
        // CORS 문제로 Canvas 사용이 불가능한 경우, URL을 직접 사용
        bannerForm.imagePreview = url
        bannerForm.imageFile = null
        urlError.value = ''
        resolve()
      }
      img.src = url
    })
    
  } catch (error) {
    console.error('이미지 로드 실패:', error)
    // 에러 발생 시에도 URL을 직접 사용
    bannerForm.imagePreview = url
    bannerForm.imageFile = null
    urlError.value = 'CORS 문제로 이미지를 직접 변환할 수 없습니다. URL을 직접 사용합니다.'
  } finally {
    loading.value = false
  }
}

// URL 에러 초기화
const clearUrlError = () => {
  urlError.value = ''
}

// 이미지 제거
const removeImage = () => {
  if (bannerForm.imagePreview && bannerForm.imagePreview.startsWith('blob:')) {
    URL.revokeObjectURL(bannerForm.imagePreview)
  }
  bannerForm.imageFile = null
  bannerForm.imagePreview = ''
  imageUrlInput.value = ''
  urlError.value = ''
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
    displayOrder: banner.displayOrder || 0,
    imagePreview: banner.imageUrl
  })
  showAddModal.value = true
}

// 배너 토글 (활성화/비활성화)
const toggleBanner = async (banner) => {
  try {
    loading.value = true
    
    if (banner.isActive) {
      await bannerAdminService.deactivateBanner(banner.id)
    } else {
      await bannerAdminService.activateBanner(banner.id)
    }
    
    banner.isActive = !banner.isActive
    console.log(`✅ 배너 "${banner.title}"이(가) ${banner.isActive ? '활성화' : '비활성화'}되었습니다.`)
  } catch (error) {
    console.error('❌ 배너 토글 실패:', error)
    alert('배너 상태 변경에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 배너 삭제
const deleteBanner = async (id) => {
  if (!confirm('정말로 이 배너를 삭제하시겠습니까?\n삭제된 배너는 복구할 수 없습니다.')) return
  
  try {
    loading.value = true
    
    await bannerAdminService.deleteBanner(id)
    
    const index = banners.value.findIndex(b => b.id === id)
    if (index !== -1) {
      banners.value.splice(index, 1)
    }
    console.log('✅ 배너가 삭제되었습니다.')
  } catch (error) {
    console.error('❌ 배너 삭제 실패:', error)
    alert('배너 삭제에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

// 배너 저장 (생성/수정)
const saveBanner = async () => {
  try {
    loading.value = true
    
    const formData = new FormData()
    formData.append('title', bannerForm.title)
    formData.append('description', bannerForm.description || '')
    formData.append('linkUrl', bannerForm.linkUrl || '')
    formData.append('displayOrder', bannerForm.displayOrder || 0)
    
    // 파일이 있으면 파일 사용
    if (bannerForm.imageFile) {
      formData.append('image', bannerForm.imageFile)
    }
    
    if (editingBanner.value) {
      // 수정 모드
      await bannerAdminService.updateBanner(editingBanner.value.id, formData)
      console.log('✅ 배너가 성공적으로 수정되었습니다.')
    } else {
      // 생성 모드 - 이미지 필수
      if (!bannerForm.imageFile) {
        alert('배너 이미지를 업로드해주세요.')
        loading.value = false
        return
      }
      await bannerAdminService.createBanner(formData)
      console.log('✅ 배너가 성공적으로 추가되었습니다.')
    }
    
    closeModal()
    await loadBanners()
  } catch (error) {
    console.error('❌ 배너 저장 실패:', error)
    alert(`배너 ${editingBanner.value ? '수정' : '추가'}에 실패했습니다.`)
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
    displayOrder: 0,
    imageFile: null,
    imagePreview: ''
  })
  imageUrlInput.value = ''
  urlError.value = ''
  isDragOver.value = false
}

// 배너 목록 로드
const loadBanners = async () => {
  try {
    bannersLoading.value = true
    bannersError.value = null
    banners.value = await bannerAdminService.getBanners()
  } catch (error) {
    console.error('배너 목록 로드 실패:', error)
    bannersError.value = '배너 목록을 불러오는데 실패했습니다.'
    banners.value = []
  } finally {
    bannersLoading.value = false
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

/* 헤더 섹션 */
.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-text {
  flex: 1;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title i {
  font-size: 1.5rem;
}

.section-description {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.add-banner-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.add-banner-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 통계 카드 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-icon.total {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.stat-icon.active {
  background: rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.stat-icon.inactive {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
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
  position: relative;
}

.banner-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.banner-card.inactive {
  border-color: #fecaca;
}

.banner-card.inactive .banner-image img {
  filter: grayscale(50%);
  opacity: 0.7;
}

/* 상태 배지 */
.banner-status-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  z-index: 10;
}

.banner-status-badge.active {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.banner-status-badge.inactive {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

/* 순서 배지 */
.banner-order-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.375rem 0.625rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 10;
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
  transition: all 0.3s ease;
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
  padding: 1.25rem;
}

.banner-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.banner-description {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

/* 배너 메타 정보 */
.banner-meta {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.meta-item i {
  color: #667eea;
  font-size: 0.8rem;
  width: 16px;
}

.link-url {
  color: #667eea;
  text-decoration: none;
  transition: color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-url:hover {
  color: #764ba2;
  text-decoration: underline;
}

.no-link {
  color: #9ca3af;
  font-style: italic;
}

/* 날짜 정보 */
.banner-dates {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #9ca3af;
}

.date-item i {
  color: #d1d5db;
  font-size: 0.75rem;
  width: 14px;
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

.image-upload-area.drag-over {
  border-color: #667eea;
  background-color: #eff6ff;
  border-style: solid;
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

.drag-hint {
  font-size: 0.9rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

.recommended-size {
  font-size: 0.85rem;
  color: #9ca3af;
}

.url-upload-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.url-upload-section label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.url-input-group {
  display: flex;
  gap: 0.5rem;
}

.url-input-group input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.url-input-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.url-load-btn {
  padding: 0.75rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.url-load-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.url-load-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.url-error {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #ef4444;
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

.form-group label .required {
  color: #ef4444;
  font-weight: 700;
}

.input-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.375rem;
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

/* 배너 목록 로딩/에러/빈 상태 스타일 */
.banners-loading,
.banners-error,
.banners-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 3rem;
}

.banners-loading .loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
}

.banners-loading .loading-spinner i {
  font-size: 2.5rem;
  color: #667eea;
}

.banners-error .error-message {
  text-align: center;
  color: #ef4444;
}

.banners-error .error-message i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ef4444;
}

.banners-error .error-message p {
  margin: 1rem 0;
  font-size: 1.1rem;
}

.banners-error .retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banners-error .retry-btn:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

.banners-empty .empty-message {
  text-align: center;
  color: #6b7280;
}

.banners-empty .empty-message i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.banners-empty .empty-message p {
  font-size: 1.2rem;
  margin: 0.5rem 0;
  color: #374151;
}

.banners-empty .empty-hint {
  font-size: 0.95rem;
  color: #9ca3af;
}

/* 비활성화된 버튼 스타일 */
.edit-btn:disabled,
.toggle-btn:disabled,
.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 반응형 스타일 */
@media (max-width: 992px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
}

@media (max-width: 768px) {
  .header-section {
    padding: 1.5rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .add-banner-btn {
    width: 100%;
    justify-content: center;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .banners-grid {
    grid-template-columns: 1fr;
  }
  
  .banner-dates {
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