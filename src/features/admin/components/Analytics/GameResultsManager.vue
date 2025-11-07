<template>
  <div class="game-results-manager">
    <div class="header-section">
      <h2 class="section-title">📊 게임 결과 관리</h2>
      <p class="section-description">모든 게임 모드의 플레이 결과와 통계를 확인할 수 있습니다.</p>
    </div>

    <!-- 통계 요약 -->
    <div class="stats-summary">
      <div class="stat-card">
        <div class="stat-icon roadview">
          <i class="fas fa-road"></i>
        </div>
        <div class="stat-info">
          <h3>{{ summary.roadview.totalGames }}</h3>
          <p>로드뷰 게임</p>
          <span class="avg-score">평균: {{ summary.roadview.avgScore }}점</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon photo">
          <i class="fas fa-camera"></i>
        </div>
        <div class="stat-info">
          <h3>{{ summary.photo.totalGames }}</h3>
          <p>포토 게임</p>
          <span class="avg-score">평균: {{ summary.photo.avgScore }}점</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon practice">
          <i class="fas fa-dumbbell"></i>
        </div>
        <div class="stat-info">
          <h3>{{ summary.practice.totalGames }}</h3>
          <p>연습 모드</p>
          <span class="avg-score">평균: {{ summary.practice.avgScore }}점</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rank">
          <i class="fas fa-trophy"></i>
        </div>
        <div class="stat-info">
          <h3>{{ summary.rank.totalGames }}</h3>
          <p>랭크 모드</p>
          <span class="avg-score">평균: {{ summary.rank.avgScore }}점</span>
        </div>
      </div>
    </div>

    <!-- 필터 및 검색 -->
    <div class="filter-section">
      <div class="filter-row">
        <select v-model="filters.gameMode" class="filter-select">
          <option value="">모든 게임 모드</option>
          <option value="roadview">로드뷰</option>
          <option value="photo">포토</option>
        </select>
        <select v-model="filters.gameType" class="filter-select">
          <option value="">모든 게임 타입</option>
          <option value="practice">연습</option>
          <option value="rank">랭크</option>
        </select>
        <select v-model="filters.period" class="filter-select">
          <option value="today">오늘</option>
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="all">전체</option>
        </select>
        <input 
          v-model="filters.playerName" 
          type="text" 
          placeholder="플레이어 이름 검색..."
          class="search-input"
        />
        <button @click="applyFilters" class="filter-btn">
          <i class="fas fa-search"></i>
          검색
        </button>
      </div>
    </div>

    <!-- 게임 결과 테이블 -->
    <div class="results-table">
      <div class="table-header">
        <div class="col-player">플레이어</div>
        <div class="col-mode">게임 모드</div>
        <div class="col-type">타입</div>
        <div class="col-score">점수</div>
        <div class="col-time">플레이 시간</div>
        <div class="col-date">날짜</div>
        <div class="col-actions">상세</div>
      </div>
      <div class="table-body">
        <div 
          v-for="result in filteredResults" 
          :key="result.id"
          class="table-row"
        >
          <div class="col-player">
            <div class="player-info">
              <img :src="result.player.avatar" :alt="result.player.nickname" class="player-avatar" />
              <div class="player-details">
                <span class="nickname">{{ result.player.nickname }}</span>
                <span class="user-id">ID: {{ result.player.id }}</span>
              </div>
            </div>
          </div>
          <div class="col-mode">
            <span class="mode-badge" :class="result.gameMode">
              {{ getModeLabel(result.gameMode) }}
            </span>
          </div>
          <div class="col-type">
            <span class="type-badge" :class="result.gameType">
              {{ getTypeLabel(result.gameType) }}
            </span>
          </div>
          <div class="col-score">
            <span class="score" :class="getScoreClass(result.score)">
              {{ result.score }}점
            </span>
          </div>
          <div class="col-time">{{ formatDuration(result.playTime) }}</div>
          <div class="col-date">{{ formatDate(result.playedAt) }}</div>
          <div class="col-actions">
            <button @click="viewDetails(result)" class="detail-btn">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
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

    <!-- 상세 모달 -->
    <div v-if="showDetailModal" class="modal-overlay" @click="closeDetailModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>게임 결과 상세</h3>
          <button @click="closeDetailModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body" v-if="selectedResult">
          <div class="detail-section">
            <h4>게임 정보</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="label">게임 모드:</span>
                <span class="value">{{ getModeLabel(selectedResult.gameMode) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">게임 타입:</span>
                <span class="value">{{ getTypeLabel(selectedResult.gameType) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">최종 점수:</span>
                <span class="value score-value">{{ selectedResult.score }}점</span>
              </div>
              <div class="detail-item">
                <span class="label">플레이 시간:</span>
                <span class="value">{{ formatDuration(selectedResult.playTime) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>라운드별 결과</h4>
            <div class="rounds-list">
              <div 
                v-for="(round, index) in selectedResult.rounds" 
                :key="index"
                class="round-item"
              >
                <div class="round-header">
                  <span class="round-number">라운드 {{ index + 1 }}</span>
                  <span class="round-score">{{ round.score }}점</span>
                </div>
                <div class="round-details">
                  <span class="round-time">소요 시간: {{ formatDuration(round.timeSpent) }}</span>
                  <span class="round-distance" v-if="round.distance">
                    거리 오차: {{ round.distance }}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>로딩 중...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import apiClient from '@/core/api/apiClient.js'

const loading = ref(false)
const showDetailModal = ref(false)
const selectedResult = ref(null)
const currentPage = ref(1)
const itemsPerPage = 20

// 통계 요약
const summary = reactive({
  roadview: { totalGames: 1247, avgScore: 3542 },
  photo: { totalGames: 892, avgScore: 2834 },
  practice: { totalGames: 1456, avgScore: 2987 },
  rank: { totalGames: 683, avgScore: 4231 }
})

// 필터
const filters = reactive({
  gameMode: '',
  gameType: '',
  period: 'week',
  playerName: ''
})

// 게임 결과 데이터
const gameResults = ref([])

// 필터링된 결과
const filteredResults = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return gameResults.value.slice(start, start + itemsPerPage)
})

// 총 페이지 수
const totalPages = computed(() => {
  return Math.ceil(gameResults.value.length / itemsPerPage)
})

// 게임 모드 라벨
const getModeLabel = (mode) => {
  const labels = {
    roadview: '로드뷰',
    photo: '포토'
  }
  return labels[mode] || mode
}

// 게임 타입 라벨
const getTypeLabel = (type) => {
  const labels = {
    practice: '연습',
    rank: '랭크'
  }
  return labels[type] || type
}

// 점수 클래스
const getScoreClass = (score) => {
  if (score >= 4000) return 'excellent'
  if (score >= 3000) return 'good'
  if (score >= 2000) return 'average'
  return 'poor'
}

// 시간 포맷팅
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 날짜 포맷팅
const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 필터 적용
const applyFilters = async () => {
  await loadGameResults()
}

// 상세 보기
const viewDetails = (result) => {
  selectedResult.value = result
  showDetailModal.value = true
}

// 상세 모달 닫기
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedResult.value = null
}

// 게임 결과 로드
const loadGameResults = async () => {
  try {
    loading.value = true
    
    const params = new URLSearchParams()
    if (filters.gameMode) params.append('gameMode', filters.gameMode)
    if (filters.gameType) params.append('gameType', filters.gameType)
    if (filters.period) params.append('period', filters.period)
    if (filters.playerName) params.append('playerName', filters.playerName)
    
    const response = await apiClient.get(`/admin/game-results?${params}`)
    
    if (response.data.isSuccess) {
      gameResults.value = response.data.result
    }
  } catch (error) {
    console.error('게임 결과 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// 통계 요약 로드
const loadSummary = async () => {
  try {
    const response = await apiClient.get('/admin/game-results/summary')
    
    if (response.data.isSuccess) {
      Object.assign(summary, response.data.result)
    }
  } catch (error) {
    console.error('통계 요약 로드 실패:', error)
  }
}

// 필터 변경 감지
watch([() => filters.gameMode, () => filters.gameType, () => filters.period], () => {
  currentPage.value = 1
  applyFilters()
})

onMounted(() => {
  loadGameResults()
  loadSummary()
})
</script>

<style scoped>
.game-results-manager {
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

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.stat-icon.roadview {
  background: #3b82f6;
}

.stat-icon.photo {
  background: #10b981;
}

.stat-icon.practice {
  background: #f59e0b;
}

.stat-icon.rank {
  background: #8b5cf6;
}

.stat-info h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.stat-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

.avg-score {
  font-size: 0.8rem;
  color: #374151;
  font-weight: 500;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 2fr auto;
  gap: 1rem;
  align-items: center;
}

.filter-select,
.search-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.filter-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.results-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1.5fr auto;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
}

.table-header {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.table-row {
  border-bottom: 1px solid #f3f4f6;
}

.table-row:hover {
  background: #f8fafc;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
}

.player-details {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
}

.user-id {
  font-size: 0.75rem;
  color: #6b7280;
}

.mode-badge,
.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.mode-badge.roadview {
  background: #dbeafe;
  color: #1e40af;
}

.mode-badge.photo {
  background: #d1fae5;
  color: #065f46;
}

.type-badge.practice {
  background: #fef3c7;
  color: #92400e;
}

.type-badge.rank {
  background: #ede9fe;
  color: #6b21a8;
}

.score {
  font-weight: 600;
  font-size: 0.95rem;
}

.score.excellent {
  color: #059669;
}

.score.good {
  color: #2563eb;
}

.score.average {
  color: #d97706;
}

.score.poor {
  color: #dc2626;
}

.detail-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-btn:hover {
  background: #4b5563;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
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

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.detail-item .label {
  color: #6b7280;
  font-size: 0.9rem;
}

.detail-item .value {
  color: #1f2937;
  font-weight: 500;
  font-size: 0.9rem;
}

.score-value {
  color: #059669 !important;
  font-weight: 600 !important;
}

.rounds-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.round-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.round-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.round-number {
  font-weight: 600;
  color: #1f2937;
}

.round-score {
  font-weight: 600;
  color: #059669;
}

.round-details {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #6b7280;
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
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style> 