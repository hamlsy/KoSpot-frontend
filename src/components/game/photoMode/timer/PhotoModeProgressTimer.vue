<template>
  <div class="progress-timer" :class="{ 'warning': isWarning, 'danger': isDanger }">
    <div class="timer-bar">
      <div class="progress-bar" :style="{ width: `${progressPercentage}%` }"></div>
    </div>
    <div class="timer-display">
      <i class="fas fa-clock"></i>
      <span>{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProgressTimer',
  
  props: {
    initialTime: {
      type: Number,
      required: true
    },
    warningThreshold: {
      type: Number,
      default: 10 // 초 단위
    },
    dangerThreshold: {
      type: Number,
      default: 5 // 초 단위
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      remainingTime: this.initialTime,
      timer: null
    };
  },
  
  computed: {
    progressPercentage() {
      return (this.remainingTime / this.initialTime) * 100;
    },
    
    isWarning() {
      return this.remainingTime <= this.warningThreshold && this.remainingTime > this.dangerThreshold;
    },
    
    isDanger() {
      return this.remainingTime <= this.dangerThreshold;
    },
    
    formattedTime() {
      const minutes = Math.floor(this.remainingTime / 60);
      const seconds = this.remainingTime % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
  },
  
  watch: {
    isActive(newValue) {
      if (newValue) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    },
    
    initialTime(newValue) {
      this.resetTimer(newValue);
    },
    
    remainingTime(newValue) {
      if (newValue <= 0) {
        this.stopTimer();
        this.$emit('time-up');
      }
    }
  },
  
  mounted() {
    if (this.isActive) {
      this.startTimer();
    }
  },
  
  beforeDestroy() {
    this.stopTimer();
  },
  
  methods: {
    startTimer() {
      this.stopTimer(); // 중복 타이머 방지
      
      this.timer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
          this.$emit('time-update', this.remainingTime);
        } else {
          this.stopTimer();
        }
      }, 1000);
    },
    
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    
    resetTimer(time = null) {
      this.stopTimer();
      this.remainingTime = time !== null ? time : this.initialTime;
      
      if (this.isActive) {
        this.startTimer();
      }
    },
    
    addTime(seconds) {
      this.remainingTime += seconds;
    },
    
    subtractTime(seconds) {
      this.remainingTime = Math.max(0, this.remainingTime - seconds);
    }
  }
};
</script>

<style scoped>
.progress-timer {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 300px;
  background-color: #f1f5f9;
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.timer-bar {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 4px;
  transition: width 1s linear;
}

.timer-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  color: #1e293b;
}

.progress-timer.warning .progress-bar {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-timer.danger .progress-bar {
  background: linear-gradient(90deg, #ef4444, #f87171);
  animation: pulse 1s infinite;
}

.progress-timer.warning .timer-display,
.progress-timer.danger .timer-display {
  color: #b91c1c;
  animation: shake 0.5s ease-in-out;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

@media (max-width: 768px) {
  .progress-timer {
    padding: 0.5rem;
    max-width: 200px;
  }
  
  .timer-bar {
    height: 6px;
  }
  
  .timer-display {
    font-size: 1rem;
  }
}
</style> 