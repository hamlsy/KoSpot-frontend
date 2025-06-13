<template>
  <div class="admin-page bg-gray-50 min-h-screen">
    <TheHeader />
    <div class="admin-content px-4 py-6 max-w-7xl mx-auto">
      <AdminPanel>
        <div class="admin-dashboard">
          <h1 class="dashboard-title text-2xl font-bold text-gray-800 mb-6">관리자 대시보드</h1>
          
          <!-- 네비게이션 탭 -->
          <div class="admin-nav mb-6">
            <div class="flex border-b border-gray-200 overflow-x-auto pb-1">
              <button 
                @click="activeSection = 'main'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
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
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
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
                @click="activeSection = 'game-management'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'game-management' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-gamepad mr-2"></i>
                <span>게임 관리</span>
                <div 
                  v-if="activeSection === 'game-management'" 
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
                ></div>
              </button>
              <button 
                @click="activeSection = 'shop-management'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'shop-management' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-store mr-2"></i>
                <span>상점 관리</span>
                <div 
                  v-if="activeSection === 'shop-management'" 
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
                ></div>
              </button>
              <button 
                @click="activeSection = 'user-management'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'user-management' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-users-cog mr-2"></i>
                <span>사용자 관리</span>
                <div 
                  v-if="activeSection === 'user-management'" 
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
                ></div>
              </button>
              <button 
                @click="activeSection = 'settings'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
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
          
          <!-- 게임 관리 섹션 -->
          <div v-if="activeSection === 'game-management'">
            <GameModeManagement 
              :initial-game-modes="gameModes" 
              @toggle-mode="handleGameModeToggle" 
              @open-settings="openGameModeSettings"
            />
          </div>
          
          <!-- 상점 관리 섹션 -->
          <div v-if="activeSection === 'shop-management'">
            <ShopManagement />
          </div>
          
          <!-- 사용자 관리 섹션 -->
          <div v-if="activeSection === 'user-management'">
            <UserManagement />
          </div>
          
          <!-- 시스템 설정 섹션 -->
          <div v-if="activeSection === 'settings'">
            <SystemSettings />
          </div>
        </div>
      </AdminPanel>
      
      <!-- 게임 모드 설정 모달 -->
      <div v-if="showSettingsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
          <div class="p-6 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-gray-800">
                {{ currentGameMode ? currentGameMode.name + ' 설정' : '게임 모드 설정' }}
              </h2>
              <button 
                @click="closeSettingsModal" 
                class="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="p-6">
            <GameModeSettings 
              v-if="currentGameMode" 
              :game-mode="currentGameMode" 
              @settings-change="handleSettingsChange"
            />
          </div>
          <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button 
              @click="closeSettingsModal" 
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button 
              @click="saveGameModeSettings()" 
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import AdminPanel from '../components/AdminPanel.vue';
import TheHeader from '@/components/layout/TheHeader.vue';
import DashboardStats from '../components/Statistic/DashboardStats.vue';
import RecentActivities from '../components/Statistic/RecentActivities.vue';
import QuickActions from '../components/Statistic/QuickActions.vue';
import SystemStatus from '../components/System/SystemStatus.vue';
import GameModeManagement from '../components/Game/GameModeManagement.vue';
import DetailedStatistics from '../components/Statistic/DetailedStatistics.vue';
import SystemSettings from '../components/System/SystemSettings.vue';
import ShopManagement from '../components/Shop/ShopManagement.vue';
import UserManagement from '../components/User/UserManagement.vue';
import GameModeSettings from '../components/Game/GameModeSettings.vue';

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

// 게임 모드 설정 모달 상태
const showSettingsModal = ref(false);
const currentGameMode = ref(null);
const currentSettings = ref({});

// 게임 모드 설정 열기
const openGameModeSettings = (mode) => {
  currentGameMode.value = mode;
  showSettingsModal.value = true;
  // 실제 구현에서는 여기서 API를 통해 현재 설정을 가져옴
  console.log(`${mode.name} 설정 열기`);
  
  // 임시 데이터 - 실제로는 API에서 가져와야 함
  currentSettings.value = {
    timeLimit: 300,
    roundCount: 5,
    difficultyLevel: 'medium',
    allowHints: true
  };
};

// 게임 모드 설정 모달 닫기
const closeSettingsModal = () => {
  showSettingsModal.value = false;
  currentSettings.value = {};
};

// 설정 변경 처리
const handleSettingsChange = (mode, settings) => {
  console.log(`설정 변경 감지:`, mode, settings);
  currentSettings.value = { ...currentSettings.value, ...settings };
};

// 게임 모드 설정 저장
const saveGameModeSettings = () => {
  if (!currentGameMode.value) return;
  
  const mode = currentGameMode.value;
  console.log(`${mode.id} 모드 설정 저장:`, currentSettings.value);
  
  // 여기서 API 호출을 통해 설정 저장
  // 예: api.saveGameModeSettings(mode.id, currentSettings.value)
  
  // 활동 기록 추가
  recentActivities.value.unshift({
    type: 'system',
    text: `${mode.name} 설정이 업데이트되었습니다.`,
    time: new Date()
  });
  
  // 최대 활동 기록 개수 제한
  if (recentActivities.value.length > 10) {
    recentActivities.value.pop();
  }
  
  closeSettingsModal();
};

// 활성 섹션 상태
const activeSection = ref('main');

// URL 쿼리 파라미터에서 섹션 가져오기
const route = useRoute();

// 라우트 변경 감지 및 섹션 업데이트
watchEffect(() => {
  const sectionParam = route.query.section;
  if (sectionParam) {
    activeSection.value = sectionParam;
  }
});
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