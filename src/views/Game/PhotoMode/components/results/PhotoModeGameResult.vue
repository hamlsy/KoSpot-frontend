<template>
  <div class="game-result" v-if="visible">
    <div class="result-overlay" @click.self="close">
      <div class="result-card">
        <div class="result-header">
          <h2>게임 결과</h2>
          <button class="close-button" @click="close" title="닫기">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="result-content">
          <div class="summary-section">
            <div class="summary-card">
              <div class="summary-icon">
                <i class="fas fa-trophy"></i>
              </div>
              <div class="summary-details">
                <h3>최종 점수</h3>
                <div class="total-score">{{ totalScore }} 점</div>
              </div>
            </div>
            
            <div class="score-distribution">
              <div class="correct-count">
                <div class="count-value">{{ correctCount }}</div>
                <div class="count-label">정답</div>
              </div>
              <div class="wrong-count">
                <div class="count-value">{{ wrongCount }}</div>
                <div class="count-label">오답</div>
              </div>
              <div class="average-time">
                <div class="time-value">{{ formattedAverageTime }}</div>
                <div class="time-label">평균 시간</div>
              </div>
            </div>
          </div>
          
          <div class="rounds-section">
            <h3 class="section-title">라운드별 결과</h3>
            
            <div class="rounds-list">
              <div 
                v-for="(round, index) in rounds" 
                :key="index"
                class="round-item"
                :class="{ 'correct': round.isCorrect, 'wrong': !round.isCorrect }"
              >
                <div class="round-number">{{ index + 1 }}라운드</div>
                <div class="round-location">{{ round.locationName }}</div>
                <div class="round-score">{{ round.score }}점</div>
                <div class="round-time">{{ formatTime(round.time) }}</div>
                <div class="round-status">
                  <i :class="round.isCorrect ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                </div>
              </div>
            </div>
          </div>
          
          <div class="rank-section" v-if="showRank">
            <h3 class="section-title">랭킹 정보</h3>
            
            <div class="rank-info">
              <div class="rank-card">
                <div class="rank-value">{{ rank }}</div>
                <div class="rank-label">전체 순위</div>
              </div>
              
              <div class="rank-card">
                <div class="rank-value">{{ rankPercentile }}%</div>
                <div class="rank-label">상위 퍼센트</div>
              </div>
              
              <div class="rank-card">
                <div class="rank-change" :class="{ 'positive': rankPointChange > 0, 'negative': rankPointChange < 0 }">
                  <i :class="rankPointChange > 0 ? 'fas fa-caret-up' : 'fas fa-caret-down'"></i>
                  {{ Math.abs(rankPointChange) }}
                </div>
                <div class="rank-label">랭크 포인트 변화</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="result-actions">
          <button class="replay-button" @click="replay">
            <i class="fas fa-redo"></i> 다시 하기
          </button>
          
          <button class="main-button" @click="goToMain">
            <i class="fas fa-home"></i> 메인으로
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameResult',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    totalScore: {
      type: Number,
      default: 0
    },
    correctCount: {
      type: Number,
      default: 0
    },
    wrongCount: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number, // 초 단위
      default: 0
    },
    rounds: {
      type: Array,
      default: () => []
    },
    showRank: {
      type: Boolean,
      default: false
    },
    rank: {
      type: Number,
      default: 0
    },
    rankPercentile: {
      type: Number,
      default: 0
    },
    rankPointChange: {
      type: Number,
      default: 0
    }
  },
  
  computed: {
    formattedAverageTime() {
      return this.formatTime(this.averageTime);
    }
  },
  
  methods: {
    close() {
      this.$emit('close');
    },
    
    replay() {
      this.$emit('replay');
    },
    
    goToMain() {
      this.$emit('go-to-main');
    },

    formatTime(seconds) {
      if (!seconds && seconds !== 0) return '-';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      
      if (minutes > 0) {
        return `${minutes}분 ${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}초`;
      } else {
        return `${remainingSeconds}초`;
      }
    }
  }
};
</script>

<style scoped>
.game-result {
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

.result-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
}

.result-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.close-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #f1f5f9;
  color: #334155;
  transform: rotate(90deg);
}

.result-content {
  padding: 2rem;
}

.summary-section {
  margin-bottom: 2.5rem;
}

.summary-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
  color: white;
}

