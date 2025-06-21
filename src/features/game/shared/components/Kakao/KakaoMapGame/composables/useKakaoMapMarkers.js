// src/shared/composables/kakao/useKakaoMapMarkers.js
import { useKakaoMapState } from './useKakaoMapState';
import { useKakaoMapDistance } from './useKakaoMapDistance';

export function useKakaoMapMarkers(props, emit) {
  const {
    map,
    marker,
    clickListener,
    hasMarker
  } = useKakaoMapState();
  
  const { calculateDistance } = useKakaoMapDistance(props);
  
  const addClickListener = () => {
    if (!map.value) return;
    
    // 기존 리스너 제거
    removeClickListener();
    
    // 새 리스너 추가
    clickListener.value = kakao.maps.event.addListener(map.value, 'click', (mouseEvent) => {
      // 비활성화 상태에서는 마커 설정 불가
      if (props.disabled) return;
      
      // 기존 마커 제거
      removeMarker();
      
      // 클릭한 위치에 마커 생성
      const latlng = mouseEvent.latLng;
      marker.value = new kakao.maps.Marker({
        position: latlng,
        map: map.value
      });
      
      hasMarker.value = true;
      
      // 거리 계산
      calculateDistance();
      
      // 클릭 이벤트 발생
      emit('map-clicked', {
        lat: latlng.getLat(),
        lng: latlng.getLng()
      });
    });
  };
  
  const removeClickListener = () => {
    if (clickListener.value) {
      kakao.maps.event.removeListener(clickListener.value);
      clickListener.value = null;
    }
  };
  
  const removeMarker = () => {
    if (marker.value) {
      marker.value.setMap(null);
      marker.value = null;
      hasMarker.value = false;
    }
  };
  
  // 마커 위치 반환하는 메서드
  const getMarkerPosition = () => {
    return new Promise((resolve, reject) => {
      if (!marker.value || !map.value) {
        reject('마커가 설정되지 않았습니다.');
        return;
      }
      
      const position = marker.value.getPosition();
      resolve({
        lat: position.getLat(),
        lng: position.getLng()
      });
    });
  };
  
  return {
    addClickListener,
    removeClickListener,
    removeMarker,
    getMarkerPosition
  };
}
