<template>
  <div class="final-overlay">
    <div class="final-container">

      <!-- 헤더 -->
      <div class="final-header">
        <div class="header-bg-shape"></div>
        <div class="crown-wrap">
          <div class="crown-pulse"></div>
          <i class="fas fa-trophy crown-icon"></i>
        </div>
        <h1 class="final-title">게임 완료!</h1>
        <p class="final-subtitle">{{ totalRounds }}라운드 최종 결과</p>
      </div>

      <!-- 1·2·3등 포디움 -->
      <div class="podium-section">
        <!-- 2등 -->
        <div v-if="podium[1]" class="podium-item podium-2nd">
          <div class="podium-avatar-wrap">
            <img
              :src="podium[1].markerImageUrl || '/assets/default-marker.png'"
              :alt="podium[1].nickname"
              class="podium-avatar"
            />
            <div class="podium-medal silver">2</div>
          </div>
          <p class="podium-name">{{ podium[1].nickname }}</p>
          <p class="podium-score">{{ formatScore(podium[1].totalScore || 0) }}<small>점</small></p>
          <div class="podium-stand stand-2nd"></div>
        </div>

        <!-- 1등 -->
        <div v-if="podium[0]" class="podium-item podium-1st">
          <div class="winner-sparkles">
            <span v-for="j in 6" :key="j" class="sp" :class="`sp-${j}`"></span>
          </div>
          <div class="podium-avatar-wrap">
            <div class="avatar-ring"></div>
            <img
              :src="podium[0].markerImageUrl || '/assets/default-marker.png'"
              :alt="podium[0].nickname"
              class="podium-avatar"
            />
            <div class="podium-medal gold">
              <i class="fas fa-crown"></i>
            </div>
          </div>
          <p class="podium-name">{{ podium[0].nickname }}</p>
          <p class="podium-score">{{ formatScore(podium[0].totalScore || 0) }}<small>점</small></p>
          <div class="podium-stand stand-1st"></div>
        </div>

        <!-- 3등 -->
        <div v-if="podium[2]" class="podium-item podium-3rd">
          <div class="podium-avatar-wrap">
            <img
              :src="podium[2].markerImageUrl || '/assets/default-marker.png'"
              :alt="podium[2].nickname"
              class="podium-avatar"
            />
            <div class="podium-medal bronze">3</div>
          </div>
          <p class="podium-name">{{ podium[2].nickname }}</p>
          <p class="podium-score">{{ formatScore(podium[2].totalScore || 0) }}<small>점</small></p>
          <div class="podium-stand stand-3rd"></div>
        </div>
      </div>

      <!-- 전체 순위 목록 -->
      <div class="rankings-section">
        <div class="section-header">
          <span class="section-title">전체 순위</span>
          <span class="player-badge">{{ playerResults.length }}명</span>
        </div>

        <div class="rankings-list">
          <div
            v-for="player in sortedPlayers"
            :key="player.playerId"
            class="ranking-row"
            :class="{
              'row-gold':   player.finalRank === 1,
              'row-silver': player.finalRank === 2,
              'row-bronze': player.finalRank === 3,
              'row-me':     player.playerId === currentUserId
            }"
          >
            <div class="row-rank">
              <span v-if="player.finalRank === 1" class="rank-icon gold-icon"><i class="fas fa-crown"></i></span>
              <span v-else-if="player.finalRank === 2" class="rank-icon silver-icon">2</span>
              <span v-else-if="player.finalRank === 3" class="rank-icon bronze-icon">3</span>
              <span v-else class="rank-plain">{{ player.finalRank }}</span>
            </div>

            <img
              :src="player.markerImageUrl || '/assets/default-marker.png'"
              :alt="player.nickname"
              class="row-avatar"
            />

            <div class="row-info">
              <span class="row-name">{{ player.nickname }}</span>
              <span v-if="player.playerId === currentUserId" class="me-chip">나</span>
            </div>

            <div class="row-scores">
              <span class="row-total">{{ formatScore(player.totalScore || 0) }}<small>점</small></span>
              <span class="row-points">+{{ player.earnedPoint }}P</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 게임 통계 -->
      <div class="stats-row">
        <div class="stat-item">
          <i class="fas fa-flag stat-icon"></i>
          <span class="stat-val">{{ totalRounds }}</span>
          <span class="stat-lbl">라운드</span>
        </div>
        <div class="stat-sep"></div>
        <div class="stat-item">
          <i class="fas fa-clock stat-icon"></i>
          <span class="stat-val">{{ formatTime(totalGameTime) }}</span>
          <span class="stat-lbl">게임 시간</span>
        </div>
        <div class="stat-sep"></div>
        <div class="stat-item">
          <i class="fas fa-users stat-icon"></i>
          <span class="stat-val">{{ playerResults.length }}</span>
          <span class="stat-lbl">참가자</span>
        </div>
      </div>

      <!-- 자동 종료 게이지 -->
      <div class="auto-bar">
        <div class="auto-progress" :style="{ width: `${(autoExitRemaining / 30) * 100}%` }"></div>
        <span class="auto-text">{{ autoExitRemaining }}초 후 자동 종료</span>
      </div>

      <!-- 액션 버튼 -->
      <div class="actions">
        <button class="btn btn-ghost" @click="handlePlayAgain">
          <i class="fas fa-arrow-left"></i>
          <span>돌아가기</span>
        </button>
        <button class="btn btn-primary" @click="handleExitToLobby">
          <span>나가기</span>
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  playerResults: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: String,
    required: true
  },
  totalRounds: {
    type: Number,
    default: 5
  },
  totalGameTime: {
    type: Number,
    default: 0
  },
  gameMessage: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['exit-to-lobby', 'play-again']);

