<template>
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="logo">KoSpot</h1>
          <span class="badge">Beta</span>
        </div>

        <!-- 네비게이션 추가 - 웹 전용 -->
        <div class="main-nav desktop-only">
          <a href="#" class="nav-link">공지사항</a>
          <a href="#" class="nav-link">이벤트</a>
          <a href="#" class="nav-link">통계</a>
          <a href="#" class="nav-link">상점</a>
          <a href="#" class="nav-link">마이페이지</a>
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
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Featured Challenge Banner Carousel -->
      <div class="banner-carousel">
        <div
          class="banner-container"
          :style="{ transform: `translateX(-${currentBanner * 100}%)` }"
        >
          <div
            v-for="(banner, index) in banners"
            :key="index"
            class="main-banner"
            :style="{ backgroundImage: `url(${banner.image})` }"
          >
            <div class="main-banner-content">
              <div class="main-banner-badge">{{ banner.badge }}</div>
              <h2>{{ banner.title }}</h2>
              <p>{{ banner.description }}</p>
            </div>
          </div>
        </div>

        <!-- Banner Navigation Dots -->
        <div class="banner-dots">
          <button
            v-for="(banner, index) in banners"
            :key="index"
            class="banner-dot"
            :class="{ active: currentBanner === index }"
            @click="setCurrentBanner(index)"
            @mouseenter="setCurrentBanner(index)"
          ></button>
        </div>
      </div>

      <!-- Game Modes -->
      <section class="game-modes">
        <div class="modes-grid">
          <div
            class="mode-card roadview"
            @click="navigateTo('roadViewModeMain')"
          >
            <div class="mode-background"></div>
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

          <div class="mode-card photo locked" @click="showLockedMessage">
            <div class="mode-background"></div>
            <div class="mode-overlay">
              <i class="fas fa-lock"></i>
              <p>곧 오픈 예정</p>
            </div>
            <div class="mode-icon">
              <i class="fas fa-camera"></i>
            </div>
            <div class="mode-info">
              <h3>포토 모드</h3>
              <p>관광지 사진으로 지역을 맞혀보세요</p>
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
      <!-- Stats Overview -->
      <div class="stats-container">
        <router-link to="/noticeList">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
              <span class="stat-value">통계</span>
              <span class="stat-label">플레이 정보</span>
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

      <!-- 공지사항 섹션 -->
      <section class="notices-section">
        <div class="section-header">
          <h2 class="section-title">공지사항</h2>
          <a href="/noticeList" class="view-all"
            >전체보기 <i class="fas fa-angle-right"></i
          ></a>
        </div>
        <div class="notices-list">
          <div
            class="notice-item"
            v-for="notice in recentNotices"
            :key="notice.id"
          >
            <div class="notice-info">
              <span
                class="notice-category"
                :class="notice.category.toLowerCase()"
                >{{ notice.category }}</span
              >
              <h3 class="notice-title">{{ notice.title }}</h3>
            </div>
            <span class="notice-date">{{ notice.date }}</span>
          </div>
        </div>
      </section>
    </main>
    <!-- 수정: 프로필 메뉴 오버레이 추가 -->
    <transition name="fade">
      <div
        v-if="showProfileMenu"
        class="overlay"
        @click="closeProfileMenu"
      ></div>
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
          <button @click="closeProfileMenu" class="close-menu">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 모바일용 내비게이션 메뉴 추가 -->
        <nav class="mobile-nav">
          <a href="#" class="menu-item">
            <i class="fas fa-bullhorn"></i>
            공지사항
          </a>
          <a href="#" class="menu-item">
            <i class="fas fa-calendar-alt"></i>
            이벤트
          </a>
          <a href="#" class="menu-item">
            <i class="fas fa-chart-bar"></i>
            통계
          </a>
          <a href="#" class="menu-item">
            <i class="fas fa-shopping-cart"></i>
            상점
          </a>
          <a href="#" class="menu-item">
            <i class="fas fa-user-circle"></i>
            마이페이지
          </a>
          <div class="menu-divider"></div>
          <a href="#" class="menu-item">
            <i class="fas fa-sign-out-alt"></i>
            로그아웃
          </a>
        </nav>
      </div>
    </transition>

    <!-- 잠긴 모드 알림 -->
    <div class="toast-notification" v-if="showToast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: "KoSpotMain",
  data() {
    return {
      showProfileMenu: false,
      unreadNotifications: 3,
      currentBanner: 0,
      bannerInterval: null,
      showToast: false,
      toastMessage: "",

      userProfile: {
        name: "김코스팟",
        email: "user@kospot.com",
        avatar: null,
      },
      banners: [
        {
          image: require("@/assets/banner/Seoul-Dongdaemun-Gate.jpg"),
          badge: "뱃지1",
          title: "타이틀 1",
          description: "설명 1",
        },
        {
          image: require("@/assets/banner/Seoul-temp1.jpg"),
          badge: "뱃지2",
          title: "타이틀 2",
          description: "설명 2",
        },
        {
          image: "/images/busan-banner.jpg",
          badge: "뱃지3",
          title: "타이틀 3",
          description: "설명 3",
        },
      ],
      recentNotices: [
        {
          id: 1,
          category: "업데이트",
          title: "KoSpot 2.0 업데이트 안내",
          date: "2025.03.08",
        },
        {
          id: 2,
          category: "이벤트",
          title: "봄맞이 지역 사진 공유 이벤트",
          date: "2025.03.07",
        },
        {
          id: 3,
          category: "공지",
          title: "시스템 점검 안내 (3월 10일)",
          date: "2025.03.06",
        },
        {
          id: 4,
          category: "이벤트",
          title: "친구 초대 시 포인트 2배 이벤트",
          date: "2025.03.04",
        },
      ],
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
  mounted() {
    this.startBannerRotation();
  },
  beforeDestroy() {
    this.stopBannerRotation();
  },
  methods: {
    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu;
      if (this.showProfileMenu) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    },
    closeProfileMenu() {
      this.showProfileMenu = false;
      document.body.style.overflow = "";
    },
    openNotifications() {
      // 알림 메뉴 열기 로직
    },
    navigateTo(route) {
      this.$router.push(`/${route}`);
    },
    startBannerRotation() {
      this.bannerInterval = setInterval(() => {
        this.currentBanner = (this.currentBanner + 1) % this.banners.length;
      }, 5000);
    },
    stopBannerRotation() {
      clearInterval(this.bannerInterval);
    },
    setCurrentBanner(index) {
      this.currentBanner = index;
      // 자동 회전 재시작
      this.stopBannerRotation();
      this.startBannerRotation();
    },
    showLockedMessage() {
      this.toastMessage = "포토 모드는 곧 오픈 예정입니다! 기대해주세요.";
      this.showToast = true;

      // 토스트 메시지 3초 후 사라짐
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    },
  },
};
</script>

