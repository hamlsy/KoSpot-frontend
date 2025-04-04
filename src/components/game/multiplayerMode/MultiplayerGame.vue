<template>
  <div class="multiplayer-game">
    <!-- 게임 헤더 -->
    <div class="game-header">
      <div class="header-left">
        <button class="exit-button" @click="exitGame">
          <i class="fas fa-door-open"></i>
          나가기
        </button>
        <div class="room-info">
          <h2 class="room-name">{{ roomData.name }}</h2>
          <div class="game-mode">{{ roomData.gameMode }} - {{ roomData.region }}</div>
        </div>
      </div>
      
      <div class="header-center">
        <div class="round-info">
          <span class="round-number">라운드 {{ currentRound }}/{{ totalRounds }}</span>
          <div class="round-progress">
            <div 
              class="progress-bar" 
              :style="{ width: `${(currentRound / totalRounds) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <game-timer 
          :time="remainingTime"
          :warning-threshold="30"
          :danger-threshold="10"
        />
      </div>
    </div>
    
    <!-- 게임 메인 영역 -->
    <div class="game-content">
      <!-- 왼쪽 패널: 플레이어 목록 -->
      <div class="left-panel">
        <player-list 
          :players="players" 
          :current-user-id="currentUser.id"
          :show-scores="hasSubmittedGuess || roundEnded"
        />
      </div>
      
      <!-- 중앙 패널: 게임 화면 -->
      <div class="main-panel">
        <div class="game-view">
          <road-view 
            v-if="roomData.gameMode === '로드뷰'"
            :position="currentLocation"
            :show-controls="true"
            :prevent-mouse-events="roundEnded"
            @load-complete="onViewLoaded"
          />
          <photo-view
            v-else
            :photo-url="currentPhotoUrl"
            :prevent-interaction="roundEnded"
            @load-complete="onViewLoaded"
          />
        </div>
        
        <div class="map-container" :class="{ expanded: isMapExpanded }">
          <kakao-map
            ref="gameMap"
            :center="mapCenter"
            :marker-position="guessPosition"
            :actual-position="roundEnded ? actualLocation : null"
            :prevent-interaction="roundEnded"
            @marker-placed="onGuessPlaced"
          />
          <button 
            class="expand-map-button"
            @click="toggleMapExpansion"
            :title="isMapExpanded ? '맵 축소' : '맵 확대'"
          >
            <i :class="isMapExpanded ? 'fas fa-compress-alt' : 'fas fa-expand-alt'"></i>
          </button>
        </div>
      </div>
      
      <!-- 오른쪽 패널: 채팅 -->
      <div class="right-panel">
        <chat-window 
          :messages="chatMessages"
          @send-message="sendChatMessage"
        />
      </div>
    </div>
    
    <!-- 게임 하단 영역 -->
    <div class="game-footer">
      <div class="guess-info" v-if="guessPosition">
        <i class="fas fa-map-marker-alt"></i>
        <span class="coords">
          {{ formatCoords(guessPosition) }}
        </span>
      </div>
      
      <button 
        class="submit-button"
        @click="submitGuess"
        :disabled="!canSubmit"
      >
        <template v-if="!hasSubmittedGuess">
          <i class="fas fa-check"></i>
          위치 제출
        </template>
        <template v-else>
          <i class="fas fa-clock"></i>
          다른 플레이어 대기 중...
        </template>
      </button>
    </div>
    
    <!-- 라운드 결과 모달 -->
    <round-results
      v-if="showRoundResults"
      :visible="showRoundResults"
      :players="players"
      :actual-location="actualLocation"
      :round="currentRound"
      :total-rounds="totalRounds"
      :current-user-id="currentUser.id"
      :location-name="currentLocationName"
      :location-description="currentLocationDescription"
      :location-image="currentLocationImage"
      :interesting-fact="currentInterestingFact"
      @close="closeRoundResults"
      @next-round="startNextRound"
      @finish-game="finishGame"
    />
    
    <!-- 게임 결과 모달 -->
    <game-results
      v-if="showGameResults"
      :visible="showGameResults"
      :players="players"
      :room-data="roomData"
      @play-again="restartGame"
      @exit="exitToLobby"
    />
  </div>
