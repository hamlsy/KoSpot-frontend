<template>
  <div class="alt-roadview-app">
    <!-- Navigation -->
    <AltNavigationBar 
      :is-logged-in="isLoggedIn"
      :user-info="userProfile"
      @open-tutorial="showTutorial = true"
      @logout="handleLogout"
    />

    <main class="alt-roadview-content">
      <div class="alt-container">
        <!-- Page Header -->
        <div class="alt-page-header">
          <button class="alt-back-button" @click="$router.push({ name: 'AltMainView' })">
            <i class="fas fa-arrow-left"></i>
            <span>돌아가기</span>
          </button>
          <h1 class="alt-h1">
            <i class="fas fa-street-view" style="margin-right: 1rem;"></i>
            <span class="alt-gradient-text">로드뷰 모드</span>
          </h1>
        </div>

        <!-- Stats Section - Circular Progress -->
        <section class="alt-stats-section">
          <h2 class="alt-h2">나의 랭크 통계</h2>
          <div class="alt-stats-circles">
            <div 
              v-for="(stat, index) in stats" 
              :key="stat.label"
              class="alt-stat-circle alt-stagger-item"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <span class="alt-stat-circle-value">{{ stat.value }}</span>
              <span class="alt-stat-circle-label">{{ stat.label }}</span>
            </div>
          </div>
        </section>

        <!-- Game Modes Section - Asymmetric 3-Column -->
        <section class="alt-game-modes-section">
          <h2 class="alt-h2">게임 모드 선택</h2>
          <div class="alt-game-modes-asymmetric">
            <AltGameModeCard
              v-for="(mode, index) in gameModes"
              :key="mode.id"
              :mode="mode.id"
              :title="mode.title"
              :description="mode.shortDescription"
              :icon-class="mode.icon"
              :tilt="index % 2 === 0 ? 'left' : 'right'"
              @click="openGameModePopup(mode)"
            />
          </div>
        </section>

        <!-- Recent Records Section - Timeline Style -->
        <section class="alt-records-section">
          <div class="alt-section-header">
            <h2 class="alt-h2">최근 기록</h2>
            <button 
              v-if="recentRecords.length > 0"
              class="alt-btn alt-btn-accent" 
              @click="showHistoryModal = true"
            >
              <span>전체 기록 보기</span>
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>

          <div class="alt-records-timeline">
            <div 
              v-for="(record, index) in recentRecords" 
              :key="record.id"
              class="alt-record-item alt-stagger-item"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="alt-record-icon">
                <i :class="getRecordIcon(record.mode)"></i>
              </div>
              <div class="alt-record-content">
                <div class="alt-record-header">
                  <span 
                    class="alt-record-badge" 
                    :class="`alt-badge-${record.mode.toLowerCase()}`"
                  >
                    {{ record.mode }}
                  </span>
                  <span class="alt-record-date">{{ record.date }}</span>
                </div>
                <h4 class="alt-record-title">{{ record.poiName }}</h4>
                <div class="alt-record-details">
                  <span v-if="record.region" class="alt-record-region">
                    <i class="fas fa-map-marker-alt"></i>
                    {{ record.region }}
                  </span>
                  <span class="alt-record-score alt-gradient-text-warm">
                    {{ formatNumber(Math.round(record.score)) }}점
                  </span>
                </div>
              </div>
            </div>

            <div v-if="recentRecords.length === 0" class="alt-records-empty">
              <i class="fas fa-history"></i>
              <p>아직 플레이 기록이 없습니다.</p>
              <p class="alt-body">첫 게임을 시작해보세요!</p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Game Mode Popup -->
    <transition name="alt-fade">
      <div 
        v-if="selectedGameMode" 
        class="alt-overlay" 
        @click="closeGameModePopup"
      ></div>
    </transition>

    <transition name="alt-popup-slide">
      <div v-if="selectedGameMode" class="alt-game-popup">
        <div class="alt-popup-header">
          <h2 class="alt-h2">{{ selectedGameMode.title }}</h2>
          <button @click="closeGameModePopup" class="alt-close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="alt-popup-body">
          <p class="alt-body-large">{{ selectedGameMode.fullDescription }}</p>

          <!-- Practice Mode: Region Selector -->
          <div v-if="selectedGameMode.id === 'practice'" class="alt-region-selector-section">
            <h3 class="alt-h3">지역 선택</h3>
            <div class="alt-region-grid">
              <button
                v-for="(value, key) in regions"
                :key="key"
                class="alt-region-button"
                :class="{ 'alt-selected': selectedRegion === value }"
                @click="selectRegion(value)"
              >
                {{ key }}
              </button>
            </div>
          </div>
        </div>

        <div class="alt-popup-actions">
          <button 
            class="alt-btn alt-btn-large alt-btn-primary" 
            :disabled="!isGameStartReady"
            @click="startGame"
          >
            <i class="fas fa-play-circle"></i>
            <span>게임 시작</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- History Modal -->
    <history-modal
      :show="showHistoryModal"
      @close="showHistoryModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/core/composables/useAuth.js';
