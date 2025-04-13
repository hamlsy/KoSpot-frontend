<template>
  <div class="multiplayer-roadview-game">
    <!-- 게임 헤더 -->
    <div class="game-header">
      <div class="header-left">
        <button class="exit-button" @click="exitGame">
          <i class="fas fa-door-open"></i>
          나가기
        </button>
        <div class="room-info">
          <h2 class="room-name">{{ gameStore.state.roomData.name }}</h2>
          <div class="game-mode">
            {{ gameStore.state.roomData.gameMode }} - {{ gameStore.state.roomData.region }}
          </div>
        </div>
      </div>
      
      <div class="header-center">
        <div class="round-info">
          <span class="round-number">
            라운드 {{ gameStore.state.currentRound }}/{{ gameStore.state.totalRounds }}
          </span>
          <div class="round-progress">
            <div 
              class="progress-bar" 
              :style="{ width: `${(gameStore.state.currentRound / gameStore.state.totalRounds) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <game-timer 
          :initialTime="gameStore.state.remainingTime"
          :totalTime="120"
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
          :players="gameStore.state.players" 
          :current-user-id="gameStore.state.currentUser.id"
          :show-scores="gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded"
        />
      </div>
      
      <!-- 중앙 패널: 게임 화면 -->
      <div class="main-panel">
        <div class="game-view">
          <!-- 실제 로드뷰 컴포넌트 -->
          <road-view 
            :position="gameStore.state.currentLocation"
            :show-controls="true"
            :prevent-mouse-events="gameStore.state.roundEnded"
            @load-complete="onViewLoaded"
          />
          
          <!-- 지도 토글 버튼 (로드뷰 내부) -->
          <button 
            v-if="!isPhoneMapOpen" 
            class="map-toggle"
            @click="togglePhoneMap"
          >
            <i class="fas fa-map-marked-alt"></i>
            지도 열기
          </button>
        </div>
        
        <!-- 휴대폰 지도 프레임 -->
        <div class="phone-frame" v-if="isPhoneMapOpen">
          <div class="phone-header">
            <div class="phone-notch"></div>
          </div>
          <div class="phone-content">
            <KakaoMapGame
              :isOpen="true"
              :centerLocation="mapCenter"
              :actualLocation="gameStore.state.roundEnded ? gameStore.state.actualLocation : null"
              :showHintCircles="false"
              :disabled="gameStore.state.roundEnded"
              :showDistance="false"
              :showActionButton="false"
              @close="togglePhoneMap"
              @check-answer="submitGuess"
              ref="phoneMapGame"
              class="phone-map"
            />
            
            <!-- Spot 버튼 (휴대폰 프레임 내부) -->
            <button v-if="!gameStore.state.roundEnded" 
              class="phone-spot-button"
              @click="submitGuessFromPhoneMap"
            >
              <i class="fas fa-crosshairs"></i> Spot!
            </button>
          </div>
          <div class="phone-footer">
            <div class="home-button" @click="togglePhoneMap"></div>
          </div>
        </div>
      </div>
      
      <!-- 오른쪽 패널: 채팅 -->
      <div class="right-panel">
        <chat-window 
          :messages="gameStore.state.chatMessages"
          @send-message="sendChatMessage"
        />
      </div>
    </div>
    
    <!-- 라운드 결과 모달 -->
    <round-results
      v-if="gameStore.state.showRoundResults"
      :visible="gameStore.state.showRoundResults"
      :players="gameStore.state.players"
      :actual-location="gameStore.state.actualLocation"
      :round="gameStore.state.currentRound"
      :total-rounds="gameStore.state.totalRounds"
      :current-user-id="gameStore.state.currentUser.id"
      :location-name="gameStore.state.locationInfo.name"
      :location-description="gameStore.state.locationInfo.description"
      :location-image="gameStore.state.locationInfo.image"
      :interesting-fact="gameStore.state.locationInfo.fact"
      @close="closeRoundResults"
      @next-round="startNextRound"
      @finish-game="finishGame"
    />
    
    <!-- 게임 결과 모달 -->
    <game-results
      v-if="gameStore.state.showGameResults"
      :visible="gameStore.state.showGameResults"
      :players="gameStore.state.players"
      :room-data="gameStore.state.roomData"
      @play-again="restartGame"
      @exit="exitToLobby"
    />
    
    <!-- 토스트 메시지 -->
    <div class="toast-message" v-if="showToast">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import GameTimer from '@/components/game/common/shared/GameTimer.vue';
