import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 카카오맵 관련 기능을 제공하는 컴포저블
 * @param {Object} options - 지도 옵션
 * @returns {Object} - 지도 관련 상태 및 메서드
 */
export default function useMap(options = {}) {
  const mapInstance = ref(null);
  const markers = ref([]);
  const isMapLoaded = ref(false);
  const mapError = ref(null);

  // 지도 초기화
  const initMap = (container, options = {}) => {
    try {
      if (!window.kakao || !window.kakao.maps) {
        mapError.value = '카카오맵 API가 로드되지 않았습니다.';
        return;
      }

      const defaultOptions = {
        center: new window.kakao.maps.LatLng(37.566826, 126.9786567), // 서울 시청
        level: 3
      };

      mapInstance.value = new window.kakao.maps.Map(container, { ...defaultOptions, ...options });
      isMapLoaded.value = true;
    } catch (error) {
      mapError.value = error.message;
      console.error('지도 초기화 오류:', error);
    }
  };

  // 마커 추가
  const addMarker = (position, options = {}) => {
    if (!mapInstance.value) return null;

    try {
      const markerPosition = position instanceof window.kakao.maps.LatLng
        ? position
        : new window.kakao.maps.LatLng(position.lat, position.lng);

      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        map: mapInstance.value,
        ...options
      });

      markers.value.push(marker);
      return marker;
    } catch (error) {
      console.error('마커 추가 오류:', error);
      return null;
    }
  };

  // 마커 제거
  const removeMarker = (marker) => {
    if (!marker) return;
    
    marker.setMap(null);
    markers.value = markers.value.filter(m => m !== marker);
  };

  // 모든 마커 제거
  const clearMarkers = () => {
    markers.value.forEach(marker => marker.setMap(null));
    markers.value = [];
  };

  // 지도 중심 변경
  const setCenter = (position) => {
    if (!mapInstance.value) return;

    try {
      const center = position instanceof window.kakao.maps.LatLng
        ? position
        : new window.kakao.maps.LatLng(position.lat, position.lng);

      mapInstance.value.setCenter(center);
    } catch (error) {
      console.error('지도 중심 변경 오류:', error);
    }
  };

  // 지도 레벨 변경
  const setLevel = (level) => {
    if (!mapInstance.value) return;
    mapInstance.value.setLevel(level);
  };

  // 거리 계산 (두 지점 간 미터 단위)
  const calculateDistance = (pos1, pos2) => {
    if (!window.kakao || !window.kakao.maps) return 0;

    try {
      const point1 = pos1 instanceof window.kakao.maps.LatLng
        ? pos1
        : new window.kakao.maps.LatLng(pos1.lat, pos1.lng);

      const point2 = pos2 instanceof window.kakao.maps.LatLng
        ? pos2
        : new window.kakao.maps.LatLng(pos2.lat, pos2.lng);

      return window.kakao.maps.geometry.getDistance(point1, point2);
    } catch (error) {
      console.error('거리 계산 오류:', error);
      return 0;
    }
  };

  // 원 그리기
  const drawCircle = (position, radius, options = {}) => {
    if (!mapInstance.value) return null;

    try {
      const center = position instanceof window.kakao.maps.LatLng
        ? position
        : new window.kakao.maps.LatLng(position.lat, position.lng);

      const circle = new window.kakao.maps.Circle({
        center,
        radius,
        strokeWeight: options.strokeWeight || 1,
        strokeColor: options.strokeColor || '#75B8FA',
        strokeOpacity: options.strokeOpacity || 1,
        strokeStyle: options.strokeStyle || 'solid',
        fillColor: options.fillColor || '#CFE7FF',
        fillOpacity: options.fillOpacity || 0.7,
        map: mapInstance.value
      });

      return circle;
    } catch (error) {
      console.error('원 그리기 오류:', error);
      return null;
    }
  };

  // 컴포넌트 마운트 시 이벤트 리스너 정리
  onUnmounted(() => {
    clearMarkers();
  });

  return {
    mapInstance,
    markers,
    isMapLoaded,
    mapError,
    initMap,
    addMarker,
    removeMarker,
    clearMarkers,
    setCenter,
    setLevel,
    calculateDistance,
    drawCircle
  };
}
