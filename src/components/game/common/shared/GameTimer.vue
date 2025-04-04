<template>
  <div class="game-timer" :class="timerClass">
    <div class="timer-icon">
      <i :class="timerIcon"></i>
    </div>
    <div class="timer-display">
      <div class="time-digits">{{ formattedTime }}</div>
      <div class="timer-label" v-if="showLabel">
        {{ label || defaultLabel }}
      </div>
    </div>
    <div class="timer-progress" v-if="showProgress">
      <div 
        class="progress-bar" 
        :style="{ width: `${progressPercentage}%` }"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameTimer',
  
  props: {
    initialTime: {
      type: Number,
      required: true
    },
    totalTime: {
      type: Number,
      required: true
    },
    isRunning: {
      type: Boolean,
      default: false
    },
    isPaused: {
      type: Boolean,
      default: false
    },
    isWarning: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    showLabel: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: ''
    },
    countDirection: {
      type: String,
      default: 'down',
      validator: (value) => ['up', 'down'].includes(value)
    },
    warningThreshold: {
      type: Number,
      default: 10 // 10초 이하일 때 경고 스타일 적용 (카운트다운 모드에서)
    }
  },
  
  data() {
    return {
      currentTime: this.initialTime,
      timerInterval: null
    };
  },
  
  computed: {
    formattedTime() {
      const totalSeconds = Math.max(0, Math.floor(this.currentTime));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    
    progressPercentage() {
      if (this.countDirection === 'down') {
        return (this.currentTime / this.totalTime) * 100;
      } else {
        return ((this.totalTime - this.currentTime) / this.totalTime) * 100;
      }
    },
    
    timerClass() {
      return {
        'timer-running': this.isRunning && !this.isPaused,
        'timer-paused': this.isPaused,
        'timer-warning': this.showWarning,
        'timer-expired': this.isExpired
      };
    },
    
    timerIcon() {
      if (this.isPaused) {
        return 'fas fa-pause';
      } else if (this.showWarning) {
        return 'fas fa-exclamation';
      } else if (this.isExpired) {
        return 'fas fa-flag-checkered';
      } else {
        return 'fas fa-clock';
      }
    },
    
    defaultLabel() {
      return this.countDirection === 'down' ? '남은 시간' : '경과 시간';
    },
    
    isExpired() {
      return this.countDirection === 'down' && this.currentTime <= 0;
    },
    
    showWarning() {
      return this.isWarning || (this.countDirection === 'down' && this.currentTime <= this.warningThreshold && this.currentTime > 0);
    }
  },
  
  watch: {
    isRunning(newValue) {
      if (newValue && !this.isPaused) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    },
    
    isPaused(newValue) {
      if (this.isRunning) {
        if (newValue) {
          this.stopTimer();
        } else {
          this.startTimer();
        }
      }
    },
    
    initialTime(newTime) {
      this.currentTime = newTime;
    },
    
    currentTime(newTime) {
      this.$emit('time-updated', newTime);
      
      if (this.countDirection === 'down' && newTime <= 0) {
        this.stopTimer();
        this.$emit('timer-completed');
      }
    }
  },
  
  mounted() {
    if (this.isRunning && !this.isPaused) {
      this.startTimer();
    }
  },
  
  beforeDestroy() {
    this.stopTimer();
  },
  
  methods: {
    startTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      
      const startTime = Date.now();
      const initialOffset = this.currentTime;
      
      this.timerInterval = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        
        if (this.countDirection === 'down') {
          this.currentTime = Math.max(0, initialOffset - elapsedSeconds);
        } else {
          this.currentTime = initialOffset + elapsedSeconds;
        }
        
        // 타이머 완료 시 이벤트 발생
        if (this.countDirection === 'down' && this.currentTime <= 0) {
          this.stopTimer();
          this.$emit('timer-completed');
        }
      }, 100); // 0.1초마다 갱신 (부드러운 진행 효과)
    },
    
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },
    
    reset(newTime = null) {
      this.stopTimer();
      this.currentTime = newTime !== null ? newTime : this.initialTime;
      
      if (this.isRunning && !this.isPaused) {
        this.startTimer();
      }
    }
  }
};
</script>

<style scoped>
.game-timer {
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.timer-icon {
  margin-right: 0.8rem;
  font-size: 1.2rem;
  color: #4285F4;
  width: 20px;
  display: flex;
  justify-content: center;
}

.timer-display {
  display: flex;
  flex-direction: column;
}

.time-digits {
  font-size: 1.1rem;
  font-weight: 700;
  font-family: monospace;
  color: #333;
  letter-spacing: 1px;
}

.timer-label {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.1rem;
}

.timer-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #f0f0f0;
}

.progress-bar {
  height: 100%;
  background: #4285F4;
  transition: width 0.1s linear;
}

.timer-running .timer-icon {
  color: #4285F4;
}

.timer-paused .timer-icon {
  color: #ff9800;
}

.timer-warning {
  animation: pulse 1s infinite;
}

.timer-warning .timer-icon {
  color: #ff5252;
}

.timer-warning .progress-bar {
  background: #ff5252;
}

.timer-expired .timer-icon {
  color: #757575;
}

.timer-expired .progress-bar {
  background: #757575;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
  100% {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .game-timer {
    padding: 0.5rem 0.8rem;
  }
  
  .timer-icon {
    font-size: 1rem;
    margin-right: 0.6rem;
  }
  
  .time-digits {
    font-size: 1rem;
  }
}
</style> 