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
   * @returns {Promise<boolean>} 연결 성공 여부
   */
  async connectToRoom(roomId, currentUserId, eventHandlers = {}) {
    try {
      console.log('🔌 게임 방 WebSocket 연결 시작:', { roomId, currentUserId });

      // WebSocket 연결
      if (!this.webSocketManager.isConnected.value) {
        await this.webSocketManager.connect();
      }

      // 이벤트 핸들러 저장
      this.roomEventHandlers.set(roomId, { ...eventHandlers, currentUserId });

      // 방 관련 토픽 구독
      await this._subscribeToRoomChannels(roomId, eventHandlers);

      console.log('✅ 게임 방 WebSocket 연결 완료:', roomId);
      return true;
    } catch (error) {
      console.error('❌ 게임 방 WebSocket 연결 실패:', error);
      return false;
    }
  }

  /**
   * 게임 방 WebSocket 연결 해제
   * @param {string} roomId - 게임 방 ID
   * @param {string} currentUserId - 현재 사용자 ID
   * @param {boolean} isHost - 방장 여부
   */
  async disconnectFromRoom(roomId, currentUserId, isHost = false) {
    try {
      console.log('🔌 게임 방 WebSocket 연결 해제:', { roomId, currentUserId, isHost });

      // 방 퇴장 이벤트 발행 (방장이 아닌 경우만)
      if (!isHost) {
        this.publishLeaveRoom(roomId, currentUserId);
      }

      // 구독 해제
      await this._unsubscribeFromRoomTopics(roomId);

      // 이벤트 핸들러 제거
      this.roomEventHandlers.delete(roomId);

      console.log('✅ 게임 방 WebSocket 연결 해제 완료:', roomId);
    } catch (error) {
      console.error('❌ 게임 방 WebSocket 연결 해제 실패:', error);
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
            const notification = JSON.parse(message.body);
            console.log('📥 게임 방 알림 수신:', notification);
            
            // 알림 타입에 따라 처리
            this._handleGameRoomNotification(notification, eventHandlers);
          } catch (error) {
            console.error('❌ 게임 방 알림 파싱 실패:', error);
          }
        })
      );
    }

    // 채팅 채널 구독
    if (eventHandlers.onChatMessage) {
      const chatChannel = getGameRoomChatChannel(roomId);
      subscriptions.push(
        this.webSocketManager.subscribe(chatChannel, (message) => {
          try {
            const chatEvent = JSON.parse(message.body);
            console.log('📥 채팅 메시지 수신:', chatEvent);
            eventHandlers.onChatMessage(chatEvent);
          } catch (error) {
            console.error('❌ 채팅 메시지 파싱 실패:', error);
          }
        })
      );
    }

    // 게임 방 상태 채널 구독 (설정 변경, 게임 시작 등)
    if (eventHandlers.onGameRoomStatusChange) {
      const statusChannel = getGameRoomStatusChannel(roomId);
      subscriptions.push(
        this.webSocketManager.subscribe(statusChannel, (message) => {
          try {
            const statusEvent = JSON.parse(message.body);
            console.log('📥 게임 방 상태 변경 수신:', statusEvent);
            eventHandlers.onGameRoomStatusChange(statusEvent);
          } catch (error) {
            console.error('❌ 게임 방 상태 이벤트 파싱 실패:', error);
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
}

// 싱글톤 인스턴스 생성 및 export
export const roomWebSocketService = new RoomWebSocketService();
export default roomWebSocketService;