const autoExitTimer = ref(null);
const autoExitRemaining = ref(30);

const sortedPlayers = computed(() =>
  [...props.playerResults].sort((a, b) => (a.finalRank || 999) - (b.finalRank || 999))
);

const podium = computed(() => sortedPlayers.value.slice(0, 3));

function formatScore(score) {
  return score.toLocaleString();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function startAutoExitTimer() {
  autoExitRemaining.value = 30;
  autoExitTimer.value = setInterval(() => {
    autoExitRemaining.value--;
    if (autoExitRemaining.value <= 0) {
      clearAutoExitTimer();
      emit('exit-to-lobby');
    }
  }, 1000);
}

function clearAutoExitTimer() {
  if (autoExitTimer.value) {
    clearInterval(autoExitTimer.value);
    autoExitTimer.value = null;
  }
}

function handleExitToLobby() {
  clearAutoExitTimer();
  emit('exit-to-lobby');
}

function handlePlayAgain() {
  clearAutoExitTimer();
  emit('play-again');
}

onMounted(() => startAutoExitTimer());
onBeforeUnmount(() => clearAutoExitTimer());
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap');

/* ── 변수 ─────────────────────────────────────── */
:root {
  --brand:        #33fbe8;
  --brand-deep:   #00c9b8;
  --brand-light:  #e8fdfb;
  --gold:         #f59e0b;
  --gold-light:   #fffbeb;
  --silver:       #8b9eb0;
  --silver-light: #f3f6f8;
  --bronze:       #c47f3a;
  --bronze-light: #fdf5ec;
  --surface:      #ffffff;
  --bg:           #f4f6f9;
  --border:       #e8ecf0;
  --text-black:   #111827;
  --text-gray:    #6b7280;
}

/* ── 오버레이 ──────────────────────────────────── */
.final-overlay {
  font-family: 'Pretendard', -apple-system, sans-serif;
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  overflow-y: auto;
}

/* ── 컨테이너 ──────────────────────────────────── */
.final-container {
  width: 100%;
  max-width: 440px;
  background: var(--surface);
  border-radius: 28px;
  box-shadow:
    0 2px 0 rgba(255,255,255,0.9) inset,
    0 24px 64px rgba(0, 0, 0, 0.18),
    0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.94) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── 헤더 ──────────────────────────────────────── */
.final-header {
  position: relative;
  text-align: center;
  padding: 2rem 1.5rem 1.625rem;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
}

.header-bg-shape {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 140px;
  background: radial-gradient(ellipse, rgba(51, 251, 232, 0.18) 0%, transparent 70%);
  pointer-events: none;
}

.crown-wrap {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crown-pulse {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: rgba(51, 251, 232, 0.15);
  animation: pulse 2.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1);    opacity: 0.5; }
  50%       { transform: scale(1.18); opacity: 1; }
}

