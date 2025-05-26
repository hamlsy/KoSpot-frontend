<template>
  <div class="photo-mode-container">
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="$router.push('/mainPage')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <app-logo class="home-link" to="/mainPage" />
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

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLogo from "@/components/common/AppLogo.vue";
import useGame from '@/composables/useGame';
import useAuth from '@/composables/useAuth';
import gameService from '@/api/gameService';

export default {
  name: "PhotoModeGame",
  components: {
    AppLogo,
  },
  setup() {
    const router = useRouter();
    const { user, isLoggedIn } = useAuth();
    const { gameState, startGame: initGame } = useGame();
    
    // 상태 정의
    const isLoading = ref(false);
    const selectedGameMode = ref(null);
    const selectedRegion = ref(null);
    const selectedTheme = ref(null);
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
        id: 2,
        mode: "테마",
        score: 3950,
        date: "2024.12.28",
        region: "산과 숲",
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
      {
        id: 5,
        mode: "테마",
        score: 3720,
        date: "2024.12.26",
        region: "궁궐과 사찰",
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
      {
        id: "theme",
        title: "테마 모드",
        shortDescription: "특별한 테마의 사진으로 게임을 즐겨보세요",
        fullDescription:
          "테마 모드에서는 '산과 숲', '해변과 바다', '도시 풍경', '궁궐과 사찰' 등 특정 테마의 사진들로 게임을 즐길 수 있습니다. 점수는 기록되지만 랭킹에는 반영되지 않습니다.",
        icon: "fas fa-image",
        color: "theme-color",
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

    // 테마 데이터
    const themes = [
      { id: "mountains", name: "산과 숲", icon: "fas fa-mountain" },
      { id: "beaches", name: "해변과 바다", icon: "fas fa-umbrella-beach" },
      { id: "cityscape", name: "도시 풍경", icon: "fas fa-city" },
      { id: "palaces", name: "궁궐과 사찰", icon: "fas fa-torii-gate" },
      { id: "landmarks", name: "유명 랜드마크", icon: "fas fa-landmark" },
      { id: "nature", name: "자연 경관", icon: "fas fa-leaf" },
      { id: "festivals", name: "축제와 행사", icon: "fas fa-music" },
      { id: "food", name: "음식과 시장", icon: "fas fa-utensils" },
    ];

    // 게임 시작 준비 상태 계산
    const isGameStartReady = computed(() => {
      if (selectedGameMode.value?.id === "practice")
        return selectedRegion.value !== null;
      if (selectedGameMode.value?.id === "theme")
        return selectedTheme.value !== null;
      if (selectedGameMode.value?.id === "rank") return true;
      return false;
    });

    // 게임 모드 팝업 열기
    const openGameModePopup = (mode) => {
      selectedGameMode.value = mode;
      selectedRegion.value = null;
      selectedTheme.value = null;
    };

    // 게임 모드 팝업 닫기
    const closeGameModePopup = () => {
      selectedGameMode.value = null;
      selectedRegion.value = null;
      selectedTheme.value = null;
    };

    // 지역 선택
    const selectRegion = (region) => {
      selectedRegion.value = region;
    };

    // 테마 선택
    const selectTheme = (themeId) => {
      selectedTheme.value = themeId;
    };

    // 게임 시작
    const startGame = async () => {
      if (!isGameStartReady.value) return;

      isLoading.value = true;

      const gameData = {
        mode: selectedGameMode.value.id,
        region: selectedRegion.value,
        theme: selectedTheme.value,
        totalRounds: 5 // 기본 라운드 수
      };

      try {
        // 게임 데이터 로드 및 게임 시작
        await initGame('photo', {
          region: gameData.region,
          theme: gameData.theme,
          totalRounds: gameData.totalRounds
        });

        // 게임 모드에 따라 라우팅
        if (gameData.mode === 'practice') {
          router.push({
            name: 'PhotoModePractice',
            query: {
              region: gameData.region,
              theme: gameData.theme,
              totalRounds: gameData.totalRounds
            }
          });
        } else if (gameData.mode === 'rank') {
          router.push({ name: 'PhotoModeRank' });
        } else if (gameData.mode === 'theme') {
          router.push({
            name: 'PhotoModePractice',
            query: {
              mode: 'theme',
              theme: gameData.theme,
              totalRounds: gameData.totalRounds
            }
          });
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

    // 사용자 통계 가져오기
    const fetchUserStats = async () => {
      try {
        if (isLoggedIn.value) {
          // API 서비스를 사용하여 사용자 게임 통계 가져오기
          const response = await gameService.getUserGameStats(user.value.id);
          stats.value = response.data.stats;
          userRank.value = response.data.userRank;
          
          // 최근 게임 기록 가져오기
          const historyResponse = await gameService.getUserGameHistory(user.value.id, {
            gameMode: 'photo',
            limit: 5
          });
          recentRecords.value = historyResponse.data;
        }
      } catch (error) {
        console.error("사용자 통계 조회 중 오류 발생:", error);
      }
    };

    // 컴포넌트 마운트 시 사용자 통계 가져오기
    onMounted(() => {
      fetchUserStats();
    });

    return {
      isLoading,
      selectedGameMode,
      selectedRegion,
      selectedTheme,
      hoverMode,
      hoverRecord,
      showProfileMenu,
      userRank,
      gameModes,
      regions,
      themes,
      stats,
      recentRecords,
      isGameStartReady,
      openGameModePopup,
      closeGameModePopup,
      selectRegion,
      selectTheme,
      startGame,
      formatNumber,
      toggleProfileMenu,
      getRankIcon
    };
  }
</script>

<style scoped>
@import url("@/assets/styles/common/header.css");
@import url("@/assets/styles/common/footer.css");
@import url("@/assets/styles/common/slide-menu/slide-menu.css");
@import url("@/assets/styles/game/photoMode/photomode-main.css");

/* Popup Animation */
.popup-slide-enter-active {
  transition: opacity 0.25s ease;
}

.popup-slide-enter-from {
  opacity: 0;
}
</style>