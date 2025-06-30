<template>
  <div class="admin-page bg-gray-50 min-h-screen">
    <TheHeader />
    <div class="admin-content px-4 py-6 max-w-7xl mx-auto">
      <AdminPanel>
        <div class="admin-dashboard">
          <h1 class="dashboard-title text-2xl font-bold text-gray-800 mb-6">🛠️ 관리자 대시보드</h1>
          
          <!-- 네비게이션 탭 -->
          <div class="admin-nav mb-6">
            <div class="flex border-b border-gray-200 overflow-x-auto pb-1">
              <button 
                @click="activeSection = 'game-modes'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'game-modes' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-gamepad mr-2"></i>
                <span>게임 모드 관리</span>
                <div v-if="activeSection === 'game-modes'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
              </button>
              <button 
                @click="activeSection = 'roadview'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'roadview' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-street-view mr-2"></i>
                <span>로드뷰 관리</span>
                <div v-if="activeSection === 'roadview'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
              </button>
              <button 
                @click="activeSection = 'photo'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'photo' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-camera mr-2"></i>
                <span>포토 관리</span>
                <div v-if="activeSection === 'photo'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
              </button>
              <button 
                @click="activeSection = 'theme'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'theme' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-palette mr-2"></i>
                <span>테마 관리</span>
                <div v-if="activeSection === 'theme'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
              </button>
              <button 
                @click="activeSection = 'users'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'users' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-users mr-2"></i>
                <span>플레이어 관리</span>
                <div v-if="activeSection === 'users'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
              </button>
              <button 
                @click="activeSection = 'banner'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'banner' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-image mr-2"></i>
                <span>배너 관리</span>
                <div v-if="activeSection === 'banner'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
              </button>
              <button 
                @click="activeSection = 'play-results'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'play-results' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-chart-line mr-2"></i>
                <span>플레이 결과</span>
                <div v-if="activeSection === 'play-results'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
              </button>
              <button 
                @click="activeSection = 'statistics'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'statistics' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-analytics mr-2"></i>
                <span>접속자 통계</span>
                <div v-if="activeSection === 'statistics'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
              </button>
            </div>
          </div>
          
          <!-- 게임 모드 관리 섹션 -->
          <div v-if="activeSection === 'game-modes'">
            <GameModeToggleManager @toggle-mode="handleGameModeToggle" />
          </div>
          
          <!-- 로드뷰 관리 섹션 -->
          <div v-if="activeSection === 'roadview'">
            <RoadviewManager />
          </div>
          
          <!-- 포토 관리 섹션 -->
          <div v-if="activeSection === 'photo'">
            <PhotoManager />
          </div>
          
          <!-- 테마 관리 섹션 -->
          <div v-if="activeSection === 'theme'">
            <ThemeManager />
          </div>
          
          <!-- 플레이어 관리 섹션 -->
          <div v-if="activeSection === 'users'">
            <PlayerManager />
          </div>
          
          <!-- 배너 관리 섹션 -->
          <div v-if="activeSection === 'banner'">
            <BannerManager />
          </div>
          
          <!-- 플레이 결과 관리 섹션 -->
          <div v-if="activeSection === 'play-results'">
            <GameResultsManager />
          </div>
          
          <!-- 접속자 통계 섹션 -->
          <div v-if="activeSection === 'statistics'">
            <VisitorStatsManager />
          </div>
        </div>
      </AdminPanel>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminPanel from '@/features/admin/components/AdminPanel.vue'
import TheHeader from '@/core/components/TheHeader.vue'
import GameModeToggleManager from '@/features/admin/components/Game/GameModeToggleManager.vue'
import RoadviewManager from '@/features/admin/components/Game/RoadviewManager.vue'
import PhotoManager from '@/features/admin/components/Game/PhotoManager.vue'
import ThemeManager from '@/features/admin/components/Game/ThemeManager.vue'
import PlayerManager from '@/features/admin/components/User/PlayerManager.vue'
import BannerManager from '@/features/admin/components/Banner/BannerManager.vue'
import GameResultsManager from '@/features/admin/components/Analytics/GameResultsManager.vue'
import VisitorStatsManager from '@/features/admin/components/Analytics/VisitorStatsManager.vue'

// 활성 섹션
const activeSection = ref('game-modes')

// 게임 모드 토글 핸들러
const handleGameModeToggle = (mode) => {
  console.log('게임 모드 토글:', mode)
  // API 호출 로직 추가
}
</script>

<style scoped>
.admin-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.admin-nav button {
  position: relative;
  transition: all 0.2s ease;
}

.admin-nav button:hover {
  background-color: rgba(79, 70, 229, 0.05);
}

.admin-nav button i {
  transition: transform 0.2s ease;
}

.admin-nav button:hover i {
  transform: scale(1.1);
}
</style>