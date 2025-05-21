<template>
  <div class="multiplayer-roadview-game">
    <!-- 게임 헤더 -->
    <div class="game-header">
      <div class="header-left">
        <button class="exit-button" @click="exitGame">
          <i class="fas fa-door-open"></i>
          <span class="exit-text">나가기</span>
        </button>
        <div class="room-info">
          <h2 class="room-name">{{ gameStore.state.roomData.name }}</h2>
          <div class="game-mode">
            {{ gameStore.state.roomData.gameMode }} -
            {{ gameStore.state.roomData.region }}
          </div>
        </div>
      </div>

      <div class="header-center col-md-4">
        <div class="round-info">
          <span class="round-number">
            라운드 {{ gameStore.state.currentRound }}/{{ gameStore.state.totalRounds }}
          </span>
          <div class="round-progress">
            <div
              class="progress-bar"
              :style="{
                width: `${(gameStore.state.currentRound / gameStore.state.totalRounds) * 100}%`,
              }"
            ></div>
          </div>
        </div>
      </div>

      <div class="header-right col-md-4">
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
          :round-ended="gameStore.state.roundEnded"
        />
      </div>

      <!-- 중앙 패널: 게임 화면 -->
      <div class="main-panel">
        <div class="game-view">
          <!-- 메인 게임 영역 (로드뷰 또는 결과 컴포넌트) -->
          <slot name="main">
            <!-- 기본 로드뷰 컴포넌트 (슬롯이 제공되지 않을 경우) -->
            <road-view
              v-if="!gameStore.state.roundEnded && gameStore.state.currentLocation"
              :position="gameStore.state.currentLocation"
              :show-controls="true"
              :prevent-mouse-events="gameStore.state.hasSubmittedGuess"
              @load-complete="onViewLoaded"
            />
          </slot>
          
          <!-- 지도 버튼 -->
          <!-- 채팅 토글 버튼 (모바일) -->
          <button class="chat-toggle" @click="toggleChat">
            <i class="fas" :class="isChatOpen ? 'fa-times' : 'fa-comments'"></i>
            {{ isChatOpen ? "채팅 닫기" : "채팅 열기" }}
          </button>

          <button class="map-toggle" @click="toggleMap" v-if="!gameStore.state.roundEnded">
            <i class="fas fa-map-marked-alt"></i>
            지도
          </button>
        </div>
      </div>

      <!-- 오른쪽 패널: 채팅 -->
      <div class="right-panel">
        <slot name="chat"></slot>
      </div>
      
      <!-- 결과 모달 -->
      <slot name="results"></slot>
    </div>

    <!-- 휴대폰 프레임 -->
    <PhoneFrame
      :style="{ zIndex: isMapOpen ? 15 : -1 }"
      :centerLocation="mapCenter"
      :actualLocation="gameStore.state.actualLocation"
      :showHintCircles="false"
      :disabled="gameStore.state.roundEnded"
      :showDistance="false"
      :showActionButton="false"
      @close="toggleMap"
      @spot-answer="handlePhoneMapGuess"
      @error="handleMapError"
      ref="phoneMapGame"
    />
    
    <!-- 토스트 메시지 -->
    <div class="toast-message" :class="{ show: showToastFlag }">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import GameTimer from "@/components/game/common/shared/GameTimer.vue";
import PlayerList from "@/components/game/multiplayerMode/gameplay/MultiplayerPlayerList.vue";
import RoadView from "@/components/game/common/roadview/RoadView.vue";
import PhoneFrame from "@/components/game/common/PhoneFrame.vue";
import gameStore from "@/store/gameStore";
import { getRandomLocation } from "@/components/game/multiplayerMode/MultiplayerGameTestData";

