import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoomWebSocket } from './useRoomWebSocket';
import { useRoomModal } from './useRoomModal';
import { useRoomChat } from './useRoomChat';
import { useRoomPlayer } from './useRoomPlayer';

/**
 * Room 통합 관리 컴포저블
 * 방 관련 모든 기능을 통합하여 관리합니다.
 */
export function useRoom(props, emit) {
  // 로컬 상태 (props 복사)
  const localRoomData = ref({...props.roomData});
  
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

  // 이벤트 핸들러들
  const handlePlayerStatusChange = (playerEvent) => {
    const updatedPlayers = roomPlayer.handlePlayerStatusChange(
      playerEvent, 
      roomChat.addSystemMessage
    );
    
    // 부모 컴포넌트에 플레이어 목록 업데이트 알림
    emit('player-list-updated', updatedPlayers);
  };

  const handleRoomSettingsChange = (settingsEvent) => {
    console.log('🔄 방 설정 변경:', settingsEvent);
    
    if (!settingsEvent || !settingsEvent.settings) {
      console.warn('⚠️ 잘못된 방 설정 이벤트 형식:', settingsEvent);
      return;
    }
    
    // 로컬 방 설정 업데이트
    localRoomData.value = {
      ...localRoomData.value,
      ...settingsEvent.settings
    };
    
    // 시스템 메시지 추가
    roomChat.addSystemMessage('방 설정이 변경되었습니다.');
    
    console.log('✅ 방 설정 업데이트 완료');
  };

  // 방 관련 메서드들
  const updateRoomSettings = (settings) => {
    // 로컬 상태 업데이트 (UI 즉시 반영을 위해)
    localRoomData.value = {
      ...localRoomData.value,
      ...settings
    };
    
    // WebSocket으로 방 설정 변경 알림
    roomWebSocket.publishRoomEvent(localRoomData.value.id, 'SETTINGS_CHANGE', {
      settings,
      changedBy: props.currentUserId
    });
    
    // 기존 emit 유지 (하위 호환성)
    emit('update-room-settings', settings);
    roomModal.closeRoomSettings();
  };

  const leaveRoom = () => {
    // WebSocket 연결 해제
    roomWebSocket.disconnectFromRoom(
      localRoomData.value.id, 
      props.currentUserId, 
      props.isHost
    );
    
    // 기존 emit 유지
    emit('leave-room');
  };

  const startGame = () => {
    if (!canStartGame.value) return;
    
    // 게임 시작 이벤트 발행
    roomWebSocket.publishRoomEvent(localRoomData.value.id, 'GAME_START', {
      startedBy: props.currentUserId
    });
    
    // 기존 emit 유지
    emit('start-game');
  };

  const kickPlayer = () => {
    if (roomModal.playerToKick.value) {
      // WebSocket으로 강퇴 이벤트 발행
      const success = roomWebSocket.publishKickEvent(
        localRoomData.value.id,
        roomModal.playerToKick.value.id,
        props.currentUserId
      );
      
      if (success) {
        console.log(`✅ 강퇴 이벤트 발행: ${roomModal.playerToKick.value.nickname}`);
      } else {
        // WebSocket 실패 시 기존 emit 사용
        emit('kick-player', roomModal.playerToKick.value.id);
      }
      
      roomModal.closeKickModal();
    }
  };

  const joinTeam = (teamId) => {
    // WebSocket으로 팀 변경 이벤트 발행
    const success = roomWebSocket.publishJoinTeamEvent(
      localRoomData.value.id,
      teamId,
      props.currentUserId,
      props.isHost
    );
    
    if (success) {
      console.log(`✅ 팀 변경 이벤트 발행: ${teamId}`);
    } else {
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
    const success = roomWebSocket.publishChatMessage(
      localRoomData.value.id,
      roomChat.chatInput.value,
      props.currentUserId
    );
    
    if (success) {
      roomChat.clearChatInput();
    } else {
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
  onMounted(() => {
    // 초기 채팅 메시지 로드
    if (props.chatMessages) {
      roomChat.updateChatMessages(props.chatMessages);
    }
    
    // 채팅 하단으로 스크롤
    roomChat.scrollChatToBottom();
    
    // WebSocket 연결
    roomWebSocket.connectToRoom(
      localRoomData.value.id,
      props.currentUserId,
      handlePlayerStatusChange,
      handleRoomSettingsChange,
      (chatEvent) => roomChat.handleRoomChatMessage(chatEvent, props.currentUserId)
    );
  });

  onBeforeUnmount(() => {
    // WebSocket 연결 해제
    roomWebSocket.disconnectFromRoom(
      localRoomData.value.id,
      props.currentUserId,
      props.isHost
    );
  });

  return {
    // 상태
    localRoomData: computed(() => localRoomData.value),
    isTeamMode,
    canStartGame,
    
    // WebSocket 상태
    isWebSocketConnected: roomWebSocket.isWebSocketConnected,
    
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
    checkIfKicked,
    
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