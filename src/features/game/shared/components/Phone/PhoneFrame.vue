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
        :gameMode="gameMode"
        :markerImageUrl="markerImageUrl"
        :hasSubmitted="hasSubmitted"
        @close="$emit('close')"
        @check-answer="onCheckAnswer"
        ref="phoneMapGame"
        class="phone-map"
      />

      <!-- 슬롯으로 추가 버튼 제공 -->
      <slot name="buttons"></slot>

      <!-- Spot 버튼 (휴대폰 프레임 내부) - 일반 모드용 -->
      <button
        v-if="!disabled && !isTeamMode"
        class="phone-spot-button"
        :style="spotButtonVars"
        :class="{ 'disabled': hasSubmitted }"
        :disabled="hasSubmitted"
        @click="checkSpotAnswer"
      >
        <i class="fas fa-crosshairs"></i> Spot!
      </button>


    </div>

    <!-- 공통 지도 재로딩 버튼 (우측 상단) - phone-content 외부로 이동 -->
    <button
      v-if="showReloadButton"
      class="phone-reload-button"
      @click="reloadMap"
      title="지도 새로고침"
    >
      <i class="fas fa-sync-alt"></i>
    </button>

    <div class="phone-footer">
      <div class="home-button" @click="$emit('close')"></div>
    </div>
  </div>
</template>

<script>
import KakaoMapGame from "@/features/game/shared/components/Kakao/KakaoMapGame/KakaoMapGame.vue";
import { BRAND, TEXT } from "@/core/constants/colors.js";

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
      required: false,
      default: null,
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
    gameMode: {
      type: String,
      default: 'single', // 기본값을 single로 설정
    },
    markerImageUrl: {
      type: String,
      default: null,
    },
    hasSubmitted: {
      type: Boolean,
      default: false,
    },
    showReloadButton: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    spotButtonVars() {
      return {
        "--spot-primary": BRAND.PRIMARY,
        "--spot-accent": BRAND.INFO,
        "--spot-text": "#ffffff",
        "--spot-disabled-bg": TEXT.MUTED,
      };
    },
  },
  methods: {
    onCheckAnswer(location) {
      this.$emit("check-answer", location);
    },

    checkSpotAnswer() {
      // 이미 제출한 경우 처리하지 않음
      if (this.hasSubmitted) {
        return;
      }

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

    // 지도 초기화 보장
    ensureMapInitialized() {
      if (this.$refs.phoneMapGame && typeof this.$refs.phoneMapGame.ensureMapInitialized === 'function') {
        this.$refs.phoneMapGame.ensureMapInitialized();
      }
    },

    // 지도 재로딩
    reloadMap() {
      if (!this.$refs.phoneMapGame) {
        this.$emit("error", "지도가 준비되지 않았습니다. 다시 시도해주세요.");
        return;
      }

      if (typeof this.$refs.phoneMapGame.reloadMap === 'function') {
        console.log("🔄 PhoneFrame: 지도 재로딩 요청");
        this.$refs.phoneMapGame.reloadMap();
        this.$emit("map-reloaded");
      } else {
        console.warn("⚠️ reloadMap 메서드를 사용할 수 없습니다. ensureMapInitialized를 사용합니다.");
        this.ensureMapInitialized();
      }
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
  /* 항상 수직/수평 중앙 정렬 */
  transform: translate(-50%, -50%);
  /* Responsive sizing */
  width: clamp(260px, 42vw, 420px);
  aspect-ratio: 9 / 16;
  /* 상/하 안전 여백을 고려한 최대 높이 */
  max-height: calc(100svh - var(--frame-top-safe) - var(--frame-bottom-safe));
  height: auto;
  background-color: #111;
  border-radius: 40px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5),
    inset 0 0 10px rgba(255, 255, 255, 0.1), 0 0 0 8px #333;
  z-index: 21;
  /* Scalable parts */
  --header-h: clamp(36px, 6.5%, 56px);
  --footer-h: clamp(36px, 6.5%, 56px);
  --notch-w: clamp(120px, 40%, 160px);
  --notch-h: clamp(22px, 4.5%, 30px);
  --home-btn: clamp(32px, 6.5%, 44px);
  --spot-btn-bottom: clamp(12px, 3.2vh, 22px);
  --spot-btn-pad-v: clamp(8px, 1.6vh, 12px);
  --spot-btn-pad-h: clamp(12px, 2.2vw, 20px);
  --spot-btn-font: clamp(0.8rem, 1.8vw, 0.95rem);
  /* 안전 여백(상/하) */
  --frame-top-safe: clamp(16px, 6vh, 56px);
  --frame-bottom-safe: clamp(24px, 7vh, 64px);
}

.phone-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-h);
  background-color: #000;
  z-index: 16;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.phone-notch {
  position: relative;
  top: 0;
  width: var(--notch-w);
  height: var(--notch-h);
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
  width: clamp(6px, 1.2vw, 8px);
  height: clamp(6px, 1.2vw, 8px);
  background-color: #444;
  border-radius: 50%;
  left: clamp(28px, 10%, 40px);
  top: clamp(8px, 2.2vh, 10px);
}

