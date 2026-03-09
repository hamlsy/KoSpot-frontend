<template>
  <div class="mvp-root" :class="{ 'is-loaded': isLoaded }">
    <!-- 배경 레이어들 -->
    <div class="bg-layer">
      <div class="bg-radial-glow" />
      <div class="bg-scanlines" />
      <div class="bg-grid" />
      <canvas ref="particleCanvas" class="bg-particles" />
    </div>

    <!-- 로딩 상태 -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-ring" />
        <span class="loading-text">LOADING MVP DATA</span>
      </div>
    </transition>

    <!-- 에러 상태 -->
    <transition name="fade">
      <div v-if="isError" class="error-overlay">
        <span class="error-icon">⚠</span>
        <span class="error-text">MVP 데이터를 불러올 수 없습니다</span>
      </div>
    </transition>

    <!-- MVP 콘텐츠 -->
    <transition name="fade">
      <div v-if="mvp && isLoaded" class="mvp-content">

        <!-- 타이틀 섹션 -->
        <div class="title-section">
          <div class="title-eyebrow">
            <span class="eyebrow-line" />
            <span class="eyebrow-text">HALL OF GLORY</span>
            <span class="eyebrow-line" />
          </div>
          <h1 class="title-main">
            <span class="title-today">TODAY'S</span>
            <span class="title-mvp">
              <span class="title-mvp-char" v-for="(char, i) in 'MVP'" :key="i" :style="{ animationDelay: `${0.5 + i * 0.08}s` }">{{ char }}</span>
            </span>
          </h1>
          <div class="title-date">{{ formattedDate }}</div>
        </div>

        <!-- 마커 + 유저 중앙 섹션 -->
        <div class="hero-section">

          <!-- 회전 링들 -->
          <div class="rings-wrapper">
            <div class="ring ring-outer" />
            <div class="ring ring-mid" />
            <div class="ring ring-inner" />
            <div class="ring-dots">
              <span class="ring-dot" v-for="n in 8" :key="n" :style="{ '--dot-i': n - 1 }" />
            </div>
          </div>

          <!-- 마커 이미지 -->
          <div class="marker-wrapper">
            <div class="marker-glow" />
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
            <div class="marker-shadow" />
          </div>

          <!-- MVP 배지 -->
          <div class="mvp-badge">
            <span class="badge-icon">🏆</span>
            <span class="badge-text">#1 MVP</span>
          </div>
        </div>

        <!-- 닉네임 & 티어 -->
        <div class="identity-section">
          <div class="nickname-wrapper">
            <h2 class="nickname">{{ mvp.nickname }}</h2>
          </div>
          <div class="tier-wrapper">
            <span class="tier-badge" :class="`tier-${mvp.rankTier?.toLowerCase()}`">
              <span class="tier-icon">{{ tierIcon }}</span>
              <span class="tier-name">{{ mvp.rankTier }} {{ mvp.rankLevel }}</span>
            </span>
            <span class="rating-score">
              <span class="rating-label">RP</span>
              <span class="rating-value">{{ mvp.ratingScore?.toLocaleString() }}</span>
            </span>
          </div>
        </div>

        <!-- 스탯 카드들 -->
        <div class="stats-section">
          <div class="stat-card stat-score">
            <div class="stat-card-inner">
              <div class="stat-icon">🎯</div>
              <div class="stat-body">
                <div class="stat-label">GAME SCORE</div>
                <div class="stat-value score-value">
                  <span class="score-int">{{ scoreInt }}</span><span class="score-dec">.{{ scoreDec }}</span>
                </div>
              </div>
              <div class="stat-shine" />
            </div>
          </div>

          <div class="stat-card stat-rank">
            <div class="stat-card-inner">
              <div class="stat-icon">👑</div>
              <div class="stat-body">
                <div class="stat-label">RANK TIER</div>
                <div class="stat-value rank-value" :class="`tier-text-${mvp.rankTier?.toLowerCase()}`">
                  {{ mvp.rankTier }}
                </div>
                <div class="stat-sub">{{ mvp.rankLevel }}</div>
              </div>
              <div class="stat-shine" />
            </div>
          </div>

          <div class="stat-card stat-poi">
            <div class="stat-card-inner">
              <div class="stat-icon">📍</div>
              <div class="stat-body">
                <div class="stat-label">LOCATION</div>
                <div class="stat-value poi-value">{{ mvp.poiName }}</div>
              </div>
              <div class="stat-shine" />
            </div>
          </div>
        </div>

        <!-- 하단 장식 -->
        <div class="footer-deco">
          <span class="deco-line" />
          <span class="deco-logo">KOSPOT</span>
          <span class="deco-line" />
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fetchDailyMvp } from './dailyMvpService.js'