import PlayerList from '../PlayerList.vue';
import RoadView from '@/components/game/common/roadview/RoadView.vue';
// KakaoMap은 RoundResults에서 결과 표시에 사용
import KakaoMap from '@/components/game/common/kakao/KakaoMap.vue';
import ChatWindow from '../../lobbyScreen/ChatWindow.vue';
import RoundResults from '../RoundResults.vue';
import GameResults from '../GameResults.vue';
import PhoneMapFrame from '@/components/game/common/phoneMapFrame/PhoneMapFrame.vue';
import gameStore from '@/store/gameStore';
import { getRandomLocation } from '../../MultiplayerGameTestData';
import KakaoMapGame from '@/components/game/common/kakao/KakaoMapGame.vue';

export default {
  name: 'MultiplayerRoadViewGame',
  
  components: {
    GameTimer,
    PlayerList,
    RoadView,
    // RoundResults에서 결과화면에 사용하는 컴포넌트
    KakaoMap,
    ChatWindow,
    RoundResults,
    GameResults,
    PhoneMapFrame,
    KakaoMapGame
  },
  
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      gameStore,
      isLoading: false,
      guessPosition: null,
      isMapExpanded: false,
      isPhoneMapOpen: false,
      mapCenter: { lat: 36.5, lng: 127.5 },
      roundTimer: null,
      showToast: false,
      toastMessage: '',
      toastTimeout: null
    };
  },
  
  computed: {
    canSubmit() {
      // 이미 제출했거나 라운드가 끝난 경우
      if (gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded) return false;
      
      // 위치를 선택했는지 확인
      return !!this.guessPosition;
    }
  },
  
  created() {
    // 테스트 데이터 로드 및 게임 초기화
    gameStore.loadTestData(false); // 개인전 모드
    this.initGame();
  },
  
  mounted() {
    // 로딩 화면 제거
  },
  
  beforeDestroy() {
    this.clearTimer();
  },
  
  methods: {
    initGame() {
      gameStore.initGame();
      this.fetchRoundData();
    },
    
    fetchRoundData() {
      // 테스트 데이터에서 위치 가져오기
      setTimeout(() => {
        const location = getRandomLocation();
        
        gameStore.state.currentLocation = { lat: location.lat, lng: location.lng };
        gameStore.state.locationInfo = {
          name: location.name,
          description: location.description,
          image: location.image,
          fact: location.fact
        };
        
        // 타이머 시작
        this.startRoundTimer();
      }, 1500);
    },
    
    startRoundTimer() {
      gameStore.state.remainingTime = 120; // 2분
      
      this.roundTimer = setInterval(() => {
        gameStore.state.remainingTime--;
        
        if (gameStore.state.remainingTime <= 0) {
          this.clearTimer();
          this.endRound();
        }
      }, 1000);
    },
    
    clearTimer() {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
    },
    
    onViewLoaded() {
      // 로드뷰 로딩 완료 처리
      console.log('로드뷰 로딩 완료');
    },
    
    onGuessPlaced(position) {
      this.guessPosition = position;
    },
    
    toggleMapExpansion() {
      this.isMapExpanded = !this.isMapExpanded;
    },
    
    togglePhoneMap() {
      this.isPhoneMapOpen = !this.isPhoneMapOpen;
    },
    
    formatCoords(position) {
      if (!position) return '';
      
      const lat = position.lat.toFixed(4);
      const lng = position.lng.toFixed(4);
      return `${lat}, ${lng}`;
    },
    
    submitGuessFromMap() {
      if (!this.canSubmit) return;
      
      // 실제 구현에서는 서버로 제출
      gameStore.submitGuess();
      
      setTimeout(() => {
        this.endRound();
      }, 1000);
    },
    
    submitGuess(position) {
      if (gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded) return;
      
      // 선택한 위치 설정
      this.guessPosition = position;
      
      // 휴대폰 지도 닫기
      this.isPhoneMapOpen = false;
      
      // 지도 마커 업데이트
      if (this.$refs.gameMap) {
        this.$refs.gameMap.updateMarker(position);
      }
      
      // 제출 처리
      gameStore.submitGuess();
      
      // 라운드 종료 (서버에서 처리할 부분)
      setTimeout(() => {
        this.endRound();
      }, 1000);
    },
    
    endRound() {
      this.clearTimer();
      
      // 실제 위치 설정 (테스트용)
      gameStore.state.actualLocation = {
        lat: gameStore.state.currentLocation.lat + (Math.random() * 0.1 - 0.05),
        lng: gameStore.state.currentLocation.lng + (Math.random() * 0.1 - 0.05)
      };
      
      gameStore.endRound();
    },
    
    closeRoundResults() {
      gameStore.state.showRoundResults = false;
    },
    
    startNextRound() {
      gameStore.startNextRound();
      this.guessPosition = null;
      this.fetchRoundData();
    },
    
    finishGame() {
      gameStore.finishGame();
    },
    
    restartGame() {
      this.guessPosition = null;
      gameStore.state.showGameResults = false;
      this.initGame();
    },
    
    exitToLobby() {
      this.$router.push('/multiplayerLobby');
    },
    
    exitGame() {
      if (confirm('정말 게임을 나가시겠습니까?')) {
        this.exitToLobby();
      }
    },
    
    sendChatMessage(message) {
      if (!message.trim()) return;
      
      const newMessage = {
        id: `msg-${Date.now()}`,
        sender: gameStore.state.currentUser.nickname,
        senderId: gameStore.state.currentUser.id,
        message: message,
        timestamp: new Date().toISOString()
      };
      
      gameStore.state.chatMessages.push(newMessage);
    },
    
    handlePhoneMapError(message) {
      this.showToastMessage(message);
    },
    
    showToastMessage(message) {
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }
      
      this.toastMessage = message;
      this.showToast = true;
      
      this.toastTimeout = setTimeout(() => {
        this.showToast = false;
      }, 3000);
    },
    
    submitGuessFromPhoneMap() {
      if (gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded) return;
      
      if (!this.$refs.phoneMapGame) return;
      
      this.$refs.phoneMapGame.getMarkerPosition()
        .then(position => {
          if (position) {
            // 선택한 위치 설정
            this.guessPosition = position;
            
            // 휴대폰 지도 닫기
            this.isPhoneMapOpen = false;
            
            // 위치 바로 제출 처리
            gameStore.submitGuess();
            
            // 실제 구현에서는 서버로 제출
            setTimeout(() => {
              this.endRound();
            }, 1000);
          } else {
            alert('위치를 선택해주세요!');
          }
        })
        .catch(() => {
          alert('위치를 선택해주세요!');
        });
    }
  }
};
</script>

