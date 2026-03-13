<template>
  <div class="mvp-root" :style="mvpColorVars" :class="{ 'is-loaded': isLoaded, 'is-empty': !todayMvp && isLoaded }"
    @click="handleCardClick">
    <!-- 로딩 상태 -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-ring" />
        <span class="loading-text">LOADING MVP DATA</span>
      </div>
    </transition>

    <!-- 에러 및 데이터 없음 (Empty State) 상태 -->
    <transition name="fade">
      <div v-if="isLoaded && !todayMvp" class="empty-state">
        <!-- 어제의 MVP 미니 배지 (오늘 데이터가 없을 때) -->
        <div v-if="yesterdayMvp" class="inline-yesterday-badge empty-state-badge" @click.stop="handleYesterdayClick">
          <div class="yb-avatar">
            <img v-if="yesterdayMvp.equippedMarkerImageUrl" :src="yesterdayMvp.equippedMarkerImageUrl"
              @error="onImgError" />
            <i v-else class="fas fa-user yb-placeholder"></i>
          </div>
          <div class="yb-text">
            <span class="yb-title">YESTERDAY'S MVP</span>
            <span class="yb-nickname">{{ yesterdayMvp.nickname }}</span>
          </div>
          <i class="fas fa-chevron-right yb-arrow"></i>
        </div>

        <div class="empty-icon-wrapper">
          <i class="fas fa-crown empty-icon"></i>
        </div>
        <h2 class="empty-title">TODAY'S MVP</h2>
        <p class="empty-text">아직 MVP가 없네요!<br />지금 당장 랭크 플레이로 MVP를 노려보세요!</p>
        <button class="empty-play-btn" @click.stop="goToRankPlay">
          랭크 게임 하러 가기 <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </transition>

    <!-- 에러 상태 (API 오류 등) -->
    <transition name="fade">
      <div v-if="isError && !todayMvp" class="error-overlay">
        <i class="fas fa-exclamation-triangle error-icon"></i>
        <span class="error-text">MVP 데이터를 불러올 수 없습니다</span>
      </div>
    </transition>

    <!-- MVP 콘텐츠 (가로형 레이아웃) -->
    <transition name="fade">
      <div v-if="todayMvp && isLoaded" class="mvp-content-horizontal">

        <!-- 왼쪽: 타이틀 섹션 -->
        <div class="hz-section section-left">
          <!-- 어제의 MVP 미니 배지 (오늘 데이터가 있을 때) -->
          <div v-if="yesterdayMvp" class="inline-yesterday-badge" @click.stop="handleYesterdayClick">
            <div class="yb-avatar">
              <img v-if="yesterdayMvp.equippedMarkerImageUrl" :src="yesterdayMvp.equippedMarkerImageUrl"
                @error="onImgError" />
              <i v-else class="fas fa-user yb-placeholder"></i>
            </div>
            <div class="yb-text">
              <span class="yb-title">YESTERDAY'S MVP</span>
              <span class="yb-nickname">{{ yesterdayMvp.nickname }}</span>
            </div>
            <i class="fas fa-chevron-right yb-arrow"></i>
          </div>

          <div class="title-eyebrow">
            <span class="eyebrow-text">HALL OF GLORY</span>
          </div>
          <h1 class="title-main">TODAY'S MVP</h1>
          <div class="title-date">{{ formattedDate }}</div>

        </div>

        <!-- 중앙: 프로필 및 티어 섹션 -->
        <div class="hz-section section-center">
          <div class="marker-wrapper">
            <div class="marker-frame">
              <img v-if="todayMvp.equippedMarkerImageUrl" :src="todayMvp.equippedMarkerImageUrl"
                :alt="todayMvp.nickname" class="marker-img" @error="onImgError" />
              <div v-else class="marker-placeholder">
                <span>{{ todayMvp.nickname?.charAt(0)?.toUpperCase() }}</span>
              </div>
            </div>
            <div class="mvp-badge">
              <i class="fas fa-crown badge-icon"></i>
              <span class="badge-text">1st</span>
            </div>
          </div>

          <div class="identity-section">
            <h2 class="nickname">{{ todayMvp.nickname }}</h2>
            <div class="tier-wrapper">
              <span class="tier-badge" :class="`tier-${todayMvp.rankTier?.toLowerCase()}`">
                <i :class="getTierIcon(todayMvp.rankTier)" class="tier-icon"></i>
                <span class="tier-name">{{ formatTierName(todayMvp.rankTier) }} {{ formatTierLevel(todayMvp.rankLevel)
                  }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 점수 및 액션 섹션 -->
        <div class="hz-section section-right">
          <!-- [강조 1] 메인 게임 점수 -->
          <div class="primary-score-box">
            <span class="score-label">BEST GAME SCORE</span>
            <div class="score-value highlight">
              {{ scoreInt }}.<span class="score-dec">{{ scoreDec }}</span>
            </div>
          </div>

          <!-- [강조 2] 플레이 지역 뱃지 -->
          <div class="region-badge">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ todayMvp.poiName || '-' }}</span>
          </div>

          <!-- [강등] 보조 정보 (레이팅 점수) -->
          <div class="stats-row secondary-stats">
            <div class="stat-item">
              <div class="stat-label">레이팅 점수 (RP)</div>
              <div class="stat-value">{{ todayMvp.ratingScore?.toLocaleString() || '-' }}</div>
            </div>
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchDailyMvp } from '../services/dailyMvp.service.js'
import { BRAND, TEXT, BACKGROUND } from '@/core/constants/colors.js'

