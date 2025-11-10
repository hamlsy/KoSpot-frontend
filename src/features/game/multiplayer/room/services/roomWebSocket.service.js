/**
 * Room WebSocket Service
 * 게임 방 내부의 실시간 이벤트 처리를 담당하는 WebSocket 서비스
 * Spring Boot의 GameRoomNotificationService와 연동하여 실시간 이벤트를 관리합니다.
 */
import useWebSocketManager from 'src/features/game/multiplayer/shared/services/websocket/useWebSocketManager.js';
import { 
  getGameRoomPlayerListChannel,
  getGameRoomSettingsChannel,
  getGameRoomChatChannel,
  getGameRoomStatusChannel,
  getGameStartChannel,
  GAME_ROOM_NOTIFICATION_TYPES
} from '../constants/webSocketChannels.js';

/**
 * Room WebSocket Service Class
 */
class RoomWebSocketService {
  constructor() {
    this.webSocketManager = useWebSocketManager();
    this.activeSubscriptions = new Map();
    this.roomEventHandlers = new Map();
    
    // 재연결 관련 상태
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 2000; // 2초부터 시작
    this.maxReconnectInterval = 30000; // 최대 30초
    this.reconnectTimeoutId = null;
    this.isManualDisconnect = false;
  }

  /**
   * 게임 방 WebSocket 연결 및 구독 설정
   * Spring Boot의 GameRoomNotificationService와 연동
   * @param {string} roomId - 게임 방 ID
   * @param {string} currentUserId - 현재 사용자 ID
   * @param {Object} eventHandlers - 이벤트 핸들러들
   * @param {Function} eventHandlers.onGameRoomNotification - 게임 방 알림 통합 핸들러
   * @param {Function} eventHandlers.onChatMessage - 채팅 메시지 핸들러
   * @param {Function} eventHandlers.onGameStateChange - 게임 상태 변경 핸들러
   * @param {Function} eventHandlers.onGameStartCountdown - 게임 시작 카운트다운 핸들러
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async connectToRoom(roomId, currentUserId, eventHandlers = {}) {
    try {
      console.log('🔌 게임 방 WebSocket 연결 시작:', { roomId, currentUserId });

      this.isManualDisconnect = false;
      
      // WebSocket 연결
      if (!this.webSocketManager.isConnected.value) {
        const connected = await this._connectWithRetry();
        if (!connected) {
          throw new Error('WebSocket 연결 실패');
        }
      }

      // 이벤트 핸들러 저장 (재연결 시 재사용)
      this.roomEventHandlers.set(roomId, { ...eventHandlers, currentUserId });

      // 방 관련 토픽 구독
      await this._subscribeToRoomChannels(roomId, eventHandlers);

      // 연결 상태 모니터링 시작
      this._startConnectionMonitoring(roomId);

      // 재연결 상태 초기화
      this.reconnectAttempts = 0;

      console.log('✅ 게임 방 WebSocket 연결 완료:', roomId);
      return true;
    } catch (error) {
      console.error('❌ 게임 방 WebSocket 연결 실패:', error);
      
      // 재연결 시도
      await this._attemptReconnect(roomId, currentUserId, eventHandlers);
      
      return false;
    }
  }


  /**
   * WebSocket 연결 상태 확인
   * @returns {boolean} 연결 상태
   */
  get isConnected() {
    return this.webSocketManager.isConnected.value;
  }

  /**
   * 더미 데이터 모드 설정
   * @param {boolean} useDummyData - 더미 데이터 사용 여부
   */
  setDummyMode(useDummyData) {
    this.webSocketManager.setDummyMode(useDummyData);
  }