<style scoped>
.multiplayer-roadview-game {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;
}

/* 헤더 스타일 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.exit-button:hover {
  background-color: #f1f5f9;
  color: #333;
}

.room-name {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
}

.game-mode {
  font-size: 0.9rem;
  color: #64748b;
}

.header-center {
  flex: 1;
  max-width: 400px;
  padding: 0 20px;
}

.round-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.round-number {
  font-size: 0.9rem;
  color: #64748b;
  text-align: center;
}

.round-progress {
  width: 100%;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* 메인 게임 영역 */
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
  overflow-y: auto;
}

.main-panel {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.game-view {
  flex: 1;
  width: 100%;
  position: relative;
}

.right-panel {
  width: 300px;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
  display: flex;
  flex-direction: column;
}

/* 지도 토글 버튼 */
.map-toggle {
  position: absolute;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  z-index: 15;
}

.map-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

/* 토스트 메시지 */
.toast-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.9rem;
  z-index: 100;
  animation: fadeInUp 0.3s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

/* 모바일 반응형 */
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
    height: 200px;
  }
  
  .main-panel {
    order: -1;
    height: calc(100vh - 390px);
  }
}

/* 휴대폰 프레임 스타일 */
.phone-frame {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  height: 720px;
  background-color: #111;
  border-radius: 40px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 
              inset 0 0 10px rgba(255, 255, 255, 0.1),
              0 0 0 8px #333;
  z-index: 100;
}

.phone-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #000;
  z-index: 101;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.phone-notch {
  position: relative;
  top: 0;
  width: 150px;
  height: 30px;
  background-color: #000;
  border-radius: 0 0 15px 15px;
  z-index: 102;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-notch:before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #444;
  border-radius: 50%;
  left: 40px;
  top: 10px;
}

.phone-notch:after {
  content: '';
  position: absolute;
  width: 50px;
  height: 6px;
  background-color: #444;
  border-radius: 3px;
  right: 40px;
  top: 11px;
}

.phone-content {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 50px;
  z-index: 101;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.phone-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #000;
  z-index: 101;
  display: flex;
  justify-content: center;
  align-items: center;
}

.home-button {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #333, #222);
  border-radius: 50%;
  border: 2px solid #444;
  cursor: pointer;
  position: relative;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.home-button:before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 15px;
  height: 15px;
  border: 2px solid #666;
  border-radius: 3px;
}

.home-button:active {
  transform: scale(0.95);
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.8);
}

.phone-map {
  width: 100%;
  height: 100%;
  z-index: 101;
}

/* 휴대폰 내부 Spot 버튼 */
.phone-spot-button {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.4);
  transition: all 0.3s ease;
  z-index: 102;
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-spot-button:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 12px rgba(46, 204, 113, 0.6);
}

.phone-spot-button:active {
  transform: translateX(-50%) translateY(-1px);
}

@media (max-width: 768px) {
  .phone-frame {
    width: 340px;
    height: 640px;
  }
}

@media (max-width: 480px) {
  .phone-frame {
    width: 300px;
    height: 600px;
  }
  
  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    right: 20px;
  }
  
  .phone-spot-button {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}
</style> 