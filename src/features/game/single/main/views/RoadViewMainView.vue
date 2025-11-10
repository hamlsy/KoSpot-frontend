<template>
  <div class="road-view-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="$router.push('/')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <app-logo class="home-link" to="/" />
        <div class="header-right">
          <h3>로드뷰 모드</h3>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- Google Ads Space - 일시적으로 숨김 -->
      <!-- <section class="google-ads-space">
        <div class="ads-container">
          <div class="ads-placeholder">
            <p>Google Ads 영역</p>
          </div>
        </div>
      </section> -->

      <!-- Game Modes Section -->
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
        <div class="section-header">
          <h2 class="section-title">최근 기록</h2>
          <button 
            class="view-all-button" 
            @click="showHistoryModal = true"
            v-if="recentRecords.length > 0"
          >
            전체 기록 보기
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
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
                  // 'theme-mode': record.mode === '테마',
                }"
              >
                {{ record.mode }}
              </div>
              <span class="record-poi">{{ record.poiName }}</span>
              <span v-if="record.region" class="record-region">{{ record.region }}</span>
              <p class="record-score">{{ formatNumber(Math.round(record.score)) }}점</p>
            </div>
            <span class="record-date">{{ record.date }}</span>
          </div>
          
          <div v-if="recentRecords.length === 0" class="no-records">
            <p>아직 플레이 기록이 없습니다.</p>
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

          <div 
            v-if="!showPracticeTutorial || selectedGameMode.id !== 'practice'"
            class="popup-description"
          >
            <p>{{ selectedGameMode.fullDescription }}</p>
          </div>

          <!-- 연습 게임 튜토리얼 모달 -->
          <practice-tutorial-modal
            v-if="selectedGameMode.id === 'practice'"
            :show="showPracticeTutorial"
            @close="showPracticeTutorial = false"
            @complete="handleTutorialComplete"
          />

          <div
            v-if="selectedGameMode.id === 'practice' && !showPracticeTutorial"
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

          <div 
            v-if="selectedGameMode.id === 'rank' && (!showPracticeTutorial || selectedGameMode.id !== 'practice')" 
            class="rank-mode-options"
          >
            <div class="rank-info-card">
              <div class="rank-info-header">
                <span class="rank-label">현재 랭크</span>
                <div class="rank-icon" v-if="rankInfo">
                  <i :class="getRankIcon(userRank)"></i>
                </div>
              </div>
              <div class="rank-info-content">
                <div class="rank-tier-level" v-if="rankInfo">
                  <span class="rank-value">{{ userRank }}</span>
                </div>
                <div class="rank-rating" v-if="rankInfo">
                  <span class="rating-label">레이팅</span>
                  <span class="rating-value">{{ formatNumber(rankInfo.ratingScore) }}</span>
                </div>
                <div v-else class="rank-loading">
                  <p>랭크 정보를 불러오는 중...</p>
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="!showPracticeTutorial || selectedGameMode.id !== 'practice'"
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

    <!-- History Modal -->
    <history-modal
      :show="showHistoryModal"
      @close="showHistoryModal = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import AppLogo from "@/core/components/AppLogo.vue";
import ThemeModePopup from 'src/features/game/single/main/components/Theme/ThemeModePopup.vue'
import GameModeCard from "@/features/game/shared/components/Common/GameModeCard.vue";
import HistoryModal from "@/features/game/single/main/components/HistoryModal.vue";
import PracticeTutorialModal from "@/features/game/single/main/components/PracticeTutorialModal.vue";
import roadViewMainService from "@/features/game/single/main/services/roadViewMain.service";

// 라우터 설정
const router = useRouter();

// 반응형 상태 정의
const selectedGameMode = ref(null);
const selectedRegion = ref(null);
const userRank = ref("Gold III");
const showProfileMenu = ref(false);
const hoverMode = ref(null);
const hoverStat = ref(null);
const hoverRecord = ref(null);
const showThemeModePopup = ref(false);
const showHistoryModal = ref(false);
const showPracticeTutorial = ref(false);

// API 데이터 상태
const rankInfo = ref(null);
const statisticInfo = ref(null);
const recentGamesData = ref([]);

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
  // {
  //   id: "theme",
  //   title: "테마 게임",
  //   icon: "fas fa-map-marked-alt",
  //   shortDescription: "특별한 테마로 즐기는 게임",
  //   color: "theme-color",
  // },
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

// 지역 데이터 (백엔드 sido key 기반)
const regions = {
  서울: "SEOUL",
  부산: "BUSAN", 
  대구: "DAEGU",
  인천: "INCHEON",
  광주: "GWANGJU",
  대전: "DAEJEON",
  울산: "ULSAN",
  세종: "SEJONG",
  경기: "GYEONGGI",
  강원: "GANGWON",
  충북: "CHUNGBUK",
  충남: "CHUNGNAM",
  전북: "JEONBUK",
  전남: "JEONNAM",
  경북: "GYEONGBUK",
  경남: "GYEONGNAM",
  제주: "JEJU",
};