  /**
   * 방 관련 채널 구독 (Spring Boot GameRoomNotificationService와 연동)
   * @param {string} roomId - 게임 방 ID
   * @param {Object} eventHandlers - 이벤트 핸들러들
   * @private
   */
  async _subscribeToRoomChannels(roomId, eventHandlers) {
    const subscriptions = [];

    // 플레이어 목록 채널 구독 (통합 알림)
    if (eventHandlers.onGameRoomNotification) {
      const playerListChannel = getGameRoomPlayerListChannel(roomId);
      subscriptions.push(
        this.webSocketManager.subscribe(playerListChannel, (message) => {
          try {
            const notification =
              message && typeof message === 'object' && 'body' in message
                ? JSON.parse(message.body)
                : message;

            console.log('📥 게임 방 알림 수신:', notification);
            this._handleGameRoomNotification(notification, eventHandlers);
          } catch (error) {
            console.error('❌ 게임 방 알림 파싱 실패:', error, message);
          }
        })
      );
    }

    // 채팅 채널 구독
    // API 명세서: /topic/room/{roomId}/chat
    if (eventHandlers.onChatMessage) {
      const chatChannel = getGameRoomChatChannel(roomId);
      subscriptions.push(
        this.webSocketManager.subscribe(chatChannel, (message) => {
          try {
            const chatEvent =
              message && typeof message === 'object' && 'body' in message
                ? JSON.parse(message.body)
                : message;

            console.log('📥 채팅 메시지 수신:', chatEvent);
            
            const processedChatEvent = {
              senderId: chatEvent.senderId,
              messageId: chatEvent.messageId,
              nickname: chatEvent.nickname,
              content: chatEvent.content,
              messageType: chatEvent.messageType,
              teamId: chatEvent.teamId || null,
              timestamp: chatEvent.timestamp
            };
            
            eventHandlers.onChatMessage(processedChatEvent);
          } catch (error) {
            console.error('❌ 채팅 메시지 파싱 실패:', error, message);
          }
        })
      );
    }

    // 게임 방 설정 채널 구독 (GameRoomUpdateMessage 처리)
    if (eventHandlers.onGameRoomSettingsUpdate) {
      const settingsChannel = getGameRoomSettingsChannel(roomId);
      subscriptions.push(
        this.webSocketManager.subscribe(settingsChannel, (message) => {
          try {
            const settingsUpdate =
              message && typeof message === 'object' && 'body' in message
                ? JSON.parse(message.body)
                : message;

            console.log('📥 게임 방 설정 업데이트 수신:', settingsUpdate);
            this._handleGameRoomSettingsUpdate(settingsUpdate, eventHandlers);
          } catch (error) {
            console.error('❌ 게임 방 설정 업데이트 파싱 실패:', error, message);
          }
        })
      );
    }

    // 게임 방 상태 채널 구독 (게임 시작 등)
    if (eventHandlers.onGameRoomStatusChange) {
      const statusChannel = getGameRoomStatusChannel(roomId);
      subscriptions.push(
        this.webSocketManager.subscribe(statusChannel, (message) => {
          try {
            const statusEvent =
              message && typeof message === 'object' && 'body' in message
                ? JSON.parse(message.body)
                : message;

            console.log('📥 게임 방 상태 변경 수신:', statusEvent);
            eventHandlers.onGameRoomStatusChange(statusEvent);
          } catch (error) {
            console.error('❌ 게임 방 상태 이벤트 파싱 실패:', error, message);
          }
        })
      );
    }

    // 게임 시작 카운트다운 채널 구독
    if (eventHandlers.onGameStartCountdown) {
      const gameStartChannel = getGameStartChannel(roomId);
      subscriptions.push(
        this.webSocketManager.subscribe(gameStartChannel, (message) => {
          try {
            const startEvent =
              message && typeof message === 'object' && 'body' in message
                ? JSON.parse(message.body)
                : message;

            console.log('📥 게임 시작 카운트다운 수신:', startEvent);
            eventHandlers.onGameStartCountdown(startEvent);
          } catch (error) {
            console.error('❌ 게임 시작 카운트다운 파싱 실패:', error, message);
          }
        })
      );
    }

    // 구독 정보 저장
    this.activeSubscriptions.set(roomId, subscriptions);
    console.log(`✅ 방 채널 구독 완료: ${subscriptions.length}개 채널`);
  }