<style scoped>
@import url("@/assets/styles/main_page/notice-section/notice.css");
@import url("@/assets/styles/main_page/banner/main-banner.css");

.app-container {
  min-height: 100vh;
  background-color: #f6f6f6;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #ffffff;
  z-index: 1000;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
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

/* 메인 네비게이션 - 웹 전용 */
.main-nav {
  display: flex;
  gap: 24px;
  margin-left: 40px;
}

.nav-link {
  color: #4b5563;
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  position: relative;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #2563eb;
}

.nav-link:hover::after {
  content: "";
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #2563eb;
  transform: scaleX(1);
  transition: transform 0.3s;
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
  border: 2px solid #dbeafe;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-content {
  padding: 80px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.3s ease;
  border: 1px solid #e7e7e7;
}

.stat-card:hover {
  transform: translateY(-5px);
  /* box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08); */
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

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.view-all {
  font-size: 14px;
  color: #4b5563;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

.view-all:hover {
  color: #2563eb;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.mode-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  /* transition: transform 0.2s, box-shadow 0.2s; */
  transition: transform 0.2s;
  border: 1px solid #eeeeee;
  /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04); */
}

.mode-card:hover {
  transform: translateY(-4px);
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
}

.mode-background {
  position: relative;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  z-index: 0;
  background-size: cover;
  background-position: center;
  transition: opacity 0.3s;
}

.mode-card:hover .mode-background {
  opacity: 0.2;
}

.roadview .mode-background {
  /* background-image: url('/images/roadview-bg.jpg'); */
}

.photo .mode-background {
  /* background-image: url('/images/photo-bg.jpg'); */
}

.mode-card.locked {
  position: relative;
  cursor: default;
  opacity: 0.9;
}

.mode-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  color: white;
  font-weight: 700;
  border-radius: 20px;
}

.mode-overlay i {
  font-size: 32px;
  margin-bottom: 10px;
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
  z-index: 1;
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
  /* box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1); */
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

  .main-banner {
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
