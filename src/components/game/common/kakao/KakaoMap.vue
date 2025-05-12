<template>
  <div class="kakao-map">
    <div id="map-container" ref="mapContainer"></div>
    
    <div 
      class="marker-info" 
      v-if="showInfoWindow && actualPosition"
    >
      <div class="info-content">
        <div class="info-header">
          <h3>실제 위치</h3>
          <span class="distance" v-if="distance !== null">
            {{ formatDistance(distance) }}
          </span>
        </div>
        <div class="info-body">
          <p class="coords">{{ formatCoords(actualPosition) }}</p>
        </div>
      </div>
    </div>
    
    <div class="map-overlay" v-if="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>지도 로딩 중...</p>
      </div>
    </div>
    
    <div class="map-controls" v-if="!preventInteraction">
      <button class="control-btn zoom-in" @click="zoomIn" title="줌 인">
        <i class="fas fa-plus"></i>
      </button>
      <button class="control-btn zoom-out" @click="zoomOut" title="줌 아웃">
        <i class="fas fa-minus"></i>
      </button>
      <button class="control-btn reset" @click="resetMap" title="지도 초기화">
        <i class="fas fa-undo"></i>
      </button>
    </div>
    
    <div class="markers-container" v-if="showMarkerHint && !marker && !preventInteraction">
      <div class="marker-hint">
        <i class="fas fa-map-marker-alt"></i>
        <span>지도를 클릭하여 위치를 선택하세요</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KakaoMap',
  
  props: {
    center: {
      type: Object,
      required: true,
      validator: prop => Object.prototype.hasOwnProperty.call(prop, 'lat') && Object.prototype.hasOwnProperty.call(prop, 'lng')
    },
    markerPosition: {
      type: Object,
      default: null
    },
    actualPosition: {
      type: Object,
      default: null
    },
    preventInteraction: {
      type: Boolean,
      default: false
    },
    showMarkerHint: {
      type: Boolean,
      default: true
    },
    zoomLevel: {
      type: Number,
      default: 7
    },
    playerGuesses: {
      type: Array,
      default: () => []
    },
    showDistanceLines: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      map: null,
      marker: null,
      actualMarker: null,
      polyline: null,
      isLoading: true,
      showInfoWindow: false,
      distance: null,
      playerMarkers: [],
      distanceLines: []
    };
  },
  
  watch: {
    center(newCenter) {
      if (this.map) {
        const position = new window.kakao.maps.LatLng(newCenter.lat, newCenter.lng);
        this.map.setCenter(position);
      }
    },
    
    markerPosition(newPosition) {
      if (newPosition) {
        this.setMarker(newPosition);
      }
    },
    
    actualPosition(newPosition, oldPosition) {
      if (newPosition && !oldPosition) {
        this.showActualPosition(newPosition);
      }
    },
    
    playerGuesses: {
      handler(newGuesses) {
        this.showPlayerGuesses(newGuesses);
      },
      deep: true
    }
  },
  
  mounted() {
    this.initMap();
    
    // 플레이어 추측 위치가 있으면 표시
    if (this.playerGuesses && this.playerGuesses.length > 0) {
      this.showPlayerGuesses(this.playerGuesses);
    }
  },
  
  beforeDestroy() {
    // 리소스 정리
    // 실제 구현에서는 이벤트 리스너 정리 등의 작업 수행
  },
  
  methods: {
    initMap() {
      if (window.kakao && window.kakao.maps) {
        const container = this.$refs.mapContainer;
        const options = {
          center: new kakao.maps.LatLng(this.center.lat, this.center.lng),
          level: this.zoomLevel
        };
        
        this.map = new kakao.maps.Map(container, options);
        
        // 지도 로딩 완료 시 로딩 상태 변경
        kakao.maps.event.addListener(this.map, 'tilesloaded', () => {
          this.isLoading = false;
        });
        
        // 마커 위치가 이미 있으면 설정
        if (this.markerPosition) {
          this.setMarker(this.markerPosition);
        }
        
        // 실제 위치가 이미 있으면 표시
        if (this.actualPosition) {
          this.showActualPosition(this.actualPosition);
        }
        
        // 플레이어 추측 위치가 있으면 표시
        if (this.playerGuesses && this.playerGuesses.length > 0) {
          this.showPlayerGuesses(this.playerGuesses);
        }
        
        // 지도 클릭 이벤트
        if (!this.preventInteraction) {
          kakao.maps.event.addListener(this.map, 'click', (mouseEvent) => {
            const latlng = mouseEvent.latLng;
            const position = {
              lat: latlng.getLat(),
              lng: latlng.getLng()
            };
            
            this.setMarker(position);
            this.$emit('spot-answer', position);
          });
        }
        
        // 지도 컨트롤 추가
        const zoomControl = new kakao.maps.ZoomControl();
        this.map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
      } else {
        console.error('Kakao Maps SDK가 로드되지 않았습니다.');
        this.isLoading = false;
      }
    },
    
    showActualPosition(position) {
      if (!this.map || !position) return;
      
      // 실제 위치 마커 생성
      const markerPosition = new kakao.maps.LatLng(position.lat, position.lng);
      
      if (this.actualMarker) {
        // 기존 마커 위치 변경
        this.actualMarker.setPosition(markerPosition);
      } else {
        // 새 마커 생성
        const markerImage = new kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
          new kakao.maps.Size(24, 35)
        );
        
        this.actualMarker = new kakao.maps.Marker({
          position: markerPosition,
          map: this.map,
          image: markerImage
        });
      }
      
      // 거리 계산 및 선 그리기
      this.calculateDistance();
      this.drawLine();
      
      // 정보창 표시
      this.showInfoWindow = true;
      
      // 플레이어 추측 위치가 있으면 거리 선 표시
      if (this.showDistanceLines && this.playerGuesses && this.playerGuesses.length > 0) {
        this.drawPlayerDistanceLines();
      }
    },
    
    calculateDistance() {
      if (!this.marker || !this.actualMarker) {
        this.distance = null;
        return;
      }
      
      // 마커 위치 가져오기
      const markerPos = this.marker.getPosition();
      const actualPos = this.actualMarker.getPosition();
      
      // 거리 계산 (Haversine 공식)
      const deg2rad = (deg) => deg * (Math.PI / 180);
      
      const R = 6371; // 지구 반경 (km)
      const dLat = deg2rad(actualPos.getLat() - markerPos.getLat());
      const dLon = deg2rad(actualPos.getLng() - markerPos.getLng());
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(markerPos.getLat())) * Math.cos(deg2rad(actualPos.getLat())) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      this.distance = R * c; // 킬로미터 단위 거리
    },
    
    drawLine() {
      if (!this.marker || !this.actualMarker) return;
      
      // 기존 선이 있으면 제거
      if (this.polyline) {
        this.polyline.setMap(null);
      }
      
      // 새 선 그리기
      const path = [
        this.marker.getPosition(),
        this.actualMarker.getPosition()
      ];
      
      this.polyline = new kakao.maps.Polyline({
        path: path,
        strokeWeight: 3,
        strokeColor: '#db4040',
        strokeOpacity: 0.7,
        strokeStyle: 'solid'
      });
      
      this.polyline.setMap(this.map);
    },
    
    fitMapToMarkers() {
      if (!this.marker || !this.actualPosition) return;
      
      // 지도 범위 조정 로직
      // 실제 구현에서는 카카오맵 API의 LatLngBounds 사용
    },
    
    zoomIn() {
      // 지도 확대
      // map.setLevel(map.getLevel() - 1);
    },
    
    zoomOut() {
      // 지도 축소
      // map.setLevel(map.getLevel() + 1);
    },
    
    resetMap() {
      // 지도 초기화
      // map.setCenter(new kakao.maps.LatLng(this.center.lat, this.center.lng));
      // map.setLevel(this.zoomLevel);
    },
    
    formatCoords(coords) {
      if (!coords) return '';
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    },
    
    formatDistance(distance) {
      if (distance === null) return '';
      
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      } else {
        return `${distance.toFixed(2)}km`;
      }
    },
    
    showPlayerGuesses(guesses) {
      if (!this.map || !guesses || !this.actualPosition) return;
      
      // 기존 마커와 선 제거
      this.clearPlayerMarkers();
      
      // 각 플레이어의 추측 위치에 마커 표시
      guesses.forEach(guess => {
        if (!guess.position) return; // 위치가 없는 경우 건너뛰기
        
        const position = new kakao.maps.LatLng(guess.position.lat, guess.position.lng);
        
        // 마커 이미지 생성
        const markerImage = new kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png',
          new kakao.maps.Size(36, 37),
          {
            offset: new kakao.maps.Point(13, 37),
            spriteSize: new kakao.maps.Size(36, 691),
            spriteOrigin: new kakao.maps.Point(0, 0)
          }
        );
        
        // 마커 생성
        const marker = new kakao.maps.Marker({
          position: position,
          map: this.map,
          title: guess.playerName,
          image: markerImage
        });
        
        // 마커에 표시할 인포윈도우 생성
        const infoContent = `<div style="padding:5px;font-size:12px;">${guess.playerName}</div>`;
        const infoWindow = new kakao.maps.InfoWindow({
          content: infoContent
        });
        
        // 마커 클릭 시 인포윈도우 표시
        kakao.maps.event.addListener(marker, 'click', () => {
          infoWindow.open(this.map, marker);
        });
        
        // 마커 저장
        this.playerMarkers.push({
          marker: marker,
          infoWindow: infoWindow,
          color: guess.color
        });
      });
      
      // 거리 선 표시
      if (this.showDistanceLines) {
        this.drawPlayerDistanceLines();
      }
      
      // 모든 마커가 보이도록 지도 범위 조정
      this.fitMapToAllMarkers();
    },
    
    drawPlayerDistanceLines() {
      if (!this.map || !this.actualMarker || this.playerMarkers.length === 0) return;
      
      // 기존 거리 선 제거
      this.clearDistanceLines();
      
      // 실제 위치
      const actualPosition = this.actualMarker.getPosition();
      
      // 각 플레이어 마커에서 실제 위치까지 선 그리기
      this.playerMarkers.forEach(item => {
        const path = [
          item.marker.getPosition(),
          actualPosition
        ];
        
        const line = new kakao.maps.Polyline({
          path: path,
          strokeWeight: 3,
          strokeColor: item.color || '#db4040',
          strokeOpacity: 0.7,
          strokeStyle: 'solid'
        });
        
        line.setMap(this.map);
        this.distanceLines.push(line);
      });
    },
    
    clearPlayerMarkers() {
      // 기존 플레이어 마커 제거
      this.playerMarkers.forEach(item => {
        item.marker.setMap(null);
        item.infoWindow.close();
      });
      
      this.playerMarkers = [];
      this.clearDistanceLines();
    },
    
    clearDistanceLines() {
      // 기존 거리 선 제거
      this.distanceLines.forEach(line => {
        line.setMap(null);
      });
      
      this.distanceLines = [];
    },
    
    fitMapToAllMarkers() {
      if (!this.map || (!this.marker && this.playerMarkers.length === 0)) return;
      
      // 모든 마커의 위치를 포함하는 경계 생성
      const bounds = new kakao.maps.LatLngBounds();
      
      // 사용자 마커 추가
      if (this.marker) {
        bounds.extend(this.marker.getPosition());
      }
      
      // 실제 위치 마커 추가
      if (this.actualMarker) {
        bounds.extend(this.actualMarker.getPosition());
      }
      
      // 플레이어 마커 추가
      this.playerMarkers.forEach(item => {
        bounds.extend(item.marker.getPosition());
      });
      
      // 지도 범위 설정
      this.map.setBounds(bounds);
    }
  }
};
</script>

<style scoped>
.kakao-map {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #e6e8eb;
}

#map-container {
  width: 100%;
  height: 100%;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading-spinner i {
  font-size: 2rem;
  color: #3396FF;
}

.loading-spinner p {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.marker-info {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-width: 300px;
  overflow: hidden;
}

.info-content {
  padding: 10px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.info-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.distance {
  background: #f0f2f5;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #444;
}

.info-body {
  font-size: 0.9rem;
}

.coords {
  font-family: monospace;
  margin: 5px 0;
  color: #666;
}

.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: white;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
}

.markers-container {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.marker-hint {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.9rem;
  padding: 8px 15px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .marker-info {
    bottom: 10px;
    min-width: 150px;
  }
  
  .info-header h3 {
    font-size: 0.9rem;
  }
  
  .distance {
    font-size: 0.7rem;
  }
  
  .control-btn {
    width: 32px;
    height: 32px;
  }
  
  .marker-hint {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
}
</style> 