import AltNavigationBar from '@/features/alternative/components/AltNavigationBar.vue';
import AltGameModeCard from '@/features/alternative/components/AltGameModeCard.vue';
import HistoryModal from "@/features/game/single/main/components/HistoryModal.vue";
import roadViewMainService from "@/features/game/single/main/services/roadViewMain.service";

const router = useRouter();
const { logout: logoutAuth } = useAuth();

// State
const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));
const selectedGameMode = ref(null);
const selectedRegion = ref(null);
const showHistoryModal = ref(false);

const userProfile = ref({
  name: "사용자",
  email: "user@example.com",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
});

// API Data
const rankInfo = ref(null);
const statisticInfo = ref(null);
const recentGamesData = ref([]);

// Game Modes
const gameModes = [
  {
    id: "practice",
    title: "연습 게임",
    icon: "fas fa-graduation-cap",
    shortDescription: "지역을 선택하고 쉽게 연습해보세요",
    fullDescription: "특정 지역을 선택하여 로드뷰 능력을 천천히 향상시킬 수 있는 모드입니다. 편안한 속도로 학습하세요.",
    color: "practice-color",
  },
  {
    id: "rank",
    title: "랭크 게임",
    icon: "fas fa-trophy",
    shortDescription: "랜덤 맵으로 다른 플레이어와 경쟁하세요",
    fullDescription: "전국 랭킹에 도전하는 경쟁 모드입니다. 최고의 성적을 목표로 하세요.",
    color: "rank-color",
  },
];

// Regions
const regions = {
  서울: "SEOUL", 부산: "BUSAN", 대구: "DAEGU", 인천: "INCHEON",
  광주: "GWANGJU", 대전: "DAEJEON", 울산: "ULSAN", 세종: "SEJONG",
  경기: "GYEONGGI", 강원: "GANGWON", 충북: "CHUNGBUK", 충남: "CHUNGNAM",
  전북: "JEONBUK", 전남: "JEONNAM", 경북: "GYEONGBUK", 경남: "GYEONGNAM",
  제주: "JEJU",
};

const regionMap = {
  SEOUL: '서울', BUSAN: '부산', DAEGU: '대구', INCHEON: '인천',
  GWANGJU: '광주', DAEJEON: '대전', ULSAN: '울산', SEJONG: '세종',
  GYEONGGI: '경기', GANGWON: '강원', CHUNGBUK: '충북', CHUNGNAM: '충남',
  JEONBUK: '전북', JEONNAM: '전남', GYEONGBUK: '경북', GYEONGNAM: '경남',
  JEJU: '제주'
};

const tierMap = {
  BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold',
  PLATINUM: 'Platinum', DIAMOND: 'Diamond', MASTER: 'Master'
};

const levelMap = {
  ONE: '1', TWO: '2', THREE: '3', FOUR: '4', FIVE: '5'
};

// Computed
const stats = computed(() => {
  if (!rankInfo.value || !statisticInfo.value) {
    return [
      { label: "내 랭크", value: "-" },
      { label: "레이팅", value: "-" },
      { label: "플레이", value: "-" },
      { label: "평균점수", value: "-" },
      { label: "랭킹", value: "-" },
    ];
  }

  const tier = tierMap[rankInfo.value.rankTier] || rankInfo.value.rankTier;
  const level = levelMap[rankInfo.value.rankLevel] || rankInfo.value.rankLevel;
  const rankDisplay = `${tier} ${level}`;

  return [
    { label: "내 랭크", value: rankDisplay },
    { label: "레이팅", value: rankInfo.value.ratingScore.toLocaleString() },
    { label: "플레이", value: `${statisticInfo.value.rankPlayCount}판` },
    { label: "평균점수", value: `${formatNumber(Math.round(statisticInfo.value.rankAvgScore))}` },
    { label: "랭킹", value: `상위 ${rankInfo.value.rankPercentage}%` },
  ];
});

