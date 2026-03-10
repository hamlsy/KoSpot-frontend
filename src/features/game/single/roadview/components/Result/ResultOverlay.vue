<template>
  <div v-if="show" class="result-overlay">
    <div class="result-container">
      <div class="result-header">
        <h2>라운드 결과</h2>
      </div>

      <div class="result-content">
        <div class="content-grid">
          <!-- 좌측: 플레이어 정보 및 통계 -->
          <div class="left-section">
            <!-- 플레이어 정보 -->
            <div class="player-info-section">
              <div class="player-avatar">
                <img 
                  v-if="markerImageUrl" 
                  :src="markerImageUrl" 
                  alt="마커"
                  @error="handleImageError"
                />
                <div v-else class="default-avatar">
                  <i class="fas fa-user"></i>
                </div>
              </div>
              <div class="player-details">
                <div class="player-label">플레이어</div>
                <div class="player-name">{{ userNickname }}</div>
              </div>
            </div>

            <!-- 티어 변화 섹션 -->
            <div class="rank-change-section compact" v-if="hasRankChange" :class="{ downgrade: isDowngrade }">
                <div class="rank-change-header">
                  <i :class="isDowngrade ? 'fas fa-arrow-down' : 'fas fa-arrow-up'"></i>
                  <span>{{ isDowngrade ? '랭크 하락' : '랭크 상승' }}</span>
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

            <div class="result-score-section compact">
              <div class="score-distance-row">
                <div class="score-display">
                  <div class="score-icon">
                    <i class="fas fa-star"></i>
                  </div>
                  <div class="score-label"> 점수</div>
                  <div class="score-value">{{ score.toFixed(1) }}</div>
                </div>

                <div class="distance-display">
                  <div class="distance-icon">
                    <i class="fas fa-ruler"></i>
                  </div>
                  <div class="distance-label"> 거리</div>
                  <div class="distance-value">{{ formattedDistance }}</div>
                </div>
              </div>

              <div class="rank-points-display">
                <div class="rank-icon">
                  <i class="fas fa-trophy"></i>
                </div>
                <div class="rank-points-label"> 레이팅 점수</div>
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
          <div class="right-section">
            <!-- POI 이름 -->
            <div v-if="poiName" class="poi-name-section">
              <div class="poi-icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <div class="poi-text">
                <div class="poi-label"> 정답 위치</div>
                <div class="poi-name">{{ poiName }}</div>
              </div>
            </div>

            <!-- 전체 주소 -->
            <div v-if="fullAddress" class="full-address-section">
              <div class="address-icon">
                <i class="fas fa-home"></i>
              </div>
              <div class="address-text">
                <div class="address-label">상세 주소</div>
                <div class="address-value">{{ fullAddress }}</div>
              </div>
            </div>

            <div class="map-wrapper" :class="{ 'map-expanded': isMapExpanded }">
              <ResultMapSection
                :currentLocation="currentLocation"
                :guessedLocation="guessedLocation"
                :locationDescription="locationDescription"
                :markerImageUrl="markerImageUrl"
                :isExpanded="isMapExpanded"
                @toggle-expand="isMapExpanded = !isMapExpanded"
              />
            </div>
          </div>
          

          <!-- 우측: 지도 및 위치 정보 -->
          
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
    fullAddress: {
      type: String,
      default: null,
    },
    markerImageUrl: {
      type: String,
      default: null,
    },
    userNickname: {
      type: String,
      default: "플레이어",
    },
  },
  data() {
    return {
      isMapExpanded: false,
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
    isDowngrade() {
      if (!this.hasRankChange) return false;

      const tierOrder = ['BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
      const prevTier = this.previousRankTier || '';
      const currTier = this.currentRankTier || '';

      if (prevTier && currTier && prevTier !== currTier) {
        return tierOrder.indexOf(currTier) < tierOrder.indexOf(prevTier);
      }

      // 같은 티어에서는 레벨 숫자 비교 (레벨 값이 로마숫자/문자일 수 있으므로 맵핑 시도)
      const levelMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, I: 1, II: 2, III: 3, IV: 4, V: 5 };
      const prevLevelNum = levelMap[this.previousRankLevel] ?? Number(this.previousRankLevel);
      const currLevelNum = levelMap[this.currentRankLevel] ?? Number(this.currentRankLevel);
      if (Number.isFinite(prevLevelNum) && Number.isFinite(currLevelNum)) {
        // 숫자가 클수록 하위 레벨로 가정 (예: 1이 상위, 5가 하위)
        return currLevelNum > prevLevelNum;
      }

      // 보조 판단: 포인트 감소면 하락으로 간주
      return (this.rankPointChange ?? 0) < 0;
    }
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
    // 이미지 로드 에러 처리
    handleImageError(event) {
      event.target.style.display = 'none';
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
  position: relative;
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

/* ═══════════════════════════════════════
   지도 래퍼 & 확장 상태
═══════════════════════════════════════ */
.map-wrapper {
  margin: 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  background: white;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 250px;
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
  height: 100% !important; /* 모바일 대응 높이 무시 */
}

/* 플레이어 정보 섹션 */
.player-info-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  padding: 12px 15px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideInFromTop 0.5s ease-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.player-avatar:hover {
  transform: scale(1.05);
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #cbd5e1;
  color: #64748b;
  font-size: 1.3rem;
}

.player-details {
  flex: 1;
}

.player-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-bottom: 2px;
}

.player-name {
  font-size: 1.1rem;
  color: #0f172a;
  font-weight: 700;
  letter-spacing: -0.3px;
}

/* POI 이름 섹션 */
.poi-name-section,
.full-address-section {
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border: 2px solid #93c5fd;
  padding: 14px 18px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideInFromRight 0.6s ease-out;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transition: all 0.3s ease;
}

.poi-name-section:hover,
.full-address-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.2);
}

