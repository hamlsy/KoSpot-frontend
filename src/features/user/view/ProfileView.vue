<template>
  <div class="profile-page">
    <NavigationBar />
    
    <div class="profile-content">
      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>프로필을 불러오는 중...</span>
        </div>
      </div>

      <!-- 프로필 컨테이너 -->
      <div v-else class="profile-container">
        <!-- 프로필 헤더 -->
        <div class="profile-header">
          <div class="profile-avatar-section">
            <div class="profile-avatar">
              <img :src="profile.profileImageUrl || '/assets/avatars/default.png'" :alt="profile.nickname">
              <button class="edit-avatar-btn" @click="editAvatar">
              <i class="fas fa-camera"></i>
            </button>
          </div>
          
          <div class="profile-info">
              <h1 class="profile-nickname">{{ profile.nickname }}</h1>
              <p class="profile-email">{{ profile.email }}</p>
              
              <!-- 가입일 & 마지막 플레이 -->
              <div class="profile-dates">
                <span class="date-item">
                  <i class="fas fa-calendar-alt"></i>
                  가입: {{ formatDate(profile.joinedAt) }}
                </span>
                <span class="date-item">
                  <i class="fas fa-clock"></i>
                  최근: {{ formatDate(profile.lastPlayedAt) }}
                </span>
              </div>
                </div>
              </div>
              
          <!-- 연속 플레이 스트릭 -->
          <div class="streak-section">
            <div class="streak-card" :class="{ 'streak-active': profile.currentStreak > 0 }">
              <div class="streak-icon">
                <i class="fas fa-fire" :class="{ 'fire-active': profile.currentStreak > 0 }"></i>
                </div>
              <div class="streak-content">
                <div class="streak-value">{{ profile.currentStreak }}일</div>
                <div class="streak-label">연속 플레이</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 포인트 & 인벤토리 섹션 -->
        <div class="point-inventory-section">
          <div class="point-card">
            <div class="point-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="point-details">
              <div class="point-label">보유 포인트</div>
              <div class="point-value">{{ formatNumber(profile.currentPoint) }}P</div>
            </div>
          </div>

          <button class="inventory-button" @click="showInventoryModal = true">
            <i class="fas fa-box"></i>
            <span>인벤토리</span>
          </button>
        </div>

        <!-- 통계 섹션 -->
        <div class="statistics-section">
          <h2 class="section-title">
            <i class="fas fa-chart-line"></i>
            게임 통계
          </h2>

          <!-- 모드 탭 -->
          <div class="mode-tabs">
            <button 
              v-for="tab in modeTabs" 
              :key="tab.id"
              class="mode-tab"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <i :class="tab.icon"></i>
              {{ tab.label }}
              </button>
            </div>
            
          <!-- 전체 통계 -->
          <div v-if="activeTab === 'overall'" class="tab-content">
            <!-- 전체 랭크 카드 -->
            <div class="rank-card-inline">
              <div class="rank-icon">{{ rankInfo.icon }}</div>
              <div class="rank-details">
                <div class="rank-tier">
                  전체 랭크: {{ rankInfo.name }} {{ getRankLevel(profile.rankInfo.rankLevel) }}
                </div>
                <div class="rank-rating">{{ formatNumber(profile.rankInfo.ratingScore) }} RP</div>
                <div class="rank-percentage">상위 {{ profile.rankInfo.rankPercentage }}%</div>
              </div>
              </div>
              
            <div class="best-score-card">
              <div class="best-score-icon">
                <i class="fas fa-trophy"></i>
                </div>
              <div class="best-score-content">
                <div class="best-score-label">전체 최고 점수</div>
                <div class="best-score-value">{{ formatNumber(profile.statistics.bestScore) }}</div>
                </div>
              </div>

            <div class="overall-stats">
              <div class="overall-stat-card">
                <div class="overall-stat-icon">
                  <i class="fas fa-gamepad"></i>
            </div>
                <div class="overall-stat-info">
                  <div class="overall-stat-value">{{ getTotalGames() }}</div>
                  <div class="overall-stat-label">총 게임 수</div>
          </div>
        </div>
        
              <div class="overall-stat-card">
                <div class="overall-stat-icon">
                  <i class="fas fa-star"></i>
                </div>
                <div class="overall-stat-info">
                  <div class="overall-stat-value">{{ getAverageScore() }}</div>
                  <div class="overall-stat-label">평균 점수</div>
                </div>
              </div>
            </div>
          </div>
        
          <!-- 로드뷰 통계 -->
          <div v-if="activeTab === 'roadview'" class="tab-content">
            <!-- 로드뷰 랭크 카드 -->
            <div class="rank-card-inline">
              <div class="rank-icon">{{ rankInfo.icon }}</div>
              <div class="rank-details">
                <div class="rank-tier">
                  로드뷰 랭크: {{ rankInfo.name }} {{ getRankLevel(profile.rankInfo.rankLevel) }}
                </div>
                <div class="rank-rating">{{ formatNumber(profile.rankInfo.ratingScore) }} RP</div>
                <div class="rank-percentage">상위 {{ profile.rankInfo.rankPercentage }}%</div>
              </div>
            </div>

            <div class="best-score-card">
              <div class="best-score-icon">
                <i class="fas fa-street-view"></i>
              </div>
              <div class="best-score-content">
                <div class="best-score-label">로드뷰 최고 점수</div>
                <div class="best-score-value">{{ formatNumber(profile.statistics.bestScore) }}</div>
              </div>
            </div>

            <!-- 싱글 게임 통계 -->
            <div class="game-stats-container">
            <div class="game-stats-card">
              <h3 class="stats-title">
                <i class="fas fa-user"></i>
                싱글 게임
              </h3>
              
            <div class="stats-grid">
                <!-- 연습 모드 -->
                <div class="stat-item">
                  <div class="stat-header">
                    <i class="fas fa-dumbbell"></i>
                    <span>연습 모드</span>
              </div>
                  <div class="stat-details">
                    <div class="stat-row">
                      <span class="stat-label">게임 수</span>
                      <span class="stat-value">{{ formatNumber(profile.statistics.singleGame.practice.totalGames) }}</span>
              </div>
                    <div class="stat-row">
                      <span class="stat-label">평균 점수</span>
                      <span class="stat-value">{{ formatNumber(profile.statistics.singleGame.practice.averageScore) }}</span>
              </div>
                  </div>
                </div>

                <!-- 랭크 모드 -->
                <div class="stat-item">
                  <div class="stat-header">
                    <i class="fas fa-medal"></i>
                    <span>랭크 모드</span>
                  </div>
                  <div class="stat-details">
                    <div class="stat-row">
                      <span class="stat-label">게임 수</span>
                      <span class="stat-value">{{ formatNumber(profile.statistics.singleGame.rank.totalGames) }}</span>
                    </div>
                    <div class="stat-row">
                      <span class="stat-label">평균 점수</span>
                      <span class="stat-value">{{ formatNumber(profile.statistics.singleGame.rank.averageScore) }}</span>
                    </div>
                  </div>
              </div>
            </div>
          </div>
          
            <!-- 멀티 게임 통계 -->
            <div class="game-stats-card">
              <h3 class="stats-title">
                <i class="fas fa-users"></i>
                멀티플레이 로드뷰
              </h3>
              
              <div class="stats-grid">
                <div class="stat-item full-width">
                  <div class="stat-row">
                    <span class="stat-label">총 게임 수</span>
                    <span class="stat-value">{{ formatNumber(profile.statistics.multiGame.totalGames) }}</span>
            </div>
                  <div class="stat-row">
                    <span class="stat-label">평균 점수</span>
                    <span class="stat-value">{{ formatNumber(profile.statistics.multiGame.averageScore) }}</span>
                  </div>
                </div>

                <!-- 순위별 횟수 -->
                <div class="rank-counts">
                  <div class="rank-count-item first">
                    <div class="rank-count-icon">🥇</div>
                    <div class="rank-count-value">{{ formatNumber(profile.statistics.multiGame.firstPlaceCount) }}</div>
                    <div class="rank-count-label">1위</div>
                  </div>
                  <div class="rank-count-item second">
                    <div class="rank-count-icon">🥈</div>
                    <div class="rank-count-value">{{ formatNumber(profile.statistics.multiGame.secondPlaceCount) }}</div>
                    <div class="rank-count-label">2위</div>
                  </div>
                  <div class="rank-count-item third">
                    <div class="rank-count-icon">🥉</div>
                    <div class="rank-count-value">{{ formatNumber(profile.statistics.multiGame.thirdPlaceCount) }}</div>
                    <div class="rank-count-label">3위</div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
          
          <!-- 포토 모드 통계 -->
          <div v-if="activeTab === 'photo'" class="tab-content">
            <div class="coming-soon">
              <i class="fas fa-camera"></i>
              <h3>포토 모드 통계</h3>
              <p>포토 모드는 곧 오픈 예정입니다</p>
                </div>
                </div>

          <!-- 멀티플레이 전체 통계 -->
          <div v-if="activeTab === 'multiplayer'" class="tab-content">
            <!-- 멀티플레이 랭크 카드 -->
            <div class="rank-card-inline">
              <div class="rank-icon">{{ rankInfo.icon }}</div>
              <div class="rank-details">
                <div class="rank-tier">
                  멀티플레이 랭크: {{ rankInfo.name }} {{ getRankLevel(profile.rankInfo.rankLevel) }}
              </div>
                <div class="rank-rating">{{ formatNumber(profile.rankInfo.ratingScore) }} RP</div>
                <div class="rank-percentage">상위 {{ profile.rankInfo.rankPercentage }}%</div>
            </div>
          </div>

            <div class="best-score-card">
              <div class="best-score-icon">
                <i class="fas fa-users"></i>
        </div>
              <div class="best-score-content">
                <div class="best-score-label">멀티플레이 최고 점수</div>
                <div class="best-score-value">{{ formatNumber(profile.statistics.multiGame.averageScore) }}</div>
      </div>
            </div>

            <div class="multiplayer-stats">
              <h3 class="stats-title">
                <i class="fas fa-trophy"></i>
                랭킹 기록
              </h3>
              
              <div class="rank-counts">
                <div class="rank-count-item first">
                  <div class="rank-count-icon">🥇</div>
                  <div class="rank-count-value">{{ formatNumber(profile.statistics.multiGame.firstPlaceCount) }}</div>
                  <div class="rank-count-label">1위</div>
        </div>
                <div class="rank-count-item second">
                  <div class="rank-count-icon">🥈</div>
                  <div class="rank-count-value">{{ formatNumber(profile.statistics.multiGame.secondPlaceCount) }}</div>
                  <div class="rank-count-label">2위</div>
      </div>
                <div class="rank-count-item third">
                  <div class="rank-count-icon">🥉</div>
                  <div class="rank-count-value">{{ formatNumber(profile.statistics.multiGame.thirdPlaceCount) }}</div>
                  <div class="rank-count-label">3위</div>
                </div>
              </div>

              <div class="stat-item full-width" style="margin-top: 1rem;">
                <div class="stat-row">
                  <span class="stat-label">총 게임 수</span>
                  <span class="stat-value">{{ formatNumber(profile.statistics.multiGame.totalGames) }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">평균 점수</span>
                  <span class="stat-value">{{ formatNumber(profile.statistics.multiGame.averageScore) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 에러 토스트 -->
    <div v-if="showToast" class="toast-notification">
      {{ toastMessage }}
    </div>

    <!-- 인벤토리 모달 -->
    <transition name="modal-fade">
      <div v-if="showInventoryModal" class="modal-overlay" @click="showInventoryModal = false">
        <div class="inventory-modal" @click.stop>
          <div class="modal-header">
            <h3>
              <i class="fas fa-box"></i>
              내 인벤토리
            </h3>
            <button class="modal-close" @click="showInventoryModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="inventory-tabs">
              <button 
                v-for="tab in inventoryTabs" 
                :key="tab.id"
                class="inventory-tab"
                :class="{ active: activeInventoryTab === tab.id }"
                @click="activeInventoryTab = tab.id"
              >
                <i :class="tab.icon"></i>
                {{ tab.label }}
              </button>
            </div>

            <!-- 로딩 중 -->
            <div v-if="isLoadingInventory" class="inventory-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <span>인벤토리를 불러오는 중...</span>
            </div>

            <!-- 인벤토리 그리드 -->
            <div v-else class="inventory-grid">
              <div 
                v-for="item in filteredInventoryItems" 
                :key="item.id"
                class="inventory-item"
                :class="{ equipped: item.equipped, clickable: !item.equipped }"
                @click="!item.equipped && equipInventoryItem(item)"
              >
                <div class="item-image">
                  {{ item.icon }}
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-category">{{ item.category }}</div>
                </div>
                <div v-if="item.equipped" class="equipped-badge">
                  착용 중
                </div>
              </div>

              <div v-if="filteredInventoryItems.length === 0" class="empty-inventory">
                <i class="fas fa-box-open"></i>
                <p>보유한 {{ getCurrentTabLabel() }}이(가) 없습니다</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import NavigationBar from '@/core/components/NavigationBar.vue';
import { userService } from '@/features/user/services/user.service.js';

// 반응형 상태
const isLoading = ref(true);
const showToast = ref(false);
const toastMessage = ref('');
const activeTab = ref('overall'); // 기본은 전체 통계
const showInventoryModal = ref(false);
const activeInventoryTab = ref('all');

// 프로필 데이터
const profile = ref({
  nickname: '',
  email: '',
  profileImageUrl: '',
  currentPoint: 0,
  joinedAt: '',
  lastPlayedAt: '',
  currentStreak: 0,
  statistics: {
    singleGame: {
      practice: {
        totalGames: 0,
        averageScore: 0
      },
      rank: {
        totalGames: 0,
        averageScore: 0
      }
    },
    multiGame: {
      totalGames: 0,
      averageScore: 0,
      firstPlaceCount: 0,
      secondPlaceCount: 0,
      thirdPlaceCount: 0
    },
    bestScore: 0
  },
  rankInfo: {
    rankTier: 'BRONZE',
    rankLevel: 'ONE',
    ratingScore: 0,
    rankPercentage: 0
  }
});

// 모드 탭 정의
const modeTabs = [
  { id: 'overall', label: '전체', icon: 'fas fa-chart-bar' },
  { id: 'roadview', label: '로드뷰', icon: 'fas fa-street-view' },
  { id: 'photo', label: '포토', icon: 'fas fa-camera' },
  { id: 'multiplayer', label: '멀티플레이', icon: 'fas fa-users' }
];

// 인벤토리 탭 정의 (API 타입과 매핑)
const inventoryTabs = [
  { id: 'all', label: '전체', icon: 'fas fa-th', apiType: null },
  { id: 'marker', label: '마커', icon: 'fas fa-map-marker-alt', apiType: 'MARKER' },
  { id: 'profile', label: '프로필', icon: 'fas fa-user-circle', apiType: 'PROFILE' },
  { id: 'effect', label: '이펙트', icon: 'fas fa-magic', apiType: 'EFFECT' },
  { id: 'theme', label: '테마', icon: 'fas fa-palette', apiType: 'THEME' }
];

// 인벤토리 아이템 데이터 (API에서 가져옴)
const inventoryItems = ref([]);
const isLoadingInventory = ref(false);

// Computed: 랭크 정보
const rankInfo = computed(() => {
  return userService.getRankTierInfo(profile.value.rankInfo.rankTier);
});

// Computed: 필터링된 인벤토리 아이템
const filteredInventoryItems = computed(() => {
  if (activeInventoryTab.value === 'all') {
    return inventoryItems.value;
  }
  return inventoryItems.value.filter(item => item.type === activeInventoryTab.value);
});

// 더미 데이터 생성 함수
function getDummyProfileData() {
    return {
        nickname: '코스팟마스터',
    email: 'kospot@example.com',
    profileImageUrl: 'https://via.placeholder.com/150/667eea/ffffff?text=KS',
    currentPoint: 12450,
    joinedAt: '2024-01-15T09:00:00Z',
    lastPlayedAt: '2025-11-02T14:30:00Z',
    currentStreak: 7,
    statistics: {
      singleGame: {
        practice: {
          totalGames: 45,
          averageScore: 7850
        },
        rank: {
          totalGames: 128,
          averageScore: 8920
        }
      },
      multiGame: {
        totalGames: 89,
        averageScore: 7650,
        firstPlaceCount: 23,
        secondPlaceCount: 31,
        thirdPlaceCount: 18
      },
      bestScore: 9875
    },
    rankInfo: {
      rankTier: 'GOLD',
      rankLevel: 'THREE',
      ratingScore: 2450,
      rankPercentage: 15.5
    }
  };
}

// 프로필 로드 함수
async function loadProfile() {
  try {
    isLoading.value = true;
    
    const response = await userService.getProfile();
    
    if (response.isSuccess && response.result) {
      profile.value = response.result;
      console.log('✅ 프로필 로드 완료:', profile.value);
    } else {
      throw new Error(response.message || '프로필 조회 실패');
    }
  } catch (error) {
    console.error('❌ 프로필 로드 실패:', error);
    console.log('📦 더미 데이터를 표시합니다.');
    
    // API 실패 시 더미 데이터 사용
    profile.value = getDummyProfileData();
    
    showErrorToast('API 연결 실패. 더미 데이터를 표시합니다.');
  } finally {
    isLoading.value = false;
  }
}

// 날짜 포맷팅
function formatDate(dateString) {
  return userService.formatDate(dateString);
}

// 숫자 포맷팅
function formatNumber(num) {
  return userService.formatNumber(num);
}

// 랭크 레벨 변환
function getRankLevel(rankLevel) {
  return userService.getRankLevelNumber(rankLevel);
}

// 아바타 수정
function editAvatar() {
  showErrorToast('아바타 수정 기능은 준비 중입니다.');
}

// 에러 토스트 표시
function showErrorToast(message) {
  toastMessage.value = message;
  showToast.value = true;

  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

// 전체 게임 수 계산
function getTotalGames() {
  const singleTotal = 
    profile.value.statistics.singleGame.practice.totalGames + 
    profile.value.statistics.singleGame.rank.totalGames;
  const multiTotal = profile.value.statistics.multiGame.totalGames;
  return formatNumber(singleTotal + multiTotal);
}

// 전체 평균 점수 계산
function getAverageScore() {
  const practiceScore = profile.value.statistics.singleGame.practice.averageScore;
  const rankScore = profile.value.statistics.singleGame.rank.averageScore;
  const multiScore = profile.value.statistics.multiGame.averageScore;
  
  const scores = [practiceScore, rankScore, multiScore].filter(s => s > 0);
  if (scores.length === 0) return '0';
  
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return formatNumber(Math.round(avg));
}

// 현재 탭 레이블 가져오기
function getCurrentTabLabel() {
  const tab = inventoryTabs.find(t => t.id === activeInventoryTab.value);
  return tab ? tab.label : '아이템';
}

// 인벤토리 로드 함수
async function loadInventory() {
  try {
    isLoadingInventory.value = true;
    
    const response = await userService.getInventory();
    
    if (response.isSuccess && response.data) {
      // API 응답을 프론트엔드 형식으로 변환
      inventoryItems.value = response.data.map(item => {
        const itemType = item.itemType || 'MARKER'; // 기본값 설정
        return {
          id: item.memberItemId,
          name: item.name,
          category: getItemCategoryLabel(itemType),
          type: getItemTypeId(itemType),
          icon: getItemIcon(itemType, item.name),
          equipped: item.isEquipped || false,
          acquiredDate: item.purchaseTime,
          description: item.description || ''
        };
      });
      
      console.log('✅ 인벤토리 로드 완료:', inventoryItems.value.length, '개');
    } else {
      throw new Error(response.message || '인벤토리 조회 실패');
    }
  } catch (error) {
    console.error('❌ 인벤토리 로드 실패:', error);
    showErrorToast('인벤토리를 불러오는데 실패했습니다.');
    inventoryItems.value = [];
  } finally {
    isLoadingInventory.value = false;
  }
}

// API 아이템 타입을 프론트엔드 타입 ID로 변환
function getItemTypeId(apiType) {
  const typeMap = {
    'MARKER': 'marker',
    'PROFILE': 'profile',
    'EFFECT': 'effect',
    'THEME': 'theme'
  };
  return typeMap[apiType] || 'marker';
}

// 아이템 타입에 따른 카테고리 라벨
function getItemCategoryLabel(apiType) {
  const labelMap = {
    'MARKER': '마커',
    'PROFILE': '프로필',
    'EFFECT': '이펙트',
    'THEME': '테마'
  };
  return labelMap[apiType] || '아이템';
}

// 아이템 타입과 이름에 따른 아이콘 (간단한 예시)
function getItemIcon(apiType, name) {
  // 실제로는 서버에서 imageUrl을 제공받아야 하지만, 
  // 현재는 타입별로 기본 아이콘 설정
  const iconMap = {
    'MARKER': '📍',
    'PROFILE': '👤',
    'EFFECT': '✨',
    'THEME': '🎨'
  };
  return iconMap[apiType] || '📦';
}

// 아이템 장착 (API 연동)
async function equipInventoryItem(item) {
  try {
    const response = await userService.equipItem(item.id);
    
    if (response.isSuccess) {
      // 같은 타입의 다른 아이템 장착 해제
      inventoryItems.value.forEach(i => {
        if (i.type === item.type && i.id !== item.id) {
          i.equipped = false;
        }
      });
      
      // 선택한 아이템 장착
      const itemIndex = inventoryItems.value.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        inventoryItems.value[itemIndex].equipped = true;
      }
      
      showErrorToast(`${item.name}을(를) 장착했습니다.`);
    } else {
      throw new Error(response.message || '아이템 장착 실패');
    }
  } catch (error) {
    console.error('❌ 아이템 장착 실패:', error);
    showErrorToast('아이템 장착에 실패했습니다.');
  }
}

// 컴포넌트 마운트 시 프로필 로드
onMounted(() => {
  loadProfile();
});

// 인벤토리 모달이 열릴 때 인벤토리 로드
watch(showInventoryModal, (newValue) => {
  if (newValue && inventoryItems.value.length === 0) {
    loadInventory();
  }
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  width: 100%;
  background: #f8f9fa;
}

.profile-content {
  padding-top: 80px;
  max-width: 1100px;
  margin: 0 auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: 2rem;
}

/* 로딩 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
  font-size: 1rem;
}

.loading-spinner i {
  font-size: 2rem;
  color: #667eea;
}

/* 프로필 컨테이너 */
.profile-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 프로필 헤더 */
.profile-header {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  border: 1px solid #e5e7eb;
}

.profile-avatar-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
}

.profile-avatar {
  position: relative;
}

.profile-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #e5e7eb;
  object-fit: cover;
  background: #f3f4f6;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #6b7280;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 0.75rem;
}

.edit-avatar-btn:hover {
  background: #4b5563;
}

.profile-info {
  flex: 1;
}

.profile-nickname {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.profile-email {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
}

.profile-dates {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.date-item i {
  color: #9ca3af;
}

/* 스트릭 섹션 */
.streak-section {
  display: flex;
  align-items: center;
}

.streak-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 160px;
}

.streak-card.streak-active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.streak-icon {
  font-size: 2rem;
}

.streak-icon i {
  color: #d1d5db;
}

.streak-icon i.fire-active {
  color: #f59e0b;
}

.streak-content {
  display: flex;
  flex-direction: column;
}

.streak-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.streak-label {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 포인트 & 인벤토리 섹션 */
.point-inventory-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
}

.point-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.point-icon {
  font-size: 2rem;
  color: #f59e0b;
}

.point-details {
  text-align: left;
  flex: 1;
}

.point-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.point-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.inventory-button {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.inventory-button:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.inventory-button i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.inventory-button span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

/* 탭 내부 랭크 카드 */
.rank-card-inline {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.rank-icon {
  font-size: 2.5rem;
}

.rank-details {
  flex: 1;
}

.rank-tier {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
}

.rank-rating {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #3b82f6;
}

.rank-percentage {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 통계 섹션 */
.statistics-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #3b82f6;
  font-size: 1.125rem;
}

/* 베스트 스코어 */
.best-score-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.best-score-icon {
  font-size: 2rem;
  color: #f59e0b;
}

.best-score-content {
  flex: 1;
}

.best-score-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #6b7280;
}

.best-score-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #111827;
}

/* 게임 통계 */
.game-stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.game-stats-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
}

.stats-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stats-title i {
  color: #3b82f6;
  font-size: 0.875rem;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.875rem;
}

.stat-item.full-width {
  width: 100%;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.stat-header i {
  color: #6b7280;
  font-size: 0.75rem;
}

.stat-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  font-weight: 500;
  color: #111827;
}

/* 순위별 횟수 */
.rank-counts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.rank-count-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.rank-count-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.rank-count-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.rank-count-label {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 모드 탭 */
.mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0;
}

.mode-tab {
  background: none;
  border: none;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-tab:hover {
  color: #111827;
}

.mode-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.mode-tab i {
  font-size: 0.875rem;
}

/* 탭 컨텐츠 */
.tab-content {
  animation: fadeIn 0.3s ease-in;
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

/* 전체 통계 */
.overall-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.overall-stat-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.overall-stat-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #3b82f6;
}

.overall-stat-info {
  flex: 1;
}

.overall-stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.overall-stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 준비 중 */
.coming-soon {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.coming-soon i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.coming-soon h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.coming-soon p {
  font-size: 0.875rem;
  margin: 0;
}

/* 멀티플레이어 통계 */
.multiplayer-stats {
  margin-top: 1rem;
}

.multiplayer-stats .stats-title {
  margin-bottom: 1rem;
}

/* 인벤토리 모달 */
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
  z-index: 9999;
  padding: 1rem;
}

.inventory-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h3 i {
  color: #3b82f6;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.inventory-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0;
}

.inventory-tab {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inventory-tab:hover {
  color: #111827;
}

.inventory-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.inventory-tab i {
  font-size: 0.875rem;
}

.inventory-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
  gap: 1rem;
}

.inventory-loading i {
  font-size: 2rem;
  color: #3b82f6;
}

.inventory-loading span {
  font-size: 0.875rem;
  font-weight: 500;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  min-height: 200px;
}

.inventory-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  position: relative;
  transition: all 0.2s ease;
}

.inventory-item.clickable {
  cursor: pointer;
}

.inventory-item.clickable:hover {
  border-color: #3b82f6;
  background: white;
  transform: translateY(-2px);
}

.inventory-item.equipped {
  border-color: #3b82f6;
  background: #eff6ff;
  cursor: default;
}

.item-image {
  font-size: 3rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
}

.item-info {
  width: 100%;
}

.item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.item-category {
  font-size: 0.75rem;
  color: #6b7280;
}

.equipped-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #3b82f6;
  color: white;
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.empty-inventory {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.empty-inventory i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-inventory p {
  font-size: 0.875rem;
  margin: 0;
}

/* 모달 페이드 트랜지션 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .inventory-modal,
.modal-fade-leave-active .inventory-modal {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .inventory-modal,
.modal-fade-leave-to .inventory-modal {
  transform: scale(0.95);
}

/* 토스트 알림 */
.toast-notification {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #334155;
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
  font-size: 14px;
  font-weight: 500;
  max-width: 90%;
  text-align: center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .game-stats-container {
    grid-template-columns: 1fr;
  }

  .overall-stats {
    grid-template-columns: 1fr;
  }
  
  .rank-card-inline {
    flex-direction: column;
    text-align: center;
  }
  
  .rank-details {
    text-align: center;
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-avatar-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-dates {
    justify-content: center;
  }

  .streak-section {
    width: 100%;
  }

  .streak-card {
    width: 100%;
    justify-content: center;
  }

  .rank-counts {
    grid-template-columns: 1fr;
  }

  .mode-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .mode-tab {
    flex-shrink: 0;
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
  }

  .point-inventory-section {
    grid-template-columns: 1fr;
  }

  .inventory-button {
    padding: 1.25rem;
  }

  .inventory-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .inventory-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .inventory-tab {
    flex-shrink: 0;
  }
}
</style> 
