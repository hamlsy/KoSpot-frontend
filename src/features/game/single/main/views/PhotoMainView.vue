<template>
  <div class="photo-mode-container">
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="$router.push('/')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <app-logo class="home-link" to="/" />
        <div class="header-right">
          <h3>포토 모드</h3>
        </div>
      </div>
    </header>

    <main class="main-content">
      
      <section class="ad-space">
        <div class="ad-container">
          <div class="ad-content">
            <p>광고 영역</p>
          </div>
        </div>
      </section>

      <section class="game-modes">
        <div class="game-mode-list">
          <game-mode-card
            v-for="mode in gameModes"
            :key="mode.id"
            :mode="mode"
            @select="openGameModePopup"
          />
        </div>
      </section>

      <section class="stats-section">
        <h2 class="section-title">나의 랭크 통계</h2>
        <div class="stats-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-card"
          >
            <div class="stat-header">
              <i :class="stat.icon"></i>
              <span>{{ stat.label }}</span>
            </div>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
        </div>
      </section>

      <section class="records-section">
        <h2 class="section-title">최근 기록</h2>
        <div class="records-list">
          <div
            v-for="(record, index) in recentRecords"
            :key="record.id"
            class="record-item"
            :class="{
              'with-border': index !== recentRecords.length - 1,
              'record-item-hover': hoverRecord === record.id,
            }"
            @mouseenter="hoverRecord = record.id"
            @mouseleave="hoverRecord = null"
          >
            <div class="record-info">
              <div
                class="record-mode-badge"
                :class="{
                  'rank-mode': record.mode === '랭크',
                  'practice-mode': record.mode === '연습',
                }"
              >
                {{ record.mode }}
              </div>
              <span class="record-region">{{ record.region }}</span>
              <p class="record-score">{{ formatNumber(record.score) }}점</p>
            </div>
            <span class="record-date">{{ record.date }}</span>
          </div>
        </div>
      </section>
    </main>

    <transition name="popup-slide">
      <div
        v-if="selectedGameMode"
        class="game-mode-popup"
        @click.self="closeGameModePopup"
      >
      <div class="popup-content">
        <div class="popup-header">
          <h2>{{ selectedGameMode.title }}</h2>
          <button @click="closeGameModePopup" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="popup-description">
          <p>{{ selectedGameMode.fullDescription }}</p>
        </div>

        <div
          v-if="selectedGameMode.id === 'practice'"
          class="practice-mode-options"
        >
          <h3>지역 선택</h3>
          <div class="region-selector">
            <button
              v-for="(value, key) in regions"
              :key="key"
              :class="{ selected: selectedRegion === value }"
              @click="selectRegion(value)"
            >
              {{ key }}
            </button>
          </div>
          </div>

          <div v-if="selectedGameMode.id === 'rank'" class="rank-mode-options">
            <div class="rank-details">
              <div class="current-rank">
                <p>현재 랭크: {{ userRank }}</p>
              </div>
              <div class="rank-icon">
                <i :class="getRankIcon(userRank)"></i>
              </div>
            </div>
          </div>

          <button
            class="start-game-button"
            @click="startGame"
            :disabled="!isGameStartReady"
            :class="selectedGameMode ? selectedGameMode.color : ''"
          >
            게임 시작
          </button>
        </div>
      </div>
    </transition>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vue 3 Composition API 방식으로 변경
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppLogo from "@/core/components/BaseAppLogo.vue";
import useGame from '@/composables/useGame';
import GameModeCard from "@/features/game/shared/components/Common/GameModeCard.vue";
// import useAuth from '@/composables/useAuth';

// 라우터 및 컴포지션 API 사용
const router = useRouter();
// const { user, isLoggedIn } = useAuth();
const { gameState, startGame: initGame } = useGame();

