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
            <!-- 상점 -->
            <router-link to="/shop" class="nav-link">상점</router-link>
            <!-- 로그인한 경우에만 마이페이지 표시 -->
            <router-link v-if="actualIsLoggedIn" to="/myProfile" class="nav-link">마이페이지</router-link>
            <!-- 버그/문의 -->
            <a href="#" class="nav-link" @click.prevent="openContactModal">버그/문의</a>
            <!-- 관리자 버튼 -->
            <router-link v-if="actualIsAdmin" to="/admin" class="nav-link admin-link">관리자</router-link>
          </div>

          <div class="header-right">
            <button class="tutorial-button" @click="openTutorial" title="게임 소개">
              <i class="fas fa-question-circle"></i>
              <span class="tutorial-text">게임 소개</span>
            </button>

            <!-- 알림 아이콘 (로그인 시에만 표시) -->
            <div v-if="actualIsLoggedIn" class="notification-wrapper" ref="notificationWrapperRef">
              <button class="notification-button" @click="toggleNotificationDropdown" title="알림"
                :class="{ 'notification-button--active': showNotificationDropdown }" aria-label="알림 보기">
                <i class="fas fa-bell"></i>
                <span v-if="notificationUnreadCount > 0" class="notification-badge">
                  {{ notificationUnreadCount > 99 ? '99+' : notificationUnreadCount }}
                </span>
              </button>

              <!-- 알림 드롭다운 -->
              <NotificationDropdown :is-open="showNotificationDropdown" @close="closeNotificationDropdown" />
            </div>

            <!-- 친구 토글 버튼 (로그인 시에만 표시) -->
            <FriendToggleButton v-if="actualIsLoggedIn" :is-open="friendStore.isPanelOpen"
              :has-notification="friendStore.hasAnyNotification"
              :notification-count="friendStore.totalNotificationCount" @toggle="friendStore.togglePanel" />

            <!-- 다크모드 토글 버튼 (웹에만 표시) -->
            <!-- <button class="theme-toggle desktop-only" @click="toggleTheme" :title="isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'">
              <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
            </button> -->

            <div class="user-profile" @click="toggleProfileMenu">
              <div class="user-avatar" :class="{ 'guest-avatar': !actualIsLoggedIn }">
                <img v-if="actualIsLoggedIn" :src="userProfile.avatar" alt="프로필" />
                <span v-else class="guest-text">Guest</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </header>

    <!-- 프로필 메뉴 오버레이 - header 밖으로 이동 -->
    <transition name="fade">
      <div v-if="showProfileMenu" class="overlay" @click="closeProfileMenu"></div>
    </transition>

    <!-- Contact Modal - 버그/문의 모달 -->
    <transition name="fade">
      <div v-if="showContactModal" class="contact-modal-overlay" @click.self="closeContactModal">
        <div class="contact-modal">
          <button class="contact-modal-close" @click="closeContactModal">
            <i class="fas fa-times"></i>
          </button>

          <div class="contact-modal-icon">
            <i class="fas fa-envelope"></i>
          </div>

          <h2 class="contact-modal-title">버그/문의</h2>

          <p class="contact-modal-description">
            버그 또는 기타 문의가 필요할 경우<br />
            아래 연락처로 메일을 보내주세요!
          </p>

          <p class="contact-modal-tip">
            <i class="fas fa-lightbulb"></i>
            버그 제보일 경우 스크린샷 또는 설명이 자세할수록 좋습니다
          </p>

          <div class="contact-email-card">
            <span class="email-address">kospotdev25@gmail.com</span>
            <div class="email-actions">
              <button class="email-action-btn" @click="copyEmail" :title="emailCopied ? '복사 완료!' : '이메일 복사'">
                <i :class="emailCopied ? 'fas fa-check' : 'fas fa-copy'"></i>
                <span>{{ emailCopied ? '복사됨' : '복사' }}</span>
              </button>
              <a href="mailto:kospotdev25@gmail.com" class="email-action-btn primary">
                <i class="fas fa-paper-plane"></i>
                <span>메일 보내기</span>
              </a>
            </div>
          </div>
        </div>
      </div>
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
          <p>다양한 기능을 이용하려면<br />로그인해주세요</p>
          <button @click="goToLogin" class="login-prompt-button">
            <i class="fas fa-sign-in-alt"></i>
            로그인하러 가기
          </button>
        </div>

        <!-- 로그인했을 때 프로필 정보 -->
        <div v-else class="profile-info-section">
          <div class="profile-info">
            <img :src="userProfile.avatar" alt="프로필" />
            <div class="profile-text">
              <h3>{{ userProfile.name }}</h3>
              <p>{{ userProfile.email }}</p>
            </div>
          </div>
        </div>

        <!-- 모바일용 내비게이션 메뉴 추가 -->
        <nav class="mobile-nav" v-if="actualIsLoggedIn">
          <!-- 게임 섹션 -->
          <div class="menu-section-label">게임</div>
          <router-link to="/roadView/main" class="menu-item" @click="closeProfileMenu">
            <span class="menu-icon-wrap menu-icon-roadview"><i class="fas fa-street-view"></i></span>
            로드뷰 모드
          </router-link>
          <router-link to="/lobby" class="menu-item" @click="closeProfileMenu">
            <span class="menu-icon-wrap menu-icon-multi"><i class="fas fa-users"></i></span>
            멀티플레이어
          </router-link>

          <div class="menu-divider"></div>

          <!-- 소셜 섹션 -->
          <div class="menu-section-label">소셜</div>
          <router-link to="/shop" class="menu-item" @click="closeProfileMenu">
            <span class="menu-icon-wrap menu-icon-shop"><i class="fas fa-shopping-bag"></i></span>
            상점
          </router-link>
          <a href="#" class="menu-item" @click.prevent="() => { closeProfileMenu(); friendStore.openPanel(); }">
            <span class="menu-icon-wrap menu-icon-friend"><i class="fas fa-user-friends"></i></span>
            친구
          </a>
          <router-link :to="{ name: 'NoticeListView' }" class="menu-item" @click="closeProfileMenu">
            <span class="menu-icon-wrap menu-icon-notice"><i class="fas fa-bullhorn"></i></span>
            공지사항
          </router-link>
          <a href="#" class="menu-item" @click.prevent="openContactModalFromSidebar">
            <span class="menu-icon-wrap menu-icon-contact"><i class="fas fa-envelope"></i></span>
            버그/문의
          </a>

          <div class="menu-divider"></div>

          <!-- 계정 섹션 -->
          <div class="menu-section-label">계정</div>
          <router-link to="/myProfile" class="menu-item" @click="closeProfileMenu">
            <span class="menu-icon-wrap menu-icon-profile"><i class="fas fa-user-circle"></i></span>
            마이페이지
          </router-link>
          <a href="#" class="menu-item" @click.prevent="handleLogout">
            <span class="menu-icon-wrap menu-icon-logout"><i class="fas fa-sign-out-alt"></i></span>
            로그아웃
          </a>

          <!-- 관리자 페이지 링크 추가 -->
          <router-link v-if="actualIsAdmin" to="/admin" class="menu-item admin-menu-item" @click="closeProfileMenu">
            <span class="menu-icon-wrap menu-icon-admin"><i class="fas fa-user-shield"></i></span>
            관리자 페이지
          </router-link>
        </nav>
      </div>
    </transition>

    <!-- 친구 패널 -->
    <FriendPanel v-if="actualIsLoggedIn" :is-open="friendStore.isPanelOpen" :friends="friendStore.friends"
      :pending-requests="friendStore.pendingRequests" @close="friendStore.closePanel" @open-chat="handleOpenChat"
      @open-user-search="friendStore.openSearch" @accept-request="friendStore.acceptFriendRequest"
      @decline-request="friendStore.declineFriendRequest" @delete-friend="(f) => friendStore.deleteFriend(f.id)" />

    <!-- 사용자 검색 모달 -->
    <UserSearchModal v-if="actualIsLoggedIn" :is-open="friendStore.isSearchOpen" @close="friendStore.closeSearch" />

    <!-- 채팅 창들 (최대 3개) -->
    <FriendChatWindow v-for="(chat, index) in friendStore.openChats" :key="chat.friend.id" :is-open="true"
      :friend="chat.friend" :messages="chat.messages" :is-loading="chat.isLoading"
      :initial-x="computeChatInitialX(index)" :initial-y="computeChatInitialY()" :z-index="chat.zIndex"
      @close="friendStore.closeChatRoom(chat.friend.id)" @send-message="handleSendMessage"
      @focus="friendStore.bringToFront(chat.friend.id)" />
  </div>
