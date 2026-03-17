const toComparableId = (value) => {
  if (value == null) {
    return null;
  }
  return String(value);
};

const isMatchingPlayerId = (player, candidateId) => {
  const normalizedCandidate = toComparableId(candidateId);
  if (!normalizedCandidate) {
    return false;
  }

  const playerId = toComparableId(player?.playerId);
  const memberId = toComparableId(player?.memberId);

  return (
    normalizedCandidate === playerId || normalizedCandidate === memberId
  );
};

export const mapServerPlayers = (gamePlayers = []) => {
  return gamePlayers.map((player) => ({
    playerId: player.playerId,
    memberId:
      player.memberId != null ? Number(player.memberId) : player.playerId,
    nickname: player.nickname || "알 수 없음",
    markerImageUrl: player.markerImageUrl || null,
    totalScore: player.totalScore != null ? Number(player.totalScore) : 0,
    roundRank: player.roundRank != null ? Number(player.roundRank) : 0,
    distanceToTarget: player.distanceToTarget || null,
    lastRoundScore: player.lastRoundScore || 0,
    gamePlayerStatus: player.gamePlayerStatus || "WAITING",
  }));
};

export const mapGamePlayersToLocalPlayers = (gamePlayers = []) => {
  return gamePlayers.map((player) => {
    const gamePlayerStatus = player.gamePlayerStatus || "WAITING";
    const submittedStatuses = new Set([
      "PLAYING",
      "FINISHED",
      "SUBMITTED",
      "ANSWERED",
    ]);
    const hasSubmitted =
      submittedStatuses.has(String(gamePlayerStatus).toUpperCase());

    return {
      id: String(player.playerId),
      memberId: String(
        player.memberId != null ? player.memberId : player.playerId,
      ),
      nickname: player.nickname || "알 수 없음",
      markerImageUrl: player.markerImageUrl || null,
      equippedMarker: player.markerImageUrl || null,
      totalScore: player.totalScore != null ? Number(player.totalScore) : 0,
      roundRank: player.roundRank != null ? Number(player.roundRank) : 0,
      score: player.totalScore != null ? Number(player.totalScore) : 0,
      hasSubmitted,
      gamePlayerStatus,
      distanceToTarget: player.distanceToTarget || null,
      lastRoundScore: player.lastRoundScore || 0,
    };
  });
};

