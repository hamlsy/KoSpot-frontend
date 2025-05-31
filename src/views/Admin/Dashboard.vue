<template>
  <div class="admin-page bg-gray-50 min-h-screen">
    <TheHeader />
    <div class="admin-content px-4 py-6 max-w-7xl mx-auto">
      <AdminPanel>
        <div class="admin-dashboard">
          <h1 class="dashboard-title text-2xl font-bold text-gray-800 mb-6">관리자 대시보드</h1>
          
          <!-- 네비게이션 탭 -->
          <div class="admin-nav mb-6">
            <div class="flex border-b border-gray-200">
              <button 
                @click="activeSection = 'main'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative"
                :class="activeSection === 'main' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-tachometer-alt mr-2"></i>
                <span>메인 대시보드</span>
                <div 
                  v-if="activeSection === 'main'" 
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
                ></div>
              </button>
              <button 
                @click="activeSection = 'statistics'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative"
                :class="activeSection === 'statistics' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-chart-line mr-2"></i>
                <span>상세 통계</span>
                <div 
                  v-if="activeSection === 'statistics'" 
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
                ></div>
              </button>
              <button 
                @click="activeSection = 'settings'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative"
                :class="activeSection === 'settings' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-cog mr-2"></i>
                <span>시스템 설정</span>
                <div 
                  v-if="activeSection === 'settings'" 
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
                ></div>
              </button>
            </div>
          </div>
          
          <!-- 메인 대시보드 섹션 -->
          <div v-if="activeSection === 'main'">
            <!-- 통계 컴포넌트 -->
            <DashboardStats :stats-data="stats" />
            
            <div class="admin-sections grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <!-- 최근 활동 컴포넌트 -->
              <RecentActivities :activities="recentActivities" />
              
              <!-- 빠른 작업 컴포넌트 -->
              <QuickActions />
            </div>
            
            <!-- 시스템 상태 컴포넌트 -->
            <div class="mt-6">
              <SystemStatus />
            </div>
            
            <!-- 게임 모드 관리 컴포넌트 -->
            <div class="mt-6">
              <GameModeManagement 
                :initial-game-modes="gameModes" 
                @toggle-mode="handleGameModeToggle" 
                @open-settings="openGameModeSettings"
              />
            </div>
          </div>
          
          <!-- 상세 통계 섹션 -->
          <div v-if="activeSection === 'statistics'">
            <DetailedStatistics />
          </div>
          
          <!-- 시스템 설정 섹션 -->
          <div v-if="activeSection === 'settings'">
            <SystemSettings />
          </div>
        </div>
      </AdminPanel>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import AdminPanel from '@/components/admin/AdminPanel.vue';
import TheHeader from '@/components/layout/TheHeader.vue';
import DashboardStats from './components/DashboardStats.vue';
import RecentActivities from './components/RecentActivities.vue';
import QuickActions from './components/QuickActions.vue';
import SystemStatus from './components/SystemStatus.vue';
import GameModeManagement from './components/GameModeManagement.vue';
import DetailedStatistics from './components/DetailedStatistics.vue';
import SystemSettings from './components/SystemSettings.vue';

// 통계 데이터
const stats = reactive({
  totalUsers: 5243,
  userChange: 12,
  activeGames: 143,
  gameChange: -5,
  newUsers: 278,
  newUserChange: 23,
  revenue: 1458000,
  revenueChange: 8
});

// 게임 모드 데이터
const gameModes = ref([
  {
    id: 'roadview',
    name: '로드뷰 모드',
    description: '실제 거리를 둘러보며 위치를 맞추는 게임',
    icon: 'fa-street-view',
    color: 'roadview-color',
    isActive: true
  },
  {
    id: 'photo',
    name: '포토 모드',
    description: '관광지 사진으로 지역을 맞히는 게임',
    icon: 'fa-camera',
    color: 'photo-color',
    isActive: true
  },
  {
    id: 'multiplayer',
    name: '멀티플레이어 모드',
    description: '다른 플레이어들과 함께 즐기는 게임',
    icon: 'fa-users',
    color: 'multiplayer-color',
    isActive: true
  },
  {
    id: 'special',
    name: '특별 이벤트 모드',
    description: '시즌별 특별 이벤트 게임',
    icon: 'fa-star',
    color: 'special-color',
    isActive: false
  }
]);

// 최근 활동 데이터
const recentActivities = ref([
  { 
    type: 'user', 
    text: '김민준님이 회원가입했습니다.', 
    time: new Date(new Date().getTime() - 5 * 60000) 
  },
  { 
    type: 'game', 
    text: '새로운 멀티플레이어 게임이 시작되었습니다.', 
    time: new Date(new Date().getTime() - 12 * 60000) 
  },
  { 
    type: 'purchase', 
    text: '이서연님이 프리미엄 아이템을 구매했습니다.', 
    time: new Date(new Date().getTime() - 45 * 60000) 
  },
  { 
    type: 'system', 
    text: '시스템 업데이트가 완료되었습니다.', 
    time: new Date(new Date().getTime() - 120 * 60000) 
  },
  { 
    type: 'warning', 
    text: '비정상적인 로그인 시도가 감지되었습니다.', 
    time: new Date(new Date().getTime() - 180 * 60000) 
  }
]);

// 게임 모드 토글 핸들러
const handleGameModeToggle = (mode) => {
  // 실제 환경에서는 여기서 API 호출을 통해 서버에 상태 변경을 알림
  
  // 활동 기록 추가
  recentActivities.value.unshift({
    type: 'system',
    text: `${mode.name}이(가) ${mode.isActive ? '활성화' : '비활성화'}되었습니다.`,
    time: new Date()
  });
  
  // 최대 활동 기록 개수 제한
  if (recentActivities.value.length > 10) {
    recentActivities.value.pop();
  }
};

// 게임 모드 설정 열기
const openGameModeSettings = (mode) => {
  // 게임 모드별 설정 페이지로 이동하거나 모달 열기 등의 로직
  console.log(`${mode.name} 설정 열기`);
};

// 활성 섹션 관리 (메인 대시보드, 상세 통계, 시스템 설정)
const activeSection = ref('main');
</script>

<style scoped>
/* 게임 모드 관리 스타일 */
.game-mode-management {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.game-modes-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.game-mode-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.mode-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.roadview-color {
  background: #dbeafe;
  color: #2563eb;
}

.photo-color {
  background: #dcfce7;
  color: #16a34a;
}

.multiplayer-color {
  background: #fef3c7;
  color: #d97706;
}

.special-color {
  background: #f5d0fe;
  color: #c026d3;
}

.mode-details h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}

.mode-details p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #64748b;
}

.mode-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-status {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.mode-status.active {
  color: #10b981;
}

/* Toggle Switch 스타일 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #10b981;
}

input:focus + .slider {
  box-shadow: 0 0 1px #10b981;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

@media (max-width: 768px) {
  .game-mode-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .mode-actions {
    width: 100%;
    justify-content: space-between;
  }
}

/* 기존 스타일 유지 */
.admin-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.admin-content {
  padding-top: 80px; /* 네비게이션바 높이만큼 여백 */
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* 나머지 기존 스타일 유지 */
</style>