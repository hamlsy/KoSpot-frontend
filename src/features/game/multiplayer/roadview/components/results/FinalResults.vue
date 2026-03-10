<template>
  <div class="result-overlay">
    <div class="result-content">
      <!-- 브랜드 포인트 바 -->
      <div class="brand-bar"></div>

      <!-- 상단 헤더: 컴팩트 & 심플 -->
      <div class="result-header">
        <div class="header-icon">
          <i class="fas fa-flag-checkered"></i>
        </div>
        <span class="result-title">게임 결과</span>
        <div class="round-badge">{{ totalRounds }}라운드 완료</div>
      </div>

      <!-- 중앙 포디움: TOP 3 강조 -->
      <div class="podium-hero">
        <!-- 2등 -->
        <div v-if="podium[1]" class="podium-item podium-2nd">
          <div class="avatar-wrap">
            <img :src="podium[1].markerImageUrl || '/assets/default-marker.png'" :alt="podium[1].nickname" class="avatar" />
            <div class="medal silver">2</div>
          </div>
          <p class="name">{{ podium[1].nickname }}</p>
          <p class="score">{{ formatScore(podium[1].totalScore) }}</p>
        </div>

        <!-- 1등 -->
        <div v-if="podium[0]" class="podium-item podium-1st">
          <i class="fas fa-crown crown-icon"></i>
          <div class="avatar-wrap">
            <div class="avatar-ring"></div>
            <img :src="podium[0].markerImageUrl || '/assets/default-marker.png'" :alt="podium[0].nickname" class="avatar" />
            <div class="medal gold">1</div>
          </div>
          <p class="name">{{ podium[0].nickname }}</p>
          <p class="score">{{ formatScore(podium[0].totalScore) }}</p>
        </div>

        <!-- 3등 -->
        <div v-if="podium[2]" class="podium-item podium-3rd">
          <div class="avatar-wrap">
            <img :src="podium[2].markerImageUrl || '/assets/default-marker.png'" :alt="podium[2].nickname" class="avatar" />
            <div class="medal bronze">3</div>
          </div>
          <p class="name">{{ podium[2].nickname }}</p>
          <p class="score">{{ formatScore(podium[2].totalScore) }}</p>
        </div>
      </div>

      <!-- 통계 행 -->
      <div class="stats-row">
        <div class="stat-item">
          <i class="fas fa-users stat-icon"></i>
          <span class="stat-value">{{ playerResults.length }}</span>
          <span class="stat-label">참여 인원</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <i class="fas fa-clock stat-icon"></i>
          <span class="stat-value">{{ formatTime(totalGameTime) }}</span>
          <span class="stat-label">소요 시간</span>
        </div>
      </div>

      <!-- 하단 액션 & 로딩 바 -->
      <div class="footer-action">
        <div class="action-row">
          <button class="btn-primary" @click="handlePlayAgain">
            <i class="fas fa-undo"></i> 방으로 돌아가기
          </button>
          <button class="btn-ghost" @click="handleExitToLobby">
            <i class="fas fa-sign-out-alt"></i> 나가기
          </button>
        </div>
        
        <div class="auto-exit-wrapper">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: `${autoExitProgress}%` }"></div>
          </div>
          <span class="auto-exit-text">{{ autoExitRemaining }}초 후 대기실로 이동합니다</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
  },
  autoExitRemaining: {
    type: Number,
    default: 30
  },
  autoExitTotal: {
    type: Number,
    default: 30
  }
});

const emit = defineEmits(['exit-to-lobby', 'play-again']);

// 상위 3명만 추출
const sortedPlayers = computed(() =>
  [...props.playerResults].sort((a, b) => (a.finalRank || 999) - (b.finalRank || 999))
);
const podium = computed(() => sortedPlayers.value.slice(0, 3));

const autoExitProgress = computed(() => {
  if (!props.autoExitTotal || props.autoExitTotal <= 0) return 0;
  const remaining = Math.max(0, props.autoExitRemaining);
  return Math.min(100, (remaining / props.autoExitTotal) * 100);
});

