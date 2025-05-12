<template>
  <base-multi-road-view-game
    :room-id="roomId"
    @guess-submitted="onGuessSubmitted"
  >
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
import gameStore from "@/store/gameStore";

export default {
  name: "TeamRoadViewGame",

  components: {
    BaseMultiRoadViewGame,
    ChatWindow,
    TeamRoundResults,
    TeamGameResults,
    TeamVotingModal,
  },

  props: {
    roomId: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      gameStore,
      mapPreviewUrl: "",
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
    this.$parent.isTeamMode = true;
  },

  methods: {
    submitTeamGuess() {
      if (!this.$parent.canSubmit) return;

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
          "팀원들이 위치 제출에 동의했습니다!",
          true
        );

        this.$parent.submitGuess();

        setTimeout(() => {
          this.$parent.endRound();
        }, 1000);
      } else {
        gameStore.addTeamChatMessage(
          gameStore.state.currentUser.teamId,
          "팀원들이 위치 제출을 거부했습니다. 다시 시도해주세요.",
          true
        );
      }
    },

    sendTeamMessage(data) {
      const { teamId, message } = data;

      if (!teamId || !message.trim()) return;
      gameStore.addTeamChatMessage(teamId, message);
    },

    getTeamColor(teamId) {
      const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
      return colors[teamId % colors.length];
    },

    closeRoundResults() {
      gameStore.state.showRoundResults = false;
    },

    startNextRound() {
      // 부모 컴포넌트의 메서드 호출
      this.$parent.startNextRound();
    },

    finishGame() {
      gameStore.finishGame();
    },

    restartGame() {
      gameStore.state.showGameResults = false;
      this.$parent.initGame();
    },

    exitToLobby() {
      this.$parent.exitToLobby();
    },
  },
};
</script>