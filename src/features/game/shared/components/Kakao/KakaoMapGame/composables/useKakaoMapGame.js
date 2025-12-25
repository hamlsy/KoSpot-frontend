// src/shared/composables/kakao/useKakaoMapGame.js
import { useKakaoMapState } from './useKakaoMapState';
import { useKakaoMapControls } from './useKakaoMapControls';

export function useKakaoMapGame(props, emit) {
  const { 
    marker, 
  } = useKakaoMapState();
  
  const { getMarkerPosition } = useKakaoMapControls(props, emit);
  
  const submitAnswer = async () => {
    if (!marker.value) return;
    
    try {
      const position = await getMarkerPosition();
      emit('submit-answer', position);
    } catch (error) {
      console.error('마커 위치를 가져오는 중 오류 발생:', error);
    }
  };

  return {
    submitAnswer
  };
}
