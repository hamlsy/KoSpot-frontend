<template>
  <div class="multiplayer-photo-game">
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
          <!-- 실제 포토뷰 컴포넌트 -->
          <photo-view
            :photo-url="currentPhotoUrl"
            :prevent-interaction="gameStore.state.roundEnded"
            @load-complete="onViewLoaded"
          />
        </div>
        
        <div class="map-container" :class="{ expanded: isMapExpanded }">
          <kakao-map
            ref="gameMap"
            :center="mapCenter"
            :marker-position="guessPosition"
            :actual-position="gameStore.state.roundEnded ? gameStore.state.actualLocation : null"
            :prevent-interaction="gameStore.state.roundEnded"
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
          v-if="!isTeamMode"
          :messages="gameStore.state.chatMessages"
          @send-message="sendChatMessage"
        />
        
        <!-- 팀 모드일 경우 팀 채팅 표시 -->
        <team-chat
          v-if="isTeamMode && currentUserTeam"
          :team-id="gameStore.state.currentUser.teamId"
          :team-name="currentUserTeam.name"
          :team-color="getTeamColor(currentUserTeam.id)"
          :team-messages="currentTeamMessages"
          :current-user-id="gameStore.state.currentUser.id"
          @send-team-message="sendTeamMessage"
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
        <template v-if="!gameStore.state.hasSubmittedGuess">
          <i class="fas fa-check"></i>
          위치 제출
        </template>
        <template v-else>
          <i class="fas fa-clock"></i>
          다른 플레이어 대기 중...
        </template>
      </button>
    </div>
    
    <!-- 모달 컴포넌트들 (로드뷰 게임과 동일) -->
    <round-results
      v-if="gameStore.state.showRoundResults && !isTeamMode"
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

    <team-round-results
      v-if="gameStore.state.showRoundResults && isTeamMode"
      :visible="gameStore.state.showRoundResults"
      :teams="gameStore.state.teams"
      :players="gameStore.state.players"
      :actual-location="gameStore.state.actualLocation"
      :round="gameStore.state.currentRound"
      :total-rounds="gameStore.state.totalRounds"
      :current-user-id="gameStore.state.currentUser.id"
      :current-user-team="gameStore.state.currentUser.teamId"
      :location-name="gameStore.state.locationInfo.name"
      :location-description="gameStore.state.locationInfo.description"
      :location-image="gameStore.state.locationInfo.image"
      :interesting-fact="gameStore.state.locationInfo.fact"
      @close="closeRoundResults"
      @next-round="startNextRound"
      @finish-game="finishGame"
    />
    
    <game-results
      v-if="gameStore.state.showGameResults && !isTeamMode"
      :visible="gameStore.state.showGameResults"
      :players="gameStore.state.players"
      :room-data="gameStore.state.roomData"
      @play-again="restartGame"
      @exit="exitToLobby"
    />

    <team-game-results
      v-if="gameStore.state.showGameResults && isTeamMode"
      :visible="gameStore.state.showGameResults"
      :teams="gameStore.state.teams"
      :players="gameStore.state.players"
      :room-data="gameStore.state.roomData"
      :chat-messages="gameStore.state.chatMessages"
      @play-again="restartGame"
      @exit="exitToLobby"
      @send-chat-message="sendChatMessage"
    />

    <team-voting-modal
      v-if="gameStore.state.showTeamVoting"
      :visible="gameStore.state.showTeamVoting"
      :initiator="gameStore.state.voteInitiator"
      :guess-position="guessPosition"
      :time-limit="20"
      :map-preview-url="mapPreviewUrl"
      :current-user-id="gameStore.state.currentUser.id"
      @vote-submitted="handleVoteSubmission"
      @voting-completed="handleVotingComplete"
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
import PlayerList from '@/components/game/multiplayerMode/gameplay/MultiplayerPlayerList.vue';
import PhotoView from '@/components/game/common/photo/PhotoView.vue';
import KakaoMap from '@/components/game/common/kakao/KakaoMapGame.vue';
import ChatWindow from '@/components/game/multiplayerMode/lobby/chat/MultiplayerLobbyChatWindow.vue';
import RoundResults from '@/components/game/multiplayerMode/gameplay/results/MultiplayerRoundResults.vue';
import GameResults from '@/components/game/multiplayerMode/gameplay/results/MultiplayerGameResults.vue';
import TeamChat from '@/components/game/multiplayerMode/gameplay/chat/TeamChat.vue';
import TeamVotingModal from '@/components/game/multiplayerMode/gameplay/results/MultiplayerTeamVotingModal.vue';
import TeamGameResults from '@/components/game/multiplayerMode/gameplay/results/MultiplayerTeamGameResults.vue';
import TeamRoundResults from '@/components/game/multiplayerMode/gameplay/results/MultiplayerTeamRoundResults.vue';
import gameStore from '@/store/gameStore';
import { getRandomLocation } from '@/components/game/multiplayerMode/MultiplayerGameTestData';

