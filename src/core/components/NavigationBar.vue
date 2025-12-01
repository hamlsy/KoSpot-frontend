<template>
  <div>
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <div class="home-link" @click="goToMain">
            <img src="/images/logo/kospot_logo_1-removebg.png" alt="KoSpot" class="logo-image">
            <span class="badge">Beta</span>
          </div>
        </div>

        <!-- Simple Mode가 아닐 때만 네비게이션 표시 -->
        <template v-if="!simpleMode">
          <!-- 네비게이션 추가 - 웹 전용 -->
          <div class="main-nav desktop-only">
            <router-link :to="{ name: 'NoticeListView' }" class="nav-link">공지사항</router-link>
            <!-- 로그인한 경우에만 마이페이지 표시 -->
            <router-link v-if="actualIsLoggedIn" to="/myProfile" class="nav-link">마이페이지</router-link>
            <!-- 관리자 버튼 -->
            <router-link v-if="actualIsAdmin" to="/admin" class="nav-link admin-link">관리자</router-link>
            <!-- 개발 모드일 때만 개발자 페이지 표시 -->
            <router-link v-if="isDevMode" to="/dev/test" class="nav-link temp-login-link">🧪 개발자 페이지</router-link>
          </div>

          <div class="header-right">
            <button class="tutorial-button" @click="openTutorial" title="게임 소개">
              <i class="fas fa-question-circle"></i>
              <span class="tutorial-text">게임 소개</span>
            </button>
            
            <!-- 다크모드 토글 버튼 (웹에만 표시) -->
            <!-- <button class="theme-toggle desktop-only" @click="toggleTheme" :title="isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'">
              <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
            </button> -->
            
            <div class="user-profile" @click="toggleProfileMenu">
              <div class="user-avatar" :class="{ 'guest-avatar': !actualIsLoggedIn }">
                <img
                  v-if="actualIsLoggedIn"
                  :src="userProfile.avatar"
                  alt="프로필"
                />
                <span v-else class="guest-text">Guest</span>
              </div>
            </div>
          </div>
        </template>
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
          <button @click="closeProfileMenu" class="close-menu">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 로그인하지 않았을 때 로그인 안내 -->
        <div v-if="!actualIsLoggedIn" class="login-prompt">
          <div class="login-icon">
            <i class="fas fa-user-circle"></i>
          </div>
          <h3>로그인이 필요합니다</h3>
          <p>다양한 기능을 이용하려면<br/>로그인해주세요</p>
          <button @click="goToLogin" class="login-prompt-button">
            <i class="fas fa-sign-in-alt"></i>
            로그인하러 가기
          </button>
        </div>

        <!-- 로그인했을 때 프로필 정보 -->
        <div v-else class="profile-info-section">
          <div class="profile-info">
            <img
              :src="userProfile.avatar"
              alt="프로필"
            />
            <div class="profile-text">
              <h3>{{ userProfile.name }}</h3>
              <p>{{ userProfile.email }}</p>
            </div>
          </div>
        </div>

        <!-- 모바일용 내비게이션 메뉴 추가 -->
        <nav class="mobile-nav" v-if="actualIsLoggedIn">
          <!-- 다크모드 토글 (모바일용) -->
          <div class="menu-item theme-menu-item" @click="toggleTheme">
            <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
            {{ isDarkMode ? '라이트 모드' : '다크 모드' }}
          </div>
          
          <div class="menu-divider"></div>
          
          <router-link :to="{ name: 'NoticeListView' }" class="menu-item">
            <i class="fas fa-bullhorn"></i>
            공지사항
          </router-link>
          <router-link to="/myProfile" class="menu-item">
            <i class="fas fa-user-circle"></i>
            마이페이지
          </router-link>
          <div class="menu-divider"></div>
          <!-- 개발 모드일 때만 개발자 페이지 표시 -->
          <router-link v-if="isDevMode" to="/dev/test" class="menu-item temp-login-menu-item">
            <i class="fas fa-flask"></i>
            개발자 페이지
          </router-link>
          <a href="#" class="menu-item" @click.prevent="handleLogout">
            <i class="fas fa-sign-out-alt"></i>
            로그아웃
          </a>
          
          <!-- 관리자 페이지 링크 추가 -->
          <router-link v-if="actualIsAdmin" to="/admin" class="menu-item admin-menu-item">
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
  name: 'NavigationBar',
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
      unreadNotifications: 3,
      userProfile: {
        name: "김코스팟",
        email: "user@kospot.com",
        avatar: null,
        isAdmin: false
      },
      isDevMode: true
    };
  },
  computed: {
    // JWT 토큰 확인
    hasToken() {
      return !!localStorage.getItem('accessToken');
    },
    // 실제 로그인 상태 (props 또는 토큰 확인)
    actualIsLoggedIn() {
      return this.isLoggedIn || this.hasToken;
    },
    // 메인 페이지인지 확인
    isMainPage() {
      const path = this.$route?.path || '';
      const routeName = this.$route?.name || '';
      
      // 공지사항 관련 페이지에서는 항상 false 반환
      if (path.startsWith('/notice') || routeName === 'NoticeListView' || routeName === 'NoticeDetailView' || routeName === 'NoticeWriteView') {
        return false;
      }
      
      // 메인 페이지인 경우만 true 반환
      return path === '/main' || path === '/';
    },
    // 공지사항 페이지인지 확인
    isNoticePage() {
      return this.$route.path.startsWith('/notice');
    },
    // 관리자 여부 (props에서 받거나 하드코딩된 값)
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
      // 라우트 변경 시 개발 모드 확인
      this.checkDevMode();
    }
  },
  mounted() {
    this.checkDevMode();
    // 토큰이 있으면 사용자 정보 업데이트
    if (this.hasToken && !this.actualIsLoggedIn) {
      this.checkAuthStatus();
    }
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
    openTutorial() {
      this.$emit('open-tutorial');
    },
    goToLogin() {
      this.closeProfileMenu();
      this.$router.push('/loginPage');
    },
    goToMain() {
      // 메인 페이지로 새로고침 이동
      // window.location.href = '/main';
      
      this.$router.push('/main');
    },
    // 개발 모드 확인 (API 연결 실패 시)
    async checkDevMode() {
      // 개발 모드 감지는 초기 로드 시 한 번만 수행
      if (this.$route.matched.length === 0) {
        return;
      }
      
      try {
        // API 연결 테스트 (타임아웃 2초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 2000);
        
        const testResponse = await fetch('/api/main', { 
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (testResponse.ok) {
          this.isDevMode = false;
        } else {
          // API 응답이 실패하면 개발 모드로 간주
          this.isDevMode = true;
          console.log('🔧 개발 모드 감지: API 응답 실패');
        }
      } catch (error) {
        // 네트워크 에러, 타임아웃, 또는 CORS 에러 시 개발 모드로 간주
        this.isDevMode = true;
        console.log('🔧 개발 모드 감지: API 연결 실패', error.name || error.message);
      }
    },
    // 인증 상태 확인
    async checkAuthStatus() {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // 토큰이 있으면 사용자 정보 조회 시도
        try {
          // API 호출은 필요 시 구현
          // 현재는 props로 전달받은 userInfo 사용
        } catch (error) {
          console.error('인증 상태 확인 실패:', error);
        }
      }
    },
    // 로그아웃 처리
    handleLogout() {
      // 토큰 갱신 서비스 중지
      console.log('🛑 로그아웃: 토큰 갱신 서비스 중지');
      tokenRefreshService.stop();
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('memberId');
      this.userProfile = {
        name: "",
        email: "",
        avatar: null,
        isAdmin: false
      };
      this.closeProfileMenu();
      this.$router.push('/main');
      // 부모 컴포넌트에 로그아웃 이벤트 전달
      this.$emit('logout');
    },
    // 나가기 버튼 처리 (Simple Mode)
    handleBackButton() {
      this.$emit('back');
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
  background: var(--color-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border-light);
  z-index: 100;
  transition: all var(--transition-slow);
}

.dark .header {
  background: rgba(30, 41, 59, 0.9);
  border-bottom-color: var(--color-border);
}

.header-content {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
}

.home-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  cursor: pointer;
  transition: opacity var(--transition-normal);
}

.home-link:hover {
  opacity: 0.8;
}

.logo-image {
  height: 32px;
  width: auto;
  object-fit: contain;
  transition: opacity var(--transition-normal);
}

.badge {
  background: var(--color-accent);
  color: white;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: 0.625rem;
  font-weight: 700;
  margin-left: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.main-nav {
  margin-left: 3rem;
  display: flex;
  gap: 2rem;
}

.nav-link {
  position: relative;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: var(--font-size-body);
  transition: color var(--transition-normal);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--color-primary);
  transition: width var(--transition-normal);
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--color-primary);
}