export default {
  name: "BaseMultiRoadViewGame",

  components: {
    GameTimer,
    PlayerList,
    RoadView,
    PhoneFrame,
  },

  props: {
    roomId: {
      type: String,
      required: true,
    },
    isTeamMode: {
      type: Boolean,
      default: false,
    },
    // 게임 모드에 따라 필요한 추가 props
    gameMode: {
      type: String,
      default: 'individual',
      validator: (value) => ['individual', 'team'].includes(value)
    },
  },
  
  provide() {
    return {
      roomId: this.roomId,
      isTeamMode: this.isTeamMode,
      gameMode: this.gameMode,
      gameStore: this.gameStore,
      toggleMap: this.toggleMap,
      handlePhoneMapGuess: this.handlePhoneMapGuess,
      formatCoords: this.formatCoords,
      calculateDistance: this.calculateDistance,
      // 자식 컴포넌트에서 사용할 수 있는 메서드들
      getRandomColor: this.getRandomColor,
      endRound: this.endRound,
      startNextRound: this.startNextRound,
    };
  },
  
  inject: {
    $super: {
      default: () => ({}),
    }
  },

  data() {
    return {
      gameStore,
      isMapOpen: false,
      mapCenter: { lat: 37.5665, lng: 126.978 },
      guessPosition: null,
      roundTimer: null,
      isChatOpen: false,
      isMobile: false,
      isTablet: false,
      showToastFlag: false,
      toastMessage: "",
      toastTimeout: null,
      phoneMapPosition: null,
      phoneMapError: null,
      submittedPlayersCount: 0,
      allPlayersSubmitted: false,
      showResultMap: false,
      webSocket: null,
    };
  },
  
  computed: {
    canSubmit() {
      return !this.gameStore.state.hasSubmittedGuess && !this.gameStore.state.roundEnded;
    }
  },

  created() {
    // 테스트 데이터 로드 및 게임 초기화
    this.gameStore.loadTestData(this.isTeamMode);
    this.initGame();
    this.connectWebSocket();
  },

  mounted() {
    // 로딩 화면 제거
    // 토스트 메시지 스타일 추가
    this.addToastStyles();
    this.checkResponsive();
    window.addEventListener("resize", this.checkResponsive);
  },

  beforeDestroy() {
    this.clearTimer();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    window.removeEventListener("resize", this.checkResponsive);
    this.disconnectWebSocket();
  },
  methods: {
    checkResponsive() {
      const isMobile = window.innerWidth <= 992;
      const rightPanel = document.querySelector(".right-panel");

      if (rightPanel) {
        // 모바일이 아닐 때는 채팅창 항상 표시
        if (!isMobile) {
          rightPanel.style.display = "block";
        } else if (!this.isChatOpen) {
          rightPanel.style.display = "none";
        }
      }
    },

    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
      const rightPanel = document.querySelector(".right-panel");
      if (rightPanel) {
        rightPanel.style.display = this.isChatOpen ? "block" : "none";
      }
    },

    initGame() {
      this.gameStore.initGame();
      this.fetchRoundData();
    },

    fetchRoundData() {
      // 테스트 데이터에서 위치 가져오기
      setTimeout(() => {
        const location = getRandomLocation();

        // 현재 위치와 실제 위치(정답 좌표) 모두 설정
        const locationCoords = {
          lat: location.lat,
          lng: location.lng,
        };

        this.gameStore.state.currentLocation = locationCoords;
        this.gameStore.state.actualLocation = locationCoords; // 정답 좌표 설정

        this.gameStore.state.locationInfo = {
          name: location.name,
          description: location.description,
          image: location.image,
          fact: location.fact,
        };

        // 타이머 시작
        this.startRoundTimer();
      }, 1500);
    },

    startRoundTimer() {
      this.gameStore.state.remainingTime = 120; // 2분

      this.roundTimer = setInterval(() => {
        this.gameStore.state.remainingTime--;

        if (this.gameStore.state.remainingTime <= 0) {
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
      console.log("로드뷰 로딩 완료");
    },

    onGuessPlaced(position) {
      this.guessPosition = position;
    },

    toggleMapExpansion() {
      this.isMapExpanded = !this.isMapExpanded;
    },

    formatCoords(position) {
      if (!position) return "";

      const lat = position.lat.toFixed(4);
      const lng = position.lng.toFixed(4);
      return `${lat}, ${lng}`;
    },
    
    toggleMap() {
      // 라운드가 끝났을 때는 결과 지도 표시/숨김 토글
      if (this.gameStore.state.roundEnded) {
        this.showResultMap = !this.showResultMap;
      } else {
        this.isMapOpen = !this.isMapOpen;
      }
    },
    
    submitGuess() {
      if (!this.canSubmit) return;
      
      // 제출 상태로 변경
      this.gameStore.submitGuess();
      
      // 토스트 메시지 표시
      this.showToast("위치가 제출되었습니다!");
    },

    endRound() {
      // 라운드 종료 처리
      this.clearTimer();
      this.gameStore.endGameRound();

      // 플레이어 점수 계산 및 정렬
      this.calculatePlayerScores();
      
      // 라운드 종료 상태로 설정 (결과 화면 표시를 위해)
      this.gameStore.state.roundEnded = true;
      
      console.log('라운드 종료:', this.gameMode);
    },

    startNextRound() {
      // 라운드 결과 닫기
      this.gameStore.state.showRoundResults = false;
      this.gameStore.state.roundEnded = false;

      // 다음 라운드를 위한 상태 초기화
      this.allPlayersSubmitted = false;
      this.submittedPlayersCount = 0;
      this.gameStore.state.playerGuesses = [];
      this.showResultMap = false;
      
      // 플레이어의 마지막 라운드 점수 초기화
      this.gameStore.state.players.forEach(player => {
        player.lastRoundScore = null;
        player.hasSubmitted = false;
      });

      // 다음 라운드 시작
      if (this.gameStore.state.currentRound < this.gameStore.state.totalRounds) {
        this.gameStore.state.currentRound++;
        this.gameStore.state.hasSubmittedGuess = false;
        this.gameStore.state.guessPosition = null;
        this.fetchRoundData();
        
        console.log('다음 라운드 시작:', this.gameMode);
      } else {
        // 모든 라운드 완료
        this.gameStore.finishGame();
      }
    },

    // ...
    handlePhoneMapGuess(position) {
      if (this.gameStore.state.hasSubmittedGuess || this.gameStore.state.roundEnded)
        return;

      // 선택한 위치 설정
      this.guessPosition = position;

      // 지도 닫기
      this.isMapOpen = false;
      
      // 게임 모드별 추측 제출 처리
      this.handleGuessSubmission(position);
    },
    
    // 게임 모드별로 구현해야 하는 메서드 (추상)
    handleGuessSubmission() {
      
    },

    // WebSocket 관련 메서드
    connectWebSocket() {
      // 실제 구현 시 서버 주소로 변경
      // this.webSocket = new WebSocket('ws://your-server-url/game/' + this.roomId);

      // 테스트용 더미 구현
      console.log("WebSocket 연결 시도 (더미)");

      // 실제 WebSocket 구현 시 이벤트 핸들러 추가
      /*
        this.webSocket.onopen = () => {
          console.log('WebSocket 연결됨');
        };
        
        this.webSocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        };
        
        this.webSocket.onerror = (error) => {
          console.error('WebSocket 오류:', error);
        };
        
        this.webSocket.onclose = () => {
          console.log('WebSocket 연결 종료');
        };
        */
    },

    disconnectWebSocket() {
      if (this.webSocket) {
        // this.webSocket.close();
        console.log("WebSocket 연결 종료 (더미)");
      }
    },

    handleWebSocketMessage(data) {
      // 메시지 타입에 따라 처리
      switch (data.type) {
        case "PLAYER_GUESS":
          // 다른 플레이어의 추측 정보 처리
          this.handlePlayerGuess(data.payload);
          break;

        case "ALL_PLAYERS_SUBMITTED":
          // 모든 플레이어가 제출 완료
          this.allPlayersSubmitted = true;
          this.endRound();
          break;

        case "CHAT_MESSAGE":
          // 채팅 메시지 처리
          gameStore.addChatMessage(data.payload.message, data.payload.sender);
          break;

        default:
          console.log("알 수 없는 메시지 타입:", data.type);
      }
    },

    handlePlayerGuess(data) {
      // 다른 플레이어의 추측 정보 저장
      const player = gameStore.state.players.find(
        (p) => p.id === data.playerId
      );
      if (player) {
        // gameStore에 직접 추가
        if (!gameStore.state.playerGuesses) {
          gameStore.state.playerGuesses = [];
        }
        
        gameStore.state.playerGuesses.push({
          playerId: data.playerId,
          playerName: player.nickname,
          position: data.position,
          color: this.getRandomColor(data.playerId),
        });

        this.submittedPlayersCount++;

        // 모든 플레이어가 제출했는지 확인
        if (this.submittedPlayersCount >= gameStore.state.players.length) {
          this.allPlayersSubmitted = true;
          this.endRound();
        }
      }
    },

    sendGuessToServer(guessData) {
      // 실제 구현 시 WebSocket으로 전송
      console.log("서버에 추측 정보 전송:", guessData);
      
      // 테스트용 더미 구현
      /*
      if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        this.webSocket.send(JSON.stringify({
          type: 'PLAYER_GUESS',
          payload: guessData
        }));
      } else {
        console.error('웹소켓 연결이 없습니다.');
      }
      */
    },
    
    calculatePlayerScores() {
      // 각 플레이어의 점수 계산 (거리 기반)
      this.gameStore.state.players.forEach((player) => {
        // 플레이어의 추측 위치 찾기
        const guess = this.gameStore.state.playerGuesses.find((g) => g.playerId === player.id);
        if (guess) {
          // 실제 위치와의 거리 계산 (km)
          const distance = this.calculateDistance(
            guess.position.lat,
            guess.position.lng,
            this.gameStore.state.actualLocation.lat,
            this.gameStore.state.actualLocation.lng
          );

          // 거리에 따른 점수 계산 (최대 5000점, 거리가 멀수록 점수 감소)
          const score = Math.max(0, Math.round(5000 - distance * 10));

          // 마지막 라운드 점수 저장
          player.lastRoundScore = score;
          
          // 플레이어 총점 업데이트
          player.score = (player.score || 0) + score;
          player.distanceToTarget = distance;
        }
      });

      // 점수에 따라 플레이어 정렬
      this.gameStore.state.players.sort((a, b) => b.score - a.score);
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
      // 두 지점 간의 거리 계산 (Haversine 공식)
      const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // 거리 (km)
      return distance;
    },

    deg2rad(deg) {
      return deg * (Math.PI / 180);
    },
    
    handleMapError(error) {
      console.error("지도 오류:", error);
      this.showToast("지도를 로드하는 중 오류가 발생했습니다.");
    },

    showToast(message) {
      this.toastMessage = message;
      this.showToastFlag = true;
      
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }
      
      this.toastTimeout = setTimeout(() => {
        this.showToastFlag = false;
      }, 3000);
    },
    
    addToastStyles() {
      // 동적으로 스타일 추가
      const style = document.createElement("style");
      style.textContent = `
          .toast-message {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 9999;
            font-size: 14px;
            transition: opacity 0.3s, transform 0.3s;
            opacity: 0;
            pointer-events: none;
          }
          
          .toast-message.show {
            opacity: 1;
            transform: translate(-50%, -10px);
          }
        `;
      document.head.appendChild(style);
    },
    
    exitGame() {
      if (
        confirm(
          "정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다."
        )
      ) {
        this.exitToLobby();
      }
    },

    exitToLobby() {
      this.clearTimer();
      this.$router.push("/multiplayerLobby");
    }
  },
};
</script>

<style scoped>
.multiplayer-roadview-game {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
  overflow: hidden;
}

/* 게임 헤더 스타일 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: #222831;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .exit-text {
    display: none;
  }

  .exit-button {
    padding: 0.5rem;
  }
}

.exit-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.room-info {
  margin-left: 1rem;
}

.room-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.game-mode {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.round-info {
  text-align: center;
}

.round-number {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.round-progress {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
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
  background-color: #222831;
  color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.guess-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

  .left-panel {
    display: none; /* 모바일에서는 기존 플레이어 리스트 숨김 */
  }

  .right-panel {
    width: 100%;
    height: auto;
    max-height: 200px;
    overflow-y: auto;
    display: none; /* 모바일에서는 기본적으로 채팅 패널 숨김 */
  }

  .main-panel {
    order: -1;
    height: calc(100vh - 300px); /* 400px에서 300px로 변경하여 공간 확장 */
    min-height: 350px; /* 300px에서 350px로 증가 */
  }

  .game-view {
    height: 100%;
    position: relative;
  }

  .map-container.expanded {
    width: 90%;
    height: 90%;
    max-height: calc(100vh - 100px);
  }

  .mobile-player-info {
    display: flex;
  }

  .chat-toggle {
    display: flex;
  }
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: row;
    padding: 0.5rem;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    flex: 1;
    min-width: 150px;
  }

  .header-center {
    flex: 1;
    margin: 0 0.5rem;
    max-width: 100%;
  }

  .header-right {
    align-self: center;
  }
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
  content: "";
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

/* 지도 토글 버튼 */
.map-toggle {
  position: absolute;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 50;
}

.map-toggle:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
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


/* 채팅 토글 버튼 */
.chat-toggle {
  display: none; /* 기본적으로 숨김 */
  position: absolute;
  bottom: 30px;
  left: 30px;
  background: linear-gradient(135deg, #9c27b0, #673ab7);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1rem;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 50;
}

.chat-toggle:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
}

@media (max-width: 992px) {
  .chat-toggle {
    display: flex;
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    left: 20px;
  }
}
</style>