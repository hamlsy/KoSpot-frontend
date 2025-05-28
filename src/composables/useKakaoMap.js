/**
 * 카카오 맵 관련 기능을 제공하는 컴포저블
 * 여러 컴포넌트에서 재사용 가능한 카카오 맵 관련 로직을 제공합니다.
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useKakaoMaps } from '@/plugins/kakaoMaps';

export function useKakaoMap() {
  const { isLoaded, onLoaded, getKakao } = useKakaoMaps();
  
  const mapInstance = ref(null);
  const isMapReady = ref(false);
  const mapError = ref(null);
  
  /**
   * 지도 인스턴스 생성
   * @param {HTMLElement} container 지도를 표시할 HTML 요소
   * @param {Object} options 지도 생성 옵션
   * @returns {Promise} 지도 생성 Promise
   */
  const createMap = (container, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!container) {
        const error = new Error('지도를 표시할 HTML 요소가 필요합니다.');
        mapError.value = error;
        reject(error);
        return;
      }
      
      const initMap = (kakao) => {
        try {
          // 기본 옵션 설정
          const defaultOptions = {
            center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
            level: 3
          };
          
          // 사용자 옵션과 기본 옵션 병합
          const mapOptions = { ...defaultOptions, ...options };
          
          // 지도 생성
          const map = new kakao.maps.Map(container, mapOptions);
          mapInstance.value = map;
          isMapReady.value = true;
          
          resolve(map);
        } catch (error) {
          mapError.value = error;
          reject(error);
        }
      };
      
      // 카카오 맵 SDK가 로드되었는지 확인
      if (isLoaded()) {
        initMap(getKakao());
      } else {
        // 로드될 때까지 대기
        onLoaded(initMap);
      }
    });
  };
  
  /**
   * 지도에 마커 생성
   * @param {Object} position 마커 위치 (lat, lng)
   * @param {Object} options 마커 옵션
   * @returns {Object|null} 생성된 마커 객체 또는 null
   */
  const createMarker = (position, options = {}) => {
    if (!isMapReady.value || !mapInstance.value) {
      console.error('지도가 초기화되지 않았습니다.');
      return null;
    }
    
    const kakao = getKakao();
    if (!kakao) return null;
    
    const markerPosition = new kakao.maps.LatLng(position.lat, position.lng);
    const marker = new kakao.maps.Marker({
      position: markerPosition,
      map: mapInstance.value,
      ...options
    });
    
    return marker;
  };
  
  /**
   * 지도에 원 생성
   * @param {Object} center 원의 중심 위치 (lat, lng)
   * @param {number} radius 원의 반경 (미터)
   * @param {Object} options 원 옵션
   * @returns {Object|null} 생성된 원 객체 또는 null
   */
  const createCircle = (center, radius, options = {}) => {
    if (!isMapReady.value || !mapInstance.value) {
      console.error('지도가 초기화되지 않았습니다.');
      return null;
    }
    
    const kakao = getKakao();
    if (!kakao) return null;
    
    const circleCenter = new kakao.maps.LatLng(center.lat, center.lng);
    const circle = new kakao.maps.Circle({
      center: circleCenter,
      radius: radius,
      strokeWeight: 2,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      fillColor: '#FF0000',
      fillOpacity: 0.2,
      map: mapInstance.value,
      ...options
    });
    
    return circle;
  };
  
  /**
   * 두 위치 간의 거리 계산 (미터 단위)
   * @param {Object} pos1 첫 번째 위치 (lat, lng)
   * @param {Object} pos2 두 번째 위치 (lat, lng)
   * @returns {number} 거리 (미터)
   */
  const calculateDistance = (pos1, pos2) => {
    const kakao = getKakao();
    if (!kakao) return 0;
    
    const point1 = new kakao.maps.LatLng(pos1.lat, pos1.lng);
    const point2 = new kakao.maps.LatLng(pos2.lat, pos2.lng);
    
    // 미터 단위로 거리 계산
    return point1.distanceTo(point2);
  };
  
  /**
   * 지도 레벨 설정
   * @param {number} level 지도 레벨
   */
  const setMapLevel = (level) => {
    if (isMapReady.value && mapInstance.value) {
      mapInstance.value.setLevel(level);
    }
  };
  
  /**
   * 지도 중심 위치 설정
   * @param {Object} position 중심 위치 (lat, lng)
   */
  const setMapCenter = (position) => {
    if (!isMapReady.value || !mapInstance.value) return;
    
    const kakao = getKakao();
    if (!kakao) return;
    
    const center = new kakao.maps.LatLng(position.lat, position.lng);
    mapInstance.value.setCenter(center);
  };
  
  /**
   * 지도 영역 설정 (여러 위치를 모두 포함하도록)
   * @param {Array} positions 위치 배열 [{lat, lng}, ...]
   */
  const fitBounds = (positions) => {
    if (!isMapReady.value || !mapInstance.value || !positions.length) return;
    
    const kakao = getKakao();
    if (!kakao) return;
    
    const bounds = new kakao.maps.LatLngBounds();
    
    positions.forEach(pos => {
      bounds.extend(new kakao.maps.LatLng(pos.lat, pos.lng));
    });
    
    mapInstance.value.setBounds(bounds);
  };
  
  // 컴포넌트 언마운트 시 정리
  onUnmounted(() => {
    mapInstance.value = null;
    isMapReady.value = false;
  });
  
  return {
    mapInstance,
    isMapReady,
    mapError,
    createMap,
    createMarker,
    createCircle,
    calculateDistance,
    setMapLevel,
    setMapCenter,
    fitBounds,
    getKakao
  };
}
