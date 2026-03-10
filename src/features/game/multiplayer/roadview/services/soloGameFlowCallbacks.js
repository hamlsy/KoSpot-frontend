import {
  applySubmissionStatusToPlayers,
  enrichPlayerGuessesWithMarkers,
  mapServerPlayers,
  updatePlayersFromRoundResult,
} from "@/features/game/multiplayer/roadview/services/soloGamePlayerMapper";

const resetServerPlayersToWaiting = (gamePlayers = []) => {
  gamePlayers.forEach((player) => {
    player.gamePlayerStatus = "WAITING";
    player.distanceToTarget = null;
    player.lastRoundScore = 0;
  });
};

const syncCurrentUserProfileFromGamePlayers = (vm) => {
  const memberId = localStorage.getItem("memberId");
  if (!memberId) {
    return;
  }

  if (!vm.gameStore.state.currentUser) {
    vm.gameStore.state.currentUser = {
      id: memberId,
      nickname: localStorage.getItem("nickname") || "플레이어",
      markerImageUrl: null,
      equippedMarker: null,
    };
  }

  const currentPlayerInfo = vm.gamePlayers.find((player) => {
    const playerMemberId =
      player.memberId != null ? String(player.memberId) : null;
    const playerPlayerId =
      player.playerId != null ? String(player.playerId) : null;

    return (
      (playerMemberId && String(memberId) === playerMemberId) ||
      (playerPlayerId && String(memberId) === playerPlayerId)
    );
  });

  if (!currentPlayerInfo) {
    return;
  }

  if (currentPlayerInfo.markerImageUrl) {
    vm.gameStore.state.currentUser.markerImageUrl = currentPlayerInfo.markerImageUrl;
    vm.gameStore.state.currentUser.equippedMarker = currentPlayerInfo.markerImageUrl;
  }

  if (currentPlayerInfo.nickname) {
    vm.gameStore.state.currentUser.nickname = currentPlayerInfo.nickname;
  }
};

export const createSoloGameFlowCallbacks = (vm) => {
  return {
    onIntroShow: () => {
      console.log("[Solo Game] 인트로 오버레이 표시");
      vm.isRetryingRoadview = false;

      if (!vm.isDummyRuntime && vm.gamePlayers?.length) {
        resetServerPlayersToWaiting(vm.gamePlayers);
        console.log(
          "[Solo Game] 첫 라운드 시작 - 플레이어 제출 상태 초기화: WAITING",
        );
      }

      if (vm.$refs.baseGame) {
        vm.$refs.baseGame.showIntroOverlay = true;
      }
    },

    onRoundResultShow: () => {
      console.log("[Solo Game] 라운드 결과 표시");
    },

    onNextRoundShow: () => {
      console.log("[Solo Game] 다음 라운드 오버레이 표시");
      vm.isRetryingRoadview = false;

      if (!vm.isDummyRuntime && vm.gamePlayers?.length) {
        resetServerPlayersToWaiting(vm.gamePlayers);
        console.log(
          "[Solo Game] 다음 라운드 시작 - 플레이어 제출 상태 초기화: WAITING",
        );
      }

      vm.currentUserRank = vm.calculateUserRank();
      const totalPlayers = vm.isDummyRuntime
        ? vm.gameStore.state.players.length
        : vm.gamePlayers.length;

      if (vm.$refs.baseGame) {
        vm.$refs.baseGame.startNextRound(vm.currentUserRank, totalPlayers);
      }
    },

    onNextRound: (message) => {
      console.log("[Solo Game] 라운드 데이터 수신 (서버 모드):", message);
      vm.processRoundData(message, message.isReIssue || false);
    },

    onGameFinish: (finalGameResult) => {
      console.log(
        "[Solo Game] 게임 종료 - WebSocket 메시지 수신:",
        finalGameResult,
      );

      if (!finalGameResult || typeof finalGameResult !== "object") {
        console.warn("[Solo Game] 게임 종료 메시지에 finalGameResult 데이터가 없음");
        return;
      }

      if (
        !Array.isArray(finalGameResult.playerResults) ||
        finalGameResult.playerResults.length === 0
      ) {
        console.warn(
          "[Solo Game] 게임 종료 메시지에 playerResults가 없거나 빈 배열임",
        );
        return;
      }

      vm.finalGameResult = finalGameResult;
      vm.showGameResults = true;

      if (vm.gameStartTime) {
        vm.totalGameTime = Math.floor((Date.now() - vm.gameStartTime) / 1000);
      }

      vm.calculatePlayerAverageDistances();
      vm.startAutoExitCountdown(30);
    },

    onTimerStart: () => {
      if (!vm?.isServerMode) {
        return;
      }

      if (typeof vm.handleServerTimerSignal === "function") {
        vm.handleServerTimerSignal();
      }
    },

    onTimerSync: (message) => {
      if (!vm.gameStore) {
        return;
      }

      if (message?.remainingTimeMs != null) {
        const remainingSeconds = Math.max(
          0,
          Number(message.remainingTimeMs) / 1000,
        );
        vm.gameStore.state.remainingTime = remainingSeconds;
      }
    },

    onGamePlayersUpdate: (gamePlayers) => {
      console.log(
        "[Solo Game] 플레이어 정보 업데이트 (처음 게임 시작할 때 받는 정보):",
        gamePlayers,
      );

      vm.gamePlayers = mapServerPlayers(gamePlayers);
      syncCurrentUserProfileFromGamePlayers(vm);
    },

    onRoundResultUpdate: (roundResultData) => {
      vm.gamePlayers = updatePlayersFromRoundResult(vm.gamePlayers, roundResultData);

      if (Array.isArray(roundResultData?.playerGuesses)) {
        const updatedPlayerGuesses = enrichPlayerGuessesWithMarkers(
          roundResultData.playerGuesses,
          vm.gamePlayers,
        );

        if (vm.gameStore?.state) {
          vm.gameStore.state.playerGuesses = updatedPlayerGuesses;
        }
      }
    },

    onPlayerSubmission: (submissionData) => {
      console.log("[Solo Game] 플레이어 제출 알림 수신:", submissionData);

      const { gamePlayers, updatedPlayer } = applySubmissionStatusToPlayers(
        vm.gamePlayers,
        submissionData,
      );
      vm.gamePlayers = gamePlayers;

      if (updatedPlayer) {
        console.log(
          `[Solo Game] 플레이어 ${
            updatedPlayer.nickname || submissionData?.playerId
          } 제출 완료 - 상태 업데이트: PLAYING`,
        );
      } else {
        console.warn(
          `[Solo Game] 플레이어를 찾을 수 없음: playerId=${submissionData?.playerId}, memberId=${submissionData?.memberId}`,
        );
      }
    },
  };
};

export default {
  createSoloGameFlowCallbacks,
};
