<template>
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="logo">KoSpot</h1>
          <span class="badge">Beta</span>
        </div>
        <div class="header-right">
          <button class="icon-button" @click="openNotifications">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" v-if="unreadNotifications">3</span>
          </button>
          <div class="user-profile" @click="toggleProfileMenu">
            <div class="user-avatar">
              <img
                :src="userProfile.avatar || '/default-avatar.png'"
                alt="프로필"
              />
            </div>
            <span class="user-level">Lv.23</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Featured Challenge -->
      <div
        class="featured-challenge"
        :style="{ backgroundImage: 'url(/challenge-bg.jpg)' }"
      >
        <div class="challenge-content">
          <div class="challenge-badge">오늘의 도전</div>
          <h2>제주도 스팟 5개 연속 성공</h2>
          <p>성공 시 500포인트 지급</p>
          <button class="challenge-button">
            도전하기
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
      <!-- Stats Overview -->
      <div class="stats-container">
        <router-link to="/noticeList">
          <div class="stat-card">
            <div class="stat-icon">📢</div>
            <div class="stat-info">
              <span class="stat-value notice">공지사항</span>
              <span class="stat-label">새소식 / 패치노트</span>
            </div>
          </div>
        </router-link>
        <router-link to="/shopMain">
          <div class="stat-card">
            <div class="stat-icon">🛒</div>
            <div class="stat-info">
              <span class="stat-value">상점</span>
              <span class="stat-label">아이템 구매</span>
            </div>
          </div>
        </router-link>
        <router-link to="/myPoints">
          <div class="stat-card">
            <div class="stat-icon">⭐️</div>
            <div class="stat-info">
              <span class="stat-value">1,234</span>
              <span class="stat-label">포인트</span>
            </div>
          </div>
        </router-link>
        <router-link to="/friendList">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <span class="stat-value">15</span>
              <span class="stat-label">친구</span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Game Modes -->
      <section class="game-modes">
        <h2 class="section-title">게임 모드</h2>
        <div class="modes-grid">
          <div
            class="mode-card roadview"
            @click="navigateTo('roadViewModeMain')"
          >
            <div class="mode-icon">
              <i class="fas fa-street-view"></i>
            </div>
            <div class="mode-info">
              <h3>로드뷰 모드</h3>
              <p>실제 거리를 둘러보며 위치를 맞춰보세요</p>
              <div class="mode-stats">
                <span class="active-players">
                  <i class="fas fa-user"></i> 328명 플레이 중
                </span>
                <span class="difficulty">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star-half"></i>
                </span>
              </div>
            </div>
          </div>

          <div class="mode-card photo" @click="navigateTo('photo')">
            <div class="mode-icon">
              <i class="fas fa-camera"></i>
            </div>
            <div class="mode-info">
              <h3>포토 모드</h3>
              <p>사진 속 장소를 찾아보세요</p>
              <div class="mode-stats">
                <span class="active-players">
                  <i class="fas fa-user"></i> 195명 플레이 중
                </span>
                <span class="difficulty">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity -->
      <!-- <section class="recent-activity">
        <h2 class="section-title">최근 활동</h2>
        <div class="activity-list">
          <div
            class="activity-item"
            v-for="activity in recentActivities"
            :key="activity.id"
          >
            <div class="activity-icon" :class="activity.type">
              <i :class="activity.icon"></i>
            </div>
            <div class="activity-details">
              <p class="activity-text">{{ activity.text }}</p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </section> -->
    </main>

    <!-- Navigation -->
    <nav class="bottom-nav">
      <button class="nav-item active">
        <i class="fas fa-home"></i>
        <span>홈</span>
      </button>
      <!-- <button class="nav-item">
        <i class="fas fa-map-marker-alt"></i>
        <span>탐색</span>
      </button>
      <button class="nav-item">
        <i class="fas fa-trophy"></i>
        <span>랭킹</span>
      </button> -->
      <button class="nav-item">
        <i class="fas fa-user"></i>
        <span>프로필</span>
      </button>
    </nav>

    <!-- 수정: 프로필 메뉴 오버레이 추가 -->
    <transition name="fade">
      <div v-if="showProfileMenu" class="overlay" @click="closeProfileMenu"></div>
    </transition>

    <!-- Profile Menu -->
    <transition name="slide-menu">
      <div v-if="showProfileMenu" class="profile-menu">
        <div class="profile-header">
          <div class="profile-info">
            <img
              :src="userProfile.avatar || '/default-avatar.png'"
              alt="프로필"
            />
            <div class="profile-text">
              <h3>{{ userProfile.name }}</h3>
              <p>{{ userProfile.email }}</p>
            </div>
          </div>
          <button @click="toggleProfileMenu" class="close-menu">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="profile-stats">
          <!-- <div class="stat-item">
            <span class="stat-number">89%</span>
            <span class="stat-label">정확도</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">234</span>
            <span class="stat-label">도전완료</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">15</span>
            <span class="stat-label">뱃지</span>
          </div> -->
        </div>
        <nav class="profile-nav">
          <!-- <a href="#" class="menu-item">
            <i class="fas fa-cog"></i>
            설정
          </a>
          <a href="#" class="menu-item">
            <i class="fas fa-history"></i>
            기록
          </a>
          <a href="#" class="menu-item">
            <i class="fas fa-medal"></i>
            업적
          </a> -->
          <a href="#" class="menu-item">
            <i class="fas fa-sign-out-alt"></i>
            로그아웃
          </a>
        </nav>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "KoSpotMain",
  data() {
    return {
      showProfileMenu: false,
      unreadNotifications: 3,
      userProfile: {
        name: "김코스팟",
        email: "user@kospot.com",
        avatar: null,
        level: 23,
      },
      recentActivities: [
        {
          id: 1,
          type: "success",
          icon: "fas fa-check-circle",
          text: "명동 로드뷰 챌린지 성공",
          time: "방금 전",
        },
        {
          id: 2,
          type: "achievement",
          icon: "fas fa-medal",
          text: "정확도 마스터 뱃지 획득",
          time: "2시간 전",
        },
        {
          id: 3,
          type: "friend",
          icon: "fas fa-user-plus",
          text: "민준님이 친구추가 했습니다",
          time: "3시간 전",
        },
      ],
    };
  },
  methods: {
    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu;
      if (this.showProfileMenu) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },
    
    openNotifications() {
      // 알림 메뉴 열기 로직
    },
    navigateTo(route) {
      this.$router.push(`/${route}`);
    },
  },
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 60px;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  /* max-width: 1200px; */
  width: 100%;
  margin: 0;
}

