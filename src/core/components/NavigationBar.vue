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
          <!-- 메인 페이지만 통계/상점/이벤트 표시 -->
          <template v-if="isMainPage">
            <!-- <router-link v-if="actualIsAdmin" :to="{ name: 'NoticeListView', query: { category: '이벤트' } }" class="nav-link">이벤트</router-link>
            <router-link v-if="actualIsAdmin" to="/tempPage" class="nav-link">통계</router-link>
            <router-link v-if="actualIsAdmin" to="/shopMain" class="nav-link">상점</router-link> -->
          </template>
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
          <button v-if="actualIsAdmin" class="icon-button" @click="openNotifications">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" v-if="unreadNotifications">{{ unreadNotifications }}</span>
          </button>
          <div class="user-profile" @click="toggleProfileMenu">
            <div class="user-avatar" :class="{ 'guest-avatar': !actualIsLoggedIn }">
              <img
                v-if="actualIsLoggedIn"
                :src="userProfile.avatar || '/default-avatar.png'"
                alt="프로필"
              />
              <span v-else class="guest-text">Guest</span>
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
              :src="userProfile.avatar || '/default-avatar.png'"
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
          <router-link :to="{ name: 'NoticeListView' }" class="menu-item">
            <i class="fas fa-bullhorn"></i>
            공지사항
          </router-link>
          <!-- 메인 페이지만 통계/상점/이벤트 표시 -->
          <!-- <template v-if="isMainPage">
            <router-link v-if="actualIsAdmin" :to="{ name: 'NoticeListView', query: { category: '이벤트' } }" class="menu-item">
              <i class="fas fa-calendar-alt"></i>
              이벤트
            </router-link>
            <router-link v-if="actualIsAdmin" to="/tempPage" class="menu-item">
              <i class="fas fa-chart-bar"></i>
              통계
            </router-link>
            <router-link v-if="actualIsAdmin" to="/shopMain" class="menu-item">
              <i class="fas fa-shopping-cart"></i>
              상점
            </router-link>
          </template> -->
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
import AppLogo from '@/core/components/AppLogo.vue'; 

export default {
  name: 'NavigationBar',
  components: {
    AppLogo
  },
  props: {
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    userInfo: {
      type: Object,
      default: () => ({})
    }
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

.tutorial-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  will-change: transform;
}

.tutorial-button:hover {
  transform: translate3d(0, -2px, 0);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.tutorial-button i {
  font-size: 1rem;
}

.tutorial-text {
  font-size: 0.9rem;
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

.guest-avatar {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.guest-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #4f46e5;
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
  justify-content: flex-end;
  align-items: start;
  margin-bottom: 24px;
}

.profile-info-section {
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

/* 로그인 안내 스타일 */
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  gap: 1rem;
}

.login-icon {
  font-size: 4rem;
  color: #e0e7ff;
  margin-bottom: 0.5rem;
}

.login-icon i {
  color: #6366f1;
}

.login-prompt h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.login-prompt p {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.login-prompt-button {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
}

.login-prompt-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.login-prompt-button i {
  font-size: 1.1rem;
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
  
  .tutorial-button {
    padding: 8px 12px;
  }
  
  .tutorial-text {
    display: none;
  }
}
</style> 