.crown-icon {
  font-size: 2rem;
  color: var(--brand);
  filter: drop-shadow(0 0 14px rgba(51, 251, 232, 0.55));
  position: relative;
  z-index: 1;
}

.final-title {
  margin: 0 0 0.375rem;
  font-size: 1.625rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.03em;
}

.final-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255,255,255,0.5);
  font-weight: 500;
}

/* ── 포디움 ────────────────────────────────────── */
.podium-section {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1.25rem 0;
  background: var(--bg);
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

/* 1등 반짝이 */
.winner-sparkles {
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 80px;
  pointer-events: none;
  z-index: 0;
}

.sp {
  position: absolute;
  border-radius: 50%;
  background: var(--gold);
  animation: sparkle 2.4s ease-in-out infinite;
}

.sp-1 { width: 5px; height: 5px; top: 4px;  left: 18%; animation-delay: 0s; }
.sp-2 { width: 3px; height: 3px; top: 8px;  left: 72%; animation-delay: 0.4s;  background: var(--brand); }
.sp-3 { width: 4px; height: 4px; top: 2px;  left: 82%; animation-delay: 0.8s; }
.sp-4 { width: 3px; height: 3px; top: 18px; left: 12%; animation-delay: 1.2s;  background: var(--brand); }
.sp-5 { width: 5px; height: 5px; top: 6px;  left: 52%; animation-delay: 1.6s; }
.sp-6 { width: 3px; height: 3px; top: 22px; left: 62%; animation-delay: 2.0s;  background: var(--brand); }

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0) translateY(0); }
  40%, 60%  { opacity: 1; transform: scale(1) translateY(-8px); }
}

/* 아바타 */
.podium-avatar-wrap {
  position: relative;
  z-index: 1;
  margin-bottom: 0.5rem;
}

.avatar-ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  background: conic-gradient(var(--brand), var(--gold), var(--brand));
  animation: spinRing 4s linear infinite;
  z-index: 0;
}

.avatar-ring::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--bg);
}

@keyframes spinRing {
  to { transform: rotate(360deg); }
}

.podium-avatar {
  display: block;
  border-radius: 50%;
  object-fit: cover;
  background: var(--border);
  position: relative;
  z-index: 1;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
}

.podium-1st .podium-avatar { width: 70px; height: 70px; }
.podium-2nd .podium-avatar { width: 54px; height: 54px; }
.podium-3rd .podium-avatar { width: 54px; height: 54px; }

/* 메달 배지 */
.podium-medal {
  position: absolute;
  bottom: -6px;
  right: -4px;
  z-index: 2;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  border: 2px solid #ffffff;
  color: #000;
}

.podium-medal.gold   { background: var(--gold); font-size: 0.6rem; }
.podium-medal.silver { background: #c8d6e0; }
.podium-medal.bronze { background: #d4956a; }

/* 이름 · 점수 */
.podium-name {
  margin: 0 0 0.2rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-black);
  text-align: center;
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.podium-score {
  margin: 0 0 0.625rem;
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--text-black);
  letter-spacing: -0.02em;
}

.podium-score small {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-gray);
  margin-left: 1px;
}

/* 포디움 단 */
.podium-stand {
  width: 100%;
  border-radius: 10px 10px 0 0;
}

.stand-1st {
  height: 72px;
  background: linear-gradient(180deg, var(--brand) 0%, var(--brand-deep) 100%);
  box-shadow: 0 -2px 0 rgba(255,255,255,0.5) inset;
}