  /**
   * 게임 방 알림 처리 (Spring Boot GameRoomNotification과 연동)
   * @param {Object} notification - 게임 방 알림 객체
   * @param {Object} eventHandlers - 이벤트 핸들러들
   * @private
   */
  _handleGameRoomNotification(notification, eventHandlers) {
    const { type, roomId, playerInfo, players, timestamp } = notification;

    switch (type) {
      case GAME_ROOM_NOTIFICATION_TYPES.PLAYER_JOINED:
        console.log('👤 플레이어 입장 알림:', playerInfo?.nickname);
        if (eventHandlers.onGameRoomNotification) {
          eventHandlers.onGameRoomNotification({
            type: 'PLAYER_JOINED',
            playerInfo,
            players,
            message: `${playerInfo?.nickname}님이 입장했습니다.`,
            timestamp
          });
        }
        break;

      case GAME_ROOM_NOTIFICATION_TYPES.PLAYER_LEFT:
        console.log('👤 플레이어 퇴장 알림:', playerInfo?.nickname);
        if (eventHandlers.onGameRoomNotification) {
          eventHandlers.onGameRoomNotification({
            type: 'PLAYER_LEFT',
            playerInfo,
            players,
            message: `${playerInfo?.nickname}님이 퇴장했습니다.`,
            timestamp
          });
        }
        break;

      case GAME_ROOM_NOTIFICATION_TYPES.PLAYER_KICKED:
        console.log('🚪 플레이어 강퇴 알림:', playerInfo?.nickname);
        if (eventHandlers.onGameRoomNotification) {
          eventHandlers.onGameRoomNotification({
            type: 'PLAYER_KICKED',
            playerInfo,
            players,
            message: `${playerInfo?.nickname}님이 강퇴되었습니다.`,
            timestamp
          });
        }
        break;

      case GAME_ROOM_NOTIFICATION_TYPES.PLAYER_LIST_UPDATED:
        console.log('🔄 플레이어 목록 전체 갱신 알림');
        if (eventHandlers.onGameRoomNotification) {
          eventHandlers.onGameRoomNotification({
            type: 'PLAYER_LIST_UPDATED',
            playerInfo: null,
            players,
            message: null, // 10초마다 발생하므로 메시지는 표시하지 않음
            timestamp
          });
        }
        break;

      case GAME_ROOM_NOTIFICATION_TYPES.TEAM_CHANGED:
        console.log('🏀 팀 변경 알림:', playerInfo?.nickname);
        if (eventHandlers.onGameRoomNotification) {
          eventHandlers.onGameRoomNotification({
            type: 'TEAM_CHANGED',
            playerInfo,
            players,
            message: `${playerInfo?.nickname}님이 팀을 변경했습니다.`,
            timestamp
          });
        }
        break;

      case GAME_ROOM_NOTIFICATION_TYPES.SETTINGS_UPDATED:
        console.log('⚙️ 방 설정 변경 알림');
        if (eventHandlers.onGameRoomNotification) {
          eventHandlers.onGameRoomNotification({
            type: 'SETTINGS_UPDATED',
            players,
            message: '방 설정이 변경되었습니다.',
            timestamp
          });
        }
        break;

      case GAME_ROOM_NOTIFICATION_TYPES.GAME_STARTED:
        console.log('🎮 게임 시작 알림');
        if (eventHandlers.onGameRoomNotification) {
          eventHandlers.onGameRoomNotification({
            type: 'GAME_STARTED',
            players,
            message: '게임이 시작됩니다!',
            timestamp
          });
        }
        break;

      default:
        console.warn('⚠️ 알 수 없는 게임 방 알림 타입:', type);
    }
  }

