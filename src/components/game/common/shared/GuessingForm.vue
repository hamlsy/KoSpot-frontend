<template>
  <div class="guessing-form" :class="{ 'expanded': isExpanded }">
    <div class="form-header" @click="toggleExpanded">
      <div class="title">
        <i class="fas fa-map-marker-alt"></i>
        <span>위치 추측</span>
      </div>
      <button class="toggle-button">
        <i :class="isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i>
      </button>
    </div>
    
    <div class="form-content" v-if="isExpanded">
      <div class="form-section coordinates">
        <div class="section-title">좌표</div>
        <div class="coordinates-display">
          <div class="coordinate-group">
            <label>위도</label>
            <input 
              type="number" 
              v-model.number="latitude" 
              step="0.000001" 
              :disabled="!hasGuessPosition || !allowManualInput"
              @change="updateManualCoordinates"
            />
          </div>
          <div class="coordinate-group">
            <label>경도</label>
            <input 
              type="number" 
              v-model.number="longitude" 
              step="0.000001" 
              :disabled="!hasGuessPosition || !allowManualInput"
              @change="updateManualCoordinates"
            />
          </div>
        </div>
      </div>
      
      <div class="form-section confidence" v-if="showConfidence">
        <div class="section-title">확신도</div>
        <div class="confidence-slider">
          <input 
            type="range" 
            v-model.number="confidenceLevel" 
            min="1" 
            max="5" 
            step="1"
            :disabled="!hasGuessPosition"
          />
          <div class="confidence-labels">
            <span>낮음</span>
            <span>높음</span>
          </div>
        </div>
        <div class="confidence-display">
          <div 
            v-for="i in 5" 
            :key="i"
            class="confidence-dot"
            :class="{ 'active': i <= confidenceLevel }"
          ></div>
        </div>
      </div>
      
      <div class="form-section" v-if="showComment">
        <div class="section-title">코멘트 (선택사항)</div>
        <textarea 
          v-model="comment" 
          placeholder="추측한 이유에 대해 코멘트를 남길 수 있습니다."
          :disabled="!hasGuessPosition"
          maxlength="200"
        ></textarea>
        <div class="comment-length">{{ comment.length }}/200</div>
      </div>
      
      <div class="form-actions">
        <div class="timer" v-if="showTimer && timeRemaining !== null">
          <i class="fas fa-clock"></i>
          <span>{{ formatTime(timeRemaining) }}</span>
        </div>
        
        <div class="action-buttons">
          <button 
            class="reset-button" 
            @click="resetGuess"
            :disabled="!hasGuessPosition || isSubmitted"
            v-if="showResetButton"
          >
            <i class="fas fa-undo"></i>
            초기화
          </button>
          
          <button 
            class="submit-button" 
            @click="submitGuess"
            :disabled="!hasGuessPosition || isSubmitted || isLoading"
            :class="{ 'submitted': isSubmitted }"
          >
            <i :class="isSubmitted ? 'fas fa-check' : 'fas fa-paper-plane'"></i>
            {{ isSubmitted ? '제출 완료' : '제출하기' }}
          </button>
        </div>
      </div>
      
      <div class="submission-status" v-if="isSubmitted">
        <i class="fas fa-check-circle"></i>
        <span>정답이 성공적으로 제출되었습니다.</span>
      </div>
      
      <div class="loading-overlay" v-if="isLoading">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
      </div>
    </div>
    
    <div class="minimized-status" v-if="!isExpanded && hasGuessPosition">
      <div class="status-text" v-if="isSubmitted">
        <i class="fas fa-check-circle"></i>
        <span>정답 제출 완료</span>
      </div>
      <div class="status-text" v-else>
        <i class="fas fa-map-marker-alt"></i>
        <span>위치 선택 완료</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GuessingForm',
  
  props: {
    guessPosition: {
      type: Object,
      default: null
    },
    showConfidence: {
      type: Boolean,
      default: false
    },
    showComment: {
      type: Boolean,
      default: false
    },
    showTimer: {
      type: Boolean,
      default: false
    },
    timeRemaining: {
      type: Number,
      default: null
    },
    allowManualInput: {
      type: Boolean,
      default: true
    },
    showResetButton: {
      type: Boolean,
      default: true
    },
    initialExpanded: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      isExpanded: this.initialExpanded,
      latitude: this.guessPosition ? this.guessPosition.lat : null,
      longitude: this.guessPosition ? this.guessPosition.lng : null,
      confidenceLevel: 3,
      comment: '',
      isSubmitted: false,
      isLoading: false
    };
  },
  
  computed: {
    hasGuessPosition() {
      return this.latitude !== null && this.longitude !== null;
    }
  },
  
  watch: {
    guessPosition(newPosition) {
      if (newPosition) {
        this.latitude = newPosition.lat;
        this.longitude = newPosition.lng;
      } else {
        this.latitude = null;
        this.longitude = null;
      }
    },
    
    disabled(newValue) {
      if (newValue) {
        this.isExpanded = false;
      }
    }
  },
  
  methods: {
    toggleExpanded() {
      if (!this.disabled) {
        this.isExpanded = !this.isExpanded;
      }
    },
    
    updateManualCoordinates() {
      if (this.allowManualInput && this.latitude && this.longitude) {
        // 유효한 입력 범위 검사
        this.latitude = Math.min(Math.max(this.latitude, -90), 90);
        this.longitude = Math.min(Math.max(this.longitude, -180), 180);
        
        this.$emit('update-position', {
          lat: this.latitude,
          lng: this.longitude
        });
      }
    },
    
    resetGuess() {
      this.latitude = null;
      this.longitude = null;
      this.confidenceLevel = 3;
      this.comment = '';
      this.isSubmitted = false;
      
      this.$emit('reset-guess');
    },
    
    submitGuess() {
      if (!this.hasGuessPosition || this.isSubmitted || this.isLoading) return;
      
      this.isLoading = true;
      
      // 제출 데이터 생성
      const guessData = {
        position: {
          lat: this.latitude,
          lng: this.longitude
        },
        confidence: this.showConfidence ? this.confidenceLevel : null,
        comment: this.showComment ? this.comment : null,
        timestamp: new Date().toISOString()
      };
      
      // 비동기 제출 시뮬레이션 (실제로는 API 호출)
      setTimeout(() => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.isExpanded = false;
        
        this.$emit('submit-guess', guessData);
      }, 800);
    },
    
    formatTime(seconds) {
      if (seconds === null) return '--:--';
      
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.guessing-form {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
}

.form-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  cursor: pointer;
  border-bottom: 1px solid #e9ecef;
  transition: background 0.2s ease;
}

