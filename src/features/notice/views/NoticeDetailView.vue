<template>
  <div class="notice-detail-page">
    <NavigationBar 
      :is-logged-in="hasToken"
      :user-info="userProfile"
    />
    
    <main class="main-content">
      <div class="notice-container">
        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>공지사항을 불러오는 중...</p>
          </div>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="error" class="error-container">
          <div class="error-content">
            <div class="error-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h3>공지사항을 불러올 수 없습니다</h3>
            <p>{{ error }}</p>
            <button @click="loadNotice" class="retry-button">
              <i class="fas fa-redo"></i>
              다시 시도
            </button>
          </div>
        </div>

        <!-- 공지사항 상세 내용 -->
        <div v-else-if="notice" class="notice-detail">
          <!-- 상단 네비게이션 -->
          <div class="notice-navigation">
            <button @click="goBack" class="back-button">
              <i class="fas fa-arrow-left"></i>
              목록으로
            </button>
            
            <!-- 관리자 액션 버튼 -->
            <div v-if="isAdmin" class="admin-actions">
              <button @click="editNotice" class="edit-button">
                <i class="fas fa-edit"></i>
                수정
              </button>
              <button @click="showDeleteModal = true" class="delete-button">
                <i class="fas fa-trash"></i>
                삭제
              </button>
            </div>
          </div>

          <!-- 공지사항 헤더 -->
          <div class="notice-header">
            <div class="notice-meta">
              <span 
                class="notice-category"
                :class="notice.category?.toLowerCase()"
              >
                {{ notice.category }}
              </span>
              <span class="notice-date">
                {{ noticeService.formatDate(notice.createdDate) }}
              </span>
            </div>
            
            <h1 class="notice-title">{{ notice.title }}</h1>
          </div>

          <!-- 공지사항 내용 -->
          <div class="notice-content">
            <div class="content-body" v-html="formattedContent"></div>
            
            <!-- 이미지가 있는 경우 -->
            <div v-if="notice.images && notice.images.length > 0" class="notice-images">
              <div
                v-for="(image, index) in notice.images"
                :key="index"
                class="image-container"
              >
                <img
                  :src="image"
                  :alt="`공지사항 이미지 ${index + 1}`"
                  class="notice-image"
                  @error="handleImageError"
                  @click="openImageModal(image)"
                />
              </div>
            </div>
          </div>

          <!-- 공지사항 푸터 -->
          <div class="notice-footer">
            <div class="notice-info">
              <span class="created-date">
                작성일: {{ noticeService.formatDate(notice.createdDate) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 삭제 확인 모달 -->
        <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
          <div class="modal-container" @click.stop>
            <div class="modal-header">
              <h3>공지사항 삭제</h3>
              <button @click="showDeleteModal = false" class="modal-close">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-content">
              <p>정말로 이 공지사항을 삭제하시겠습니까?</p>
              <p class="warning-text">삭제된 공지사항은 복구할 수 없습니다.</p>
            </div>
            <div class="modal-footer">
              <button @click="showDeleteModal = false" class="cancel-button">
                취소
              </button>
              <button @click="deleteNotice" class="confirm-delete-button">
                삭제
              </button>
            </div>
          </div>
        </div>

        <!-- 이미지 모달 -->
        <div v-if="selectedImage" class="image-modal-overlay" @click="selectedImage = null">
          <div class="image-modal" @click.stop>
            <button @click="selectedImage = null" class="image-modal-close">
              <i class="fas fa-times"></i>
            </button>
            <img :src="selectedImage" alt="확대된 이미지" class="modal-image" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavigationBar from 'src/core/components/NavigationBar.vue'
import { noticeService } from '@/features/notice/services/notice.service.js'
import { mainService } from '@/features/main/services/main.service.js'

// 라우터 설정
const router = useRouter()
const route = useRoute()

// 반응형 상태
const loading = ref(false)
const error = ref(null)
const notice = ref(null)
const showDeleteModal = ref(false)
const selectedImage = ref(null)
const isAdmin = ref(false) // TODO: 실제 권한 체크로 교체

// 사용자 프로필 및 인증 상태
const hasToken = computed(() => !!localStorage.getItem('accessToken'))
const userProfile = ref({
  name: "",
  email: "",
  avatar: null,
  isAdmin: false
})

// 메인 페이지 데이터 로드하여 관리자 여부 확인
const loadUserProfileFromMain = async () => {
  try {
    const response = await mainService.getMainPageData()
    
    if (response.isSuccess && response.result) {
      userProfile.value.isAdmin = response.result.isAdmin || false
      isAdmin.value = response.result.isAdmin || false
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
  }
}

// 컴퓨티드 속성
const formattedContent = computed(() => {
  if (!notice.value?.content) return ''
  
  // 줄바꿈을 <br> 태그로 변환
  return notice.value.content
    .replace(/\n/g, '<br>')
    .replace(/\r\n/g, '<br>')
})

// 메서드
const loadNotice = async () => {
  try {
    loading.value = true
    error.value = null
    
    const noticeId = parseInt(route.params.id)
    if (isNaN(noticeId)) {
      throw new Error('잘못된 공지사항 ID입니다.')
    }
    
    const response = await noticeService.getNoticeById(noticeId)
    
    if (response.isSuccess) {
      notice.value = {
        ...response.result,
        category: noticeService.getNoticeCategory(response.result.title)
      }
      
      console.log('공지사항 상세 로드 완료:', notice.value)
    } else {
      throw new Error(response.message || '공지사항을 불러올 수 없습니다.')
    }
  } catch (err) {
    console.error('공지사항 로드 실패:', err)
    error.value = err.message || '공지사항을 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/notice')
}

const editNotice = () => {
  router.push(`/notice/edit/${notice.value.noticeId}`)
}

const deleteNotice = async () => {
  try {
    loading.value = true
    
    const response = await noticeService.deleteNotice(notice.value.noticeId)
    
    if (response.isSuccess) {
      alert('공지사항이 삭제되었습니다.')
      router.push('/notice')
    } else {
      throw new Error(response.message || '삭제에 실패했습니다.')
    }
  } catch (err) {
    console.error('공지사항 삭제 실패:', err)
    alert(err.message || '공지사항 삭제에 실패했습니다.')
  } finally {
    loading.value = false
    showDeleteModal.value = false
  }
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const openImageModal = (imageUrl) => {
  selectedImage.value = imageUrl
}

// 라이프사이클
onMounted(() => {
  loadNotice()
  if (hasToken.value) {
    loadUserProfileFromMain()
  }
})

// 템플릿에서 서비스 접근
const noticeServiceRef = noticeService
</script>

<style scoped>
.notice-detail-page {
  min-height: 100vh;
  background-color: var(--color-background);
  transition: background-color var(--transition-slow);
}

.main-content {
  padding-top: 80px;
  max-width: 900px;
  margin: 0 auto;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

.notice-container {
  padding: var(--spacing-2xl) 0;
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-2xl);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--color-primary);
}

/* 에러 상태 */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-2xl);
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 4rem;
  color: var(--color-error);
  margin-bottom: var(--spacing-lg);
}

.error-content h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-content p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.retry-button {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
}

.retry-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 공지사항 상세 */
.notice-detail {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

/* 네비게이션 */
.notice-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-hover);
}

