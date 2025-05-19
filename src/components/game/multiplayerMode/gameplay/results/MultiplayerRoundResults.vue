<template>
  <div class="round-results">
    <div class="results-container">
      <!-- 헤더 -->
      <div class="results-header">
        <div class="header-left">
          <h2 class="round-title">라운드 {{ round }} 결과</h2>
          <div class="round-info">
            <span>{{ totalRounds - round }}라운드 남음</span>
          </div>
        </div>
        
        <div class="header-right">
          <button 
            class="close-button" 
            @click="close"
            v-if="!isLastRound"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <!-- 확장된 지도 영역 -->
      <div class="map-container">
        <kakao-map
          :center="actualLocation"
          :marker-position="null"
          :actual-position="actualLocation"
          :prevent-interaction="false"
          :show-marker-hint="false"
          :zoom-level="5"
          :player-guesses="playerGuesses"
          :show-distance-lines="true"
          :fitAllMarkers="true"
          ref="resultMap"
        />
      </div>
      
      <!-- 하단 버튼 -->
      <div class="results-footer">
        <button 
          v-if="isLastRound" 
          class="action-button finish-button"
          @click="finishGame"
        >
          <i class="fas fa-trophy"></i>
          게임 결과 보기
        </button>
        <button 
          v-else
          class="action-button next-button"
          @click="nextRound"
        >
          <i class="fas fa-arrow-right"></i>
          다음 라운드
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import KakaoMap from '@/components/game/common/kakao/KakaoMap.vue';

export default {
  name: 'RoundResults',
  
  components: {
    KakaoMap
  },
  
  props: {
    players: {
      type: Array,
      default: () => []
    },
    actualLocation: {
      type: Object,
      default: () => ({})
    },
    round: {
      type: Number,
      default: 1
    },
    totalRounds: {
      type: Number,
      default: 5
    },
    currentUserId: {
      type: String,
      default: ''
    },
    locationName: {
      type: String,
      default: ''
    },
    locationDescription: {
      type: String,
      default: ''
    },
    locationImage: {
      type: String,
      default: ''
    },
    interestingFact: {
      type: String,
      default: ''
    },
    playerGuesses: {
      type: Array,
      default: () => []
    }
  },
  
  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => b.score - a.score);
    },
    
    isLastRound() {
      return this.round === this.totalRounds;
    },
    
    // 플레이어 추측 위치에 대한 마커 정보 계산
    playerMarkers() {
      return this.playerGuesses.map(guess => ({
        position: guess.position,
        color: guess.color,
        playerName: guess.playerName
      }));
    }
  },
  
  watch: {
    
    // actualLocation이 변경될 때도 지도 초기화
    actualLocation: {
      handler(newVal) {
        if (newVal && this.visible) {
          this.$nextTick(() => {
            setTimeout(() => {
              this.initMap();
            }, 300);
          });
        }
      },
      deep: true
    },
    
    // playerGuesses가 변경될 때도 지도 초기화
    playerGuesses: {
      handler(newVal) {
        if (newVal && newVal.length > 0 && this.visible) {
          this.$nextTick(() => {
            setTimeout(() => {
              this.initMap();
            }, 300);
          });
        }
      },
      deep: true
    }
  },
  
  mounted() {
    // 컴포넌트가 마운트될 때 지도 초기화
    this.$nextTick(() => {
      // 지도 초기화 전 약간의 지연을 주어 DOM이 완전히 렌더링되도록 함
      setTimeout(() => {
        this.initMap();
      }, 300);
    });
  },
  
  methods: {
    formatDistance(distance) {
      if (distance === null || distance === undefined) return '?';
      
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      } else {
        return `${distance.toFixed(2)}km`;
      }
    },
    
    formatNumber(num) {
      if (num === null || num === undefined) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    initMap() {
      // 지도 초기화 메서드
      if (this.$refs.resultMap) {
        console.log('지도 초기화 시작');
        
        // 지도 렌더링 완료 후 플레이어 추측 표시
        setTimeout(() => {
          if (this.$refs.resultMap) {
            // 모든 마커가 보이도록 지도 범위 조정
            setTimeout(() => {
              if (this.$refs.resultMap) {
                this.$refs.resultMap.fitMapToAllMarkers();
              }
            }, 300);
          }
        }, 500);
      }
    },
    
    close() {
      this.$emit('close');
    },
    
    nextRound() {
      this.$emit('next-round');
    },
    
    finishGame() {
      this.$emit('finish-game');
    }
  }
};
</script>

<style scoped>
.round-results {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: white;
}

.results-container {
  animation: slideUp 0.4s ease;
}

/* 헤더 */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.round-title {
  margin: 0;
  font-size: 1.6rem;
  color: #333;
  font-weight: 600;
}

.round-info {
  margin-top: 0.3rem;
  font-size: 0.9rem;
  color: #666;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #999;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f5f5f5;
  color: #333;
}

/* 위치 정보 */
.location-info {
  display: flex;
  padding: 1.5rem;
  gap: 1.5rem;
  border-bottom: 1px solid #eee;
}

.location-details {
  width: 100%;
}

.location-name {
  font-size: 1.4rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.location-description {
  color: #555;
  margin-bottom: 1rem;
  line-height: 1.5;
}

/* 확장된 지도 컨테이너 */
.map-container {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;
  margin: 0.5rem 1rem 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  height: calc(100% - 120px);
  position: relative;
  background-color: #f8f9fa;
  min-height: 400px;
}

.interesting-fact {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.interesting-fact h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.interesting-fact p {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
}

.location-image {
  margin-top: 1rem;
}

.location-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}



/* 푸터 */
.results-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
}

.action-button {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.next-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.next-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.finish-button {
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.3);
}

.finish-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 152, 0, 0.4);
}

/* 애니메이션 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .location-info {
    flex-direction: column;
  }
  
  .location-map {
    width: 100%;
  }
  
  .score-details {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
  }
  
  .rank {
    width: 25px;
    height: 25px;
    font-size: 0.9rem;
  }
  
  .avatar-image {
    width: 35px;
    height: 35px;
  }
}

@media (max-width: 480px) {
  .results-container {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .results-header, .location-info, .score-board, .results-footer {
    padding: 1rem;
  }
  
  .round-title {
    font-size: 1.3rem;
  }
  
  .player-score-row {
    padding: 0.6rem;
  }
  
  .player-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
  
  .player-avatar {
    margin-right: 0;
  }
}
</style> 