// ─── State ───────────────────────────────────────────────────────────
const mvp = ref(null)
const isLoading = ref(true)
const isLoaded = ref(false)
const isError = ref(false)
const particleCanvas = ref(null)

let animFrame = null
let particles = []

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

const tierIcon = computed(() => {
  const icons = {
    BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇',
    PLATINUM: '💎', DIAMOND: '💠', MASTER: '🔥',
  }
  return icons[mvp.value?.rankTier] ?? '⭐'
})

// ─── Lifecycle ────────────────────────────────────────────────────────
onMounted(async () => {
  initParticles()
  try {
    const data = await fetchDailyMvp()
    mvp.value = data
    setTimeout(() => { isLoaded.value = true }, 100)
  } catch (e) {
    console.error('MVP fetch error:', e)
    isError.value = true
    // 개발용 mock
    mvp.value = {
      mvpDate: new Date().toISOString().split('T')[0],
      memberId: 1,
      nickname: 'StarChaser',
      equippedMarkerImageUrl: '',
      rankTier: 'DIAMOND',
      rankLevel: 'I',
      ratingScore: 2847,
      gameScore: 98.7,
      poiName: '경복궁',
    }
    isError.value = false
    setTimeout(() => { isLoaded.value = true }, 100)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})

// ─── Particle System ──────────────────────────────────────────────────
function initParticles() {
  const canvas = particleCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  const resize = () => {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const COUNT = 40
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.1,
      color: Math.random() > 0.6 ? '#33fbe8' : '#f59e0b',
    })
  }

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    particles.forEach(p => {
      p.x += p.speedX
      p.y += p.speedY
      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0

      ctx.save()
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
    animFrame = requestAnimationFrame(draw)
  }
  draw()
}

function onImgError(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
/* ─── Google Fonts ─────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;700&display=swap');

/* ─── CSS Variables ─────────────────────────────────────────── */
.mvp-root {
  --c-brand:      #33fbe8;
  --c-gold:       #f59e0b;
  --c-bg:         #111827;
  --c-bg2:        #1f2937;
  --c-border:     #374151;
  --c-text:       #f3f4f6;
  --c-muted:      #9ca3af;
  --c-danger:     #ef4444;
  --c-success:    #10b981;

  --tier-bronze:   #cd7f32;
  --tier-silver:   #c0c0c0;
  --tier-gold:     #f59e0b;
  --tier-platinum: #33fbe8;
  --tier-diamond:  #818cf8;
  --tier-master:   #ef4444;

  --glow-brand: 0 0 20px rgba(51, 251, 232, 0.4), 0 0 60px rgba(51, 251, 232, 0.15);
  --glow-gold:  0 0 20px rgba(245, 158, 11, 0.4), 0 0 60px rgba(245, 158, 11, 0.15);

  font-family: 'Noto Sans KR', sans-serif;
  position: relative;
  width: 100%;
  max-width: 480px;
  min-height: 680px;
  background: var(--c-bg);
  border-radius: 24px;
  border: 1px solid var(--c-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ─── Background Layers ─────────────────────────────────────── */
.bg-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-radial-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 50% 35%, rgba(51, 251, 232, 0.08) 0%, transparent 70%),
    radial-gradient(ellipse 40% 30% at 20% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 60%);
}

.bg-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
  opacity: 0.5;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(51, 251, 232, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(51, 251, 232, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
}

.bg-particles {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ─── Loading / Error ───────────────────────────────────────── */
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
}

.loading-ring {
  width: 48px;
  height: 48px;
  border: 2px solid var(--c-border);
  border-top-color: var(--c-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--c-brand);
  opacity: 0.7;
  animation: pulse 1.5s ease-in-out infinite;
}

.error-icon { font-size: 36px; }
.error-text {
  font-size: 14px;
  color: var(--c-muted);
  text-align: center;
}

/* ─── Main Content ──────────────────────────────────────────── */
.mvp-content {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 32px 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* ─── Title Section ─────────────────────────────────────────── */
.title-section {
  width: 100%;
  text-align: center;
  margin-bottom: 28px;
  opacity: 0;
  transform: translateY(-20px);
  animation: slideDown 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
}

.title-eyebrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.eyebrow-line {
  height: 1px;
  width: 40px;
  background: linear-gradient(90deg, transparent, var(--c-brand));
  opacity: 0.5;
}
.eyebrow-line:last-child {
  background: linear-gradient(90deg, var(--c-brand), transparent);
}

.eyebrow-text {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--c-brand);
  opacity: 0.7;
  text-transform: uppercase;
}

.title-main {
  margin: 0;
  line-height: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.title-today {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.4em;
  color: var(--c-muted);
  font-weight: 400;
}

.title-mvp {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 88px;
  letter-spacing: 0.06em;
  color: var(--c-text);
  line-height: 0.9;
  text-shadow: var(--glow-brand);
  display: flex;
}

.title-mvp-char {
  display: inline-block;
  opacity: 0;
  transform: scale(1.4) translateY(10px);
  animation: charPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.title-date {
  margin-top: 6px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--c-muted);
  opacity: 0.6;
}

/* ─── Hero Section ──────────────────────────────────────────── */
.hero-section {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  opacity: 0;
  animation: fadeScale 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
}

/* Rings */
.rings-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--c-brand);
}

.ring-outer {
  width: 190px;
  height: 190px;
  border-color: rgba(51, 251, 232, 0.15);
  animation: rotateCW 12s linear infinite;
  border-style: dashed;
}

.ring-mid {
  width: 155px;
  height: 155px;
  border-color: rgba(51, 251, 232, 0.25);
  animation: rotateCCW 8s linear infinite;
}

.ring-inner {
  width: 120px;
  height: 120px;
  border-color: rgba(245, 158, 11, 0.3);
  animation: rotateCW 5s linear infinite;
  border-style: dashed;
}

.ring-dots {
  position: absolute;
  width: 155px;
  height: 155px;
  animation: rotateCCW 8s linear infinite;
}

.ring-dot {
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--c-brand);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  box-shadow: 0 0 6px var(--c-brand);
  transform-origin: 0 0;
  transform: rotate(calc(var(--dot-i) * 45deg)) translateX(77px) translateY(-2.5px);
}

