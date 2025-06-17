<template>
  <div class="hint-container">
    <div class="hint-badge">
      <i class="fas fa-lightbulb"></i> {{ showHintNotification ? '알림' : '힌트' }}
    </div>
    <div class="hint-content">
      {{ currentHint }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhotoModeHintDisplay',
  
  props: {
    mode: {
      type: String,
      default: 'practice'
    },
    roundTimeLimit: {
      type: Number,
      default: 30
    },
    currentPhoto: {
      type: Object,
      default: null
    },
    remainingTime: {
      type: Number,
      default: 0
    },
    getRegionName: {
      type: Function,
      required: true
    }
  },
  
  data() {
    return {
      // 힌트 관련 변수
      hintTimeThresholds: [25, 20, 15, 10],
      hintLevel: 0,
      showHint: true,
      showHintNotification: true,
      currentHint: "",
      hints: [],
      hintTimer: null,
      hintNotificationTimer: null
    };
  },
  
  watch: {
    currentPhoto: {
      handler() {
        this.setupHintTimers();
      },
      immediate: true
    },
    
    remainingTime(time) {
      this.handleTimeUpdate(time);
    }
  },
  
  methods: {
    setupHintTimers() {
      // 힌트 관련 변수 초기화
      this.hintLevel = 0;
    },
    
    handleTimeUpdate(time) {
      if (this.mode === "practice") {
        for (let i = 0; i < this.hintTimeThresholds.length; i++) {
          if (time === this.hintTimeThresholds[i] && this.hintLevel <= i) {
            this.showNextHint(i);
            break;
          }
        }
      }
    },
    
    showNextHint(level) {
      this.hintLevel = level + 1;
      this.showHint = true;
      
      // 힌트 레벨에 따라 다른 힌트 표시
      if (this.hints && this.hints.length > level) {
        this.currentHint = this.hints[level];
      } else if (level === 0) {
        // 기본 힌트: 지역 이니셜
        const regionName = this.currentPhoto?.region;
        if (regionName) {
          this.currentHint = `지역 힌트: ${regionName.charAt(0)}`;
        }
      } else if (level === 1) {
        // 기본 힌트: 지역 이름
        if (this.currentPhoto?.region) {
          this.currentHint = `지역 힌트: ${this.currentPhoto.region}`;
        }
      }
      
      // 힌트가 표시되었음을 부모 컴포넌트에 알림
      this.$emit('hint-shown', level);
    },
    
    getInitialConsonants(text) {
      if (!text) return "";
      
      // 한글 초성 추출 로직
      const consonants = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
        'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
      ];
      
      let result = '';
      for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        const code = char.charCodeAt(0);
        
        if (code >= 44032 && code <= 55203) {
          const consonantIndex = Math.floor((code - 44032) / 588);
          result += consonants[consonantIndex];
        } else {
          result += char;
        }
      }
      
      return `지역 힌트: ${result}`;
    },
    
    showHintWithDelay() {
      // 기존 타이머 제거
      if (this.hintNotificationTimer) {
        clearTimeout(this.hintNotificationTimer);
      }
      if (this.hintTimer) {
        clearTimeout(this.hintTimer);
      }

      // 힌트 표시 시간 설정 (난이도에 따라 다름)
      const hintDelay = this.roundTimeLimit * 0.3; // 30% 시점에 힌트 표시

      // 힌트 알림 표시 (힌트 표시 5초 전)
      this.hintNotificationTimer = setTimeout(() => {
        this.showHintNotification = true;
        this.currentHint = `${Math.floor(hintDelay - 5)}초 후에 힌트가 표시됩니다!`;
      }, (hintDelay - 5) * 1000);

      // 힌트 표시
      this.hintTimer = setTimeout(() => {
        this.showHintNotification = false;
        this.showHint = true;

        // 정답 지역의 한글 이름 가져오기
        const regionName = this.getRegionName(this.currentPhoto.region);
        this.currentHint = this.getInitialConsonants(regionName);
        
        // 힌트가 표시되었음을 부모 컴포넌트에 알림
        this.$emit('hint-shown', 0);
      }, hintDelay * 1000);
    },
    
    resetHints() {
      // 타이머 제거
      if (this.hintNotificationTimer) {
        clearTimeout(this.hintNotificationTimer);
      }
      if (this.hintTimer) {
        clearTimeout(this.hintTimer);
      }
      
      // 상태 초기화
      this.hintLevel = 0;
      this.showHint = false;
      this.showHintNotification = false;
      this.currentHint = "";
    }
  }
};
</script>

<style scoped>
.hint-container {
  padding: 0.75rem 1rem;
  background-color: #fffbeb;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #f59e0b;
  animation: fadeIn 0.3s ease-out;
  margin-bottom: 1rem;
  position: relative;
  z-index: 10; /* 높은 z-index로 항상 위에 표시 */
  width: calc(100% - 2rem); /* 양쪽 여백 고려 */
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hint-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #b45309;
  margin-bottom: 0.5rem;
}

.hint-badge i {
  color: #f59e0b;
}

.hint-content {
  font-size: 1rem;
  color: #78350f;
  line-height: 1.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
