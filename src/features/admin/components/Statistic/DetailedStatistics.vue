<template>
  <div class="detailed-statistics bg-white rounded-xl shadow-sm p-6">
    <div class="section-header flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-gray-800">상세 통계</h2>
      <div class="flex space-x-3">
        <div class="date-range-picker flex items-center space-x-2">
          <div class="relative">
            <input 
              type="date" 
              v-model="dateRange.start" 
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            />
          </div>
          <span class="text-gray-500">~</span>
          <div class="relative">
            <input 
              type="date" 
              v-model="dateRange.end" 
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            />
          </div>
        </div>
        <button 
          @click="applyDateFilter" 
          class="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <i class="fas fa-filter mr-2"></i>
          <span>적용</span>
        </button>
      </div>
    </div>

    <!-- 요약 통계 카드 -->
    <div class="summary-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">총 방문자</p>
            <h3 class="text-2xl font-bold text-gray-800">{{ formatNumber(statistics.totalVisitors) }}</h3>
            <p class="text-sm" :class="statistics.visitorChange >= 0 ? 'text-green-600' : 'text-red-600'">
              <i class="fas" :class="statistics.visitorChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              {{ Math.abs(statistics.visitorChange) }}%
            </p>
          </div>
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <i class="fas fa-users text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">게임 플레이 수</p>
            <h3 class="text-2xl font-bold text-gray-800">{{ formatNumber(statistics.totalGames) }}</h3>
            <p class="text-sm" :class="statistics.gameChange >= 0 ? 'text-green-600' : 'text-red-600'">
              <i class="fas" :class="statistics.gameChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              {{ Math.abs(statistics.gameChange) }}%
            </p>
          </div>
          <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <i class="fas fa-gamepad text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">매출</p>
            <h3 class="text-2xl font-bold text-gray-800">{{ formatNumber(statistics.revenue) }}원</h3>
            <p class="text-sm" :class="statistics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'">
              <i class="fas" :class="statistics.revenueChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              {{ Math.abs(statistics.revenueChange) }}%
            </p>
          </div>
          <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <i class="fas fa-coins text-xl"></i>
          </div>
        </div>
      </div>
      
      <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">평균 체류 시간</p>
            <h3 class="text-2xl font-bold text-gray-800">{{ statistics.avgSessionTime }}분</h3>
            <p class="text-sm" :class="statistics.sessionTimeChange >= 0 ? 'text-green-600' : 'text-red-600'">
              <i class="fas" :class="statistics.sessionTimeChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
              {{ Math.abs(statistics.sessionTimeChange) }}%
            </p>
          </div>
          <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <i class="fas fa-clock text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 차트 섹션 -->
    <div class="charts-section space-y-6">
      <!-- 방문자 트렌드 차트 -->
      <div class="chart-container bg-gray-50 rounded-xl p-4 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-800">방문자 트렌드</h3>
          <div class="chart-controls flex space-x-2">
            <button 
              v-for="period in ['일간', '주간', '월간']" 
              :key="period"
              @click="visitorChartPeriod = period"
              class="px-3 py-1 text-sm rounded-lg transition-colors"
              :class="visitorChartPeriod === period ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              {{ period }}
            </button>
          </div>
        </div>
        <div class="h-64">
          <canvas ref="visitorTrendChart"></canvas>
        </div>
      </div>
      
      <!-- 게임 모드별 통계 차트 -->
      <div class="chart-container bg-gray-50 rounded-xl p-4 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-800">게임 모드별 통계</h3>
          <div class="chart-controls flex space-x-2">
            <select 
              v-model="gameModeChartType" 
              class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg border-none focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="plays">플레이 수</option>
              <option value="time">평균 플레이 시간</option>
              <option value="completion">완료율</option>
            </select>
          </div>
        </div>
        <div class="h-64">
          <canvas ref="gameModeChart"></canvas>
        </div>
      </div>
      
      <!-- 매출 분석 차트 -->
      <div class="chart-container bg-gray-50 rounded-xl p-4 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-800">매출 분석</h3>
          <div class="chart-controls flex space-x-2">
            <button 
              v-for="type in ['라인', '바']" 
              :key="type"
              @click="revenueChartType = type"
              class="px-3 py-1 text-sm rounded-lg transition-colors"
              :class="revenueChartType === type ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              {{ type }}
            </button>
          </div>
        </div>
        <div class="h-64">
          <canvas ref="revenueChart"></canvas>
        </div>
      </div>
      
      <!-- 사용자 활동 히트맵 -->
      <div class="chart-container bg-gray-50 rounded-xl p-4 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-800">시간대별 사용자 활동</h3>
          <div class="chart-legend flex items-center space-x-4">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-indigo-200 rounded-sm mr-1"></div>
              <span class="text-xs text-gray-600">낮음</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-indigo-400 rounded-sm mr-1"></div>
              <span class="text-xs text-gray-600">중간</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-indigo-600 rounded-sm mr-1"></div>
              <span class="text-xs text-gray-600">높음</span>
            </div>
          </div>
        </div>
        <div class="activity-heatmap grid grid-cols-7 gap-1">
          <div 
            v-for="(day, dayIndex) in ['일', '월', '화', '수', '목', '금', '토']" 
            :key="dayIndex"
            class="text-center text-xs text-gray-600 font-medium mb-1"
          >
            {{ day }}
          </div>
          <div 
            v-for="hour in 24" 
            :key="hour"
            class="col-span-7 grid grid-cols-7 gap-1 mb-1"
          >
            <div class="text-xs text-gray-500 text-right pr-2">{{ hour }}시</div>
            <div 
              v-for="day in 7" 
              :key="`${hour}-${day}`"
              class="h-4 rounded-sm"
              :class="getHeatmapColor(getActivityLevel(hour - 1, day - 1))"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 상세 데이터 테이블 -->
    <div class="data-table mt-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-800">상세 데이터</h3>
        <div class="flex space-x-2">
          <select 
            v-model="selectedDataType" 
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
          >
            <option value="visitors">방문자 데이터</option>
            <option value="games">게임 데이터</option>
            <option value="revenue">매출 데이터</option>
          </select>
          <button 
            @click="exportData" 
            class="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
          >
            <i class="fas fa-download mr-2"></i>
            <span>내보내기</span>
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 text-left">
              <th 
                v-for="column in getDataColumns()" 
                :key="column.key"
                class="px-4 py-3 text-sm font-medium text-gray-600"
                :class="{ 'rounded-tl-lg': column.key === getDataColumns()[0].key, 'rounded-tr-lg': column.key === getDataColumns()[getDataColumns().length - 1].key }"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(row, index) in getDataRows()" 
              :key="index"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td 
                v-for="column in getDataColumns()" 
                :key="`${index}-${column.key}`"
                class="px-4 py-3 text-sm text-gray-700"
              >
                {{ formatDataCell(row[column.key], column.key) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import Chart from 'chart.js/auto';

// 차트 참조
const visitorTrendChart = ref(null);
const gameModeChart = ref(null);
const revenueChart = ref(null);

// 차트 인스턴스
let visitorChartInstance = null;
let gameModeChartInstance = null;
let revenueChartInstance = null;

// 필터 및 차트 상태
const dateRange = reactive({
  start: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
});
const visitorChartPeriod = ref('일간');
const gameModeChartType = ref('plays');
const revenueChartType = ref('라인');
const selectedDataType = ref('visitors');

// 통계 데이터 (실제로는 API에서 가져옴)
const statistics = reactive({
  totalVisitors: 25438,
  visitorChange: 12.5,
  totalGames: 8721,
  gameChange: 8.2,
  revenue: 4582000,
  revenueChange: 15.3,
  avgSessionTime: 18,
  sessionTimeChange: -2.1,
  
  // 방문자 트렌드 데이터
  visitorTrends: {
    daily: [120, 145, 132, 158, 142, 168, 180, 175, 190, 210, 205, 220, 215, 230],
    weekly: [820, 940, 1020, 980, 1150, 1250, 1320, 1280, 1350, 1420, 1380, 1450],
    monthly: [3200, 3500, 3800, 4200, 4500, 4800, 5100, 5400, 5800, 6200, 6500, 6800]
  },
  
  // 게임 모드별 데이터
  gameModeStats: {
    plays: {
      '로드뷰 모드': 3500,
      '포토 모드': 2800,
      '멀티플레이어 모드': 1800,
      '특별 이벤트 모드': 620
    },
    time: {
      '로드뷰 모드': 22,
      '포토 모드': 15,
      '멀티플레이어 모드': 28,
      '특별 이벤트 모드': 18
    },
    completion: {
      '로드뷰 모드': 85,
      '포토 모드': 92,
      '멀티플레이어 모드': 78,
      '특별 이벤트 모드': 65
    }
  },
  
  // 매출 데이터
  revenueData: {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    values: [320000, 380000, 350000, 420000, 480000, 520000, 480000, 550000, 600000, 580000, 650000, 720000]
  },
  
  // 활동 히트맵 데이터 (24시간 x 7일)
  activityHeatmap: Array.from({ length: 24 }, () => 
    Array.from({ length: 7 }, () => Math.floor(Math.random() * 100))
  ),
  
  // 상세 데이터
  detailedData: {
    visitors: [
      { date: '2023-11-01', total: 820, new: 210, returning: 610, avgTime: 16 },
      { date: '2023-11-02', total: 845, new: 195, returning: 650, avgTime: 18 },
      { date: '2023-11-03', total: 890, new: 230, returning: 660, avgTime: 17 },
      { date: '2023-11-04', total: 920, new: 240, returning: 680, avgTime: 19 },
      { date: '2023-11-05', total: 880, new: 200, returning: 680, avgTime: 20 },
      { date: '2023-11-06', total: 910, new: 220, returning: 690, avgTime: 18 },
      { date: '2023-11-07', total: 950, new: 250, returning: 700, avgTime: 17 }
    ],
    games: [
      { date: '2023-11-01', total: 320, roadview: 150, photo: 120, multiplayer: 40, special: 10 },
      { date: '2023-11-02', total: 340, roadview: 160, photo: 130, multiplayer: 35, special: 15 },
      { date: '2023-11-03', total: 360, roadview: 170, photo: 140, multiplayer: 30, special: 20 },
      { date: '2023-11-04', total: 380, roadview: 180, photo: 150, multiplayer: 35, special: 15 },
      { date: '2023-11-05', total: 350, roadview: 160, photo: 140, multiplayer: 30, special: 20 },
      { date: '2023-11-06', total: 370, roadview: 175, photo: 145, multiplayer: 35, special: 15 },
      { date: '2023-11-07', total: 390, roadview: 185, photo: 155, multiplayer: 30, special: 20 }
    ],
    revenue: [
      { date: '2023-11-01', total: 180000, premium: 80000, items: 60000, avatars: 40000 },
      { date: '2023-11-02', total: 190000, premium: 85000, items: 65000, avatars: 40000 },
      { date: '2023-11-03', total: 200000, premium: 90000, items: 70000, avatars: 40000 },
      { date: '2023-11-04', total: 210000, premium: 95000, items: 75000, avatars: 40000 },
      { date: '2023-11-05', total: 195000, premium: 90000, items: 65000, avatars: 40000 },
      { date: '2023-11-06', total: 205000, premium: 95000, items: 70000, avatars: 40000 },
      { date: '2023-11-07', total: 215000, premium: 100000, items: 75000, avatars: 40000 }
    ]
  }
});

// 차트 초기화 및 업데이트
onMounted(() => {
  initVisitorChart();
  initGameModeChart();
  initRevenueChart();
});

// 방문자 차트 초기화
const initVisitorChart = () => {
  const ctx = visitorTrendChart.value.getContext('2d');
  
  if (visitorChartInstance) {
    visitorChartInstance.destroy();
  }
  
  const data = statistics.visitorTrends[visitorChartPeriod.value === '일간' ? 'daily' : visitorChartPeriod.value === '주간' ? 'weekly' : 'monthly'];
  const labels = Array.from({ length: data.length }, (_, i) => i + 1);
  
  visitorChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${visitorChartPeriod.value} 방문자`,
        data,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
};

// 게임 모드 차트 초기화
const initGameModeChart = () => {
  const ctx = gameModeChart.value.getContext('2d');
  
  if (gameModeChartInstance) {
    gameModeChartInstance.destroy();
  }
  
  const data = statistics.gameModeStats[gameModeChartType.value];
  const labels = Object.keys(data);
  const values = Object.values(data);
  
  const backgroundColors = [
    'rgba(79, 70, 229, 0.7)',
    'rgba(16, 185, 129, 0.7)',
    'rgba(245, 158, 11, 0.7)',
    'rgba(239, 68, 68, 0.7)'
  ];
  
  gameModeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: gameModeChartType.value === 'plays' ? '플레이 수' : 
               gameModeChartType.value === 'time' ? '평균 플레이 시간 (분)' : 
               '완료율 (%)',
        data: values,
        backgroundColor: backgroundColors
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
};

// 매출 차트 초기화
const initRevenueChart = () => {
  const ctx = revenueChart.value.getContext('2d');
  
  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }
  
  revenueChartInstance = new Chart(ctx, {
    type: revenueChartType.value === '라인' ? 'line' : 'bar',
    data: {
      labels: statistics.revenueData.labels,
      datasets: [{
        label: '매출 (원)',
        data: statistics.revenueData.values,
        borderColor: '#10b981',
        backgroundColor: revenueChartType.value === '라인' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.7)',
        tension: 0.3,
        fill: revenueChartType.value === '라인'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
};

// 차트 타입 변경 감시
watch(visitorChartPeriod, () => {
  initVisitorChart();
});

watch(gameModeChartType, () => {
  initGameModeChart();
});

watch(revenueChartType, () => {
  initRevenueChart();
});

// 날짜 필터 적용
const applyDateFilter = () => {
  // 실제로는 여기서 API 호출하여 데이터 업데이트
  console.log('날짜 필터 적용:', dateRange.start, '~', dateRange.end);
};

// 히트맵 색상 가져오기
const getHeatmapColor = (level) => {
  if (level < 30) return 'bg-indigo-200';
  if (level < 70) return 'bg-indigo-400';
  return 'bg-indigo-600';
};

// 활동 수준 가져오기
const getActivityLevel = (hour, day) => {
  return statistics.activityHeatmap[hour][day];
};

// 데이터 내보내기
const exportData = () => {
  // 실제로는 여기서 CSV 또는 Excel 파일로 내보내기
  console.log('데이터 내보내기:', selectedDataType.value);
};

// 데이터 테이블 컬럼 가져오기
const getDataColumns = () => {
  switch (selectedDataType.value) {
    case 'visitors':
      return [
        { key: 'date', label: '날짜' },
        { key: 'total', label: '총 방문자' },
        { key: 'new', label: '신규 방문자' },
        { key: 'returning', label: '재방문자' },
        { key: 'avgTime', label: '평균 체류 시간 (분)' }
      ];
    case 'games':
      return [
        { key: 'date', label: '날짜' },
        { key: 'total', label: '총 게임 수' },
        { key: 'roadview', label: '로드뷰 모드' },
        { key: 'photo', label: '포토 모드' },
        { key: 'multiplayer', label: '멀티플레이어 모드' },
        { key: 'special', label: '특별 이벤트 모드' }
      ];
    case 'revenue':
      return [
        { key: 'date', label: '날짜' },
        { key: 'total', label: '총 매출' },
        { key: 'premium', label: '프리미엄 멤버십' },
        { key: 'items', label: '아이템' },
        { key: 'avatars', label: '아바타' }
      ];
    default:
      return [];
  }
};

// 데이터 행 가져오기
const getDataRows = () => {
  return statistics.detailedData[selectedDataType.value];
};

// 데이터 셀 포맷팅
const formatDataCell = (value, key) => {
  if (key === 'date') return value;
  if (key === 'avgTime') return `${value}분`;
  if (key === 'total' && selectedDataType.value === 'revenue') return `${formatNumber(value)}원`;
  if (key === 'premium' || key === 'items' || key === 'avatars') return `${formatNumber(value)}원`;
  return formatNumber(value);
};

// 숫자 포맷팅
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
</script>
