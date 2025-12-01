<template>
  <div class="alt-main-app">
    <!-- Modals -->
    <NicknameSetupModal 
      :show="showNicknameModal"
      @close="handleNicknameModalClose"
      @complete="handleNicknameComplete"
    />

    <IntroTutorialModal 
      :show="showTutorial"
      @close="showTutorial = false"
      @complete="handleTutorialComplete"
    />

    <!-- Navigation -->
    <AltNavigationBar 
      :is-logged-in="isLoggedIn"
      :user-info="userProfile"
      @open-tutorial="showTutorial = true"
      @logout="handleLogout"
    />

    <!-- Main Content -->
    <main class="alt-main-content">
      <!-- Hero Section -->
      <AltHeroSection @open-tutorial="showTutorial = true" />

      <!-- Banner Carousel (if available) -->
      <div v-if="displayBanners && displayBanners.length > 1" class="alt-banner-section">
        <div class="alt-container-narrow">
          <div class="alt-banner-carousel">
            <div
              class="alt-banner-container"
              :style="{ transform: `translateX(-${currentBanner * 100}%)` }"
            >
              <div
                v-for="(banner, index) in displayBanners"
                :key="banner.id || index"
                class="alt-banner-slide"
                :style="{ backgroundImage: `url(${banner.image})` }"
                @click="onBannerClick(banner)"
                :class="{ 'alt-clickable': banner.link }"
              >
                <div class="alt-banner-content">
                  <div class="alt-banner-badge">{{ banner.badge }}</div>
                  <h2>{{ banner.title }}</h2>
                  <p>{{ banner.description }}</p>
                </div>
              </div>
            </div>

            <!-- Navigation Dots -->
            <div class="alt-banner-dots">
              <button
                v-for="(banner, index) in displayBanners"
                :key="banner.id || index"
                class="alt-banner-dot"
                :class="{ 'alt-active': currentBanner === index }"
                @click="setCurrentBanner(index)"
              ></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Modes Section - Asymmetric & Overlapping -->
      <section class="alt-game-modes-section">
        <div class="alt-container">
          <div class="alt-section-header">
            <h2 class="alt-h1">
              <span class="alt-gradient-text">게임 모드</span>
            </h2>
            <p class="alt-body-large">원하는 방식으로 한국을 탐험하세요</p>
          </div>

          <div class="alt-modes-grid">
            <!-- Roadview Mode -->
            <AltGameModeCard
              mode="roadview"
              title="로드뷰 모드"
              description="실제 거리뷰로 위치를 맞춰보세요"
              icon-class="fas fa-street-view"
              :locked="!gameModeStatus.roadviewEnabled"
              :badge="{ text: 'Hot', type: 'hot' }"
              tilt="left"
              @click="handleModeClick('AltRoadViewMainView', gameModeStatus.roadviewEnabled)"
            />

            <!-- Multiplayer Mode -->
            <AltGameModeCard
              mode="multiplayer"
              title="멀티플레이어"
              description="친구들과 함께 전국을 탐험하세요"
              icon-class="fas fa-users"
              :locked="!gameModeStatus.multiplayEnabled"
              :badge="{ text: 'New', type: 'new' }"
              tilt="right"
              @click="handleModeClick('AltLobbyView', gameModeStatus.multiplayEnabled)"
            />

            <!-- Photo Mode (Locked for now) -->
            <AltGameModeCard
              mode="photo"
              title="포토 모드"
              description="관광지 사진으로 지역을 맞혀보세요"
              icon-class="fas fa-camera"
              :locked="true"
              lock-message="곧 오픈 예정"
              tilt="left"
            />
          </div>
        </div>
      </section>

      <!-- Notices Section - Sidebar Style -->
      <section class="alt-notices-section">
        <div class="alt-container">
          <div class="alt-notices-wrapper">
            <!-- Left: Decorative Visual -->
            <div class="alt-notices-visual">
              <div class="alt-visual-icon">
                <i class="fas fa-bullhorn"></i>
              </div>
              <h3 class="alt-h2">공지사항</h3>
              <p class="alt-body">최신 소식을 확인하세요</p>
              <router-link :to="{ name: 'NoticeListView' }" class="alt-btn alt-btn-accent">
                <span>전체보기</span>
                <i class="fas fa-arrow-right"></i>
              </router-link>
            </div>

            <!-- Right: Notice List -->
            <div class="alt-notices-content">
              <!-- Loading State -->
              <div v-if="noticesLoading" class="alt-notices-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>공지사항을 불러오는 중...</span>
              </div>

              <!-- Notice Items -->
              <div v-else class="alt-notices-list">
                <div
                  v-for="(notice, index) in recentNotices"
                  :key="notice.id"
                  class="alt-notice-item alt-stagger-item"
                  :style="{ animationDelay: `${index * 0.1}s` }"
                  @click="goToNoticeDetail(notice.id)"
                >
                  <div class="alt-notice-header">
                    <span class="alt-notice-category" :class="notice.category.toLowerCase()">
                      {{ notice.category }}
                    </span>
                    <span class="alt-notice-date">{{ notice.date }}</span>
                  </div>
                  <h4 class="alt-notice-title">{{ notice.title }}</h4>
                </div>

                <!-- Empty State -->
                <div v-if="recentNotices.length === 0" class="alt-notices-empty">
                  <i class="fas fa-inbox"></i>
                  <p>공지사항이 없습니다</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Toast Notification -->
    <transition name="alt-fade">
      <div class="alt-toast" v-if="showToast">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/core/composables/useAuth.js';