.admin-link {
  color: var(--color-accent);
  font-weight: 600;
}

.admin-link::after {
  background: var(--color-accent);
}

.temp-login-link {
  color: var(--color-warning);
  font-weight: 600;
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.tutorial-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.tutorial-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--color-primary-dark);
}

.tutorial-button i {
  font-size: 1rem;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.theme-toggle:hover {
  background: var(--color-border-light);
  transform: rotate(180deg);
}

.theme-toggle i {
  font-size: 1.1rem;
}

.user-profile {
  cursor: pointer;
  transition: transform var(--transition-normal);
}

.user-profile:hover {
  transform: scale(1.05);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-surface-hover);
  border: 2px solid var(--color-border);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition-normal);
}

.user-avatar:hover {
  border-color: var(--color-primary);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guest-avatar {
  background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
}

.guest-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.02em;
}

/* 오버레이 스타일 */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9998;
  transition: opacity var(--transition-slow);
}

.dark .overlay {
  background-color: rgba(0, 0, 0, 0.6);
}

/* 프로필 메뉴 스타일 */
.profile-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  background: var(--color-surface);
  z-index: 9999;
  padding: var(--spacing-xl);
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  border-left: 1px solid var(--color-border);
}

.profile-header {
  display: flex;
  justify-content: flex-end;
  align-items: start;
  margin-bottom: var(--spacing-xl);
}