export default {
  name: 'MultiplayerPhotoGame',
  
  components: {
    GameTimer,
    PlayerList,
    PhotoView,
    KakaoMap,
    ChatWindow,
    RoundResults,
    GameResults,
    TeamChat,
    TeamVotingModal,
    TeamGameResults,
    TeamRoundResults
  },
  
  props: {
    roomId: {
      type: String,
      required: true
    },
    isTeamMode: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      gameStore,
      isLoading: false,
      guessPosition: null,
      isMapExpanded: false,
      mapCenter: { lat: 36.5, lng: 127.5 },
      roundTimer: null,
      mapPreviewUrl: '',
      currentPhotoUrl: null,
      photoUrls: [
        '/assets/photos/seoul_1.jpg',
        '/assets/photos/busan_1.jpg',
        '/assets/photos/jeju_1.jpg',
        '/assets/photos/gyeongju_1.jpg',
        '/assets/photos/incheon_1.jpg'
      ]
    };
  },
  
  computed: {
    // 팀 모드 관련 계산된 속성
    currentUserTeam() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return null;
      
      return gameStore.state.teams.find(team => team.id === gameStore.state.currentUser.teamId);
    },
    
    teamMembers() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return [];
      
      return gameStore.state.players.filter(player => 
        player.teamId === gameStore.state.currentUser.teamId && 
        player.id !== gameStore.state.currentUser.id
      );
    },
    
    currentTeamMessages() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return [];
      
      return gameStore.state.teamChatMessages[gameStore.state.currentUser.teamId] || [];
    },
    
    canSubmit() {
      // 이미 제출했거나 라운드가 끝난 경우
      if (gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded) return false;
      
      // 위치를 선택했는지 확인
      return !!this.guessPosition;
    }
  },
  
  created() {
    // 테스트 데이터 로드 및 게임 초기화
    gameStore.loadTestData(this.isTeamMode);
    this.initGame();
  },
  
  beforeUnmount() {
    this.clearTimer();
  },
  
  methods: {
    initGame() {
      gameStore.initGame();
      this.fetchRoundData();
    },
    
    fetchRoundData() {
      this.isLoading = true;
      
      // 랜덤 사진 및 위치 가져오기
      setTimeout(() => {
        // 테스트 데이터에서 위치 가져오기
        const location = getRandomLocation();
        
        // 위치에 대한 사진 설정 (실제로는 서버에서 가져오거나 매핑 필요)
        const roundIndex = (gameStore.state.currentRound - 1) % this.photoUrls.length;
        this.currentPhotoUrl = this.photoUrls[roundIndex];
        
        gameStore.state.currentLocation = { lat: location.lat, lng: location.lng };
        gameStore.state.locationInfo = {
          name: location.name,
          description: location.description,
          image: location.image,
          fact: location.fact
        };
        
        this.isLoading = false;
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
      // 포토뷰 로딩 완료 처리
    },
    
    onGuessPlaced(position) {
      this.guessPosition = position;
    },
    
    toggleMapExpansion() {
      this.isMapExpanded = !this.isMapExpanded;
    },
    
    formatCoords(position) {
      if (!position) return '';
      
      const lat = position.lat.toFixed(4);
      const lng = position.lng.toFixed(4);
      return `${lat}, ${lng}`;
    },
    
    submitGuess() {
      if (!this.canSubmit) return;
      
      if (this.isTeamMode) {
        this.submitTeamGuess();
        return;
      }
      
      gameStore.submitGuess();
      
      // 실제 구현에서는 서버로 제출
      setTimeout(() => {
        this.endRound();
      }, 1000);
    },
    
    submitTeamGuess() {
      if (!this.canSubmit) return;
      
      // 팀 투표 시작
      gameStore.startTeamVoting(gameStore.state.currentUser);
      
      // 시스템 메시지 추가
      gameStore.addTeamChatMessage(
        gameStore.state.currentUser.teamId,
        `${gameStore.state.currentUser.nickname}님이 위치 제출을 제안했습니다. 투표해주세요!`,
        true
      );
    },
    
    handleVoteSubmission(vote) {
      gameStore.submitVote(vote.approved);
      
      // 모든 팀원이 투표했는지 확인
      if (gameStore.state.votingResults.total >= this.teamMembers.length) {
        this.finalizeTeamVoting();
      }
    },
    
    handleVotingComplete(result) {
      this.finalizeTeamVoting(result.approved);
    },
    
    finalizeTeamVoting(approved = null) {
      const isApproved = gameStore.finalizeVoting(approved);
      
      if (isApproved) {
        gameStore.addTeamChatMessage(
          gameStore.state.currentUser.teamId,
          '팀원들이 위치 제출에 동의했습니다!',
          true
        );
        
        gameStore.submitGuess();
        
        setTimeout(() => {
          this.endRound();
        }, 1000);
      } else {
        gameStore.addTeamChatMessage(
          gameStore.state.currentUser.teamId,
          '팀원들이 위치 제출을 거부했습니다. 다시 시도해주세요.',
          true
        );
      }
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
      gameStore.state.showGameResults = false;
      this.initGame();
    },
    
    exitGame() {
      if (confirm('정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다.')) {
        this.exitToLobby();
      }
    },
    
    exitToLobby() {
      this.clearTimer();
      this.$router.push('/multiplayerLobby');
    },
    
    sendChatMessage(message) {
      if (!message.trim()) return;
      gameStore.addChatMessage(message);
    },
    
    sendTeamMessage(data) {
      const { teamId, message } = data;
      
      if (!teamId || !message.trim()) return;
      gameStore.addTeamChatMessage(teamId, message);
    },
    
    getTeamColor(teamId) {
      const colorMap = {
        'team1': 'blue',
        'team2': 'red',
        'team3': 'green',
        'team4': 'yellow'
      };
      
      return colorMap[teamId] || 'blue';
    }
  }
};
</script>

<style scoped>
.multiplayer-photo-game {
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
  background-color: #1A5D1A; /* 포토 게임 헤더 색상을 다르게 */
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
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
  background: linear-gradient(90deg, #7DCE13, #BBD6B8); /* 포토 게임 색상 */
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
  background-color: #000; /* 사진 배경 검정색으로 */
  display: flex;
  align-items: center;
  justify-content: center;
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
  background-color: #1A5D1A; /* 포토 게임 푸터 색상 */
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
  color: #BBD6B8;
}

.submit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background-color: #7DCE13;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #6CB011;
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
    margin: 0.5rem 0;
    max-width: 100%;
  }
  
  .header-right {
    align-self: flex-end;
  }
}
</style>