// ─── Emits ────────────────────────────────────────────────────────────
const emit = defineEmits(['show-player-details']);
const router = useRouter();

// ─── State ───────────────────────────────────────────────────────────
const todayMvp = ref(null)
const yesterdayMvp = ref(null)
const isLoading = ref(true)
const isLoaded = ref(false)
const isError = ref(false)

const mvpColorVars = computed(() => ({
  '--color-primary': BRAND.PRIMARY,
  '--color-secondary': BRAND.SECONDARY,
  '--color-warning': BRAND.WARNING,
  '--color-danger': BRAND.DANGER,
  '--color-background': BACKGROUND.GRAY,
  '--color-surface': BACKGROUND.LIGHT,
  '--color-border': BRAND.SECONDARY,
  '--color-text-primary': TEXT.PRIMARY,
  '--color-text-secondary': TEXT.SECONDARY,
  '--color-text-tertiary': TEXT.MUTED,
}))

// ─── Computed ─────────────────────────────────────────────────────────
const formattedDate = computed(() => {
  if (!todayMvp.value?.mvpDate) return ''
  const d = new Date(todayMvp.value.mvpDate)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

const scoreInt = computed(() => {
  if (todayMvp.value?.gameScore == null) return '0'
  return Math.floor(todayMvp.value.gameScore).toString()
})

const scoreDec = computed(() => {
  if (todayMvp.value?.gameScore == null) return '0'
  return (todayMvp.value.gameScore % 1).toFixed(1).split('.')[1]
})

// ─── Methods ──────────────────────────────────────────────────────────
function handleCardClick() {
  if (todayMvp.value && isLoaded.value) {
    emit('show-player-details', todayMvp.value);
  }
}

function handleYesterdayClick() {
  if (yesterdayMvp.value && isLoaded.value) {
    emit('show-player-details', yesterdayMvp.value);
  }
}

function goToRankPlay() {
  // 랭크 게임 라우팅 (경로에 맞게 수정)
  router.push('/roadView/rank')
}

function getTierIcon(tier) {
  const icons = {
    'BRONZE': 'fas fa-medal',
    'SILVER': 'fas fa-medal',
    'GOLD': 'fas fa-medal',
    'PLATINUM': 'fas fa-gem',
    'DIAMOND': 'fas fa-gem',
    'MASTER': 'fas fa-crown'
  };
  return icons[tier] || 'fas fa-medal';
}

function formatTierName(tier) {
  const names = {
    'BRONZE': 'Bronze',
    'SILVER': 'Silver',
    'GOLD': 'Gold',
    'PLATINUM': 'Platinum',
    'DIAMOND': 'Diamond',
    'MASTER': 'Master'
  };
  return names[tier] || tier;
}

function formatTierLevel(level) {
  if (!level) return 'I';

  const levelMap = {
    'ONE': 'I',
    'TWO': 'II',
    'THREE': 'III',
    'FOUR': 'IV',
    'FIVE': 'V'
  };

  if (levelMap[level.toUpperCase()]) {
    return levelMap[level.toUpperCase()];
  }

  return level.toString();
}

function onImgError(e) {
  e.target.style.display = 'none'
}

// ─── Lifecycle ────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const response = await fetchDailyMvp()
    const responseData = response.data || response;

    // API 응답 구조를 명확히 판별하여 처리
    if (responseData && typeof responseData === 'object' && 'isSuccess' in responseData) {
      if (responseData.isSuccess) {
        todayMvp.value = responseData.result?.today || null;
        yesterdayMvp.value = responseData.result?.yesterday || null;
      } else {
        todayMvp.value = null;
        yesterdayMvp.value = null;
      }
    } else {
      // 구조가 다르거나 데이터가 직접 포함된 경우 fallback 처리
      const rawResult = responseData?.result !== undefined ? responseData.result : responseData;
      todayMvp.value = rawResult?.today || null;
      yesterdayMvp.value = rawResult?.yesterday || null;
    }

    // 데이터 유효성 추가 검사 (빈 객체 등)
    if (todayMvp.value && typeof todayMvp.value === 'object' && Object.keys(todayMvp.value).length === 0) {
      todayMvp.value = null;
    }
    if (yesterdayMvp.value && typeof yesterdayMvp.value === 'object' && Object.keys(yesterdayMvp.value).length === 0) {
      yesterdayMvp.value = null;
    }
  } catch (e) {
    console.error('MVP fetch error:', e)
    isError.value = true
    todayMvp.value = null;
    yesterdayMvp.value = null;
  } finally {
    isLoading.value = false
    isLoaded.value = true
  }
})
</script>

