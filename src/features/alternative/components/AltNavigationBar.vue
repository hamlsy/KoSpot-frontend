<template>
  <div class="alt-navbar-wrapper">
    <header class="alt-header">
      <div class="alt-container">
        <div class="alt-header-content">
          <!-- Logo Section - BOLD & Asymmetric -->
          <div class="alt-header-left">
            <div class="alt-logo-group" @click="goToMain">
              <div class="alt-location-pin">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                </svg>
              </div>
              <h1 class="alt-logo-text">
                <span class="alt-logo-ko">코스팟</span>
                <span class="alt-logo-en">KoSpot</span>
              </h1>
              <span class="alt-beta-badge">Beta</span>
            </div>
          </div>

          <!-- Navigation - Desktop Only -->
          <template v-if="!simpleMode">
            <nav class="alt-main-nav alt-hide-mobile">
              <router-link :to="{ name: 'NoticeListView' }" class="alt-nav-link">
                <i class="fas fa-bullhorn"></i>
                <span>공지사항</span>
              </router-link>
              <router-link v-if="actualIsLoggedIn" to="/myProfile" class="alt-nav-link">
                <i class="fas fa-user-circle"></i>
                <span>마이페이지</span>
              </router-link>
              <router-link v-if="actualIsAdmin" to="/admin" class="alt-nav-link alt-admin-link">
                <i class="fas fa-user-shield"></i>
                <span>관리자</span>
              </router-link>
              <router-link v-if="isDevMode" to="/dev/test" class="alt-nav-link alt-dev-link">
                <i class="fas fa-flask"></i>
                <span>개발자</span>
              </router-link>
            </nav>

            <!-- Right Actions -->
            <div class="alt-header-right">
              <button class="alt-tutorial-btn" @click="openTutorial" title="게임 소개">
                <i class="fas fa-question-circle"></i>
                <span class="alt-hide-mobile">게임 소개</span>
              </button>
              
              <button class="alt-theme-toggle alt-hide-mobile" @click="toggleTheme" :title="isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'">
                <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
              </button>
              
              <div class="alt-user-profile" @click="toggleProfileMenu">
                <div class="alt-user-avatar" :class="{ 'alt-guest-avatar': !actualIsLoggedIn }">
                  <img v-if="actualIsLoggedIn" :src="userProfile.avatar" alt="프로필" />
                  <span v-else class="alt-guest-text">Guest</span>
                </div>
                <div v-if="actualIsLoggedIn" class="alt-user-status-dot"></div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </header>
    
    <!-- Profile Menu Overlay -->
    <transition name="alt-fade">
      <div v-if="showProfileMenu" class="alt-overlay" @click="closeProfileMenu"></div>
    </transition>

    <!-- Profile Menu - Slide from Right -->
    <transition name="alt-slide-menu">
      <div v-if="showProfileMenu" class="alt-profile-menu">
        <div class="alt-profile-menu-header">
          <h3>메뉴</h3>
          <button @click="closeProfileMenu" class="alt-close-menu">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Not Logged In -->
        <div v-if="!actualIsLoggedIn" class="alt-login-prompt">
          <div class="alt-login-icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <h3>로그인이 필요합니다</h3>
          <p>다양한 기능을 이용하려면<br/>로그인해주세요</p>
          <button @click="goToLogin" class="alt-btn alt-btn-primary">
            <i class="fas fa-sign-in-alt"></i>
            로그인하러 가기
          </button>
        </div>

        <!-- Logged In -->
        <div v-else class="alt-profile-info-section">
          <div class="alt-profile-info">
            <img :src="userProfile.avatar" alt="프로필" />
            <div class="alt-profile-text">
              <h3>{{ userProfile.name }}</h3>
              <p>{{ userProfile.email }}</p>
            </div>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <nav class="alt-mobile-nav" v-if="actualIsLoggedIn">
          <div class="alt-menu-item alt-theme-menu-item" @click="toggleTheme">
            <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
            {{ isDarkMode ? '라이트 모드' : '다크 모드' }}
          </div>
          
          <div class="alt-menu-divider"></div>
          
          <router-link :to="{ name: 'NoticeListView' }" class="alt-menu-item">
            <i class="fas fa-bullhorn"></i>
            공지사항
          </router-link>
          <router-link to="/myProfile" class="alt-menu-item">
            <i class="fas fa-user-circle"></i>
            마이페이지
          </router-link>
          
          <div class="alt-menu-divider"></div>
          
          <router-link v-if="isDevMode" to="/dev/test" class="alt-menu-item">
            <i class="fas fa-flask"></i>
            개발자 페이지
          </router-link>
          
          <a href="#" class="alt-menu-item" @click.prevent="handleLogout">
            <i class="fas fa-sign-out-alt"></i>
            로그아웃
          </a>
          
          <router-link v-if="actualIsAdmin" to="/admin" class="alt-menu-item alt-admin-menu-item">
            <i class="fas fa-user-shield"></i>
            관리자 페이지
          </router-link>
        </nav>
      </div>
    </transition>
  </div>
