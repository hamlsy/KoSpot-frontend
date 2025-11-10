// src/shared/composables/kakao/useKakaoMapCircles.js
import { useKakaoMapState } from './useKakaoMapState';

export function useKakaoMapHintCircles(props) {
  const { map, circles, showHints } = useKakaoMapState();
  
  const createHintCircles = () => {
    // actualLocation이 없으면 힌트 원 생성하지 않음 (싱글 게임에서 정답 좌표가 없을 때)
    if (!map.value || !props.actualLocation || !props.showHintCircles) return;
    
    // kakao 객체 확인
    if (!window.kakao || !window.kakao.maps) {
      console.error('Kakao Maps API가 로드되지 않았습니다.');
      return;
    }
    
    // 기존 원 제거
    removeCircles();
    
    // 정확한 위치에서 원 생성
    const position = new window.kakao.maps.LatLng(
      props.actualLocation.lat,
      props.actualLocation.lng
    );
    
    // 반지름 (km)
    const radiusList = [1, 2, 5]; 
    
    radiusList.forEach((radius) => {
      const circle = new window.kakao.maps.Circle({
        center: position,
        radius: radius * 800, // 미터 단위
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
