<template>
  <div v-if="show" class="result-overlay">
    <div class="result-content" ref="resultContent">
      <!-- 브랜드 포인트 바 -->
      <div class="brand-bar"></div>

      <!-- 헤더: 컴팩트, 타이틀만 -->
      <div class="result-header">
        <i class="fas fa-flag-checkered header-icon-inline"></i>
        <span class="result-title">공유 게임 결과</span>
      </div>

      <!-- 승패 감정 앵커 — 게임 결과의 핵심 -->
      <div class="outcome-hero" :class="`outcome-${comparisonOutcome}`">
        <div class="outcome-icon-wrap">
          <i :class="outcomeIcon" class="outcome-icon"></i>
        </div>
        <p class="outcome-label-text">{{ outcomeLabel }}</p>
        <p class="outcome-message-text">{{ outcomeMessage }}</p>
        <div v-if="scoreDeltaAbs > 0" class="outcome-delta-badge">
          {{ scoreDeltaAbs }}점 차이
        </div>
      </div>

      <!-- VS 점수 비교 — 명확한 시각 대비 -->
      <div class="comparison-section">
        <!-- 공유자 카드 -->
        <div class="compare-card">
          <p class="card-name">{{ sharerNickname }}</p>
          <p class="card-score-number">{{ sharerScore }}</p>
          <p class="card-score-unit">점</p>

          <div class="card-meta-list">
            <div class="meta-badge">
              <i class="fas fa-stopwatch"></i> {{ formatPlaytime(sharerPlaytime) }}
            </div>
            <div class="meta-badge">
              <i class="fas fa-lightbulb"></i> 힌트 {{ sharerHintsUsed }}회
            </div>
          </div>
        </div>

        <!-- VS 중간 구분 -->
        <div class="vs-col">
          <span class="vs-text">VS</span>
        </div>

        <!-- 내 카드 (민트 강조) -->
        <div class="compare-card compare-card--me">
          <p class="card-name">나</p>
          <p class="card-score-number card-score-number--me">{{ myScore }}</p>
          <p class="card-score-unit">점</p>

          <div class="card-meta-list">
            <div class="meta-badge meta-badge--me">
              <i class="fas fa-stopwatch"></i> {{ formatPlaytime(myPlaytime) }}
            </div>
            <div class="meta-badge meta-badge--me">
              <i class="fas fa-lightbulb"></i> 힌트 {{ myHintsUsed }}회
            </div>
          </div>
        </div>
      </div>

      <!-- 지도 -->
      <div class="map-wrapper" :class="{ 'map-expanded': isMapExpanded }">
        <ResultMapSection :currentLocation="currentLocation" :guessedLocation="guessedLocation"
          :markerImageUrl="markerImageUrl" :isExpanded="isMapExpanded"
          @toggle-expand="isMapExpanded = !isMapExpanded" />
      </div>

      <!-- 로그인 CTA -->
      <div class="cta-section">
        <div class="cta-text-row">
          <i class="fas fa-lock cta-lock-icon"></i>
          <p class="cta-copy">로그인하면 랭킹·통계·기록 저장이 가능해요</p>
        </div>
        <button class="btn-login" type="button" @click="$emit('login')">
          <i class="fas fa-sign-in-alt"></i>
          로그인하고 더 플레이하기
        </button>
      </div>

      <!-- 결과 이미지 액션 (복사·저장·공유) -->
      <ResultImageActions :fileName="'kospot-shared-result'" :shareTitle="'KoSpot 공유 게임 결과'"
        :shareText="`나: ${myScore}점 vs ${sharerNickname}: ${sharerScore}점 | KoSpot에서 도전해보세요!`"
        :currentLocation="currentLocation" :guessedLocation="guessedLocation" :myScore="myScore"
        :sharerScore="sharerScore" :sharerNickname="sharerNickname" :comparisonOutcome="comparisonOutcome"
        :myPlaytime="myPlaytime" :myHintsUsed="myHintsUsed" :sharerPlaytime="sharerPlaytime"
        :sharerHintsUsed="sharerHintsUsed" :poiName="poiName" :fullAddress="fullAddress" @toast="onImageActionToast" />

      <!-- 다시하기 버튼 -->
      <div class="footer-action">
        <button class="btn-restart" type="button" @click="$emit('restart')">
          <i class="fas fa-redo-alt"></i>
          다시하기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ResultMapSection from "src/features/game/single/roadview/components/Result/ResultMapSection.vue";