</template>

<script>
import { tokenRefreshService } from '@/core/services/tokenRefresh.service.js';
import { useTheme } from '@/core/composables/useTheme.js';

export default {
  name: 'AltNavigationBar',
  props: {
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    userInfo: {
      type: Object,
      default: () => ({})
    },
    simpleMode: {
      type: Boolean,
      default: false
    },
    showBackButton: {
      type: Boolean,
      default: false
    },
    backButtonText: {
      type: String,
      default: '나가기'
    }
  },
  setup() {
    const { isDarkMode, toggleTheme } = useTheme();
    
    return {
      isDarkMode,
      toggleTheme
    };
  },
  data() {
    return {
      showProfileMenu: false,
      userProfile: {
        name: "김코스팟",
        email: "user@kospot.com",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
        isAdmin: false
      },
      isDevMode: true
    };
  },
  computed: {
    hasToken() {
      return !!localStorage.getItem('accessToken');
    },
    actualIsLoggedIn() {
      return this.isLoggedIn || this.hasToken;
    },
    actualIsAdmin() {
      return this.userProfile?.isAdmin === true;
    }
  },
  watch: {
    userInfo: {
      handler(newValue) {
        if (newValue && Object.keys(newValue).length > 0) {
          this.userProfile = { ...this.userProfile, ...newValue };
        }
      },
      immediate: true,
      deep: true
    },
    '$route'() {
      this.checkDevMode();
    }
  },
  mounted() {
    this.checkDevMode();
    if (this.hasToken && !this.actualIsLoggedIn) {
      this.checkAuthStatus();
    }
  },
  methods: {
    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu;
      document.body.style.overflow = this.showProfileMenu ? "hidden" : "";
    },
    closeProfileMenu() {
      this.showProfileMenu = false;
      document.body.style.overflow = "";
    },
    goToMain() {
      this.$router.push({ name: 'AltMainView' });
      this.closeProfileMenu();
    },
    goToLogin() {
      this.$router.push({ name: 'TempLoginView' });
      this.closeProfileMenu();
    },
    openTutorial() {
      this.$emit('open-tutorial');
    },
    handleLogout() {
      tokenRefreshService.stopRefresh();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('memberId');
      localStorage.removeItem('isAdmin');
      this.closeProfileMenu();
      this.$router.push({ name: 'AltMainView' });
    },
    checkDevMode() {
      this.isDevMode = import.meta.env.MODE === 'development';
    },
    async checkAuthStatus() {
      // 실제 구현 시 API 호출로 사용자 정보 확인
      console.log('Check auth status');
    }
  }
};
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

/* ========================================
   ALTERNATIVE NAVIGATION BAR
   ======================================== */

.alt-navbar-wrapper {
  position: relative;
  z-index: var(--alt-z-sticky);
}

.alt-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(14, 165, 233, 0.1);
  border-bottom: 3px solid transparent;
  border-image: linear-gradient(90deg, var(--alt-primary) 0%, var(--alt-secondary) 50%, var(--alt-accent) 100%) 1;
  z-index: var(--alt-z-sticky);
  transition: all var(--alt-transition-base);
}

