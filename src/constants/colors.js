/**
 * KoSpot 애플리케이션의 공식 색상 상수
 * 모든 색상 관련 값은 이 파일에서 관리합니다.
 */

// 브랜드 색상
export const BRAND = {
  PRIMARY: '#2563eb',       // 메인 브랜드 색상 (로고 색상)
  SECONDARY: '#f59e0b',     // 보조 브랜드 색상 (배지 색상)
  SUCCESS: '#10b981',       // 성공 상태 색상
  WARNING: '#f59e0b',       // 경고 상태 색상
  DANGER: '#ef4444',        // 위험/오류 상태 색상
  INFO: '#3b82f6',          // 정보 상태 색상
};

// 텍스트 색상
export const TEXT = {
  PRIMARY: '#111827',       // 기본 텍스트 색상
  SECONDARY: '#6b7280',     // 보조 텍스트 색상
  LIGHT: '#f3f4f6',         // 밝은 배경에 사용할 텍스트 색상
  MUTED: '#9ca3af',         // 흐린 텍스트 색상
};

// 배경 색상
export const BACKGROUND = {
  LIGHT: '#ffffff',         // 밝은 배경 색상
  DARK: '#111827',          // 어두운 배경 색상
  GRAY: '#f3f4f6',          // 회색 배경 색상
  HIGHLIGHT: '#f0f9ff',     // 강조 배경 색상
};

// 테마 색상
export const THEME = {
  LIGHT: {
    background: '#ffffff',
    text: '#111827',
    border: '#e5e7eb',
  },
  DARK: {
    background: '#1f2937',
    text: '#f3f4f6',
    border: '#374151',
  },
};

// 플레이어 색상
export const PLAYER = {
  CURRENT_USER: '#FF5252',  // 현재 사용자(김코스팟) 색상
  ANSWER_LOCATION: '#FF5252', // 정답 위치 색상
  OTHERS: [                 // 다른 플레이어 색상 목록
    '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF',
    '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59',
    '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
  ],
};

// 지도 관련 색상
export const MAP = {
  DISTANCE_LINE: '#db4040',  // 거리 표시 선 색상
  MARKER_SHADOW: 'rgba(0, 0, 0, 0.3)', // 마커 그림자 색상
  OVERLAY_BACKGROUND: 'rgba(255, 255, 255, 0.9)', // 오버레이 배경 색상
};

// 게임 관련 색상
export const GAME = {
  SCORE_HIGH: '#10b981',    // 높은 점수 색상
  SCORE_MEDIUM: '#f59e0b',  // 중간 점수 색상
  SCORE_LOW: '#ef4444',     // 낮은 점수 색상
  TIMER_NORMAL: '#3b82f6',  // 타이머 일반 색상
  TIMER_WARNING: '#f59e0b', // 타이머 경고 색상
  TIMER_DANGER: '#ef4444',  // 타이머 위험 색상
};

// 그라데이션 색상
export const GRADIENTS = {
  PRIMARY: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  SECONDARY: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  SUCCESS: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  DANGER: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
};

// 기본 내보내기 (편의를 위해)
export default {
  BRAND,
  TEXT,
  BACKGROUND,
  THEME,
  PLAYER,
  MAP,
  GAME,
  GRADIENTS
};
