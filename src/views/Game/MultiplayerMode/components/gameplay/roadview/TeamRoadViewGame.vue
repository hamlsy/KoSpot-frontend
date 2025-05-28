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
      gameStore, // 게임 스토어 참조
      mapPreviewUrl: "",
      submittedPlayersCount: 0,
      allPlayersSubmitted: false,
      roomId: "team-room-1", // 테스트용 방 ID
      gameMode: "team",
      roundTimer: null, // 라운드 타이머
      toastTimeout: null, // 토스트 메시지 타이머
      toastMessage: "",
      showToastFlag: false
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
    // 테스트 데이터 로드 및 게임 초기화
    this.gameStore.loadTestData(true);
    this.initGame();
  },
  
  beforeUnmount() {
    this.clearTimer();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
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
    
    // 타이머 시작 메서드
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
    
    // 타이머 정리 메서드
    clearTimer() {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
    },
    
    // 라운드 종료 메서드
    endRound() {
      // 라운드 종료 처리
      this.clearTimer();
      this.gameStore.endGameRound();

      // 플레이어 점수 계산 및 정렬
      this.calculatePlayerScores();

      // 라운드 종료 상태로 설정 (결과 화면 표시를 위해)
      this.gameStore.state.roundEnded = true;

      console.log("라운드 종료:", this.gameMode);
    },
    
    // 게임 초기화 메서드
    initGame() {
      this.gameStore.initGame();
      this.fetchRoundData();
    },
    
    // 라운드 데이터 가져오기
    fetchRoundData() {
      // 테스트 데이터에서 위치 가져오기
      setTimeout(() => {
        const getRandomLocation = () => {
          const locations = [
            { lat: 37.5665, lng: 126.9780, name: "서울시청", description: "서울 중심부에 위치한 시청" },
            { lat: 35.1796, lng: 129.0756, name: "부산 해운대", description: "부산의 유명한 해변" },
            { lat: 33.4996, lng: 126.5312, name: "제주 성산일출봉", description: "제주도의 유명한 관광지" }
          ];
          return locations[Math.floor(Math.random() * locations.length)];
        };
        
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
    
    // 플레이어 점수 계산
    calculatePlayerScores() {
      // 각 플레이어의 점수 계산 (거리 기반)
      if (!this.gameStore.state.actualLocation) return;
      
      const actualLat = this.gameStore.state.actualLocation.lat;
      const actualLng = this.gameStore.state.actualLocation.lng;
      
      this.gameStore.state.playerGuesses.forEach(guess => {
        const distance = this.calculateDistance(
          actualLat, actualLng,
          guess.position.lat, guess.position.lng
        );
        
        // 거리에 따른 점수 계산 (0~5000점)
        const score = Math.max(0, Math.floor(5000 - distance * 10));
        guess.score = score;
        guess.distance = distance.toFixed(2);
        
        // 플레이어 정보 업데이트
        const player = this.gameStore.state.players.find(p => p.id === guess.playerId);
        if (player) {
          // 누적 점수 계산
          if (!player.totalScore) player.totalScore = 0;
          player.totalScore += score;
          
          // PlayerList 컴포넌트에서 사용하는 속성명으로 설정
          player.score = player.totalScore;
          player.lastScore = score;
          player.lastRoundScore = score;
          player.distanceToTarget = parseFloat(distance.toFixed(2));
        }
      });
      
      console.log('점수 계산 완료:', this.gameStore.state.players);
      
      // 점수 기준으로 정렬
      this.gameStore.state.players.sort((a, b) => (b.score || 0) - (a.score || 0));
      this.gameStore.state.topPlayer = {
        playerName: this.gameStore.state.players[0].nickname,
        distance: this.gameStore.state.players[0].distanceToTarget
      }
    },
    
    // 거리 계산 함수 (Haversine 공식)
    calculateDistance(lat1, lon1, lat2, lon2) {
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
    
    // 토스트 메시지 표시
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
      // 라운드 결과 닫기
      this.gameStore.state.showRoundResults = false;
      this.gameStore.state.roundEnded = false;

      // 다음 라운드를 위한 상태 초기화
      this.allPlayersSubmitted = false;
      this.submittedPlayersCount = 0;
      this.gameStore.state.playerGuesses = [];

      // 플레이어의 마지막 라운드 점수 초기화
      this.gameStore.state.players.forEach((player) => {
        player.lastRoundScore = null;
        player.hasSubmitted = false;
      });

      // 다음 라운드 시작
      if (this.gameStore.state.currentRound < this.gameStore.state.totalRounds) {
        this.gameStore.state.currentRound++;
        this.gameStore.state.hasSubmittedGuess = false;
        this.gameStore.state.guessPosition = null;
        this.fetchRoundData();

        console.log("다음 라운드 시작:", this.gameMode);
      } else {
        // 모든 라운드 완료
        this.gameStore.finishGame();
      }
    },

    finishGame() {
      this.gameStore.finishGame();
    },

    restartGame() {
      this.gameStore.state.showGameResults = false;
      this.initGame();
      // 팀 모드에 맞는 추가 초기화 로직이 필요하다면 여기에 구현
    },

    exitToLobby() {
      this.exitToLobby();
    },
  },
};
</script>