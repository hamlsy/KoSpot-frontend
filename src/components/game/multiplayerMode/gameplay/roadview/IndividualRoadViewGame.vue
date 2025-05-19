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
        :player-guesses="gameStore.state.playerGuesses"
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
      gameStore
    };
  },
  
  created() {
    // 게임 스토어의 상태 변화 감시
    this.$watch(
      () => gameStore.state.actualLocation,
      (newVal) => {
        if (newVal && Object.keys(newVal).length > 0) {
          console.log('실제 위치가 설정되었습니다:', newVal);
          // 실제 위치가 설정된 후에 다른 플레이어들의 추측 시ミュ레이션
          this.simulateOtherPlayersGuesses();
        }
      },
      { immediate: true, deep: true }
    );
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
      // 위치 정보 유효성 검사
      if (!position || position.lat === undefined || position.lng === undefined) {
        console.error('유효하지 않은 위치 정보:', position);
        return;
      }
      console.log(position);
      // 현재 사용자의 추측 저장은 부모 컴포넌트에서 처리됨
      // gameStore에 저장된 userGuess 정보 활용
      gameStore.state.userGuess = { position: position };
    },
    
    closeRoundResults() {
      gameStore.state.roundEnded = false;
    },
    
    startNextRound() {
      // 부모 컴포넌트의 메서드 호출
      this.$parent.startNextRound();
      // 다음 라운드에서 다른 플레이어들의 추측 시뮬레이션
      this.simulateOtherPlayersGuesses();
    },
    
    finishGame() {
      gameStore.finishGame();
    },
    
    restartGame() {
      gameStore.state.showGameResults = false;
      this.$parent.initGame();
      this.simulateOtherPlayersGuesses();
    },
    
    exitToLobby() {
      this.$parent.exitToLobby();
    },
    
    // 더미 데이터로 다른 플레이어들의 정답 제출 시뮤레이션
    simulateOtherPlayersGuesses() {
      console.log('다른 플레이어 추측 시뮤레이션 시작');
      
      // 실제 위치가 없으면 시뮤레이션 중단
      if (!gameStore.state.actualLocation || !gameStore.state.actualLocation.lat) {
        console.error('실제 위치가 없어 시뮤레이션을 실행할 수 없습니다.');
        return;
      }
      
      // 현재 플레이어를 제외한 다른 플레이어들
      const otherPlayers = gameStore.state.players.filter(
        player => player.id !== gameStore.state.currentUser.id
      );
      
      console.log('다른 플레이어 수:', otherPlayers.length);
      
      // 자기 자신의 추측도 추가 (현재 사용자의 추측)
      if (gameStore.state.userGuess && gameStore.state.userGuess.position) {
        console.log('현재 사용자의 추측 추가:', gameStore.state.userGuess.position);
        this.addPlayerGuessToStore(
          gameStore.state.currentUser.id, 
          gameStore.state.userGuess.position, 
          '#FF5252'
        );
      }
      
      // 각 플레이어마다 랜덤한 위치 생성
      otherPlayers.forEach((player, index) => {
        // 실제 위치 주변에 랜덤한 위치 생성 (최대 20km 반경 내)
        setTimeout(() => {
          const randomOffset = () => (Math.random() - 0.5) * 0.4; // 약 ±20km 범위
          const randomPosition = {
            lat: gameStore.state.actualLocation.lat + randomOffset(),
            lng: gameStore.state.actualLocation.lng + randomOffset()
          };
          
          console.log(`플레이어 ${player.nickname || index} 추측 생성:`, randomPosition);
          
          // 플레이어 색상 랜덤 생성
          const colors = [
            '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF',
            '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59',
            '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          // 플레이어 추측 추가
          this.addPlayerGuessToStore(player.id, randomPosition, color);
          
          // 플레이어 제출 상태 업데이트
          player.hasSubmitted = true;
          
          console.log('현재 추측 수:', gameStore.state.playerGuesses.length);
        }, 500 + Math.random() * 2000); // 시간 단축: 0.5~2.5초 사이에 랜덤하게 제출
      });
    },
    
    // 플레이어 추측을 스토어에 추가하는 헬퍼 메서드
    addPlayerGuessToStore(playerId, position, color) {
      const player = gameStore.state.players.find(p => p.id === playerId);
      if (!player) return;
      
      // 스토어에 직접 추가
      if (!gameStore.state.playerGuesses) {
        gameStore.state.playerGuesses = [];
      }
      
      gameStore.state.playerGuesses.push({
        playerId: playerId,
        playerName: player.nickname,
        position: position,
        color: color
      });
      console.log("player Guesses in store!", gameStore.state.playerGuesses);
    }
  }
};
</script>