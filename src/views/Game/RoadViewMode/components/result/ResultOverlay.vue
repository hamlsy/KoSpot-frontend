<template>
  <div v-if="show" class="result-overlay">
    <div class="result-container">
      <div class="result-header">
        <h2>라운드 결과</h2>
      </div>

      <div class="result-content">
        <div class="result-score-section">
          <div class="score-display">
            <div class="score-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="score-label">점수</div>
            <div class="score-value">{{ score }}</div>
          </div>

          <div class="distance-display">
            <div class="distance-icon">
              <i class="fas fa-ruler"></i>
            </div>
            <div class="distance-label">거리</div>
            <div class="distance-value">{{ formattedDistance }}</div>
          </div>

          <div class="rank-points-display">
            <div class="rank-icon">
              <i class="fas fa-trophy"></i>
            </div>
            <div class="rank-points-label">랭크 포인트</div>
            <div
              class="rank-points-value"
              :class="{
                'points-increase': rankPointChange > 0,
                'points-decrease': rankPointChange < 0,
              }"
            >
              <span class="current-points">{{ currentRankPoints }}</span>
              <span v-if="rankPointChange !== 0" class="points-change">
                {{ rankPointChange > 0 ? "+" : "" }}{{ rankPointChange }}
              </span>
            </div>
          </div>
        </div>

        <ResultMapSection 
          :currentLocation="currentLocation"
          :guessedLocation="guessedLocation"
          :locationDescription="locationDescription"
        />
      </div>

      <div class="result-actions">
        <button class="btn-restart" @click="onRestart">
          <i class="fas fa-redo"></i> 다시하기
        </button>
        <button class="btn-exit" @click="onExit">
          <i class="fas fa-door-open"></i> 나가기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ResultMapSection from './ResultMapSection.vue';

export default {
  name: "ResultOverlay",
  components: {
    ResultMapSection
  },
  props: {
    show: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    },
    distance: {
      type: Number,
      default: 0
    },
    currentRankPoints: {
      type: Number,
      default: 0
    },
    rankPointChange: {
      type: Number,
      default: 0
    },
    currentLocation: {
      type: Object,
      default: null
    },
    guessedLocation: {
      type: Object,
      default: null
    },
    locationDescription: {
      type: String,
      default: ""
    }
  },

  computed: {
    formattedDistance() {
      if (this.distance === null || this.distance === undefined) return "알 수 없음";

      if (this.distance < 1) {
        // 1km 미만은 m 단위로 표시
        return `${Math.round(this.distance * 1000)} m`;
      } else {
        // 1km 이상은 소수점 두 자리까지 표시
        return `${this.distance.toFixed(2)} km`;
      }
    }
  },
  methods: {
    onRestart() {
      this.$emit('restart');
    },
    onExit() {
      this.$emit('exit');
    }
  }
};
</script>

<style scoped>
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 30;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.result-container {
  background-color: white;
  border-radius: 20px;
  width: 90%;
  max-width: 650px;
  height: auto;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-header {
  padding: 20px 25px;
  background: linear-gradient(135deg, #3498db, #1abc9c);
  color: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.result-header h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.result-content {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  overflow-y: auto;
}

.result-score-section {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}

.score-display,
.distance-display,
.rank-points-display {
  flex: 1;
  min-width: 120px;
  background-color: #fff;
  border-radius: 16px;
  padding: 20px 15px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 호버 효과 제거 */

/* 상단 그라데이션 바 간소화 */
.score-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #f39c12;
}

.distance-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #2980b9;
}

.rank-points-display::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #8e44ad;
}

.score-icon,
.distance-icon,
.rank-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-size: 1.2rem;
  color: white;
}

.score-icon {
  background: #f39c12;
}

.distance-icon {
  background: #2980b9;
}

.rank-icon {
  background: #8e44ad;
}

.score-label,
.distance-label,
.rank-points-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 8px;
  font-weight: 500;
}

.score-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
}

.distance-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
}

.rank-points-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
}

.points-increase {
  color: #27ae60;
}

.points-increase .points-change {
  display: inline-block;
  animation: bounceUp 1s ease;
}

@keyframes bounceUp {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.points-decrease {
  color: #e74c3c;
}

.points-decrease .points-change {
  display: inline-block;
  animation: bounceDown 1s ease;
}

@keyframes bounceDown {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(10px);
  }
  60% {
    transform: translateY(5px);
  }
}

/* Removed countUp animation */

.points-change {
  font-size: 1.1rem;
  font-weight: normal;
  margin-left: 8px;
  display: inline-block;
}

.result-actions {
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid #f1f1f1;
  background-color: #f8f9fa;
  border-radius: 0 0 20px 20px;
}

.btn-restart,
.btn-exit {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
}

.btn-restart {
  background: #2980b9;
  color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.btn-restart:hover {
  background: linear-gradient(135deg, #2980b9, #2471a3);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.4);
}

.btn-restart:active {
  transform: translateY(-1px);
}

.btn-exit {
  background: #e0e0e0;
  color: #333;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn-exit:hover {
  background: linear-gradient(135deg, #e0e0e0, #d0d0d0);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.btn-exit:active {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .result-score-section {
    flex-direction: column;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .result-header {
    padding: 15px 20px;
  }
  
  .result-header h2 {
    font-size: 1.4rem;
  }
  
  .result-content {
    padding: 20px;
  }
  
  .result-actions {
    padding: 15px 20px;
    flex-direction: column;
  }
  
  .btn-restart, 
  .btn-exit {
    padding: 12px;
  }
}
</style>