import AltNavigationBar from '@/features/alternative/components/AltNavigationBar.vue';
import AltHeroSection from '@/features/alternative/components/AltHeroSection.vue';
import AltGameModeCard from '@/features/alternative/components/AltGameModeCard.vue';
import IntroTutorialModal from '@/features/intro/components/IntroTutorialModal.vue';
import NicknameSetupModal from '@/features/intro/components/NicknameSetupModal.vue';
import { mainService } from '@/features/main/services/main.service.js';

const router = useRouter();
const { logout: logoutAuth } = useAuth();

// State
const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));
const currentBanner = ref(0);
const bannerInterval = ref(null);
const showToast = ref(false);
const toastMessage = ref("");
const isLoading = ref(true);
const showNicknameModal = ref(false);
const showTutorial = ref(false);
const isFirstVisited = ref(false);

const userProfile = ref({
  name: "사용자",
  email: "user@example.com",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
  isAdmin: false,
  isFirstVisited: false,
  lastPlayedAt: null,
  currentPoint: 0
});

const gameModeStatus = ref({
  roadviewEnabled: true,
  photoEnabled: false,
  multiplayEnabled: true
});

const banners = ref([]);
const defaultBanner = {
  id: 'default-kospot',
  badge: '소개',
  title: 'KoSpot에 오신 것을 환영합니다!',
  description: '대한민국 곳곳을 탐험하는 지리 게임을 즐겨보세요',
  image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=400&fit=crop',
  link: ''
};

const displayBanners = computed(() => {
  return banners.value && banners.value.length > 0 ? banners.value : [defaultBanner];
});

const recentNotices = ref([]);
const noticesLoading = ref(false);

