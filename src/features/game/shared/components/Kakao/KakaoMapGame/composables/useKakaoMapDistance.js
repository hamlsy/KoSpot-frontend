// src/shared/composables/kakao/useKakaoMapDistance.js
import { useKakaoMapState } from './useKakaoMapState';

export function useKakaoMapDistance(props) {
  const { map, marker, distance } = useKakaoMapState();
  
  const calculateDistance = () => {
    // actualLocation이 없으면 거리 계산하지 않음 (싱글 게임에서 정답 좌표가 없을 때)
    if (!marker.value || !props.actualLocation || !map.value || !props.showDistance) return;
    
    const markerPosition = marker.value.getPosition();
    
    // Haversine 공식을 사용한 거리 계산
    distance.value = getDistance(
      markerPosition.getLat(), markerPosition.getLng(),
      props.actualLocation.lat, props.actualLocation.lng
    );
  };
  
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // 킬로미터 단위
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  return {
    calculateDistance,
    getDistance,
    deg2rad
  };
}
