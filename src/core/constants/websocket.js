/**
 * WebSocket 관련 상수 정의
 */

export const WebSocketTopics = Object.freeze({
  // 글로벌 로비 채팅 메시지 구독
  GLOBAL_LOBBY: '/topic/lobby',
  
  // 게임 룸 채팅 (roomId 파라미터와 함께 사용)
  ROOM_CHAT: (roomId) => `/topic/room/${roomId}/chat`,
  
  // 게임 상태 업데이트 (roomId 파라미터와 함께 사용)
  GAME_STATE_UPDATE: (roomId) => `/topic/room/${roomId}/state`,
  
  // 플레이어 상태 업데이트 (roomId 파라미터와 함께 사용)
  PLAYER_STATE_UPDATE: (roomId) => `/topic/room/${roomId}/players`,
  
  // 게임 이벤트 (roomId 파라미터와 함께 사용)
  GAME_EVENTS: (roomId) => `/topic/room/${roomId}/events`,
});

export const WebSocketEndpoints = Object.freeze({
  // WebSocket 연결 엔드포인트
  CONNECT: '/ws',
  
  // 글로벌 로비 메시지 전송
  SEND_GLOBAL_MESSAGE: '/app/chat.message.lobby',
  
  // 글로벌 로비 입장
  JOIN_GLOBAL_LOBBY: '/app/chat.join.lobby',
  
  // 게임 액션 전송 (roomId 파라미터와 함께 사용)
  SEND_GAME_ACTION: (roomId) => `/app/game/${roomId}/action`,
});

export default {
  WebSocketTopics,
  WebSocketEndpoints,
};
