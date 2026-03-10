<template>
  <div class="app-container" :style="mainColorVars">
    <!-- 닉네임 설정 모달 -->
    <NicknameSetupModal 
      :show="showNicknameModal"
      @close="handleNicknameModalClose"
      @complete="handleNicknameComplete"
    />

    <!-- 인트로 튜토리얼 모달 -->
    <IntroTutorialModal 
      :show="showTutorial"
      @close="showTutorial = false"
      @complete="handleTutorialComplete"
    />

    <!-- 공통 네비게이션바 사용 -->
    <NavigationBar 
      :is-logged-in="isLoggedIn"
      :user-info="userProfile"
      @open-tutorial="showTutorial = true"
      @logout="handleLogout"
    />

    <!-- 3컬럼 레이아웃 래퍼 -->
    <div class="main-layout">
      <!-- 좌측 광고 영역 -->
      <aside class="ad-sidebar ad-sidebar-left">
        <div class="ad-container" id="google-ad-left">
          <Adsense 
            v-if="!isMobileOrTablet"
            ad-slot="YOUR_AD_SLOT_LEFT"
          />
        </div>
      </aside>
      
      <!-- 중앙 컨텐츠 -->
      <main class="main-content-wrapper">
        <!-- 히어로 섹션과 배너 래퍼 -->
        <div class="hero-banner-wrapper" :class="{ 'has-banner': bannersLoaded && displayBanners && displayBanners.length > 0 }">
          <!-- 히어로 섹션 -->
          <!-- <HeroSection @open-tutorial="showTutorial = false" /> -->

          <!-- Featured Challenge Banner Carousel -->
          <div v-if="bannersLoaded && displayBanners && displayBanners.length > 0" class="banner-carousel">
        <div
          class="banner-container"
          :style="{ transform: `translateX(-${currentBanner * 100}%)` }"
        >
          <div
            v-for="(banner, index) in displayBanners"
            :key="banner.id || index"
            class="main-banner"
            :style="{ backgroundImage: `url(${banner.image})` }"
            @click="onBannerClick(banner)"
            :class="{ 'clickable': banner.link }"
          >
          </div>
        </div>

        <!-- Banner Navigation Dots -->
        <div class="banner-dots">
          <button
            v-for="(banner, index) in displayBanners"
            :key="banner.id || index"
            class="banner-dot"
            :class="{ active: currentBanner === index }"
            @click="setCurrentBanner(index)"
            @mouseenter="setCurrentBanner(index)"
          ></button>
        </div>
        </div>
        </div>

      <!-- 인라인 광고 1: 배너 아래 (모바일/태블릿만) -->
      <!-- <div class="ad-inline ad-inline-top">
        <Adsense 
          v-if="isMobileOrTablet"
          ad-slot="YOUR_AD_SLOT_1"
        />
      </div> -->

      <!-- Game Modes -->
      <section class="game-modes">
        <div class="modes-grid">
          <!-- 로그인/사용자 정보 카드 -->
          <div class="user-card">
            <UserLoginCard
              :is-logged-in="isLoggedIn"
              :user-profile="userProfile"
              @navigate="navigateTo"
              @logout="handleLogout"
            />
          </div>

          <!-- 로드뷰 모드 -->
          <div
            class="mode-card roadview"
            :class="{ locked: !gameModeStatus.roadviewEnabled }"
            @click="handleModeClick('roadView/main', gameModeStatus.roadviewEnabled)"
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
                  <!-- <i class="fas fa-user"></i> 
                  {{ gameModeStatus.roadviewEnabled ? '328명 플레이 중' : '준비 중' }} -->
                </span>
                <!-- <span class="difficulty">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star-half"></i>
                </span> -->
              </div>
            </div>
            <!-- <div v-if="!gameModeStatus.roadviewEnabled" class="mode-overlay">
              <i class="fas fa-lock"></i>
              <span>준비 중</span>
            </div> -->
          </div>

          <!-- 포토 모드 -->
          <!-- <div 
            class="mode-card photo"
            :class="{ locked: !gameModeStatus.photoEnabled }"
            @click="handleModeClick('photo/main', gameModeStatus.photoEnabled)"
          >
            <div class="mode-background"></div>
            <div class="mode-icon">
              <i class="fas fa-camera"></i>
            </div>
            <div class="mode-info">
              <h3>포토 모드</h3>
              <p>관광지 사진으로 지역을 맞혀보세요</p>
              <div class="mode-stats">
                <span class="active-players"> -->
                  <!-- <i class="fas fa-user"></i> 
                  {{ gameModeStatus.photoEnabled ? '156명 플레이 중' : '곧 오픈 예정' }} -->
                <!-- </span> -->
                <!-- <span class="difficulty">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                </span> -->
              <!-- </div>
            </div>
            <div v-if="!gameModeStatus.photoEnabled" class="mode-overlay">
              <i class="fas fa-lock"></i>
              <span>준비 중</span>
            </div>
          </div> -->

          <!-- 멀티플레이어 모드 -->
          <div
            class="mode-card multiplayer"
            :class="{ locked: !gameModeStatus.multiplayEnabled }"
            @click="handleModeClick('lobby', gameModeStatus.multiplayEnabled)"
          >
            <div class="mode-background"></div>
            <div class="mode-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="mode-info">
              <h3>멀티플레이어</h3>
              <p>다른 플레이어들과 함께 게임하세요</p>
              <div class="mode-stats">
                <span class="active-players">
                  <!-- <i class="fas fa-user"></i> 
                  {{ gameModeStatus.multiplayEnabled ? '124명 플레이 중' : '준비 중' }} -->
                </span>
                <!-- <span class="difficulty">
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                  <i class="fas fa-star"></i>
                </span> -->
              </div>
            </div>
            <div v-if="!gameModeStatus.multiplayEnabled" class="mode-overlay">
              <i class="fas fa-lock"></i>
              <span>준비 중</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 인라인 광고 2: 게임 모드와 공지사항 사이 (모바일/태블릿만) -->
      <div class="ad-inline ad-inline-middle">
        <Adsense 
          v-if="isMobileOrTablet"
          ad-slot="YOUR_AD_SLOT_2"
        />
      </div>
      
      <!-- Stats Overview - 베타 버전에서는 숨김 -->
      <!-- 
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
        <router-link to="/friendsList">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <span class="stat-value">15</span>
              <span class="stat-label">친구</span>
            </div>
          </div>
        </router-link>
      </div>
      -->

      <!-- 공지사항 섹션 -->
      <section class="notices-section">
        <div class="section-header">
          <h2 class="section-title">공지사항</h2>
          <router-link :to="{ name: 'NoticeListView' }" class="view-all">
            전체보기 <i class="fas fa-angle-right"></i>
          </router-link>
        </div>
        <!-- 로딩 상태 -->
        <div v-if="noticesLoading" class="notices-loading">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <span>공지사항을 불러오는 중...</span>
          </div>
        </div>
        
        <!-- 공지사항 목록 -->
        <div v-else class="notices-list">
          <div
            class="notice-item"
            v-for="notice in recentNotices"
            :key="notice.id"
            @click="goToNoticeDetail(notice.id)"
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

      <!-- 테스트 링크 - 관리자에게만 표시 -->
      <div v-if="userProfile.isAdmin" class="test-links">
        <h3>테스트 링크 (관리자 전용)</h3>
        <div class="test-links-grid">
          <router-link to="/testTeamGame" class="test-link team-test">
            <i class="fas fa-users"></i>
            <span>협동전 테스트</span>
          </router-link>
          <router-link
            to="/testSoloGame"
            class="test-link solo-test"
          >
            <i class="fas fa-user"></i>
            <span>개인전 테스트</span>
          </router-link>
        </div>
      </div>
      </main>
      
      <!-- 우측 광고 영역 -->
      <aside class="ad-sidebar ad-sidebar-right">
        <div class="ad-container" id="google-ad-right">
          <Adsense 
            v-if="!isMobileOrTablet"
            ad-slot="YOUR_AD_SLOT_RIGHT"
          />
        </div>
      </aside>
    </div>
    
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
          <div class="menu-divider"></div>
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
          <a href="#" class="menu-item" @click.prevent="() => { closeProfileMenu(); $emit('open-friends'); }">
            <span class="menu-icon-wrap menu-icon-friend"><i class="fas fa-user-friends"></i></span>
            친구
          </a>
          <router-link :to="{ name: 'NoticeListView' }" class="menu-item" @click="closeProfileMenu">
            <span class="menu-icon-wrap menu-icon-notice"><i class="fas fa-bullhorn"></i></span>
            공지사항
          </router-link>

          <div class="menu-divider"></div>

          
          <!-- 관리자 페이지 링크 추가 -->
          <router-link
            v-if="userProfile.isAdmin"
            to="/admin"
            class="menu-item admin-menu-item"
            @click="closeProfileMenu"
          >
            <span class="menu-icon-wrap menu-icon-admin"><i class="fas fa-user-shield"></i></span>
            관리자 페이지
          </router-link>
        </nav>
      </div>
    </transition>

    <!-- 잠긴 모드 알림 -->
    <div class="toast-notification" v-if="showToast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/core/composables/useAuth.js';