// 지역 코드를 한글로 변환하는 맵
const regionMap = {
  SEOUL: '서울',
  BUSAN: '부산',
  DAEGU: '대구',
  INCHEON: '인천',
  GWANGJU: '광주',
  DAEJEON: '대전',
  ULSAN: '울산',
  SEJONG: '세종',
  GYEONGGI: '경기',
  GANGWON: '강원',
  CHUNGBUK: '충북',
  CHUNGNAM: '충남',
  JEONBUK: '전북',
  JEONNAM: '전남',
  GYEONGBUK: '경북',
  GYEONGNAM: '경남',
  JEJU: '제주'
};

// 티어를 한글로 변환하는 맵
const tierMap = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond',
  MASTER: 'Master'
};

// 레벨을 숫자로 변환하는 맵
const levelMap = {
  ONE: '1',
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5'
};

// 통계 데이터 (computed)
const stats = computed(() => {
  if (!rankInfo.value || !statisticInfo.value) {
    return [
      { icon: "fas fa-trophy", label: "내 랭크", value: "-" },
      { icon: "fas fa-trophy", label: "내 레이팅 점수", value: "-" },
      { icon: "fas fa-clock", label: "총 플레이 수", value: "-" },
      { icon: "fas fa-medal", label: "최고 점수", value: "-" },
      { icon: "fas fa-users", label: "전체 랭킹", value: "-" },
    ];
  }

  const tier = tierMap[rankInfo.value.rankTier] || rankInfo.value.rankTier;
  const level = levelMap[rankInfo.value.rankLevel] || rankInfo.value.rankLevel;
  const rankDisplay = `${tier} ${level}`;

  return [
    { icon: "fas fa-trophy", label: "내 랭크", value: rankDisplay },
    { icon: "fas fa-trophy", label: "내 레이팅 점수", value: rankInfo.value.ratingScore.toLocaleString() },
    { icon: "fas fa-clock", label: "총 플레이 수", value: `${statisticInfo.value.rankPlayCount} 판` },
    { icon: "fas fa-medal", label: "평균 점수", value: `${formatNumber(Math.round(statisticInfo.value.rankAvgScore))}점` },
    { icon: "fas fa-users", label: "전체 랭킹", value: `상위 ${rankInfo.value.rankPercentage}%` },
  ];
});

// 최근 기록 데이터 (computed)
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

// computed 속성
const isGameStartReady = computed(() => {
  if (selectedGameMode.value?.id === "practice")
    return selectedRegion.value !== null;
  if (selectedGameMode.value?.id === "rank") return true;
  return false;
});

// 컴포넌트 마운트 시 실행
onMounted(async () => {
  // DOM이 완전히 렌더링된 후 페이지 상단으로 스크롤
  await nextTick();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // 로그인 여부 확인
  const isLoggedIn = !!localStorage.getItem('accessToken');
  
  if (!isLoggedIn) {
    // 로그인하지 않은 경우 메인 페이지로 리다이렉션
    alert('로그인한 사용자만 접근할 수 있습니다.');
    router.push('/');
    return;
  }
  
  fetchMainPageData();
});

// 지역 선택 함수
function selectRegion(region) {
  selectedRegion.value = region;
}

// 게임 시작 함수
async function startGame() {
  if (!isGameStartReady.value) return;

  try {
    if (selectedGameMode.value.id === "practice") {
      // 연습 모드: sido key와 함께 라우팅
      const sidoKey = selectedRegion.value; // 이미 SEOUL, BUSAN 등의 형태
      
      console.log("Starting practice game with sido:", sidoKey);
      
      // 연습 게임 화면으로 라우팅 (sido를 쿼리 파라미터로 전달)
      await router.push({
        path: '/roadView/practice',
        query: { sido: sidoKey }
      });
      
    } else if (selectedGameMode.value.id === "rank") {
      // 랭크 모드: 바로 랭크 게임 화면으로 라우팅
      console.log("Starting rank game");
      
      await router.push({
        path: '/roadView/rank'
      });
    }
    
    closeGameModePopup();
    
  } catch (error) {
    console.error("게임 시작 중 오류 발생:", error);
  }
}

// 숫자 포맷팅 함수
function formatNumber(number) {
  return number.toLocaleString();
}

// 날짜 포맷팅 함수 (짧은 형식)
function formatDateShort(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 프로필 메뉴 토글 함수
function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}

// 랭크 아이콘 가져오기 함수
function getRankIcon(rank) {
  // 랭크에 따른 아이콘 클래스 반환
  if (rank.includes("Master")) return "fas fa-trophy master";
  if (rank.includes("Diamond")) return "fas fa-trophy diamond";
  if (rank.includes("Platinum")) return "fas fa-trophy platinum";
  if (rank.includes("Gold")) return "fas fa-trophy gold";
  if (rank.includes("Silver")) return "fas fa-trophy silver";
  if (rank.includes("Bronze")) return "fas fa-trophy bronze";
  return "fas fa-trophy";
}