/* Marker */
.marker-wrapper {
  position: relative;
  z-index: 2;
  animation: floatY 3s ease-in-out infinite;
}

.marker-glow {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(51, 251, 232, 0.25) 0%, transparent 70%);
  animation: pulse 2s ease-in-out infinite;
}

.marker-frame {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--c-bg2);
  border: 2px solid var(--c-brand);
  box-shadow: var(--glow-brand), inset 0 0 20px rgba(51, 251, 232, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.marker-placeholder {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 36px;
  color: var(--c-brand);
}

.marker-shadow {
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 10px;
  background: radial-gradient(ellipse, rgba(51, 251, 232, 0.3) 0%, transparent 70%);
  filter: blur(4px);
}

/* MVP Badge */
.mvp-badge {
  position: absolute;
  top: -8px;
  right: 10px;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  border-radius: 20px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: var(--glow-gold);
  animation: badgePulse 2s ease-in-out infinite;
}

.badge-icon { font-size: 13px; }
.badge-text {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  color: #1f2937;
  letter-spacing: 0.05em;
}

/* ─── Identity Section ──────────────────────────────────────── */
.identity-section {
  width: 100%;
  text-align: center;
  margin-bottom: 24px;
  opacity: 0;
  animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.75s forwards;
}

.nickname-wrapper {
  margin-bottom: 10px;
}

.nickname {
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 48px;
  letter-spacing: 0.08em;
  color: var(--c-text);
  text-shadow: 0 2px 20px rgba(0,0,0,0.5);
  line-height: 1;
}

.tier-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 100px;
  border: 1px solid;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.tier-badge.tier-bronze  { color: var(--tier-bronze);   border-color: var(--tier-bronze);   background: rgba(205,127,50,0.1); }
.tier-badge.tier-silver  { color: var(--tier-silver);   border-color: var(--tier-silver);   background: rgba(192,192,192,0.1); }
.tier-badge.tier-gold    { color: var(--tier-gold);     border-color: var(--tier-gold);     background: rgba(245,158,11,0.1); }
.tier-badge.tier-platinum{ color: var(--tier-platinum); border-color: var(--tier-platinum); background: rgba(51,251,232,0.1); }
.tier-badge.tier-diamond { color: var(--tier-diamond);  border-color: var(--tier-diamond);  background: rgba(129,140,248,0.1); }
.tier-badge.tier-master  { color: var(--tier-master);   border-color: var(--tier-master);   background: rgba(239,68,68,0.1); }

.rating-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.rating-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--c-muted);
  letter-spacing: 0.1em;
}
.rating-value {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 22px;
  color: var(--c-gold);
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(245,158,11,0.4);
}

