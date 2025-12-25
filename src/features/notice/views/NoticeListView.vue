<template>
  <div class="notice-list-page">
    <NavigationBar 
      :is-logged-in="hasToken"
      :user-info="userProfile"
      @open-tutorial="handleOpenTutorial"
      @logout="handleLogout"
    />
    
    <main class="main-content">
      <div class="notice-container">
        <!-- 헤더 섹션 -->
        <div class="notice-header">
          <div class="header-content">
            <h1 class="page-title">📢 공지사항</h1>
            <!-- <p class="page-description">KoSpot의 새로운 소식과 업데이트를 확인하세요</p> -->
          </div>
          
          <!-- 관리자만 보이는 작성 버튼 -->
          <router-link 
            v-if="isAdmin"
            :to="{ name: 'NoticeWriteView' }"
            class="write-button"
          >
            <i class="fas fa-plus"></i>
            공지사항 작성
          </router-link>
        </div>

        <!-- 필터 및 검색 -->
        <div class="notice-filters">
          <div class="filter-tabs">
            <button
              v-for="category in categories"
              :key="category.id"
              :class="{ active: activeCategory === category.id }"
              @click="setActiveCategory(category.id)"
              class="filter-tab"
            >
              <i :class="category.icon"></i>
              {{ category.name }}
            </button>
          </div>
          
          <div class="search-section">
            <div class="search-input-wrapper">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="공지사항 제목을 검색하세요"
                class="search-input"
                @input="onSearchInput"
              />
              <i class="fas fa-search search-icon"></i>
            </div>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>공지사항을 불러오는 중...</p>
          </div>
        </div>

        <!-- 공지사항 목록 -->
        <div v-else-if="filteredNotices.length > 0" class="notice-list">
          <div
            v-for="notice in filteredNotices"
            :key="notice.noticeId"
            class="notice-item"
            @click="goToNoticeDetail(notice.noticeId)"
          >
            <div class="notice-content">
              <div class="notice-meta">
                <span 
                  class="notice-category"
                  :class="notice.category?.toLowerCase()"
                >
                  {{ notice.category }}
                </span>
                <span class="notice-date">
                  {{ noticeService.getRelativeTime(notice.createdDate) }}
                </span>
              </div>
              
              <h3 class="notice-title">{{ notice.title }}</h3>
              
              <div v-if="notice.preview" class="notice-preview">
                {{ notice.preview }}
              </div>
            </div>
            
            <div class="notice-actions">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-bullhorn"></i>
          </div>
          <h3>공지사항이 없습니다</h3>
          <p v-if="searchQuery">
            '{{ searchQuery }}'에 대한 검색 결과가 없습니다.
          </p>
          <p v-else-if="activeCategory !== 'all'">
            해당 카테고리에 공지사항이 없습니다.
          </p>
          <p v-else>
            아직 등록된 공지사항이 없습니다.
          </p>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            :disabled="currentPage === 0"
            @click="goToPage(currentPage - 1)"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <div class="pagination-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
              class="pagination-number"
            >
              {{ page + 1 }}
            </button>
          </div>
          
          <button
            :disabled="currentPage === totalPages - 1"
            @click="goToPage(currentPage + 1)"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { mainService } from '@/features/main/services/main.service.js'
import { useRouter, useRoute } from 'vue-router'
import NavigationBar from 'src/core/components/NavigationBar.vue'
import { noticeService } from '@/features/notice/services/notice.service.js'
import { useAuth } from '@/core/composables/useAuth.js'

// 라우터 설정
const router = useRouter()
const route = useRoute()
const { logout: logoutAuth } = useAuth()

// 반응형 상태
const loading = ref(false)
const notices = ref([])
const currentPage = ref(0)
const totalPages = ref(1)
const searchQuery = ref('')
const activeCategory = ref('all')
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
      // 수정: result.myInfo.isAdmin 사용
      const isAdminValue = response.result.myInfo?.isAdmin || false
      userProfile.value.isAdmin = isAdminValue
      isAdmin.value = isAdminValue
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
    // 에러 시 기본값 유지
  }
}

// 카테고리 필터
const categories = [
  { id: 'all', name: '전체', icon: 'fas fa-list' },
  { id: '공지', name: '공지', icon: 'fas fa-bullhorn' }
]

