<template>
  <div class="my-info-page">
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="goBack">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h1 class="page-title">내 정보</h1>
        <button class="settings-button" @click="openSettings">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    </header>

    <main class="main-content">
      <section class="profile-section">
        <div class="profile-header">
          <div class="profile-picture" @click="changeProfilePicture">
            <img :src="userInfo.profilePicture" alt="프로필 사진" />
            <div class="change-picture-overlay">
              <i class="fas fa-camera"></i>
            </div>
          </div>
          <div class="profile-info">
            <h2 class="nickname">{{ userInfo.nickname }}</h2>
            <div class="email-container">
              <p class="email">{{ userInfo.email }}</p>
              <img
                :src="getLoginMethodBadge(userInfo.loginMethod)"
                :alt="userInfo.loginMethod"
                class="login-badge"
              />
            </div>
            <p class="join-date">가입일: {{ userInfo.joinDate }}</p>
          </div>
        </div>
        <div class="level-info">
          <div class="level-badge">
            <span class="level-number">Lv.{{ userInfo.level }}</span>
          </div>
          <div class="level-progress-container">
            <div class="level-progress-bar">
              <div
                class="level-progress"
                :style="{ width: `${userInfo.levelProgress}%` }"
              ></div>
            </div>
            <span class="level-percentage"
              >{{ userInfo.levelProgress }}% ({{ userInfo.currentXP }}/{{
                userInfo.requiredXP
              }}
              XP)</span
            >
          </div>
        </div>
      </section>

      <section class="game-modes-section">
        <h3 class="section-title">랭크 정보</h3>
        <div class="game-modes-tabs">
          <button
            v-for="mode in gameModes"
            :key="mode.name"
            @click="setActiveMode(mode.name)"
            :class="['mode-tab', { active: activeMode === mode.name }]"
          >
            {{ mode.name }}
          </button>
        </div>
        <div
          class="game-mode-details"
          v-for="mode in gameModes"
          :key="mode.name"
          v-show="activeMode === mode.name"
        >
          <div class="mode-icon" :class="mode.class">
            <i :class="mode.icon"></i>
          </div>
          <div class="mode-info">
            <h4 class="mode-name">{{ mode.name }}</h4>
            <p class="mode-tier">{{ mode.tier }}</p>
            <p class="mode-rank-points">{{ mode.rankPoints }} RP</p>
            <p class="mode-total-games">총 {{ mode.totalGames }}게임</p>
          </div>
          <div class="mode-chart">
            <!-- Add a placeholder for a chart or graph showing rank progress -->
            <div class="rank-progress-chart"></div>
          </div>
        </div>
      </section>

      <section class="inventory-section">
      <h3 class="section-title">인벤토리</h3>
      <div class="inventory-summary">
        <div class="inventory-item">
          <i class="fas fa-coins"></i>
          <span class="item-value">{{ userInfo.points }} 포인트</span>
        </div>
        <button class="view-history-button" @click="showPointHistory">
          포인트 기록 보기
        </button>
      </div>
      <div class="inventory-carousel">
        <div class="inventory-items">
          <div 
            v-for="item in inventory" 
            :key="item.id"
            class="inventory-card"
            :class="{ 'equipped': item.equipped }"
            @click="equipItem(item.id)"
          >
            <img :src="item.image" :alt="item.name" class="item-image" />
            <div class="item-info">
              <h5 class="item-name">{{ item.name }}</h5>
              <p class="item-quantity">x{{ item.quantity }}</p>
            </div>
            <div v-if="item.equipped" class="equipped-badge">
              <i class="fas fa-check"></i> 장착됨
            </div>
          </div>
        </div>
      </div>
    </section>

      <section class="recent-plays-section">
        <h3 class="section-title">최근 플레이 기록</h3>
        <div class="recent-plays-list">
          <div class="play-record" v-for="play in recentPlays" :key="play.id">
            <div class="play-icon" :class="play.mode">
              <i :class="getPlayModeIcon(play.mode)"></i>
            </div>
            <div class="play-info">
              <h5 class="play-mode">{{ play.mode }}</h5>
              <p class="play-result" :class="play.result">{{ play.result }}</p>
              <p class="play-date">{{ play.date }}</p>
            </div>
            <div class="play-stats">
              <p class="play-score">{{ play.score }} 점</p>
              <p class="play-xp">+{{ play.xpGained }} XP</p>
            </div>
          </div>
        </div>
      </section>

      <section class="achievements-section">
        <h3 class="section-title">업적</h3>
        <div class="achievements-grid">
          <div
            class="achievement-card"
            v-for="achievement in achievements"
            :key="achievement.id"
          >
            <div
              class="achievement-icon"
              :class="{ locked: !achievement.unlocked }"
            >
              <i :class="achievement.icon"></i>
            </div>
            <div class="achievement-info">
              <h5 class="achievement-name">{{ achievement.name }}</h5>
              <p class="achievement-description">
                {{ achievement.description }}
              </p>
              <div
                class="achievement-progress-bar"
                v-if="!achievement.unlocked"
              >
                <div
                  class="achievement-progress"
                  :style="{ width: `${achievement.progress}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  name: "MyInfoPage",
  data() {
    return {
      userInfo: {
        nickname: "김코스팟",
        email: "user@naver.com",
        loginMethod: "naver",
        joinDate: "2023-01-15",
        level: 23,
        levelProgress: 75,
        currentXP: 2250,
        requiredXP: 3000,
        profilePicture: "/profile-picture.jpg",
        points: 1500,
      },
      activeMode: "로드뷰 모드",
      gameModes: [
        {
          name: "로드뷰 모드",
          tier: "다이아몬드 II",
          rankPoints: 2150,
          totalGames: 287,
          class: "roadview",
          icon: "fas fa-street-view",
        },
        {
          name: "포토 모드",
          tier: "플래티넘 III",
          rankPoints: 1820,
          totalGames: 153,
          class: "photo",
          icon: "fas fa-camera",
        },
      ],
      inventory: [
        // Sample inventory data
        { id: 1, name: '아이템 1', image: '@/assets/logo.png', quantity: 3, equipped: false },
        { id: 2, name: '아이템 2', image: 'item2.jpg', quantity: 1, equipped: true },
        { id: 3, name: '아이템 3', image: 'item3.jpg', quantity: 5, equipped: false },
        { id: 4, name: '아이템 4', image: 'item4.jpg', quantity: 2, equipped: false },
        { id: 5, name: '아이템 5', image: 'item5.jpg', quantity: 1, equipped: false },
        { id: 6, name: '아이템 6', image: 'item6.jpg', quantity: 10, equipped: false },

      ],
      currentInventoryIndex: 0,
      itemsPerPage: 3,
      recentPlays: [
        {
          id: 1,
          mode: "로드뷰 모드",
          result: "승리",
          date: "2023-05-10 14:30",
          score: 950,
          xpGained: 100,
        },
        {
          id: 2,
          mode: "포토 모드",
          result: "패배",
          date: "2023-05-09 18:45",
          score: 720,
          xpGained: 50,
        },
        {
          id: 3,
          mode: "로드뷰 모드",
          result: "승리",
          date: "2023-05-08 11:20",
          score: 1050,
          xpGained: 120,
        },
      ],
      achievements: [
        {
          id: 1,
          name: "첫 승리",
          description: "첫 번째 게임에서 승리하세요",
          icon: "fas fa-trophy",
          unlocked: true,
        },
        {
          id: 2,
          name: "연속 5일 접속",
          description: "5일 연속으로 접속하세요",
          icon: "fas fa-calendar-check",
          unlocked: true,
        },
        {
          id: 3,
          name: "포토 마스터",
          description: "포토 모드에서 100회 승리하세요",
          icon: "fas fa-camera-retro",
          unlocked: false,
          progress: 65,
        },
      ],
    };
  },
  computed: {
    visibleInventoryItems() {
      return this.inventory.slice(this.currentInventoryIndex, this.currentInventoryIndex + this.itemsPerPage);
    },
  },
  methods: {
    goBack() {
      // 이전 페이지로 이동하는 로직
    },
    openSettings() {
      // 설정 페이지를 여는 로직
    },
    changeProfilePicture() {
      // 프로필 사진 변경 로직
    },
    showPointHistory() {
      // 포인트 기록을 보여주는 로직
    },
    setActiveMode(modeName) {
      this.activeMode = modeName;
    },
    getLoginMethodBadge(method) {
      const badges = {
        naver: "/naver-badge.png",
        kakao: "/kakao-badge.png",
        google: "/google-badge.png",
      };
      return badges[method] || "";
    },
    getPlayModeIcon(mode) {
      return mode === "로드뷰 모드" ? "fas fa-street-view" : "fas fa-camera";
    },
    navigateInventory(direction) {
      const newIndex = this.currentInventoryIndex + direction * this.itemsPerPage;
      if (newIndex >= 0 && newIndex < this.inventory.length) {
        this.currentInventoryIndex = newIndex;
      }
    },
    equipItem(itemId) {
      this.inventory = this.inventory.map(item => ({
        ...item,
        equipped: item.id === itemId ? !item.equipped : false
      }));
    },
  },
};
</script>