<style scoped>
/* ─── Variables & Root ─────────────────────────────────────────────── */
.mvp-root {
  position: relative;
  width: 100%;
  height: 260px;
  /* 기존 카드들의 3배 정도 높이 고정 (가로형) */
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
  border-radius: 20px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  min-height: 260px;
  /* 고정 최소 높이 설정 (내부 absolute 요소들 때문) */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.mvp-root:not(.is-empty) {
  cursor: pointer;
}

/* Hover Micro-interaction (데이터가 있을 때만) - 애니메이션 제거 (피로도 감소) */
.mvp-root:not(.is-empty):hover {
  border-color: #cbd5e1;
}

/* ─── Loading / Error ─────────────────────────────────────────────── */
.loading-overlay,
.error-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.loading-ring {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #64748b;
  animation: pulse 1.5s ease-in-out infinite;
}

.error-icon {
  font-size: 2rem;
  color: #ef4444;
}

.error-text {
  font-size: 0.95rem;
  color: #64748b;
  text-align: center;
}

/* ─── Empty State ─────────────────────────────────────────────────── */
.empty-state {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #ffffff;
  text-align: center;
  padding: 2rem;
}

.empty-icon-wrapper {
  width: 56px;
  height: 56px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.empty-icon {
  font-size: 1.5rem;
  color: #cbd5e1;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #94a3b8;
  margin: 0;
  letter-spacing: -0.01em;
}

.empty-text {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0.5rem 0 1.25rem 0;
}

.empty-play-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f59e0b;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(14, 165, 233, 0.2);
}

.empty-play-btn:hover {
  background: #f59e0b;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(14, 165, 233, 0.3);
}

/* ─── Horizontal Main Content ─────────────────────────────────────── */
.mvp-content-horizontal {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
}

/* 3분할된 섹션 컴포넌트들 */
.hz-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
}