  /**
   * GameRoomUpdateMessage 처리 (Spring Boot와 연동)
   * @param {Object} settingsUpdate - GameRoomUpdateMessage 객체
   * @param {string} settingsUpdate.roomId - 방 ID
   * @param {string} settingsUpdate.title - 방 제목
   * @param {string} settingsUpdate.gameModeKey - 게임 모드 키
   * @param {string} settingsUpdate.playerMatchTypeKey - 플레이어 매치 타입 키 
   * @param {boolean} settingsUpdate.privateRoom - 비공개 방 여부
   * @param {number} settingsUpdate.teamCount - 팀 수
   * @param {Object} eventHandlers - 이벤트 핸들러들
   * @private
   */
  _handleGameRoomSettingsUpdate(settingsUpdate, eventHandlers) {
    console.log('⚙️ 게임 방 설정 업데이트 처리:', settingsUpdate);
    
    const { roomId, title, gameModeKey, playerMatchTypeKey, privateRoom, teamCount } = settingsUpdate;
    
    // 프론트엔드 형식으로 변환
    const transformedSettings = {
      title,
      gameMode: gameModeKey,
      isTeamMode: playerMatchTypeKey === 'team',
      isPrivate: privateRoom,
      teamCount: teamCount || 2,
      timestamp: new Date().toISOString()
    };
    
    if (eventHandlers.onGameRoomSettingsUpdate) {
      eventHandlers.onGameRoomSettingsUpdate({
        type: 'SETTINGS_UPDATED',
        roomId,
        settings: transformedSettings,
        message: '방 설정이 변경되었습니다.',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 방 설정 변경 이벤트 발행
   * @param {string} roomId - 게임 방 ID
   * @param {Object} settings - 변경된 설정
   * @param {string} userId - 변경한 사용자 ID
   * @returns {boolean} 발행 성공 여부
   */
  publishRoomSettings(roomId, settings, userId) {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ WebSocket이 연결되지 않아 방 설정 변경을 발행할 수 없습니다.');
        return false;
      }

      const settingsData = {
        roomId,
        title: settings.title,
        gameModeKey: settings.gameMode,
        playerMatchTypeKey: settings.isTeamMode ? 'team' : 'solo',
        privateRoom: settings.isPrivate || false,
        teamCount: settings.teamCount || 2,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      };

      const success = this.webSocketManager.publish(`/app/room/${roomId}/updateSettings`, settingsData);
      
      if (success) {
        console.log('✅ 방 설정 변경 이벤트 발행 성공:', settingsData);
      } else {
        console.error('❌ 방 설정 변경 이벤트 발행 실패');
      }
      
      return success;
    } catch (error) {
      console.error('❌ 방 설정 변경 이벤트 발행 중 오류:', error);
      return false;
    }
  }

  /**
   * 팀 변경 이벤트 발행
   * API 명세서: /app/room.{roomId}.switchTeam
   * @param {string} roomId - 게임 방 ID
   * @param {string} teamId - 변경할 팀 ID ("TEAM_A" 또는 "TEAM_B")
   * @param {string} userId - 변경하는 사용자 ID
   * @returns {boolean} 발행 성공 여부
   */
  publishJoinTeam(roomId, teamId, userId) {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ WebSocket이 연결되지 않아 팀 변경을 발행할 수 없습니다.');
        return false;
      }

      // API 명세서에 따른 메시지 형식: { team: "TEAM_A" 또는 "TEAM_B" }
      const teamChangeData = {
        team: teamId
      };

      // API 명세서에 따른 전송 경로: /app/room.{roomId}.switchTeam
      const success = this.webSocketManager.publish(`/app/room.${roomId}.switchTeam`, teamChangeData);
      
      if (success) {
        console.log('✅ 팀 변경 이벤트 발행 성공:', { roomId, ...teamChangeData });
      } else {
        console.error('❌ 팀 변경 이벤트 발행 실패');
      }
      
      return success;
    } catch (error) {
      console.error('❌ 팀 변경 이벤트 발행 중 오류:', error);
      return false;
    }
  }

  /**
   * 채팅 메시지 발행
   * API 명세서: /app/room.{roomId}.chat
   * @param {string} roomId - 게임 방 ID
   * @param {string} message - 메시지 내용
   * @param {string} userId - 발송자 사용자 ID (실제로는 서버에서 세션으로 식별)
   * @param {string} teamId - 팀 ID (선택적, 팀전인 경우)
   * @returns {boolean} 발행 성공 여부
   */
  publishChatMessage(roomId, message, userId, teamId = null) {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ WebSocket이 연결되지 않아 채팅 메시지를 발행할 수 없습니다.');
        return false;
      }

      // API 명세서에 따른 메시지 형식: { content: "메시지", team: "TEAM_A" (선택적) }
      const chatData = {
        content: message
      };

      // 팀 ID가 있으면 추가 (팀전인 경우)
      if (teamId) {
        chatData.team = teamId;
      }

      // API 명세서에 따른 전송 경로: /app/room.{roomId}.chat
      const success = this.webSocketManager.publish(`/app/room.${roomId}.chat`, chatData);
      
      if (success) {
        console.log('✅ 채팅 메시지 발행 성공:', { roomId, ...chatData });
      } else {
        console.error('❌ 채팅 메시지 발행 실패');
      }
      