<style scoped>
.my-info-page {
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: "Noto Sans KR", sans-serif;
}

.header {
  background-color: #ffffff;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-button,
.settings-button {
  background: none;
  border: none;
  font-size: 20px;
  color: #2563eb;
  cursor: pointer;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.main-content {
  padding: 24px;
  max-width: 768px;
  margin: 0 auto;
}

.profile-section,
.game-modes-section,
.inventory-section,
.recent-plays-section,
.achievements-section {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.profile-picture {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}

.profile-picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.change-picture-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.change-picture-overlay i {
  color: #ffffff;
  font-size: 24px;
}

.profile-picture:hover .change-picture-overlay {
  opacity: 1;
}

.profile-info {
  margin-left: 24px;
}

.nickname {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.email-container {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.email {
  font-size: 14px;
  color: #6b7280;
}

.login-badge {
  width: 20px;
  height: 20px;
  margin-left: 8px;
}

.join-date {
  font-size: 14px;
  color: #6b7280;
}

.level-info {
  display: flex;
  align-items: center;
  margin-top: 16px;
}

.level-badge {
  background-color: #2563eb;
  color: #ffffff;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  margin-right: 12px;
}

.level-progress-container {
  flex-grow: 1;
}

.level-progress-bar {
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.level-progress {
  height: 100%;
  background-color: #2563eb;
  transition: width 0.3s ease;
}

.level-percentage {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
  display: block;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.game-modes-tabs {
  display: flex;
  margin-bottom: 16px;
}

.mode-tab {
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  margin-right: 8px;
}

.mode-tab.active {
  background-color: #2563eb;
  color: #ffffff;
}

.game-mode-details {
  display: flex;
  align-items: center;
}

.mode-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-right: 16px;
}

.mode-icon.roadview {
  background-color: #dbeafe;
  color: #2563eb;
}

.mode-icon.photo {
  background-color: #dcfce7;
  color: #16a34a;
}

.mode-info {
  flex-grow: 1;
}

.mode-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.mode-tier,
.mode-rank-points,
.mode-total-games {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
}

.mode-chart {
  width: 120px;
  height: 60px;
}

.rank-progress-chart {
  width: 100%;
  height: 100%;
  background-color: #f3f4f6;
  border-radius: 8px;
}

.inventory-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.inventory-item {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #1f2937;
}

.inventory-item i {
  margin-right: 8px;
  color: #2563eb;
}

.view-history-button {
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.view-history-button:hover {
  background-color: #1d4ed8;
}

/* .inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
} */

.inventory-card {
  background-color: #f3f4f6;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.inventory-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.item-image {
  width: 64px;
  height: 64px;
  object-fit: contain;
  margin-bottom: 8px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.item-quantity {
  font-size: 12px;
  color: #6b7280;
}

.recent-plays-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.play-record {
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 12px;
  padding: 16px;
}

.play-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-right: 16px;
}

.play-icon.roadview {
  background-color: #dbeafe;
  color: #2563eb;
}

.play-icon.photo {
  background-color: #dcfce7;
  color: #16a34a;
}

.play-info {
  flex-grow: 1;
}

.play-mode {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.play-result {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}

.play-result.승리 {
  color: #16a34a;
}

.play-result.패배 {
  color: #dc2626;
}

.play-date {
  font-size: 12px;
  color: #6b7280;
}

.play-stats {
  text-align: right;
}

.play-score,
.play-xp {
  font-size: 14px;
  color: #1f2937;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.achievement-card {
  background-color: #f3f4f6;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
}

.achievement-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-right: 16px;
  background-color: #fef3c7;
  color: #d97706;
}

.achievement-icon.locked {
  background-color: #e5e7eb;
  color: #9ca3af;
}

.achievement-info {
  flex-grow: 1;
}

.achievement-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.achievement-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.achievement-progress-bar {
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.achievement-progress {
  height: 100%;
  background-color: #2563eb;
  transition: width 0.3s ease;
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-info {
    margin-left: 0;
    margin-top: 16px;
  }

  .game-mode-details {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .mode-icon {
    margin-right: 0;
    margin-bottom: 16px;
  }

  .mode-chart {
    margin-top: 16px;
  }

  .play-record {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .play-icon {
    margin-right: 0;
    margin-bottom: 16px;
  }

  .play-stats {
    margin-top: 16px;
    text-align: center;
  }
}
.inventory-carousel {
  overflow-x: auto;
  white-space: nowrap;
  padding: 20px 0;
  scrollbar-width: thin;
  scrollbar-color: #2563eb #e5e7eb;
}

.inventory-carousel::-webkit-scrollbar {
  height: 8px;
}

.inventory-carousel::-webkit-scrollbar-track {
  background: #e5e7eb;
}

.inventory-carousel::-webkit-scrollbar-thumb {
  background-color: #2563eb;
  border-radius: 20px;
  border: 3px solid #e5e7eb;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.nav-button:hover {
  background-color: #1d4ed8;
}

.nav-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.nav-button.prev {
  left: 0;
}

.nav-button.next {
  right: 0;
}

.inventory-items {
  display: inline-flex;
  gap: 16px;
}

.inventory-card {
  flex: 0 0 auto;
  width: 200px;
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  background-color: #fff;
}

.item-image {
  width: 100%;
  height: auto;
  max-height: 120px;
  border-radius: 8px;
}

.item-info {
  margin-top: 8px;
}

.item-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.item-quantity {
  margin: 0;
  font-size: 14px;
  color: #777;
}

.equipped-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #10b981;
  color: #ffffff;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.inventory-slide-enter-active,
.inventory-slide-leave-active {
  transition: all 0.2s ease;
}

.inventory-slide-enter-from {
  opacity: 0;
}

.inventory-slide-leave-to {
  opacity: 0;
}

.inventory-card.equipped {
  box-shadow: 0 0 0 2px #10b981;
}
</style>