export const updatePlayersFromRoundResult = (gamePlayers = [], roundResultData) => {
  const hasRoundPlayerResults =
    Array.isArray(roundResultData?.roundPlayerResults) &&
    roundResultData.roundPlayerResults.length > 0;
  const hasLegacyTotalResults =
    Array.isArray(roundResultData?.playerTotalResults) &&
    roundResultData.playerTotalResults.length > 0;

  if (!hasRoundPlayerResults && !hasLegacyTotalResults) {
    return gamePlayers;
  }

  const nextPlayers = gamePlayers.map((player) => ({ ...player }));

  if (hasRoundPlayerResults) {
    roundResultData.roundPlayerResults.forEach((result) => {
      const resultIds = [result?.playerId, result?.memberId, result?.id];
      const targetPlayer = nextPlayers.find((player) =>
        resultIds.some((id) => isMatchingPlayerId(player, id)),
      );

      if (!targetPlayer) {
        return;
      }

      if (result.memberId != null) {
        targetPlayer.memberId = Number(result.memberId);
      }

      if (result.gamePlayerStatus != null) {
        targetPlayer.gamePlayerStatus = result.gamePlayerStatus;
      }

      if (result.totalScore != null) {
        targetPlayer.totalScore = Number(result.totalScore);
      }

      if (result.roundRank != null) {
        targetPlayer.roundRank = Number(result.roundRank);
      }

      if (result.distance != null) {
        targetPlayer.distanceToTarget = Number(result.distance);
      }

      if (result.score != null) {
        targetPlayer.lastRoundScore = Number(result.score);
      }

      if (result.timeToAnswer != null) {
        targetPlayer.timeToAnswer = Number(result.timeToAnswer);
      }

      if (result.markerImageUrl) {
        targetPlayer.markerImageUrl = result.markerImageUrl;
      }
    });

    return nextPlayers;
  }

  const submissionById = new Map();
  (roundResultData.playerSubmissionResults || []).forEach((submission) => {
    [submission?.playerId, submission?.memberId, submission?.id]
      .map((id) => toComparableId(id))
      .filter(Boolean)
      .forEach((id) => {
        if (!submissionById.has(id)) {
          submissionById.set(id, submission);
        }
      });
  });

  roundResultData.playerTotalResults.forEach((result, index) => {
    const resultIds = [result?.playerId, result?.memberId];
    const targetPlayer = nextPlayers.find((player) =>
      resultIds.some((id) => isMatchingPlayerId(player, id)),
    );

    if (!targetPlayer) {
      return;
    }

    if (result.memberId != null) {
      targetPlayer.memberId = Number(result.memberId);
    }

    if (result.gamePlayerStatus != null) {
      targetPlayer.gamePlayerStatus = result.gamePlayerStatus;
    }

    if (result.totalScore != null) {
      targetPlayer.totalScore = Number(result.totalScore);
    }

    if (result.roundRank != null) {
      targetPlayer.roundRank = Number(result.roundRank);
    }

    let submission = null;
    for (const id of resultIds) {
      const normalizedId = toComparableId(id);
      if (normalizedId && submissionById.has(normalizedId)) {
        submission = submissionById.get(normalizedId);
        break;
      }
    }

    // 하위 호환: 식별자가 없는 응답에서는 기존 인덱스 fallback
    if (!submission) {
      submission = roundResultData.playerSubmissionResults?.[index];
    }

    if (!submission) {
      return;
    }

    if (submission.distance != null) {
      targetPlayer.distanceToTarget = Number(submission.distance);
    }

    if (submission.earnedScore != null) {
      targetPlayer.lastRoundScore = Number(submission.earnedScore);
    }

    if (submission.markerImageUrl) {
      targetPlayer.markerImageUrl = submission.markerImageUrl;
    } else if (result.markerImageUrl) {
      targetPlayer.markerImageUrl = result.markerImageUrl;
    }

    if (submission.timeToAnswer != null) {
      targetPlayer.timeToAnswer = Number(submission.timeToAnswer);
    }
  });

  return nextPlayers;
};

export const enrichPlayerGuessesWithMarkers = (
  playerGuesses = [],
  gamePlayers = [],
) => {
  return playerGuesses.map((guess) => {
    const guessIds = [guess?.playerId, guess?.memberId];
    const targetPlayer = gamePlayers.find((player) =>
      guessIds.some((id) => isMatchingPlayerId(player, id)),
    );

    if (!targetPlayer?.markerImageUrl) {
      return guess;
    }

    return {
      ...guess,
      markerImageUrl: targetPlayer.markerImageUrl,
    };
  });
};

export const applySubmissionStatusToPlayers = (gamePlayers = [], submissionData) => {
  const { playerId, memberId } = submissionData || {};
  if (!playerId && !memberId) {
    return {
      gamePlayers,
      updatedPlayer: null,
    };
  }

  const nextPlayers = gamePlayers.map((player) => ({ ...player }));
  const updatedPlayer = nextPlayers.find((player) => {
    return [playerId, memberId].some((id) => isMatchingPlayerId(player, id));
  });

  if (!updatedPlayer) {
    return {
      gamePlayers,
      updatedPlayer: null,
    };
  }

  const nextStatus = submissionData?.gamePlayerStatus || "PLAYING";
  updatedPlayer.gamePlayerStatus = String(nextStatus).toUpperCase();
  if (memberId != null && updatedPlayer.memberId == null) {
    updatedPlayer.memberId = Number(memberId);
  }

  return {
    gamePlayers: nextPlayers,
    updatedPlayer,
  };
};

export default {
  mapServerPlayers,
  mapGamePlayersToLocalPlayers,
  updatePlayersFromRoundResult,
  enrichPlayerGuessesWithMarkers,
  applySubmissionStatusToPlayers,
};
