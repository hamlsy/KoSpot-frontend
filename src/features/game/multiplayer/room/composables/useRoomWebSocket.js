import { ref, computed, onBeforeUnmount } from 'vue';
import webSocketManager from 'src/features/game/multiplayer/shared/services/websocket/composables/index.js';

/**
 * Room WebSocket 관리 컴포저블
 * 방 입장, 퇴장, 강퇴, 팀 변경 등 WebSocket 이벤트를 처리합니다.
 */
export function useRoomWebSocket() {
  // WebSocket 관련 상태
  const roomSubscriptions = ref(new Map());
  const isWebSocketConnected = ref(false);

  /**
   * 현재 방의 플레이어 목록을 요청합니다.
   */
  const requestCurrentPlayerList = (roomId, currentUserId) => {
    const topic = `/app/room/${roomId}/getPlayerList`;
    
    const requestData = {
      roomId,
      requesterId: currentUserId
    };
    
    console.log('📤 현재 플레이어 목록 요청:', requestData);
    
    const success = webSocketManager.publish(topic, requestData);
    
    if (!success) {
      console.error('❌ 플레이어 목록 요청 실패');
    }
    
    return success;
  };

  /**
   * 현재 플레이어 목록 응답을 처리합니다.
   */
  const handleCurrentPlayerList = (playerListEvent, onPlayerListUpdate) => {
    console.log('📥 현재 플레이어 목록 수신:', playerListEvent);
    
    if (!playerListEvent || !playerListEvent.players) {
      console.warn('⚠️ 잘못된 플레이어 목록 형식:', playerListEvent);
      return;
    }
    
    // 부모 컴포넌트에 플레이어 목록 업데이트 콜백 호출
    onPlayerListUpdate(playerListEvent.players);
    
    console.log('✅ 플레이어 목록 업데이트 완료');
  };

  /**
   * 방 WebSocket 연결 및 구독 설정
   */
  const connectToRoom = (roomId, currentUserId, onPlayerStatusChange, onRoomSettingsChange, onRoomChatMessage) => {
    console.log('🔗 방 WebSocket 연결 시도 중...');
    
    // 이미 연결되어 있는 경우 구독만 진행
    if (webSocketManager.isConnected.value) {
      console.log('이미 연결되어 있음, 구독만 진행');
      subscribeToRoomEvents(roomId, onPlayerStatusChange, onRoomSettingsChange, onRoomChatMessage);
      requestCurrentPlayerList(roomId, currentUserId);
      return;
    }
    
    // 연결 성공 콜백
    const onConnectCallback = () => {
      console.log('🟢 방 WebSocket 연결 성공!');
      isWebSocketConnected.value = true;
      subscribeToRoomEvents(roomId, onPlayerStatusChange, onRoomSettingsChange, onRoomChatMessage);
      
      // 현재 방의 플레이어 목록 먼저 요청
      requestCurrentPlayerList(roomId, currentUserId);
      
      // 그 다음 자신의 입장 알림
      setTimeout(() => {
        publishRoomEvent(roomId, 'JOIN', {
          roomId,
          player: {
            id: currentUserId,
            nickname: getCurrentPlayerNickname(currentUserId),
            profileImage: '',
            isHost: false, // 실제 구현에서는 props에서 가져와야 함
            teamId: getCurrentPlayerTeam(currentUserId)
          }
        });
      }, 100);
    };
    
    // WebSocket 연결
    webSocketManager.connect('/ws', onConnectCallback);
  };

  /**
   * 방 이벤트 구독 설정
   */
  const subscribeToRoomEvents = (roomId, onPlayerStatusChange, onRoomSettingsChange, onRoomChatMessage) => {
    // 방별 플레이어 상태 변경 구독
    const playerStatusTopic = `/topic/room/${roomId}/players`;
    const playerStatusSubscription = webSocketManager.subscribe(playerStatusTopic, onPlayerStatusChange);
    
    if (playerStatusSubscription) {
      roomSubscriptions.value.set(playerStatusTopic, playerStatusSubscription);
      console.log(`✅ 플레이어 상태 구독 완료: ${playerStatusTopic}`);
    }
    
    // 방별 방 설정 변경 구독
    const roomSettingsTopic = `/topic/room/${roomId}/settings`;
    const roomSettingsSubscription = webSocketManager.subscribe(roomSettingsTopic, onRoomSettingsChange);
    
    if (roomSettingsSubscription) {
      roomSubscriptions.value.set(roomSettingsTopic, roomSettingsSubscription);
      console.log(`✅ 방 설정 구독 완료: ${roomSettingsTopic}`);
    }
    
    // 방별 채팅 구독
    const chatTopic = `/topic/room/${roomId}/chat`;
    const chatSubscription = webSocketManager.subscribe(chatTopic, onRoomChatMessage);
    
    if (chatSubscription) {
      roomSubscriptions.value.set(chatTopic, chatSubscription);
      console.log(`✅ 방 채팅 구독 완료: ${chatTopic}`);
    }
    
    // 현재 플레이어 목록 응답 구독 (일회성)
    const playerListTopic = `/topic/room/${roomId}/playerList`;
    const playerListSubscription = webSocketManager.subscribe(playerListTopic, 
      (event) => handleCurrentPlayerList(event, (players) => {
        // 플레이어 목록 업데이트는 별도 콜백으로 처리
      })
    );
    
    if (playerListSubscription) {
      roomSubscriptions.value.set(playerListTopic, playerListSubscription);
      console.log(`✅ 플레이어 목록 구독 완료: ${playerListTopic}`);
    }
  };

  /**
   * 방 이벤트 발행
   */
  const publishRoomEvent = (roomId, eventType, data) => {
    const topic = `/app/room/${roomId}/event`;
    
    const eventData = {
      eventType,
      roomId,
      ...data
    };
    
    console.log(`📤 방 이벤트 발행: ${eventType}`, eventData);
    
    const success = webSocketManager.publish(topic, eventData);
    
    if (!success) {
      console.error('❌ 방 이벤트 발행 실패:', eventType);
    }
    
    return success;
  };

  /**
   * 강퇴 이벤트 발행
   */
  const publishKickEvent = (roomId, targetPlayerId, currentUserId) => {
    return publishRoomEvent(roomId, 'KICK', {
      targetPlayerId,
      kickedBy: currentUserId
    });
  };

  /**
   * 팀 변경 이벤트 발행
   */
  const publishJoinTeamEvent = (roomId, teamId, currentUserId, isHost) => {
    return publishRoomEvent(roomId, 'TEAM_CHANGE', {
      player: {
        id: currentUserId,
        nickname: getCurrentPlayerNickname(currentUserId),
        profileImage: '',
        isHost,
        teamId: teamId
      }
    });
  };

  /**
   * 퇴장 이벤트 발행
   */
  const publishLeaveEvent = (roomId, currentUserId, isHost) => {
    return publishRoomEvent(roomId, 'LEAVE', {
      player: {
        id: currentUserId,
        nickname: getCurrentPlayerNickname(currentUserId),
        profileImage: '',
        isHost,
        teamId: getCurrentPlayerTeam(currentUserId)
      }
    });
  };

  /**
   * 채팅 메시지 발행
   */
  const publishChatMessage = (roomId, message, currentUserId) => {
    const topic = `/app/room/${roomId}/chat`;
    
    const chatData = {
      roomId,
      message: {
        id: Date.now(),
        senderId: currentUserId,
        senderNickname: getCurrentPlayerNickname(currentUserId),
        content: message,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📤 채팅 메시지 발행:', chatData);
    
    const success = webSocketManager.publish(topic, chatData);
    
    if (!success) {
      console.error('❌ 채팅 메시지 발행 실패');
    }
    
    return success;
  };

  /**
   * 방 WebSocket 연결 해제
   */
  const disconnectFromRoom = (roomId, currentUserId, isHost) => {
    console.log('🔌 방 WebSocket 연결 해제 시도...');
    
    // 방 나가기 이벤트 발행
    publishLeaveEvent(roomId, currentUserId, isHost);
    
    // 구독 해제
    roomSubscriptions.value.forEach((subscription, topic) => {
      try {
        webSocketManager.unsubscribe(topic);
        console.log(`✅ 구독 해제: ${topic}`);
      } catch (error) {
        console.error(`❌ 구독 해제 실패: ${topic}`, error);
      }
    });
    
    roomSubscriptions.value.clear();
    isWebSocketConnected.value = false;
    
    console.log('✅ 방 WebSocket 연결 해제 완료');
  };

  // 유틸리티 함수들 (실제 구현에서는 별도 composable로 분리 가능)
  const getCurrentPlayerNickname = (currentUserId) => {
    // 실제 구현에서는 플레이어 목록에서 찾아야 함
    return '플레이어';
  };

  const getCurrentPlayerTeam = (currentUserId) => {
    // 실제 구현에서는 플레이어 목록에서 찾아야 함
    return null;
  };

  // 컴포넌트 언마운트 시 자동 연결 해제
  onBeforeUnmount(() => {
    // 실제 구현에서는 roomId, currentUserId, isHost를 전달받아야 함
    // disconnectFromRoom(roomId, currentUserId, isHost);
  });

  return {
    // 상태
    isWebSocketConnected: computed(() => isWebSocketConnected.value),
    
    // 메서드
    connectToRoom,
    disconnectFromRoom,
    publishRoomEvent,
    publishKickEvent,
    publishJoinTeamEvent,
    publishLeaveEvent,
    publishChatMessage,
    requestCurrentPlayerList,
    handleCurrentPlayerList
  };
} 