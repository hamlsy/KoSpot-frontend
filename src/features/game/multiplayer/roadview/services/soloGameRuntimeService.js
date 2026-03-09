const DEFAULT_LOCATION_INFO = {
  name: "",
  description: "",
  image: "",
  fact: "",
  poiName: "",
  fullAddress: "",
};

const DEFAULT_DUMMY_LOCATIONS = [
  {
    lat: 37.5665,
    lng: 126.978,
    name: "서울시청",
    description: "서울 중심부에 위치한 시청",
  },
  {
    lat: 35.1796,
    lng: 129.0756,
    name: "부산 해운대",
    description: "부산의 유명한 해변",
  },
  {
    lat: 33.4996,
    lng: 126.5312,
    name: "제주 성산일출봉",
    description: "제주도의 유명한 관광지",
  },
];

const DEFAULT_PLAYER_COLORS = [
  "#FF4081",
  "#E040FB",
  "#7C4DFF",
  "#536DFE",
  "#448AFF",
  "#40C4FF",
  "#18FFFF",
  "#64FFDA",
  "#69F0AE",
  "#B2FF59",
  "#EEFF41",
  "#FFFF00",
  "#FFD740",
  "#FFAB40",
  "#FF6E40",
];

const ensureLocationInfo = (gameStore) => {
  if (!gameStore.state.locationInfo) {
    gameStore.state.locationInfo = { ...DEFAULT_LOCATION_INFO };
  }
};

export const processRoundDataState = ({
  gameStore,
  message,
  isReIssue = false,
  isDummyRuntime = false,
  currentPoiName = "",
}) => {
  if (message.currentRound != null) {
    gameStore.state.currentRound = Number(message.currentRound);
  }

  if (message.totalRounds != null) {
    gameStore.state.totalRounds = message.totalRounds;
  }

  const targetLat =
    message.roundInfo?.targetLat ?? message.targetLat ?? message.location?.lat;
  const targetLng =
    message.roundInfo?.targetLng ?? message.targetLng ?? message.location?.lng;

  if (targetLat != null && targetLng != null) {
    const normalizedLocation = {
      lat: Number(targetLat),
      lng: Number(targetLng),
    };

    gameStore.state.currentLocation = normalizedLocation;
    gameStore.state.actualLocation = normalizedLocation;
  }

  if (message.locationInfo) {
    gameStore.state.locationInfo = message.locationInfo;
  }

  const poiName =
    message.roundInfo?.poiName ||
    message.poiName ||
    message.locationInfo?.poiName ||
    "";

  let nextPoiName = currentPoiName;
  if (poiName) {
    ensureLocationInfo(gameStore);
    gameStore.state.locationInfo.poiName = poiName;
    nextPoiName = poiName;
  } else if (!isReIssue) {
    nextPoiName = "";
  }

  if (message.roundTime != null) {
    gameStore.state.remainingTime = message.roundTime;
  }

  if (!isReIssue) {
    gameStore.state.roundEnded = false;
    gameStore.state.hasSubmittedGuess = false;
    gameStore.state.userGuess = null;
    gameStore.state.playerGuesses = [];
    gameStore.state.showRoundResults = false;

    if (isDummyRuntime) {
      gameStore.state.players.forEach((player) => {
        player.hasSubmitted = false;
      });
    }
  }

  return {
    nextPoiName,
    shouldResetSimulationFlags: !isReIssue,
    shouldTriggerDummySimulation: !isReIssue && isDummyRuntime,
  };
};

export const getColorByPlayerId = (id) => {
  if (!id) {
    return DEFAULT_PLAYER_COLORS[
      Math.floor(Math.random() * DEFAULT_PLAYER_COLORS.length)
    ];
  }

  const idSum = id
    .toString()
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return DEFAULT_PLAYER_COLORS[idSum % DEFAULT_PLAYER_COLORS.length];
};

export const appendPlayerGuess = ({ gameStore, playerId, position, color }) => {
  const player = gameStore.state.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    return false;
  }

  if (!Array.isArray(gameStore.state.playerGuesses)) {
    gameStore.state.playerGuesses = [];
  }

  gameStore.state.playerGuesses.push({
    playerId,
    playerName: player.nickname,
    position,
    color,
  });

  return true;
};

export const submitDummyAnswerState = ({ gameStore, position, colorResolver }) => {
  const currentPlayer = gameStore.state.currentUser;
  if (!currentPlayer) {
    return null;
  }

  gameStore.state.userGuess = { position };
  gameStore.state.hasSubmittedGuess = true;

  const playerIndex = gameStore.state.players.findIndex(
    (player) => player.id === currentPlayer.id,
  );
  if (playerIndex !== -1) {
    gameStore.state.players[playerIndex].hasSubmitted = true;
  }

  if (!Array.isArray(gameStore.state.playerGuesses)) {
    gameStore.state.playerGuesses = [];
  }

  const guessInfo = {
    playerId: currentPlayer.id,
    playerName: currentPlayer.nickname,
    position,
    color: colorResolver(currentPlayer.id),
  };

  gameStore.state.playerGuesses.push(guessInfo);

  return {
    currentPlayer,
    guessInfo,
  };
};

