<template>
  <div class="dashboard-stats">
    <div class="stats-container">
      <div v-for="(stat, index) in stats" :key="index" 
           class="stat-card bg-gradient-to-br from-white to-blue-50 hover:shadow-lg transition-all duration-300">
        <div class="stat-icon" :class="stat.iconClass">
          <i class="fas" :class="stat.icon"></i>
        </div>
        <div class="stat-content">
          <h3 class="text-gray-800 font-medium">{{ stat.title }}</h3>
          <p class="stat-value text-gray-900 font-bold">{{ formatNumber(stat.value) }}{{ stat.unit || '' }}</p>
          <p class="stat-change" :class="stat.change >= 0 ? 'text-emerald-500' : 'text-rose-500'">
            <i class="fas" :class="stat.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i> 
            {{ Math.abs(stat.change) }}%
          </p>
        </div>
      </div>
    </div>
    
    <div class="charts-container mt-8">
      <div class="chart-card bg-white rounded-xl shadow-sm p-4 overflow-hidden">
        <h3 class="text-gray-800 font-medium mb-4">일일 방문자 통계</h3>
        <div class="chart-wrapper h-64">
          <canvas ref="visitorsChart"></canvas>
        </div>
      </div>
      
      <div class="chart-card bg-white rounded-xl shadow-sm p-4 overflow-hidden">
        <h3 class="text-gray-800 font-medium mb-4">모드별 사용자 수</h3>
        <div class="chart-wrapper h-64">
          <canvas ref="usersByModeChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Chart from 'chart.js/auto';

// Props
const props = defineProps({
  statsData: {
    type: Object,
    default: () => ({
      totalUsers: 5243,
      userChange: 12,
      activeGames: 143,
      gameChange: -5,
      newUsers: 278,
      newUserChange: 23,
      revenue: 1458000,
      revenueChange: 8
    })
  }
});

// Chart references
const visitorsChart = ref(null);
const usersByModeChart = ref(null);

// Computed stats
const stats = computed(() => [
  {
    title: '총 사용자',
    value: props.statsData.totalUsers,
    change: props.statsData.userChange,
    icon: 'fa-users',
    iconClass: 'bg-blue-100 text-blue-600'
  },
  {
    title: '활성 게임',
    value: props.statsData.activeGames,
    change: props.statsData.gameChange,
    icon: 'fa-gamepad',
    iconClass: 'bg-purple-100 text-purple-600'
  },
  {
    title: '신규 가입',
    value: props.statsData.newUsers,
    change: props.statsData.newUserChange,
    icon: 'fa-user-plus',
    iconClass: 'bg-green-100 text-green-600'
  },
  {
    title: '총 수익',
    value: props.statsData.revenue,
    change: props.statsData.revenueChange,
    icon: 'fa-coins',
    iconClass: 'bg-amber-100 text-amber-600',
    unit: '원'
  }
]);

// Format number with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Initialize charts
onMounted(() => {
  // Visitors chart data
  const visitorsData = {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [
      {
        label: '방문자 수',
        data: [120, 190, 230, 210, 250, 320, 290],
        backgroundColor: 'rgba(96, 165, 250, 0.2)',
        borderColor: 'rgba(96, 165, 250, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Users by mode chart data
  const usersByModeData = {
    labels: ['로드뷰 모드', '포토 모드', '멀티플레이어 모드', '특별 이벤트 모드'],
    datasets: [
      {
        label: '사용자 수',
        data: [2100, 1800, 1200, 143],
        backgroundColor: [
          'rgba(96, 165, 250, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(248, 113, 113, 0.7)',
          'rgba(52, 211, 153, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const lineChartOptions = {
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
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15
        }
      }
    }
  };

  // Create charts
  new Chart(visitorsChart.value, {
    type: 'line',
    data: visitorsData,
    options: lineChartOptions
  });

  new Chart(usersByModeChart.value, {
    type: 'doughnut',
    data: usersByModeData,
    options: pieChartOptions
  });
});
</script>

<style scoped>
.dashboard-stats {
  width: 100%;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(to bottom, #60a5fa, #8b5cf6);
  opacity: 0.7;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  margin: 0;
  font-size: 0.875rem;
}

.stat-value {
  margin: 0.25rem 0;
  font-size: 1.5rem;
}

.stat-change {
  margin: 0;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.chart-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1024px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-container {
    grid-template-columns: 1fr;
  }
}
</style>