/* 왼쪽: 타이틀 영역 */
.section-left {
  flex: 0 0 25%;
  align-items: flex-start;
  border-right: 1px dashed #e2e8f0;
  background: linear-gradient(90deg, #ffffff 0%, #f8fafc 100%);
}

.title-eyebrow {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  background: #e0f2fe;
  border-radius: 20px;
  margin-bottom: 0.75rem;
}

.eyebrow-text {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #0369a1;
}

.title-main {
  margin: 0 0 0.5rem 0;
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.title-date {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

/* 중앙: 유저 프로필 및 등급 */
.section-center {
  flex: 1;
  align-items: center;
}

.marker-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.marker-frame {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #ffffff;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.marker-placeholder {
  font-size: 2.5rem;
  font-weight: 700;
  color: #94a3b8;
}

.mvp-badge {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
}

.badge-icon {
  font-size: 0.7rem;
  color: #ffffff;
}

.badge-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #ffffff;
}

.identity-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.nickname {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.8rem;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* 티어 심볼 색상 */
.tier-bronze .tier-icon {
  color: #b45309;
}

.tier-silver .tier-icon {
  color: #64748b;
}

.tier-gold .tier-icon {
  color: #ca8a04;
}

.tier-platinum .tier-icon {
  color: #0891b2;
}

.tier-diamond .tier-icon {
  color: #0ea5e9;
}

.tier-master .tier-icon {
  color: #7c3aed;
}

/* 오른쪽: 점수/스탯 표시 */
.section-right {
  flex: 0 0 32%;
  align-items: flex-end;
  background: #f8fafc;
  border-left: 1px solid #f1f5f9;
}

/* --- 우측 우승 수치 (게임 점수) 강조 --- */
.primary-score-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  /* 데스크탑 우측 정렬 */
  margin-bottom: 0.5rem;
  width: 100%;
}

.score-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.2rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.score-value {
  font-size: 2.3rem;
  /* 기존 레이팅 점수보다 약간 더 크게 배치 */
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
  text-shadow: 0 2px 4px rgba(14, 165, 233, 0.1);
}

.score-dec {
  font-size: 1.2rem;
  /* 소수점은 살짝 작게 */
  opacity: 0.8;
}

/* --- 플레이 지역 뱃지 (Point UI) --- */
.region-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0.4rem 1rem;
  border-radius: 20px;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.region-badge i {
  color: #ef4444;
  /* 마커 전용 레드 컬러로 강도 높은 주목성 부여 */
  font-size: 1.1rem;
}

/* --- 보조 정보 패널 --- */
.secondary-stats {
  padding: 0.6rem;
  background: transparent;
  border: 1px dashed #cbd5e1;
  /* 중요도가 낮음을 시각적으로 표현 */
  margin-bottom: 0px;
}

.stats-row {
  display: flex;
  width: 100%;
  border-radius: 12px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

/* --- 어제의 MVP 뱃지 (Inline / Empty State) --- */
.inline-yesterday-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.35rem 0.75rem 0.35rem 0.35rem;
  border-radius: 100px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 2rem;
}

.inline-yesterday-badge:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.empty-state-badge {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  margin-bottom: 0;
  background: #ffffff;
  z-index: 10;
}

.yb-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yb-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.yb-placeholder {
  font-size: 0.7rem;
  color: #94a3b8;
}

.yb-text {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.yb-title {
  font-size: 0.55rem;
  font-weight: 800;
  color: #0369a1;
  letter-spacing: 0.05em;
  margin-bottom: 0.1rem;
}

.yb-nickname {
  font-size: 0.7rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.yb-arrow {
  font-size: 0.6rem;
  color: #94a3b8;
  margin-left: 0.25rem;
}


/* ─── Transitions ─────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* ─── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .mvp-root {
    height: auto;
    min-height: 260px;
  }

  .mvp-content-horizontal {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    padding: 1rem;
    gap: 0;
  }

  .hz-section {
    padding: 0.5rem;
    justify-content: flex-start;
  }

  .section-left {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    border-right: none;
    background: transparent;
    align-items: flex-start;
  }

  .title-main {
    font-size: 1.6rem;
  }

  .section-center {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
    align-items: center;
    justify-content: center;
  }

  .marker-wrapper {
    margin-bottom: 0.75rem;
  }

  .marker-frame {
    width: 64px;
    height: 64px;
    border-width: 3px;
    box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.1);
  }

  .marker-placeholder {
    font-size: 1.8rem;
  }

  .mvp-badge {
    bottom: -8px;
    padding: 0.15rem 0.6rem;
  }

  .badge-text {
    font-size: 0.65rem;
  }

  .identity-section {
    align-items: center;
  }

  .nickname {
    font-size: 1.2rem;
  }

  .tier-badge {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
  }

  .section-right {
    grid-column: 1 / 3;
    grid-row: 2 / 3;
    border-left: none;
    border-top: 1px dashed #e2e8f0;
    background: transparent;
    align-items: center;
    padding-top: 1rem;
    margin-top: 0.5rem;
  }

  .primary-score-box {
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .score-value {
    font-size: 2rem;
  }

  .region-badge {
    margin-bottom: 1rem;
  }

  .empty-state-badge {
    position: relative;
    top: 0;
    left: 0;
    margin-bottom: 1.5rem;
  }
}
</style>
