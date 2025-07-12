<template>
  <div class="visitor-stats-manager">
    <div class="header-section">
      <h2 class="section-title">📈 접속자 통계 관리</h2>
      <p class="section-description">일별, 시간대별 접속자 수와 추이를 확인할 수 있습니다.</p>
    </div>

    <!-- 실시간 통계 요약 -->
    <div class="realtime-stats">
      <div class="stat-card current">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <h3>{{ realtimeStats.current }}</h3>
          <p>현재 접속자</p>
          <span class="stat-change positive">
            <i class="fas fa-arrow-up"></i>
            {{ realtimeStats.changePercent }}%
          </span>
        </div>
      </div>
      <div class="stat-card today">
        <div class="stat-icon">
          <i class="fas fa-calendar-day"></i>
        </div>
        <div class="stat-info">
          <h3>{{ realtimeStats.today }}</h3>
          <p>오늘 방문자</p>
          <span class="stat-change" :class="realtimeStats.todayChange >= 0 ? 'positive' : 'negative'">
            <i class="fas" :class="realtimeStats.todayChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
            {{ Math.abs(realtimeStats.todayChange) }}%
          </span>
        </div>
      </div>
      <div class="stat-card peak">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ realtimeStats.peakToday }}</h3>
          <p>오늘 최대 동시접속</p>
          <span class="stat-time">{{ realtimeStats.peakTime }}시</span>
        </div>
      </div>
      <div class="stat-card avg">
        <div class="stat-icon">
          <i class="fas fa-chart-bar"></i>
        </div>
        <div class="stat-info">
          <h3>{{ realtimeStats.avgWeek }}</h3>
          <p>주간 평균 방문자</p>
          <span class="stat-period">최근 7일</span>
        </div>
      </div>
    </div>

    <!-- 기간 선택 및 필터 -->
    <div class="filter-section">
      <div class="filter-row">
        <select v-model="selectedPeriod" @change="loadStats" class="period-select">
          <option value="today">오늘</option>
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="3months">최근 3개월</option>
        </select>
        <div class="date-range" v-if="selectedPeriod === 'custom'">
          <input v-model="customStartDate" type="date" class="date-input" />
          <span>~</span>
          <input v-model="customEndDate" type="date" class="date-input" />
        </div>
        <button @click="refreshStats" class="refresh-btn">
          <i class="fas fa-sync-alt"></i>
          새로고침
        </button>
      </div>
    </div>

    <!-- 차트 섹션 -->
    <div class="charts-section">
      <!-- 일별 접속자 추이 -->
      <div class="chart-container">
        <div class="chart-header">
          <h3>일별 접속자 추이</h3>
          <div class="chart-controls">
            <button 
              @click="chartType = 'line'" 
              :class="{ active: chartType === 'line' }"
              class="chart-type-btn"
            >
              <i class="fas fa-chart-line"></i>
            </button>
            <button 
              @click="chartType = 'bar'" 
              :class="{ active: chartType === 'bar' }"
              class="chart-type-btn"
            >
              <i class="fas fa-chart-bar"></i>
            </button>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="mock-chart daily">
            <div class="chart-bars">
              <div 
                v-for="(value, index) in mockDailyData" 
                :key="index"
                class="chart-bar"
                :style="{ height: `${(value / Math.max(...mockDailyData)) * 100}%` }"
              >
                <span class="bar-value">{{ value }}</span>
              </div>
            </div>
            <div class="chart-labels">
              <span v-for="(label, index) in dailyLabels" :key="index">{{ label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 시간대별 접속자 분포 -->
      <div class="chart-container">
        <div class="chart-header">
          <h3>시간대별 접속자 분포 (오늘)</h3>
        </div>
        <div class="chart-placeholder">
          <div class="mock-chart hourly">
            <div class="chart-bars">
              <div 
                v-for="(value, index) in mockHourlyData" 
                :key="index"
                class="chart-bar hourly"
                :style="{ height: `${(value / Math.max(...mockHourlyData)) * 100}%` }"
              >
                <span class="bar-value">{{ value }}</span>
              </div>
            </div>
            <div class="chart-labels">
              <span v-for="hour in 24" :key="hour">{{ hour - 1 }}시</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 상세 통계 테이블 -->
    <div class="detailed-stats">
      <div class="stats-header">
        <h3>상세 통계</h3>
        <button @click="exportStats" class="export-btn">
          <i class="fas fa-download"></i>
          엑셀 다운로드
        </button>
      </div>
      
      <div class="stats-table">
        <div class="table-header">
          <div class="col-date">날짜</div>
          <div class="col-visitors">방문자 수</div>
          <div class="col-peak">최대 동시접속</div>
          <div class="col-peak-time">피크 시간</div>
          <div class="col-avg-session">평균 세션</div>
          <div class="col-bounce">이탈률</div>
        </div>
        <div class="table-body">
          <div 
            v-for="stat in detailedStats" 
            :key="stat.date"
            class="table-row"
          >
            <div class="col-date">{{ formatDate(stat.date) }}</div>
            <div class="col-visitors">
              <span class="visitor-count">{{ stat.visitors }}</span>
              <span class="visitor-change" :class="stat.change >= 0 ? 'positive' : 'negative'">
                ({{ stat.change >= 0 ? '+' : '' }}{{ stat.change }}%)
              </span>
            </div>
            <div class="col-peak">{{ stat.peakConcurrent }}</div>
            <div class="col-peak-time">{{ stat.peakTime }}:00</div>
            <div class="col-avg-session">{{ formatDuration(stat.avgSession) }}</div>
            <div class="col-bounce">{{ stat.bounceRate }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>통계를 불러오는 중...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import apiClient from '@/core/api/apiClient.js'

const loading = ref(false)
const selectedPeriod = ref('week')
const chartType = ref('line')
const customStartDate = ref('')
const customEndDate = ref('')

// 실시간 통계
const realtimeStats = reactive({
  current: 142,
  changePercent: 12.5,
  today: 1847,
  todayChange: 8.3,
  peakToday: 267,
  peakTime: 14,
  avgWeek: 1534
})

// 목업 데이터
const mockDailyData = ref([1234, 1456, 1123, 1678, 1847, 1592, 1401])
const mockHourlyData = ref([23, 12, 8, 5, 4, 7, 15, 34, 67, 89, 124, 156, 178, 267, 234, 198, 167, 145, 123, 98, 76, 65, 45, 32])

const dailyLabels = computed(() => {
  const labels = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    labels.push(date.getDate() + '일')
  }
  return labels
})

// 상세 통계 데이터
const detailedStats = ref([
  {
    date: '2024-12-15',
    visitors: 1847,
    change: 8.3,
    peakConcurrent: 267,
    peakTime: 14,
    avgSession: 324,
    bounceRate: 32.1
  },
  {
    date: '2024-12-14',
    visitors: 1592,
    change: -5.2,
    peakConcurrent: 234,
    peakTime: 15,
    avgSession: 298,
    bounceRate: 28.7
  },
  {
    date: '2024-12-13',
    visitors: 1678,
    change: 12.1,
    peakConcurrent: 289,
    peakTime: 16,
    avgSession: 367,
    bounceRate: 25.3
  },
  {
    date: '2024-12-12',
    visitors: 1123,
    change: -15.6,
    peakConcurrent: 178,
    peakTime: 13,
    avgSession: 245,
    bounceRate: 41.2
  },
  {
    date: '2024-12-11',
    visitors: 1456,
    change: 3.8,
    peakConcurrent: 201,
    peakTime: 17,
    avgSession: 312,
    bounceRate: 35.9
  }
])

// 날짜 포맷팅
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  })
}

