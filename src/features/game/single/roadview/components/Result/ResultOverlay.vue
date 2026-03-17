<template>
  <div v-if="show" class="result-overlay">
    <div class="result-content" ref="resultContent">
      <!-- 브랜드 포인트 바 -->
      <div class="brand-bar"></div>

      <!-- 헤더: 좌측 정렬, 컴팩트 -->
      <div class="result-header">
        <div class="header-icon">
          <i class="fas fa-trophy"></i>
        </div>
        <span class="result-title">라운드 결과</span>
      </div>

      <!-- 점수 히어로 섹션: 정보 계층 최상위 -->
      <div class="score-hero">
        <div class="score-ring">
          <span class="score-number">{{ Number(score).toFixed(1) }}</span>
          <span class="score-unit">점</span>
        </div>
        <p class="score-caption">획득 점수</p>
        <p v-if="hasBonusScore" class="bonus-score-caption">
          시간 보너스 +{{ Number(bonusScore) }}점
        </p>
      </div>

      <!-- 보조 통계 행: 플레이어 + 거리 + 레이팅 점수 -->
      <div class="stats-row">
        <div class="stat-item" style="flex: 1.2;">
          <div class="stat-avatar">
            <img v-if="markerImageUrl" :src="markerImageUrl" @error="handleImageError" />
            <i v-else class="fas fa-user default-avatar-icon"></i>
          </div>
          <span class="stat-value player-name-val">{{ userNickname }}</span>
          <span class="stat-label">플레이어</span>
        </div>
        <div class="stat-divider"></div>
        
        <div class="stat-item">
          <i class="fas fa-ruler stat-icon"></i>
          <span class="stat-value">{{ formattedDistance }}</span>
          <span class="stat-label">떨어진 거리</span>
        </div>
        
        <div class="stat-divider"></div>
        
        <div class="stat-item" style="flex: 1.2;">
          <i class="fas fa-star stat-icon" style="color: #8b5cf6;"></i>
          <div style="display: flex; align-items: baseline; gap: 4px;">
            <span class="stat-value" style="color: #6d28d9;">{{ currentRankPoints }}</span>
            <span class="points-change" v-if="rankPointChange !== 0" :class="rankPointChange > 0 ? 'text-green' : 'text-red'">
              {{ rankPointChange > 0 ? '+' : '' }}{{ rankPointChange }}
            </span>
          </div>
          <span class="stat-label">레이팅 점수</span>
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

      <!-- 정답 위치 정보 -->
      <div v-if="poiName || fullAddress" class="location-section">
        <div class="location-section-header">
          <i class="fas fa-map-marker-alt"></i>
          <span>정답 위치</span>
        </div>
        <div class="location-body">
          <p v-if="poiName" class="location-poi">{{ poiName }}</p>
          <p v-if="fullAddress" class="location-address">{{ fullAddress }}</p>
        </div>
      </div>

      <!-- 지도 -->
      <div class="map-wrapper" :class="{ 'map-expanded': isMapExpanded }">
        <ResultMapSection :currentLocation="currentLocation" :guessedLocation="guessedLocation"
          :locationDescription="locationDescription"
          :markerImageUrl="markerImageUrl" :isExpanded="isMapExpanded"
          @toggle-expand="isMapExpanded = !isMapExpanded" />
      </div>

      <!-- 하단 버튼 행 -->
      <div class="action-row">
        <button class="btn-restart" type="button" @click="onRestart">
          <i class="fas fa-redo-alt"></i>
          다시하기
        </button>
        <button class="btn-exit" type="button" @click="onExit">
          나가기
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
    show: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    bonusScore: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    currentRankPoints: { type: Number, default: 0 },
    rankPointChange: { type: Number, default: 0 },
    previousRatingScore: { type: Number, default: 0 },
    currentRatingScore: { type: Number, default: 0 },
    previousRankTier: { type: String, default: null },
    previousRankLevel: { type: String, default: null },
    currentRankTier: { type: String, default: null },
    currentRankLevel: { type: String, default: null },
    currentLocation: { type: Object, default: null },
    guessedLocation: { type: Object, default: null },
    locationDescription: { type: String, default: "" },
    poiName: { type: String, default: null },
    fullAddress: { type: String, default: null },
    markerImageUrl: { type: String, default: null },
    userNickname: { type: String, default: "플레이어" },
  },
  data() {
    return {
      isMapExpanded: false,
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
    hasBonusScore() {
      return Number(this.bonusScore) > 0;
    },
    isDowngrade() {
      if (!this.hasRankChange) return false;

      const tierOrder = ['BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
      const prevTier = this.previousRankTier || '';
      const currTier = this.currentRankTier || '';

      if (prevTier && currTier && prevTier !== currTier) {
        return tierOrder.indexOf(currTier) < tierOrder.indexOf(prevTier);
      }

      const levelMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, I: 1, II: 2, III: 3, IV: 4, V: 5 };
      const prevLevelNum = levelMap[this.previousRankLevel] ?? Number(this.previousRankLevel);
      const currLevelNum = levelMap[this.currentRankLevel] ?? Number(this.currentRankLevel);
      if (Number.isFinite(prevLevelNum) && Number.isFinite(currLevelNum)) {
        return currLevelNum > prevLevelNum;
      }

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
    handleImageError(event) {
      event.target.style.display = 'none';
      if(event.target.nextElementSibling) {
        event.target.nextElementSibling.style.display = 'flex';
      }
    },
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
    getTierClass(tier) {
      if (!tier) return '';
      return `tier-${tier.toLowerCase()}`;
    },
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
  max-width: 520px;
  width: 92%;
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
   헤더 — 컴팩트, 좌측 정렬
═══════════════════════════════════════ */
.result-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 18px 22px 0;
}

.header-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #33fbe8;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.result-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #6b7280;
  letter-spacing: 0.02em;
}

/* ═══════════════════════════════════════
   점수 히어로 — 정보 계층 최상위
═══════════════════════════════════════ */
.score-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 22px 4px;
  gap: 8px;
}