.stand-2nd {
  height: 52px;
  background: linear-gradient(180deg, #c8d6e0 0%, #a8bac8 100%);
  box-shadow: 0 -2px 0 rgba(255,255,255,0.4) inset;
}

.stand-3rd {
  height: 38px;
  background: linear-gradient(180deg, #d4956a 0%, #b87340 100%);
  box-shadow: 0 -2px 0 rgba(255,255,255,0.3) inset;
}

/* ── 순위 목록 ─────────────────────────────────── */
.rankings-section {
  padding: 1.25rem 1.25rem 0.25rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-gray);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.player-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-gray);
  background: var(--bg);
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
}

.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 2px;
}

.rankings-list::-webkit-scrollbar { width: 3px; }
.rankings-list::-webkit-scrollbar-track { background: transparent; }
.rankings-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

.ranking-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  background: var(--bg);
  border: 1.5px solid transparent;
  border-radius: 10px;
  transition: border-color 0.2s, background 0.2s;
}

.ranking-row.row-gold   { background: var(--gold-light);   border-color: rgba(245,158,11,0.2); }
.ranking-row.row-silver { background: var(--silver-light); border-color: rgba(139,158,176,0.2); }
.ranking-row.row-bronze { background: var(--bronze-light); border-color: rgba(196,127,58,0.2); }
.ranking-row.row-me:not(.row-gold):not(.row-silver):not(.row-bronze) {
  border-color: rgba(51,251,232,0.4);
  background: var(--brand-light);
}

/* 순위 셀 */
.row-rank {
  width: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 800;
}

.gold-icon   { background: rgba(245,158,11,0.15); color: var(--gold); }
.silver-icon { background: rgba(139,158,176,0.15); color: var(--silver); }
.bronze-icon { background: rgba(196,127,58,0.15);  color: var(--bronze); }

.rank-plain {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-gray);
}

/* 아바타 */
.row-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--border);
  flex-shrink: 0;
  display: block;
}

/* 이름 */
.row-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.row-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-black);
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.me-chip {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--brand-deep);
  background: rgba(51,251,232,0.18);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

/* 점수 */
.row-scores {
  flex-shrink: 0;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.row-total {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--text-black);
  letter-spacing: -0.02em;
}

.row-total small {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-gray);
  margin-left: 1px;
}

.row-points {
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
}

/* ── 통계 ──────────────────────────────────────── */
.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 1.25rem;
  padding: 1rem 0.5rem;
  background: var(--bg);
  border-radius: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.stat-icon {
  font-size: 0.875rem;
  color: var(--brand-deep);
  margin-bottom: 0.1rem;
}

.stat-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-black);
  letter-spacing: -0.03em;
}

.stat-lbl {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-gray);
}

.stat-sep {
  width: 1px;
  height: 36px;
  background: var(--border);
}

/* ── 자동 종료 바 ──────────────────────────────── */
.auto-bar {
  position: relative;
  margin: 0 1.25rem 1rem;
  height: 26px;
  background: var(--bg);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auto-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(51,251,232,0.3), rgba(51,251,232,0.1));
  transition: width 1s linear;
}

.auto-text {
  position: relative;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-gray);
}

/* ── 버튼 ──────────────────────────────────────── */
.actions {
  display: flex;
  gap: 0.625rem;
  padding: 0 1.25rem 1.25rem;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 14px;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  letter-spacing: -0.01em;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%);
  color: #000000;
  box-shadow: 0 4px 16px rgba(51,251,232,0.35);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(51,251,232,0.5);
}

.btn-primary:active { transform: translateY(0); }

.btn-ghost {
  background: var(--bg);
  color: var(--text-black);
  border: 1.5px solid var(--border);
}

.btn-ghost:hover {
  background: #eceef1;
  border-color: #d0d5db;
}

/* ── 반응형 ────────────────────────────────────── */
@media (max-width: 480px) {
  .final-container { border-radius: 22px; }
  .final-header { padding: 1.625rem 1.25rem 1.375rem; }
  .final-title { font-size: 1.4rem; }

  .podium-section { padding: 1.5rem 1rem 0; gap: 0.375rem; }
  .podium-1st .podium-avatar { width: 60px; height: 60px; }
  .podium-2nd .podium-avatar,
  .podium-3rd .podium-avatar { width: 48px; height: 48px; }

  .rankings-list { max-height: 180px; }

  .actions { flex-direction: column-reverse; }
}
</style>