// 상태 정의
const isLoading = ref(false);
const selectedGameMode = ref(null);
const selectedRegion = ref(null);
const hoverMode = ref(null);
const hoverRecord = ref(null);
const showProfileMenu = ref(false);
const userRank = ref("Silver II");
const stats = ref([
  { icon: "fas fa-gamepad", label: "플레이 횟수", value: "32회" },
  { icon: "fas fa-map-marker-alt", label: "정확도", value: "68%" },
  { icon: "fas fa-medal", label: "최고 점수", value: "4,850점" },
  { icon: "fas fa-users", label: "전체 랭킹", value: "상위 15%" },
]);
const recentRecords = ref([
  {
    id: 1,
    mode: "랭크",
    score: 4320,
    date: "2024.12.29",
    region: "",
  },
  {
    id: 3,
    mode: "연습",
    score: 4100,
    date: "2024.12.28",
    region: "부산",
  },
  {
    id: 4,
    mode: "랭크",
    score: 3850,
    date: "2024.12.27",
    region: "",
  },
  
]);

// 게임 모드 데이터
const gameModes = [
  {
    id: "practice",
    title: "연습 모드",
    shortDescription: "지역별로 사진을 보고 위치를 맞혀보세요",
    fullDescription:
      "연습 모드에서는 원하는 지역을 선택하여 해당 지역의 사진을 보고 위치를 맞추는 연습을 할 수 있습니다. 점수는 기록되지만 랭킹에는 반영되지 않습니다.",
    icon: "fas fa-graduation-cap",
    color: "practice-color",
  },
  {
    id: "rank",
    title: "랭크 모드",
    shortDescription: "전국 무작위 사진으로 실력을 겨루세요",
    fullDescription:
      "랭크 모드에서는 전국의 무작위 사진이 출제됩니다. 점수는 기록되며 랭킹에 반영됩니다. 시즌별로 랭킹이 초기화되며, 상위 랭커에게는 특별한 보상이 주어집니다.",
    icon: "fas fa-trophy",
    color: "rank-color",
  },

];

// 지역 데이터
const regions = [
  { id: "all", name: "전국", icon: "fas fa-map" },
  { id: "seoul", name: "서울", icon: "fas fa-city" },
  { id: "busan", name: "부산", icon: "fas fa-ship" },
  { id: "jeju", name: "제주", icon: "fas fa-umbrella-beach" },
  { id: "gyeonggi", name: "경기도", icon: "fas fa-mountain" },
  { id: "gangwon", name: "강원도", icon: "fas fa-skiing" },
  { id: "chungcheong", name: "충청도", icon: "fas fa-leaf" },
  { id: "gyeongsang", name: "경상도", icon: "fas fa-industry" },
  { id: "jeolla", name: "전라도", icon: "fas fa-seedling" },
];

// 게임 시작 준비 상태 계산
const isGameStartReady = computed(() => {
  if (selectedGameMode.value?.id === "practice")
    return selectedRegion.value !== null;
  if (selectedGameMode.value?.id === "rank") return true;
  return false;
});

// 게임 모드 팝업 열기
const openGameModePopup = (mode) => {
  selectedGameMode.value = mode;
  selectedRegion.value = null;
};

// 게임 모드 팝업 닫기
const closeGameModePopup = () => {
  selectedGameMode.value = null;
  selectedRegion.value = null;
};

// 지역 선택
const selectRegion = (region) => {
  selectedRegion.value = region;
};

// 게임 시작
const startGame = async () => {
  if (!isGameStartReady.value) return;

  isLoading.value = true;

  const gameData = {
    mode: selectedGameMode.value.id,
    region: selectedRegion.value,
    totalRounds: 5 // 기본 라운드 수
  };

  try {
    // 게임 데이터 로드 및 게임 시작
    await initGame('photo', {
      region: gameData.region,
      totalRounds: gameData.totalRounds
    });

    // 게임 모드에 따라 라우팅
    if (gameData.mode === 'practice') {
      router.push({
        name: 'PhotoModePractice',
        query: {
          region: gameData.region,
          totalRounds: gameData.totalRounds
        }
      });
    } else if (gameData.mode === 'rank') {
      router.push({ name: 'PhotoModeRank' });
    } 
      
  } catch (error) {
    console.error("게임 시작 중 오류 발생:", error);
  } finally {
    isLoading.value = false;
  }
};