import ResultImageActions from "./ResultImageActions.vue";

export default {
  name: "SharedPracticeResultOverlay",
  components: {
    ResultMapSection,
    ResultImageActions,
  },
  emits: ["restart", "login", "toast"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    sharerNickname: {
      type: String,
      default: "공유 플레이어",
    },
    sharerScore: {
      type: Number,
      default: 0,
    },
    sharerHintsUsed: {
      type: Number,
      default: 0,
    },
    sharerPlaytime: {
      type: Number,
      default: 0,
    },
    myScore: {
      type: Number,
      default: 0,
    },
    myHintsUsed: {
      type: Number,
      default: 0,
    },
    myPlaytime: {
      type: Number,
      default: 0,
    },
    currentLocation: {
      type: Object,
      default: null,
    },
    guessedLocation: {
      type: Object,
      default: null,
    },
    markerImageUrl: {
      type: String,
      default: null,
    },
    poiName: {
      type: String,
      default: null,
    },
    fullAddress: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      isMapExpanded: false,
    };
  },
  computed: {
    comparisonOutcome() {
      const delta = Number((this.myScore - this.sharerScore).toFixed(2));
      if (delta === 0) return "tie";
      return delta > 0 ? "win" : "lose";
    },
    scoreDeltaAbs() {
      return Number(Math.abs(this.myScore - this.sharerScore).toFixed(2));
    },
    outcomeLabel() {
      if (this.comparisonOutcome === "win") return "승리!";
      if (this.comparisonOutcome === "tie") return "무승부";
      return "아쉽게 패배";
    },
    outcomeMessage() {
      if (this.comparisonOutcome === "win")
        return "축하합니다! 공유 게임에서 이겼어요 🎉";
      if (this.comparisonOutcome === "tie") return "거의 같은 실력이에요!";
      return "다음엔 꼭 역전해보세요!";
    },
    outcomeIcon() {
      if (this.comparisonOutcome === "win") return "fas fa-trophy";
      if (this.comparisonOutcome === "tie") return "fas fa-equals";
      return "fas fa-redo";
    },
  },
  methods: {
    formatPlaytime(ms) {
      if (!ms || ms === 0) return "00:00.00";
      const totalSeconds = ms / 1000;
      const mins = Math.floor(totalSeconds / 60);
      const secs = Math.floor(totalSeconds % 60);
      const fract = Math.floor((ms % 1000) / 10);
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}.${fract.toString().padStart(2, "0")}`;
    },
    onImageActionToast(message, duration) {
      this.$emit('toast', message, duration);
    },
  },
};
</script>

<style scoped>
/* ═══════════════════════════════════════
   오버레이 배경
═══════════════════════════════════════ */
.result-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(17, 24, 39, 0.78);
  z-index: 25;
  backdrop-filter: blur(5px);
  animation: overlay-in 200ms ease;
}

/* ═══════════════════════════════════════
   결과 카드
═══════════════════════════════════════ */
.result-content {
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 20px 48px rgba(0, 0, 0, 0.18);
  width: 92%;
  max-width: 520px;
  max-height: 92vh;
  overflow-y: auto;
  overflow-x: hidden;
  animation: card-in 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* ═══════════════════════════════════════
   브랜드 포인트 바
═══════════════════════════════════════ */
.brand-bar {
  height: 5px;
  background: linear-gradient(90deg, #33fbe8 0%, #a5f3f0 60%, #e0fffe 100%);
  border-radius: 22px 22px 0 0;
}

/* ═══════════════════════════════════════
   헤더 — 최소화, 컨텍스트만 제공
═══════════════════════════════════════ */
.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 22px 0;
}

.header-icon-inline {
  font-size: 0.82rem;
  color: #33fbe8;
  filter: drop-shadow(0 0 3px rgba(51, 251, 232, 0.5));
}

.result-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: 0.02em;
}

/* ═══════════════════════════════════════
   승패 감정 앵커 — 게임 결과의 핵심 요소
═══════════════════════════════════════ */
.outcome-hero {
  margin: 14px 22px;
  border-radius: 18px;
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  border: 1.5px solid transparent;
  animation: hero-in 320ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both;
}

/* 승리 */
.outcome-win {
  background: linear-gradient(160deg, #f0fffe 0%, #e8fffe 100%);
  border-color: #33fbe8;
}

/* 무승부 */
.outcome-tie {
  background: #f8fafc;
  border-color: #e5e7eb;
}

/* 패배 */
.outcome-lose {
  background: linear-gradient(160deg, #fffbeb 0%, #fef9e7 100%);
  border-color: #fde68a;
}

.outcome-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.outcome-win .outcome-icon-wrap {
  background: rgba(51, 251, 232, 0.15);
}

.outcome-tie .outcome-icon-wrap {
  background: #f3f4f6;
}

.outcome-lose .outcome-icon-wrap {
  background: rgba(245, 158, 11, 0.12);
}

.outcome-icon {
  font-size: 1.4rem;
}

.outcome-win .outcome-icon {
  color: #0d9488;
}

.outcome-tie .outcome-icon {
  color: #6b7280;
}

.outcome-lose .outcome-icon {
  color: #d97706;
}

.outcome-label-text {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.outcome-message-text {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.outcome-delta-badge {
  margin-top: 4px;
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #111827;
  background: rgba(0, 0, 0, 0.06);
}

/* ═══════════════════════════════════════
   VS 점수 비교 — 핵심 게임 데이터
═══════════════════════════════════════ */
.comparison-section {
  display: grid;
  grid-template-columns: 1fr 36px 1fr;
  align-items: center;
  gap: 0;
  margin: 0 22px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.compare-card {
  padding: 16px 12px;
  text-align: center;
  background: #f8fafc;
}

/* 내 카드: 브랜드 민트 테마 */
.compare-card--me {
  background: #f0fffe;
  border-left: 1px solid #e5e7eb;
}

.vs-col {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  align-self: stretch;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.vs-text {
  font-size: 0.7rem;
  font-weight: 800;
  color: #d1d5db;
  letter-spacing: 0.05em;
}

.card-name {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-score-number {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

/* 내 점수: 민트 강조 */
.card-score-number--me {
  color: #0d9488;
}

.card-score-unit {
  margin: 2px 0 8px;
  font-size: 0.78rem;
  font-weight: 500;
  color: #9ca3af;
}

.card-meta-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  margin-top: 4px;
}

.meta-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: #6b7280;
  background: white;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  width: max-content;
}

.meta-badge i {
  color: #9ca3af;
  font-size: 0.75rem;
  width: 12px;
  text-align: center;
}

/* 내 카드 메타 뱃지 */
.meta-badge--me {
  background: #ffffff;
  border-color: #b2f5f0;
  color: #0f766e;
}

.meta-badge--me i {
  color: #0d9488;
}

/* ═══════════════════════════════════════
   지도 래퍼
═══════════════════════════════════════ */
.map-wrapper {
  margin: 0 22px 16px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  background: white;
}

/* 지도 확장 상태 */
.map-expanded {
  position: absolute;
  top: 15px;
  left: 15px;
  right: 15px;
  bottom: 15px;
  z-index: 50;
  margin: 0 !important;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.map-expanded :deep(.result-map-section) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.map-expanded :deep(.result-map-container) {
  flex: 1;
  height: 100% !important;
  /* 모바일 대응 높이 무시 */
}

/* ═══════════════════════════════════════
   로그인 CTA 섹션
═══════════════════════════════════════ */
.cta-section {
  margin: 0 22px 10px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.cta-text-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.cta-lock-icon {
  font-size: 0.8rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.cta-copy {
  margin: 0;
  font-size: 0.78rem;
  color: #6b7280;
  font-weight: 500;
}

/* 로그인 버튼 — 브랜드 민트 PRIMARY */
.btn-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 16px;
  border: none;
  background: linear-gradient(135deg, #33fbe8 0%, #67fdf2 100%);
  color: #111827;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(51, 251, 232, 0.28);
  transition: opacity 0.18s ease, box-shadow 0.18s ease;
}

.btn-login:hover {
  opacity: 0.88;
  box-shadow: 0 5px 16px rgba(51, 251, 232, 0.38);
}

/* ═══════════════════════════════════════
   하단 다시하기 버튼 — 보조 액션
═══════════════════════════════════════ */
.footer-action {
  padding: 0 22px 22px;
}

.btn-restart {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 13px;
  background: #ffffff;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.btn-restart:hover {
  border-color: #9ca3af;
  color: #374151;
  transform: translateY(-1px);
}

.btn-login:focus-visible,
.btn-restart:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}

/* ═══════════════════════════════════════
   반응형
═══════════════════════════════════════ */
@media (max-width: 420px) {
  .outcome-label-text {
    font-size: 1.1rem;
  }

  .card-score-number {
    font-size: 1.6rem;
  }
}

@media (max-height: 850px) {
  .result-header {
    padding: 10px 22px 0;
  }

  .outcome-hero {
    margin: 10px 22px;
    padding: 12px 16px 10px;
  }

  .outcome-icon-wrap {
    width: 42px;
    height: 42px;
  }

  .outcome-icon {
    font-size: 1.1rem;
  }

  .outcome-label-text {
    font-size: 1.1rem;
  }

  .comparison-section {
    margin: 0 22px 10px;
  }

  .compare-card {
    padding: 8px;
  }

  .card-score-number {
    font-size: 1.6rem;
  }

  .map-wrapper {
    margin: 0 22px 10px;
  }

  .map-wrapper :deep(.result-map-container) {
    height: 140px;
  }

  .cta-section {
    margin: 0 22px 10px;
  }

  .cta-text-row {
    padding: 6px 14px;
  }

  .btn-login {
    padding: 10px 16px;
    font-size: 0.85rem;
  }

  .footer-action {
    padding: 0 22px 10px;
  }

  .btn-restart {
    padding: 10px;
  }
}

@media (max-height: 700px) {
  .result-header {
    padding: 6px 22px 0;
  }

  .outcome-hero {
    margin: 6px 22px;
    padding: 8px 16px;
  }

  .comparison-section {
    margin: 0 22px 6px;
  }

  .card-score-number {
    font-size: 1.4rem;
  }

  .meta-badge {
    font-size: 0.65rem;
    padding: 2px 6px;
  }

  .map-wrapper {
    margin: 0 22px 6px;
  }

  .map-wrapper :deep(.result-map-container) {
    height: 100px;
  }

  .cta-section {
    margin: 0 22px 6px;
  }

  .cta-copy {
    font-size: 0.7rem;
  }

  .btn-login,
  .btn-restart {
    padding: 8px;
    font-size: 0.8rem;
  }

  .footer-action {
    padding: 0 22px 8px;
  }
}

/* ═══════════════════════════════════════
   애니메이션
═══════════════════════════════════════ */
@keyframes overlay-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes hero-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {

  .result-overlay,
  .result-content,
  .outcome-hero {
    animation: none;
  }

  .btn-login,
  .btn-restart {
    transition: none;
    transform: none;
  }
}
</style>
