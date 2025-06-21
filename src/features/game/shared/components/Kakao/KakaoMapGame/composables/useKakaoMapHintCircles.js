// src/shared/composables/kakao/useKakaoMapCircles.js
import { useKakaoMapState } from './useKakaoMapState';

export function useKakaoMapHintCircles(props) {
  const { map, circles, showHints } = useKakaoMapState();
  
  const createHintCircles = () => {
    if (!map.value || !props.actualLocation) return;
    
    // 기존 원 제거
    removeCircles();
    
    // 정확한 위치에서 원 생성
    const position = new kakao.maps.LatLng(
      props.actualLocation.lat,
      props.actualLocation.lng
    );
    
    // 반지름 (km)
    const radiusList = [1, 2, 5]; 
    
    radiusList.forEach((radius) => {
      const circle = new kakao.maps.Circle({
        center: position,
        radius: radius * 1000, // 미터 단위
        strokeWeight: 1,
        strokeColor: '#75B8FA',
        strokeOpacity: 0.5,
        strokeStyle: 'dashed',
        fillColor: '#CFE7FF',
        fillOpacity: 0.3,
        map: showHints.value ? map.value : null // 힌트가 켜져 있을 때만 표시
      });
      
      circles.value.push(circle);
    });
  };
  
  const removeCircles = () => {
    circles.value.forEach(circle => {
      circle.setMap(null);
    });
    circles.value = [];
  };
  
  const toggleHints = () => {
    showHints.value = !showHints.value;
    
    // 힌트 원 표시/숨김
    circles.value.forEach(circle => {
      circle.setMap(showHints.value ? map.value : null);
    });
  };
  
  return {
    createHintCircles,
    removeCircles,
    toggleHints
  };
}
