/**
 * 백엔드 에러 코드 상수
 * 백엔드 ErrorStatus와 동기화 필요
 */
export const ERROR_CODES = {
  // 게임 룸 관련 (43xx)
  GAME_ROOM_NOT_FOUND: 4301,
  GAME_ROOM_IS_FULL: 4302,
  GAME_ROOM_ALREADY_STARTED: 4303,
  GAME_ROOM_PASSWORD_INCORRECT: 4304,
  GAME_ROOM_ALREADY_IN_ROOM: 4305,
  GAME_ROOM_HOST_PRIVILEGES_REQUIRED: 4306,
  GAME_ROOM_INSUFFICIENT_PLAYERS: 4307,
  GAME_ROOM_CANNOT_JOIN_NOW: 4308,
  
  // 멤버 관련 (41xx)
  MEMBER_NOT_FOUND: 4101,
  MEMBER_UNAUTHORIZED: 4102,
  MEMBER_ALREADY_EXISTS: 4103,
  
  // 게임 관련 (42xx)
  GAME_NOT_FOUND: 4201,
  GAME_ALREADY_FINISHED: 4202,
  GAME_NOT_STARTED: 4203,
  
  // 일반 에러
  INTERNAL_SERVER_ERROR: 5000,
  BAD_REQUEST: 4000,
  UNAUTHORIZED: 4001,
  FORBIDDEN: 4003,
  NOT_FOUND: 4004
};

/**
 * 에러 코드별 사용자 친화적 메시지
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.GAME_ROOM_IS_FULL]: '이미 정원이 가득 찬 방입니다. 다른 방을 선택해주세요.',
  [ERROR_CODES.GAME_ROOM_NOT_FOUND]: '존재하지 않는 방입니다. 방 목록을 새로고침해주세요.',
  [ERROR_CODES.GAME_ROOM_ALREADY_STARTED]: '이미 게임이 시작된 방입니다. 다른 방을 선택해주세요.',
  [ERROR_CODES.GAME_ROOM_PASSWORD_INCORRECT]: '비밀번호가 틀렸습니다. 다시 입력해주세요.',
  [ERROR_CODES.GAME_ROOM_ALREADY_IN_ROOM]: '이미 다른 방에 참여 중입니다. 먼저 현재 방에서 나가주세요.',
  [ERROR_CODES.GAME_ROOM_HOST_PRIVILEGES_REQUIRED]: '방장만 수행할 수 있는 작업입니다.',
  [ERROR_CODES.GAME_ROOM_INSUFFICIENT_PLAYERS]: '최소 인원이 부족합니다. 더 많은 플레이어가 필요합니다.',
  [ERROR_CODES.GAME_ROOM_CANNOT_JOIN_NOW]: '현재 방에 입장할 수 없습니다.',
  
  [ERROR_CODES.MEMBER_NOT_FOUND]: '사용자 정보를 찾을 수 없습니다.',
  [ERROR_CODES.MEMBER_UNAUTHORIZED]: '로그인이 필요합니다.',
  [ERROR_CODES.MEMBER_ALREADY_EXISTS]: '이미 존재하는 사용자입니다.',
  
  [ERROR_CODES.GAME_NOT_FOUND]: '게임 정보를 찾을 수 없습니다.',
  [ERROR_CODES.GAME_ALREADY_FINISHED]: '이미 종료된 게임입니다.',
  [ERROR_CODES.GAME_NOT_STARTED]: '아직 시작되지 않은 게임입니다.'
};

/**
 * 에러별 권장 액션
 */
export const ERROR_ACTIONS = {
  [ERROR_CODES.GAME_ROOM_IS_FULL]: {
    message: '이미 정원이 가득 찬 방입니다. 다른 방을 선택해주세요.',
    actions: ['다른 방 찾기', '새 방 만들기']
  },
  [ERROR_CODES.GAME_ROOM_NOT_FOUND]: {
    message: '존재하지 않는 방입니다. 방 목록을 새로고침해주세요.',
    actions: ['방 목록 새로고침', '메인으로 돌아가기']
  },
  [ERROR_CODES.GAME_ROOM_ALREADY_STARTED]: {
    message: '이미 게임이 시작된 방입니다. 다른 방을 선택해주세요.',
    actions: ['다른 방 찾기', '관전 모드 (준비 중)']
  },
  [ERROR_CODES.GAME_ROOM_PASSWORD_INCORRECT]: {
    message: '비밀번호가 틀렸습니다. 다시 입력해주세요.',
    actions: ['다시 시도', '취소']
  },
  [ERROR_CODES.GAME_ROOM_ALREADY_IN_ROOM]: {
    message: '이미 다른 방에 참여 중입니다. 먼저 현재 방에서 나가주세요.',
    actions: ['현재 방으로 이동', '방 나가기']
  }
};

/**
 * 에러 코드로 메시지 조회
 * @param {number} errorCode - 에러 코드
 * @returns {string|null} 사용자 친화적 메시지 또는 null
 */
export const getErrorMessage = (errorCode) => {
  return ERROR_MESSAGES[errorCode] || null;
};

/**
 * 에러 코드로 권장 액션 조회
 * @param {number} errorCode - 에러 코드
 * @returns {Object|null} 메시지와 액션 목록 또는 null
 */
export const getErrorAction = (errorCode) => {
  return ERROR_ACTIONS[errorCode] || null;
};