import NavigationBar from '@/core/components/NavigationBar.vue'
import UserLoginCard from '@/features/main/components/UserLoginCard.vue'
import IntroTutorialModal from '@/features/intro/components/IntroTutorialModal.vue'
import NicknameSetupModal from '@/features/intro/components/NicknameSetupModal.vue'
import HeroSection from '@/features/intro/components/HeroSection.vue'
import Adsense from '@/features/game/shared/components/Common/Adsense.vue'
import { mainService } from '@/features/main/services/main.service.js'
import { BRAND, TEXT, BACKGROUND } from '@/core/constants/colors.js'

// 라우터 설정
const router = useRouter();

// 인증 컴포저블
const { logout: logoutAuth } = useAuth();

// 반응형 상태 정의
// JWT 토큰 확인
const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));
const showProfileMenu = ref(false);
const unreadNotifications = ref(3);
const currentBanner = ref(0);
const bannerInterval = ref(null);
const showToast = ref(false);
const toastMessage = ref("");
const isLoading = ref(true);

// 닉네임 설정 모달 관련 상태
const showNicknameModal = ref(false);

// 튜토리얼 관련 상태
const showTutorial = ref(false);
const isFirstVisited = ref(false);

// 사용자 프로필 정보
const userProfile = ref({
  name: "사용자",
  email: "user@example.com",
  avatar: "/default-avatar.png",
  isAdmin: false,
  isFirstVisited: false,
  lastPlayedAt: null,
  currentPoint: 0
});