</template>


<script>
import { tokenRefreshService } from '@/core/services/tokenRefresh.service.js';
import { useTheme } from '@/core/composables/useTheme.js';
import { useNotificationStore } from '@/store/modules/notificationStore.js';
import { useFriendStore } from '@/features/friend/stores/friend.store.js';
import NotificationDropdown from '@/core/components/NotificationDropdown.vue';
import FriendToggleButton from '@/features/friend/components/FriendToggleButton.vue';
import FriendPanel from '@/features/friend/components/FriendPanel.vue';
import UserSearchModal from '@/features/friend/components/UserSearchModal.vue';
import FriendChatWindow from '@/features/friend/components/FriendChatWindow.vue';

export default {
  name: 'NavigationBar',
  components: {
    NotificationDropdown,
    FriendToggleButton,
    FriendPanel,
    UserSearchModal,
    FriendChatWindow,
  },
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
    const notificationStore = useNotificationStore();
    const friendStore = useFriendStore();

    return {
      isDarkMode,
      toggleTheme,
      notificationStore,
      friendStore,
    };
  },
  data() {
    return {
      showProfileMenu: false,
      showContactModal: false,
      emailCopied: false,
      showNotificationDropdown: false,
      userProfile: {
        name: "김코스팟",
        email: "user@kospot.com",
        avatar: null,
        isAdmin: false
      }
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
    // 미읽은 알림 수 (Pinia 스토어에서)
    notificationUnreadCount() {
      return this.notificationStore.unreadCount;
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
  },
  mounted() {
    // 토큰이 있으면 사용자 정보 조회
    if (this.hasToken) {
      this.checkAuthStatus();
    }
    // 알림 미읽은 수 초기 로드는 appWebSocket.service.js에서 통합 처리하므로 중복 호출 제거
    // 친구 목록/소켓 초기화는 App.vue에서 전역으로 처리됨
    // 외부 클릭으로 알림 드롭다운 닫기
    document.addEventListener('click', this.handleGlobalClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleGlobalClick);
  },
  methods: {
    /**
     * 친구 채팅창 열기 핸들러
     */
    async handleOpenChat(friend) {
      let myMemberId = null;
      try {
        const raw = localStorage.getItem('memberInfo');
        if (raw) {
          const parsed = JSON.parse(raw);
          myMemberId = parsed.memberId ?? parsed.id ?? null;
        }
      } catch { /* Ignore */ }
      await this.friendStore.openChatRoom(friend, myMemberId);
    },
    /**
     * FriendChatWindow의 @send-message 이벤트 처리
     * payload: { friendId, text }
     */
    handleSendMessage({ friendId, text }) {
      this.friendStore.sendMessage(friendId, text);
    },
    /**
     * 채팅창 초기 X 위치 계산 (화면 우하단에서 index 만큼 왼쪽으로)
     * 창 너비 300px + 간격 20px
     */
    computeChatInitialX(index) {
      const W = window.innerWidth;
      if (W <= 480) return 0; // 모바일 Bottom Sheet
      const winW = 300;
      const gap = 20;
      return Math.max(0, W - (winW + gap) * (index + 1));
    },
    /**
     * 채팅창 초기 Y 위치 계산 (화면 하단 20px 여백)
     */
    computeChatInitialY() {
      const H = window.innerHeight;
      if (window.innerWidth <= 480) return 0; // 모바일 Bottom Sheet
      return Math.max(0, H - 440 - 20);
    },
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
    toggleNotificationDropdown() {
      this.showNotificationDropdown = !this.showNotificationDropdown;
      if (this.showNotificationDropdown) {
        this.notificationStore.fetchNotifications();
      }
    },
    closeNotificationDropdown() {
      this.showNotificationDropdown = false;
    },
    handleGlobalClick(event) {
      const wrapper = this.$refs.notificationWrapperRef;
      if (wrapper && !wrapper.contains(event.target)) {
        this.showNotificationDropdown = false;
      }
    },
    openTutorial() {
      this.$emit('open-tutorial');
    },
    // 문의 모달 열기
    openContactModal() {
      this.showContactModal = true;
      this.emailCopied = false;
      document.body.style.overflow = "hidden";
    },
    // 문의 모달 닫기
    closeContactModal() {
      this.showContactModal = false;
      document.body.style.overflow = "";
    },
    // 이메일 복사
    async copyEmail() {
      try {
        await navigator.clipboard.writeText('kospotdev25@gmail.com');
        this.emailCopied = true;
        setTimeout(() => {
          this.emailCopied = false;
        }, 2000);
      } catch (err) {
        console.error('이메일 복사 실패:', err);
      }
    },
    // 사이드바에서 문의 모달 열기 (사이드바 먼저 닫기)
    openContactModalFromSidebar() {
      this.closeProfileMenu();
      // 약간의 딜레이 후 모달 열기 (애니메이션 충돌 방지)
      setTimeout(() => {
        this.openContactModal();
      }, 100);
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
    // 인증 상태 확인
    async checkAuthStatus() {
      // 부모 컴포넌트(MainView, ShopView 등)가 프로필 정보를 내려준 경우 생략
      if (this.userInfo && this.userInfo.name && this.userInfo.name !== "김코스팟") {
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // MainView에서 저장해둔 사용자 정보를 불러와서 사용
          const storedProfile = localStorage.getItem('userProfile');
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            this.userProfile = {
              ...this.userProfile,
              name: parsedProfile.name || this.userProfile.name,
              email: parsedProfile.email || this.userProfile.email,
              avatar: parsedProfile.avatar || this.userProfile.avatar,
              isAdmin: parsedProfile.isAdmin || false
            };
          }
        } catch (error) {
          console.error('로컬스토리지에서 프로필 불러오기 실패:', error);
        }
      }
    },
    // 로그아웃 처리
    handleLogout() {
      // 토큰 갱신 서비스 중지
      tokenRefreshService.stop();

      // 친구 WebSocket 해제 및 상태 초기화
      this.friendStore.destroySocket();
      this.friendStore.reset();

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('memberId');
      localStorage.removeItem('userProfile');
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
  object-fit: contain;
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

/* 알림 버튼 */
.notification-wrapper {
  position: relative;
}

.notification-button {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.notification-button:hover,
.notification-button--active {
  background: rgba(51, 251, 232, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.notification-button i {
  font-size: 1rem;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-surface);
  animation: badge-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  line-height: 1;
}

@keyframes badge-bounce {
  from {
    transform: scale(0);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
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
  padding: var(--spacing-xl) var(--spacing-xl) 0;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
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
  object-fit: contain;
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
  gap: 2px;
  padding: 0.75rem 0.75rem 1.5rem;
  flex: 1;
}

/* 섹션 레이블 */
.menu-section-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary, #9ca3af);
  padding: 0.75rem 0.4rem 0.3rem;
  margin-top: 0.25rem;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.55rem 0.5rem;
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  gap: 0.75rem;
  border-radius: 10px;
  transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;
}

.menu-item:hover,
.menu-item.router-link-active {
  background: var(--color-surface-hover);
  color: var(--color-primary);
  transform: translateX(2px);
}

.menu-item i {
  width: 20px;
  text-align: center;
  font-size: 1rem;
  color: var(--color-text-secondary);
}

/* 아이콘 래퍼 */
.menu-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.menu-item:hover .menu-icon-wrap {
  transform: scale(1.08);
}

/* 아이콘 색상 */
.menu-icon-roadview {
  background: rgba(102, 126, 234, 0.12);
  color: #667eea;
}

.menu-icon-multi {
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.menu-icon-shop {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.menu-icon-friend {
  background: rgba(236, 72, 153, 0.12);
  color: #ec4899;
}

.menu-icon-notice {
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.menu-icon-contact {
  background: rgba(20, 184, 166, 0.12);
  color: #14b8a6;
}

.menu-icon-profile {
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
}

.menu-icon-logout {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.menu-icon-admin {
  background: rgba(99, 102, 241, 0.14);
  color: #6366f1;
}

.menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.4rem 0.4rem;
}

.admin-menu-item {
  color: var(--color-accent) !important;
  font-weight: 600;
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-slow);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-menu-enter-active,
.slide-menu-leave-active {
  transition: transform var(--transition-slow) ease-out;
}

.slide-menu-enter-from,
.slide-menu-leave-to {
  transform: translateX(100%);
}

/* Contact Modal 스타일 */
.contact-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--spacing-lg);
}

.contact-modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 420px;
  padding: var(--spacing-2xl);
  position: relative;
  box-shadow: var(--shadow-xl);
  text-align: center;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.contact-modal-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-surface-hover);
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
}

.contact-modal-close:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.contact-modal-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-modal-icon i {
  font-size: 1.75rem;
  color: white;
}

.contact-modal-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md);
}

.contact-modal-description {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--spacing-md);
}

.contact-modal-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
  background: var(--color-surface-hover);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  margin: 0 0 var(--spacing-xl);
}

.contact-modal-tip i {
  color: var(--color-warning);
}

.contact-email-card {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.email-address {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  word-break: break-all;
}

.email-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
}

.email-action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-decoration: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.email-action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.email-action-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.email-action-btn.primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.email-action-btn i {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .header-content {
    padding: var(--spacing-md) var(--spacing-md);
  }

  /* 모바일에서 로고 크기 축소 */
  .logo-image {
    height: 24px;
  }

  .badge {
    font-size: 0.5rem;
    padding: 2px 5px;
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

  .contact-modal-overlay {
    padding: var(--spacing-md);
  }

  .contact-modal {
    padding: var(--spacing-xl);
    max-width: 100%;
  }

  .contact-modal-icon {
    width: 56px;
    height: 56px;
  }

  .contact-modal-icon i {
    font-size: 1.5rem;
  }

  .contact-modal-title {
    font-size: 1.25rem;
  }

  .email-actions {
    flex-direction: column;
  }

  .email-action-btn {
    justify-content: center;
  }
}
</style>