const recentRecords = computed(() => {
  return recentGamesData.value.map(game => ({
    id: game.gameId,
    mode: game.gameType === 'RANK' ? '랭크' : game.gameType === 'PRACTICE' ? '연습' : '테마',
    score: game.score,
    date: formatDateShort(game.playedAt),
    region: game.practiceSido ? regionMap[game.practiceSido] || game.practiceSido : '',
    poiName: game.poiName
  }));
});

const isGameStartReady = computed(() => {
  if (selectedGameMode.value?.id === "practice") return selectedRegion.value !== null;
  if (selectedGameMode.value?.id === "rank") return true;
  return false;
});

// Functions
function formatNumber(num) {
  return num.toLocaleString('ko-KR');
}

function formatDateShort(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getRecordIcon(mode) {
  if (mode === '랭크') return 'fas fa-trophy';
  if (mode === '연습') return 'fas fa-graduation-cap';
  return 'fas fa-map-marked-alt';
}

function selectRegion(region) {
  selectedRegion.value = region;
}

function openGameModePopup(mode) {
  selectedGameMode.value = mode;
  selectedRegion.value = null;
}

function closeGameModePopup() {
  selectedGameMode.value = null;
  selectedRegion.value = null;
}

function startGame() {
  if (!isGameStartReady.value) return;

  if (selectedGameMode.value.id === "practice") {
    router.push({
      name: "PracticeRoadViewGame",
      query: { region: selectedRegion.value }
    });
  } else if (selectedGameMode.value.id === "rank") {
    router.push({ name: "RankRoadViewGame" });
  }
}

function handleLogout() {
  logoutAuth();
  router.push({ name: 'AltMainView' });
}

async function fetchMainPageData() {
  try {
    const response = await roadViewMainService.getMainPageData();
    if (response.result) {
      rankInfo.value = response.result.rankInfo;
      statisticInfo.value = response.result.statisticInfo;
      recentGamesData.value = response.result.recentGames || [];
    }
  } catch (error) {
    console.error('Failed to fetch main page data:', error);
  }
}

onMounted(() => {
  if (!isLoggedIn.value) {
    alert('로그인한 사용자만 접근할 수 있습니다.');
    router.push({ name: 'AltMainView' });
    return;
  }
  fetchMainPageData();
});
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

/* ========================================
   ALTERNATIVE ROADVIEW MAIN VIEW
   ======================================== */

.alt-roadview-app {
  min-height: 100vh;
  background: var(--alt-bg-base);
}

.alt-roadview-content {
  padding: var(--alt-space-lg) 0 var(--alt-space-2xl);
}

/* Page Header */
.alt-page-header {
  margin-bottom: var(--alt-space-xl);
  animation: alt-fade-in-up 0.6s ease-out;
}

.alt-back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--alt-space-xs);
  padding: 0.75rem 1.5rem;
  background: var(--alt-surface);
  border: 2px solid var(--alt-primary);
  border-radius: var(--alt-radius-md);
  color: var(--alt-primary);
  font-family: var(--alt-font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--alt-transition-base);
  margin-bottom: var(--alt-space-md);
}

.alt-back-button:hover {
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  transform: translateX(-4px);
}

.alt-page-header h1 {
  display: flex;
  align-items: center;
}

/* Stats Section - Circular */
.alt-stats-section {
  margin-bottom: var(--alt-space-2xl);
  text-align: center;
}

.alt-stats-section h2 {
  margin-bottom: var(--alt-space-xl);
}

.alt-stats-circles {
  display: flex;
  justify-content: center;
  gap: var(--alt-space-lg);
  flex-wrap: wrap;
}

/* Game Modes - Asymmetric */
.alt-game-modes-section {
  margin-bottom: var(--alt-space-2xl);
}

.alt-game-modes-section h2 {
  text-align: center;
  margin-bottom: var(--alt-space-xl);
}

.alt-game-modes-asymmetric {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--alt-space-lg);
}

/* Records Section - Timeline */
.alt-records-section {
  margin-bottom: var(--alt-space-2xl);
}

.alt-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--alt-space-lg);
}

