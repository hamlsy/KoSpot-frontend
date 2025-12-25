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
            <div 
              class="content-body markdown-content" 
              v-html="renderedContent"
            ></div>
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
const isAdmin = ref(false)

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
      userProfile.value.isAdmin = response.result.myInfo?.isAdmin || false
      isAdmin.value = response.result.myInfo?.isAdmin || false
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
  }
}

// HTML 콘텐츠 (백엔드에서 contentHtml로 제공)
const renderedContent = computed(() => {
  if (!notice.value?.contentHtml) return ''
  return notice.value.contentHtml
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
  router.push({ name: 'NoticeListView' })
}

const editNotice = () => {
  router.push({ name: 'NoticeEdit', params: { id: notice.value.noticeId } })
}

const deleteNotice = async () => {
  try {
    loading.value = true
    
    const response = await noticeService.deleteNotice(notice.value.noticeId)
    
    if (response.isSuccess) {
      alert('공지사항이 삭제되었습니다.')
      router.push({ name: 'NoticeListView' })
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
  max-width: 1400px;
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-sm);
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
  transition: all var(--transition-normal);
}

.notice-detail:hover {
  box-shadow: var(--shadow-md);
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
  background: var(--color-surface);
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
  box-shadow: var(--shadow-sm);
}

.back-button:hover {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  filter: brightness(0.9);
}

.delete-button {
  background: var(--color-error);
  color: white;
}

.delete-button:hover {
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
  margin-bottom: var(--spacing-2xl);
}

/* 마크다운 콘텐츠 스타일링 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-family: var(--font-heading);
  font-weight: 600;
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.markdown-content :deep(h1) {
  font-size: var(--font-size-h1);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}

.markdown-content :deep(h2) {
  font-size: var(--font-size-h2);
}

.markdown-content :deep(h3) {
  font-size: var(--font-size-h3);
}

.markdown-content :deep(p) {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-left: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
}

.markdown-content :deep(li) {
  margin-bottom: var(--spacing-sm);
  line-height: var(--line-height-relaxed);
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--color-primary);
  padding-left: var(--spacing-md);
  margin: var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-style: italic;
  background: var(--color-surface-hover);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
}

.markdown-content :deep(code) {
  background: var(--color-surface-hover);
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--color-primary);
}

.markdown-content :deep(pre) {
  background: var(--color-surface-hover);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--spacing-md) 0;
  border: 1px solid var(--color-border);
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--color-text-primary);
}

.markdown-content :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all var(--transition-normal);
}

.markdown-content :deep(a:hover) {
  border-bottom-color: var(--color-primary);
}

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  margin: var(--spacing-md) 0;
  box-shadow: var(--shadow-sm);
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--spacing-xl) 0;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: var(--spacing-md) 0;
}

.markdown-content :deep(table th),
.markdown-content :deep(table td) {
  border: 1px solid var(--color-border);
  padding: var(--spacing-sm);
  text-align: left;
}

.markdown-content :deep(table th) {
  background: var(--color-surface-hover);
  font-weight: 600;
  color: var(--color-text-primary);
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
  box-shadow: var(--shadow-sm);
}

.cancel-button {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.cancel-button:hover {
  background: var(--color-border-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.confirm-delete-button {
  background: var(--color-error);
  color: white;
}

.confirm-delete-button:hover {
  filter: brightness(0.9);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}


/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }
  
  .notice-navigation {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .admin-actions {
    justify-content: center;
  }
  
  .notice-header {
    padding: var(--spacing-lg);
  }
  
  .notice-title {
    font-size: var(--font-size-h1);
  }
  
  .notice-content {
    padding: var(--spacing-lg);
  }
  
  .notice-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .notice-footer {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .notice-container {
    padding: var(--spacing-md) 0;
  }
  
  .notice-header,
  .notice-content,
  .notice-footer {
    padding: var(--spacing-md);
  }
  
  .notice-title {
    font-size: var(--font-size-h2);
  }
  
  
  .modal-container {
    width: 95%;
    margin: var(--spacing-md);
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
