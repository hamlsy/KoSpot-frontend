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
      userProfile.value.isAdmin = response.result.isAdmin || false
      isAdmin.value = response.result.isAdmin || false
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
    // 에러 시 기본값 유지
  }
}

// 카테고리 필터
const categories = [
  { id: 'all', name: '전체', icon: 'fas fa-list' },
  { id: '공지', name: '공지', icon: 'fas fa-bullhorn' },
  { id: '이벤트', name: '이벤트', icon: 'fas fa-gift' },
  { id: '업데이트', name: '업데이트', icon: 'fas fa-sync-alt' },
  { id: '일반', name: '일반', icon: 'fas fa-info-circle' }
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
  background-color: #f5f7fa;
}

.main-content {
  padding-top: 80px;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.notice-container {
  padding: 2rem 0;
}

/* 헤더 섹션 */
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.write-button {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.write-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* 필터 섹션 */
.notice-filters {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  background: #f3f4f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-tab:hover {
  background: #e5e7eb;
}

.filter-tab.active {
  background: #667eea;
  color: white;
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
  padding: 0.75rem 1rem;
  padding-right: 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
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

/* 공지사항 목록 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notice-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notice-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.notice-preview {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.notice-actions {
  color: #9ca3af;
  font-size: 1.2rem;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination-btn,
.pagination-number {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled),
.pagination-number:hover {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-number.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.pagination-numbers {
  display: flex;
  gap: 0.25rem;
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