.alt-records-timeline {
  position: relative;
  padding-left: var(--alt-space-md);
}

.alt-records-timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  border-radius: var(--alt-radius-full);
}

.alt-record-item {
  display: flex;
  gap: var(--alt-space-md);
  margin-bottom: var(--alt-space-lg);
  padding: var(--alt-space-md);
  background: var(--alt-surface);
  border-radius: var(--alt-radius-md);
  box-shadow: var(--alt-surface-shadow);
  transition: all var(--alt-transition-fast);
  cursor: pointer;
}

.alt-record-item:hover {
  transform: translateX(8px);
  box-shadow: var(--alt-surface-shadow-hover);
}

.alt-record-icon {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  border-radius: var(--alt-radius-md);
  color: var(--alt-text-secondary);
  font-size: 1.5rem;
}

.alt-record-content {
  flex: 1;
}

.alt-record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--alt-space-xs);
}

.alt-record-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  font-size: var(--alt-font-small);
  font-weight: 700;
  text-transform: uppercase;
  border-radius: var(--alt-radius-full);
}

.alt-badge-연습 {
  background: #10b981;
}

.alt-record-date {
  font-size: var(--alt-font-small);
  color: var(--alt-text-muted);
}

.alt-record-title {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h3);
  margin: var(--alt-space-xs) 0;
  color: var(--alt-text-primary);
}

.alt-record-details {
  display: flex;
  align-items: center;
  gap: var(--alt-space-md);
}

.alt-record-region {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--alt-font-small);
  color: var(--alt-text-muted);
}

.alt-record-score {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h3);
  font-weight: 700;
}

.alt-records-empty {
  text-align: center;
  padding: var(--alt-space-2xl);
  color: var(--alt-text-muted);
}

.alt-records-empty i {
  font-size: 4rem;
  margin-bottom: var(--alt-space-md);
  opacity: 0.5;
}

/* Game Mode Popup */
.alt-game-popup {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 85vh;
  background: var(--alt-surface);
  border-radius: var(--alt-radius-xl) var(--alt-radius-xl) 0 0;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
  z-index: calc(var(--alt-z-modal) + 1);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.alt-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--alt-space-lg);
  border-bottom: 2px solid rgba(14, 165, 233, 0.2);
}

.alt-close-button {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.1);
  border: none;
  border-radius: var(--alt-radius-md);
  color: var(--alt-primary);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all var(--alt-transition-fast);
}

.alt-close-button:hover {
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  transform: scale(1.1);
}

.alt-popup-body {
  padding: var(--alt-space-lg);
  flex: 1;
}

.alt-region-selector-section {
  margin-top: var(--alt-space-lg);
}

.alt-region-selector-section h3 {
  margin-bottom: var(--alt-space-md);
}

.alt-region-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--alt-space-sm);
}

.alt-region-button {
  padding: var(--alt-space-sm) var(--alt-space-md);
  background: var(--alt-surface);
  border: 2px solid rgba(14, 165, 233, 0.2);
  border-radius: var(--alt-radius-md);
  color: var(--alt-text-primary);
  font-family: var(--alt-font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--alt-transition-fast);
}

.alt-region-button:hover {
  border-color: var(--alt-primary);
  background: rgba(14, 165, 233, 0.1);
}

.alt-region-button.alt-selected {
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  color: var(--alt-text-secondary);
  border-color: var(--alt-primary);
}

.alt-popup-actions {
  padding: var(--alt-space-lg);
  border-top: 2px solid rgba(14, 165, 233, 0.2);
}

.alt-popup-actions .alt-btn {
  width: 100%;
}

.alt-popup-actions .alt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.alt-popup-slide-enter-active,
.alt-popup-slide-leave-active {
  transition: transform var(--alt-transition-base);
}

.alt-popup-slide-enter-from,
.alt-popup-slide-leave-to {
  transform: translateY(100%);
}

/* Responsive */
@media (max-width: 1024px) {
  .alt-stats-circles {
    gap: var(--alt-space-md);
  }

  .alt-game-modes-asymmetric {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .alt-stats-circles {
    flex-direction: column;
    align-items: center;
  }

  .alt-page-header h1 {
    font-size: var(--alt-font-h2);
  }

  .alt-record-item {
    flex-direction: column;
  }

  .alt-record-icon {
    align-self: flex-start;
  }
}
</style>