/* ─── Stats Section ─────────────────────────────────────────── */
.stats-section {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  opacity: 0;
  transform: translateY(16px);
}
.stat-card:nth-child(1) { animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.95s forwards; }
.stat-card:nth-child(2) { animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 1.05s forwards; }
.stat-card:nth-child(3) { animation: slideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 1.15s forwards; }

.stat-card-inner {
  position: relative;
  background: var(--c-bg2);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  transition: border-color 0.3s, box-shadow 0.3s;
  cursor: default;
  text-align: center;
}

.stat-card-inner:hover {
  border-color: rgba(51, 251, 232, 0.4);
  box-shadow: 0 0 20px rgba(51, 251, 232, 0.08);
}

.stat-score .stat-card-inner:hover { border-color: rgba(16, 185, 129, 0.4); }
.stat-rank  .stat-card-inner:hover { border-color: rgba(129, 140, 248, 0.4); }
.stat-poi   .stat-card-inner:hover { border-color: rgba(245, 158, 11, 0.4); }

.stat-icon {
  font-size: 20px;
  line-height: 1;
}

.stat-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.18em;
  color: var(--c-muted);
  text-transform: uppercase;
}

.stat-value {
  font-family: 'Bebas Neue', sans-serif;
  line-height: 1;
}

.score-value {
  color: var(--c-success);
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}
.score-int { font-size: 28px; }
.score-dec { font-size: 18px; opacity: 0.7; }

.rank-value {
  font-size: 20px;
}
.tier-text-bronze   { color: var(--tier-bronze); }
.tier-text-silver   { color: var(--tier-silver); }
.tier-text-gold     { color: var(--tier-gold); }
.tier-text-platinum { color: var(--tier-platinum); }
.tier-text-diamond  { color: var(--tier-diamond); text-shadow: 0 0 8px rgba(129,140,248,0.5); }
.tier-text-master   { color: var(--tier-master); text-shadow: 0 0 8px rgba(239,68,68,0.4); }

.stat-sub {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: var(--c-muted);
  letter-spacing: 0.1em;
}

.poi-value {
  font-size: 17px;
  color: var(--c-gold);
  text-shadow: 0 0 10px rgba(245,158,11,0.3);
  word-break: keep-all;
  line-height: 1.1;
}

.stat-shine {
  position: absolute;
  top: 0;
  left: -60%;
  width: 40%;
  height: 100%;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%);
  transition: left 0.5s ease;
}
.stat-card-inner:hover .stat-shine {
  left: 120%;
}

/* ─── Footer Deco ───────────────────────────────────────────── */
.footer-deco {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  opacity: 0;
  animation: fadeIn 0.5s ease 1.3s forwards;
}
.deco-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--c-border));
}
.deco-line:last-child {
  background: linear-gradient(90deg, var(--c-border), transparent);
}
.deco-logo {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: var(--c-brand);
  opacity: 0.4;
}

/* ─── Transitions ───────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Keyframes ─────────────────────────────────────────────── */
@keyframes slideDown {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  to { opacity: 1; }
}
@keyframes fadeScale {
  to { opacity: 1; transform: scale(1); }
}
.hero-section { transform: scale(0.85); }

@keyframes charPop {
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes rotateCW {
  to { transform: rotate(360deg); }
}
@keyframes rotateCCW {
  to { transform: rotate(-360deg); }
}

@keyframes floatY {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

@keyframes badgePulse {
  0%, 100% { box-shadow: var(--glow-gold); }
  50%       { box-shadow: 0 0 30px rgba(245, 158, 11, 0.7), 0 0 60px rgba(245, 158, 11, 0.3); }
}

/* ─── Responsive ────────────────────────────────────────────── */
@media (max-width: 360px) {
  .title-mvp  { font-size: 72px; }
  .nickname   { font-size: 38px; }
  .stats-section { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .stat-card-inner { padding: 10px 8px; }
}
</style>