// Load Data
async function loadMainPageData() {
  try {
    isLoading.value = true;
    noticesLoading.value = true;
    
    const response = await mainService.getMainPageData();
    
    if (response.isSuccess && response.result) {
      const result = response.result;
      
      if (result.myInfo) {
        const myInfo = result.myInfo;
        userProfile.value.isAdmin = myInfo.isAdmin || false;
        if (myInfo.nickname) userProfile.value.name = myInfo.nickname;
        if (myInfo.email) userProfile.value.email = myInfo.email;
        if (myInfo.equippedMarkerImageUrl) userProfile.value.avatar = myInfo.equippedMarkerImageUrl;
        if (myInfo.lastPlayedAt) userProfile.value.lastPlayedAt = myInfo.lastPlayedAt;
        if (myInfo.currentPoint) userProfile.value.currentPoint = myInfo.currentPoint;
        
        if (myInfo.isFirstVisited === true) {
          isFirstVisited.value = true;
          userProfile.value.isFirstVisited = true;
          showNicknameModal.value = true;
        } else {
          isFirstVisited.value = false;
          userProfile.value.isFirstVisited = false;
        }
      }
      
      if (result.gameModeStatus) {
        gameModeStatus.value = {
          roadviewEnabled: result.gameModeStatus.roadviewEnabled ?? true,
          photoEnabled: result.gameModeStatus.photoEnabled ?? false,
          multiplayEnabled: result.gameModeStatus.multiplayEnabled ?? true
        };
      }
      
      if (result.banners && Array.isArray(result.banners) && result.banners.length > 0) {
        banners.value = mainService.transformBannersForUI(result.banners);
      } else {
        banners.value = [];
      }
      
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
    const fallbackData = mainService.getFallbackData();
    gameModeStatus.value = fallbackData.gameModeStatus;
    recentNotices.value = mainService.transformNoticesForUI(fallbackData.recentNotices);
    banners.value = [];
    showErrorToast('데이터를 불러오는데 실패했습니다. 기본 데이터를 표시합니다.');
  } finally {
    isLoading.value = false;
    noticesLoading.value = false;
  }
}

onMounted(() => {
  loadMainPageData();
  startBannerRotation();
});

onBeforeUnmount(() => {
  stopBannerRotation();
});

// Banner Functions
function startBannerRotation() {
  if (displayBanners.value.length > 1) {
    bannerInterval.value = setInterval(() => {
      currentBanner.value = (currentBanner.value + 1) % displayBanners.value.length;
    }, 5000);
  }
}

function stopBannerRotation() {
  if (bannerInterval.value) {
    clearInterval(bannerInterval.value);
    bannerInterval.value = null;
  }
}

function setCurrentBanner(index) {
  currentBanner.value = index;
  stopBannerRotation();
  startBannerRotation();
}

function onBannerClick(banner) {
  if (banner.link) {
    if (banner.link.startsWith('http')) {
      window.open(banner.link, '_blank');
    } else {
      router.push(banner.link);
    }
  }
}

// Navigation Functions
function handleModeClick(routeName, enabled) {
  if (!enabled) {
    showErrorToast('준비 중인 기능입니다');
    return;
  }

  if (!isLoggedIn.value) {
    router.push('/loginPage');
    return;
  }

  router.push({ name: routeName });
}

function goToNoticeDetail(noticeId) {
  router.push({ name: 'NoticeDetailView', params: { id: noticeId } });
}

function handleLogout() {
  logoutAuth();
  router.push({ name: 'AltMainView' });
}

function handleNicknameModalClose() {
  showNicknameModal.value = false;
  if (isFirstVisited.value) {
    showTutorial.value = true;
  }
}

function handleNicknameComplete() {
  showNicknameModal.value = false;
  showTutorial.value = true;
}

function handleTutorialComplete() {
  showTutorial.value = false;
}

function showErrorToast(message) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

/* ========================================
   ALTERNATIVE MAIN VIEW - BOLD & ASYMMETRIC
   ======================================== */

.alt-main-app {
  min-height: 100vh;
  background: var(--alt-bg-base);
}

.alt-main-content {
  padding-bottom: var(--alt-space-2xl);
}

/* Banner Section */
.alt-banner-section {
  margin: var(--alt-space-xl) 0;
}

.alt-banner-carousel {
  position: relative;
  border-radius: var(--alt-radius-xl);
  overflow: hidden;
  box-shadow: var(--alt-surface-shadow);
}

.alt-banner-container {
  display: flex;
  transition: transform var(--alt-transition-slow);
}

.alt-banner-slide {
  min-width: 100%;
  height: 300px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.alt-banner-slide.alt-clickable {
  cursor: pointer;
}

.alt-banner-slide::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 100%);
}

.alt-banner-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: var(--alt-text-secondary);
  padding: var(--alt-space-md);
}

.alt-banner-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--alt-accent);
  border-radius: var(--alt-radius-full);
  font-size: var(--alt-font-small);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--alt-space-sm);
}

.alt-banner-content h2 {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h2);
  margin-bottom: var(--alt-space-sm);
}

.alt-banner-content p {
  font-size: var(--alt-font-body);
  opacity: 0.9;
}

.alt-banner-dots {
  position: absolute;
  bottom: var(--alt-space-md);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--alt-space-xs);
  z-index: 2;
}

.alt-banner-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  transition: all var(--alt-transition-fast);
}

.alt-banner-dot.alt-active {
  background: var(--alt-text-secondary);
  transform: scale(1.3);
}

