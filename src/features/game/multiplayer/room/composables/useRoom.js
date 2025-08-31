import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoomWebSocket } from './useRoomWebSocket';
import { useRoomModal } from './useRoomModal';
import { useRoomChat } from './useRoomChat';
import { useRoomPlayer } from './useRoomPlayer';
import roomApiService from '../services/roomApi.service.js';
import roomWebSocketService from '../services/roomWebSocket.service.js';

/**
 * Room 통합 관리 컴포저블
 * 방 관련 모든 기능을 통합하여 관리합니다.
 */
export function useRoom(props, emit) {
  // 로컬 상태 (props 복사)
  const localRoomData = ref({...props.roomData});
  
  // 실시간 업데이트 상태
  const isLoadingPlayerList = ref(false);
  const lastPlayerListUpdate = ref(Date.now());
  
  // 각 기능별 composables 초기화
  const roomWebSocket = useRoomWebSocket();
  const roomModal = useRoomModal();
  const roomChat = useRoomChat();
  const roomPlayer = useRoomPlayer(props);

  // props 변경 시 로컬 상태 업데이트
  watch(() => props.roomData, (newVal) => {
    localRoomData.value = {...newVal};
  }, { deep: true });

  // Computed properties
  const isTeamMode = computed(() => {
    return localRoomData.value.isTeamMode === true;
  });

  const canStartGame = computed(() => {
    return roomPlayer.canStartGame(isTeamMode.value);
  });

  // 초기 방 데이터 로딩 핸들러
  const loadInitialRoomData = async () => {
    console.log('🏠 초기 방 데이터 로딩 시작:', localRoomData.value.id);
    
    try {
      isLoadingPlayerList.value = true;
      
      // 방 상세 정보 + 초기 플레이어 목록 조회
      const roomDetail = await roomApiService.getRoomDetail(localRoomData.value.id);
      
      // 방 정보 업데이트
      if (roomDetail.roomInfo) {
        localRoomData.value = {
          ...localRoomData.value,
          ...roomDetail.roomInfo
        };
        console.log('✅ 방 정보 로딩 완료:', roomDetail.roomInfo.title);
      }
      
      // 초기 플레이어 목록 설정
      if (roomDetail.players) {
        roomPlayer.updatePlayerList(roomDetail.players);
        emit('player-list-updated', roomDetail.players);
        console.log('✅ 초기 플레이어 목록 로딩 완료:', roomDetail.players.length, '명');
      }
      
      // 마지막 업데이트 시간 갱신
      lastPlayerListUpdate.value = Date.now();
      
    } catch (error) {
      console.error('❌ 초기 방 데이터 로딩 실패:', error);
      throw error;
    } finally {
      isLoadingPlayerList.value = false;
    }
  };

  // 게임 방 알림 통합 핸들러 (Spring Boot GameRoomNotification과 연동)
  const handleGameRoomNotification = (notification) => {
    console.log('📥 게임 방 알림 수신:', notification);
    
    const { type, playerInfo, players, message, timestamp } = notification;
    
    try {
      isLoadingPlayerList.value = true;
      
      // 플레이어 목록이 포함된 경우 업데이트
      if (players && Array.isArray(players)) {
        // Spring Boot GameRoomPlayerInfo를 프론트엔드 형식으로 변환
        const transformedPlayers = players.map(player => ({
          id: player.memberId?.toString() || player.id,
          nickname: player.nickname || '알 수 없는 플레이어',
          profileImage: player.markerImageUrl || '',
          isHost: player.isHost || false,
          teamId: player.teamId || null,
          isOnline: true,
          joinedAt: player.joinedAt ? new Date(player.joinedAt) : new Date()
        }));
        
        // 플레이어 목록 업데이트
        roomPlayer.updatePlayerList(transformedPlayers);
        
        // 현재 플레이어 수 업데이트
        localRoomData.value.currentPlayerCount = transformedPlayers.length;
        
        // 부모 컴포넌트에 업데이트 알림
        emit('player-list-updated', transformedPlayers);
        
        console.log(`✅ 플레이어 목록 업데이트 완료: ${transformedPlayers.length}명`);
      }
      
      // 시스템 메시지 추가
      if (message) {
        roomChat.addSystemMessage(message);
      }
      
      // 강퇴 처리 (자신이 강퇴당한 경우)
      if (type === 'PLAYER_KICKED' && playerInfo?.memberId?.toString() === props.currentUserId) {
        alert('방장에 의해 강퇴되었습니다.');
        leaveRoom();
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

  // 게임 방 상태 변경 핸들러 (설정 변경, 게임 시작 등)
  const handleGameRoomStatusChange = (statusEvent) => {
    console.log('📊 게임 방 상태 변경:', statusEvent);
    
    const { type, data, message } = statusEvent;
    
    switch (type) {
      case 'SETTINGS_UPDATED':
        // 방 설정 업데이트
        if (data && data.settings) {
          localRoomData.value = {
            ...localRoomData.value,
            ...data.settings
          };
        }
        break;
        
      case 'GAME_STARTED':
        // 게임 시작 처리
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
    try {
      // 로컬 상태 업데이트 (UI 즉시 반영)
      localRoomData.value = {
        ...localRoomData.value,
        ...settings
      };
      
      // API 호출로 방 설정 업데이트
      const updateData = {
        title: settings.title || localRoomData.value.title,
        password: settings.password || localRoomData.value.password,
        gameModeKey: settings.gameMode || localRoomData.value.gameMode,
        playerMatchTypeKey: settings.isTeamMode ? 'team' : 'individual',
        privateRoom: settings.isPrivate !== undefined ? settings.isPrivate : localRoomData.value.isPrivate,
        teamCount: settings.teamCount || localRoomData.value.teamCount || 2
      };
      
      await roomApiService.updateGameRoom(localRoomData.value.id, updateData);
      
      // WebSocket으로 방 설정 변경 알림
      const success = roomWebSocketService.publishRoomSettings(
        localRoomData.value.id,
        settings,
        props.currentUserId
      );
      
      if (!success) {
        console.warn('⚠️ WebSocket 방 설정 변경 알림 실패');
      }
      
      // 시스템 메시지 추가
      roomChat.addSystemMessage('방 설정이 변경되었습니다.');
      
      // 기존 emit 유지 (하위 호환성)
      emit('update-room-settings', settings);
      roomModal.closeRoomSettings();
      
      console.log('✅ 방 설정 업데이트 성공');
    } catch (error) {
      console.error('❌ 방 설정 업데이트 실패:', error);
      // 로컬 상태 복원
      localRoomData.value = {...props.roomData};
      alert('방 설정 변경에 실패했습니다.');
    }
  };

  const leaveRoom = async () => {
    try {
      // WebSocket 연결 해제
      await roomWebSocketService.disconnectFromRoom(
        localRoomData.value.id,
        props.currentUserId,
        props.isHost
      );
      
  
    
      // API 호출 (방장이 아닌 경우만)
      if (!props.isHost) {
        await roomApiService.leaveGameRoom(localRoomData.value.id);
      }
      
      // 기존 emit 유지
      emit('leave-room');
      
      console.log('✅ 방 퇴장 완료');
    } catch (error) {
      console.error('❌ 방 퇴장 실패:', error);
      // 에러가 발생해도 화면은 이동
      emit('leave-room');
    }
  };

  const startGame = () => {
    if (!canStartGame.value) {
      alert('게임을 시작할 수 없습니다. 최소 인원을 확인해주세요.');
      return;
    }
    
    // WebSocket으로 게임 시작 이벤트 발행
    const success = roomWebSocketService.publishGameStart(
      localRoomData.value.id,
      props.currentUserId
    );
    
    if (success) {
      console.log('✅ 게임 시작 이벤트 발행 성공');
    } else {
      console.warn('⚠️ WebSocket 게임 시작 이벤트 발행 실패, 기존 방식 사용');
      // WebSocket 실패 시 기존 emit 사용
      emit('start-game');
    }
  };

  const kickPlayer = async () => {
    if (!roomModal.playerToKick.value) return;
    
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
    // WebSocket으로 팀 변경 이벤트 발행
    const success = roomWebSocketService.publishJoinTeam(
      localRoomData.value.id,
      teamId,
      props.currentUserId
    );
    
    if (success) {
      console.log(`✅ 팀 변경 이벤트 발행: ${teamId}`);
    } else {
      console.warn('⚠️ WebSocket 팀 변경 이벤트 발행 실패, 기존 방식 사용');
      // WebSocket 실패 시 기존 emit 사용
      const currentPlayerIndex = roomPlayer.localPlayers.value.findIndex(
        player => player.id === props.currentUserId
      );
      
      if (currentPlayerIndex !== -1) {
        const updatedPlayers = [...roomPlayer.localPlayers.value];
        updatedPlayers[currentPlayerIndex] = {
          ...updatedPlayers[currentPlayerIndex],
          teamId: teamId
        };
        
        emit('join-team', { teamId, updatedPlayers });
      }
    }
  };

  const sendChatMessage = () => {
    if (!roomChat.chatInput.value.trim()) return;
    
    // WebSocket으로 채팅 메시지 발행
    const success = roomWebSocketService.publishChatMessage(
      localRoomData.value.id,
      roomChat.chatInput.value,
      props.currentUserId
    );
    
    if (success) {
      roomChat.clearChatInput();
      console.log('✅ 채팅 메시지 발송 성공');
    } else {
      console.warn('⚠️ WebSocket 채팅 메시지 발송 실패, 기존 방식 사용');
      // WebSocket 실패 시 기존 emit 사용
      emit('send-chat', roomChat.chatInput.value);
      roomChat.clearChatInput();
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

  // Watchers
  watch(() => props.chatMessages, (newMessages) => {
    roomChat.updateChatMessages(newMessages);
  }, { deep: true });

  // Lifecycle hooks
  onMounted(async () => {
    try {
      console.log('🚀 RoomView 마운트 시작');
      
      // 1. 초기 채팅 메시지 로드
      if (props.chatMessages) {
        roomChat.updateChatMessages(props.chatMessages);
      }
      roomChat.scrollChatToBottom();
      
      // 2. 초기 방 데이터 로딩 (방 정보 + 초기 플레이어 목록)
      await loadInitialRoomData();
      
      // 3. WebSocket 이벤트 핸들러 설정 (Spring Boot 채널 구조에 맞춤)
      const eventHandlers = {
        onGameRoomNotification: handleGameRoomNotification,  // 플레이어 목록 통합 알림
        onChatMessage: handleChatMessage,                    // 채팅 메시지
        onGameRoomStatusChange: handleGameRoomStatusChange   // 방 상태 변경 (설정, 게임 시작 등)
      };
      
      // 4. WebSocket 연결 시도
      const wsConnected = await roomWebSocketService.connectToRoom(
        localRoomData.value.id,
        props.currentUserId,
        eventHandlers
      );
      
      if (wsConnected) {
        console.log('✅ WebSocket 연결 성공 - 실시간 모드');
      } else {
        console.warn('⚠️ WebSocket 연결 실패 - 연결 재시도 필요');
        // 폴링 대신 WebSocket 재연결 시도나 에러 처리
      }
      
      console.log('🎉 RoomView 초기화 완료');
      
    } catch (error) {
      console.error('❌ RoomView 초기화 실패:', error);
      
      // 사용자에게 알림
      alert('방 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  });

  onBeforeUnmount(async () => {
    try {
      // WebSocket 연결 해제
      await roomWebSocketService.disconnectFromRoom(
        localRoomData.value.id,
        props.currentUserId,
        props.isHost
      );
      
      console.log('✅ 방 정리 완료');
    } catch (error) {
      console.error('❌ 방 정리 실패:', error);
    }
  });

  return {
    // 상태
    localRoomData: computed(() => localRoomData.value),
    isTeamMode,
    canStartGame,
    
    // WebSocket 및 로딩 상태
    isWebSocketConnected: computed(() => roomWebSocketService.isConnected),
    isLoadingPlayerList,
    lastPlayerListUpdate,
    
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
    handleGameRoomNotification,
    handleChatMessage,
    handleGameRoomStatusChange,
    
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
    getTeamPlayerCount: roomPlayer.getTeamPlayerCount
  };
} 