// 숫자 포맷팅
const formatNumber = (number) => {
  return number.toLocaleString();
};

// 프로필 메뉴 토글
const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
};

// 랭크 아이콘 가져오기
const getRankIcon = (rank) => {
  if (rank.includes("Gold")) return "fas fa-trophy gold";
  if (rank.includes("Silver")) return "fas fa-trophy silver";
  if (rank.includes("Bronze")) return "fas fa-trophy bronze";
  return "fas fa-trophy";
};
</script>

<style scoped>
.photo-mode-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding-top: 60px;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #555;
  cursor: pointer;
  margin-right: 1rem;
}

.home-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.header-right h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #4a6cf7;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.ad-space {
  margin-bottom: 2rem;
}

.ad-container {
  background-color: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  height: 120px;
}

.ad-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 1.2rem;
}

.game-modes {
  margin-bottom: 2rem;
}

.game-mode-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.game-mode-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.mode-card-hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.game-mode-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.practice-color {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.rank-color {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}


.game-mode-details {
  flex: 1;
}

.game-mode-details h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.game-mode-details p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.game-mode-arrow {
  color: #9ca3af;
  margin-left: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem;
}

.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.stat-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.stat-header i {
  margin-right: 0.5rem;
  font-size: 1rem;
  color: #4a6cf7;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.records-section {
  margin-bottom: 2rem;
}

.records-list {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.record-item {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.record-item-hover {
  background-color: #f9fafb;
}

.with-border {
  border-bottom: 1px solid #f3f4f6;
}

.record-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.record-mode-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  min-width: 50px;
}

.record-mode-badge.rank-mode {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.record-mode-badge.practice-mode {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.record-region {
  color: #6b7280;
  font-size: 0.875rem;
}

.record-score {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.record-date {
  color: #9ca3af;
  font-size: 0.875rem;
}

.game-mode-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.popup-content {
  background-color: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.popup-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
}

.popup-description {
  margin-bottom: 1.5rem;
  color: #4b5563;
  line-height: 1.6;
}

.practice-mode-options,

.practice-mode-options h3,  

.region-selector,

.region-selector button,

.region-selector button:hover,


.region-selector button.selected,
.rank-mode-options {
  margin-bottom: 1.5rem;
}

.rank-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 1rem;
}

.current-rank {
  font-weight: 600;
  color: #1f2937;
}

.rank-icon {
  font-size: 1.5rem;
}

.rank-icon .gold {
  color: #f59e0b;
}

.rank-icon .silver {
  color: #9ca3af;
}

.rank-icon .bronze {
  color: #b45309;
}

.start-game-button {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: #4a6cf7;
  cursor: pointer;
  transition: background-color 0.2s;
}

.start-game-button:hover:not(:disabled) {
  background-color: #3a5bd9;
}

.start-game-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.start-game-button.practice-color {
  background-color: #10b981;
}

.start-game-button.practice-color:hover:not(:disabled) {
  background-color: #059669;
}

.start-game-button.rank-color {
  background-color: #f59e0b;
}

.start-game-button.rank-color:hover:not(:disabled) {
  background-color: #d97706;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  text-align: center;
}

.loading-spinner i {
  font-size: 2rem;
  color: #4a6cf7;
  margin-bottom: 1rem;
}

.popup-slide-enter-active,
.popup-slide-leave-active {
  transition: all 0.3s ease;
}

.popup-slide-enter-from,
.popup-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .game-mode-list {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .popup-content {
    padding: 1.5rem;
  }
  
  .region-selector{
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .record-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .record-date {
    margin-top: 0.5rem;
    align-self: flex-end;
  }
}
</style>
