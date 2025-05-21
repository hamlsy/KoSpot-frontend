<template>
  <base-multi-road-view-game :room-id="roomId">
    <!-- 팀 채팅창 -->
    <template #chat>
      <chat-window
        v-if="currentUserTeam"
        :team-id="gameStore.state.currentUser.teamId"
        :team-color="getTeamColor(currentUserTeam.id)"
        :team-messages="currentTeamMessages"
        :current-user-id="gameStore.state.currentUser.id"
        @send-team-message="sendTeamMessage"
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
    </template>

    <!-- 팀전 결과 모달 -->
    <template #results>
      <team-round-results
        v-if="gameStore.state.showRoundResults"
        :visible="gameStore.state.showRoundResults"
        :teams="gameStore.state.teams"
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

      <team-game-results
        v-if="gameStore.state.showGameResults"
        :visible="gameStore.state.showGameResults"
        :teams="gameStore.state.teams"
        :players="gameStore.state.players"
        :room-data="gameStore.state.roomData"
        @play-again="restartGame"
        @exit="exitToLobby"
      />

      <team-voting-modal
        v-if="gameStore.state.showVoting"
        :visible="gameStore.state.showVoting"
        :initiator="gameStore.state.votingInitiator"
        :position="gameStore.state.votingPosition"
        :map-preview-url="mapPreviewUrl"
        :current-user-id="gameStore.state.currentUser.id"
        @vote-submitted="handleVoteSubmission"
        @voting-completed="handleVotingComplete"
      />
    </template>
  </base-multi-road-view-game>
</template>
  
  <script>
import BaseMultiRoadViewGame from "./BaseMultiRoadViewGame.vue";
import ChatWindow from '@/components/game/multiplayerMode/gameplay/chat/IndividualChat.vue'
import TeamRoundResults from "@/components/game/multiplayerMode/gameplay/results/MultiplayerTeamRoundResults.vue";
import TeamGameResults from "@/components/game/multiplayerMode/gameplay/results/MultiplayerTeamGameResults.vue";
import TeamVotingModal from "@/components/game/multiplayerMode/gameplay/results/MultiplayerTeamVotingModal.vue";
import RoadView from "@/components/game/common/roadview/RoadView.vue";
import gameStore from "@/store/gameStore";

export default {
  name: "TeamRoadViewGame",
  
  // BaseMultiRoadViewGame 확장
  extends: BaseMultiRoadViewGame,

  components: {
    BaseMultiRoadViewGame,
    ChatWindow,
    TeamRoundResults,
    TeamGameResults,
    TeamVotingModal,
    RoadView,
  },

  data() {
    return {
      mapPreviewUrl: "",
      submittedPlayersCount: 0,
      allPlayersSubmitted: false
    };
  },

  computed: {
    currentUserTeam() {
      if (!gameStore.state.currentUser.teamId) return null;

      return gameStore.state.teams.find(
        (team) => team.id === gameStore.state.currentUser.teamId
      );
    },

    teamMembers() {
      if (!gameStore.state.currentUser.teamId) return [];

      return gameStore.state.players.filter(
        (player) =>
          player.teamId === gameStore.state.currentUser.teamId &&
          player.id !== gameStore.state.currentUser.id
      );
    },

    currentTeamMessages() {
      if (!gameStore.state.currentUser.teamId) return [];

      return (
        gameStore.state.teamChatMessages[gameStore.state.currentUser.teamId] ||
        []
      );
    },
  },

  created() {
    // 팀 모드로 설정
    this.isTeamMode = true;
    this.gameMode = 'team';
  },

  methods: {
    handleGuessSubmission(position) {
      // 위치 정보 유효성 검사
      if (!position || position.lat === undefined || position.lng === undefined) {
        console.error('유효하지 않은 위치 정보:', position);
        return;
      }
      console.log('팀 게임에서 위치 제출:', position);

      // 팀 게임에서는 제출이 바로 완료되지 않고 투표 프로세스를 시작
      this.submitTeamGuess(position);
    },
    
    submitTeamGuess(position) {
      if (!this.canSubmit) return;

      // 팀 투표 시작
      this.gameStore.startTeamVoting(this.gameStore.state.currentUser, position);
      
      // 지도 미리보기 URL 생성 (실제 구현에서는 카카오나 구글 지도 API를 통해 생성)
      this.mapPreviewUrl = `https://map-preview.example.com?lat=${position.lat}&lng=${position.lng}`;

      // 시스템 메시지 추가
      this.gameStore.addTeamChatMessage(
        this.gameStore.state.currentUser.teamId,
        `${this.gameStore.state.currentUser.nickname}님이 위치 제출을 제안했습니다. 투표해주세요!`,
        true
      );
    },

    handleVoteSubmission(vote) {
      this.gameStore.submitVote(vote.approved);

      // 모든 팀원이 투표했는지 확인
      if (this.gameStore.state.votingResults.total >= this.teamMembers.length) {
        this.finalizeTeamVoting();
      }
    },

    handleVotingComplete(result) {
      this.finalizeTeamVoting(result.approved);
    },

    finalizeTeamVoting(approved = null) {
      const isApproved = this.gameStore.finalizeVoting(approved);

      if (isApproved) {
        this.gameStore.addTeamChatMessage(
          this.gameStore.state.currentUser.teamId,
          "팀원들이 위치 제출에 동의했습니다!",
          true
        );

        this.submitGuess();

        setTimeout(() => {
          this.endRound();
        }, 1000);
      } else {
        this.gameStore.addTeamChatMessage(
          this.gameStore.state.currentUser.teamId,
          "팀원들이 위치 제출을 거부했습니다. 다시 시도해주세요.",
          true
        );
      }
    },

    sendTeamMessage(data) {
      const { teamId, message } = data;

      if (!teamId || !message.trim()) return;
      this.gameStore.addTeamChatMessage(teamId, message);
    },

    getTeamColor(teamId) {
      const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
      return colors[teamId % colors.length];
    },

    closeRoundResults() {
      this.gameStore.state.showRoundResults = false;
    },

    startNextRound() {
      // 상속한 BaseMultiRoadViewGame의 startNextRound 사용
      this.$super.startNextRound();
    },

    finishGame() {
      this.gameStore.finishGame();
    },

    restartGame() {
      this.gameStore.state.showGameResults = false;
      this.initGame();
    },

    exitToLobby() {
      this.exitToLobby();
    },
  },
};
</script>