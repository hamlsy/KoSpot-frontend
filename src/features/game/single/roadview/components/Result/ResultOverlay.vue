<template>
  <div v-if="show" class="result-overlay">
    <div class="result-container">
      <div class="result-header">
        <h2>라운드 결과</h2>
      </div>

      <div class="result-content">
        <div class="content-grid">
          <!-- 좌측: 점수 및 통계 -->
          <div class="left-section">
            <!-- 티어 변화 섹션 (티어가 변경된 경우에만 표시) -->
            <transition name="rank-change-fade">
              <div v-if="hasRankChange" class="rank-change-section compact">
                <div class="rank-change-header">
                  <i class="fas fa-medal"></i>
                  <span>랭크 변화</span>
                </div>
                <div class="rank-change-content">
                  <div class="rank-badge previous">
                    <div class="rank-tier-icon" :class="getTierClass(previousRankTier)">
                      <i :class="getTierIcon(previousRankTier)"></i>
                    </div>
                    <div class="rank-text">
                      <div class="tier-name">{{ formatTier(previousRankTier) }}</div>
                      <div class="tier-level">{{ formatLevel(previousRankLevel) }}</div>
                    </div>
                  </div>
                  
                  <div class="rank-arrow">
                    <i class="fas fa-arrow-right"></i>
                  </div>
                  
                  <div class="rank-badge current">
                    <div class="rank-tier-icon" :class="getTierClass(currentRankTier)">
                      <i :class="getTierIcon(currentRankTier)"></i>
                    </div>
                    <div class="rank-text">
                      <div class="tier-name">{{ formatTier(currentRankTier) }}</div>
                      <div class="tier-level">{{ formatLevel(currentRankLevel) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>

            <div class="result-score-section compact">
          <div class="score-display">
            <div class="score-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="score-label">점수</div>
                <div class="score-value">{{ score.toFixed(1) }}</div>
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
                <div class="rank-points-label">레이팅 점수</div>
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
          </div>

          <!-- 우측: 지도 및 위치 정보 -->
          <div class="right-section">
            <!-- POI 이름 -->
            <div v-if="poiName" class="poi-name-section">
              <div class="poi-icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <div class="poi-text">
                <div class="poi-label">정답 위치</div>
                <div class="poi-name">{{ poiName }}</div>
          </div>
        </div>

        <ResultMapSection
          :currentLocation="currentLocation"
          :guessedLocation="guessedLocation"
          :locationDescription="locationDescription"
        />
          </div>
        </div>
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
import ResultMapSection from "./ResultMapSection.vue";

export default {
  name: "ResultOverlay",
  components: {
    ResultMapSection,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
    },
    distance: {
      type: Number,
      default: 0,
    },
    currentRankPoints: {
      type: Number,
      default: 0,
    },
    rankPointChange: {
      type: Number,
      default: 0,
    },
    previousRatingScore: {
      type: Number,
      default: 0,
    },
    currentRatingScore: {
      type: Number,
      default: 0,
    },
    previousRankTier: {
      type: String,
      default: null,
    },
    previousRankLevel: {
      type: String,
      default: null,
    },
    currentRankTier: {
      type: String,
      default: null,
    },
    currentRankLevel: {
      type: String,
      default: null,
    },
    currentLocation: {
      type: Object,
      default: null,
    },
    guessedLocation: {
      type: Object,
      default: null,
    },
    locationDescription: {
      type: String,
      default: "",
    },
    poiName: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      options: {
        duration: 1.1,
        useEasing: true,
        useGrouping: true,
        separator: ",",
        suffix: "KM",
        decimal: ".",
        decimalPlaces: 3,
      },
    };
  },

  computed: {
    formattedDistance() {
      if (this.distance === null || this.distance === undefined)
        return "알 수 없음";

      if (this.distance < 1) {
        // 1km 미만은 m 단위로 표시
        return `${Math.round(this.distance * 1000)} m`;
      } else {
        // 1km 이상은 소수점 두 자리까지 표시
        return `${this.distance.toFixed(2)} km`;
      }
    },
    hasRankChange() {
      return this.previousRankTier && this.currentRankTier &&
             (this.previousRankTier !== this.currentRankTier ||
              this.previousRankLevel !== this.currentRankLevel);
    },
  },
  watch: {
    show(newVal) {
      if (newVal && this.previousRankTier && this.currentRankTier) {
        console.log('🏆 랭크 게임 결과 정보:', {
          점수: this.score,
          이전레이팅: this.previousRatingScore,
          현재레이팅: this.currentRatingScore,
          레이팅변화: this.rankPointChange,
          이전랭크: `${this.previousRankTier} ${this.previousRankLevel}`,
          현재랭크: `${this.currentRankTier} ${this.currentRankLevel}`,
          랭크변화여부: this.hasRankChange
        });
      }
    }
  },
  methods: {
    onRestart() {
      this.$emit("restart");
    },
    onExit() {
      this.$emit("exit");
    },
    // 티어 이름 포맷팅 (영어 -> 한글)
    formatTier(tier) {
      const tierMap = {
        BRONZE: '브론즈',
        SILVER: '실버',
        GOLD: '골드',
        PLATINUM: '플래티넘',
        DIAMOND: '다이아몬드',
        MASTER: '마스터'
      };
      return tierMap[tier] || tier;
    },
    // 레벨 포맷팅 (영어 -> 숫자)
    formatLevel(level) {
      const levelMap = {
        ONE: 'I',
        TWO: 'II',
        THREE: 'III',
        FOUR: 'IV',
        FIVE: 'V'
      };
      return levelMap[level] || level;
    },
    // 티어별 CSS 클래스
    getTierClass(tier) {
      if (!tier) return '';
      return `tier-${tier.toLowerCase()}`;
    },
    // 티어별 아이콘
    getTierIcon(tier) {
      const iconMap = {
        BRONZE: 'fas fa-award',
        SILVER: 'fas fa-medal',
        GOLD: 'fas fa-trophy',
        PLATINUM: 'fas fa-gem',
        DIAMOND: 'fas fa-crown',
        MASTER: 'fas fa-star'
      };
      return iconMap[tier] || 'fas fa-trophy';
    }
  },
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
  width: 95%;
  max-width: 1000px;
  max-height: 90vh;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  overflow: hidden;
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
  background: white;
  color: #0f172a;
  border-radius: 20px 20px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #e2e8f0;
}