function formatScore(score) {
  if (!score) return '0 점';
  return `${score.toLocaleString()} 점`;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function handleExitToLobby() {
  emit('exit-to-lobby');
}

function handlePlayAgain() {
  emit('play-again');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap');

/* 공통 변수 및 오버레이 설정 (RoundResults 레퍼런스 적용 - 인라인 블록화) */
.result-overlay {
  font-family: 'Pretendard', -apple-system, sans-serif;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background-color: transparent; /* BaseGameLayout의 배경을 그대로 사용 */
  overflow: hidden; /* 모바일 넘침 방지 설계 */
}

/* 결과 카드 컨테이너 */
.result-content {
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 20px 48px rgba(0, 0, 0, 0.18);
  width: 100%;
  max-width: 800px; /* 데스크톱에서 꽉 차보이게 폭 조정 */
  height: 100%; /* 부모(main-panel)에 유연하게 핏 */
  max-height: 100%; /* 모바일에서 잘리지 않도록 높이 100% 보장 */
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  animation: card-in 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* 이하 스크롤바 숨김 등 원래 CSS 유지... */
.result-content::-webkit-scrollbar {
  display: none;
}
.result-content {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 상단 부분(헤더, 브랜드바) 유지를 위해 약간의 여유공간 분배 사용 */
.brand-bar {
  height: 5px;
  background: linear-gradient(90deg, #33fbe8 0%, #a5f3f0 60%, #e0fffe 100%);
  border-radius: 22px 22px 0 0;
  flex-shrink: 0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 28px 8px;
  flex-shrink: 0;
}

.header-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #33fbe8;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.result-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.01em;
  flex: 1;
}

.round-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  background: rgba(17, 24, 39, 0.05);
  color: #111827;
  border-radius: 12px;
}

/* 중앙 포디움: 영웅 섹션 (비율 팽창) */
.podium-hero {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  padding: 16px 20px;
  flex: 1; /* 가용 공간을 차지하게 만들어 모바일 스크롤 줄임 */
  min-height: 200px;
}

/* ... existing podium styles ... */
.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 130px;
}

/* 포디움 위치 재조정 애니메이션 */
.podium-1st { z-index: 3; animation: slideUp 0.5s ease-out 0.1s both; }
.podium-2nd { z-index: 2; animation: slideUp 0.5s ease-out 0.3s both; }
.podium-3rd { z-index: 1; animation: slideUp 0.5s ease-out 0.5s both; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.avatar-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 12px;
}

.avatar {
  border-radius: 50%;
  object-fit: cover;
  background-color: #f3f4f6;
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.08);
  border: 4px solid #ffffff;
  position: relative;
  z-index: 2;
}

.podium-1st .avatar { width: 96px; height: 96px; border-width: 5px; }
.podium-2nd .avatar, .podium-3rd .avatar { width: 68px; height: 68px; }

.avatar-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: conic-gradient(#33fbe8, #ffffff, #33fbe8);
  animation: spin 4s linear infinite;
  z-index: 1;
}

.avatar-ring::after {
  content: '';
  position: absolute;
  inset: 4px;
  background: #ffffff;
  border-radius: 50%;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

.crown-icon {
  position: absolute;
  top: -24px;
  font-size: 1.5rem;
  color: #f59e0b;
  filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3));
  z-index: 3;
}

.medal {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  border: 3px solid #ffffff;
  color: #111827;
  z-index: 3;
}

.gold   { background: #fde68a; }
.silver { background: #e5e7eb; }
.bronze { background: #ffedd5; }

.name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 2px;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.podium-1st .name {
  font-size: 1.1rem;
  font-weight: 800;
}

.score {
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
  opacity: 0.6;
  margin: 0;
}

.podium-1st .score {
  font-size: 0.95rem;
  font-weight: 700;
  opacity: 0.8;
  color: #111827;
}

.stats-row {
  display: flex;
  align-items: stretch;
  margin: 16px 28px;
  background: rgba(51, 251, 232, 0.05);
  border: 1px solid rgba(51, 251, 232, 0.3);
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 10px;
}

.stat-icon {
  color: #0d9488;
  font-size: 1rem;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #111827;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #111827;
  opacity: 0.5;
}

.stat-divider {
  width: 1px;
  background: rgba(51, 251, 232, 0.3);
  margin: 16px 0;
}

/* 하단 영역 (모바일 잘림 방지를 보호하기 위해 flex-shrink 0 및 패딩 최적화) */
.footer-action {
  padding: 16px 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-shrink: 0;
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* 다시하기 (Ghost-like neutral btn) */
.btn-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 1.5px solid rgba(17, 24, 39, 0.1);
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  color: #111827;
  background: #ffffff;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-ghost:hover {
  background: rgba(17, 24, 39, 0.03);
  border-color: rgba(17, 24, 39, 0.2);
  transform: translateY(-1px);
}

/* 나가기 (Primary Brand btn) */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.95rem;
  color: #111827; /* Strictly Black on Mint */
  background: linear-gradient(135deg, #33fbe8 0%, #67fdf2 100%);
  box-shadow: 0 4px 14px rgba(51, 251, 232, 0.32);
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 20px rgba(51, 251, 232, 0.42);
}

/* 오토 엑싯 로딩 바 */
.auto-exit-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(17, 24, 39, 0.05); /* very light black */
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #33fbe8; /* Brand color */
  border-radius: 2px;
  transition: width 1s linear;
}

.auto-exit-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: #111827;
  opacity: 0.5; /* strictly black with opacity */
}

/* 애니메이션 */
@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes card-in { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

/* 모바일 분기 반응형 */
@media (max-width: 480px) {
  .result-content { border-radius: 20px; }
  .result-header { padding: 20px 20px 8px; }
  .stats-row { margin: 12px 20px; padding: 4px 0; }
  .footer-action { padding: 16px 20px 24px; }
  
  /* 작아지면 상하(열) 구조로 버튼 변환 */
  .action-row { grid-template-columns: 1fr; }
  
  .podium-hero { padding: 20px 10px 12px; gap: 8px; }
  .podium-1st .avatar { width: 80px; height: 80px; }
  .podium-2nd .avatar, .podium-3rd .avatar { width: 56px; height: 56px; }
}
</style>