.score-ring {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #33fbe8;
  background: linear-gradient(135deg, #f0fffe 0%, #ffffff 100%);
  box-shadow: 0 0 0 8px rgba(51, 251, 232, 0.1),
    0 8px 24px rgba(51, 251, 232, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  animation: ring-pop 350ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms both;
}

.score-number {
  font-size: 1.8rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.score-unit {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  line-height: 1;
}

.score-caption {
  margin: 0;
  font-size: 0.82rem;
  color: #9ca3af;
  font-weight: 500;
}

.bonus-score-caption {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: #0d9488;
  background: rgba(51, 251, 232, 0.18);
  border: 1px solid rgba(13, 148, 136, 0.25);
  border-radius: 999px;
  padding: 3px 8px;
  line-height: 1.2;
}

/* ═══════════════════════════════════════
   보조 통계 행 — 거리 + 소요시간 + 아바타
═══════════════════════════════════════ */
.stats-row {
  display: flex;
  align-items: stretch;
  margin: 16px 22px;
  background: #f0fffe;
  border: 1px solid #b2f5f0;
  border-radius: 14px;
  overflow: hidden;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  text-align: center;
}

.stat-icon {
  color: #0d9488;
  font-size: 0.85rem;
}

.stat-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f766e;
}

.stat-label {
  font-size: 0.72rem;
  color: #6b7280;
  white-space: nowrap;
}

.stat-divider {
  width: 1px;
  background: #b2f5f0;
  margin: 12px 0;
}

/* ═══════════════════════════════════════
   아바타 특화
═══════════════════════════════════════ */
.stat-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  overflow: hidden;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  margin-bottom: 2px;
}

.stat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar-icon {
  color: #64748b;
  font-size: 0.8rem;
}

.player-name-val {
  font-size: 0.95rem !important;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-green { color: #10b981; }
.text-red { color: #ef4444; }
.points-change { font-size: 0.75rem; font-weight: 700; }

/* ═══════════════════════════════════════
   티어 변화 섹션
═══════════════════════════════════════ */
.rank-change-section {
  margin: 0 22px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fde68a;
  border-radius: 13px;
  padding: 12px 14px;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.15);
  animation: slideInFromLeft 0.6s ease-out 0.1s both;
}

.rank-change-section.downgrade {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.rank-change-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #92400e;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 10px;
  justify-content: center;
}

.rank-change-section.downgrade .rank-change-header {
  color: #475569;
}

.rank-change-header i {
  color: #f59e0b;
}

.rank-change-section.downgrade .rank-change-header i {
  color: #64748b;
}

.rank-change-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.rank-badge {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.rank-badge.previous {
  opacity: 0.7;
  border-color: #cbd5e1;
  transform: scale(0.95);
}

.rank-badge.current {
  border-color: #fbbf24;
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.2);
}

.rank-change-section.downgrade .rank-badge.current {
  border-color: #94a3b8;
  box-shadow: 0 4px 8px rgba(100, 116, 139, 0.2);
}

.rank-tier-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  flex-shrink: 0;
}

/* 티어별 색상 */
.tier-bronze { background: #92400e; }
.tier-silver { background: #64748b; }
.tier-gold { background: #ca8a04; }
.tier-platinum { background: #0891b2; }
.tier-diamond { background: #0ea5e9; }
.tier-master { background: #dc2626; }

.rank-text {
  display: flex;
  flex-direction: column;
}

.tier-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
}

.tier-level {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
}

.rank-arrow {
  color: #94a3b8;
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════
   정답 위치 섹션 — 심플한 인라인 카드
═══════════════════════════════════════ */
.location-section {
  margin: 0 22px 16px;
  border-radius: 13px;
  border: 1px solid #b2f5f0;
  overflow: hidden;
}

.location-section-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  background: #f0fffe;
  border-bottom: 1px solid #b2f5f0;
  font-size: 0.78rem;
  font-weight: 600;
  color: #0f766e;
}

.location-section-header i {
  color: #0d9488;
  filter: drop-shadow(0 0 3px rgba(13, 148, 136, 0.4));
}

.location-body {
  padding: 10px 14px;
}

.location-poi {
  margin: 0 0 2px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}

.location-address {
  margin: 0;
  font-size: 0.82rem;
  color: #6b7280;
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
}

/* ═══════════════════════════════════════
   하단 버튼 행
═══════════════════════════════════════ */
.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 22px 22px;
}

/* 다시하기 — 브랜드 민트 PRIMARY CTA */
.btn-restart {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 13px 8px;
  border: none;
  border-radius: 13px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.92rem;
  color: #111827;
  background: linear-gradient(135deg, #33fbe8 0%, #67fdf2 100%);
  box-shadow: 0 4px 14px rgba(51, 251, 232, 0.32);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.btn-restart:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 20px rgba(51, 251, 232, 0.42);
}

.btn-restart i {
  font-size: 0.82rem;
}

/* 종료하기 — 중립 ghost 버튼 */
.btn-exit {
  padding: 13px 8px;
  border: 1.5px solid #e5e7eb;
  border-radius: 13px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.92rem;
  color: #6b7280;
  background: #ffffff;
  transition: border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.btn-exit:hover {
  border-color: #9ca3af;
  color: #374151;
  transform: translateY(-1px);
}

.btn-restart:focus-visible,
.btn-exit:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}

/* ═══════════════════════════════════════
   반응형
═══════════════════════════════════════ */
@media (max-width: 480px) {
  .score-ring {
    width: 100px;
    height: 100px;
  }

  .score-number {
    font-size: 1.5rem;
  }

  .action-row {
    grid-template-columns: 1fr;
  }

  .rank-change-content {
    flex-direction: column;
    gap: 8px;
  }
  .rank-arrow {
    transform: rotate(90deg);
  }
}

@media (max-height: 850px) {
  .result-header { padding: 12px 22px 0; }
  .score-hero { padding: 10px 22px 0; }
  .score-ring { width: 85px; height: 85px; border-width: 3px; }
  .score-number { font-size: 1.3rem; }
  .stats-row { margin: 12px 22px; }
  .stat-item { padding: 10px 6px; }
  .location-section, .map-wrapper, .rank-change-section { margin-bottom: 12px; }
  .action-row { padding: 0 22px 14px; }
  .map-wrapper :deep(.result-map-container) { height: 150px; }
}

@media (max-height: 700px) {
  .result-header { padding: 8px 22px 0; }
  .score-hero { padding: 6px 22px 0; }
  .score-ring { width: 65px; height: 65px; border-width: 2px; }
  .score-number { font-size: 1.1rem; }
  .stats-row { margin: 8px 22px; }
  .stat-item { padding: 6px 4px; }
  .location-section, .map-wrapper, .rank-change-section { margin-bottom: 8px; }
  .action-row { padding: 0 22px 10px; }
  .map-wrapper :deep(.result-map-container) { height: 120px; }
}

/* ═══════════════════════════════════════
   애니메이션
═══════════════════════════════════════ */
@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes ring-pop {
  from { transform: scale(0.7); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slideInFromLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .result-overlay, .result-content, .score-ring { animation: none; }
  .btn-restart, .btn-exit { transition: none; }
}
</style>
