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
      <section class="game-modes">
        <div class="game-mode-list">
          <div
            v-for="mode in gameModes"
            :key="mode.id"
            class="game-mode-card"
            @click="openGameModePopup(mode)"
            :class="{ 'mode-card-hover': hoverMode === mode.id }"
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

      <section class="ad-space">
        <div class="ad-container">
          <div class="ad-content">
            <p>광고 영역</p>
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
            :class="{ 'stat-card-hover': hoverStat === stat.label }"
            @mouseenter="hoverStat = stat.label"
            @mouseleave="hoverStat = null"
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

          <div
            v-if="selectedGameMode.id === 'theme'"
            class="theme-mode-options"
          >
            <h3>테마 선택</h3>
            <div class="theme-selector">
              <div
                v-for="theme in themes"
                :key="theme.id"
                class="theme-card"
                :class="{ selected: selectedTheme === theme.id }"
                @click="selectTheme(theme.id)"
              >
                <div class="theme-icon">
                  <i :class="theme.icon"></i>
                </div>
                <div class="theme-info">
                  <h4>{{ theme.name }}</h4>
                  <p>{{ theme.description }}</p>
                </div>
              </div>
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
import AppLogo from "@/components/common/AppLogo.vue";
export default {
  name: "PhotoModeGame",
  components: {
    AppLogo,
  },

  data() {
    return {
      selectedGameMode: null,
      selectedRegion: null,
      selectedTheme: null,
      userRank: "Silver II",
      showProfileMenu: false,
      isLoading: false,
      hoverMode: null,
      hoverStat: null,
      hoverRecord: null,

      gameModes: [
        {
          id: "practice",
          title: "연습 게임",
          icon: "fas fa-graduation-cap",
          shortDescription: "지역을 선택하고 쉽게 연습해보세요",
          fullDescription:
            "특정 지역의 관광지 사진으로 연습할 수 있는 모드입니다. 편안한 속도로 학습하세요.",
          color: "practice-color",
        },
        {
          id: "theme",
          title: "테마 게임",
          icon: "fas fa-map-marked-alt",
          shortDescription: "특별한 테마로 즐기는 게임",
          fullDescription:
            "산, 바다, 궁궐 등 특별한 테마별로 구성된 사진 모음으로 즐기는 모드입니다.",
          color: "theme-color",
        },
        {
          id: "rank",
          title: "랭크 게임",
          icon: "fas fa-trophy",
          shortDescription: "랜덤 사진으로 다른 플레이어와 경쟁하세요",
          fullDescription:
            "전국 랭킹에 도전하는 경쟁 모드입니다. 관광지 사진을 보고 위치를 맞춰 최고의 성적을 목표로 하세요.",
          color: "rank-color",
        },
      ],
      regions: {
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
      },

      themes: [
        {
          id: "mountain",
          name: "산과 숲",
          icon: "fas fa-mountain",
          description: "한국의 아름다운 산과 숲 풍경",
        },
        {
          id: "sea",
          name: "바다와 해변",
          icon: "fas fa-water",
          description: "동해, 서해, 남해의 다양한 해안선",
        },
        {
          id: "palace",
          name: "궁궐과 사찰",
          icon: "fas fa-torii-gate",
          description: "한국의 전통 건축물",
        },
        {
          id: "modern",
          name: "현대 도시",
          icon: "fas fa-city",
          description: "현대적인 도시 경관",
        },
      ],

      stats: [
        { icon: "fas fa-medal", label: "최고 점수", value: "4,320점" },
        { icon: "fas fa-clock", label: "총 플레이 수", value: "238 판" },
        { icon: "fas fa-users", label: "전체 랭킹", value: "상위 22%" },
        { icon: "fas fa-trophy", label: "내 랭크", value: "Silver 2" },
      ],

      recentRecords: [
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
      ],
    };
  },

  computed: {
    isGameStartReady() {
      if (this.selectedGameMode?.id === "practice")
        return this.selectedRegion !== null;
      if (this.selectedGameMode?.id === "theme")
        return this.selectedTheme !== null;
      if (this.selectedGameMode?.id === "rank") return true;
      return false;
    },
  },

  mounted() {
    this.fetchUserStats();
  },

  methods: {
    openGameModePopup(mode) {
      this.selectedGameMode = mode;
      this.selectedRegion = null;
      this.selectedTheme = null;
    },

    closeGameModePopup() {
      this.selectedGameMode = null;
      this.selectedRegion = null;
      this.selectedTheme = null;
    },

    selectRegion(region) {
      this.selectedRegion = region;
    },

    selectTheme(themeId) {
      this.selectedTheme = themeId;
    },

    async startGame() {
      if (!this.isGameStartReady) return;

      this.isLoading = true;

      const gameData = {
        mode: this.selectedGameMode.id,
        region: this.selectedRegion,
        theme: this.selectedTheme,
      };

      console.log("Starting game with:", gameData);

      try {
        // 실제 구현에서는 API 호출로 대체
        // const response = await axios.post('/api/photo-game/start', gameData);

        // 테스트를 위한 타임아웃
        setTimeout(() => {
          this.isLoading = false;
          // 게임 화면으로 라우팅하는 로직이 구현되어야 함
          // this.$router.push({
          //   name: 'photoModePlay',
          //   params: { gameId: 'generated-id' }
          // });
        }, 1500);
      } catch (error) {
        console.error("게임 시작 중 오류 발생:", error);
        this.isLoading = false;
      }
    },

    formatNumber(number) {
      return number.toLocaleString();
    },

    // 필요 시 사용할 예정이므로 유지
    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu;
    },

    getRankIcon(rank) {
      // 랭크에 따른 아이콘 클래스 반환
      if (rank.includes("Gold")) return "fas fa-trophy gold";
      if (rank.includes("Silver")) return "fas fa-trophy silver";
      if (rank.includes("Bronze")) return "fas fa-trophy bronze";
      return "fas fa-trophy";
    },

    async fetchUserStats() {
      try {
        // 실제 구현에서는 API 호출로 대체
        // const response = await axios.get('/api/user/photo-stats');
        // this.stats = response.data.stats;
        // this.userRank = response.data.userRank;
        // this.recentRecords = response.data.recentRecords;
        // 테스트 데이터는 이미 설정되어 있음
      } catch (error) {
        console.error("사용자 통계 조회 중 오류 발생:", error);
      }
    },
  },
};
</script>
  
  <style scoped>
