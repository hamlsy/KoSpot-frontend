/**
 * WebSocket 채널 상수 정의
 * 백엔드 WebSocketChannelConstants와 완전 동기화
 */

/**
 * 기본 PREFIX (백엔드와 동일)
 */
export const WEBSOCKET_PREFIX = {
  TOPIC: '/topic/',
  USER: '/user/'
};

/**
 * 글로벌 채팅 채널
 */
export const GLOBAL_CHAT_CHANNELS = {
  // 글로벌 로비 채팅
  GLOBAL_LOBBY: '/topic/chat/lobby'
};

/**
 * 게임 방 채널 PREFIX
 */
export const GAME_ROOM_PREFIX = '/topic/room/';

/**
 * 게임 방 알림 타입 (백엔드 GameRoomNotificationType과 동기화)
 */
export const GAME_ROOM_NOTIFICATION_TYPES = {
  PLAYER_JOINED: 'PLAYER_JOINED',
  PLAYER_LEFT: 'PLAYER_LEFT', 
  PLAYER_KICKED: 'PLAYER_KICKED',
  PLAYER_LIST_UPDATED: 'PLAYER_LIST_UPDATED', // 전체 플레이어 목록 갱신 (10초마다 / 팀 변경 시)
  TEAM_CHANGED: 'TEAM_CHANGED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  GAME_STARTED: 'GAME_STARTED',
  CHAT_MESSAGE: 'CHAT_MESSAGE'
};

/**
 * ID 유효성 검증 (백엔드 validateId와 동일한 로직)
 * @param {string} id - 검증할 ID
 * @param {string} fieldName - 필드명 (에러 메시지용)
 * @throws {Error} ID가 유효하지 않은 경우
 */
const validateId = (id, fieldName = 'id') => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error(`${fieldName}는 null이거나 빈 문자열일 수 없습니다.`);
  }
};

/**
 * 게임 방 플레이어 목록 채널 생성
 * 백엔드 WebSocketChannelConstants.getGameRoomPlayerListChannel()과 동일
 * @param {string} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/room/{roomId}/playerList
 */
export const getGameRoomPlayerListChannel = (roomId) => {
  validateId(roomId, 'roomId');
  return `${GAME_ROOM_PREFIX}${roomId}/playerList`;
};

/**
 * 게임 방 채팅 채널 생성
 * 백엔드 WebSocketChannelConstants.getGameRoomChatChannel()과 동일
 * @param {string} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/room/{roomId}/chat
 */
export const getGameRoomChatChannel = (roomId) => {
  validateId(roomId, 'roomId');
  return `${GAME_ROOM_PREFIX}${roomId}/chat`;
};

/**
 * 게임 방 설정 채널 생성
 * 백엔드 WebSocketChannelConstants.getGameRoomSettingsChannel()과 동일
 * @param {string} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/room/{roomId}/settings
 */
export const getGameRoomSettingsChannel = (roomId) => {
  validateId(roomId, 'roomId');
  return `${GAME_ROOM_PREFIX}${roomId}/settings`;
};

/**
 * 게임 방 상태 채널 생성
 * 백엔드 WebSocketChannelConstants.getGameRoomStatusChannel()과 동일
 * @param {string} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/room/{roomId}/status
 */
export const getGameRoomStatusChannel = (roomId) => {
  validateId(roomId, 'roomId');
  return `${GAME_ROOM_PREFIX}${roomId}/status`;
};

/**
 * 모든 게임 방 채널 생성
 * @param {string} roomId - 게임 방 ID
 * @returns {Object} 모든 채널 객체
 */
export const getAllGameRoomChannels = (roomId) => {
  validateId(roomId, 'roomId');
  
  return {
    playerList: getGameRoomPlayerListChannel(roomId),
    chat: getGameRoomChatChannel(roomId),
    settings: getGameRoomSettingsChannel(roomId),
    status: getGameRoomStatusChannel(roomId)
  };
};

/**
 * 게임 방 채널인지 확인
 * @param {string} channel - 확인할 채널
 * @returns {boolean} 게임 방 채널 여부
 */
export const isGameRoomChannel = (channel) => {
  return typeof channel === 'string' && channel.startsWith(GAME_ROOM_PREFIX);
};

/**
 * 채널에서 방 ID 추출
 * @param {string} channel - 채널 경로
 * @returns {string|null} 추출된 방 ID
 */
export const extractRoomIdFromChannel = (channel) => {
  if (!isGameRoomChannel(channel)) {
    return null;
  }
  
  const match = channel.match(/^\/topic\/room\/([^/]+)\//);
  return match ? match[1] : null;
};

/**
 * 채널 타입 확인
 * @param {string} channel - 채널 경로
 * @returns {string|null} 채널 타입 (playerList, chat, settings, status)
 */
export const getChannelType = (channel) => {
  if (!isGameRoomChannel(channel)) {
    return null;
  }
  
  if (channel.endsWith('/playerList')) return 'playerList';
  if (channel.endsWith('/chat')) return 'chat';
  if (channel.endsWith('/settings')) return 'settings';
  if (channel.endsWith('/status')) return 'status';
  
  return null;
};

export default {
  WEBSOCKET_PREFIX,
  GLOBAL_CHAT_CHANNELS,
  GAME_ROOM_PREFIX,
  GAME_ROOM_NOTIFICATION_TYPES,
  getGameRoomPlayerListChannel,
  getGameRoomChatChannel,
  getGameRoomSettingsChannel,
  getGameRoomStatusChannel,
  getAllGameRoomChannels,
  isGameRoomChannel,
  extractRoomIdFromChannel,
  getChannelType
};
