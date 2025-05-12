<template>
  <div class="round-results" v-if="visible" v-show="visible">
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
      
      <!-- 실제 위치 정보 -->
      <div class="location-info">
        <div class="location-map">
          <kakao-map
            :center="actualLocation"
            :marker-position="null"
            :actual-position="actualLocation"
            :prevent-interaction="true"
            :show-marker-hint="false"
            :zoom-level="4"
            :player-guesses="playerGuesses"
            :show-distance-lines="true"
            ref="resultMap"
          />
        </div>
        
      </div>
      
      <!-- 플레이어 점수 -->
      <div class="score-board">
        <h3 class="scores-title">플레이어 점수</h3>
        
        <div class="player-scores">
          <div 
            v-for="(player, index) in sortedPlayers" 
            :key="player.id"
            class="player-score-row"
            :class="{ 
              'current-user': player.id === currentUserId,
              'first-place': index === 0
            }"
          >
            <div class="rank">{{ index + 1 }}</div>
            
            <div class="player-info">
              <div class="player-avatar">
                <img 
                  :src="player.profileImage" 
                  :alt="player.nickname"
                  class="avatar-image"
                />
                <div class="player-level">{{ player.level }}</div>
              </div>
              
              <div class="player-name">
                {{ player.nickname }}
                <span class="host-badge" v-if="player.isHost">방장</span>
              </div>
            </div>
            
            <div class="score-details">
              <div class="distance">
                <i class="fas fa-map-marker-alt"></i>
                {{ formatDistance(player.distanceToTarget) }}
              </div>
              
              <div class="score">
                <i class="fas fa-star"></i>
                {{ formatNumber(player.score) }}점
              </div>
              
              <div class="streak" v-if="player.streak > 0">
                <i class="fas fa-fire"></i>
                {{ player.streak }}
              </div>
            </div>
          </div>
        </div>
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
    visible: {
      type: Boolean,
      default: false
    },
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
    visible(newVal) {
      if (newVal) {
        // 모달이 표시될 때 지도 초기화 작업 수행
        this.$nextTick(() => {
          setTimeout(() => {
            this.initMap();
          }, 300); // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 지도 초기화
        });
      }
    },
    
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
    if (this.visible) {
      this.$nextTick(() => {
        this.initMap();
      });
    }
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
      // 지도 컨테이너가 준비되었는지 확인
      if (this.$refs.resultMap && window.kakao && window.kakao.maps) {
        console.log('지도 초기화 시작');
        
        // 지도 컨테이너 요소 확인
        const mapContainer = this.$refs.resultMap.$el;
        if (!mapContainer) {
          console.error('지도 컨테이너를 찾을 수 없습니다.');
          return;
        }
        
        // 지도 컨테이너 크기 설정 및 가시성 확인
        mapContainer.style.width = '100%';
        mapContainer.style.height = '300px';
        mapContainer.style.display = 'block';
        
        // 카카오맵 API가 로드되었는지 확인
        if (typeof kakao === 'undefined' || !kakao.maps) {
          console.error('카카오맵 API가 로드되지 않았습니다.');
          return;
        }
        
        try {
          // 지도 초기화 트리거
          this.$refs.resultMap.initMap();
          
          // 실제 위치와 플레이어 추측 위치가 있으면 지도에 맞춤
          if (this.actualLocation && this.actualLocation.lat && this.actualLocation.lng) {
            // 약간의 지연을 두어 지도가 완전히 로드된 후 마커와 선을 표시
            setTimeout(() => {
              if (this.$refs.resultMap) {
                this.$refs.resultMap.fitMapToAllMarkers();
              }
            }, 500);
          }
          
          console.log('지도 초기화 완료');
        } catch (error) {
          console.error('지도 초기화 중 오류 발생:', error);
        }
      } else {
        console.error('지도 컴포넌트 또는 카카오맵 API를 찾을 수 없습니다.');
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.results-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

.location-map {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  display: block;
  min-height: 300px;
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

/* 점수 보드 */
.score-board {
  padding: 1.5rem;
}

.scores-title {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  color: #333;
}

.player-scores {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.player-score-row {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.player-score-row:hover {
  background: #f0f2f5;
}

.player-score-row.current-user {
  background: #EBF3FF;
}

.player-score-row.first-place {
  background: linear-gradient(to right, #FEF9C3, #FEF5E7);
}

.rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 1rem;
}

.player-score-row.first-place .rank {
  background: linear-gradient(135deg, #FFD700, #FFC107);
  color: #784212;
  box-shadow: 0 2px 4px rgba(255, 193, 7, 0.5);
}

.player-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.player-avatar {
  position: relative;
  margin-right: 0.8rem;
}

.avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.player-level {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #555;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.player-name {
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.host-badge {
  background: #4285F4;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
}

.score-details {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.distance, .score, .streak {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.distance i {
  color: #E53935;
}

.score {
  font-weight: 600;
  color: #333;
}

.score i {
  color: #FFC107;
}

.streak i {
  color: #FF5722;
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