.poi-icon,
.address-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  animation: subtlePulse 2s ease-in-out infinite;
}

@keyframes subtlePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.poi-text,
.address-text {
  flex: 1;
}

.poi-label,
.address-label {
  font-size: 0.75rem;
  color: #1e40af;
  margin-bottom: 2px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.poi-name {
  font-size: 1.2rem;
  color: #1e3a8a;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.address-value {
  font-size: 1rem;
  color: #1e3a8a;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1.4;
}

/* 티어 변화 섹션 */
.rank-change-section {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #fbbf24;
  border-radius: 12px;
  padding: 15px;
  animation: slideInFromLeft 0.6s ease-out 0.1s both;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.15);
  transition: all 0.3s ease;
}

.rank-change-section.compact {
  padding: 12px 15px;
}

.rank-change-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.2);
}

.rank-change-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #92400e;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 12px;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rank-change-header i {
  font-size: 1rem;
  color: #f59e0b;
  animation: subtleRotate 3s ease-in-out infinite;
}

@keyframes subtleRotate {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.rank-change-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: nowrap;
}

.rank-badge {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.rank-badge.previous {
  opacity: 0.7;
  border-color: #cbd5e1;
  transform: scale(0.95);
}

.rank-badge.current {
  border-color: #fbbf24;
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.25);
  animation: emphasize 0.6s ease-out 0.8s;
}

@keyframes emphasize {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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

/* 슬라이드 인 애니메이션들 */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.result-score-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-distance-row {
  display: flex;
  gap: 12px;
  align-items: stretch;
  flex-wrap: nowrap;
}

.score-distance-row > div {
  flex: 1 1 0;
  min-width: 0;
}

.result-score-section.compact {
  gap: 10px;
}

.score-display,
.distance-display,
.rank-points-display {
  background-color: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.score-display {
  animation: slideInFromLeft 0.5s ease-out 0.2s both;
}

.distance-display {
  animation: slideInFromLeft 0.5s ease-out 0.3s both;
}

.rank-points-display {
  animation: slideInFromLeft 0.5s ease-out 0.4s both;
}

.score-display:hover,
.distance-display:hover,
.rank-points-display:hover {
  transform: translateX(3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  transition: transform 0.3s ease;
}

.score-display:hover .score-icon,
.distance-display:hover .distance-icon,
.rank-points-display:hover .rank-icon {
  transform: rotate(5deg) scale(1.1);
}

.score-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.distance-icon {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}

.rank-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
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
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.distance-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin-left: auto;
  background: linear-gradient(135deg, #10b981 0%, #065f46 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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

.current-points {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  transition: all 0.3s ease;
  border: 2px solid transparent;
  font-size: 0.95rem;
  position: relative;
  overflow: hidden;
}


.btn-restart {
  background: white;
  color: #111827;
  border-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-restart:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-restart:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-restart i,
.btn-exit i {
  position: relative;
  z-index: 1;
}

.btn-restart span,
.btn-exit span {
  position: relative;
  z-index: 1;
}

.btn-exit {
  background: white;
  color: #111827;
  border-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-exit:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-exit:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 15px;
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

  .player-info-section {
    padding: 10px 12px;
  }

  .player-avatar {
    width: 45px;
    height: 45px;
  }

  .player-name {
    font-size: 1rem;
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

  .poi-name-section,
  .full-address-section {
    padding: 10px 14px;
  }

  .poi-icon,
  .address-icon {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }

  .poi-name {
    font-size: 1.05rem;
  }

  .address-value {
    font-size: 0.9rem;
  }

  .score-icon,
  .distance-icon,
  .rank-icon {
    width: 35px;
    height: 35px;
    font-size: 0.95rem;
  }

  .score-value,
  .distance-value,
  .rank-points-value {
    font-size: 1.2rem;
  }
}

/* Downgrade visual theme */
.rank-change-section.downgrade {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}
.rank-change-section.downgrade .rank-change-header {
  color: #475569;
}
.rank-change-section.downgrade .rank-change-header i {
  color: #64748b;
}
.rank-change-section.downgrade .rank-badge.current {
  border-color: #94a3b8;
  box-shadow: 0 4px 16px rgba(100, 116, 139, 0.2);
}
</style>
