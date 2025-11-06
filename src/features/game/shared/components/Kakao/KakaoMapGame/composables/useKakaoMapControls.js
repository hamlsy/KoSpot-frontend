// src/shared/composables/kakao/useKakaoMapControls.js
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useKakaoMapState } from './useKakaoMapState';
import { useKakaoMapDistance } from './useKakaoMapDistance';

export function useKakaoMapControls(props, emit) {
  const {
    map,
    marker,
    isLoading,
    isInitialized,
    markerImage,
    hasMarker,
    clickListener,
    isVoteInProgress,
  } = useKakaoMapState();

  const { calculateDistance } = useKakaoMapDistance(props);

  const initMap = () => {
    console.log("Initializing KakaoMap:", isInitialized.value);
    // 이미 초기화되어 있는 경우 리턴
    if (isInitialized.value && map.value) {
      resizeMap();
      return;
    }
    
    isLoading.value = true;
    
    if (window.kakao && window.kakao.maps) {
      const container = document.getElementById('map-container');
      const options = {
        center: new kakao.maps.LatLng(
          props.centerLocation.lat, 
          props.centerLocation.lng
        ),
        level: props.zoomLevel
      };
      
      map.value = new kakao.maps.Map(container, options);

      // 마커 이미지 설정 (markerImageUrl이 있으면 사용, 없으면 기본 이미지)
      const imageSrc = props.markerImageUrl || "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
      const imageSize = new kakao.maps.Size(24, 35);
      const imageOption = { offset: new kakao.maps.Point(12, 35) };
      markerImage.value = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      
      if (!props.disabled) {
        // 클릭 이벤트 등록
        addClickListener();
      }
      
      isLoading.value = false;
      isInitialized.value = true;
      
      // 지도 로드 완료 이벤트 발생
      emit('map-loaded', map.value);
    
    } else {
      console.error('Kakao Maps API가 로드되지 않았습니다.');
      // API가 로드되지 않은 경우 500ms 후에 다시 시도
      setTimeout(() => initMap(), 500);
      isLoading.value = false;
    }
  };
  
  const resizeMap = () => {
    console.log("resize");
    if (map.value) {
      // 지도 크기가 변경되었을 때 호출
      setTimeout(() => {
        map.value.relayout();
        
        // 센터 위치 재설정
        map.value.setCenter(new kakao.maps.LatLng(
          props.centerLocation.lat, 
          props.centerLocation.lng
        ));
        
        isLoading.value = false;
      }, 100);
    }
  };
  
  const zoomIn = () => {
    if (map.value) {
      map.value.setLevel(map.value.getLevel() - 1);
    }
  };
  
  const zoomOut = () => {
    if (map.value) {
      map.value.setLevel(map.value.getLevel() + 1);
    }
  };
  
  const resetZoom = () => {
    if (map.value) {
      map.value.setLevel(props.zoomLevel);
      map.value.setCenter(new kakao.maps.LatLng(
        props.centerLocation.lat, 
        props.centerLocation.lng
      ));
    }
  };
  
  const closeMap = () => {
    emit('close');
  };

  const addClickListener = () => {
    if (!map.value) return;
    
    // 기존 리스너 제거
    removeClickListener();
    
    // 새 리스너 추가
    clickListener.value = kakao.maps.event.addListener(map.value, 'click', (mouseEvent) => {
      // 비활성화 상태에서는 마커 설정 불가
      if (props.disabled) return;
      
      // 투표 진행 중일 때 마커 이동 제한
      if (isVoteInProgress.value) {
        console.log("투표 진행 중에는 마커 위치를 변경할 수 없습니다.");
        // emit('vote-in-progress'); // 필요시 상위 컴포넌트에 알림
        return;
      }
      
      // 기존 마커 제거
      removeMarker();
      
      // 클릭한 위치에 마커 생성
      const latlng = mouseEvent.latLng;
      
      // 마커 이미지 설정 (markerImageUrl이 있으면 사용, 없으면 기본 이미지)
      let markerImageToUse = markerImage.value;
      if (props.markerImageUrl && markerImage.value) {
        // markerImageUrl이 변경되었으면 새로운 마커 이미지 생성
        const imageSrc = props.markerImageUrl;
        const imageSize = new kakao.maps.Size(24, 35);
        const imageOption = { offset: new kakao.maps.Point(12, 35) };
        markerImageToUse = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      }
      
      marker.value = new kakao.maps.Marker({
        position: latlng,
        map: map.value,
        image: markerImageToUse
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
    
    // 디버깅용: 투표 상태 변경 감시
    watch(() => isVoteInProgress.value, (newValue) => {
      console.log("🔍 투표 상태 변경 감지:", newValue);
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

  // markerImageUrl 변경 감지
  watch(() => props.markerImageUrl, (newUrl) => {
    if (newUrl && markerImage.value) {
      // 마커 이미지 업데이트
      const imageSrc = newUrl;
      const imageSize = new kakao.maps.Size(24, 35);
      const imageOption = { offset: new kakao.maps.Point(12, 35) };
      markerImage.value = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      
      // 기존 마커가 있으면 이미지 업데이트
      if (marker.value) {
        marker.value.setImage(markerImage.value);
      }
    }
  });

  onMounted(() => {
    if (props.isOpen) {
      initMap();
    }
  });
  


  // 마커 위치 반환하는 메서드
  const getMarkerPosition = () => {
    return new Promise((resolve, reject) => {
      if (!marker.value || !map.value) {
        reject("마커가 설정되지 않았습니다.");
        return;
      }

      const position = marker.value.getPosition();
      resolve({
        lat: position.getLat(),
        lng: position.getLng(),
      });
    });
  };

  return {
    initMap,
    resizeMap,
    zoomIn,
    zoomOut,
    resetZoom,
    closeMap,
    addClickListener,
    removeClickListener,
    removeMarker,
    getMarkerPosition
  };
}
