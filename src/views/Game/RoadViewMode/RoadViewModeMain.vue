<template>
  <div class="road-view-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="$router.push('/mainPage')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <app-logo class="home-link" to="/mainPage" />
        <div class="header-right">
          <h3>로드뷰 모드</h3>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Ad Space -->
      <section class="ad-space">
        <div class="ad-container">
          <div class="ad-content">
            <p>광고 영역</p>
          </div>
        </div>
      </section>

      <!-- Game Modes Section -->
      <section class="game-modes">
        <div class="game-mode-list">
          <div
            v-for="mode in gameModes"
            :key="mode.id"
            class="game-mode-card"
            :class="{ 
              'mode-card-hover': hoverMode === mode.id,
              'practice-mode': mode.id === 'practice',
              'rank-mode': mode.id === 'rank',
              'theme-mode': mode.id === 'theme'
            }"
            @click="openGameModePopup(mode)"
            @mouseenter="hoverMode = mode.id"
            @mouseleave="hoverMode = null"
          >
            <div class="game-mode-icon" :class="mode.color">
              <i :class="mode.icon"></i>
            </div>
            <div class="game-mode-details">
              <h3>{{ mode.title }}</h3>
              <p>{{ mode.shortDescription }}</p>
            </div>
            <div class="game-mode-arrow">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats-section">
        <h2 class="section-title">나의 랭크 통계</h2>
        <div class="stats-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-card">
            <div class="stat-header">
              <i :class="stat.icon"></i>
              <span>{{ stat.label }}</span>
            </div>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
        </div>
      </section>

      <!-- Recent Records Section -->
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
                  'theme-mode': record.mode === '테마',
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

    <!-- Game Mode Popup -->
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
    <!-- Theme Mode Popup -->
    <transition name="popup-slide">
      <theme-mode-popup
        v-if="showThemeModePopup"
        :show="showThemeModePopup"
        @close="closeThemeModePopup"
        @start-game="startThemeGame"
      />
    </transition>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLogo from "@/components/common/ui/BaseAppLogo.vue";
import ThemeModePopup from "@/components/game/roadViewMode/ThemeModePopup.vue";

// 라우터 설정
const router = useRouter();

// 반응형 상태 정의
const selectedGameMode = ref(null);
const selectedRegion = ref(null);
const userRank = ref("Gold III");
const showProfileMenu = ref(false);
const isLoading = ref(false);
const hoverMode = ref(null);
const hoverStat = ref(null);
const hoverRecord = ref(null);
const showThemeModePopup = ref(false);

// 게임 모드 데이터
const gameModes = [
  {
    id: "practice",
    title: "연습 게임",
    icon: "fas fa-graduation-cap",
    shortDescription: "지역을 선택하고 쉽게 연습해보세요",
    fullDescription:
      "특정 지역을 선택하여 로드뷰 능력을 천천히 향상시킬 수 있는 모드입니다. 편안한 속도로 학습하세요.",
    color: "practice-color",
  },
  {
    id: "theme",
    title: "테마 게임",
    icon: "fas fa-map-marked-alt",
    shortDescription: "특별한 테마로 즐기는 게임",
    color: "theme-color",
  },
  {
    id: "rank",
    title: "랭크 게임",
    icon: "fas fa-trophy",
    shortDescription: "랜덤 맵으로 다른 플레이어와 경쟁하세요",
    fullDescription:
      "전국 랭킹에 도전하는 경쟁 모드입니다. 최고의 성적을 목표로 하세요.",
    color: "rank-color",
  },
];

// 지역 데이터
const regions = {
  서울: "seoul",
  경기: "gyeonggi",
  인천: "incheon",
  부산: "busan",
  대구: "daegu",
  대전: "daejeon",
  광주: "gwangju",
  울산: "ulsan",
  강원: "gangwon",
  충청: "chungcheong",
  전라: "jeolla",
  경상: "gyeongsang",
  제주: "jeju",
};

// 통계 데이터
const stats = [
  { icon: "fas fa-trophy", label: "내 랭크", value: "Bronze 3" },
  { icon: "fas fa-trophy", label: "내 레이팅 점수", value: "3200" },
  { icon: "fas fa-clock", label: "총 플레이 수", value: "500 판" },
  { icon: "fas fa-medal", label: "최고 점수", value: "4,850점" },
  { icon: "fas fa-users", label: "전체 랭킹", value: "상위 15%" },
];

