<template>
  <div class="round-result" v-if="visible">
    <div class="result-overlay" @click.self="close">
      <div
        class="result-card"
        :class="{ success: isCorrect, failure: !isCorrect }"
      >
        <div class="result-header">
          <h2>{{ isCorrect ? "정답입니다!" : "오답입니다!" }}</h2>
          <div class="round-info">
            라운드 {{ currentRound }}/{{ totalRounds }}
          </div>
        </div>

        <div class="result-content">
          <div class="location-info">
            <h3>{{ locationName }}</h3>
            <p class="location-description">{{ locationDescription }}</p>
          </div>

          <div class="image-container">
            <img :src="photoUrl" alt="위치 사진" class="location-image" />
          </div>

          <div class="score-display">
            <div class="score-label">획득 점수</div>
            <div class="score-value">{{ score }} 점</div>
          </div>

          <div v-if="showMap" class="map-result">
            <div class="region-info">
              <span v-if="correctRegion" class="correct-region-label">
                정답 지역: {{ getRegionName(correctRegion) }}
              </span>
            </div>
            <div class="region-map-container">
              <region-map
                :disabled="true"
                :correctRegion="correctRegion"
                :wrongRegion="wrongRegion"
              />
            </div>
          </div>

          <div class="fun-fact" v-if="fact">
            <h4>알고 계셨나요?</h4>
            <p>{{ fact }}</p>
          </div>
        </div>

        <div class="result-actions">
          <button
            v-if="currentRound < totalRounds"
            class="next-button"
            @click="nextRound"
          >
            다음 라운드 <i class="fas fa-arrow-right"></i>
          </button>

          <button v-else class="finish-button" @click="finishGame">
            게임 결과 보기 <i class="fas fa-flag-checkered"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RegionMap from "@/components/game/photoMode/gameplay/PhotoModeRegionMap.vue";

export default {
  name: "RoundResult",

  components: {
    RegionMap,
  },

  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
    },
    currentRound: {
      type: Number,
      required: true,
    },
    totalRounds: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      default: "",
    },
    locationDescription: {
      type: String,
      default: "",
    },
    photoUrl: {
      type: String,
      default: "",
    },
    fact: {
      type: String,
      default: "",
    },
    correctRegion: {
      type: String,
      default: null,
    },
    wrongRegion: {
      type: String,
      default: null,
    },
    showMap: {
      type: Boolean,
      default: true,
    },
  },

  methods: {
    close() {
      this.$emit("close");
    },

    nextRound() {
      this.$emit("next-round");
    },

    finishGame() {
      this.$emit("finish-game");
    },

    getRegionName(regionCode) {
      const regionMap = {
        Seoul: "서울특별시",
        Busan: "부산광역시",
        Daegu: "대구광역시",
        Incheon: "인천광역시",
        Gwangju: "광주광역시",
        Daejeon: "대전광역시",
        Ulsan: "울산광역시",
        Sejong: "세종특별자치시",
        Gyeonggi: "경기도",
        Gangwon: "강원도",
        Chungbuk: "충청북도",
        Chungnam: "충청남도",
        Jeonbuk: "전라북도",
        Jeonnam: "전라남도",
        Gyeongbuk: "경상북도",
        Gyeongnam: "경상남도",
        Jeju: "제주특별자치도",
      };

      return regionMap[regionCode] || regionCode;
    },
  },
};
</script>

<style scoped>
.round-result {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease-out;
}

.result-card {
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: auto;
  animation: slideUp 0.5s ease-out;
}

.result-card.success {
  border-top: 6px solid #10b981;
}

.result-card.failure {
  border-top: 6px solid #ef4444;
}

.result-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.result-card.success .result-header h2 {
  color: #10b981;
}

.result-card.failure .result-header h2 {
  color: #ef4444;
}

.round-info {
  font-size: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f8fafc;
  border-radius: 30px;
  color: #64748b;
  font-weight: 600;
}

.result-content {
  padding: 2rem;
}

.location-info {
  margin-bottom: 1.5rem;
  text-align: center;
}

.location-info h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #0f172a;
}

.location-description {
  font-size: 1rem;
  line-height: 1.6;
  color: #475569;
  margin: 0;
}

.image-container {
  width: 100%;
  max-height: 300px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.location-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.score-display {
  text-align: center;
  margin-bottom: 1.5rem;
}

.score-label {
  font-size: 1.1rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
}

.result-card.success .score-value {
  color: #10b981;
}

.result-card.failure .score-value {
  color: #ef4444;
}

.map-result {
  height: 330px;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.region-info {
  padding: 10px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: bold;
  display: flex;
  justify-content: center;
}

.correct-region-label {
  color: #10b981;
  font-size: 16px;
}

.region-map-container {
  width: 100%;
  height: 100%;
}

.fun-fact {
  background-color: #f1f5f9;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.fun-fact h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #1e293b;
}

.fun-fact p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #475569;
}

.result-actions {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

.next-button,
.finish-button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
}

.next-button {
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.next-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
}

.finish-button {
  background-color: #8b5cf6;
  color: white;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
}

.finish-button:hover {
  background-color: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(139, 92, 246, 0.4);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .result-card {
    max-width: 95%;
  }

  .result-header {
    padding: 1rem 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .result-header h2 {
    font-size: 1.5rem;
  }

  .result-content {
    padding: 1.5rem;
  }

  .location-info h3 {
    font-size: 1.25rem;
  }

  .score-value {
    font-size: 2rem;
  }

  .map-result {
    height: 250px;
  }

  .result-actions {
    padding: 1rem 1.5rem;
  }

  .next-button,
  .finish-button {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1.5rem;
  }
}
</style> 