import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoomWebSocket } from './useRoomWebSocket';
import { useRoomModal } from './useRoomModal';
import { useRoomChat } from './useRoomChat';
import { useRoomPlayer } from './useRoomPlayer';
import roomApiService from '../services/roomApi.service.js';
import roomWebSocketService from '../services/roomWebSocket.service.js';
import screenStateSyncService, {
  extractMemberKeyFromPlayer,
  extractScreenStateSeq,
  extractScreenStateUpdatedAt,
  mergeScreenStateFields,
  normalizeIncomingScreenState,
  shouldApplyScreenState,
  toMemberKey,
} from '../services/screenStateSync.service.js';
import { soloTestData, testData } from '../composables/MultiplayerGameTestData.js';
import soloGameWebSocket from '@/features/game/multiplayer/roadview/services/soloGameWebSocket';

/**
 * Room 통합 관리 컴포저블
 * 방 관련 모든 기능을 통합하여 관리합니다.
 */
export function useRoom(props, emit, options = {}) {
  const { toastRef = null, onGameStartMessage = null, dummyMode = false } = options || {};
  // 로컬 상태 (props 복사)
  const localRoomData = ref({ ...props.roomData });

  // 실시간 업데이트 상태
  const isLoadingPlayerList = ref(false);
  const lastPlayerListUpdate = ref(Date.now());
  const isStartingGame = ref(false);
  const isDummyMode = ref(Boolean(dummyMode));
  const hasDisconnected = ref(false);
  const hasReceivedPlayerListSignal = ref(false);
  const disconnectReason = ref(null);
  const setDisconnectReason = (reason) => {
    disconnectReason.value = reason || null;
  };

  const prepareForGameNavigation = () => {
    setDisconnectReason('navigate-room');
    hasDisconnected.value = false;
  };

  const disconnectWebSocket = async () => {
    if (hasDisconnected.value || isDummyMode.value) {
      return;
    }

    hasDisconnected.value = true;

    try {
      const reason = disconnectReason.value;
      await roomWebSocketService.disconnectFromRoom(
        localRoomData.value.id,
        props.currentUserId,
        props.isHost,
        { reason }
      );

      console.log('🔌 WebSocket 연결 해제 완료');
    } catch (error) {
      console.error('❌ WebSocket 연결 해제 중 오류:', error);
    } finally {
      disconnectReason.value = null;
      hasReceivedPlayerListSignal.value = false;
    }
  };


  // 각 기능별 composables 초기화
  const roomWebSocket = useRoomWebSocket();
  const roomModal = useRoomModal();
  const roomChat = useRoomChat();
  const roomPlayer = useRoomPlayer(props);

  // props 변경 시 로컬 상태 업데이트
  watch(() => props.roomData, (newVal) => {
    localRoomData.value = { ...newVal };
  }, { deep: true });

  // Computed properties
  const isTeamMode = computed(() => {
    return localRoomData.value.isTeamMode === true;
  });

  const canStartGame = computed(() => {
    return roomPlayer.canStartGame(isTeamMode.value);
  });

  const joiningPlayers = computed(() => {
    return roomPlayer.localPlayers.value.filter(
      (player) => normalizeIncomingScreenState(player?.screenState) === 'JOINING',
    );
  });

  const hasJoiningPlayers = computed(() => joiningPlayers.value.length > 0);

  const allPlayersInRoomState = computed(() => {
    return roomPlayer.localPlayers.value.every(
      (player) => normalizeIncomingScreenState(player?.screenState) === 'ROOM',
    );
  });

  const hasNonRoomPlayers = computed(() => !allPlayersInRoomState.value);

  const isPlayerListReady = computed(() => {
    if (isDummyMode.value) {
      return true;
    }

    return hasReceivedPlayerListSignal.value;
  });

  const canStartGameWithScreenGate = computed(() => {
    if (isDummyMode.value) {
      return canStartGame.value;
    }

    return canStartGame.value && isPlayerListReady.value && !hasNonRoomPlayers.value;
  });

  const startBlockReason = computed(() => {
    if (isDummyMode.value) {
      return null;
    }

    if (!canStartGame.value) {
      return 'insufficient-players';
    }

    if (!isPlayerListReady.value) {
      return 'sync-pending';
    }

    if (hasJoiningPlayers.value) {
      return 'joining-players';
    }

    if (hasNonRoomPlayers.value) {
      return 'non-room-players';
    }

    return null;
  });

  const transformGameRoomPlayers = (players = []) => {
    if (!Array.isArray(players)) {
      return [];
    }

    return players.map((player, index) => {
      const memberId = player?.memberId ?? player?.id ?? `player-${index}`;

      return {
        id: memberId != null ? memberId.toString() : `player-${index}`,
        memberId: memberId,
        nickname: player?.nickname || '알 수 없는 플레이어',
        profileImage: player?.markerImageUrl || player?.profileImage || '',
        markerImageUrl: player?.markerImageUrl || '',
        isHost: Boolean(player?.isHost),
        teamId: player?.team ?? player?.teamId ?? null,
        team: player?.team ?? null,
        isOnline: 'isOnline' in (player || {}) ? Boolean(player.isOnline) : true,
        joinedAt: player?.joinedAt ? new Date(player.joinedAt) : new Date(),
        screenState: normalizeIncomingScreenState(player?.screenState),
        screenStateSeq: extractScreenStateSeq(player, 0),
        screenStateUpdatedAt: extractScreenStateUpdatedAt(player, null),
        raw: player
      };
    });
  };

  const transformGameRoomPlayer = (playerInfo) => {
    if (!playerInfo) {
      return null;
    }
    const transformed = transformGameRoomPlayers([playerInfo]);
    return transformed.length ? transformed[0] : null;
  };

  const mergeScreenStateFromFullSync = (incomingPlayers = []) => {
    const currentPlayers = Array.isArray(roomPlayer.localPlayers.value)
      ? roomPlayer.localPlayers.value
      : [];

    if (!currentPlayers.length) {
      return incomingPlayers;
    }

    const currentByMemberKey = new Map();
    currentPlayers.forEach((player) => {
      const key = toMemberKey(player?.memberId ?? player?.id);
      if (key) {
        currentByMemberKey.set(key, player);
      }
    });

    return incomingPlayers.map((incomingPlayer) => {
      const key = toMemberKey(incomingPlayer?.memberId ?? incomingPlayer?.id);
      if (!key || !currentByMemberKey.has(key)) {
        return incomingPlayer;
      }

      const currentPlayer = currentByMemberKey.get(key);
      const incomingSeq = extractScreenStateSeq(incomingPlayer, 0);
      const currentSeq = extractScreenStateSeq(currentPlayer, 0);

      const shouldApplyIncoming = shouldApplyScreenState(
        currentSeq,
        incomingSeq,
        currentPlayer?.screenState,
        incomingPlayer?.screenState,
      );

      if (shouldApplyIncoming) {
        return incomingPlayer;
      }

      return {
        ...incomingPlayer,
        screenState: normalizeIncomingScreenState(currentPlayer?.screenState),
        screenStateSeq: currentSeq,
        screenStateUpdatedAt: extractScreenStateUpdatedAt(currentPlayer, null),
      };
    });
  };

  const applyScreenStateDelta = (playerInfo) => {
    const targetMemberKey = extractMemberKeyFromPlayer(playerInfo);
    if (!targetMemberKey) {
      return false;
    }

    const transformedPlayer = transformGameRoomPlayer(playerInfo);
    if (!transformedPlayer) {
      return false;
    }

    let didUpdate = false;
    let didFindTarget = false;
    const nextPlayers = roomPlayer.localPlayers.value.map((player) => {
      const memberKey = toMemberKey(player?.memberId ?? player?.id);
      if (memberKey !== targetMemberKey) {
        return player;
      }

      didFindTarget = true;

      const mergedPlayer = mergeScreenStateFields(player, playerInfo);
      if (mergedPlayer !== player) {
        didUpdate = true;
      }
      return mergedPlayer;
    });

    if (!didFindTarget) {
      nextPlayers.push(transformedPlayer);
      didUpdate = true;
    }

    if (!didUpdate) {
      return false;
    }

    roomPlayer.updatePlayerList(nextPlayers);
    localRoomData.value.currentPlayerCount = nextPlayers.length;
    emit('player-list-updated', nextPlayers);
    return true;
  };

  const buildDummyRoomData = (source) => {
    const baseRoom = source?.roomData || {};
    const fallbackGameMode = props.roomData?.gameMode || localRoomData.value.gameMode || 'roadview';
    const derivedIsTeamMode = props.roomData?.isTeamMode ?? (baseRoom.matchType === 'team');

    return {
      ...localRoomData.value,
      id: props.roomData?.id || baseRoom.id || localRoomData.value.id || 'dummy-room',
      title: baseRoom.title || baseRoom.name || localRoomData.value.title || '테스트 게임방',
      gameMode: fallbackGameMode,
      isTeamMode: derivedIsTeamMode,
      maxPlayers: baseRoom.maxPlayers ?? localRoomData.value.maxPlayers ?? 8,
      rounds: baseRoom.rounds ?? localRoomData.value.rounds ?? 5,
      timeLimit: baseRoom.timeLimit ?? localRoomData.value.timeLimit ?? 60,
      isPrivate: baseRoom.isPrivate ?? localRoomData.value.isPrivate ?? false,
      password: baseRoom.password ?? localRoomData.value.password ?? '',
      hostId: baseRoom.hostId || source?.currentUser?.id || localRoomData.value.hostId || props.currentUserId || '',
      currentPlayerCount: (source?.players?.length ?? localRoomData.value.currentPlayerCount ?? 0),
      createdAt: localRoomData.value.createdAt || new Date().toISOString(),
    };
  };

  const normalizeDummyPlayers = (players, hostId) => {
    if (!Array.isArray(players)) {
      return [];
    }

    return players.map((player, index) => ({
      ...player,
      id: player.id ? player.id.toString() : `dummy-player-${index}`,
      isHost: player.isHost ?? (player.id === hostId),
      isOnline: true,
      joinedAt: player.joinedAt ? new Date(player.joinedAt) : new Date(),
    }));
  };

  const loadDummyRoomData = async (reason = 'manual-trigger') => {
    console.log(`🧪 더미 데이터 로딩 시작 (reason: ${reason})`);
    const source = (props.roomData?.isTeamMode || localRoomData.value.isTeamMode) ? testData : soloTestData;

    try {
      isLoadingPlayerList.value = true;

      const transformedRoom = buildDummyRoomData(source);
      const dummyPlayers = normalizeDummyPlayers(source?.players, transformedRoom.hostId);

      localRoomData.value = transformedRoom;
      roomPlayer.updatePlayerList(dummyPlayers);
      emit('player-list-updated', dummyPlayers);

      localRoomData.value.currentPlayerCount = dummyPlayers.length;
      lastPlayerListUpdate.value = Date.now();

      roomChat.addSystemMessage('오프라인 테스트 모드: 더미 플레이어 데이터가 적용되었습니다.');
      if (toastRef?.value) {
        toastRef.value.showSuccessNotification('테스트 모드', '네트워크 없이도 연습할 수 있어요.');
      }
    } finally {
      isLoadingPlayerList.value = false;
    }
  };

  const activateDummyMode = async (reason = 'fallback') => {
    if (!isDummyMode.value) {
      console.warn(`⚠️ 더미 모드로 전환합니다. (reason: ${reason})`);
      isDummyMode.value = true;
    }
    await loadDummyRoomData(reason);
  };

  // 초기 방 데이터 로딩 핸들러
  const loadInitialRoomData = async (preloadedRoomDetail = null) => {

    try {
      isLoadingPlayerList.value = true;

      if (isDummyMode.value) {
        await loadDummyRoomData('initial-dummy-mode');
        return;
      }

      // preloadedRoomDetail이 있으면 사용, 없으면 API 호출
      let roomDetail = preloadedRoomDetail;

      if (!roomDetail) {
        // 방 상세 정보 + 초기 플레이어 목록 조회
        roomDetail = await roomApiService.getRoomDetail(localRoomData.value.id);
      } else {
        console.log('✅ 사전 로드된 방 상세 정보 사용 (접근 권한 확인에서 받음)');
      }

      if (!roomDetail) {
        // 방이 존재하지 않는 경우
        const error = new Error('방을 찾을 수 없습니다.');
        error.code = 'ROOM_NOT_FOUND';
        throw error;
      }

      localRoomData.value = {
        ...localRoomData.value,
        id: roomDetail.roomId ?? localRoomData.value.id,
        title: roomDetail.title ?? localRoomData.value.title,
        timeLimit: roomDetail.timeLimit ?? localRoomData.value.timeLimit,
        gameMode: roomDetail.gameMode?.toLowerCase?.() ?? roomDetail.gameMode ?? localRoomData.value.gameMode,
        isTeamMode: roomDetail.gameType ? roomDetail.gameType.toLowerCase() === 'team' : localRoomData.value.isTeamMode,
        isPrivate: roomDetail.privateRoom ?? localRoomData.value.isPrivate,
        maxPlayers: roomDetail.maxPlayers ?? localRoomData.value.maxPlayers,
        totalRounds: roomDetail.totalRounds ?? roomDetail.rounds ?? localRoomData.value.totalRounds ?? localRoomData.value.rounds ?? 5,
        poiNameVisible: roomDetail.poiNameVisible ?? localRoomData.value.poiNameVisible ?? true
      };
      console.log('✅ 방 정보 로딩 완료:', localRoomData.value.title);

      const initialPlayersResponse = roomDetail.connectedPlayers || roomDetail.players;
      if (initialPlayersResponse) {
        const transformedPlayers = transformGameRoomPlayers(initialPlayersResponse);
        roomPlayer.updatePlayerList(transformedPlayers);
        emit('player-list-updated', transformedPlayers);
        localRoomData.value.currentPlayerCount = transformedPlayers.length;
        console.log('✅ 초기 플레이어 목록 로딩 완료:', transformedPlayers.length, '명');
      }

      // 마지막 업데이트 시간 갱신
      lastPlayerListUpdate.value = Date.now();

    } catch (error) {
      console.error('❌ 초기 방 데이터 로딩 실패:', error);

      // 더미 모드로 전환하지 않고 에러를 다시 throw하여 RoomView에서 처리하도록 함
      // RoomView에서 로비로 리다이렉트 처리
      const redirectError = new Error(error.message || '방을 조회할 수 없습니다.');
      redirectError.code = error.code || 'ROOM_LOAD_FAILED';
      redirectError.originalError = error;
      throw redirectError;
    } finally {
      isLoadingPlayerList.value = false;
    }
  };

  const handleGameStartCountdown = (startEvent) => {
    console.log('⏱️ 게임 시작 카운트다운 이벤트 수신:', startEvent);

    isStartingGame.value = false;

    if (toastRef?.value) {
      toastRef.value.showGameStartNotification();
    }

    roomChat.addSystemMessage('게임이 곧 시작됩니다!');

    if (typeof onGameStartMessage === 'function') {
      try {
        onGameStartMessage(startEvent);
      } catch (error) {
        console.error('❌ 게임 시작 콜백 처리 중 오류:', error);
      }
    }
  };

  // 게임 로딩 상태 핸들러 (SoloGameView에서 사용)
  // RoomView에서 미리 구독하여 타이밍 문제 방지
  const handleLoadingStatus = (loadingStatusMessage) => {
    console.log('📥 게임 로딩 상태 수신 (RoomView):', loadingStatusMessage);

    // soloGameWebSocket의 핸들러를 통해 SoloGameView로 전달
    // soloGameWebSocket은 싱글톤이므로 핸들러가 설정되어 있으면 자동으로 전달됨
    if (soloGameWebSocket && typeof soloGameWebSocket.handleLoadingStatus === 'function') {
      soloGameWebSocket.handleLoadingStatus(loadingStatusMessage);
    }
  };

  // 게임 방 알림 통합 핸들러 (Spring Boot GameRoomNotification과 연동)
  const handleGameRoomNotification = (notification) => {
    console.log('📥 게임 방 알림 수신:', notification);

    const { playerInfo, players, message } = notification;

    try {
      isLoadingPlayerList.value = true;

      const notificationType = notification?.type;
      const hasPlayersArray = Array.isArray(players);
      const hasPlayerInfo = !!playerInfo;
      const isFullSyncNotification = notificationType === 'PLAYER_LIST_UPDATED';

      if (notificationType) {
        hasReceivedPlayerListSignal.value = true;
      }

      // HOST_CHANGED 처리 (players가 null이고 playerInfo에 newHostInfo가 있음)
      if (notificationType === 'HOST_CHANGED' && hasPlayerInfo) {
        const newHostInfo = transformGameRoomPlayer(playerInfo);
        if (newHostInfo) {
          const newHostId = newHostInfo.id || newHostInfo.memberId?.toString();
          const oldHostId = localRoomData.value.hostId?.toString();

          // 방 데이터의 hostId 업데이트
          localRoomData.value.hostId = newHostId;

          // 플레이어 목록에서 방장 상태 업데이트
          const updatedPlayers = roomPlayer.localPlayers.value.map(player => {
            const playerId = player.id?.toString();
            if (playerId === oldHostId) {
              // 기존 방장의 isHost를 false로 변경
              return { ...player, isHost: false };
            } else if (playerId === newHostId) {
              // 새 방장의 isHost를 true로 변경
              return { ...player, isHost: true };
            }
            return player;
          });

          roomPlayer.updatePlayerList(updatedPlayers);
          emit('player-list-updated', updatedPlayers);

          // 시스템 메시지 추가
          const hostChangeMessage = `방장이 ${newHostInfo.nickname || '플레이어'}님으로 변경되었습니다.`;
          roomChat.addSystemMessage(hostChangeMessage);

          // 토스트 알림 표시
          if (toastRef?.value) {
            if (newHostId === props.currentUserId?.toString()) {
              // 자신이 새 방장이 된 경우
              toastRef.value.showSuccessNotification('방장 권한을 받았습니다!', '이제 방 설정을 변경할 수 있습니다.');
            } else {
              // 다른 플레이어가 방장이 된 경우
              toastRef.value.showSuccessNotification('방장 변경', `${newHostInfo.nickname || '플레이어'}님이 새로운 방장이 되었습니다.`);
            }
          }

          console.log(`✅ 방장 변경 완료: ${oldHostId} -> ${newHostId}`);
        }
      } else if (notificationType === 'SCREEN_STATE_UPDATED' && hasPlayerInfo) {
        const updated = applyScreenStateDelta(playerInfo);

        if (updated) {
          console.log('✅ 플레이어 화면 상태 델타 반영 완료');
        } else {
          console.log('ℹ️ 플레이어 화면 상태 델타 무시 (stale 또는 동일 seq)');
        }
      } else if (isFullSyncNotification && hasPlayersArray) {
        const transformedPlayers = transformGameRoomPlayers(players);
        const nextPlayers = mergeScreenStateFromFullSync(transformedPlayers);

        roomPlayer.updatePlayerList(nextPlayers);
        localRoomData.value.currentPlayerCount = nextPlayers.length;
        emit('player-list-updated', nextPlayers);
        console.log(`✅ 플레이어 목록 업데이트 완료: ${nextPlayers.length}명`);
      } else if (hasPlayerInfo) {
        const transformedPlayer = transformGameRoomPlayer(playerInfo);
        if (transformedPlayer) {
          const eventTypeMap = {
            PLAYER_JOINED: 'JOIN',
            PLAYER_LEFT: 'LEAVE',
            PLAYER_KICKED: 'KICKED',
            TEAM_CHANGED: 'TEAM_CHANGE'
          };

          const eventType = eventTypeMap[notificationType] || null;
          if (eventType) {
            roomPlayer.handlePlayerStatusChange(
              {
                eventType,
                player: transformedPlayer
              },
              roomChat.addSystemMessage
            );
            localRoomData.value.currentPlayerCount = roomPlayer.localPlayers.value.length;
            emit('player-list-updated', roomPlayer.localPlayers.value);
          }
        }
      }

      // 실시간 알림 표시
      if (toastRef?.value) {
        switch (notificationType) {
          case 'PLAYER_JOINED':
            if (playerInfo?.memberId?.toString() !== props.currentUserId) {
              toastRef.value.showPlayerJoinNotification(playerInfo?.nickname || '플레이어');
            }
            break;

          case 'PLAYER_LEFT':
            if (playerInfo?.memberId?.toString() !== props.currentUserId) {
              toastRef.value.showPlayerLeaveNotification(playerInfo?.nickname || '플레이어');
            }
            break;

          case 'PLAYER_LIST_UPDATED':
            // API 명세서: 10초마다 주기적으로 발생하므로 토스트 알림은 표시하지 않음
            console.log('🔄 플레이어 목록 자동 동기화 (토스트 알림 없음)');
            break;

          case 'SCREEN_STATE_UPDATED':
            // 화면 상태는 빈도가 높아 토스트 미표시
            break;

          case 'TEAM_CHANGED':
            if (playerInfo?.memberId?.toString() === props.currentUserId) {
              // 자신의 팀 변경
              const teamName = getTeamName(playerInfo?.teamId);
              toastRef.value.showSuccessNotification('팀 변경 완료!', `${teamName}팀으로 이동했습니다.`);
              emit('team-change-success', playerInfo);
            } else {
              // 다른 플레이어의 팀 변경
              const teamName = getTeamName(playerInfo?.teamId);
              toastRef.value.showTeamChangeNotification(
                playerInfo?.nickname || '플레이어',
                teamName
              );
            }
            break;

          case 'PLAYER_KICKED':
            if (playerInfo?.memberId?.toString() === props.currentUserId) {
              // 자신이 강퇴당한 경우: 알림 표시 후 로비로 이동
              toastRef.value.showErrorNotification('강퇴됨', '방장에 의해 강퇴되었습니다.');
              // 알림을 보여준 후 1.5초 뒤 로비로 이동
              setTimeout(() => {
                leaveRoom();
                // 강퇴 이벤트를 emit하여 RoomView에서 로비로 이동하도록 함
                emit('kicked-from-room');
              }, 1500);
              return;
            } else {
              toastRef.value.showPlayerLeaveNotification(`${playerInfo?.nickname || '플레이어'} (강퇴)`);
            }
            break;
        }
      }

      // 시스템 메시지 추가 (HOST_CHANGED는 이미 처리됨)
      if (message && notificationType !== 'HOST_CHANGED' && notificationType !== 'SCREEN_STATE_UPDATED') {
        roomChat.addSystemMessage(message);
      }

      // 강퇴 처리 (자신이 강퇴당한 경우) - toastRef가 없는 경우를 위한 fallback
      if (notificationType === 'PLAYER_KICKED' && playerInfo?.memberId?.toString() === props.currentUserId) {
        // 알림이 없는 경우 기본 alert 사용 후 즉시 이동
        if (!toastRef?.value) {
          alert('방장에 의해 강퇴되었습니다.');
          leaveRoom();
          emit('kicked-from-room');
        }
        return;
      }

      // 마지막 업데이트 시간 갱신
      lastPlayerListUpdate.value = Date.now();

    } catch (error) {
      console.error('❌ 게임 방 알림 처리 실패:', error);
    } finally {
      isLoadingPlayerList.value = false;
    }
  };

  // 채팅 메시지 이벤트 핸들러
  const handleChatMessage = (chatEvent) => {
    console.log('💬 채팅 메시지:', chatEvent);
    roomChat.handleRoomChatMessage(chatEvent, props.currentUserId);
  };

  // 연결 상태 변경 핸들러 (재연결 등)
  const handleConnectionStatusChange = (statusEvent) => {
    console.log('🔗 연결 상태 변경:', statusEvent);

    const { type, message } = statusEvent;

    if (toastRef?.value) {
      switch (type) {
        case 'RECONNECTED':
          toastRef.value.showSuccessNotification('연결 복구', message);
          break;

        case 'DISCONNECTED':
          toastRef.value.showErrorNotification('연결 끊김', message);
          break;

        default:
          console.log('기타 연결 상태 변경:', type);
      }
    }
  };

  // GameRoomUpdateMessage 처리 핸들러 (Spring Boot GameRoomUpdateMessage와 연동)
  const handleGameRoomSettingsUpdate = (settingsEvent) => {
    console.log('⚙️ 게임 방 설정 업데이트 수신:', settingsEvent);

    const { type, roomId, settings, message, timestamp } = settingsEvent;

    if (type === 'SETTINGS_UPDATED' && settings) {
      try {
        // 로컬 방 데이터 업데이트
        localRoomData.value = {
          ...localRoomData.value,
          title: settings.title || localRoomData.value.title,
          gameMode: settings.gameMode || localRoomData.value.gameMode,
          isTeamMode: settings.isTeamMode !== undefined ? settings.isTeamMode : localRoomData.value.isTeamMode,
          isPrivate: settings.isPrivate !== undefined ? settings.isPrivate : localRoomData.value.isPrivate,
          teamCount: settings.teamCount || localRoomData.value.teamCount,
          maxPlayers: localRoomData.value.maxPlayers // 기존 값 유지
        };

        console.log('✅ 방 설정 업데이트 완료:', localRoomData.value);

        // 실시간 알림 표시
        if (toastRef?.value) {
          const settingNames = [];
          if (settings.title !== undefined) settingNames.push('방 제목');
          if (settings.gameMode !== undefined) settingNames.push('게임 모드');
          if (settings.isTeamMode !== undefined) settingNames.push('팀 모드');
          if (settings.isPrivate !== undefined) settingNames.push('공개 설정');
          if (settings.teamCount !== undefined) settingNames.push('팀 수');

          const settingText = settingNames.length > 0 ? settingNames.join(', ') : '방 설정';
          toastRef.value.showSettingsChangeNotification(settingText);
        }

        // 팀 모드 변경 시 플레이어 팀 정보 초기화 필요
        if (settings.isTeamMode !== undefined && settings.isTeamMode !== isTeamMode.value) {
          console.log('🏀 팀 모드 변경 감지:', settings.isTeamMode);
          // 팀 모드 변경 시 UI 재렌더링을 위한 이벤트 발행
          emit('team-mode-changed', settings.isTeamMode);
        }

        // 시스템 메시지 추가
        if (message) {
          roomChat.addSystemMessage(message);
        }

        // 마지막 업데이트 시간 갱신
        lastPlayerListUpdate.value = Date.now();

      } catch (error) {
        console.error('❌ 방 설정 업데이트 처리 실패:', error);
      }
    }
  };

  // 게임 방 상태 변경 핸들러 (게임 시작 등)
  const handleGameRoomStatusChange = (statusEvent) => {
    console.log('📊 게임 방 상태 변경:', statusEvent);

    const { type, data, message } = statusEvent;

    switch (type) {
      case 'GAME_STARTED':
        // 게임 시작 처리
        console.log('🎮 게임 시작 이벤트 수신');

        // 실시간 알림 표시
        if (toastRef?.value) {
          toastRef.value.showGameStartNotification();
        }

        emit('start-game', statusEvent);
        break;

      default:
        console.log('📊 기타 상태 변경:', type);
    }

    // 시스템 메시지 추가
    if (message) {
      roomChat.addSystemMessage(message);
    }
  };

  // 폴링 관련 메서드 제거 - WebSocket 실시간 알림으로 대체

  // 방 관련 메서드들
  const updateRoomSettings = async (settings) => {
    if (isDummyMode.value) {
      // rounds를 totalRounds로 변환하여 저장
      const transformedSettings = {
        ...settings,
        totalRounds: settings.totalRounds !== undefined ? settings.totalRounds : (settings.rounds !== undefined ? settings.rounds : localRoomData.value.totalRounds)
      };
      // rounds 필드 제거 (totalRounds만 사용)
      delete transformedSettings.rounds;

      localRoomData.value = {
        ...localRoomData.value,
        ...transformedSettings
      };

      roomChat.addSystemMessage('오프라인 테스트 모드: 설정이 로컬에서만 변경되었습니다.');
      roomModal.closeRoomSettings();
      emit('update-room-settings', transformedSettings);
      return;
    }

    try {
      // 로컬 상태 업데이트 (UI 즉시 반영)
      // rounds를 totalRounds로 변환하여 저장
      const transformedSettings = {
        ...settings,
        totalRounds: settings.totalRounds !== undefined ? settings.totalRounds : (settings.rounds !== undefined ? settings.rounds : localRoomData.value.totalRounds)
      };
      // rounds 필드 제거 (totalRounds만 사용)
      delete transformedSettings.rounds;

      localRoomData.value = {
        ...localRoomData.value,
        ...transformedSettings
      };

      // API 호출로 방 설정 업데이트
      const updateData = {
        title: settings.title || localRoomData.value.title,
        password: settings.password || localRoomData.value.password,
        gameModeKey: settings.gameMode || localRoomData.value.gameMode,
        playerMatchTypeKey: settings.isTeamMode ? 'team' : 'solo',
        privateRoom: settings.isPrivate !== undefined ? settings.isPrivate : localRoomData.value.isPrivate,
        teamCount: settings.teamCount || localRoomData.value.teamCount || 2,
        timeLimit: settings.timeLimit !== undefined ? settings.timeLimit : localRoomData.value.timeLimit,
        totalRounds: settings.totalRounds !== undefined ? settings.totalRounds : (settings.rounds !== undefined ? settings.rounds : localRoomData.value.totalRounds || localRoomData.value.rounds),
        maxPlayers: settings.maxPlayers !== undefined ? settings.maxPlayers : localRoomData.value.maxPlayers,
        poiNameVisible: settings.poiNameVisible !== undefined ? settings.poiNameVisible : localRoomData.value.poiNameVisible
      };

      await roomApiService.updateGameRoom(localRoomData.value.id, updateData);

      // WebSocket으로 방 설정 변경 알림
      const success = roomWebSocketService.publishRoomSettings(
        localRoomData.value.id,
        transformedSettings,
        props.currentUserId
      );

      if (!success) {
        console.warn('⚠️ WebSocket 방 설정 변경 알림 실패');
      }

      // 시스템 메시지 및 알림은 WebSocket으로 설정 변경 메시지를 받을 때 표시됨 (handleGameRoomSettingsUpdate)
      // 방장에게 중복 알림을 방지하기 위해 여기서는 알림을 표시하지 않음

      // 기존 emit 유지 (하위 호환성)
      emit('update-room-settings', transformedSettings);
      roomModal.closeRoomSettings();

      console.log('✅ 방 설정 업데이트 성공');
    } catch (error) {
      console.error('❌ 방 설정 업데이트 실패:', error);
      // 로컬 상태 복원
      localRoomData.value = { ...props.roomData };

      // 실시간 알림 표시
      if (toastRef?.value) {
        toastRef.value.showErrorNotification('오류', '방 설정 변경에 실패했습니다.');
      } else {
        alert('방 설정 변경에 실패했습니다.');
      }
    }
  };

  const leaveRoom = async () => {
    if (isDummyMode.value) {
      emit('leave-room');
      console.log('🧪 더미 모드에서 방을 떠났습니다.');
      return;
    }

    try {
      setDisconnectReason('leave-room');
      await disconnectWebSocket();



      // API 호출 (접속자 모두 호출)
      await roomApiService.leaveGameRoom(localRoomData.value.id);

      // 기존 emit 유지
      emit('leave-room');

      console.log('✅ 방 퇴장 완료');
    } catch (error) {
      console.error('❌ 방 퇴장 실패:', error);
      // 에러가 발생해도 화면은 이동
      emit('leave-room');
    }
  };

  const startGame = async () => {
    if (!props.isHost && !isDummyMode.value) {
      if (toastRef?.value) {
        toastRef.value.showErrorNotification('권한 없음', '방장만 게임을 시작할 수 있습니다.');
      } else {
        alert('방장만 게임을 시작할 수 있습니다.');
      }
      return false;
    }

    if (!canStartGame.value) {
      if (toastRef?.value) {
        toastRef.value.showErrorNotification('시작 불가', '게임을 시작하기 위한 최소 인원이 필요합니다.');
      } else {
        alert('게임을 시작할 수 없습니다. 최소 인원을 확인해주세요.');
      }
      return false;
    }

    if (!isDummyMode.value && !isPlayerListReady.value) {
      const message = '참가자 상태를 확인하는 중입니다. 잠시만 기다려주세요.';
      if (toastRef?.value) {
        toastRef.value.showErrorNotification('시작 대기', message);
      } else {
        alert(message);
      }
      return false;
    }

    if (!isDummyMode.value && !allPlayersInRoomState.value) {
      const blockMessage = hasJoiningPlayers.value
        ? '참여 중인 플레이어가 있습니다. 잠시 후 다시 시도해주세요.'
        : '모든 플레이어가 방 화면으로 돌아온 뒤 시작할 수 있습니다.';

      if (toastRef?.value) {
        toastRef.value.showErrorNotification('시작 불가', blockMessage);
      } else {
        alert(blockMessage);
      }
      return false;
    }

    if (isStartingGame.value) {
      console.log('▶️ 게임 시작 요청이 이미 진행 중입니다.');
      return false;
    }

    if (isDummyMode.value) {
      if (isStartingGame.value) {
        return false;
      }

      isStartingGame.value = true;
      roomChat.addSystemMessage('오프라인 테스트 모드: 3초 후 게임이 시작됩니다.');

      const fakeEvent = {
        roomId: localRoomData.value.id,
        countdown: 3,
        message: '테스트 게임이 곧 시작됩니다!',
        dummyMode: true,
        timestamp: Date.now()
      };

      setTimeout(() => {
        handleGameStartCountdown(fakeEvent);
      }, 300);

      return true;
    }

    let requestSucceeded = false;

    try {
      isStartingGame.value = true;

      // 서버에서 방 설정(gameMode, playerMatchType, totalRounds, timeLimit)을 자동으로 가져옴
      await roomApiService.startGame(localRoomData.value.id);
      requestSucceeded = true;
      roomChat.addSystemMessage('방장이 게임 시작을 요청했습니다. 잠시 후 게임이 시작됩니다.');
      // 알림은 WebSocket으로 게임 시작 카운트다운 메시지를 받을 때 표시됨 (handleGameStartCountdown)
      // 방장에게 중복 알림을 방지하기 위해 여기서는 알림을 표시하지 않음
      return true;
    } catch (error) {
      console.error('❌ 게임 시작 요청 처리 실패:', error);
      if (toastRef?.value) {
        toastRef.value.showErrorNotification('시작 실패', '게임 시작 요청에 실패했습니다. 다시 시도해주세요.');
      } else {
        alert('게임 시작 요청에 실패했습니다. 다시 시도해주세요.');
      }
      return false;
    } finally {
      if (!requestSucceeded) {
        isStartingGame.value = false;
      }
    }
  };

  const kickPlayer = async () => {
    if (!roomModal.playerToKick.value) return;

    if (isDummyMode.value) {
      const targetPlayer = roomModal.playerToKick.value;
      const updatedPlayers = roomPlayer.localPlayers.value.filter(player => player.id !== targetPlayer.id);
      roomPlayer.updatePlayerList(updatedPlayers);
      localRoomData.value.currentPlayerCount = updatedPlayers.length;
      roomChat.addSystemMessage(`${targetPlayer.nickname || '플레이어'}님을 테스트 모드에서 제거했습니다.`);
      roomModal.closeKickModal();
      emit('kick-player', targetPlayer);
      return;
    }

    try {
      const targetPlayer = roomModal.playerToKick.value;

      // API 호출로 강퇴 실행
      await roomApiService.kickPlayer(
        localRoomData.value.id,
        targetPlayer.id
      );

      // WebSocket으로 강퇴 이벤트 발행
      const success = roomWebSocketService.publishKickPlayer(
        localRoomData.value.id,
        targetPlayer.id,
        props.currentUserId
      );

      if (success) {
        console.log(`✅ 강퇴 완료: ${targetPlayer.nickname}`);
      } else {
        console.warn('⚠️ WebSocket 강퇴 이벤트 발행 실패');


      }

      roomModal.closeKickModal();
    } catch (error) {
      console.error('❌ 플레이어 강퇴 실패:', error);
      alert('플레이어 강퇴에 실패했습니다.');
      roomModal.closeKickModal();
    }
  };

  const joinTeam = (teamId) => {
    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    const currentPlayerIndex = roomPlayer.localPlayers.value.findIndex(
      player => player.id === props.currentUserId
    );

    if (currentPlayerIndex !== -1) {
      const previousTeamId = roomPlayer.localPlayers.value[currentPlayerIndex].teamId;

      // 즉시 UI 업데이트
      const updatedPlayers = [...roomPlayer.localPlayers.value];
      updatedPlayers[currentPlayerIndex] = {
        ...updatedPlayers[currentPlayerIndex],
        teamId: teamId
      };

      roomPlayer.updatePlayerList(updatedPlayers);

      console.log(`🏀 팀 변경 즉시 UI 업데이트: ${props.currentUserId} -> 팀 ${teamId}`);

      // 시스템 메시지 추가
      const currentPlayerNickname = roomPlayer.getCurrentPlayerNickname(props.currentUserId);
      roomChat.addSystemMessage(`${currentPlayerNickname}님이 팀을 변경했습니다.`);
    }

    // 기존 emit 유지 (하위 호환성)
    if (currentPlayerIndex !== -1) {
      emit('join-team', { teamId, updatedPlayers: roomPlayer.localPlayers.value });
    }

    if (isDummyMode.value) {
      return;
    }

    // WebSocket으로 팀 변경 이벤트 발행
    const success = roomWebSocketService.publishJoinTeam(
      localRoomData.value.id,
      teamId,
      props.currentUserId
    );

    if (success) {
      console.log(`✅ 팀 변경 이벤트 발행: ${teamId}`);
    } else {
      console.warn('⚠️ WebSocket 팀 변경 이벤트 발행 실패');
      // WebSocket 실패 시에도 이미 로컬 업데이트는 완료됨
    }
  };

  const sendChatMessage = (message = null) => {
    // 파라미터로 받은 메시지 우선 사용, 없으면 chatInput에서 읽기
    const messageToSend = message !== null ? message : roomChat.chatInput.value;

    if (!messageToSend || !messageToSend.trim()) return;

    if (isDummyMode.value) {
      const content = messageToSend.trim();
      roomChat.handleRoomChatMessage(
        {
          senderId: props.currentUserId || 'dummy-host',
          messageId: Date.now(),
          nickname: roomPlayer.getCurrentPlayerNickname(props.currentUserId),
          content,
          messageType: 'CHAT',
          timestamp: new Date().toISOString()
        },
        props.currentUserId
      );
      // chatInput이 아닌 경우에만 clearChatInput 호출
      if (message === null) {
        roomChat.clearChatInput();
      }
      return;
    }

    // WebSocket으로 채팅 메시지 발행
    const success = roomWebSocketService.publishChatMessage(
      localRoomData.value.id,
      messageToSend.trim(),
      props.currentUserId
    );

    if (success) {
      // chatInput이 아닌 경우에만 clearChatInput 호출
      if (message === null) {
        roomChat.clearChatInput();
      }
      console.log('✅ 채팅 메시지 발송 성공');
    } else {
      console.warn('⚠️ WebSocket 채팅 메시지 발송 실패, 기존 방식 사용');
      // WebSocket 실패 시 기존 emit 사용
      emit('send-chat', messageToSend.trim());
      if (message === null) {
        roomChat.clearChatInput();
      }
    }
  };

  // 강퇴 확인 (플레이어 상세 모달에서 호출)
  const confirmKickPlayer = (player) => {
    roomModal.confirmKickPlayer(player);
  };

  // 자신이 강퇴당했는지 확인
  const checkIfKicked = (kickedPlayerId) => {
    if (kickedPlayerId === props.currentUserId) {
      alert('방장에 의해 강퇴되었습니다.');
      leaveRoom();
    }
  };

  // 팀 ID를 팀 이름으로 변환하는 유틸리티 함수
  const getTeamName = (teamId) => {
    const teamNames = {
      1: '블루',
      2: '레드',
      3: '그린',
      4: '옐로우'
    };
    return teamNames[teamId] || `팀 ${teamId}`;
  };

  // Lifecycle hooks
  // Note: onMounted는 RoomView에서 직접 호출하므로 여기서는 제거
  // 대신 initializeRoom 함수를 export하여 RoomView에서 호출하도록 변경
  const initializeRoom = async (preloadedRoomDetail = null) => {
    try {
      console.log('🚀 RoomView 초기화 시작');
      hasReceivedPlayerListSignal.value = false;

      // 1. 초기 환영 메시지 추가
      roomChat.addSystemMessage('채팅방에 오신 것을 환영합니다!');
      roomChat.scrollChatToBottom();

      // 2. 초기 방 데이터 로딩을 먼저 시작해두고,
      // 3. WebSocket 연결/구독을 병행하여 JOINING 체류 시간을 줄입니다.
      const roomDataLoadPromise = loadInitialRoomData(preloadedRoomDetail);

      if (isDummyMode.value) {
        await roomDataLoadPromise;
        console.log('🧪 더미 모드로 실행 중이므로 WebSocket 연결을 생략합니다.');
        return;
      }

      // 3. WebSocket 이벤트 핸들러 설정 (Spring Boot 채널 구조에 맞춤)
      const eventHandlers = {
        onGameRoomNotification: handleGameRoomNotification,      // 플레이어 목록 통합 알림
        onChatMessage: handleChatMessage,                        // 채팅 메시지
        onGameRoomSettingsUpdate: handleGameRoomSettingsUpdate,  // 방 설정 변경 (GameRoomUpdateMessage)
        onGameRoomStatusChange: handleGameRoomStatusChange,      // 방 상태 변경 (게임 시작 등)
        onConnectionStatusChange: handleConnectionStatusChange,  // 연결 상태 변경 (재연결 등)
        onGameStartCountdown: handleGameStartCountdown,          // 게임 시작 카운트다운
        onLoadingStatus: handleLoadingStatus                     // 게임 로딩 상태 (SoloGameView에서 사용)
      };

      // 4. WebSocket 연결 시도
      const wsConnected = await roomWebSocketService.connectToRoom(
        localRoomData.value.id,
        props.currentUserId,
        eventHandlers
      );

      // 5. 방 데이터 로딩 완료 대기
      await roomDataLoadPromise;

      if (wsConnected) {
        console.log('✅ WebSocket 연결 성공 - 실시간 모드');
        roomChat.addSystemMessage('실시간 채팅에 연결되었습니다.');
        hasReceivedPlayerListSignal.value = true;

        const roomStateSent = screenStateSyncService.sendScreenState(
          localRoomData.value.id,
          'ROOM',
        );
        if (!roomStateSent) {
          console.warn('⚠️ Room 화면 상태 전송 실패 (연결 직후)');
        }
      } else {
        console.warn('⚠️ WebSocket 연결 실패 - 연결 재시도 필요');
        roomChat.addSystemMessage('채팅 연결 중... 잠시만 기다려주세요.');
      }

      console.log('🎉 RoomView 초기화 완료');

    } catch (error) {
      console.error('❌ RoomView 초기화 중 오류:', error);
      // 에러를 다시 throw하여 RoomView에서 처리하도록 함
      throw error;
    }
  };

  onBeforeUnmount(async () => {
    await disconnectWebSocket();
  });

  return {
    // 상태
    localRoomData: computed(() => localRoomData.value),
    isTeamMode,
    canStartGame,
    canStartGameWithScreenGate,
    startBlockReason,
    joiningPlayers,
    isPlayerListReady,
    isStartingGame,

    // WebSocket 및 로딩 상태
    isWebSocketConnected: computed(() => isDummyMode.value ? false : roomWebSocketService.isConnected),
    isLoadingPlayerList,
    lastPlayerListUpdate,
    isDummyMode: computed(() => isDummyMode.value),

    // 모달 상태
    isRoomSettingsOpen: roomModal.isRoomSettingsOpen,
    isKickModalOpen: roomModal.isKickModalOpen,
    isPlayerDetailsOpen: roomModal.isPlayerDetailsOpen,
    playerToKick: roomModal.playerToKick,
    selectedPlayer: roomModal.selectedPlayer,

    // 채팅 상태
    chatMessages: roomChat.chatMessages,
    chatInput: roomChat.chatInput,
    unreadMessages: roomChat.unreadMessages,
    chatMessagesRef: roomChat.chatMessagesRef,

    // 플레이어 상태
    localPlayers: roomPlayer.localPlayers,
    playerMessages: roomPlayer.playerMessages,
    availableTeams: roomPlayer.availableTeams,
    maxPlayersPerTeam: roomPlayer.maxPlayersPerTeam,

    // 방 관련 메서드
    updateRoomSettings,
    leaveRoom,
    startGame,
    kickPlayer,
    joinTeam,
    sendChatMessage,

    // 실시간 업데이트 메서드
    loadInitialRoomData,
    initializeRoom,
    handleGameRoomNotification,
    handleChatMessage,
    handleGameRoomSettingsUpdate,
    handleGameRoomStatusChange,
    handleGameStartCountdown,

    // 모달 메서드
    openRoomSettings: roomModal.openRoomSettings,
    closeRoomSettings: roomModal.closeRoomSettings,
    showPlayerDetails: roomModal.showPlayerDetails,
    closePlayerDetails: roomModal.closePlayerDetails,
    confirmKickPlayer,
    closeKickModal: roomModal.closeKickModal,

    // 채팅 메서드
    toggleChat: roomChat.toggleChat,
    scrollChatToBottom: roomChat.scrollChatToBottom,
    addSystemMessage: roomChat.addSystemMessage,

    // 플레이어 메서드
    getCurrentPlayerNickname: roomPlayer.getCurrentPlayerNickname,
    getCurrentPlayerTeam: roomPlayer.getCurrentPlayerTeam,
    canJoinTeam: roomPlayer.canJoinTeam,
    getTeamPlayerCount: roomPlayer.getTeamPlayerCount,

    prepareForGameNavigation,
    setDisconnectReason,
    disconnectWebSocket
  };
} 
