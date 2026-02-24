<template>
  <div v-if="show" class="result-overlay">
    <div class="result-content">
      <div class="result-header">
        <div class="header-icon">
          <i class="fas fa-flag-checkered"></i>
        </div>
        <h2>공유 게임 결과</h2>
        <p class="header-subtitle">친구와 점수를 비교해보세요</p>
      </div>

      <div class="outcome-banner" :class="`outcome-${comparisonOutcome}`">
        <p class="outcome-label">{{ outcomeLabel }}</p>
        <strong class="outcome-message">{{ outcomeMessage }}</strong>
        <p class="outcome-delta">점수 차이: {{ scoreDeltaAbs }}점</p>
      </div>

      <div class="comparison-grid">
        <div class="compare-card source">
          <p class="card-title">{{ sharerNickname }}</p>
          <p class="card-score">{{ sharerScore }}점</p>
          <p class="card-hint">힌트 사용 {{ sharerHintsUsed }}회</p>
        </div>

        <div class="compare-card mine">
          <p class="card-title">나</p>
          <p class="card-score">{{ myScore }}점</p>
          <p class="card-hint">힌트 사용 {{ myHintsUsed }}회</p>
        </div>
      </div>

      <ResultMapSection
        :currentLocation="currentLocation"
        :guessedLocation="guessedLocation"
        :markerImageUrl="markerImageUrl"
      />

      <div class="cta-box">
        <p class="cta-copy">더 많은 기능을 이용하려면 로그인해 주세요.</p>
        <button class="login-btn" type="button" @click="$emit('login')">로그인하고 더 플레이하기</button>
      </div>

      <div class="result-buttons">
        <button class="restart-btn" type="button" @click="$emit('restart')">다시하기</button>
      </div>
    </div>
  </div>
</template>

<script>
import ResultMapSection from "src/features/game/single/roadview/components/Result/ResultMapSection.vue";

export default {
  name: "SharedPracticeResultOverlay",
  components: {
    ResultMapSection,
  },
  emits: ["restart", "login"],
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
    myScore: {
      type: Number,
      default: 0,
    },
    myHintsUsed: {
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
  },
  computed: {
    comparisonOutcome() {
      const delta = this.myScore - this.sharerScore;
      if (delta === 0) {
        return "tie";
      }
      return delta > 0 ? "win" : "lose";
    },
    scoreDeltaAbs() {
      return Math.abs(this.myScore - this.sharerScore);
    },
    outcomeLabel() {
      if (this.comparisonOutcome === "win") {
        return "승리";
      }
      if (this.comparisonOutcome === "tie") {
        return "무승부";
      }
      return "재도전";
    },
    outcomeMessage() {
      if (this.comparisonOutcome === "win") {
        return "축하합니다! 공유 받은 게임에서 승리했어요!";
      }
      if (this.comparisonOutcome === "tie") {
        return "무승부입니다! 거의 같은 실력이에요.";
      }
      return "아쉽지만 다음 라운드에서 역전해보세요!";
    },
  },
};
</script>

<style scoped>
.result-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(17, 24, 39, 0.8);
  z-index: 25;
  backdrop-filter: blur(3px);
  animation: overlay-fade-in 240ms ease;
}

.result-content {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.2);
  padding: 24px;
  width: 92%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  animation: content-rise-in 280ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity;
}

.result-header {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  margin-bottom: 14px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
  background: #2563eb;
  color: #ffffff;
}

h2 {
  margin: 0;
  color: #111827;
  text-align: center;
}

.header-subtitle {
  margin: 6px 0 0;
  color: #1e3a8a;
  font-size: 0.88rem;
  font-weight: 600;
}

.outcome-banner {
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid transparent;
  text-align: center;
}

.outcome-win {
  background: #ecfdf5;
  border-color: #6ee7b7;
}

.outcome-tie {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.outcome-lose {
  background: #fff7ed;
  border-color: #fdba74;
}

.outcome-label {
  margin: 0;
  font-size: 0.78rem;
  color: #374151;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.outcome-message {
  display: block;
  margin-top: 4px;
  color: #111827;
}

.outcome-delta {
  margin: 4px 0 0;
  color: #4b5563;
  font-size: 0.86rem;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.compare-card {
  border-radius: 14px;
  padding: 14px;
}

.compare-card.source {
  background: #eff6ff;
  border: 1px solid #93c5fd;
}

.compare-card.mine {
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
}

.card-title {
  margin: 0;
  color: #111827;
  font-weight: 700;
}

.card-score {
  margin: 6px 0;
  font-size: 1.2rem;
  color: #111827;
  font-weight: 700;
}

.card-hint {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.delta-box {
  border-radius: 12px;
  padding: 12px;
  background: #f3f4f6;
  color: #111827;
  margin-bottom: 14px;
}

.delta-box p {
  margin: 0;
}

.cta-box {
  margin-top: 14px;
  border-radius: 14px;
  padding: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #93c5fd;
  text-align: center;
}

.cta-copy {
  margin: 0 0 10px;
  color: #111827;
  font-weight: 600;
}

.login-btn {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  color: #ffffff;
  font-weight: 700;
  padding: 12px 16px;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 8px 16px rgba(29, 78, 216, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(29, 78, 216, 0.33);
}

.login-btn:focus-visible,
.restart-btn:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}

.result-buttons {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.restart-btn {
  border: none;
  border-radius: 12px;
  color: #111827;
  font-weight: 700;
  padding: 11px;
  cursor: pointer;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

@media (max-width: 768px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .result-overlay,
  .result-content,
  .login-btn {
    animation: none;
    transition: none;
    transform: none;
  }
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes content-rise-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
