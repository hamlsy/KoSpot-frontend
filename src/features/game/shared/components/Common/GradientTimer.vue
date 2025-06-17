<template>
  <div class="gradient-timer" :class="{ 'warning': isWarning, 'danger': isDanger }">
    <div class="timer-bar">
      <div 
        class="progress-bar"
        :style="{ 
          width: `${percentage}%`,
          background: gradientColor
        }"
      ></div>
    </div>
    <div class="timer-display" v-if="showTime">
      <i class="fas fa-clock"></i>
      <span class="time">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GradientTimer',
  
  props: {
    time: {
      type: Number,
      required: true
    },
    maxTime: {
      type: Number,
      required: true
    },
    warningThreshold: {
      type: Number,
      default: 30 // 초
    },
    dangerThreshold: {
      type: Number,
      default: 10 // 초
    },
    showTime: {
      type: Boolean,
      default: true
    }
  },
  
  computed: {
    // 남은 시간 비율 (%)
    percentage() {
      return Math.max(0, Math.min(100, (this.time / this.maxTime) * 100));
    },
    
    // 경고 상태 여부
    isWarning() {
      return this.time <= this.warningThreshold && this.time > this.dangerThreshold;
    },
    
    // 위험 상태 여부
    isDanger() {
      return this.time <= this.dangerThreshold;
    },
    
    // 포맷된 시간 문자열 (MM:SS)
    formattedTime() {
      const minutes = Math.floor(this.time / 60);
      const seconds = this.time % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    
    // 그라데이션 색상
    gradientColor() {
      if (this.isDanger) {
        // 위험 상태 (빨간색)
        return 'linear-gradient(90deg, #ff4136 0%, #e74c3c 100%)';
      } else if (this.isWarning) {
        // 경고 상태 (주황색)
        return 'linear-gradient(90deg, #ff851b 0%, #f39c12 100%)';
      } else {
        // 일반 상태 (녹색)
        return 'linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)';
      }
    }
  }
};
</script>

<style scoped>
.gradient-timer {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timer-bar {
  height: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 1s linear, background-color 0.5s ease;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #555;
}

.warning .timer-display {
  color: #f39c12;
  animation: pulse 1s infinite;
}

.danger .timer-display {
  color: #e74c3c;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .timer-bar {
    height: 6px;
  }
  
  .timer-display {
    font-size: 0.8rem;
  }
}
</style> 