.alt-dark-mode .alt-header {
  background: rgba(30, 41, 59, 0.85);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.alt-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--alt-space-md);
  padding: var(--alt-space-sm) 0;
  min-height: 80px;
}

/* Logo Section - BOLD */
.alt-header-left {
  display: flex;
  align-items: center;
}

.alt-logo-group {
  display: flex;
  align-items: center;
  gap: var(--alt-space-sm);
  cursor: pointer;
  transition: all var(--alt-transition-base);
  padding: var(--alt-space-xs) var(--alt-space-sm);
  border-radius: var(--alt-radius-md);
}

.alt-logo-group:hover {
  transform: translateY(-2px);
  background: rgba(14, 165, 233, 0.05);
}

.alt-location-pin {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--alt-accent) 0%, var(--alt-accent-warm) 100%);
  border-radius: var(--alt-radius-md);
  box-shadow: 0 4px 16px rgba(255, 127, 80, 0.3);
  animation: alt-pulse 3s ease-in-out infinite;
}

.alt-location-pin svg {
  width: 28px;
  height: 28px;
  color: var(--alt-text-secondary);
}

.alt-logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  line-height: 1;
}

.alt-logo-ko {
  font-family: var(--alt-font-heading-ko);
  font-size: 1.75rem;
  color: var(--alt-text-primary);
  letter-spacing: -0.02em;
}

.alt-logo-en {
  font-family: var(--alt-font-heading-en);
  font-size: 0.875rem;
  color: var(--alt-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.alt-beta-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, var(--alt-korea-red) 0%, var(--alt-korea-yellow) 100%);
  color: var(--alt-text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--alt-radius-full);
  box-shadow: 0 2px 8px rgba(230, 57, 70, 0.3);
  animation: alt-pulse 2s ease-in-out infinite;
}

/* Main Navigation */
.alt-main-nav {
  display: flex;
  align-items: center;
  gap: var(--alt-space-xs);
}

.alt-nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  color: var(--alt-text-primary);
  font-family: var(--alt-font-body);
  font-size: var(--alt-font-body);
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--alt-radius-md);
  transition: all var(--alt-transition-fast);
  position: relative;
  overflow: hidden;
}

.alt-nav-link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  transform: translateX(-50%);
  transition: width var(--alt-transition-base);
}

.alt-nav-link:hover {
  background: rgba(14, 165, 233, 0.1);
  transform: translateY(-2px);
}

.alt-nav-link:hover::before {
  width: 80%;
}

.alt-nav-link.router-link-active {
  background: linear-gradient(135deg, var(--alt-primary-light) 0%, var(--alt-primary) 100%);
  color: var(--alt-text-secondary);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
}

.alt-nav-link i {
  font-size: 1.125rem;
}

.alt-admin-link {
  background: rgba(230, 57, 70, 0.1);
  color: var(--alt-korea-red);
}

.alt-admin-link:hover {
  background: var(--alt-korea-red);
  color: var(--alt-text-secondary);
}

.alt-dev-link {
  background: rgba(255, 183, 0, 0.1);
  color: var(--alt-korea-yellow);
}

/* Right Actions */
.alt-header-right {
  display: flex;
  align-items: center;
  gap: var(--alt-space-sm);
}

.alt-tutorial-btn,
.alt-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--alt-surface);
  border: 2px solid rgba(14, 165, 233, 0.2);
  border-radius: var(--alt-radius-md);
  color: var(--alt-text-primary);
  font-family: var(--alt-font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--alt-transition-base);
}

.alt-tutorial-btn:hover,
.alt-theme-toggle:hover {
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  border-color: var(--alt-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.alt-tutorial-btn i,
.alt-theme-toggle i {
  font-size: 1.25rem;
}

/* User Profile */
.alt-user-profile {
  position: relative;
  cursor: pointer;
}

.alt-user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--alt-surface);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
  transition: all var(--alt-transition-base);
}

.alt-user-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
}

.alt-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alt-guest-avatar {
  background: var(--alt-text-muted);
}

.alt-guest-text {
  color: var(--alt-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}

.alt-user-status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid var(--alt-surface);
  border-radius: 50%;
  animation: alt-pulse 2s ease-in-out infinite;
}