.header-left {
  margin-left: 5%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  margin-right: 5%;
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: #2563eb;
}

.badge {
  padding: 2px 6px;
  background: #dbeafe;
  color: #2563eb;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.icon-button {
  position: relative;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #e5e7eb;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-level {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.main-content {
  padding: 80px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.featured-challenge {
  background-size: cover;
  background-position: center;
  border-radius: 20px;
  height: 200px;
  margin-top: 24px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.challenge-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
}

.challenge-badge {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 8px;
}

.challenge-button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 600;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.mode-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.mode-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 24px;
}

.roadview .mode-icon {
  background: #dbeafe;
  color: #2563eb;
}

.photo .mode-icon {
  background: #dcfce7;
  color: #16a34a;
}

.mode-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.mode-info p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.mode-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.active-players i {
  color: #2563eb;
  margin-right: 4px;
}

.difficulty i {
  color: #fbbf24;
  margin-left: 2px;
}

.recent-activity {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.activity-icon.success {
  background: #dcfce7;
  color: #16a34a;
}

.activity-icon.achievement {
  background: #fef3c7;
  color: #d97706;
}

.activity-icon.friend {
  background: #dbeafe;
  color: #2563eb;
}

.activity-details {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #6b7280;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1000;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  color: #6b7280;
  font-size: 12px;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-item i {
  font-size: 20px;
}

.nav-item.active {
  color: #2563eb;
}

/* 수정: 오버레이 스타일 추가 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

/* 수정: 프로필 메뉴 스타일 추가 */
.profile-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
  background: white;
  z-index: 1002;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  padding: 24px;
  overflow-y: auto;
}


.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 24px;
}

.profile-info {
  display: flex;
  gap: 12px;
}

.profile-info img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.profile-text h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.profile-text p {
  font-size: 14px;
  color: #6b7280;
}

.close-menu {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.profile-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: #1f2937;
  text-decoration: none;
  border-radius: 12px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item i {
  width: 20px;
  color: #6b7280;
}

/* Transitions */
.slide-menu-enter-active,
.slide-menu-leave-active {
  transition: transform 0.3s ease;
}

.slide-menu-enter,
.slide-menu-leave-to {
  transform: translateX(100%);
}

/* Media Queries */
@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .modes-grid {
    grid-template-columns: 1fr;
  }

  .featured-challenge {
    height: 150px;
  }

  .profile-menu {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }

  .header-content {
    padding: 0 12px;
  }

  .main-content {
    padding: 70px 12px 20px;
  }

  .mode-card {
    padding: 16px;
  }

  .mode-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .nav-item span {
    display: none;
  }
}

/* Animations */
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

.stat-card,
.mode-card,
.activity-item {
  animation: fadeIn 0.65s ease-out;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c5c5c5;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
