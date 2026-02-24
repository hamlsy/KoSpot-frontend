<template>
  <div v-if="show" class="result-overlay">
    <div class="result-content">
      <h2>공유 게임 결과</h2>

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

      <div class="delta-box">
        <p>
          점수 비교:
          <strong>{{ scoreDeltaText }}</strong>
        </p>
      </div>

      <ResultMapSection
        :currentLocation="currentLocation"
        :guessedLocation="guessedLocation"
        :markerImageUrl="markerImageUrl"
      />

      <div class="cta-box">
        <p>더 많은 기능을 이용하려면 로그인해 주세요.</p>
        <button class="login-btn" @click="$emit('login')">로그인 하러가기</button>
      </div>

      <div class="result-buttons">
        <button class="restart-btn" @click="$emit('restart')">다시하기</button>
        <button class="exit-btn" @click="$emit('exit')">종료하기</button>
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
  emits: ["restart", "exit", "login"],
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
    scoreDeltaText() {
      const delta = this.myScore - this.sharerScore;
      if (delta === 0) {
        return "동점";
      }
      return delta > 0 ? `내가 ${delta}점 높음` : `${Math.abs(delta)}점 낮음`;
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
  backdrop-filter: blur(4px);
}

.result-content {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.28);
  padding: 26px;
  width: 92%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
}

h2 {
  margin: 0 0 14px;
  color: #111827;
  text-align: center;
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
  background: #f0f9ff;
  border: 1px solid #93c5fd;
  text-align: center;
}

.cta-box p {
  margin: 0 0 10px;
  color: #111827;
}

.login-btn {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: #ffffff;
  font-weight: 700;
  padding: 10px 14px;
  cursor: pointer;
}

.result-buttons {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.restart-btn,
.exit-btn {
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-weight: 700;
  padding: 11px;
  cursor: pointer;
}

.restart-btn {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.exit-btn {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

@media (max-width: 768px) {
  .comparison-grid,
  .result-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
