<template>
  <div class="phone-frame">
    <div class="phone-header">
      <div class="phone-notch"></div>
    </div>
    <div class="phone-content">
      <!-- 맵 게임 컴포넌트가 여기에 표시됨 -->
      <KakaoMapGame
        :isOpen="true"
        :centerLocation="centerLocation"
        :actualLocation="actualLocation"
        :showHintCircles="showHintCircles"
        :disabled="disabled"
        :showDistance="showDistance"
        :showActionButton="showActionButton"
        @close="$emit('close')"
        @check-answer="onCheckAnswer"
        ref="phoneMapGame"
        class="phone-map"
      />

      <!-- 슬롯으로 추가 버튼 제공 -->
      <slot name="buttons"></slot>

      <!-- Spot 버튼 (휴대폰 프레임 내부) -->
      <button
        v-if="!disabled && !isTeamMode"
        class="phone-spot-button"
        @click="checkSpotAnswer"
      >
        <i class="fas fa-crosshairs"></i> Spot!
      </button>

      <!-- Team 전용 Spot 버튼 (휴대폰 프레임 내부) -->
      <button
        v-if="!disabled && isTeamMode"
        class="phone-spot-button"
        @click="voteSpotAnswer"
      >
        <i class="fas fa-crosshairs"></i> Vote!
      </button>

    </div>
    <div class="phone-footer">
      <div class="home-button" @click="$emit('close')"></div>
    </div>
  </div>
</template>

<script>
import KakaoMapGame from "@/features/game/shared/components/Kakao/KakaoMapGame/KakaoMapGame.vue";

export default {
  name: "PhoneFrame",
  components: {
    KakaoMapGame,
  },
  props: {
    centerLocation: {
      type: Object,
      required: true,
    },
    actualLocation: {
      type: Object,
      required: true,
    },
    showHintCircles: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showDistance: {
      type: Boolean,
      default: false,
    },
    showActionButton: {
      type: Boolean,
      default: false,
    },

    isTeamMode: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onCheckAnswer(location) {
      this.$emit("check-answer", location);
    },

    checkSpotAnswer() {
      if (!this.$refs.phoneMapGame) {
        this.$emit("error", "지도가 준비되지 않았습니다. 다시 시도해주세요.");
        return;
      }

      // 현재 마커 위치를 얻기 위해 KakaoMapGame에서 마커 위치 데이터 요청
      this.$refs.phoneMapGame
        .getMarkerPosition()
        .then((markerPosition) => {
          if (markerPosition) {
            this.$emit("spot-answer", markerPosition);
          } else {
            this.$emit("error", "위치를 선택해주세요!");
          }
        })
        .catch(() => {
          this.$emit("error", "위치를 선택해주세요!");
        });
    },

    voteSpotAnswer() {
      if (!this.$refs.phoneMapGame) {
        this.$emit("error", "지도가 준비되지 않았습니다. 다시 시도해주세요.");
        return;
      }

      // 현재 마커 위치를 얻기 위해 KakaoMapGame에서 마커 위치 데이터 요청
      this.$refs.phoneMapGame
        .getMarkerPosition()
        .then((markerPosition) => {
          if (markerPosition) {
            this.$emit("vote-answer", markerPosition);
          } else {
            this.$emit("error", "위치를 선택해주세요!");
          }
        })
        .catch(() => {
          this.$emit("error", "위치를 선택해주세요!");
        });
    },

    getMapInstance() {
      return this.$refs.phoneMapGame ? this.$refs.phoneMapGame.getMapInstance() : null;
    },

    // 마커 위치 가져오기
    getMarkerPosition() {
      if (!this.$refs.phoneMapGame) {
        return Promise.reject("지도가 준비되지 않았습니다.");
      }
      return this.$refs.phoneMapGame.getMarkerPosition();
    },
  },
};
</script>

<style scoped>
/* 휴대폰 프레임 스타일 */
.phone-frame {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  height: 680px;
  background-color: #111;
  border-radius: 40px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5),
    inset 0 0 10px rgba(255, 255, 255, 0.1), 0 0 0 8px #333;
  z-index: 15;
}

.phone-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #000;
  z-index: 16;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.phone-notch {
  position: relative;
  top: 0;
  width: 150px;
  height: 30px;
  background-color: #000;
  border-radius: 0 0 15px 15px;
  z-index: 17;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-notch:before {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #444;
  border-radius: 50%;
  left: 40px;
  top: 10px;
}

.phone-notch:after {
  content: "";
  position: absolute;
  width: 50px;
  height: 6px;
  background-color: #444;
  border-radius: 3px;
  right: 40px;
  top: 11px;
}

.phone-content {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 50px;
  z-index: 15;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.phone-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #000;
  z-index: 16;
  display: flex;
  justify-content: center;
  align-items: center;
}

.home-button {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #333, #222);
  border-radius: 50%;
  border: 2px solid #444;
  cursor: pointer;
  position: relative;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.home-button:before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 15px;
  height: 15px;
  border: 2px solid #666;
  border-radius: 3px;
}

.home-button:active {
  transform: scale(0.95);
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.8);
}

.phone-map {
  width: 100%;
  height: 100%;
  z-index: 15;
}

/* 휴대폰 내부 Spot 버튼 */
.phone-spot-button {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.4);
  transition: all 0.3s ease;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-spot-button:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 12px rgba(46, 204, 113, 0.6);
}

.phone-spot-button:active {
  transform: translateX(-50%) translateY(-1px);
}

.phone-spot-button i {
  font-size: 0.9rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .phone-frame {
    width: 340px;
    height: 640px;
  }
}

@media (max-width: 480px) {
  .phone-frame {
    width: 300px;
    height: 600px;
  }

  .phone-spot-button {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}
</style>
