<template>
  <base-multi-road-view-game :room-id="roomId">
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


export default {
  name: 'IndividualRoadViewGame',
  
  // BaseMultiRoadViewGame 확장
  extends: BaseMultiRoadViewGame,
  
  components: {
    ChatWindow,
    RoundResults,
    GameResults,
    RoadView,
    BaseMultiRoadViewGame
  },
  
  data() {
    return {
      // 개인 게임 특화 데이터
      submittedPlayersCount: 0,
      allPlayersSubmitted: false
    };
  },
  
  created() {
    // 게임 모드 설정
    this.gameMode = 'individual';
    console.log("players: ", this.gameStore.state.players);
    // 게임 스토어의 상태 변화 감시
    // this.$watch(
    //   () => this.gameStore.state.actualLocation,
    //   (newVal) => {
    //     if (newVal && Object.keys(newVal).length > 0) {
    //       console.log('실제 위치가 설정되었습니다:', newVal);
    //       // 실제 위치가 설정된 후에 다른 플레이어들의 추측 시ミュ레이션
    //       this.simulateOtherPlayersGuesses();
    //     }
    //   },
    //   { deep: true }
    // );
          this.simulateOtherPlayersGuesses();
  },
  
  methods: {
    // BaseMultiRoadViewGame의 추상 메서드 구현
    handleGuessSubmission(position) {
      console.log('개인 게임에서 위치 제출:', position);
      
      // 현재 플레이어의 추측 저장
      const currentPlayer = this.gameStore.state.currentUser;
      
      // gameStore에 직접 추가
      if (!this.gameStore.state.playerGuesses) {
        this.gameStore.state.playerGuesses = [];
      }
      
      // 현재 사용자의 추측 정보 저장
      this.gameStore.state.userGuess = { position: position };
      
      this.gameStore.state.playerGuesses.push({
        playerId: currentPlayer.id,
        playerName: currentPlayer.nickname,
        position: position,
        color: this.getRandomColor(currentPlayer.id),
      });

      // 제출한 플레이어 수 증가
      this.submittedPlayersCount++;

      // 웹소켓으로 서버에 제출 정보 전송
      this.sendGuessToServer({
        playerId: currentPlayer.id,
        position: position,
      });

      this.gameStore.submitGuess();

      // 모든 플레이어가 제출했는지 확인
      this.checkAllPlayersSubmitted();
    },
    
    sendChatMessage(message) {
      if (!message.trim()) return;
      this.gameStore.addChatMessage(message);
    },
    
    onViewLoaded() {
      console.log('로드뷰 로딩 완료');
    },

    closeRoundResults() {
      this.gameStore.state.roundEnded = false;
    },
    
    startNextRound() {
      // 부모 메서드 호출
      // 상속한 BaseMultiRoadViewGame의 startNextRound 사용
      this.$super.startNextRound();
      
      // 다음 라운드에서 다른 플레이어들의 추측 시뮬뮬레이션
      this.simulateOtherPlayersGuesses();
    },
    
    finishGame() {
      this.gameStore.finishGame();
    },
    
    restartGame() {
      this.gameStore.state.showGameResults = false;
      this.initGame();
      this.simulateOtherPlayersGuesses();
    },
    
    exitToLobby() {
      this.exitToLobby();
    },
    
    // 모든 플레이어가 제출했는지 확인
    checkAllPlayersSubmitted() {
      if (this.submittedPlayersCount >= this.gameStore.state.players.length && !this.allPlayersSubmitted) {
        console.log('모든 플레이어가 제출 완료!');
        this.allPlayersSubmitted = true;
        this.endRound();
      }
    },
    
    // 더미 데이터로 다른 플레이어들의 정답 제출 시뮬레이션
    simulateOtherPlayersGuesses() {
      console.log('다른 플레이어 추측 시뮬레이션 시작');
      
      // 라운드가 이미 끝났거나 제출이 완료된 경우 중단
      if (this.gameStore.state.hasSubmittedGuess || this.gameStore.state.roundEnded) {
        return;
      }
      
      // 제출 카운트 초기화
      this.submittedPlayersCount = 0;
      
      // 실제 위치가 없으면 시뮬레이션 중단
      if (!this.gameStore.state.actualLocation || !this.gameStore.state.actualLocation.lat) {
        console.error('실제 위치가 없어 시뮤레이션을 실행할 수 없습니다.');
        return;
      }
      
      // 현재 플레이어를 제외한 다른 플레이어들
      const otherPlayers = this.gameStore.state.players.filter(
        player => player.id !== this.gameStore.state.currentUser.id
      );
      
      console.log('다른 플레이어 수:', otherPlayers.length);
      
      // 자기 자신의 추측도 추가 (현재 사용자의 추측)
      if (this.gameStore.state.userGuess && this.gameStore.state.userGuess.position) {
        console.log('현재 사용자의 추측 추가:', this.gameStore.state.userGuess.position);
        this.addPlayerGuessToStore(
          this.gameStore.state.currentUser.id, 
          this.gameStore.state.userGuess.position, 
          '#FF5252'
        );
        this.submittedPlayersCount++;
      }
      
      // 각 플레이어마다 랜덤한 위치 생성
      otherPlayers.forEach((player, index) => {
        // 실제 위치 주변에 랜덤한 위치 생성 (최대 20km 반경 내)
        setTimeout(() => {
          const randomOffset = () => (Math.random() - 0.5) * 0.4; // 약 ±20km 범위
          const randomPosition = {
            lat: this.gameStore.state.actualLocation.lat + randomOffset(),
            lng: this.gameStore.state.actualLocation.lng + randomOffset()
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
          
          // 제출 카운트 증가 및 확인
          this.submittedPlayersCount++;
          console.log('현재 추측 수:', this.gameStore.state.playerGuesses.length, '제출 카운트:', this.submittedPlayersCount);
          
          // 모든 플레이어가 제출했는지 확인
          this.checkAllPlayersSubmitted();
        }, 500 + Math.random() * 2000); // 시간 단축: 0.5~2.5초 사이에 랜덤하게 제출
      });
    },
    
    // 플레이어 추측을 스토어에 추가하는 헬퍼 메서드
    addPlayerGuessToStore(playerId, position, color) {
      const player = this.gameStore.state.players.find(p => p.id === playerId);
      if (!player) return;
      
      // 스토어에 직접 추가
      if (!this.gameStore.state.playerGuesses) {
        this.gameStore.state.playerGuesses = [];
      }
      
      this.gameStore.state.playerGuesses.push({
        playerId: playerId,
        playerName: player.nickname,
        position: position,
        color: color
      });
      console.log("player Guesses in store!", this.gameStore.state.playerGuesses);
    }
  }
};
</script>