/* Profile Menu */
.alt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: calc(var(--alt-z-sticky) + 1);
}

.alt-profile-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 90%;
  max-width: 400px;
  background: var(--alt-surface);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.2);
  z-index: calc(var(--alt-z-sticky) + 2);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.alt-profile-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--alt-space-md);
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  color: var(--alt-text-secondary);
}

.alt-profile-menu-header h3 {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h3);
  margin: 0;
}

.alt-close-menu {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: var(--alt-radius-md);
  color: var(--alt-text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all var(--alt-transition-fast);
}

.alt-close-menu:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

/* Login Prompt */
.alt-login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--alt-space-xl);
  text-align: center;
  flex: 1;
}

.alt-login-icon {
  font-size: 5rem;
  color: var(--alt-primary);
  margin-bottom: var(--alt-space-md);
  animation: alt-bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.alt-login-prompt h3 {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h2);
  margin-bottom: var(--alt-space-sm);
  color: var(--alt-text-primary);
}

.alt-login-prompt p {
  color: var(--alt-text-muted);
  margin-bottom: var(--alt-space-md);
  line-height: 1.6;
}

/* Profile Info */
.alt-profile-info-section {
  padding: var(--alt-space-md);
}

.alt-profile-info {
  display: flex;
  align-items: center;
  gap: var(--alt-space-sm);
  padding: var(--alt-space-md);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
  border-radius: var(--alt-radius-lg);
  border: 2px solid rgba(14, 165, 233, 0.2);
}

.alt-profile-info img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--alt-primary);
}

.alt-profile-text h3 {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h3);
  margin: 0 0 0.25rem 0;
  color: var(--alt-text-primary);
}

.alt-profile-text p {
  margin: 0;
  color: var(--alt-text-muted);
  font-size: var(--alt-font-small);
}

/* Mobile Navigation */
.alt-mobile-nav {
  display: flex;
  flex-direction: column;
  padding: var(--alt-space-sm);
  gap: 0.5rem;
}

.alt-menu-item {
  display: flex;
  align-items: center;
  gap: var(--alt-space-sm);
  padding: var(--alt-space-sm) var(--alt-space-md);
  color: var(--alt-text-primary);
  text-decoration: none;
  border-radius: var(--alt-radius-md);
  font-family: var(--alt-font-body);
  font-weight: 600;
  transition: all var(--alt-transition-fast);
  cursor: pointer;
}

.alt-menu-item:hover {
  background: rgba(14, 165, 233, 0.1);
  transform: translateX(8px);
}

.alt-menu-item i {
  font-size: 1.125rem;
  width: 24px;
  text-align: center;
}

.alt-theme-menu-item {
  background: rgba(14, 165, 233, 0.1);
}

.alt-admin-menu-item {
  background: rgba(230, 57, 70, 0.1);
  color: var(--alt-korea-red);
}

.alt-menu-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, rgba(14, 165, 233, 0.3) 50%, transparent 100%);
  margin: var(--alt-space-xs) 0;
}

/* Transitions */
.alt-fade-enter-active,
.alt-fade-leave-active {
  transition: opacity var(--alt-transition-base);
}

.alt-fade-enter-from,
.alt-fade-leave-to {
  opacity: 0;
}

.alt-slide-menu-enter-active,
.alt-slide-menu-leave-active {
  transition: transform var(--alt-transition-base);
}

.alt-slide-menu-enter-from,
.alt-slide-menu-leave-to {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 768px) {
  .alt-header-content {
    min-height: 64px;
    padding: var(--alt-space-xs) 0;
  }

  .alt-location-pin {
    width: 40px;
    height: 40px;
  }

  .alt-location-pin svg {
    width: 24px;
    height: 24px;
  }

  .alt-logo-ko {
    font-size: 1.5rem;
  }

  .alt-logo-en {
    font-size: 0.75rem;
  }

  .alt-beta-badge {
    font-size: 0.625rem;
    padding: 0.2rem 0.5rem;
  }

  .alt-user-avatar {
    width: 40px;
    height: 40px;
  }

  .alt-profile-menu {
    width: 100%;
    max-width: none;
  }
}
</style>

