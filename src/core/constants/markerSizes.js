/**
 * 카카오맵 마커 사이즈 상수
 * 유저 마커, 결과 마커, 게임 중 마커의 크기를 중앙에서 관리합니다.
 */

// 유저 마커 크기 (플레이어가 선택한 위치에 표시되는 마커)
export const USER_MARKER_SIZE = { width: 35, height: 35 };

// 결과 마커 크기 (정답 위치에 표시되는 마커)
export const RESULT_MARKER_SIZE = { width: 35, height: 35 };

// 게임 중 마커 크기 (지도 클릭 시 표시되는 인터랙티브 마커)
export const GAME_MARKER_SIZE = { width: 35, height: 35 };

// 게임 중 마커 offset (마커 이미지의 앵커 포인트)
export const GAME_MARKER_OFFSET = { x: 12, y: 35 };

/**
 * 유저 마커 Size 객체를 생성합니다.
 * @param {Object} kakao - 카카오맵 API 객체 (kakao 또는 window.kakao)
 * @returns {kakao.maps.Size} 유저 마커 Size 객체
 */
export const getUserMarkerSize = (kakao) => {
  if (!kakao || !kakao.maps) {
    throw new Error('Kakao Maps API 객체가 필요합니다.');
  }
  return new kakao.maps.Size(USER_MARKER_SIZE.width, USER_MARKER_SIZE.height);
};

/**
 * 결과 마커 Size 객체를 생성합니다.
 * @param {Object} kakao - 카카오맵 API 객체 (kakao 또는 window.kakao)
 * @returns {kakao.maps.Size} 결과 마커 Size 객체
 */
export const getResultMarkerSize = (kakao) => {
  if (!kakao || !kakao.maps) {
    throw new Error('Kakao Maps API 객체가 필요합니다.');
  }
  return new kakao.maps.Size(RESULT_MARKER_SIZE.width, RESULT_MARKER_SIZE.height);
};

/**
 * 게임 중 마커 Size 객체를 생성합니다.
 * @param {Object} kakao - 카카오맵 API 객체 (kakao 또는 window.kakao)
 * @returns {kakao.maps.Size} 게임 중 마커 Size 객체
 */
export const getGameMarkerSize = (kakao) => {
  if (!kakao || !kakao.maps) {
    throw new Error('Kakao Maps API 객체가 필요합니다.');
  }
  return new kakao.maps.Size(GAME_MARKER_SIZE.width, GAME_MARKER_SIZE.height);
};

/**
 * 게임 중 마커 Point 객체를 생성합니다 (offset용).
 * @param {Object} kakao - 카카오맵 API 객체 (kakao 또는 window.kakao)
 * @returns {kakao.maps.Point} 게임 중 마커 Point 객체
 */
export const getGameMarkerOffset = (kakao) => {
  if (!kakao || !kakao.maps) {
    throw new Error('Kakao Maps API 객체가 필요합니다.');
  }
  return new kakao.maps.Point(GAME_MARKER_OFFSET.x, GAME_MARKER_OFFSET.y);
};