.result-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.result-content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 20px;
  height: 100%;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 0;
}

/* POI 이름 섹션 */
.poi-name-section {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.poi-icon {
  width: 45px;
  height: 45px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  flex-shrink: 0;
}

.poi-text {
  flex: 1;
}

.poi-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.poi-name {
  font-size: 1.4rem;
  color: #0f172a;
  font-weight: 700;
  letter-spacing: -0.3px;
}

/* 티어 변화 섹션 */
.rank-change-section {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 15px;
}

.rank-change-section.compact {
  padding: 12px 15px;
}

.rank-change-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 12px;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rank-change-header i {
  font-size: 1rem;
  color: #3b82f6;
}

.rank-change-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.rank-badge {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 130px;
  transition: all 0.3s ease;
}

.rank-badge.previous {
  opacity: 0.7;
  border-color: #cbd5e1;
}

.rank-badge.current {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.rank-tier-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

/* 티어별 색상 */
.tier-bronze {
  background: #92400e;
}

.tier-silver {
  background: #64748b;
}

.tier-gold {
  background: #ca8a04;
}

.tier-platinum {
  background: #0891b2;
}

.tier-diamond {
  background: #0ea5e9;
}

.tier-master {
  background: #dc2626;
}

.rank-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tier-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.tier-level {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.rank-arrow {
  color: #94a3b8;
  font-size: 1.5rem;
  flex-shrink: 0;
}

/* 티어 변화 페이드 애니메이션 */
.rank-change-fade-enter-active {
  animation: rankChangeFadeIn 0.8s ease-out;
}

.rank-change-fade-leave-active {
  animation: rankChangeFadeOut 0.4s ease-in;
}

@keyframes rankChangeFadeIn {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  50% {
    transform: translateY(5px) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes rankChangeFadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.result-score-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-score-section.compact {
  gap: 10px;
}

.score-display,
.distance-display,
.rank-points-display {
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-score-section.compact .score-display,
.result-score-section.compact .distance-display,
.result-score-section.compact .rank-points-display {
  padding: 10px 12px;
}

.score-icon,
.distance-icon,
.rank-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.score-icon {
  background: #3b82f6;
}

.distance-icon {
  background: #10b981;
}

.rank-icon {
  background: #8b5cf6;
}

.score-label,
.distance-label,
.rank-points-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  flex: 1;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.score-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin-left: auto;
}

.distance-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin-left: auto;
}

.rank-points-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.points-increase {
  color: #0f172a;
}

.points-decrease {
  color: #0f172a;
}

.points-change {
  font-size: 1rem;
  font-weight: 600;
  display: inline-block;
}

.points-increase .points-change {
  color: #10b981;
}

.points-decrease .points-change {
  color: #ef4444;
}

.result-actions {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  gap: 15px;
  border-top: 2px solid #e2e8f0;
  background-color: white;
  border-radius: 0 0 20px 20px;
}

.btn-restart,
.btn-exit {
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  font-size: 0.95rem;
}

.btn-restart {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-restart:hover {
  background: #2563eb;
  border-color: #2563eb;
  transform: translateY(-1px);
}

.btn-restart:active {
  transform: translateY(0);
}

.btn-exit {
  background: white;
  color: #64748b;
  border-color: #e2e8f0;
}

.btn-exit:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #cbd5e1;
}

.btn-exit:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .rank-change-content {
    flex-direction: column;
    gap: 12px;
  }

  .rank-arrow {
    transform: rotate(90deg);
  }
}

@media (max-width: 480px) {
  .result-container {
    width: 98%;
  }

  .result-header {
    padding: 12px 15px;
  }

  .result-header h2 {
    font-size: 1.3rem;
  }

  .result-content {
    padding: 15px;
  }

  .result-actions {
    padding: 12px 15px;
    flex-direction: column;
    gap: 10px;
  }

  .btn-restart,
  .btn-exit {
    padding: 10px;
    font-size: 0.9rem;
  }

  .rank-change-section {
    padding: 12px;
  }

  .rank-badge {
    min-width: 100px;
    padding: 10px 12px;
  }

  .rank-tier-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .tier-name {
    font-size: 0.85rem;
  }

  .tier-level {
    font-size: 0.7rem;
  }

  .poi-name-section {
    padding: 12px 15px;
  }

  .poi-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }

  .poi-name {
    font-size: 1.1rem;
  }

  .score-icon,
  .distance-icon,
  .rank-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .score-value,
  .distance-value,
  .rank-points-value {
    font-size: 1.2rem;
  }
}
</style>