      return success;
    } catch (error) {
      console.error('❌ 채팅 메시지 발행 중 오류:', error);
      return false;
    }
  }

  /**
   * 게임 시작 이벤트 발행
   * @param {string} roomId - 게임 방 ID
   * @param {string} userId - 게임을 시작하는 사용자 ID (방장)
   * @returns {boolean} 발행 성공 여부
   */
  publishGameStart(roomId, userId) {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ WebSocket이 연결되지 않아 게임 시작을 발행할 수 없습니다.');
        return false;
      }

      const gameStartData = {
        roomId,
        startedBy: userId,
        timestamp: new Date().toISOString()
      };

      const success = this.webSocketManager.publish(`/app/room/${roomId}/startGame`, gameStartData);
      
      if (success) {
        console.log('✅ 게임 시작 이벤트 발행 성공:', gameStartData);
      } else {
        console.error('❌ 게임 시작 이벤트 발행 실패');
      }
      
      return success;
    } catch (error) {
      console.error('❌ 게임 시작 이벤트 발행 중 오류:', error);
      return false;
    }
  }

  /**
   * 플레이어 강퇴 이벤트 발행
   * @param {string} roomId - 게임 방 ID
   * @param {string} targetPlayerId - 강퇴할 플레이어 ID
   * @param {string} hostId - 강퇴하는 방장 ID
   * @returns {boolean} 발행 성공 여부
   */
  publishKickPlayer(roomId, targetPlayerId, hostId) {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ WebSocket이 연결되지 않아 플레이어 강퇴를 발행할 수 없습니다.');
        return false;
      }

      const kickData = {
        roomId,
        targetMemberId: targetPlayerId,
        kickedBy: hostId,
        timestamp: new Date().toISOString()
      };

      const success = this.webSocketManager.publish(`/app/room/${roomId}/kickPlayer`, kickData);
      
      if (success) {
        console.log('✅ 플레이어 강퇴 이벤트 발행 성공:', kickData);
      } else {
        console.error('❌ 플레이어 강퇴 이벤트 발행 실패');
      }
      
      return success;
    } catch (error) {
      console.error('❌ 플레이어 강퇴 이벤트 발행 중 오류:', error);
      return false;
    }
  }

  /**
   * 방 퇴장 이벤트 발행
   * @param {string} roomId - 게임 방 ID
   * @param {string} userId - 퇴장하는 사용자 ID
   * @returns {boolean} 발행 성공 여부
   */
  publishLeaveRoom(roomId, userId) {
    try {
      if (!this.isConnected) {
        console.warn('⚠️ WebSocket이 연결되지 않아 방 퇴장을 발행할 수 없습니다.');
        return false;
      }

      const leaveData = {
        roomId,
        memberId: userId,
        timestamp: new Date().toISOString()
      };

      const success = this.webSocketManager.publish(`/app/room/${roomId}/leave`, leaveData);
      
      if (success) {
        console.log('✅ 방 퇴장 이벤트 발행 성공:', leaveData);
      } else {
        console.error('❌ 방 퇴장 이벤트 발행 실패');
      }
      
      return success;
    } catch (error) {
      console.error('❌ 방 퇴장 이벤트 발행 중 오류:', error);
      return false;
    }
  }

  /**
   * 재연결과 함께 WebSocket 연결 시도
   * @private
   */
  async _connectWithRetry() {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await this.webSocketManager.connect();
        if (this.webSocketManager.isConnected.value) {
          return true;
        }
      } catch (error) {
        console.error(`WebSocket 연결 시도 ${attempts + 1}/${maxAttempts} 실패:`, error);
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    
    return false;
  }

  /**
   * 연결 상태 모니터링 시작
   * @param {string} roomId - 모니터링할 방 ID
   * @private
   */
  _startConnectionMonitoring(roomId) {
    // 기존 모니터링 중지
    if (this.connectionMonitorId) {
      clearInterval(this.connectionMonitorId);
    }

    // 5초마다 연결 상태 확인
    this.connectionMonitorId = setInterval(() => {
      if (!this.isManualDisconnect && !this.webSocketManager.isConnected.value) {
        console.warn('🔄 WebSocket 연결 끊김 감지, 재연결 시도...');
        const eventHandlers = this.roomEventHandlers.get(roomId);
        if (eventHandlers) {
          this._attemptReconnect(roomId, eventHandlers.currentUserId, eventHandlers);
        }
      }
    }, 5000);
  }

  /**
   * 재연결 시도
   * @param {string} roomId - 게임 방 ID
   * @param {string} currentUserId - 현재 사용자 ID
   * @param {Object} eventHandlers - 이벤트 핸들러들
   * @private
   */
  async _attemptReconnect(roomId, currentUserId, eventHandlers) {
    if (this.isManualDisconnect) {
      console.log('수동 연결 해제 상태, 재연결 중지');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 최대 재연결 시도 횟수 초과, 재연결 포기');
      this._notifyReconnectionFailed(eventHandlers);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectInterval);
    
    console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)`);
    
    this.reconnectTimeoutId = setTimeout(async () => {
      try {
        const connected = await this._connectWithRetry();
        if (connected) {
          console.log('✅ 재연결 성공');
          
          // 채널 재구독
          await this._subscribeToRoomChannels(roomId, eventHandlers);
          
          // 재연결 상태 초기화
          this.reconnectAttempts = 0;
          
          // 재연결 성공 알림
          this._notifyReconnectionSuccess(eventHandlers);
        } else {
          // 재연결 실패, 다시 시도
          await this._attemptReconnect(roomId, currentUserId, eventHandlers);
        }
      } catch (error) {
        console.error('재연결 중 오류:', error);
        await this._attemptReconnect(roomId, currentUserId, eventHandlers);
      }
    }, delay);
  }

  /**
   * 재연결 성공 알림
   * @param {Object} eventHandlers - 이벤트 핸들러들
   * @private
   */
  _notifyReconnectionSuccess(eventHandlers) {
    if (eventHandlers.onConnectionStatusChange) {
      eventHandlers.onConnectionStatusChange({
        type: 'RECONNECTED',
        message: '서버와의 연결이 복구되었습니다.'
      });
    }
  }

  /**
   * 재연결 실패 알림
   * @param {Object} eventHandlers - 이벤트 핸들러들
   * @private
   */
  _notifyReconnectionFailed(eventHandlers) {
    if (eventHandlers.onConnectionStatusChange) {
      eventHandlers.onConnectionStatusChange({
        type: 'DISCONNECTED',
        message: '서버와의 연결이 끊어졌습니다. 페이지를 새로고침해주세요.'
      });
    }
  }

  /**
   * 방 관련 채널 구독 해제
   * @param {string} roomId - 게임 방 ID
   * @private
   */
  async _unsubscribeFromRoomChannels(roomId) {
    const subscriptions = this.activeSubscriptions.get(roomId);
    
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      
      this.activeSubscriptions.delete(roomId);
      console.log(`✅ 방 채널 구독 해제 완료: ${subscriptions.length}개 채널`);
    }
  }

  /**
   * 수동 연결 해제 (재연결 시도 중지)
   * @param {string} roomId - 게임 방 ID
   * @param {string} currentUserId - 현재 사용자 ID
   * @param {boolean} isHost - 방장 여부
   */
  async disconnectFromRoom(roomId, currentUserId, isHost = false, options = {}) {
    try {
      console.log('🔌 게임 방 WebSocket 연결 해제:', { roomId, currentUserId, isHost });

      this.isManualDisconnect = true;

      // 재연결 타이머 중지
      if (this.reconnectTimeoutId) {
        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = null;
      }

      // 연결 모니터링 중지
      if (this.connectionMonitorId) {
        clearInterval(this.connectionMonitorId);
        this.connectionMonitorId = null;
      }

      const reason = options?.reason || null;
      const normalizedReason = typeof reason === 'string' ? reason.toLowerCase() : null;
      const skipLeaveEvent = normalizedReason === 'navigate-room' || normalizedReason === 'navigate-game';

      // 방 퇴장 이벤트 발행 (방장이 아닌 경우만)
      if (!isHost && !skipLeaveEvent) {
        this.publishLeaveRoom(roomId, currentUserId);
      }

      // 구독 해제
      await this._unsubscribeFromRoomChannels(roomId);

      // 이벤트 핸들러 제거
      this.roomEventHandlers.delete(roomId);

      // 재연결 상태 초기화
      this.reconnectAttempts = 0;

      const shouldKeepConnection = skipLeaveEvent && this.webSocketManager.isConnected?.value;

      if (shouldKeepConnection) {
        this.isManualDisconnect = false;
        console.log('🔄 방 전환을 위해 WebSocket 연결을 유지합니다.', { roomId, reason });
      } else {
        // STOMP 연결 비활성화 (서버에 DISCONNECT 프레임 전송)
        if (typeof this.webSocketManager.deactivate === 'function') {
          const disconnectHeaders = reason ? { reason } : undefined;
          await this.webSocketManager.deactivate({
            disconnectHeaders,
            force: options?.force,
          });
        } else {
          this.webSocketManager.disconnect();
        }
      }

      console.log('✅ 게임 방 WebSocket 연결 해제 완료:', roomId);
    } catch (error) {
      console.error('❌ 게임 방 WebSocket 연결 해제 실패:', error);
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const roomWebSocketService = new RoomWebSocketService();
export default roomWebSocketService;