// 시간 포맷팅
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 통계 로드
const loadStats = async () => {
  try {
    loading.value = true
    
    const params = new URLSearchParams()
    params.append('period', selectedPeriod.value)
    
    if (selectedPeriod.value === 'custom') {
      params.append('startDate', customStartDate.value)
      params.append('endDate', customEndDate.value)
    }
    
    // 실시간 통계
    const realtimeResponse = await apiClient.get('/admin/stats/realtime')
    if (realtimeResponse.data.isSuccess) {
      Object.assign(realtimeStats, realtimeResponse.data.result)
    }
    
    // 상세 통계
    const detailedResponse = await apiClient.get(`/admin/stats/detailed?${params}`)
    if (detailedResponse.data.isSuccess) {
      detailedStats.value = detailedResponse.data.result
    }
    
    // 차트 데이터
    const chartResponse = await apiClient.get(`/admin/stats/chart?${params}`)
    if (chartResponse.data.isSuccess) {
      mockDailyData.value = chartResponse.data.result.daily
      mockHourlyData.value = chartResponse.data.result.hourly
    }
    
  } catch (error) {
    console.error('통계 로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// 통계 새로고침
const refreshStats = async () => {
  await loadStats()
}

// 통계 엑셀 다운로드
const exportStats = async () => {
  try {
    const params = new URLSearchParams()
    params.append('period', selectedPeriod.value)
    params.append('format', 'excel')
    
    const response = await apiClient.get(`/admin/stats/export?${params}`, {
      responseType: 'blob'
    })
    
    // 파일 다운로드
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `visitor-stats-${selectedPeriod.value}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('통계 다운로드 실패:', error)
  }
}

// 실시간 업데이트
let updateInterval = null

onMounted(() => {
  loadStats()
  
  // 1분마다 실시간 통계 업데이트
  updateInterval = setInterval(async () => {
    try {
      const response = await apiClient.get('/admin/stats/realtime')
      if (response.data.isSuccess) {
        Object.assign(realtimeStats, response.data.result)
      }
    } catch (error) {
      console.error('실시간 통계 업데이트 실패:', error)
    }
  }, 60000) // 1분
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.visitor-stats-manager {
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

.realtime-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-card.current .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.today .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.peak .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.avg .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.stat-info p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0.25rem 0;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.stat-change.positive {
  color: #059669;
}

.stat-change.negative {
  color: #dc2626;
}

.stat-time,
.stat-period {
  font-size: 0.85rem;
  color: #6b7280;
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
  display: flex;
  gap: 1rem;
  align-items: center;
}

.period-select,
.date-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn {
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
  margin-left: auto;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e5e7eb;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chart-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.chart-controls {
  display: flex;
  gap: 0.5rem;
}

.chart-type-btn {
  background: #f3f4f6;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
}

.chart-type-btn.active {
  background: #4f46e5;
  color: white;
}

.chart-placeholder {
  height: 300px;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mock-chart {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: end;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 20px;
  transition: all 0.2s ease;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-bar.hourly {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.bar-value {
  position: absolute;
  top: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: #374151;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.chart-bar:hover .bar-value {
  opacity: 1;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

.detailed-stats {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.stats-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.export-btn {
  background: #059669;
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

.stats-table {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem 2rem;
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

.visitor-count {
  font-weight: 600;
  color: #1f2937;
}

.visitor-change {
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.visitor-change.positive {
  color: #059669;
}

.visitor-change.negative {
  color: #dc2626;
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
  gap: 1rem;
  color: #6b7280;
}

.loading-spinner i {
  font-size: 2rem;
}

@media (max-width: 1200px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .realtime-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .refresh-btn {
    margin-left: 0;
    align-self: center;
  }
  
  .chart-container {
    padding: 1rem;
  }
  
  .chart-placeholder {
    height: 200px;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }
  
  .stats-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
}
</style> 