// 더미 데이터 생성 함수 (인터넷 연결 실패 시 사용)
function getDummyData() {
  return {
    rankInfo: {
      rankTier: 'GOLD',
      rankLevel: 'THREE',
      ratingScore: 1250,
      rankPercentage: 35.5
    },
    statisticInfo: {
      totalPlayCount: 42,
      bestScore: 8500
    },
    recentGames: []
  };
}

// 메인 페이지 데이터 가져오기 함수
async function fetchMainPageData() {
  try {
    const response = await roadViewMainService.getMainPageData();
    
    if (response.data.isSuccess) {
      const result = response.data.result;
      
      // 랭크 정보 저장
      rankInfo.value = result.rankInfo;
      
      // 통계 정보 저장
      statisticInfo.value = result.statisticInfo;
      
      // 최근 게임 기록 저장
      recentGamesData.value = result.recentGames;
      
      // userRank도 업데이트 (랭크 모드 팝업에서 사용)
      const tier = tierMap[result.rankInfo.rankTier] || result.rankInfo.rankTier;
      const level = levelMap[result.rankInfo.rankLevel] || result.rankInfo.rankLevel;
      userRank.value = `${tier} ${level}`;
      
      console.log("메인 페이지 데이터 로드 완료:", result);
    } else {
      console.error("메인 페이지 데이터 조회 실패:", response.data.message);
      // API 응답 실패 시 더미 데이터 사용
      useDummyData();
    }
  } catch (error) {
    console.error("메인 페이지 데이터 조회 중 오류 발생:", error);
    
    // 인터넷 연결 실패 또는 API 오류 시 더미 데이터 사용
    useDummyData();
  }
}

// 더미 데이터 사용 함수
function useDummyData() {
  const dummyData = getDummyData();
  
  // 더미 랭크 정보 저장
  rankInfo.value = dummyData.rankInfo;
  
  // 더미 통계 정보 저장
  statisticInfo.value = dummyData.statisticInfo;
  
  // 더미 최근 게임 기록 저장
  recentGamesData.value = dummyData.recentGames;
  
  // userRank도 업데이트 (랭크 모드 팝업에서 사용)
  const tier = tierMap[dummyData.rankInfo.rankTier] || dummyData.rankInfo.rankTier;
  const level = levelMap[dummyData.rankInfo.rankLevel] || dummyData.rankInfo.rankLevel;
  userRank.value = `${tier} ${level}`;
  
  console.log("더미 데이터로 표시합니다:", dummyData);
}

// 게임 모드 팝업 열기 함수
function openGameModePopup(mode) {
  if (mode.id === "theme") {
    showThemeModePopup.value = true;
  } else {
    selectedGameMode.value = mode;
    selectedRegion.value = null;
    
    // 연습 게임인 경우 튜토리얼 표시
    if (mode.id === "practice") {
      showPracticeTutorial.value = true;
    }
  }
}

// 튜토리얼 완료 핸들러
function handleTutorialComplete() {
  showPracticeTutorial.value = false;
  // 튜토리얼 완료 후 지역 선택으로 이동할 수 있도록 처리
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
  console.log("Starting theme game with:", gameData);

  try {
    showThemeModePopup.value = false;
    // 게임 화면으로 라우팅하는 로직이 구현되어야 함
    // router.push({
    //   name: 'themePlay',
    //   params: { themeId: gameData.themeId }
    // });
  } catch (error) {
    console.error("테마 게임 시작 중 오류 발생:", error);
  }
}
</script>

<style scoped>
@import url("@/shared/assets/styles/common/header.css");
@import url("@/shared/assets/styles/common/footer.css");
@import url("@/shared/assets/styles/common/slide-menu/slide-menu.css");
@import url("@/shared/assets/styles/game/roadView/roadview-main.css");

.practice-mode-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.region-selector {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  width: 100%;
}


@media (max-width: 640px) {
  .practice-mode-options {
    gap: 0.75rem;
  }

  .region-selector {
    gap: 0.5rem;
  }

  .region-selector button {
    padding: 0.5rem 0.6rem;
    font-size: 0.82rem;
  }
}

/* Google Ads 공간 스타일 */
.google-ads-space {
  margin: 20px 0;
  padding: 0 20px;
}

.ads-container {
  width: 100%;
  min-height: 120px;
  background-color: #f8f9fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px dashed #dee2e6;
}

.ads-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.ads-placeholder p {
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.popup-header {
  margin: 8px;
}

/* 반응형 */
@media (max-width: 768px) {
  .google-ads-space {
    padding: 0 15px;
  }
  
  .ads-container {
    min-height: 100px;
  }
}
</style>