.form-header:hover {
  background: #f0f0f0;
}

.title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
}

.title i {
  margin-right: 0.5rem;
  color: #4285F4;
}

.toggle-button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
}

.form-content {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  position: relative;
}

.form-section {
  margin-bottom: 1.2rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.5rem;
}

.coordinates-display {
  display: flex;
  gap: 0.8rem;
}

.coordinate-group {
  flex: 1;
}

.coordinate-group label {
  display: block;
  font-size: 0.8rem;
  color: #777;
  margin-bottom: 0.3rem;
}

.coordinate-group input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
}

.coordinate-group input:disabled {
  background: #f5f5f5;
  color: #999;
}

.confidence-slider {
  margin-bottom: 0.8rem;
}

.confidence-slider input {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
}

.confidence-slider input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4285F4;
  cursor: pointer;
}

.confidence-slider input:disabled {
  opacity: 0.6;
}

.confidence-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #777;
  margin-top: 0.3rem;
}

.confidence-display {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.confidence-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: background 0.2s ease;
}

.confidence-dot.active {
  background: #4285F4;
}

textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.comment-length {
  text-align: right;
  font-size: 0.75rem;
  color: #777;
  margin-top: 0.3rem;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
}

.timer {
  display: flex;
  align-items: center;
  color: #555;
  font-size: 0.9rem;
  font-weight: 600;
}

.timer i {
  margin-right: 0.5rem;
  color: #f44336;
}

.action-buttons {
  display: flex;
  gap: 0.8rem;
}

.reset-button, .submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.reset-button {
  background: #f0f0f0;
  color: #666;
}

.reset-button:hover {
  background: #e0e0e0;
}

.reset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-button {
  background: #4285F4;
  color: white;
}

.submit-button:hover {
  background: #3367d6;
  transform: translateY(-2px);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.submit-button.submitted {
  background: #34A853;
}

.submission-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.8rem;
  background: #e6f4ea;
  border-radius: 4px;
  color: #34A853;
  font-weight: 600;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  font-size: 1.5rem;
  color: #4285F4;
}

.minimized-status {
  padding: 0.8rem 1rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.status-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #555;
  font-size: 0.9rem;
}

.status-text i {
  color: #34A853;
}

@media (max-width: 768px) {
  .coordinates-display {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 0.8rem;
    align-items: flex-start;
  }
  
  .action-buttons {
    width: 100%;
  }
  
  .reset-button, .submit-button {
    flex: 1;
    padding: 0.6rem 1rem;
  }
}
</style> 