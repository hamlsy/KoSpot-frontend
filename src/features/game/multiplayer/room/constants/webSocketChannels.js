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
  HOST_CHANGED: 'HOST_CHANGED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  GAME_STARTED: 'GAME_STARTED',
  CHAT_MESSAGE: 'CHAT_MESSAGE'
};

/**
 * ID 유효성 검증 및 String 변환
 * Number 타입도 허용하고 자동으로 String으로 변환합니다.
 * @param {string|number} id - 검증할 ID (String 또는 Number)
 * @param {string} fieldName - 필드명 (에러 메시지용)
 * @returns {string} String으로 변환된 ID
 * @throws {Error} ID가 유효하지 않은 경우
 */
const validateId = (id, fieldName = 'id') => {
  // null, undefined 체크
  if (id === null || id === undefined) {
    throw new Error(`${fieldName}는 null이거나 undefined일 수 없습니다.`);
  }
  
  // Number 타입이면 String으로 변환
  const stringId = typeof id === 'number' ? String(id) : id;
  
  // String으로 변환 후 유효성 검증
  if (typeof stringId !== 'string' || stringId.trim() === '') {
    throw new Error(`${fieldName}는 유효한 값이어야 합니다.`);
  }
  
  return stringId;
};

/**
 * 게임 방 플레이어 목록 채널 생성
 * 백엔드 WebSocketChannelConstants.getGameRoomPlayerListChannel()과 동일
 * @param {string|number} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/room/{roomId}/playerList
 */
export const getGameRoomPlayerListChannel = (roomId) => {
  const validatedRoomId = validateId(roomId, 'roomId');
  return `${GAME_ROOM_PREFIX}${validatedRoomId}/playerList`;
};

/**
 * 게임 방 채팅 채널 생성
 * 백엔드 WebSocketChannelConstants.getGameRoomChatChannel()과 동일
 * @param {string|number} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/room/{roomId}/chat
 */
export const getGameRoomChatChannel = (roomId) => {
  const validatedRoomId = validateId(roomId, 'roomId');
  return `${GAME_ROOM_PREFIX}${validatedRoomId}/chat`;
};

/**
 * 게임 방 설정 채널 생성
 * 백엔드 WebSocketChannelConstants.getGameRoomSettingsChannel()과 동일
 * @param {string|number} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/room/{roomId}/settings
 */
export const getGameRoomSettingsChannel = (roomId) => {
  const validatedRoomId = validateId(roomId, 'roomId');
  return `${GAME_ROOM_PREFIX}${validatedRoomId}/settings`;
};

/**
 * 게임 방 상태 채널 생성
 * 백엔드 WebSocketChannelConstants.getGameRoomStatusChannel()과 동일
 * @param {string|number} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/room/{roomId}/status
 */
export const getGameRoomStatusChannel = (roomId) => {
  const validatedRoomId = validateId(roomId, 'roomId');
  return `${GAME_ROOM_PREFIX}${validatedRoomId}/status`;
};

/**
 * 게임 시작 채널 생성
 * @param {string|number} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/game/{roomId}/start
 */
export const getGameStartChannel = (roomId) => {
  const validatedRoomId = validateId(roomId, 'roomId');
  return `/topic/game/${validatedRoomId}/start`;
};

/**
 * 게임 로딩 상태 채널 생성
 * @param {string|number} roomId - 게임 방 ID
 * @returns {string} WebSocket 채널 경로: /topic/game/{roomId}/loading/status
 */
export const getGameLoadingStatusChannel = (roomId) => {
  const validatedRoomId = validateId(roomId, 'roomId');
  return `/topic/game/${validatedRoomId}/loading/status`;
};

/**
 * 모든 게임 방 채널 생성
 * @param {string|number} roomId - 게임 방 ID
 * @returns {Object} 모든 채널 객체
 */
export const getAllGameRoomChannels = (roomId) => {
  const validatedRoomId = validateId(roomId, 'roomId');
  
  return {
    playerList: getGameRoomPlayerListChannel(validatedRoomId),
    chat: getGameRoomChatChannel(validatedRoomId),
    settings: getGameRoomSettingsChannel(validatedRoomId),
    status: getGameRoomStatusChannel(validatedRoomId)
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
  getGameStartChannel,
  getGameLoadingStatusChannel,
  getAllGameRoomChannels,
  isGameRoomChannel,
  extractRoomIdFromChannel,
  getChannelType
};