// 컴퓨티드 속성
const filteredNotices = computed(() => {
  let filtered = notices.value

  // 카테고리 필터링
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(notice => 
      notice.category === activeCategory.value
    )
  }

  // 검색 필터링
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(notice =>
      notice.title.toLowerCase().includes(query)
    )
  }

  return filtered
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  const start = Math.max(0, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value - 1, start + maxVisible - 1)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// 메서드
const loadNotices = async (page = 0) => {
  try {
    loading.value = true
    const response = await noticeService.getAllNotices(page)
    
    if (response.isSuccess) {
      // API 응답 데이터 처리
      notices.value = response.result.map(notice => ({
        ...notice,
        category: noticeService.getNoticeCategory(notice.title),
        preview: noticeService.truncateText(notice.content, 80)
      }))
      
      // 페이지네이션 정보 업데이트 (실제 API 응답에 따라 조정)
      currentPage.value = page
      totalPages.value = Math.ceil(notices.value.length / 10) // 임시값, 실제 총 개수 필요
      
      console.log('공지사항 목록 로드 완료:', notices.value)
    } else {
      throw new Error(response.message || '공지사항 조회 실패')
    }
  } catch (error) {
    console.error('공지사항 로드 실패:', error)
    // 에러 시 빈 배열로 초기화
    notices.value = []
    
    // 사용자에게 에러 알림 (실제 구현에서는 toast 등 사용)
    alert('공지사항을 불러오는데 실패했습니다. 다시 시도해주세요.')
  } finally {
    loading.value = false
  }
}

const setActiveCategory = (categoryId) => {
  activeCategory.value = categoryId
}

const onSearchInput = () => {
  // 검색어 입력 시 디바운싱 적용 가능
  // 현재는 즉시 필터링
}

const goToNoticeDetail = (noticeId) => {
  router.push({ name: 'NoticeDetailView', params: { id: noticeId } })
}

const goToPage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    loadNotices(page)
  }
}

// 메서드
const handleOpenTutorial = () => {
  // 튜토리얼 열기 로직 (필요시 구현)
  console.log('튜토리얼 열기 요청')
}

// MainView와 동일한 로그아웃 처리
async function handleLogout() {
  try {
    await logoutAuth()
    window.location.reload()
  } catch (error) {
    console.error('❌ 로그아웃 처리 중 오류:', error)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('memberId')
    window.location.reload()
  }
}

// 사용자 정보 로드 (기존 함수 제거, loadUserProfileFromMain 사용)

// 라이프사이클
onMounted(() => {
  // 쿼리 파라미터(category)로 초기 활성 카테고리 설정
  const categoryFromQuery = route.query.category
  if (typeof categoryFromQuery === 'string' && categoryFromQuery) {
    const validCategoryIds = categories.map(c => c.id)
    if (validCategoryIds.includes(categoryFromQuery)) {
      activeCategory.value = categoryFromQuery
    }
  }
  loadNotices()
  if (hasToken.value) {
    loadUserProfileFromMain()
  }
})

// 라우트 쿼리 변경 시 카테고리 동기화
watch(
  () => route.query.category,
  (newCategory) => {
    if (typeof newCategory === 'string' && newCategory) {
      const validCategoryIds = categories.map(c => c.id)
      if (validCategoryIds.includes(newCategory)) {
        activeCategory.value = newCategory
      }
    }
  }
)

// 템플릿에서 서비스 접근
const noticeServiceRef = noticeService
</script>

<style scoped>
.notice-list-page {
  min-height: 100vh;
  background-color: var(--color-background);
  transition: background-color var(--transition-slow);
}

.main-content {
  padding-top: 80px;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

.notice-container {
  padding: var(--spacing-2xl) 0;
}

/* 헤더 섹션 */
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--spacing-2xl);
  gap: var(--spacing-lg);
}

.header-content h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-display);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  letter-spacing: -0.02em;
}

.page-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
  margin: 0;
}

.write-button {
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: all var(--transition-normal);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.write-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--color-primary-dark);
}

/* 필터 섹션 */
.notice-filters {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.filter-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.filter-tab {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-tab:hover {
  background: var(--color-border-light);
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

.filter-tab.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.search-section {
  display: flex;
  justify-content: flex-end;
}

.search-input-wrapper {
  position: relative;
  width: 300px;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  padding-right: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  transition: all var(--transition-normal);
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.search-icon {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
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

/* 공지사항 목록 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.notice-item {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.notice-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.notice-content {
  flex: 1;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
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
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  line-height: var(--line-height-tight);
}

.notice-preview {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
  line-height: var(--line-height-relaxed);
}

.notice-actions {
  color: var(--color-text-tertiary);
  font-size: 1.25rem;
  transition: color var(--transition-normal);
}

.notice-item:hover .notice-actions {
  color: var(--color-primary);
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.empty-icon {
  font-size: 4rem;
  color: var(--color-border-dark);
  margin-bottom: var(--spacing-lg);
}

.empty-state h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-2xl);
}

.pagination-btn,
.pagination-number {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  min-width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled),
.pagination-number:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-number.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.pagination-numbers {
  display: flex;
  gap: var(--spacing-xs);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .notice-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }
  
  .search-input-wrapper {
    width: 100%;
  }
  
  .filter-tabs {
    justify-content: center;
  }
  
  .notice-item {
    padding: 1rem;
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
  
  .notice-filters {
    padding: 1rem;
  }
  
  .filter-tab {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .pagination {
    gap: 0.25rem;
  }
  
  .pagination-btn,
  .pagination-number {
    padding: 0.4rem 0.6rem;
    min-width: 2rem;
    font-size: 0.9rem;
  }
}
</style>
