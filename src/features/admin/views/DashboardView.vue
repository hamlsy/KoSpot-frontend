<template>
  <div class="admin-page bg-gray-50 min-h-screen">
    <TheHeader />
    <div class="admin-content px-4 py-6 max-w-7xl mx-auto">
      <AdminPanel>
        <div class="admin-dashboard">
          <h1 class="dashboard-title text-2xl font-bold text-gray-800 mb-6">🛠️ 관리자 대시보드</h1>
          
          네비게이션 탭
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
                @click="activeSection = 'shop'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'shop' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-shopping-cart mr-2"></i>
                <span>상점 관리</span>
                <div v-if="activeSection === 'shop'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
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
              <button 
                @click="activeSection = 'test-lab'" 
                class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
                :class="activeSection === 'test-lab' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
              >
                <i class="fas fa-flask mr-2"></i>
                <span>🧪 테스트 실험실</span>
                <div v-if="activeSection === 'test-lab'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></div>
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
          
          <!-- 상점 관리 섹션 -->
          <div v-if="activeSection === 'shop'">
            <ShopManager />
          </div>
          
          <!-- 접속자 통계 섹션 -->
          <div v-if="activeSection === 'statistics'">
            <VisitorStatsManager />
          </div>
          
          <!-- 테스트 실험실 섹션 -->
          <div v-if="activeSection === 'test-lab'">
            <div class="test-lab-section bg-white rounded-lg shadow-sm p-6">
              <h2 class="text-xl font-bold text-gray-800 mb-4">🧪 테스트 실험실</h2>
              <p class="text-gray-600 mb-6">다양한 CSS 스타일과 화면 레이아웃을 테스트할 수 있습니다.</p>
              
              <!-- 랭크 티어 변화 테스트 -->
              <div class="test-section mb-8">
                <h3 class="text-lg font-semibold text-gray-700 mb-4">
                  <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                  랭크 티어 변화 테스트
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    @click="openRankTestModal('BRONZE', 'THREE', 'BRONZE', 'TWO')"
                    class="test-button bronze"
                  >
                    <i class="fas fa-arrow-up mr-2"></i>
                    브론즈 3 → 브론즈 2
                  </button>
                  <button 
                    @click="openRankTestModal('SILVER', 'FIVE', 'GOLD', 'FIVE')"
                    class="test-button gold"
                  >
                    <i class="fas fa-trophy mr-2"></i>
                    실버 5 → 골드 5 🎉
                  </button>
                  <button 
                    @click="openRankTestModal('GOLD', 'TWO', 'PLATINUM', 'ONE')"
                    class="test-button platinum"
                  >
                    <i class="fas fa-trophy mr-2"></i>
                    골드 2 → 플래티넘 1 🎉
                  </button>
                  <button 
                    @click="openRankTestModal('DIAMOND', 'THREE', 'DIAMOND', 'THREE')"
                    class="test-button diamond"
                  >
                    <i class="fas fa-minus mr-2"></i>
                    다이아 3 → 다이아 3 (변화없음)
                  </button>
                </div>
              </div>
              
              <!-- 더미 데이터 생성 테스트 -->
              <div class="test-section mb-8">
                <h3 class="text-lg font-semibold text-gray-700 mb-4">
                  <i class="fas fa-database text-blue-500 mr-2"></i>
                  더미 데이터 생성
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button class="test-button secondary">
                    <i class="fas fa-users mr-2"></i>
                    100명 랜덤 플레이어 생성
                  </button>
                  <button class="test-button secondary">
                    <i class="fas fa-map-marked-alt mr-2"></i>
                    50개 랜덤 좌표 생성
                  </button>
                </div>
              </div>
              
              <!-- UI 컴포넌트 미리보기 -->
              <div class="test-section">
                <h3 class="text-lg font-semibold text-gray-700 mb-4">
                  <i class="fas fa-paint-brush text-purple-500 mr-2"></i>
                  UI 컴포넌트 미리보기
                </h3>
                <div class="component-preview-grid">
                  <div class="preview-card">
                    <h4>버튼 스타일</h4>
                    <div class="preview-content">
                      <button class="btn-primary">Primary</button>
                      <button class="btn-secondary">Secondary</button>
                      <button class="btn-danger">Danger</button>
                    </div>
                  </div>
                  <div class="preview-card">
                    <h4>카드 레이아웃</h4>
                    <div class="preview-content">
                      <div class="sample-card">
                        <p>Sample Card Content</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
import ShopManager from '@/features/admin/components/Shop/ShopManager.vue'
import GameResultsManager from '@/features/admin/components/Analytics/GameResultsManager.vue'
import VisitorStatsManager from '@/features/admin/components/Analytics/VisitorStatsManager.vue'

// 활성 섹션
const activeSection = ref('game-modes')

// 게임 모드 토글 핸들러
const handleGameModeToggle = (mode) => {
  console.log('게임 모드 토글:', mode)
  // API 호출 로직 추가
}

// 랭크 티어 변화 테스트
const openRankTestModal = (prevTier, prevLevel, currTier, currLevel) => {
  console.log('🧪 테스트 데이터:', {
    이전랭크: `${prevTier} ${prevLevel}`,
    현재랭크: `${currTier} ${currLevel}`
  });
  
  // 실제 구현 시 RankView 컴포넌트나 결과 오버레이를 모달로 띄우는 로직 추가
  alert(`티어 변화 테스트:\n${prevTier} ${prevLevel} → ${currTier} ${currLevel}\n\n콘솔을 확인하세요.`);
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

/* 테스트 실험실 스타일 */
.test-lab-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.test-section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 2rem;
}

.test-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.test-button {
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.test-button.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #8b5a2b 100%);
  color: white;
}

.test-button.gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
}

.test-button.platinum {
  background: linear-gradient(135deg, #e5e4e2 0%, #b4b4b4 100%);
  color: #333;
}

.test-button.diamond {
  background: linear-gradient(135deg, #b9f2ff 0%, #7dd3fc 100%);
  color: #333;
}

.test-button.secondary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.component-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.preview-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.preview-card h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.preview-content {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.sample-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sample-card p {
  margin: 0;
  color: #6b7280;
}
</style>