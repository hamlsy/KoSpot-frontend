<template>
  <div 
    class="mvp-root" 
    :class="{ 'is-loaded': isLoaded, 'is-empty': !mvp && isLoaded }"
    @click="handleCardClick"
  >
    <!-- 로딩 상태 -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-ring" />
        <span class="loading-text">LOADING MVP DATA</span>
      </div>
    </transition>

    <!-- 에러 및 데이터 없음 (Empty State) 상태 -->
    <transition name="fade">
      <div v-if="isLoaded && !mvp" class="empty-state">
        <div class="empty-icon-wrapper">
          <i class="fas fa-crown empty-icon"></i>
        </div>
        <h2 class="empty-title">TODAY'S MVP</h2>
        <p class="empty-text">아직 MVP가 없네요!<br/>지금 당장 랭크 플레이로 MVP를 노려보세요!</p>
        <button class="empty-play-btn" @click.stop="goToRankPlay">
          랭크 게임 하러 가기 <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </transition>

    <!-- 에러 상태 (API 오류 등) -->
    <transition name="fade">
      <div v-if="isError && !mvp" class="error-overlay">
        <i class="fas fa-exclamation-triangle error-icon"></i>
        <span class="error-text">MVP 데이터를 불러올 수 없습니다</span>
      </div>
    </transition>

    <!-- MVP 콘텐츠 (가로형 레이아웃) -->
    <transition name="fade">
      <div v-if="mvp && isLoaded" class="mvp-content-horizontal">
        
        <!-- 왼쪽: 타이틀 섹션 -->
        <div class="hz-section section-left">
          <div class="title-eyebrow">
            <span class="eyebrow-text">HALL OF GLORY</span>
          </div>
          <h1 class="title-main">TODAY'S MVP</h1>
          <div class="title-date">{{ formattedDate }}</div>
          
          <!-- 모바일/좁은 화면에선 이 타이틀 밑에 마커 이미지가 오도록 재배치될 수 있음 -->
        </div>

        <!-- 중앙: 프로필 및 티어 섹션 -->
        <div class="hz-section section-center">
          <div class="marker-wrapper">
            <div class="marker-frame">
              <img
                v-if="mvp.equippedMarkerImageUrl"
                :src="mvp.equippedMarkerImageUrl"
                :alt="mvp.nickname"
                class="marker-img"
                @error="onImgError"
              />
              <div v-else class="marker-placeholder">
                <span>{{ mvp.nickname?.charAt(0)?.toUpperCase() }}</span>
              </div>
            </div>
            <div class="mvp-badge">
              <i class="fas fa-crown badge-icon"></i>
              <span class="badge-text">1st</span>
            </div>
          </div>

          <div class="identity-section">
            <h2 class="nickname">{{ mvp.nickname }}</h2>
            <div class="tier-wrapper">
              <span class="tier-badge" :class="`tier-${mvp.rankTier?.toLowerCase()}`">
                <i :class="getTierIcon(mvp.rankTier)" class="tier-icon"></i>
                <span class="tier-name">{{ formatTierName(mvp.rankTier) }} {{ formatTierLevel(mvp.rankLevel) }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 점수 및 액션 섹션 -->
        <div class="hz-section section-right">
          <div class="rating-box">
            <span class="rating-label">레이팅 점수</span>
            <span class="rating-value">{{ mvp.ratingScore?.toLocaleString() }} <span class="rating-unit">RP</span></span>
          </div>

          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-label">게임 점수</div>
              <div class="stat-value highlight">{{ scoreInt }}.<span class="stat-dec">{{ scoreDec }}</span></div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-label">플레이 지역</div>
              <div class="stat-value">{{ mvp.poiName || '-' }}</div>
            </div>
          </div>
<!-- 
          <div class="interaction-hint">
            <span>자세히 보기</span>
            <i class="fas fa-chevron-right"></i>
          </div> -->
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchDailyMvp } from '../services/dailyMvp.service.js'

// ─── Emits ────────────────────────────────────────────────────────────
const emit = defineEmits(['show-player-details']);
const router = useRouter();

// ─── State ───────────────────────────────────────────────────────────
const mvp = ref(null)
const isLoading = ref(true)
const isLoaded = ref(false)
const isError = ref(false)

