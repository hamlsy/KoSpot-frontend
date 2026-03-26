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
            <h1 class="page-title"><i class="fas fa-bullhorn page-title-icon"></i> 공지사항</h1>
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

// 메인 페이지 데이터 로드하여 사용자 정보 및 관리자 여부 확인
const loadUserProfileFromMain = async () => {
  try {
    const response = await mainService.getMainPageData()
    
    if (response.isSuccess && response.result) {
      const myInfo = response.result.myInfo
      if (myInfo) {
        // 관리자 여부 업데이트
        userProfile.value.isAdmin = myInfo.isAdmin || false
        isAdmin.value = myInfo.isAdmin || false
        
        // 사용자 프로필 정보 업데이트 (nickname, email, equippedMarkerImageUrl)
        if (myInfo.nickname) {
          userProfile.value.name = myInfo.nickname
        }
        if (myInfo.email) {
          userProfile.value.email = myInfo.email
        }
        if (myInfo.equippedMarkerImageUrl) {
          userProfile.value.avatar = myInfo.equippedMarkerImageUrl
        }
      }
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
/* ── 페이지 기본 ── */
.notice-list-page {
  min-height: 100vh;
  background-color: var(--color-background);
}

.main-content {
  padding-top: 80px;
  max-width: 800px;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
}

.notice-container {
  padding: 36px 0 48px;
}

/* ── 페이지 헤더 ── */
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title-icon {
  color: #4cc9cf;
  font-size: 18px;
}

.write-button {
  background: linear-gradient(135deg, #52DEE5 0%, #4cc9cf 100%);
  color: #fff;
  text-decoration: none;
  padding: 9px 18px;
  border-radius: 50px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(76, 201, 207, 0.35);
}

.write-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 201, 207, 0.45);
}

/* ── 필터 & 검색 ── */
.notice-filters {
  background: #fff;
  border: 1px solid rgba(76, 201, 207, 0.12);
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-tab {
  background: #f3f4f6;
  border: 1.5px solid transparent;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.18s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-tab:hover:not(.active) {
  background: #e5e7eb;
  color: #111827;
}

.filter-tab.active {
  background: linear-gradient(135deg, #52DEE5 0%, #4cc9cf 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 3px 10px rgba(76, 201, 207, 0.35);
}

.search-section {
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  width: 240px;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 50px;
  font-size: 13px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  background: #f9fafb;
  color: #111827;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #4cc9cf;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(76, 201, 207, 0.12);
}

.search-icon {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 13px;
  pointer-events: none;
}

/* ── 로딩 상태 ── */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #6b7280;
  font-size: 14px;
}

.loading-spinner i {
  font-size: 28px;
  color: #4cc9cf;
}

/* ── 공지 목록 ── */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-item {
  background: #fff;
  border-radius: 16px;
  padding: 20px 22px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  border: 1px solid rgba(76, 201, 207, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.notice-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 201, 207, 0.15);
  border-color: rgba(76, 201, 207, 0.35);
}

.notice-content {
  flex: 1;
  min-width: 0;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

/* 카테고리 배지 — outline 스타일 (notice.css와 통일) */
.notice-category {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
  background: rgba(107, 114, 128, 0.08);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.notice-category.공지 {
  background: rgba(76, 201, 207, 0.1);
  color: #0891b2;
  border: 1px solid rgba(76, 201, 207, 0.3);
}

.notice-category.이벤트 {
  background: rgba(245, 158, 11, 0.08);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.notice-category.업데이트 {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.notice-category.일반 {
  background: rgba(107, 114, 128, 0.08);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.notice-date {
  font-size: 12px;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.notice-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 6px;
  line-height: 1.4;
  transition: color 0.18s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notice-item:hover .notice-title {
  color: #0891b2;
}

.notice-preview {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.notice-actions {
  color: #d1d5db;
  font-size: 14px;
  flex-shrink: 0;
  transition: color 0.18s ease;
}

.notice-item:hover .notice-actions {
  color: #4cc9cf;
}

/* ── 빈 상태 ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: #fff;
  border: 1px solid rgba(76, 201, 207, 0.1);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(82, 222, 229, 0.12) 0%, rgba(238, 229, 233, 0.2) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon i {
  font-size: 26px;
  color: #4cc9cf;
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* ── 페이지네이션 ── */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-top: 32px;
}

.pagination-btn,
.pagination-number {
  width: 36px;
  height: 36px;
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled),
.pagination-number:hover:not(.active) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-number.active {
  background: #4cc9cf;
  color: #fff;
  border-color: #4cc9cf;
  box-shadow: 0 3px 10px rgba(76, 201, 207, 0.35);
}

.pagination-numbers {
  display: flex;
  gap: 4px;
}

/* ── 반응형 ── */
@media (max-width: 768px) {
  .main-content {
    padding-left: 14px;
    padding-right: 14px;
  }

  .notice-header {
    flex-wrap: wrap;
  }

  .notice-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .search-section {
    width: 100%;
  }

  .search-input-wrapper {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .notice-container {
    padding: 24px 0 36px;
  }

  .notice-item {
    padding: 16px;
  }

  .notice-meta {
    flex-wrap: wrap;
  }

  .pagination-btn,
  .pagination-number {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
</style>
