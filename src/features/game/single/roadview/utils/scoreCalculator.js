/**
 * 거리 및 점수 계산 유틸리티
 * 백엔드 ScoreCalculator / DistanceCalculator Java 클래스를 정확히 포팅한 순수 함수 모음
 */

// ─── 상수 ────────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371.0;

// 거리 구간 기준점 (km)
const D0 = 0.0;
const D1 = 1.0;
const D2 = 5.0;
const D3 = 10.0;
const D4 = 30.0;
const D5 = 50.0;
const D6 = 100.0;
const D7 = 200.0;
const D_MAX = 400.0;

// 각 거리에서의 점수
const S0 = 1000.0;
const S1 = 950.0;
const S2 = 900.0;
const S3 = 800.0;
const S4 = 700.0;
const S5 = 600.0;
const S6 = 400.0;
const S7 = 200.0;
const S8 = 0.0;

// ─── 내부 헬퍼 ────────────────────────────────────────────────────────────────

function deg2rad(deg) {
  return (deg * Math.PI) / 180.0;
}

/**
 * 선형 보간: x가 [x1, x2] 구간에 있을 때 y를 [y1, y2]로 선형 변환
 * @param {number} x
 * @param {number} x1
 * @param {number} x2
 * @param {number} y1
 * @param {number} y2
 * @returns {number}
 */
function lerp(x, x1, x2, y1, y2) {
  if (x2 - x1 === 0) return y1;
  const t = (x - x1) / (x2 - x1);
  return y1 + t * (y2 - y1);
}

// ─── 공개 함수 ────────────────────────────────────────────────────────────────

/**
 * Haversine 공식으로 두 좌표 간 거리 계산
 * (백엔드 DistanceCalculator.calculateHaversineDistance 동일 로직)
 *
 * @param {number} lat1  - 출발 위도
 * @param {number} lng1  - 출발 경도
 * @param {number} lat2  - 도착 위도
 * @param {number} lng2  - 도착 경도
 * @returns {number} 거리 (km)
 */
export function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * 거리 기반 점수 계산 (구간별 선형 보간)
 * (백엔드 ScoreCalculator.calculateScore 동일 로직)
 *
 * @param {number} distanceKm - 거리 (km)
 * @returns {number} 점수 (0 ~ 1000, 소수 둘째 자리)
 */
export function calculateScore(distanceKm) {
  if (distanceKm <= 0) return 1000.0;
  if (distanceKm >= D_MAX) return 0.0;

  let score;

  if (distanceKm <= D1) {
    score = lerp(distanceKm, D0, D1, S0, S1);
  } else if (distanceKm <= D2) {
    score = lerp(distanceKm, D1, D2, S1, S2);
  } else if (distanceKm <= D3) {
    score = lerp(distanceKm, D2, D3, S2, S3);
  } else if (distanceKm <= D4) {
    score = lerp(distanceKm, D3, D4, S3, S4);
  } else if (distanceKm <= D5) {
    score = lerp(distanceKm, D4, D5, S4, S5);
  } else if (distanceKm <= D6) {
    score = lerp(distanceKm, D5, D6, S5, S6);
  } else if (distanceKm <= D7) {
    score = lerp(distanceKm, D6, D7, S6, S7);
  } else {
    score = lerp(distanceKm, D7, D_MAX, S7, S8);
  }

  // 소수 둘째 자리까지 반올림 (백엔드 BigDecimal HALF_UP 동일)
  const rounded = Math.round(score * 100) / 100;
  return Math.min(1000.0, Math.max(0.0, rounded));
}