.phone-notch:after {
  content: "";
  position: absolute;
  width: clamp(36px, 15%, 50px);
  height: clamp(4px, 0.8vh, 6px);
  background-color: #444;
  border-radius: 3px;
  right: clamp(28px, 10%, 40px);
  top: clamp(9px, 2.2vh, 11px);
}

.phone-content {
  position: absolute;
  top: var(--header-h);
  left: 0;
  right: 0;
  bottom: var(--footer-h);
  z-index: 15;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.phone-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--footer-h);
  background-color: #000;
  z-index: 16;
  display: flex;
  justify-content: center;
  align-items: center;
}

.home-button {
  width: var(--home-btn);
  height: var(--home-btn);
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
  width: clamp(11px, 2.6vw, 15px);
  height: clamp(11px, 2.6vw, 15px);
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
  bottom: var(--spot-btn-bottom);
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--spot-primary) 0%, var(--spot-accent) 100%);
  color: var(--spot-text);
  border: none;
  padding: var(--spot-btn-pad-v) var(--spot-btn-pad-h);
  border-radius: 25px;
  font-weight: bold;
  font-size: var(--spot-btn-font);
  cursor: pointer;
  box-shadow: 0 5px 12px rgba(59, 130, 246, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-spot-button:hover {
  transform: translateX(-50%) translateY(-1px);
  box-shadow: 0 7px 14px rgba(59, 130, 246, 0.3);
}

.phone-spot-button:active {
  transform: translateX(-50%) translateY(-1px);
}

.phone-spot-button.disabled,
.phone-spot-button:disabled {
  background: var(--spot-disabled-bg);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.phone-spot-button.disabled:hover,
.phone-spot-button:disabled:hover {
  transform: translateX(-50%);
  box-shadow: none;
}

.phone-spot-button i {
  font-size: 0.9rem;
}

/* 공통 지도 재로딩 버튼 (우측 상단) */
.phone-reload-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 31;
  transition: transform 0.25s ease, background-color 0.25s ease;
}

.phone-reload-button:hover {
  background: #f5f5f5;
  transform: rotate(180deg) scale(1.06);
}

.phone-reload-button:active {
  transform: rotate(180deg) scale(0.95);
}

.phone-reload-button i {
  color: #3498db;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .phone-frame {
    width: clamp(240px, 88vw, 360px);
    /* 모바일에서도 중앙 정렬 유지, 안전 여백 기반으로 축소 */
    max-height: calc(100svh - var(--frame-top-safe) - var(--frame-bottom-safe));
  }
}

@media (max-width: 480px) {
  .phone-frame {
    width: clamp(220px, 92vw, 340px);
    max-height: calc(100svh - var(--frame-top-safe) - var(--frame-bottom-safe));
  }
  .phone-spot-button {
    /* values already scale via vars; keep a small tweak for very small screens */
    border-radius: 22px;
  }
}
</style>