.summary-icon {
  font-size: 3rem;
  margin-right: 1.5rem;
  opacity: 0.9;
}

.summary-details {
  flex: 1;
}

.summary-details h3 {
  font-size: 1.2rem;
  margin: 0;
  margin-bottom: 0.5rem;
  opacity: 0.9;
  font-weight: 500;
}

.total-score {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.score-distribution {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  text-align: center;
}

.correct-count, .wrong-count, .average-time {
  flex: 1;
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.correct-count:hover, .wrong-count:hover, .average-time:hover {
  transform: translateY(-5px);
}

.count-value, .time-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.correct-count .count-value {
  color: #10b981;
}

.wrong-count .count-value {
  color: #ef4444;
}

.average-time .time-value {
  color: #6366f1;
  font-size: 1.25rem;
}

.count-label, .time-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.section-title {
  font-size: 1.25rem;
  margin-top: 0;
  margin-bottom: 1.25rem;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.rounds-section {
  margin-bottom: 2.5rem;
}

.rounds-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.round-item {
  display: grid;
  grid-template-columns: 0.8fr 2fr 0.8fr 1fr 0.6fr;
  align-items: center;
  padding: 1rem;
  border-radius: 10px;
  background-color: #f8fafc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.round-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.round-item.correct {
  border-left: 4px solid #10b981;
}

.round-item.wrong {
  border-left: 4px solid #ef4444;
}

.round-number {
  font-weight: 600;
  color: #1e293b;
}

.round-location {
  color: #334155;
  font-weight: 500;
}

.round-score {
  font-weight: 600;
  color: #1e293b;
}

.round-time {
  color: #64748b;
}

.round-status {
  display: flex;
  justify-content: center;
  font-size: 1.25rem;
}

.round-item.correct .round-status i {
  color: #10b981;
}

.round-item.wrong .round-status i {
  color: #ef4444;
}

.rank-section {
  margin-bottom: 1.5rem;
}

.rank-info {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.rank-card {
  flex: 1;
  padding: 1.25rem;
  background-color: #f8fafc;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.rank-card:hover {
  transform: translateY(-5px);
}

.rank-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.rank-change {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.rank-change.positive {
  color: #10b981;
}

.rank-change.negative {
  color: #ef4444;
}

.rank-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e2e8f0;
  background-color: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.replay-button, .main-button {
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.replay-button {
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
}

.replay-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
}

.main-button {
  background-color: #f1f5f9;
  color: #334155;
}

.main-button:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
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
    width: 95%;
    max-height: 85vh;
  }
  
  .result-header {
    padding: 1rem 1.5rem;
  }
  
  .result-header h2 {
    font-size: 1.5rem;
  }
  
  .result-content {
    padding: 1.5rem;
  }
  
  .summary-card {
    padding: 1.25rem;
  }
  
  .summary-icon {
    font-size: 2.5rem;
    margin-right: 1rem;
  }
  
  .total-score {
    font-size: 2rem;
  }
  
  .score-distribution {
    flex-direction: column;
  }
  
  .round-item {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    gap: 0.5rem;
    padding: 1rem;
  }
  
  .round-number {
    grid-row: 1;
    grid-column: 1;
  }
  
  .round-location {
    grid-row: 2;
    grid-column: 1 / span 3;
    margin-top: 0.25rem;
  }
  
  .round-score {
    grid-row: 1;
    grid-column: 2;
    text-align: right;
  }
  
  .round-time {
    grid-row: 3;
    grid-column: 1;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
  
  .round-status {
    grid-row: 3;
    grid-column: 3;
    justify-content: flex-end;
  }
  
  .rank-info {
    flex-direction: column;
  }
  
  .result-actions {
    flex-direction: column;
    padding: 1rem 1.5rem;
  }
  
  .replay-button, .main-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .round-item {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 0.5rem;
    padding: 0.875rem;
  }
  
  .round-number {
    grid-row: 1;
    grid-column: 1;
  }
  
  .round-score {
    grid-row: 1;
    grid-column: 2;
    text-align: right;
  }
  
  .round-location {
    grid-row: 2;
    grid-column: 1 / span 2;
    font-size: 0.9rem;
  }
  
  .round-time {
    grid-row: 3;
    grid-column: 1;
    font-size: 0.8rem;
  }
  
  .round-status {
    grid-row: 3;
    grid-column: 2;
    font-size: 1rem;
  }
}
</style> 