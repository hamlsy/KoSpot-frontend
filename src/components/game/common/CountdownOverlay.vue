<template>
  <div v-if="show" class="countdown-overlay">
    <div class="countdown">{{ countdown }}</div>
  </div>
</template>

<script>
export default {
  name: "CountdownOverlay",
  props: {
    show: {
      type: Boolean,
      default: false
    },
    initialCount: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      countdown: this.initialCount,
      countdownTimer: null
    };
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.startCountdown();
      } else {
        this.clearCountdownTimer();
      }
    },
    initialCount(newVal) {
      this.countdown = newVal;
    }
  },
  methods: {
    startCountdown() {
      // 카운트다운 초기화
      this.countdown = this.initialCount;
      this.clearCountdownTimer();
      
      // 카운트다운 시작
      this.countdownTimer = setInterval(() => {
        this.countdown--;
        
        if (this.countdown <= 0) {
          this.clearCountdownTimer();
          this.$emit('countdown-complete');
        }
      }, 1000);
    },
    clearCountdownTimer() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    }
  },
  beforeDestroy() {
    this.clearCountdownTimer();
  }
};
</script>

<style scoped>
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 25;

}

.countdown {
  font-size: 7rem;
  font-weight: bold;
  color: white;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .countdown {
    font-size: 5rem;
  }
}

@media (max-width: 480px) {
  .countdown {
    font-size: 4rem;
  }
}
</style>