// 게임 모드 상태
const gameModeStatus = ref({
  roadviewEnabled: true,
  photoEnabled: false,
  multiplayEnabled: true
});

// 배너 데이터
const banners = ref([]);
const bannersLoaded = ref(false);

// 표시할 배너 (실제 배너 데이터가 있을 때만 반환)
const displayBanners = computed(() => {
  return banners.value && banners.value.length > 0 ? banners.value : [];
});

// 공지사항 데이터
const recentNotices = ref([]);
const noticesLoading = ref(false);

const mainColorVars = computed(() => ({
  '--color-primary': BRAND.PRIMARY,
  '--color-secondary': BRAND.SECONDARY,
  '--color-success': BRAND.SUCCESS,
  '--color-warning': BRAND.WARNING,
  '--color-danger': BRAND.DANGER,
  '--color-info': BRAND.INFO,
  '--color-background': BACKGROUND.LIGHT,
  '--color-surface': BACKGROUND.LIGHT,
  '--color-border': BRAND.SECONDARY,
  '--color-text-primary': TEXT.PRIMARY,
  '--color-text-secondary': TEXT.SECONDARY,
  '--color-text-tertiary': TEXT.MUTED,
  '--main-highlight-bg': BACKGROUND.HIGHLIGHT,
  '--main-muted-bg': BACKGROUND.GRAY
}));

// 반응형 감지
const windowWidth = ref(window.innerWidth);
const isMobileOrTablet = computed(() => windowWidth.value <= 1023);

// 화면 크기 변경 감지
function handleResize() {
  windowWidth.value = window.innerWidth;
}