/* Game Modes Section */
.alt-game-modes-section {
  margin: var(--alt-space-2xl) 0;
}

.alt-section-header {
  text-align: center;
  margin-bottom: var(--alt-space-xl);
}

.alt-section-header h2 {
  margin-bottom: var(--alt-space-sm);
}

.alt-section-header p {
  color: var(--alt-text-muted);
}

.alt-modes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--alt-space-lg);
  position: relative;
}

/* Notices Section - Sidebar Style */
.alt-notices-section {
  margin: var(--alt-space-2xl) 0;
}

.alt-notices-wrapper {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--alt-space-xl);
  background: var(--alt-surface);
  border-radius: var(--alt-radius-xl);
  box-shadow: var(--alt-surface-shadow);
  overflow: hidden;
}

.alt-notices-visual {
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  color: var(--alt-text-secondary);
  padding: var(--alt-space-xl);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.alt-visual-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--alt-radius-md);
  font-size: 2.5rem;
  margin-bottom: var(--alt-space-md);
}

.alt-notices-visual h3 {
  margin-bottom: var(--alt-space-sm);
  color: var(--alt-text-secondary);
}

.alt-notices-visual p {
  margin-bottom: var(--alt-space-lg);
  opacity: 0.9;
}

.alt-notices-content {
  padding: var(--alt-space-xl);
}

.alt-notices-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--alt-space-sm);
  padding: var(--alt-space-xl);
  color: var(--alt-text-muted);
  font-size: var(--alt-font-body-large);
}

.alt-notices-loading i {
  font-size: 1.5rem;
}

.alt-notices-list {
  display: flex;
  flex-direction: column;
  gap: var(--alt-space-md);
}

.alt-notice-item {
  padding: var(--alt-space-md);
  background: rgba(14, 165, 233, 0.05);
  border-left: 4px solid var(--alt-primary);
  border-radius: var(--alt-radius-md);
  cursor: pointer;
  transition: all var(--alt-transition-fast);
}

.alt-notice-item:hover {
  background: rgba(14, 165, 233, 0.1);
  transform: translateX(8px);
  border-left-width: 6px;
}

.alt-notice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--alt-space-xs);
}

.alt-notice-category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  font-size: var(--alt-font-small);
  font-weight: 700;
  text-transform: uppercase;
  border-radius: var(--alt-radius-full);
}

.alt-notice-category.update {
  background: #10b981;
}

.alt-notice-category.event {
  background: var(--alt-korea-yellow);
  color: var(--alt-text-primary);
}

.alt-notice-date {
  font-size: var(--alt-font-small);
  color: var(--alt-text-muted);
}

.alt-notice-title {
  font-family: var(--alt-font-body);
  font-size: var(--alt-font-body);
  font-weight: 600;
  color: var(--alt-text-primary);
  margin: 0;
  line-height: 1.5;
}

.alt-notices-empty {
  text-align: center;
  padding: var(--alt-space-xl);
  color: var(--alt-text-muted);
}

.alt-notices-empty i {
  font-size: 3rem;
  margin-bottom: var(--alt-space-md);
  opacity: 0.5;
}

/* Toast Notification */
.alt-toast {
  position: fixed;
  bottom: var(--alt-space-xl);
  left: 50%;
  transform: translateX(-50%);
  background: var(--alt-surface);
  color: var(--alt-text-primary);
  padding: var(--alt-space-md) var(--alt-space-xl);
  border-radius: var(--alt-radius-lg);
  box-shadow: var(--alt-surface-shadow-hover);
  z-index: var(--alt-z-tooltip);
  font-weight: 600;
  border: 2px solid var(--alt-primary);
  max-width: 90%;
  text-align: center;
}

/* Responsive */
@media (max-width: 1024px) {
  .alt-modes-grid {
    grid-template-columns: 1fr;
  }

  .alt-notices-wrapper {
    grid-template-columns: 1fr;
  }

  .alt-notices-visual {
    padding: var(--alt-space-lg);
  }
}

@media (max-width: 768px) {
  .alt-banner-slide {
    height: 200px;
  }

  .alt-banner-content h2 {
    font-size: var(--alt-font-h3);
  }

  .alt-notices-content {
    padding: var(--alt-space-md);
  }
}
</style>

