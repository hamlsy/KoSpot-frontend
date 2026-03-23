// src/shared/composables/kakao/useKakaoMapControls.js
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useKakaoMapState } from './useKakaoMapState';
import { useKakaoMapDistance } from './useKakaoMapDistance';
import { useKakaoMapHintCircles } from './useKakaoMapHintCircles';
import { getGameMarkerSize, getGameMarkerOffset } from '@/core/constants/markerSizes.js';

export function useKakaoMapControls(props, emit) {
  const {
    map,
    marker,
    isLoading,
    isInitialized,
    markerImage,
    hasMarker,
    clickListener,
    gameStore,
  } = useKakaoMapState();

  const { calculateDistance } = useKakaoMapDistance(props);
  const { removeCircles, createHintCircles } = useKakaoMapHintCircles(props);

  const initMap = () => {
    console.log("Initializing KakaoMap:", isInitialized.value);
    // 이미 초기화되어 있는 경우 리턴
    if (isInitialized.value && map.value) {
      resizeMap();
      // 제출한 마커가 있으면 복원
      restoreSubmittedMarker();
      return;
    }
    
    isLoading.value = true;
    
    if (window.kakao && window.kakao.maps) {
      const container = document.getElementById('map-container');
      const options = {
        center: new window.kakao.maps.LatLng(
          props.centerLocation.lat, 
          props.centerLocation.lng
        ),
        level: props.zoomLevel
      };
      
      map.value = new window.kakao.maps.Map(container, options);

      // 마커 이미지 설정 (markerImageUrl이 있으면 사용, 없으면 기본 이미지)
      const imageSrc = props.markerImageUrl || "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
      const imageSize = getGameMarkerSize(window.kakao);
      const imageOption = { offset: getGameMarkerOffset(window.kakao) };
      markerImage.value = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      
      if (!props.disabled && !props.hasSubmitted) {
        // 클릭 이벤트 등록 (제출하지 않은 경우에만)
        addClickListener();
      }
      
      // 제출한 마커가 있으면 복원 (제출 후 지도가 다시 열릴 때)
      // 클릭 리스너 등록 후에 복원해야 함 (제출한 경우 클릭 리스너가 추가되지 않음)
      restoreSubmittedMarker();
      
      isLoading.value = false;
      isInitialized.value = true;

      // 지도 로드 완료 이벤트 발생
      emit('map-loaded', map.value);

      // 생성 직후 relayout으로 숨겨진 상태에서 생성된 경우 타일 렌더링 보장
      // setCenter 없이 relayout만 호출하여 사용자 상태(마커·줌·위치) 보존
      requestAnimationFrame(() => {
        if (map.value) map.value.relayout();
      });
    
    } else {
      console.error('Kakao Maps API가 로드되지 않았습니다.');
      // API가 로드되지 않은 경우 500ms 후에 다시 시도
      setTimeout(() => initMap(), 500);
      isLoading.value = false;
    }
  };
  
  // 제출한 마커 복원 함수
  const restoreSubmittedMarker = () => {
    if (!map.value || !window.kakao || !window.kakao.maps) return;
    if (!gameStore || !gameStore.state) return;
    
    // 제출한 위치 확인 (hasSubmitted가 true이거나 userGuess가 있는 경우)
    const userGuess = gameStore.state.userGuess;
    const hasSubmitted = props.hasSubmitted || gameStore.state.hasSubmittedGuess;
    
    if (userGuess && userGuess.position && hasSubmitted) {
      console.log("제출한 마커 복원:", userGuess.position, "hasSubmitted:", hasSubmitted);
      
      // 기존 마커 제거 (있는 경우)
      if (marker.value) {
        marker.value.setMap(null);
        marker.value = null;
      }
      
      // 마커 이미지 설정 (props.markerImageUrl 우선, 없으면 기본 이미지)
      const imageSrc = props.markerImageUrl || "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
      const imageSize = getGameMarkerSize(window.kakao);
      const imageOption = { offset: getGameMarkerOffset(window.kakao) };
      const markerImageToUse = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      
      // 제출한 위치에 마커 생성
      const position = new window.kakao.maps.LatLng(
        userGuess.position.lat,
        userGuess.position.lng
      );
      
      marker.value = new window.kakao.maps.Marker({
        position: position,
        map: map.value,
        image: markerImageToUse
      });
      
      hasMarker.value = true;
      
      // 거리 계산
      if (props.actualLocation && props.showDistance) {
        calculateDistance();
      }
    } else if (!hasSubmitted && marker.value) {
      // 제출하지 않은 상태에서 마커가 있는 경우, 마커는 그대로 유지
      // (사용자가 클릭한 마커가 있는 경우)
      console.log("제출하지 않은 상태 - 기존 마커 유지");
    }
  };
  
  const resizeMap = () => {
    console.log("resize");
    if (map.value) {
      // 지도 크기가 변경되었을 때 호출
      setTimeout(() => {
        map.value.relayout();
        
        // 센터 위치 재설정
        if (window.kakao && window.kakao.maps) {
          map.value.setCenter(new window.kakao.maps.LatLng(
            props.centerLocation.lat, 
            props.centerLocation.lng
          ));
        }
        
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
    if (map.value && window.kakao && window.kakao.maps) {
      map.value.setLevel(props.zoomLevel);
      map.value.setCenter(new window.kakao.maps.LatLng(
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
    
    // 제출한 경우 클릭 리스너를 추가하지 않음 (마커 고정)
    if (props.hasSubmitted) {
      console.log("제출 완료 - 마커 고정되어 클릭 불가");
      return;
    }
    
    // 새 리스너 추가
    clickListener.value = window.kakao.maps.event.addListener(map.value, 'click', (mouseEvent) => {
      // 비활성화 상태에서는 마커 설정 불가
      if (props.disabled) return;
      
      // 제출한 경우 마커 변경 불가 (이중 체크)
      if (props.hasSubmitted) {
        console.log("제출 완료 - 마커 변경 불가");
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
        const imageSize = getGameMarkerSize(window.kakao);
        const imageOption = { offset: getGameMarkerOffset(window.kakao) };
        markerImageToUse = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      }
      
      marker.value = new window.kakao.maps.Marker({
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
  };
  
  // hasSubmitted prop 변경 감지 - 제출 후 클릭 리스너 제거
  watch(() => props.hasSubmitted, (newValue) => {
    if (newValue) {
      console.log("제출 완료 - 클릭 리스너 제거하여 마커 고정");
      removeClickListener();
    } else {
      // 제출이 취소된 경우(거의 없음) 클릭 리스너 다시 추가
      if (map.value && !props.disabled) {
        addClickListener();
      }
    }
  });
  
  const removeClickListener = () => {
    if (clickListener.value && window.kakao && window.kakao.maps) {
      window.kakao.maps.event.removeListener(clickListener.value);
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

  // 지도 재로딩 (완전히 새로 초기화)
  // 주의: 제출한 마커 위치는 userGuess에 저장되어 있으므로, 
  // 지도가 재초기화되어도 restoreSubmittedMarker에서 복원됨
  const reloadMap = () => {
    console.log("🔄 지도 재로딩 시작");
    
    // 제출 상태 저장 (지도 재초기화 후 마커 복원을 위해)
    const hasSubmitted = props.hasSubmitted || (gameStore && gameStore.state && gameStore.state.hasSubmittedGuess);
    const userGuess = gameStore && gameStore.state ? gameStore.state.userGuess : null;
    
    // 기존 힌트 원 제거
    removeCircles();
    
    // 기존 리스너 제거
    removeClickListener();
    
    // 마커 제거 (제출한 마커는 initMap에서 복원됨)
    removeMarker();
    
    // 지도 제거
    if (map.value) {
      // 지도 컨테이너 초기화
      const container = document.getElementById('map-container');
      if (container) {
        container.innerHTML = '';
      }
      map.value = null;
    }
    
    // 상태 초기화
    isInitialized.value = false;
    isLoading.value = true;
    hasMarker.value = false;
    
    // 짧은 딜레이 후 지도 재초기화 (컨테이너가 완전히 정리되도록)
    // initMap에서 restoreSubmittedMarker가 호출되어 제출한 마커가 복원됨
    setTimeout(() => {
      initMap();
      
      // 힌트 원이 필요하면 다시 생성 (initMap 완료 후)
      if (props.showHintCircles && props.actualLocation) {
        setTimeout(() => {
          createHintCircles();
        }, 300);
      }
    }, 100);
  };

  // markerImageUrl 변경 감지
  watch(() => props.markerImageUrl, (newUrl) => {
    if (newUrl && markerImage.value) {
      // 마커 이미지 업데이트
      const imageSrc = newUrl;
      const imageSize = getGameMarkerSize(window.kakao);
      const imageOption = { offset: getGameMarkerOffset(window.kakao) };
      markerImage.value = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      
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
    getMarkerPosition,
    reloadMap,
    restoreSubmittedMarker
  };
}
