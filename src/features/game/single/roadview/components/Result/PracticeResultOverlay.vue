<template>
  <div v-if="show" class="result-overlay">
    <div class="result-content">
      <!-- 브랜드 포인트 바 -->
      <div class="brand-bar"></div>

      <!-- 헤더: 좌측 정렬, 컴팩트 -->
      <div class="result-header">
        <div class="header-icon">
          <i class="fas fa-map-pin"></i>
        </div>
        <span class="result-title">게임 결과</span>
      </div>

      <!-- 점수 히어로 섹션: 정보 계층 최상위 -->
      <div class="score-hero">
        <div class="score-ring">
          <span class="score-number">{{ score }}</span>
          <span class="score-unit">점</span>
        </div>
        <p class="score-caption">획득 점수</p>
      </div>

      <!-- 보조 통계 행: 거리 + 소요시간 -->
      <div class="stats-row">
        <div class="stat-item">
          <i class="fas fa-ruler stat-icon"></i>
          <span class="stat-value">{{ formattedDistance }}</span>
          <span class="stat-label">떨어진 거리</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" v-if="showElapsedTime">
          <i class="fas fa-clock stat-icon"></i>
          <span class="stat-value">{{ elapsedTimeText }}</span>
          <span class="stat-label">소요 시간</span>
        </div>
        <div class="stat-item" v-if="!showElapsedTime">
          <i class="fas fa-crosshairs stat-icon"></i>
          <span class="stat-value">연습 모드</span>
          <span class="stat-label">게임 유형</span>
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
      <div class="map-wrapper">
        <ResultMapSection
          :currentLocation="currentLocation"
          :guessedLocation="guessedLocation"
          :markerImageUrl="markerImageUrl"
        />
      </div>

      <!-- 공유 유도 -->
      <div class="share-section">
        <p class="share-hint">
          <i class="fas fa-users"></i>
          친구들도함께 도전할 수 있게 공유해보세요!
        </p>
        <ShareGameButton
          :buttonText="shareButtonText"
          :disabled="shareLoading"
          @share="$emit('share')"
        />
      </div>

      <!-- 하단 버튼 행 -->
      <div class="action-row">
        <button class="btn-restart" type="button" @click="$emit('restart')">
          <i class="fas fa-redo-alt"></i>
          다시하기
        </button>
        <button class="btn-exit" type="button" @click="$emit('exit')">
          종료하기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ResultMapSection from "src/features/game/single/roadview/components/Result/ResultMapSection.vue";
import ShareGameButton from "./ShareGameButton.vue";

export default {
  name: "PracticeResultOverlay",
  components: {
    ResultMapSection,
    ShareGameButton,
  },
  emits: ["restart", "exit", "share"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    distance: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    poiName: {
      type: String,
      default: null,
    },
    fullAddress: {
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
    markerImageUrl: {
      type: String,
      default: null,
    },
    showElapsedTime: {
      type: Boolean,
      default: false,
    },
    elapsedTimeText: {
      type: String,
      default: "",
    },
    shareLoading: {
      type: Boolean,
      default: false,
    },
    shareButtonText: {
      type: String,
      default: "게임 공유",
    },
  },
  computed: {
    formattedDistance() {
      return `${this.distance.toFixed(2)} km`;
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
  font-size: 2.2rem;
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

/* ═══════════════════════════════════════
   보조 통계 행 — 거리 + 소요시간
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
  padding: 14px 10px;
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
}

.stat-divider {
  width: 1px;
  background: #b2f5f0;
  margin: 12px 0;
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
}

/* ═══════════════════════════════════════
   공유 유도 섹션
═══════════════════════════════════════ */
.share-section {
  margin: 0 22px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 13px;
  padding: 10px 14px;
}

.share-hint {
  flex: 1;
  margin: 0;
  font-size: 0.78rem;
  color: #111827;
  font-weight: 500;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.share-hint i {
  color: #f59e0b;
  margin-top: 1px;
  flex-shrink: 0;
}

.share-section :deep(.share-btn) {
  flex-shrink: 0;
  padding: 9px 16px;
  font-size: 0.85rem;
  min-height: unset;
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
    font-size: 2rem;
  }

  .action-row {
    grid-template-columns: 1fr;
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

@keyframes ring-pop {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .result-overlay,
  .result-content,
  .score-ring {
    animation: none;
  }

  .btn-restart,
  .btn-exit {
    transition: none;
  }
}
</style>