// 최근 기록 데이터
const recentRecords = [
  {
    id: 1,
    mode: "랭크",
    score: 4850,
    date: "2024.12.29",
    region: "",
  },
  {
    id: 2,
    mode: "연습",
    score: 4200,
    date: "2024.12.29",
    region: "부산",
  },
  {
    id: 3,
    mode: "랭크",
    score: 4600,
    date: "2024.12.28",
    region: "",
  },
  {
    id: 4,
    mode: "랭크",
    score: 4350,
    date: "2024.12.28",
    region: "",
  },
  {
    id: 5,
    mode: "랭크",
    score: 4100,
    date: "2024.12.27",
    region: "",
  },
];

// computed 속성
const isGameStartReady = computed(() => {
  if (selectedGameMode.value?.id === "practice")
    return selectedRegion.value !== null;
  if (selectedGameMode.value?.id === "rank") return true;
  return false;
});

// 컴포넌트 마운트 시 실행
onMounted(() => {
  fetchUserStats();
});

// 지역 선택 함수
function selectRegion(region) {
  selectedRegion.value = region;
}

// 게임 시작 함수
async function startGame() {
  if (!isGameStartReady.value) return;

  isLoading.value = true;

  const gameData = {
    mode: selectedGameMode.value.id,
    region: selectedRegion.value,
  };

  console.log("Starting game with:", gameData);

  try {
    // 실제 구현에서는 API 호출로 대체
    // const response = await axios.post('/api/game/start', gameData);

    // 테스트를 위한 타임아웃
    setTimeout(() => {
      isLoading.value = false;
      // 게임 화면으로 라우팅하는 로직이 구현되어야 함
      // router.push({
      //   name: 'roadViewPlay',
      //   params: { gameId: 'generated-id' }
      // });
    }, 1500);
  } catch (error) {
    console.error("게임 시작 중 오류 발생:", error);
    isLoading.value = false;
  }
}

// 숫자 포맷팅 함수
function formatNumber(number) {
  return number.toLocaleString();
}

// 프로필 메뉴 토글 함수
function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}

// 랭크 아이콘 가져오기 함수
function getRankIcon(rank) {
  // 랭크에 따른 아이콘 클래스 반환
  if (rank.includes("Gold")) return "fas fa-trophy gold";
  if (rank.includes("Silver")) return "fas fa-trophy silver";
  if (rank.includes("Bronze")) return "fas fa-trophy bronze";
  return "fas fa-trophy";
}

// 사용자 통계 가져오기 함수
async function fetchUserStats() {
  try {
    // 실제 구현에서는 API 호출로 대체
    // const response = await axios.get('/api/user/stats');
    // stats.value = response.data.stats;
    // userRank.value = response.data.userRank;
    // recentRecords.value = response.data.recentRecords;
    // 테스트 데이터는 이미 설정되어 있음
  } catch (error) {
    console.error("사용자 통계 조회 중 오류 발생:", error);
  }
}

// 게임 모드 팝업 열기 함수
function openGameModePopup(mode) {
  if (mode.id === "theme") {
    showThemeModePopup.value = true;
  } else {
    selectedGameMode.value = mode;
    selectedRegion.value = null;
  }
}

// 테마 모드 팝업 닫기 함수
function closeThemeModePopup() {
  showThemeModePopup.value = false;
}

// 게임 모드 팝업 닫기 함수
function closeGameModePopup() {
  selectedGameMode.value = null;
  selectedRegion.value = null;
}

// 테마 게임 시작 함수
function startThemeGame(gameData) {
  isLoading.value = true;
  console.log("Starting theme game with:", gameData);

  try {
    // 실제 구현에서는 API 호출로 대체
    // const response = await axios.post('/api/game/start', gameData);

    // 테스트를 위한 타임아웃
    setTimeout(() => {
      isLoading.value = false;
      showThemeModePopup.value = false;
      // 게임 화면으로 라우팅하는 로직이 구현되어야 함
      // router.push({
      //   name: 'themePlay',
      //   params: { themeId: gameData.themeId }
      // });
    }, 1500);
  } catch (error) {
    console.error("테마 게임 시작 중 오류 발생:", error);
    isLoading.value = false;
  }
}
</script>

<style scoped>
@import url("@/assets/styles/common/header.css");
@import url("@/assets/styles/common/footer.css");
@import url("@/assets/styles/common/slide-menu/slide-menu.css");
@import url("@/assets/styles/game/roadView/roadview-main.css");
</style>