// ─── Computed ─────────────────────────────────────────────────────────
const formattedDate = computed(() => {
  if (!mvp.value?.mvpDate) return ''
  const d = new Date(mvp.value.mvpDate)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

const scoreInt = computed(() => {
  if (mvp.value?.gameScore == null) return '0'
  return Math.floor(mvp.value.gameScore).toString()
})

const scoreDec = computed(() => {
  if (mvp.value?.gameScore == null) return '0'
  return (mvp.value.gameScore % 1).toFixed(1).split('.')[1]
})

// ─── Methods ──────────────────────────────────────────────────────────
function handleCardClick() {
  if (mvp.value && isLoaded.value) {
    emit('show-player-details', mvp.value);
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
    const data = response.data?.result || response.data || response;
    
    if (data && data.isSuccess !== false && Object.keys(data).length > 0) {
      // API 응답 구조가 `{ result: null }` 인 경우를 대비
      mvp.value = data.result || data;
      // result가 null인데 data.result 자체가 null 이면 Empty State 로직으로 빠짐
      if (!mvp.value || Object.keys(mvp.value).length === 0) {
        mvp.value = null;
      }
    } else {
       mvp.value = null; // 데이터 없음 Empty State
    }
  } catch (e) {
    console.error('MVP fetch error:', e)
    isError.value = true
    mvp.value = null; 
  } finally {
    isLoading.value = false
    setTimeout(() => { isLoaded.value = true }, 50)
  }
})
</script>

<style scoped>
/* ─── Variables & Root ─────────────────────────────────────────────── */
.mvp-root {
  position: relative;
  width: 100%;
  height: 260px; /* 기존 카드들의 3배 정도 높이 고정 (가로형) */
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  /* box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); */
  overflow: hidden;
  display: flex;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.mvp-root:not(.is-empty) {
  cursor: pointer;
}

/* Hover Micro-interaction (데이터가 있을 때만) - 애니메이션 제거 (피로도 감소) */
.mvp-root:not(.is-empty):hover {
  border-color: #cbd5e1;
}

.mvp-root:not(.is-empty):hover .interaction-hint i {
  color: #0ea5e9;
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
  color: #ef4444; /* 빨간색 계열 */
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
  background: #0ea5e9;
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
  background: #0284c7;
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
  color: #0f172a;
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
.tier-bronze .tier-icon { color: #b45309; }
.tier-silver .tier-icon { color: #64748b; }
.tier-gold .tier-icon { color: #ca8a04; }
.tier-platinum .tier-icon { color: #0891b2; }
.tier-diamond .tier-icon { color: #0ea5e9; }
.tier-master .tier-icon { color: #7c3aed; }

/* 오른쪽: 점수/스탯 표시 */
.section-right {
  flex: 0 0 32%;
  align-items: flex-end; /* 오른쪽 정렬 지원, 세부영역은 우측으로 붙임 */
  background: #f8fafc;
  border-left: 1px solid #f1f5f9;
}

.rating-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  width: 100%;
}

.rating-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.2rem;
  font-weight: 600;
}

.rating-value {
  font-size: 2rem;
  font-weight: 800;
  color: #0ea5e9;
  line-height: 1;
}

.rating-unit {
  font-size: 1rem;
  opacity: 0.8;
  font-weight: 700;
}

.stats-row {
  display: flex;
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
}

.stat-divider {
  width: 1px;
  background: #e2e8f0;
  margin: 0 0.5rem;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.stat-value.highlight {
  color: #0ea5e9;
}

.stat-dec {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* 인터랙션 안내 우측 하단 */
.interaction-hint {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  width: 100%;
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  transition: color 0.2s ease;
}

.interaction-hint i {
  font-size: 0.75rem;
  transition: transform 0.2s ease, color 0.2s ease;
}

/* ─── Transitions ─────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* ─── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .mvp-root {
    height: auto;
    min-height: auto; 
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

  .rating-box {
    align-items: center;
    margin-bottom: 1rem;
  }

  .rating-value {
    font-size: 1.75rem;
  }

  .stats-row {
    margin-bottom: 1rem;
  }

  .interaction-hint {
    justify-content: center;
  }
}
</style>
