<template>
  <div class="next-round-button-container" v-if="visible">
    <div class="countdown-bar" v-if="isRankMode">
      <div
        class="countdown-progress"
        :style="{ width: `${countdownProgress}%` }"
      ></div>
    </div>
    <button class="next-round-button" @click="goToNextRound">
      <span v-if="isLastRound">결과 보기</span>
      <span v-else>다음 라운드</span>
      <i
        :class="isLastRound ? 'fas fa-flag-checkered' : 'fas fa-arrow-right'"
      ></i>
    </button>
  </div>
</template>

<script>
export default {
  name: "PhotoModeNextRoundButton",

  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    isLastRound: {
      type: Boolean,
      default: false,
    },
    isRankMode: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      countdownDuration: 15000, // 15초
      countdownStart: 0,
      countdownProgress: 100,
      countdownInterval: null,
    };
  },

  watch: {
    visible(newVal) {
      if (newVal) {
        this.startCountdown();
      } else {
        this.stopCountdown();
      }
    },
  },

  methods: {
    startCountdown() {
      if (this.isRankMode) {
        this.stopCountdown(); // 기존 카운트다운 중지
        this.countdownStart = Date.now();
        this.countdownProgress = 100;

        this.countdownInterval = setInterval(() => {
          const elapsed = Date.now() - this.countdownStart;
          this.countdownProgress =
            100 - (elapsed / this.countdownDuration) * 100;

          if (this.countdownProgress <= 0) {
            this.stopCountdown();
            this.goToNextRound();
          }
        }, 50);
      }
    },

    stopCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },

    goToNextRound() {
      this.stopCountdown();
      this.$emit("next-round");
    },
  },

  beforeDestroy() {
    this.stopCountdown();
  },
};
</script>

<style scoped>
.next-round-button-container {
  margin-top: 1rem;
  text-align: center;
  animation: fadeIn 0.3s ease-out;
}

.countdown-bar {
  width: 100%;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.countdown-progress {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.05s linear;
}

.next-round-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background-color: #3b82f6;
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
}

.next-round-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(59, 130, 246, 0.3);
}

.next-round-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