.profile-info-section {
  margin-bottom: var(--spacing-xl);
}

.profile-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.profile-info img {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  border: 2px solid var(--color-border);
}

.profile-text h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  margin-top: 0;
}

.profile-text p {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin: 0;
}

.close-menu {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-menu:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: 500;
  gap: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-normal);
}

.menu-item:hover {
  background: var(--color-surface-hover);
  transform: translateX(4px);
}

.menu-item i {
  width: 20px;
  text-align: center;
  font-size: 1.1rem;
  color: var(--color-text-secondary);
}

.menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-md) 0;
}

.admin-menu-item {
  color: var(--color-accent) !important;
  font-weight: 600;
}

.admin-menu-item i {
  color: var(--color-accent);
}

.temp-login-menu-item {
  color: var(--color-warning) !important;
  font-weight: 600;
}

.temp-login-menu-item i {
  color: var(--color-warning);
}

.theme-menu-item {
  cursor: pointer;
  font-weight: 500;
}

.theme-menu-item:hover {
  color: var(--color-primary);
}

.theme-menu-item i {
  color: var(--color-primary);
}

/* 로그인 안내 스타일 */
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-md);
  gap: var(--spacing-lg);
}

.login-icon {
  font-size: 4rem;
  color: var(--color-primary-light);
  margin-bottom: var(--spacing-sm);
}

.login-icon i {
  color: var(--color-primary);
}

.login-prompt h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.login-prompt p {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.login-prompt-button {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-body);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  justify-content: center;
}

.login-prompt-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: var(--color-primary-dark);
}

.login-prompt-button i {
  font-size: 1.1rem;
}

/* 트랜지션 애니메이션 */
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-slow);
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-menu-enter-active, .slide-menu-leave-active {
  transition: transform var(--transition-slow) ease-out;
}

.slide-menu-enter-from, .slide-menu-leave-to {
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .header-content {
    padding: var(--spacing-md) var(--spacing-md);
  }
  
  .main-nav {
    margin-left: var(--spacing-lg);
    gap: var(--spacing-lg);
  }
  
  .tutorial-button {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .tutorial-text {
    display: none;
  }
  
  .profile-menu {
    width: 100%;
    max-width: 320px;
  }
}
</style> 