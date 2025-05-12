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
          :zoom-level="3"
          :player-guesses="playerGuesses"
          :show-distance-lines="true"
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
      this.initMap();
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
        mapContainer.style.height = '500px'; // 지도 높이 증가
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
                this.$refs.resultMap.drawPlayerDistanceLines(); // 거리 선 표시 명시적 호출
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
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  display: block;
  margin: 0 1.5rem 1.5rem 1.5rem;
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