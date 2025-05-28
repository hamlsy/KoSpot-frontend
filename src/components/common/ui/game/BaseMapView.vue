<template>
  <div class="map-view">
    <div id="map-container" ref="mapContainer"></div>
    
    <div class="map-controls" v-if="showControls">
      <div class="zoom-controls">
        <button class="control-button zoom-in" @click="zoomIn" title="확대">
          <i class="fas fa-plus"></i>
        </button>
        <button class="control-button zoom-out" @click="zoomOut" title="축소">
          <i class="fas fa-minus"></i>
        </button>
      </div>
      
      <div class="view-controls">
        <button 
          class="control-button toggle-satellite" 
          @click="toggleSatelliteView"
          :class="{ 'active': isSatelliteView }"
          title="위성 지도"
        >
          <i class="fas fa-globe-asia"></i>
        </button>
        <button 
          class="control-button toggle-roadview" 
          @click="findNearestRoadview"
          v-if="showRoadviewButton"
          title="로드뷰 열기"
        >
          <i class="fas fa-street-view"></i>
        </button>
      </div>
    </div>
    
    <div class="map-mode-indicator" v-if="isGuessMode">
      <div class="indicator-text">
        <i class="fas fa-map-marker-alt"></i>
        지도를 클릭하여 위치를 선택하세요
      </div>
    </div>
    
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>지도 로딩 중...</p>
      </div>
    </div>
    
    <div class="distance-indicator" v-if="showDistance && distance !== null">
      <div class="distance-value">
        <i class="fas fa-ruler-horizontal"></i> 
        {{ formatDistance(distance) }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MapView',
  
  props: {
    center: {
      type: Object,
      default: () => ({ lat: 37.5665, lng: 126.9780 }), // 서울 시청 기본값
      // validator: prop => prop.hasOwnProperty('lat') && prop.hasOwnProperty('lng')
    },
    zoom: {
      type: Number,
      default: 12
    },
    markers: {
      type: Array,
      default: () => []
    },
    defaultMapType: {
      type: String,
      default: 'roadmap', // 'roadmap' 또는 'satellite'
      validator: value => ['roadmap', 'satellite'].includes(value)
    },
    isGuessMode: {
      type: Boolean,
      default: false
    },
    showControls: {
      type: Boolean,
      default: true
    },
    showRoadviewButton: {
      type: Boolean,
      default: false
    },
    showDistance: {
      type: Boolean,
      default: false
    },
    actualPosition: {
      type: Object,
      default: null
    },
    draggable: {
      type: Boolean,
      default: true
    },
    clickable: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      map: null,
      currentMarker: null,
      userMarkers: [],
      actualMarker: null,
      distanceLine: null,
      distance: null,
      isLoading: true,
      isSatelliteView: this.defaultMapType === 'satellite'
    };
  },
  
  watch: {
    center() {
      if (this.map) {
        // 지도 중심 변경
        // this.map.setCenter(new kakao.maps.LatLng(newCenter.lat, newCenter.lng));
      }
    },
    
    zoom() {
      if (this.map) {
        // 지도 줌 레벨 변경
        // this.map.setLevel(newZoom);
      }
    },
    
    markers: {
      handler(newMarkers) {
        this.updateMarkers(newMarkers);
      },
      deep: true
    },
    
    defaultMapType(newType) {
      this.isSatelliteView = newType === 'satellite';
      this.updateMapType();
    },
    
    actualPosition(newPosition) {
      if (newPosition) {
        this.showActualPosition(newPosition);
      } else if (this.actualMarker) {
        // 실제 위치 마커 제거
        // this.actualMarker.setMap(null);
        this.actualMarker = null;
        
        if (this.distanceLine) {
          // 거리 선 제거
          // this.distanceLine.setMap(null);
          this.distanceLine = null;
        }
        
        this.distance = null;
      }
    }
  },
  
  mounted() {
    this.initMap();
  },
  
  beforeUnmount() {
    // 마커 및 이벤트 리스너 제거
    this.userMarkers.forEach(marker => {
      marker.setMap(null);
    });
    
    if (this.currentMarker) {
      // this.currentMarker.setMap(null);
    }
    
    if (this.actualMarker) {
      // this.actualMarker.setMap(null);
    }
    
    if (this.distanceLine) {
      // this.distanceLine.setMap(null);
    }
  },
  
  methods: {
    initMap() {
      // Kakao Maps API 사용하여 구현
      // 실제 구현에서는 아래 주석 부분을 구현
      
      /*
      if (window.kakao && window.kakao.maps) {
        const container = this.$refs.mapContainer;
        const options = {
          center: new kakao.maps.LatLng(this.center.lat, this.center.lng),
          level: this.zoom,
          draggable: this.draggable
        };
        
        this.map = new kakao.maps.Map(container, options);
        
        // 지도 타입 설정
        if (this.isSatelliteView) {
          this.map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
        }
        
        // 초기 마커 설정
        this.updateMarkers(this.markers);
        
        // 클릭 이벤트 설정
        if (this.clickable) {
          kakao.maps.event.addListener(this.map, 'click', (mouseEvent) => {
            const latlng = mouseEvent.latLng;
            const clickPosition = {
              lat: latlng.getLat(),
              lng: latlng.getLng()
            };
            
            if (this.isGuessMode) {
              this.placeGuessMarker(clickPosition);
            }
            
            this.$emit('map-click', clickPosition);
          });
        }
        
        // 드래그 이벤트
        kakao.maps.event.addListener(this.map, 'dragend', () => {
          const center = this.map.getCenter();
          this.$emit('center-changed', {
            lat: center.getLat(),
            lng: center.getLng()
          });
        });
        
        // 줌 이벤트
        kakao.maps.event.addListener(this.map, 'zoom_changed', () => {
          const level = this.map.getLevel();
          this.$emit('zoom-changed', level);
        });
        
        // 로딩 완료
        this.isLoading = false;
        this.$emit('map-loaded');
        
        // 실제 위치 표시 (있는 경우)
        if (this.actualPosition) {
          this.showActualPosition(this.actualPosition);
        }
      } else {
        console.error('Kakao Maps SDK가 로드되지 않았습니다.');
        this.isLoading = false;
      }
      */
      
      // 목업 데이터로 대체 (데모 목적)
      setTimeout(() => {
        this.isLoading = false;
        this.$emit('map-loaded');
        
        if (this.actualPosition) {
          this.showActualPosition(this.actualPosition);
        }
      }, 1000);
    },
    
    updateMarkers(markers) {
      // 기존 마커 제거
      this.userMarkers.forEach(marker => {
        marker.setMap(null);
      });
      
      this.userMarkers = [];
      
      // 새 마커 추가
      markers.forEach(markerInfo => {
        this.addMarker(markerInfo);
      });
    },
    
    addMarker() {
      /*
      const position = new kakao.maps.LatLng(markerInfo.position.lat, markerInfo.position.lng);
      
      // 마커 이미지 설정
      let markerImage = null;
      if (markerInfo.icon) {
        const imageSize = new kakao.maps.Size(markerInfo.icon.width || 24, markerInfo.icon.height || 35);
        markerImage = new kakao.maps.MarkerImage(markerInfo.icon.url, imageSize);
      }
      
      // 마커 생성
      const marker = new kakao.maps.Marker({
        position: position,
        map: this.map,
        title: markerInfo.title,
        image: markerImage,
        clickable: markerInfo.clickable !== false,
        draggable: markerInfo.draggable || false,
        zIndex: markerInfo.zIndex || 0
      });
      
      // 클릭 이벤트
      if (markerInfo.clickable !== false) {
        kakao.maps.event.addListener(marker, 'click', () => {
          this.$emit('marker-click', markerInfo);
        });
      }
      
      // 드래그 이벤트
      if (markerInfo.draggable) {
        kakao.maps.event.addListener(marker, 'dragend', () => {
          const position = marker.getPosition();
          const updatedPosition = {
            lat: position.getLat(),
            lng: position.getLng()
          };
          
          this.$emit('marker-drag', { 
            id: markerInfo.id, 
            position: updatedPosition 
          });
        });
      }
      
      this.userMarkers.push(marker);
      
      // 인포윈도우
      if (markerInfo.infoWindow) {
        const infoContent = markerInfo.infoWindow.content;
        const infoWindow = new kakao.maps.InfoWindow({
          content: infoContent,
          removable: markerInfo.infoWindow.removable || false,
          zIndex: markerInfo.infoWindow.zIndex || 1
        });
        
        if (markerInfo.infoWindow.open) {
          infoWindow.open(this.map, marker);
        } else {
          kakao.maps.event.addListener(marker, 'click', () => {
            infoWindow.open(this.map, marker);
          });
        }
      }
      
      return marker;
      */
    },
    
    placeGuessMarker(position) {
      if (this.currentMarker) {
        // 기존 마커 위치 변경
        // this.currentMarker.setPosition(new kakao.maps.LatLng(position.lat, position.lng));
      } else {
        // 새 마커 생성
        /*
        this.currentMarker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(position.lat, position.lng),
          map: this.map,
          draggable: true
        });
        
        // 드래그 이벤트
        kakao.maps.event.addListener(this.currentMarker, 'dragend', () => {
          const pos = this.currentMarker.getPosition();
          const newPosition = {
            lat: pos.getLat(),
            lng: pos.getLng()
          };
          
          this.$emit('guess-marker-moved', newPosition);
          
          // 실제 위치와 거리 계산
          if (this.actualPosition) {
            this.updateDistanceLine(newPosition);
          }
        });
        */
      }
      
      this.$emit('guess-marker-placed', position);
      
      // 실제 위치와 거리 계산
      if (this.actualPosition) {
        this.updateDistanceLine(position);
      }
    },
    
    showActualPosition(position) {
      if (!position) return;
      
      // 실제 위치 마커 추가
      /*
      if (this.actualMarker) {
        this.actualMarker.setPosition(new kakao.maps.LatLng(position.lat, position.lng));
      } else {
        // 마커 이미지 설정 (다른 스타일)
        const imageSize = new kakao.maps.Size(24, 35);
        const markerImage = new kakao.maps.MarkerImage('/img/actual-marker.png', imageSize);
        
        this.actualMarker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(position.lat, position.lng),
          map: this.map,
          image: markerImage,
          zIndex: 10
        });
      }
      */
      
      // 거리선 업데이트
      if (this.currentMarker) {
        /*
        const markerPosition = this.currentMarker.getPosition();
        const guessPosition = {
          lat: markerPosition.getLat(),
          lng: markerPosition.getLng()
        };
        */
        const guessPosition = { lat: 37.57, lng: 126.98 }; // 테스트용
        this.updateDistanceLine(guessPosition);
      }
    },
    
    updateDistanceLine(guessPosition) {
      // 거리 계산
      this.distance = this.calculateDistance(guessPosition, this.actualPosition);
      
      // 거리선 그리기
      /*
      if (this.distanceLine) {
        // 기존 선 제거
        this.distanceLine.setMap(null);
      }
      
      const linePath = [
        new kakao.maps.LatLng(guessPosition.lat, guessPosition.lng),
        new kakao.maps.LatLng(this.actualPosition.lat, this.actualPosition.lng)
      ];
      
      this.distanceLine = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 3,
        strokeColor: '#FF3333',
        strokeOpacity: 0.8,
        strokeStyle: 'dashed'
      });
      
      this.distanceLine.setMap(this.map);
      */
      
      this.$emit('distance-updated', this.distance);
    },
    
    calculateDistance(pos1, pos2) {
      // 하버사인 공식으로 두 좌표 사이의 거리 계산 (km)
      const R = 6371; // 지구 반경 (km)
      const dLat = this.toRad(pos2.lat - pos1.lat);
      const dLon = this.toRad(pos2.lng - pos1.lng);
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRad(pos1.lat)) * Math.cos(this.toRad(pos2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      
      return d;
    },
    
    toRad(value) {
      return value * Math.PI / 180;
    },
    
    formatDistance(distance) {
      if (distance === null) return '';
      
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      } else if (distance < 10) {
        return `${distance.toFixed(2)}km`;
      } else {
        return `${distance.toFixed(1)}km`;
      }
    },
    
    zoomIn() {
      if (this.map) {
        // const currentLevel = this.map.getLevel();
        // this.map.setLevel(currentLevel - 1);
        this.$emit('zoom-changed', 3); // 임시 값
      }
    },
    
    zoomOut() {
      if (this.map) {
        // const currentLevel = this.map.getLevel();
        // this.map.setLevel(currentLevel + 1);
        this.$emit('zoom-changed', 5); // 임시 값
      }
    },
    
    toggleSatelliteView() {
      this.isSatelliteView = !this.isSatelliteView;
      this.updateMapType();
    },
    
    updateMapType() {
      if (!this.map) return;
      
      /*
      if (this.isSatelliteView) {
        this.map.setMapTypeId(kakao.maps.MapTypeId.HYBRID);
      } else {
        this.map.setMapTypeId(kakao.maps.MapTypeId.ROADMAP);
      }
      */
      
      this.$emit('map-type-changed', this.isSatelliteView ? 'satellite' : 'roadmap');
    },
    
    findNearestRoadview() {
      if (!this.map) return;
      
      const center = {
        lat: 37.566, // 임시 값 (실제로는 지도 중심점 사용)
        lng: 126.978
      };
      
      // 현재 지도 중심점에서 가장 가까운 로드뷰 찾기
      /*
      const center = this.map.getCenter();
      const position = {
        lat: center.getLat(),
        lng: center.getLng()
      };
      */
      
      this.$emit('roadview-requested', center);
    }
  }
};
</script>

<style scoped>
.map-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}

#map-container {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zoom-controls, .view-controls {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.control-button {
  width: 36px;
  height: 36px;
  border: none;
  background: white;
  color: #333;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.control-button:hover {
  background: #f0f0f0;
}

.control-button.active {
  background: #4285F4;
  color: white;
}

.map-mode-indicator {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.indicator-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading-spinner i {
  font-size: 2rem;
  color: #4285F4;
}

.loading-spinner p {
  font-size: 1rem;
  color: #333;
}

.distance-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.distance-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.distance-value i {
  color: #4285F4;
}

@media (max-width: 768px) {
  .map-controls {
    top: 70px;
  }
  
  .control-button {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .map-mode-indicator {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style> 