// 메인 페이지 데이터 로드 함수
async function loadMainPageData() {
  try {
    isLoading.value = true;
    noticesLoading.value = true;
    
    const response = await mainService.getMainPageData();
    
    if (response.isSuccess && response.result) {
      const result = response.result;
      
      // 참고: 백엔드 응답에 gameConfig가 포함될 수 있으나 더 이상 사용하지 않음
      // gameModeStatus만 사용합니다
      
      // 사용자 정보 업데이트 (myInfo 객체에서 가져오기)
      if (result.myInfo) {
        const myInfo = result.myInfo;
        
        // 관리자 여부 업데이트
        userProfile.value.isAdmin = myInfo.isAdmin || false;
        
        // 사용자 프로필 정보 업데이트 (nickname, email, equippedMarkerImageUrl)
        if (myInfo.nickname) {
          userProfile.value.name = myInfo.nickname;
        }
        if (myInfo.email) {
          userProfile.value.email = myInfo.email;
        }
        if (myInfo.equippedMarkerImageUrl) {
          userProfile.value.avatar = myInfo.equippedMarkerImageUrl;
        }
        if(myInfo.lastPlayedAt) {
          userProfile.value.lastPlayedAt = myInfo.lastPlayedAt;
        }
        if(myInfo.currentPoint) {
          userProfile.value.currentPoint = myInfo.currentPoint;
        }
        
        // 첫 방문자 여부 확인 (백엔드에서 제공)
        if (myInfo.isFirstVisited === true) {
          isFirstVisited.value = true;
          userProfile.value.isFirstVisited = true;
          // 닉네임 설정 모달 먼저 표시
          showNicknameModal.value = true;

        } else {
          isFirstVisited.value = false;
          userProfile.value.isFirstVisited = false;
        }

        // 받아온 프로필 정보를 다른 페이지(Lobby 등)에서 재사용할 수 있도록 저장
        localStorage.setItem('userProfile', JSON.stringify(userProfile.value));
      }
      
      // 게임 모드 상태 업데이트
      if (result.gameModeStatus) {
        gameModeStatus.value = {
          roadviewEnabled: result.gameModeStatus.roadviewEnabled ?? true,
          photoEnabled: result.gameModeStatus.photoEnabled ?? false,
          multiplayEnabled: result.gameModeStatus.multiplayEnabled ?? true
        };
      }
      
      // 배너 데이터 변환 및 업데이트
      if (result.banners && Array.isArray(result.banners) && result.banners.length > 0) {
        banners.value = mainService.transformBannersForUI(result.banners);
      } else {
        // 배너가 없으면 빈 배열
        banners.value = [];
      }
      // 배너 로드 완료 플래그 설정
      bannersLoaded.value = true;
      
      // 공지사항 데이터 변환 및 업데이트
      if (result.recentNotices && Array.isArray(result.recentNotices)) {
        recentNotices.value = mainService.transformNoticesForUI(result.recentNotices);
      } else {
        recentNotices.value = [];
      }
      
   
    } else {
      throw new Error(response.message || '메인 페이지 데이터 조회 실패');
    }
  } catch (error) {
    console.error('❌ 메인 페이지 데이터 로드 실패:', error);
    
    // 에러 시 폴백 데이터 사용
    const fallbackData = mainService.getFallbackData();
    gameModeStatus.value = fallbackData.gameModeStatus;
    recentNotices.value = mainService.transformNoticesForUI(fallbackData.recentNotices);
    banners.value = []; // 배너 데이터 없음
    bannersLoaded.value = true; // 배너 로드 완료 (빈 배열이지만 로드 완료로 표시)
    
    // 사용자에게 에러 알림
    showErrorToast('데이터를 불러오는데 실패했습니다. 기본 데이터를 표시합니다.');
  } finally {
    isLoading.value = false;
    noticesLoading.value = false;
  }
}

// 컴포넌트 마운트 시 실행
onMounted(() => {
  loadMainPageData();
  startBannerRotation();
  window.addEventListener('resize', handleResize);
  // 친구 소켓 및 구독은 App.vue에서 전역으로 관리됨
});

// 컴포넌트 언마운트 전 실행
onBeforeUnmount(() => {
  stopBannerRotation();
  window.removeEventListener('resize', handleResize);
});

// 프로필 메뉴 토글 함수
function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
  
  if (showProfileMenu.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}

// 프로필 메뉴 닫기 함수
function closeProfileMenu() {
  showProfileMenu.value = false;
  document.body.style.overflow = "";
}

// 알림 메뉴 열기 함수
function openNotifications() {
  // 알림 메뉴 열기 로직
}

// 페이지 이동 함수
function navigateTo(route) {
  // 로그인 페이지로 이동하는 경우
  if (route === 'loginPage') {
    router.push('/loginPage');
    return;
  }
  
  router.push(`/${route}`);
}

// 게임 모드 클릭 핸들러
function handleModeClick(route, isEnabled) {
  // 모드가 비활성화되어 있으면
  if (!isEnabled) {
    showLockedMessage();
    return;
  }
  
  // 로그인하지 않았으면 로그인 필요 메시지 표시
  if (!isLoggedIn.value) {
    showLoginRequiredMessage();
    return;
  }
  
  // 로그인되어 있고 모드가 활성화되어 있으면 이동
  navigateTo(route);
}

