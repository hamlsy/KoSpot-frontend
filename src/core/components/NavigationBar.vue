<template>
  <div>
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <app-logo class="home-link" to="/main" />
        </div>

        <!-- 네비게이션 추가 - 웹 전용 -->
        <div class="main-nav desktop-only">
          <router-link :to="{ name: 'NoticeListView' }" class="nav-link">공지사항</router-link>
          <router-link :to="{ name: 'NoticeListView', query: { category: '이벤트' } }" class="nav-link">이벤트</router-link>
          <router-link to="/tempPage" class="nav-link">통계</router-link>
          <router-link to="/shopMain" class="nav-link">상점</router-link>
          <router-link to="/myProfile" class="nav-link">마이페이지</router-link>
          <router-link v-if="userProfile.isAdmin" to="/admin" class="nav-link admin-link">관리자</router-link>
          <router-link to="/temp-login" class="nav-link temp-login-link">🧪 임시로그인</router-link>
        </div>

        <div class="header-right">
          <button class="icon-button" @click="openNotifications">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" v-if="unreadNotifications">{{ unreadNotifications }}</span>
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
    
    <!-- 프로필 메뉴 오버레이 - header 밖으로 이동 -->
    <transition name="fade">
      <div
        v-if="showProfileMenu"
        class="overlay"
        @click="closeProfileMenu"
      ></div>
    </transition>

    <!-- Profile Menu - header 밖으로 이동 -->
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
          <router-link :to="{ name: 'NoticeListView' }" class="menu-item">
            <i class="fas fa-bullhorn"></i>
            공지사항
          </router-link>
          <router-link :to="{ name: 'NoticeListView', query: { category: '이벤트' } }" class="menu-item">
            <i class="fas fa-calendar-alt"></i>
            이벤트
          </router-link>
          <router-link to="/tempPage" class="menu-item">
            <i class="fas fa-chart-bar"></i>
            통계
          </router-link>
          <router-link to="/shopMain" class="menu-item">
            <i class="fas fa-shopping-cart"></i>
            상점
          </router-link>
          <router-link to="/myProfile" class="menu-item">
            <i class="fas fa-user-circle"></i>
            마이페이지
          </router-link>
          <div class="menu-divider"></div>
          <router-link to="/temp-login" class="menu-item temp-login-menu-item">
            <i class="fas fa-flask"></i>
            임시로그인
          </router-link>
          <a href="#" class="menu-item">
            <i class="fas fa-sign-out-alt"></i>
            로그아웃
          </a>
          
          <!-- 관리자 페이지 링크 추가 -->
          <router-link v-if="userProfile.isAdmin" to="/admin" class="menu-item admin-menu-item">
            <i class="fas fa-user-shield"></i>
            관리자 페이지
          </router-link>
        </nav>
      </div>
    </transition>
  </div>
</template>


<script>
import AppLogo from '@/core/components/AppLogo.vue'; 

export default {
  name: 'NavigationBar',
  components: {
    AppLogo
  },
  data() {
    return {
      showProfileMenu: false,
      unreadNotifications: 3,
      userProfile: {
        name: "김코스팟",
        email: "user@kospot.com",
        avatar: null,
        isAdmin: true
      }
    };
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
    }
  }
};
</script>

<style scoped>
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

.header-left {
  display: flex;
  align-items: center;
}

.home-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #2563eb;
}

.badge {
  background: #e74c3c;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-left: 0.5rem;
}

.main-nav {
  margin-left: 2rem;
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  font-size: 1rem;
  transition: color 0.2s ease;
}

.nav-link:hover, .nav-link.router-link-active {
  color: #4a6cf7;
}

.admin-link {
  color: #6366f1;
  font-weight: 600;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #555;
  cursor: pointer;
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.icon-button:hover {
  background: #f0f2f5;
}
.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-profile {
  cursor: pointer;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f2f5;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 오버레이 스타일 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
}

/* 프로필 메뉴 스타일 */
.profile-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
  background: white;
  z-index: 9999;
  padding: 24px;
  overflow-y: auto;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
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
  margin-top: 0;
}

.profile-text p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.close-menu {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  color: #1f2937;
  text-decoration: none;
  font-weight: 500;
  gap: 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f3f4f6;
}

.menu-item i {
  width: 20px;
  text-align: center;
  font-size: 18px;
  color: #6b7280;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 16px 0;
}

.admin-menu-item {
  color: #6366f1 !important;
  font-weight: 600;
}

.admin-menu-item i {
  color: #6366f1;
}

.temp-login-link {
  color: #f59e0b !important;
  font-weight: 600;
}

.temp-login-menu-item {
  color: #f59e0b !important;
  font-weight: 600;
}

.temp-login-menu-item i {
  color: #f59e0b;
}

/* 트랜지션 애니메이션 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-menu-enter-active, .slide-menu-leave-active {
  transition: transform 0.3s ease;
}

.slide-menu-enter-from, .slide-menu-leave-to {
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .header-content {
    padding: 0.8rem 1rem;
  }
}
</style> 