@import url("@/assets/styles/common/header.css");
@import url("@/assets/styles/common/footer.css");
@import url("@/assets/styles/common/slide-menu/slide-menu.css");

.photo-mode-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
  padding-bottom: 40px;
  position: relative;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-button {
  background: none;
  border: none;
  color: #333;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-right: 1rem;
}

.back-button:hover {
  transform: translateX(-3px);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  background: #e74c3c;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-left: 0.5rem;
}

.header-right {
  margin-left: auto;
}

.header-right h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.main-content {
  padding: 80px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.4rem;
  color: #333;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(135deg, #4ca1af 0%, #2c3e50 100%);
  border-radius: 3px;
}

.game-modes {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  padding: 1rem 0;
  margin-bottom: 2rem;
}

.game-mode-list {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.game-mode-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16px;
  padding: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 8rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 250px;
  max-width: 350px;
}

.game-mode-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mode-card-hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.mode-card-hover::before {
  opacity: 1;
}

.game-mode-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.2rem;
  background: linear-gradient(135deg, #4ca1af 0%, #2c3e50 100%);
  color: white;
  font-size: 1.8rem;
  box-shadow: 0 4px 10px rgba(76, 161, 175, 0.3);
  transition: transform 0.3s ease;
}

.mode-card-hover .game-mode-icon {
  transform: scale(1.05);
}