</template>

<script>
import GameTimer from '@/components/game/common/shared/GameTimer.vue';
import PlayerList from '@/components/game/multiplayerMode/PlayerList.vue';
import RoadView from '@/components/game/common/roadview/RoadView.vue';
import PhotoView from '@/components/game/common/photo/PhotoView.vue';
import KakaoMap from '@/components/game/common/kakao/KakaoMap.vue';
import ChatWindow from '@/components/game/multiplayerMode/ChatWindow.vue';
import RoundResults from '@/components/game/multiplayerMode/RoundResults.vue';
import GameResults from '@/components/game/multiplayerMode/GameResults.vue';

export default {
  name: 'MultiplayerGame',
  
  components: {
    GameTimer,
    PlayerList,
    RoadView,
    PhotoView,
    KakaoMap,
    ChatWindow,
    RoundResults,
    GameResults
  },
  
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      roomData: {
        name: '멋진 게임방',
        gameMode: '로드뷰',
        region: '서울',
        maxPlayers: 4
      },
      currentUser: {
        id: 'user123',
        nickname: '김코스팟',
        level: 23,
        profileImage: '/assets/default-profile.png'
      },
      players: [],
      currentRound: 1,
      totalRounds: 5,
      remainingTime: 120,
      chatMessages: [],
      currentLocation: null,
      currentPhotoUrl: null,
      guessPosition: null,
      actualLocation: null,
      hasSubmittedGuess: false,
      roundEnded: false,
      showRoundResults: false,
      showGameResults: false,
      isMapExpanded: false,
      mapCenter: { lat: 36.5, lng: 127.5 }, // 한국 중심점
      currentLocationName: '',
      currentLocationDescription: '',
      currentLocationImage: '',
      currentInterestingFact: '',
      gameTimer: null
    };
  },
  
  computed: {
    canSubmit() {
      return this.guessPosition && !this.hasSubmittedGuess && !this.roundEnded;
    }
  },
  
  watch: {
    remainingTime(newValue) {
      if (newValue <= 0) {
        this.endRound();
      }
    }
  },
  
  created() {
    this.initializeGame();
  },
  
  beforeDestroy() {
    this.cleanup();
  },
  
  methods: {
    initializeGame() {
      // 실제 구현에서는 API 호출로 게임 데이터 초기화
      this.players = [
        {
          id: 'user123',
          nickname: '김코스팟',
          level: 23,
          profileImage: '/assets/default-profile.png',
          isHost: true,
          score: 0,
          streak: 0
        },
        {
          id: 'user456',
          nickname: '서울러버',
          level: 15,
          profileImage: '/assets/default-profile.png',
          score: 0,
          streak: 0
        }
      ];
      
      this.startRound();
    },
    
    startRound() {
      this.resetRoundState();
      this.startTimer();
      this.loadLocation();
    },
    
    resetRoundState() {
      this.guessPosition = null;
      this.hasSubmittedGuess = false;
      this.roundEnded = false;
      this.remainingTime = 120;
      this.players.forEach(player => {
        player.hasSubmitted = false;
      });
    },
    
    startTimer() {
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }
      
      this.gameTimer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        }
      }, 1000);
    },
    
    loadLocation() {
      // 실제 구현에서는 API에서 위치 데이터 로드
      this.currentLocation = {
        lat: 37.5796,
        lng: 126.9770
      };
      
      this.currentLocationName = '경복궁';
      this.currentLocationDescription = '조선시대의 법궁';
      this.currentLocationImage = '/img/locations/gyeongbokgung.jpg';
      this.currentInterestingFact = '경복궁은 1395년에 창건되었으며, 조선의 법궁으로서 가장 크고 화려한 궁궐이었습니다.';
    },
    
    onViewLoaded() {
      // 뷰 로딩 완료 처리
      console.log('View loaded');
    },
    
    onGuessPlaced(position) {
      this.guessPosition = position;
    },
    
    submitGuess() {
      if (!this.canSubmit) return;
      
      this.hasSubmittedGuess = true;
      const currentPlayer = this.players.find(p => p.id === this.currentUser.id);
      if (currentPlayer) {
        currentPlayer.hasSubmitted = true;
      }
      
      // 실제 구현에서는 서버로 추측 위치 전송
      console.log('Submitted guess:', this.guessPosition);
      
      // 테스트를 위해 모든 플레이어가 제출한 것으로 처리
      setTimeout(() => {
        this.players.forEach(player => {
          player.hasSubmitted = true;
        });
        this.endRound();
      }, 2000);
    },
    
    endRound() {
      if (this.roundEnded) return;
      
      this.roundEnded = true;
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }
      
      // 실제 위치 설정 (실제 구현에서는 서버에서 받아옴)
      this.actualLocation = this.currentLocation;
      
      // 점수 계산 및 업데이트
      this.calculateScores();
      
      // 라운드 결과 표시
      setTimeout(() => {
        this.showRoundResults = true;
      }, 1000);
    },
    
    calculateScores() {
      this.players.forEach(player => {
        // 실제 구현에서는 서버에서 계산된 점수를 받아옴
        player.score = Math.floor(Math.random() * 5000);
        player.distanceToTarget = Math.random() * 10;
      });
    },
    
    closeRoundResults() {
      this.showRoundResults = false;
    },
    
    startNextRound() {
      this.currentRound++;
      this.showRoundResults = false;
      
      if (this.currentRound > this.totalRounds) {
        this.endGame();
      } else {
        this.startRound();
      }
    },
    
    endGame() {
      this.showGameResults = true;
    },
    
    restartGame() {
      this.currentRound = 1;
      this.showGameResults = false;
      this.players.forEach(player => {
        player.score = 0;
        player.streak = 0;
      });
      this.startRound();
    },
    
    exitGame() {
      if (confirm('정말 게임을 나가시겠습니까?')) {
        this.exitToLobby();
      }
    },
    
    exitToLobby() {
      this.$router.push('/multiplayerLobby');
    },
    
    toggleMapExpansion() {
      this.isMapExpanded = !this.isMapExpanded;
    },
    
    sendChatMessage(message) {
      // 실제 구현에서는 웹소켓으로 전송
      const newMessage = {
        id: `msg${Date.now()}`,
        sender: this.currentUser.nickname,
        message: message,
        timestamp: new Date().toISOString()
      };
      
      this.chatMessages.push(newMessage);
    },
    
    formatCoords(coords) {
      if (!coords) return '';
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    },
    
    cleanup() {
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }
    }
  }
};
</script>