export const evaluateSubmissionProgress = ({ gameStore, allPlayersSubmitted }) => {
  if (gameStore.state.roundEnded || allPlayersSubmitted) {
    return {
      blockedReason: "ALREADY_FINISHED",
      submittedPlayers: gameStore.state.playerGuesses?.length || 0,
      totalPlayers: gameStore.state.players?.length || 0,
      shouldEndRound: false,
    };
  }

  const totalPlayers = gameStore.state.players.length;
  const submittedPlayers = gameStore.state.playerGuesses.length;

  if (!gameStore.state.hasSubmittedGuess) {
    return {
      blockedReason: "CURRENT_USER_PENDING",
      submittedPlayers,
      totalPlayers,
      shouldEndRound: false,
    };
  }

  return {
    blockedReason: null,
    submittedPlayers,
    totalPlayers,
    shouldEndRound: submittedPlayers >= totalPlayers,
  };
};

export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export const calculatePlayerScores = (gameStore) => {
  if (!gameStore.state.actualLocation) {
    return;
  }

  const actualLat = gameStore.state.actualLocation.lat;
  const actualLng = gameStore.state.actualLocation.lng;

  gameStore.state.playerGuesses.forEach((guess) => {
    const distance = calculateDistanceKm(
      actualLat,
      actualLng,
      guess.position.lat,
      guess.position.lng,
    );

    const score = Math.max(0, Math.floor(12 - distance * 0.01));
    guess.score = score;
    guess.distance = distance.toFixed(2);

    const player = gameStore.state.players.find((candidate) => candidate.id === guess.playerId);
    if (!player) {
      return;
    }

    if (!player.totalScore) {
      player.totalScore = 0;
    }

    player.totalScore += score;
    player.score = player.totalScore;
    player.lastScore = score;
    player.lastRoundScore = score;
    player.distanceToTarget = parseFloat(distance.toFixed(2));
  });

  gameStore.state.players.sort((a, b) => (b.score || 0) - (a.score || 0));

  if (gameStore.state.players.length > 0) {
    gameStore.state.topPlayer = {
      playerName: gameStore.state.players[0].nickname,
      distance: gameStore.state.players[0].distanceToTarget,
    };
  }
};

export const calculateAverageDistances = (players = []) => {
  players.forEach((player) => {
    let totalDistance = 0;
    let roundCount = 0;

    if (Array.isArray(player.roundDistances)) {
      totalDistance = player.roundDistances.reduce(
        (sum, distance) => sum + distance,
        0,
      );
      roundCount = player.roundDistances.length;
    } else if (player.distanceToTarget !== undefined) {
      totalDistance = player.distanceToTarget;
      roundCount = 1;
    }

    player.averageDistance = roundCount > 0 ? totalDistance / roundCount : 0;
  });
};

export const buildDummyFinalGameResult = (players = []) => {
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return {
    gameId: null,
    message: "게임이 종료되었습니다.",
    timestamp: Date.now(),
    playerResults: sortedPlayers.map((player, index) => ({
      playerId: player.id,
      nickname: player.nickname || "알 수 없음",
      markerImageUrl: player.markerImageUrl || player.equippedMarker || null,
      totalScore: player.totalScore || player.score || 0,
      finalRank: index + 1,
      earnedPoint: Math.floor((player.totalScore || player.score || 0) / 10),
    })),
  };
};

export const createDummyRoundDataMessage = (gameStore) => {
  return {
    roundNumber: gameStore.state.currentRound,
    location: gameStore.state.currentLocation || {
      lat: 37.5665 + (Math.random() - 0.5) * 0.1,
      lng: 126.978 + (Math.random() - 0.5) * 0.1,
    },
    locationInfo: gameStore.state.locationInfo,
    roundTime: 120,
    roundInfo: {
      poiName: gameStore.state.locationInfo?.name || "더미 지명",
    },
  };
};

export const getRandomDummyLocation = () => {
  return DEFAULT_DUMMY_LOCATIONS[
    Math.floor(Math.random() * DEFAULT_DUMMY_LOCATIONS.length)
  ];
};

export const applyDummyLocationToStore = ({ gameStore, location }) => {
  const locationCoords = {
    lat: location.lat,
    lng: location.lng,
  };

  gameStore.state.currentLocation = locationCoords;
  gameStore.state.actualLocation = locationCoords;
  gameStore.state.locationInfo = {
    name: location.name,
    description: location.description,
    image: location.image,
    fact: location.fact,
  };
};

export const calculateUserRankByScore = (players, userId) => {
  if (!Array.isArray(players) || players.length === 0 || !userId) {
    return 1;
  }

  const sortedPlayers = [...players].sort(
    (a, b) => (b.totalScore || b.score || 0) - (a.totalScore || a.score || 0),
  );

  const currentUserIndex = sortedPlayers.findIndex(
    (player) => String(player.id) === String(userId),
  );

  return currentUserIndex !== -1 ? currentUserIndex + 1 : 1;
};

export default {
  processRoundDataState,
  getColorByPlayerId,
  appendPlayerGuess,
  submitDummyAnswerState,
  evaluateSubmissionProgress,
  calculatePlayerScores,
  calculateAverageDistances,
  buildDummyFinalGameResult,
  createDummyRoundDataMessage,
  getRandomDummyLocation,
  applyDummyLocationToStore,
  calculateUserRankByScore,
};