.practice-color {
  background: linear-gradient(135deg, #4ca1af 0%, #2c3e50 100%);
  box-shadow: 0 4px 10px rgba(76, 161, 175, 0.3);
}

.theme-color {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.rank-color {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
  box-shadow: 0 4px 10px rgba(25, 118, 210, 0.3);
}

.game-mode-details {
  flex-grow: 1;
}

.game-mode-details h3 {
  margin: 0 0 0.6rem 0;
  font-size: 1.2rem;
  color: #333;
}

.game-mode-details p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.4;
}

.game-mode-arrow {
  color: #999;
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.mode-card-hover .game-mode-arrow {
  transform: translateX(3px);
  color: #555;
}

.ad-space {
  margin: 1.5rem 0;
  padding: 0.5rem;
}

.ad-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ad-content {
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 90px;
  background: linear-gradient(135deg, #f5f5f5 0%, #eaeaea 100%);
  color: #999;
  font-size: 0.9rem;
}

.stats-section {
  margin: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.2rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card-hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #666;
  margin-bottom: 0.7rem;
}

.stat-header i {
  font-size: 1.1rem;
  color: #4ca1af;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.records-section {
  margin: 2rem 0;
}

.records-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.record-item {
  padding: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
}

.record-item.with-border {
  border-bottom: 1px solid #eee;
}

.record-item-hover {
  background: #f9f9f9;
}

.record-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.record-mode-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.rank-mode {
  background: #e3f2fd;
  color: #1976d2;
}

.practice-mode {
  background: #e8f5e9;
  color: #2e7d32;
}

.theme-mode {
  background: #e1f5fe;
  color: #0288d1;
}

.record-region {
  color: #666;
  font-size: 0.9rem;
}

.record-score {
  font-weight: bold;
  font-size: 1.1rem;
  color: #333;
  margin: 0;
}

.record-date {
  color: #888;
  font-size: 0.85rem;
}

.game-mode-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.popup-content {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.popup-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-button:hover {
  color: #333;
}

.popup-description {
  margin-bottom: 2rem;
}

.popup-description p {
  color: #555;
  line-height: 1.6;
  font-size: 1rem;
}

.practice-mode-options h3,
.theme-mode-options h3,
.rank-mode-options h3 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
}

.region-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-bottom: 2rem;
}

.region-selector button {
  padding: 0.7rem 1.2rem;
  border-radius: 12px;
  background: #f0f2f5;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  color: #333;
}

.region-selector button:hover {
  background: #e8e8e8;
}

.region-selector button.selected {
  background: linear-gradient(135deg, #4ca1af 0%, #2c3e50 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(76, 161, 175, 0.3);
}

.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.theme-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  background: #f0f2f5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-card:hover {
  background: #e8e8e8;
}

.theme-card.selected {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.theme-card.selected .theme-info h4,
.theme-card.selected .theme-info p {
  color: white;
}

.theme-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
  color: #3498db;
}

.theme-info {
  flex-grow: 1;
}

.theme-info h4 {
  margin: 0 0 0.3rem 0;
  font-size: 1.1rem;
  color: #333;
}

.theme-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.rank-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 12px;
}

.current-rank {
  font-size: 1.1rem;
  font-weight: bold;
}

.rank-icon i {
  font-size: 2rem;
}

.rank-icon i.gold {
  color: #ffc107;
}

.rank-icon i.silver {
  color: #9e9e9e;
}

.rank-icon i.bronze {
  color: #cd7f32;
}

.start-game-button {
  width: 100%;
  padding: 1.2rem;
  background: linear-gradient(135deg, #4ca1af 0%, #2c3e50 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(76, 161, 175, 0.3);
}

.start-game-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(76, 161, 175, 0.4);
}

.start-game-button.theme-color {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.start-game-button.theme-color:hover:not(:disabled) {
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.4);
}

.start-game-button.rank-color {
  background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
  box-shadow: 0 4px 10px rgba(25, 118, 210, 0.3);
}

.start-game-button.rank-color:hover:not(:disabled) {
  box-shadow: 0 6px 15px rgba(25, 118, 210, 0.4);
}

.start-game-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner i {
  font-size: 3rem;
  color: #4ca1af;
  margin-bottom: 1rem;
}

.loading-spinner p {
  color: #333;
  font-size: 1.2rem;
}

.popup-slide-enter-active,
.popup-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-slide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.popup-slide-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .game-mode-list {
    flex-direction: column;
    align-items: center;
  }

  .game-mode-card {
    max-width: 100%;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .header-content {
    padding: 0.8rem 1rem;
  }

  .logo {
    font-size: 1.5rem;
  }

  .header-right h3 {
    font-size: 1rem;
  }

  .popup-content {
    width: 95%;
    padding: 1.5rem;
  }

  .region-selector {
    flex-direction: row;
  }

  .region-selector button {
    flex-basis: calc(50% - 0.4rem);
  }

  .section-title {
    font-size: 1.2rem;
  }

  .stat-value {
    font-size: 1.2rem;
  }

  .record-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 70px 15px 15px;
  }

  .stats-grid {
    gap: 0.8rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .record-item {
    padding: 1rem;
  }

  .region-selector button {
    flex-basis: 100%;
  }

  .theme-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
}
</style>