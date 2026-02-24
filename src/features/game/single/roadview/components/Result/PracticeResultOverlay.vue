<template>
  <div v-if="show" class="result-overlay">
    <div class="result-content">
      <h2>결과</h2>

      <div class="result-info">
        <div class="info-item">
          <div class="info-icon"><i class="fas fa-ruler"></i></div>
          <div class="info-value">{{ formattedDistance }}</div>
          <div class="info-label">떨어진 거리</div>
        </div>

        <div class="info-item">
          <div class="info-icon"><i class="fas fa-star"></i></div>
          <div class="info-value">{{ score }}</div>
          <div class="info-label">점수</div>
        </div>

        <div class="info-item" v-if="showElapsedTime">
          <div class="info-icon"><i class="fas fa-clock"></i></div>
          <div class="info-value">{{ elapsedTimeText }}</div>
          <div class="info-label">소요 시간</div>
        </div>
      </div>

      <div v-if="poiName || fullAddress" class="answer-location-info">
        <div v-if="poiName" class="poi-info">
          <div class="poi-icon"><i class="fas fa-map-marker-alt"></i></div>
          <div class="poi-text">
            <div class="poi-label">정답 위치</div>
            <div class="poi-name">{{ poiName }}</div>
          </div>
        </div>

        <div v-if="fullAddress" class="address-info">
          <div class="address-icon"><i class="fas fa-home"></i></div>
          <div class="address-text">
            <div class="address-label">상세 주소</div>
            <div class="address-value">{{ fullAddress }}</div>
          </div>
        </div>
      </div>

      <ResultMapSection
        :currentLocation="currentLocation"
        :guessedLocation="guessedLocation"
        :markerImageUrl="markerImageUrl"
      />

      <div class="result-buttons">
        <div class="share-action">
          <p class="share-helper-text">다른 친구들도 플레이할 수 있게 이 게임을 공유해보세요!</p>
          <ShareGameButton :buttonText="shareButtonText" :disabled="shareLoading" @share="$emit('share')" />
        </div>
        <button class="restart-btn" type="button" @click="$emit('restart')">다시하기</button>
        <button class="exit-btn" type="button" @click="$emit('exit')">종료하기</button>
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
  background-color: #ffffff;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.25);
  text-align: center;
  max-width: 640px;
  width: 92%;
  max-height: 90vh;
  overflow-y: auto;
}

.result-content h2 {
  margin: 0;
  color: #111827;
}

.result-info {
  margin: 20px 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-icon {
  color: #6b7280;
}

.info-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #10b981;
}

.info-label {
  color: #6b7280;
  font-size: 0.9rem;
}

.answer-location-info {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.poi-info,
.address-info {
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border: 1px solid #93c5fd;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.poi-icon,
.address-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.poi-text,
.address-text {
  text-align: left;
}

.poi-label,
.address-label {
  font-size: 0.75rem;
  color: #1e3a8a;
}

.poi-name,
.address-value {
  color: #111827;
  font-weight: 700;
}

.result-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
  align-items: stretch;
}

.share-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px;
}

.share-helper-text {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 500;
  color: #6b7280;
  text-align: left;
  line-height: 1.35;
}

.share-action :deep(.share-btn) {
  width: 100%;
  min-height: 44px;
}

.restart-btn,
.exit-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  color: #ffffff;
  min-height: 44px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.restart-btn {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.22);
}

.exit-btn {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  box-shadow: 0 6px 12px rgba(239, 68, 68, 0.2);
}

.restart-btn:hover,
.exit-btn:hover {
  transform: translateY(-1px);
}

.restart-btn:focus-visible,
.exit-btn:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .result-content {
    padding: 22px;
  }

  .result-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