.back-button {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
}

.back-button:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.admin-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.edit-button,
.delete-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
}

.edit-button {
  background: var(--color-info);
  color: white;
}

.edit-button:hover {
  background: var(--color-info);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  filter: brightness(0.9);
}

.delete-button {
  background: var(--color-error);
  color: white;
}

.delete-button:hover {
  background: var(--color-error);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  filter: brightness(0.9);
}

/* 공지사항 헤더 */
.notice-header {
  padding: var(--spacing-2xl);
  border-bottom: 1px solid var(--color-border);
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.notice-category {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.notice-category.공지 {
  background: var(--color-info);
  color: white;
}

.notice-category.이벤트 {
  background: var(--color-warning);
  color: white;
}

.notice-category.업데이트 {
  background: var(--color-success);
  color: white;
}

.notice-category.일반 {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.notice-date {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-small);
}

.notice-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-display);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin: 0;
  letter-spacing: -0.02em;
}

/* 공지사항 내용 */
.notice-content {
  padding: var(--spacing-2xl);
}

.content-body {
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  font-size: var(--font-size-body);
  margin-bottom: var(--spacing-2xl);
}

.content-body ::v-deep(p) {
  margin-bottom: 1rem;
}

.content-body ::v-deep(h1),
.content-body ::v-deep(h2),
.content-body ::v-deep(h3) {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.content-body ::v-deep(ul),
.content-body ::v-deep(ol) {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.content-body ::v-deep(li) {
  margin-bottom: 0.5rem;
}

/* 이미지 */
.notice-images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.image-container {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-container:hover {
  transform: scale(1.02);
}

.notice-image {
  width: 100%;
  height: auto;
  display: block;
}

/* 공지사항 푸터 */
.notice-footer {
  padding: var(--spacing-xl) var(--spacing-2xl);
  background: var(--color-surface-hover);
  border-top: 1px solid var(--color-border);
}

.notice-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.modal-content {
  padding: var(--spacing-xl);
}

.modal-content p {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
}

.warning-text {
  color: var(--color-error);
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

.cancel-button,
.confirm-delete-button {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.cancel-button {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.cancel-button:hover {
  background: var(--color-border-light);
}

.confirm-delete-button {
  background: var(--color-error);
  color: white;
  box-shadow: var(--shadow-sm);
}

.confirm-delete-button:hover {
  background: var(--color-error);
  filter: brightness(0.9);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 이미지 모달 */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.image-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.image-modal-close {
  position: absolute;
  top: -3rem;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .notice-navigation {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .admin-actions {
    justify-content: center;
  }
  
  .notice-header {
    padding: 1.5rem;
  }
  
  .notice-title {
    font-size: 1.5rem;
  }
  
  .notice-content {
    padding: 1.5rem;
  }
  
  .notice-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .notice-container {
    padding: 1rem 0;
  }
  
  .notice-header,
  .notice-content,
  .notice-footer {
    padding: 1rem;
  }
  
  .notice-title {
    font-size: 1.25rem;
  }
  
  .notice-images {
    grid-template-columns: 1fr;
  }
  
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .cancel-button,
  .confirm-delete-button {
    width: 100%;
  }
}
</style>