// 로그인 필요 메시지 표시
function showLoginRequiredMessage() {
  toastMessage.value = "로그인이 필요한 서비스입니다. 로그인 후 이용해주세요.";
  showToast.value = true;

  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

// 공지사항 상세 페이지로 이동
function goToNoticeDetail(noticeId) {
  router.push({ name: 'NoticeDetailView', params: { id: noticeId } });
}

// 배너 회전 시작 함수
function startBannerRotation() {
  // 배너가 1개 이하면 회전하지 않음
  if (!displayBanners.value || displayBanners.value.length <= 1) {
    return;
  }
  
  bannerInterval.value = setInterval(() => {
    currentBanner.value = (currentBanner.value + 1) % displayBanners.value.length;
  }, 5000);
}

// 배너 회전 중지 함수
function stopBannerRotation() {
  clearInterval(bannerInterval.value);
}

// 현재 배너 설정 함수
function setCurrentBanner(index) {
  currentBanner.value = index;
  // 자동 회전 재시작
  stopBannerRotation();
  startBannerRotation();
}

// 배너 클릭 핸들러
function onBannerClick(banner) {
  if (banner.link && banner.link.trim() !== '') {
    // 외부 링크인 경우 새 탭에서 열기
    if (banner.link.startsWith('http://') || banner.link.startsWith('https://')) {
      window.open(banner.link, '_blank');
    } else {
      // 내부 링크인 경우 라우터로 이동
      router.push(banner.link);
    }
  }
}

// 잠긴 모드 메시지 표시 함수
function showLockedMessage() {
  toastMessage.value = "포토 모드는 곧 오픈 예정입니다! 기대해주세요.";
  showToast.value = true;

  // 토스트 메시지 3초 후 사라짐
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

// 닉네임 설정 모달 닫기 핸들러
function handleNicknameModalClose() {
  // 닉네임 설정은 필수이므로 닫을 수 없도록 처리
  // 필요시 다시 표시
}

// 닉네임 설정 완료 핸들러
function handleNicknameComplete(nickname) {
  showNicknameModal.value = false;
  
  // 사이드바 닉네임 업데이트
  userProfile.value.name = nickname;
  
  // isFirstVisited를 false로 변경
  isFirstVisited.value = false;
  userProfile.value.isFirstVisited = false;
  
  // 닉네임 설정 완료 후 튜토리얼 표시
  showTutorial.value = true;
}

// 튜토리얼 완료 핸들러
function handleTutorialComplete() {
  // 필요 시 백엔드에 튜토리얼 완료 상태 전송 가능
  // await mainService.markTutorialComplete();
}

// 에러 토스트 표시 함수
function showErrorToast(message) {
  toastMessage.value = message;
  showToast.value = true;

  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

// 로그아웃 처리 함수
async function handleLogout() {
  try {
    // 프로필 메뉴 닫기
    closeProfileMenu();
    
    // 로그아웃 API 호출
    await logoutAuth();
    
    // 메인 페이지 새로고침
    window.location.reload();
  } catch (error) {
    console.error('❌ 로그아웃 처리 중 오류:', error);
    // 에러가 발생해도 로컬 상태 정리 후 새로고침
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('memberId');
    window.location.reload();
  }
}
</script>

<style scoped>
@import url("@/shared/assets/styles/main_page/notice-section/notice.css");
@import url("@/shared/assets/styles/main_page/banner/main-banner.css");

.app-container {
  min-height: 100vh;
  width: 100%;
  background-color: var(--color-background);
  overflow-x: hidden;
  overflow-y: auto;
  transition: background-color var(--transition-slow);
}

/* 3컬럼 레이아웃 */
.main-layout {
  display: flex;
  gap: var(--spacing-xl);
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  position: relative;
}

/* 사이드바 광고 영역 */
.ad-sidebar {
  flex: 0 0 160px;
  position: sticky;
  top: 100px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ad-container {
  width: 160px;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: sticky;
  top: 100px;
}

/* 중앙 컨텐츠 영역 */
.main-content-wrapper {
  flex: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding-top: 80px;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

/* 히어로 섹션과 배너 래퍼 */
.hero-banner-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: var(--spacing-xl);
}

.hero-banner-wrapper:not(.has-banner) {
  min-height: 400px;
}

/* 반응형 인라인 광고 스타일 */
.ad-inline {
  width: 100%;
  max-width: 728px;
  margin: var(--spacing-xl) auto;
}

/* 반응형: 태블릿 이하에서 사이드바 광고 제거 */
@media (max-width: 1023px) {
  .main-layout {
    flex-direction: column;
    padding: 0 var(--spacing-lg);
  }
  
  .ad-sidebar {
    display: none;
  }
  
  .main-content-wrapper {
    max-width: 100%;
    width: 100%;
    padding-left: var(--spacing-lg);
    padding-right: var(--spacing-lg);
  }
  
  .ad-inline {
    max-width: 100%;
    margin: var(--spacing-lg) 0;
    padding: var(--spacing-sm);
  }
}

/* 기존 main-content 스타일 (하위 호환성) */
.main-content {
  padding-top: 80px;
  max-width: 1400px;
  margin: 0 auto;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

/* 배너 클릭 가능 스타일 */
.main-banner.clickable {
  cursor: pointer;
  transition: all var(--transition-normal);
}

.main-banner.clickable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.stat-icon {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.view-all {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: color var(--transition-normal);
  font-weight: 500;
}

.view-all:hover {
  color: var(--color-primary);
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.mode-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.mode-background {
  position: relative;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
  z-index: 0;
  background-size: cover;
  background-position: center;
  transition: opacity var(--transition-normal);
}

.mode-card:hover .mode-background {
  opacity: 0.1;
}

.mode-card.locked {
  position: relative;
  cursor: not-allowed;
  opacity: 0.6;
}

.mode-card.locked:hover {
  transform: none;
  box-shadow: var(--shadow-sm);
}

.mode-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-surface);
  opacity: 0.95;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  color: var(--color-text-secondary);
  font-weight: 600;
  border-radius: var(--radius-xl);
}

.mode-overlay i {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-tertiary);
}

.mode-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);
  font-size: 1.75rem;
  z-index: 1;
  transition: all var(--transition-normal);
}

.roadview .mode-icon {
  background: var(--color-primary);
  color: white;
}

.photo .mode-icon {
  background: var(--color-success);
  color: white;
}

.multiplayer .mode-icon {
  background: var(--color-secondary);
  color: white;
}

.mode-card:hover .mode-icon {
  transform: scale(1.1);
}

.mode-info h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.mode-info p {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: var(--line-height-relaxed);
}

.mode-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
}

.active-players i {
  color: var(--color-primary);
  margin-right: var(--spacing-xs);
}

.difficulty i {
  color: var(--color-warning);
  margin-left: 2px;
}

/* 토스트 알림 */
.toast-notification {
  position: fixed;
  bottom: var(--spacing-xl);
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
  font-size: var(--font-size-small);
  font-weight: 500;
  max-width: 90%;
  text-align: center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
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
  background: var(--main-muted-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--color-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.admin-link {
  color: var(--color-primary);
  font-weight: 600;
}

.admin-menu-item {
  color: var(--color-primary) !important;
  font-weight: 600;
}

.admin-menu-item i {
  color: var(--color-primary);
}

/* 광고 섹션 스타일 */
.ad-section {
  margin: 20px 0;
  width: 100%;
}

.ad-container {
  width: 100%;
  height: 120px;
  background-color: var(--main-muted-bg);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ad-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-secondary);
  color: var(--color-text-secondary);
  font-size: 14px;
  border: 1px dashed var(--color-border);
}

/* 테스트 링크 스타일 */
.test-links {
  margin-top: 2rem;
  padding: 1rem;
  background-color: var(--color-surface);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-border);
}

.test-links h3 {
  font-size: 1.2rem;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.test-links-grid {
  display: flex;
  gap: 1rem;
}

.test-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background-color: var(--main-muted-bg);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text-primary);
  transition: all 0.2s ease;
  flex: 1;
}

.test-link i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.test-link.team-test {
  background-color: var(--main-highlight-bg);
  color: var(--color-info);
}

.test-link.solo-test {
  background-color: rgba(245, 158, 11, 0.12);
  color: var(--color-warning);
}

.test-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 공지사항 로딩 상태 */
.notices-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.loading-spinner i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

/* 토스트 알림 */
.toast-notification {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-text-primary);
  color: var(--color-surface);
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--color-border);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
  font-size: 14px;
  font-weight: 500;
  max-width: 90%;
  text-align: center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
