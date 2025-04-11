<template>
  <div class="multiplayer-game-container">
    <!-- 대기실 모드 -->
    <game-room-waiting 
      v-if="gameState === 'waiting'"
      :room-id="roomId"
      @leave-room="exitToLobby"
      @start-game="onGameStart"
    />
    
    <!-- 게임 플레이 모드 -->
    <div v-else-if="gameState === 'playing'" class="multiplayer-game">
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
    </div>
    
    <!-- 게임 결과 모달 -->
    <game-results
      v-if="showGameResults"
      :visible="showGameResults"
      :players="players"
      :room-data="roomData"
      @play-again="restartGame"
      @exit="exitToLobby"
    />
    
    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<script>
import GameTimer from '@/components/game/common/shared/GameTimer.vue';
import PlayerList from './PlayerList.vue';
import RoadView from '@/components/game/common/roadview/RoadView.vue';
import PhotoView from '@/components/game/common/photo/PhotoView.vue';
import KakaoMap from '@/components/game/common/kakao/KakaoMap.vue';
import ChatWindow from '../lobbyScreen/ChatWindow.vue';
import RoundResults from './RoundResults.vue';
import GameResults from './GameResults.vue';
import GameRoomWaiting from '../gameRoomScreen/GameRoomWaiting.vue';

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
    GameResults,
    GameRoomWaiting
  },
  
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      // 게임 상태 (waiting: 대기실, playing: 게임 중)
      gameState: 'waiting',
      
      // 게임 방 정보
      roomData: {
        name: '멋진 게임방',
        gameMode: '로드뷰',
        region: '서울',
        maxPlayers: 4
      },
      
      // 현재 사용자 정보
      currentUser: {
        id: 'user123',
        nickname: '김코스팟',
        level: 23,
        profileImage: '/assets/default-profile.png'
      },
      
      // 게임 플레이 데이터
      players: [],
      currentRound: 1,
      totalRounds: 5,
      remainingTime: 120,
      chatMessages: [],
      currentLocation: null,
      currentPhotoUrl: null,
      actualLocation: null,
      currentLocationName: '',
      currentLocationDescription: '',
      currentLocationImage: '',
      currentInterestingFact: '',
      guessPosition: null,
      mapCenter: { lat: 36.5, lng: 127.5 },
      isMapExpanded: false,
      roundTimer: null,
      hasSubmittedGuess: false,
      roundEnded: false,
      showRoundResults: false,
      showGameResults: false,
      isLoading: false,
      canSubmit: false
    };
  },
  
  computed: {
    // 기존 computed 속성
  },
  
  methods: {
    // 대기실 → 게임 전환
    onGameStart() {
      this.isLoading = true;
      
      // 게임 데이터 초기화 및 로드
      setTimeout(() => {
        this.gameState = 'playing';
        this.initializeGame();
        this.isLoading = false;
      }, 1000);
    },
    
    // 게임 초기화
    initializeGame() {
      this.currentRound = 1;
      this.hasSubmittedGuess = false;
      this.roundEnded = false;
      this.showRoundResults = false;
      this.showGameResults = false;
      
      // 게임 위치 데이터 로드
      this.loadLocationData();
      
      // 타이머 시작
      this.startRoundTimer();
    },
    
    // 게임 종료 후 대기실로 돌아가기
    returnToWaitingRoom() {
      this.gameState = 'waiting';
      
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
    },
    
    // 로비로 나가기
    exitToLobby() {
      // 타이머 정리
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
      
      // 로비로 이동
      this.$router.push('/multiplayerLobby');
    },
    
    // 게임 도중 나가기
    exitGame() {
      if (confirm('정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다.')) {
        this.returnToWaitingRoom();
      }
    },
    
    // 위치 데이터 로드
    loadLocationData() {
      // 실제 구현에서는 API 호출
      
      // 테스트 데이터
      this.currentLocation = { lat: 37.5665, lng: 126.9780 }; // 서울
      this.actualLocation = { lat: 37.5665, lng: 126.9780 };
      this.currentLocationName = '서울 광화문';
      this.currentLocationDescription = '서울 중심부에 위치한 역사적 장소';
      this.currentLocationImage = '/assets/locations/gwanghwamun.jpg';
      this.currentInterestingFact = '광화문은 조선시대 경복궁의 남쪽에 있는 정문입니다.';
      
      // 테스트용 플레이어 데이터
      this.players = [
        {
          id: 'user123',
          nickname: '김코스팟',
          level: 23,
          profileImage: '/assets/default-profile.png',
          isHost: true,
          score: 0,
          totalScore: 0,
          guessPosition: null,
          distance: null,
          hasSubmitted: false
        },
        {
          id: 'user456',
          nickname: '지리학자',
          level: 45,
          profileImage: '/assets/avatar1.png',
          isHost: false,
          score: 0,
          totalScore: 0,
          guessPosition: null,
          distance: null,
          hasSubmitted: false
        },
        {
          id: 'user789',
          nickname: '여행마니아',
          level: 31,
          profileImage: '/assets/avatar2.png',
          isHost: false,
          score: 0,
          totalScore: 0,
          guessPosition: null,
          distance: null,
          hasSubmitted: false
        }
      ];
    },
    
    // 좌표 포맷팅
    formatCoords(position) {
      if (!position) return '';
      
      const lat = position.lat.toFixed(4);
      const lng = position.lng.toFixed(4);
      return `${lat}, ${lng}`;
    },
    
    // 추측 위치 설정
    onGuessPlaced(position) {
      this.guessPosition = position;
      this.canSubmit = true;
    },
    
    // 맵 확대/축소 토글
    toggleMapExpansion() {
      this.isMapExpanded = !this.isMapExpanded;
    },
    
    // 로드뷰/사진 로딩 완료
    onViewLoaded() {
      // 로딩 관련 로직
    },
    
    // 채팅 메시지 전송
    sendChatMessage(message) {
      // 채팅 메시지 처리
      if (!message.trim()) return;
      
      const newMessage = {
        id: `chat-${Date.now()}`,
        sender: this.currentUser.nickname,
        message: message,
        timestamp: new Date(),
        system: false
      };
      
      this.chatMessages.push(newMessage);
    },
    
    // 라운드 타이머 시작
    startRoundTimer() {
      this.remainingTime = 120; // 2분
      
      this.roundTimer = setInterval(() => {
        this.remainingTime--;
        
        if (this.remainingTime <= 0) {
          clearInterval(this.roundTimer);
          this.endRound();
        }
      }, 1000);
    },
    
    // 추측 제출
    submitGuess() {
      if (!this.guessPosition || this.hasSubmittedGuess) return;
      
      this.hasSubmittedGuess = true;
      
      // 플레이어 데이터 업데이트
      const playerIndex = this.players.findIndex(p => p.id === this.currentUser.id);
      if (playerIndex !== -1) {
        this.players[playerIndex].hasSubmitted = true;
        this.players[playerIndex].guessPosition = this.guessPosition;
      }
      
      // 모든 플레이어가 제출했는지 확인
      const allSubmitted = this.players.every(p => p.hasSubmitted);
      if (allSubmitted) {
        clearInterval(this.roundTimer);
        this.endRound();
      }
    },
    
    // 라운드 종료
    endRound() {
      this.roundEnded = true;
      
      // 점수 계산
      this.calculateScores();
      
      // 결과 표시
      setTimeout(() => {
        this.showRoundResults = true;
      }, 1000);
    },
    
    // 점수 계산
    calculateScores() {
      // 각 플레이어의 점수 계산
      this.players.forEach(player => {
        if (!player.guessPosition) {
          // 제출하지 않은 경우
          player.distance = Infinity;
          player.score = 0;
        } else {
          // 거리 계산 (실제로는 Haversine 공식 등 사용)
          const dx = player.guessPosition.lat - this.actualLocation.lat;
          const dy = player.guessPosition.lng - this.actualLocation.lng;
          const distance = Math.sqrt(dx * dx + dy * dy) * 111; // 대략적인 km 변환
          
          player.distance = distance;
          
          // 거리에 따른 점수 계산
          if (distance < 1) {
            player.score = 5000;
          } else if (distance < 5) {
            player.score = 4000 - (distance - 1) * 300;
          } else if (distance < 10) {
            player.score = 2500 - (distance - 5) * 200;
          } else if (distance < 50) {
            player.score = 1500 - (distance - 10) * 30;
          } else {
            player.score = Math.max(0, 500 - (distance - 50) * 10);
          }
          
          player.score = Math.round(player.score);
          player.totalScore += player.score;
        }
      });
      
      // 점수 기준으로 정렬
      this.players.sort((a, b) => b.score - a.score);
    },
    
    // 결과 창 닫기
    closeRoundResults() {
      this.showRoundResults = false;
    },
    
    // 다음 라운드 시작
    startNextRound() {
      this.currentRound++;
      
      if (this.currentRound > this.totalRounds) {
        // 게임 종료
        this.finishGame();
        return;
      }
      
      // 라운드 초기화
      this.guessPosition = null;
      this.hasSubmittedGuess = false;
      this.roundEnded = false;
      this.showRoundResults = false;
      
      // 플레이어 데이터 초기화
      this.players.forEach(player => {
        player.guessPosition = null;
        player.distance = null;
        player.hasSubmitted = false;
        player.score = 0;
      });
      
      // 새 위치 데이터 로드
      this.loadLocationData();
      
      // 타이머 재시작
      this.startRoundTimer();
    },
    
    // 게임 종료
    finishGame() {
      // 최종 점수로 정렬
      this.players.sort((a, b) => b.totalScore - a.totalScore);
      
      // 결과 표시
      this.showGameResults = true;
    },
    
    // 다시 플레이
    restartGame() {
      this.showGameResults = false;
      this.returnToWaitingRoom();
    }
  },
  
  mounted() {
    // 게임 방 정보 로드
    // 실제 구현에서는 API 호출로 대체
    console.log(`Loading game room: ${this.roomId}`);
  },
  
  beforeDestroy() {
    // 타이머 정리
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
  }
};
</script>