<style scoped>
.multiplayer-game {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.game-header {
  background: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.exit-button {
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.exit-button:hover {
  background: #f0f2f5;
  color: #333;
}

.room-info {
  display: flex;
  flex-direction: column;
}

.room-name {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.game-mode {
  font-size: 0.9rem;
  color: #666;
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
}

.round-info {
  text-align: center;
}

.round-number {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  display: block;
}

.round-progress {
  height: 6px;
  background: #e0e5ec;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.game-content {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.left-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.game-view {
  flex: 1;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.map-container {
  height: 200px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: height 0.3s ease;
}

.map-container.expanded {
  height: 400px;
}

.expand-map-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: all 0.2s ease;
  z-index: 1;
}

.expand-map-button:hover {
  transform: scale(1.1);
}

.right-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
}

.game-footer {
  background: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.guess-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.coords {
  font-family: monospace;
  font-size: 0.9rem;
}

.submit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 1200px) {
  .game-content {
    padding: 0.8rem;
    gap: 0.8rem;
  }
  
  .left-panel, .right-panel {
    width: 250px;
  }
}

@media (max-width: 900px) {
  .right-panel {
    display: none;
  }
}

@media (max-width: 640px) {
  .left-panel {
    display: none;
  }
  
  .header-center {
    margin: 0 1rem;
  }
  
  .room-name {
    font-size: 1rem;
  }
  
  .game-mode {
    font-size: 0.8rem;
  }
}
</style> 