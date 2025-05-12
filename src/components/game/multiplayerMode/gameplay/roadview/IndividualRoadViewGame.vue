<template>
  <base-multi-road-view-game
    :room-id="roomId"
    @guess-submitted="onGuessSubmitted"
  >
    <!-- 개인전 채팅창 -->
    <template #chat>
      <chat-window
        :messages="gameStore.state.chatMessages"
        @send-message="sendChatMessage"
      />
    </template>
    
    <!-- 메인 게임 영역 -->
    <template #main>
      <!-- 라운드 진행 중일 때는 로드뷰 표시 -->
      <road-view
        v-if="!gameStore.state.roundEnded"
        :position="gameStore.state.currentLocation"
        :show-controls="true"
        :prevent-mouse-events="gameStore.state.hasSubmittedGuess"
        @load-complete="onViewLoaded"
      />
      
      <!-- 라운드 종료 시 결과 컴포넌트 표시 -->
      <round-results
        v-else
        :players="gameStore.state.players"
        :actual-location="gameStore.state.actualLocation"
        :round="gameStore.state.currentRound"
        :total-rounds="gameStore.state.totalRounds"
        :current-user-id="gameStore.state.currentUser.id"
        :location-name="gameStore.state.locationInfo.name"
        :player-guesses="playerGuesses"
        @close="closeRoundResults"
        @next-round="startNextRound"
        @finish-game="finishGame"
      />
    </template>
    
    <!-- 게임 결과 모달 -->
    <template #results>
      <game-results
        v-if="gameStore.state.showGameResults"
        :visible="gameStore.state.showGameResults"
        :players="gameStore.state.players"
        :room-data="gameStore.state.roomData"
        @play-again="restartGame"
        @exit="exitToLobby"
      />
    </template>
  </base-multi-road-view-game>
</template>

<script>
import BaseMultiRoadViewGame from './BaseMultiRoadViewGame.vue';
import ChatWindow from '@/components/game/multiplayerMode/gameplay/chat/IndividualChat.vue'
import RoundResults from '@/components/game/multiplayerMode/gameplay/results/MultiplayerRoundResults.vue';
import GameResults from '@/components/game/multiplayerMode/gameplay/results/MultiplayerGameResults.vue';
import RoadView from '@/components/game/common/roadview/RoadView.vue';
import gameStore from '@/store/gameStore';

export default {
  name: 'IndividualRoadViewGame',
  
  components: {
    BaseMultiRoadViewGame,
    ChatWindow,
    RoundResults,
    GameResults,
    RoadView
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
      playerGuesses: []
    };
  },
  
  created() {
    // 더미 데이터로 다른 플레이어들의 정답 제출 시뮬레이션
    this.simulateOtherPlayersGuesses();
  },
  
  methods: {
    sendChatMessage(message) {
      if (!message.trim()) return;
      gameStore.addChatMessage(message);
    },
    
    onViewLoaded() {
      console.log('로드뷰 로딩 완료');
    },
    
    onGuessSubmitted(position) {
      // 현재 사용자의 추측 저장
      this.addPlayerGuess(gameStore.state.currentUser.id, position, '#FF5252');
    },
    
    closeRoundResults() {
      gameStore.state.roundEnded = false;
    },
    
    startNextRound() {
      // 부모 컴포넌트의 메서드 호출
      this.$parent.startNextRound();
      // 다음 라운드를 위해 플레이어 추측 초기화
      this.playerGuesses = [];
      // 다음 라운드에서 다른 플레이어들의 추측 시뮬레이션
      this.simulateOtherPlayersGuesses();
    },
    
    finishGame() {
      gameStore.finishGame();
    },
    
    restartGame() {
      gameStore.state.showGameResults = false;
      this.$parent.initGame();
      this.playerGuesses = [];
      this.simulateOtherPlayersGuesses();
    },
    
    exitToLobby() {
      this.$parent.exitToLobby();
    },
    
    // 더미 데이터로 다른 플레이어들의 정답 제출 시뮬레이션
    simulateOtherPlayersGuesses() {
      // 현재 플레이어를 제외한 다른 플레이어들
      const otherPlayers = gameStore.state.players.filter(
        player => player.id !== gameStore.state.currentUser.id
      );
      
      // 각 플레이어마다 랜덤한 위치 생성
      otherPlayers.forEach(player => {
        // 실제 위치 주변에 랜덤한 위치 생성 (최대 20km 반경 내)
        setTimeout(() => {
          const randomOffset = () => (Math.random() - 0.5) * 0.4; // 약 ±20km 범위
          const randomPosition = {
            lat: gameStore.state.actualLocation.lat + randomOffset(),
            lng: gameStore.state.actualLocation.lng + randomOffset()
          };
          
          // 플레이어 색상 랜덤 생성
          const colors = [
            '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF',
            '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59',
            '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          // 플레이어 추측 추가
          this.addPlayerGuess(player.id, randomPosition, color);
          
          // 플레이어 제출 상태 업데이트
          player.hasSubmitted = true;
        }, 1000 + Math.random() * 5000); // 1~6초 사이에 랜덤하게 제출
      });
    },
    
    // 플레이어 추측 추가 헬퍼 메서드
    addPlayerGuess(playerId, position, color) {
      const player = gameStore.state.players.find(p => p.id === playerId);
      if (!player) return;
      
      this.playerGuesses.push({
        playerId: playerId,
        playerName: player.nickname,
        position: position,
        color: color
      });
    }
  }
};
</script>