<style scoped>
.multiplayer-game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.multiplayer-game {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

/* 게임 헤더 스타일 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.exit-button:hover {
  background-color: #e2e8f0;
}

.room-info {
  margin-left: 1rem;
}

.room-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.game-mode {
  font-size: 0.875rem;
  color: #64748b;
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
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.25rem;
}

.round-progress {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #3b82f6);
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

/* 게임 컨텐츠 스타일 */
.game-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 250px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.game-view {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 300px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 5;
  transition: all 0.3s ease;
}

.map-container.expanded {
  width: 60%;
  height: 60%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.expand-map-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: white;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.right-panel {
  width: 300px;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

/* 게임 푸터 스타일 */
.game-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.guess-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-weight: 500;
}

.guess-info i {
  color: #3b82f6;
}

.submit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #4338ca;
}

.submit-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

/* 로딩 오버레이 스타일 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.loading-spinner i {
  font-size: 3rem;
}

/* 반응형 스타일 */
@media (max-width: 1200px) {
  .left-panel {
    width: 200px;
  }
  
  .right-panel {
    width: 250px;
  }
}

@media (max-width: 992px) {
  .game-content {
    flex-direction: column;
  }
  
  .left-panel, .right-panel {
    width: 100%;
    height: auto;
  }
  
  .main-panel {
    order: -1;
    height: 50vh;
  }
  
  .map-container.expanded {
    width: 80%;
    height: 80%;
  }
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    padding: 0.5rem;
  }
  
  .header-center {
    margin: 1rem 0;
    max-width: 100%;
  }
  
  .header-right {
    align-self: flex-end;
  }
}
</style> 