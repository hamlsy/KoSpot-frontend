<template>
  <div class="notice-detail-page">
    <NavigationBar />
    
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
})

// 템플릿에서 서비스 접근
const noticeServiceRef = noticeService
</script>

<style scoped>
.notice-detail-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  padding-top: 80px;
  max-width: 800px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.notice-container {
  padding: 2rem 0;
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
}

.loading-spinner i {
  font-size: 2rem;
  color: #667eea;
}

/* 에러 상태 */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-content h3 {
  font-size: 1.25rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.error-content p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.retry-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.retry-button:hover {
  background: #5a67d8;
}

/* 공지사항 상세 */
.notice-detail {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 네비게이션 */
.notice-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.back-button {
  background: none;
  border: none;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.back-button:hover {
  background: #e5e7eb;
  color: #374151;
}

.admin-actions {
  display: flex;
  gap: 0.5rem;
}

.edit-button,
.delete-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-button {
  background: #3b82f6;
  color: white;
}

.edit-button:hover {
  background: #2563eb;
}

.delete-button {
  background: #ef4444;
  color: white;
}

.delete-button:hover {
  background: #dc2626;
}

/* 공지사항 헤더 */
.notice-header {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.notice-category {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.notice-category.공지 {
  background: #dbeafe;
  color: #1d4ed8;
}

.notice-category.이벤트 {
  background: #fef3c7;
  color: #d97706;
}

.notice-category.업데이트 {
  background: #d1fae5;
  color: #065f46;
}

.notice-category.일반 {
  background: #f3f4f6;
  color: #374151;
}

.notice-date {
  color: #9ca3af;
  font-size: 0.9rem;
}

.notice-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
  margin: 0;
}

/* 공지사항 내용 */
.notice-content {
  padding: 2rem;
}

.content-body {
  color: #374151;
  line-height: 1.7;
  font-size: 1rem;
  margin-bottom: 2rem;
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
  padding: 1.5rem 2rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.notice-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
  font-size: 0.9rem;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-content {
  padding: 1.5rem;
}

.modal-content p {
  margin: 0 0 1rem 0;
  color: #374151;
}

.warning-text {
  color: #ef4444;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-button,
.confirm-delete-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background: #f3f4f6;
  color: #374151;
}

.cancel-button:hover {
  background: #e5e7eb;
}

.confirm-delete-button {
  background: #ef4444;
  color: white;
}

.confirm-delete-button:hover {
  background: #dc2626;
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
