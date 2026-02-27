// API 엔드포인트 상수화 
// core/api/endpoints.js
// todo 변경 예정
export const API_ENDPOINTS = {
  // 인증 관련
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    RE_ISSUE: '/auth/reIssue',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },

  // 메인 페이지
  MAIN: '/main',

  // 사용자 관리
  MEMBER: {
    PROFILE: '/member/profile',
    UPDATE_PROFILE: '/member/profile',
    SET_NICKNAME: '/member/set-nickname',
    CHANGE_PASSWORD: '/member/change-password',
    DELETE_ACCOUNT: '/member/delete',
    FRIENDS: '/member/friends',
    SEARCH: '/user/search'
  },

  // 게임 관련
  GAME: {
    // 포토 모드
    PHOTO: {
      START: '/game/photo/start',
      SUBMIT_ANSWER: '/game/photo/submit',
      GET_RESULT: '/game/photo/result',
      GET_PHOTOS: '/game/photo/photos',
      GET_RANKINGS: '/game/photo/rankings'
    },

    // 로드뷰 모드
    ROADVIEW: {
      START: '/game/roadview/start',
      SUBMIT_ANSWER: '/game/roadview/submit',
      GET_RESULT: '/game/roadview/result',
      GET_LOCATIONS: '/game/roadview/locations'
    },

    // 멀티플레이어
    MULTIPLAYER: {
      CREATE_ROOM: '/game/multiplayer/room/create',
      JOIN_ROOM: '/game/multiplayer/room/join',
      LEAVE_ROOM: '/game/multiplayer/room/leave',
      GET_ROOMS: '/game/multiplayer/rooms',
      ROOM_SETTINGS: '/game/multiplayer/room/settings'
    },

    // 게임 기록
    HISTORY: '/game/history',
    STATISTICS: '/game/statistics'
  },

  // 관리자
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    GAMES: '/admin/games',
    STATISTICS: '/admin/statistics',
    SETTINGS: '/admin/settings'
  },

  // 파일 업로드
  UPLOAD: {
    IMAGE: '/upload/image',
    AVATAR: '/upload/avatar'
  },

  // 게임 룸 관리
  GAME_ROOM: {
    LIST: '/rooms',
    JOIN: (roomId) => `/rooms/${roomId}/join`,
    CREATE: '/rooms/',
    LEAVE: (roomId) => `/rooms/${roomId}/leave`,
    DETAILS: (roomId) => `/rooms/${roomId}`
  },

  // 알림
  NOTIFICATION: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ: (notificationId) => `/notifications/${notificationId}/read`,
    READ_ALL: '/notifications/read-all',
  }
}

// 동적 엔드포인트 생성 헬퍼
export const createEndpoint = (template, params) => {
  return template.replace(/:(\w+)/g, (match, key) => params[key] || match)
}

// 예시: createEndpoint('/user/:id/profile', { id: 123 }) => '/user/123/profile'
