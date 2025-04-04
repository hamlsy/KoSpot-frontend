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
      distance: null
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
    }
  },
  
  mounted() {
    this.initMap();
  },
  
  beforeDestroy() {
    // 리소스 정리
    // 실제 구현에서는 이벤트 리스너 정리 등의 작업 수행
  },
  
  methods: {
    initMap() {
      // Kakao Maps API 사용하여 구현
      // 실제 구현에서는 아래 주석 부분을 구현
      
    
      if (window.kakao && window.kakao.maps) {
        const container = this.$refs.mapContainer;
        const options = {
          center: new kakao.maps.LatLng(this.center.lat, this.center.lng),
          level: this.zoomLevel
        };
        
        this.map = new kakao.maps.Map(container, options);
        
        // 마커 위치가 이미 있으면 설정
        if (this.markerPosition) {
          this.setMarker(this.markerPosition);
        }
        
        // 실제 위치가 이미 있으면 표시
        if (this.actualPosition) {
          this.showActualPosition(this.actualPosition);
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
            this.$emit('marker-placed', position);
          });
        }
        
        this.isLoading = false;
      } else {
        console.error('Kakao Maps SDK가 로드되지 않았습니다.');
        this.isLoading = false;
      }
      
      
      // 목업 데이터로 대체 (데모 목적)
      setTimeout(() => {
        this.isLoading = false;
        
        // 마커 위치가 이미 있으면 설정
        if (this.markerPosition) {
          this.setMarker(this.markerPosition);
        }
        
        // 실제 위치가 이미 있으면 표시
        if (this.actualPosition) {
          this.showActualPosition(this.actualPosition);
        }
        
        // 개발 환경에서 클릭 이벤트 시뮬레이션
        if (!this.preventInteraction) {
          const mapContainer = this.$refs.mapContainer;
          mapContainer.addEventListener('click', (e) => {
            // 클릭 위치에서 가상의 좌표 생성 (실제 구현에서는 실제 지도 좌표 사용)
            const rect = mapContainer.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            
            // 임시로 클릭한 위치를 기반으로 가상의 좌표 생성
            const position = {
              lat: this.center.lat + (offsetY - rect.height/2) / 1000 * -1,
              lng: this.center.lng + (offsetX - rect.width/2) / 1000
            };
            
            this.setMarker(position);
            this.$emit('marker-placed', position);
          });
        }
      }, 1000);
    },
    
    setMarker(position) {
      this.marker = position;
      
      // 실제 위치가 있으면 거리 계산
      if (this.actualPosition) {
        this.calculateDistance();
        this.drawLine();
      }
    },
    
    showActualPosition(position) {
      this.actualMarker = position;
      this.showInfoWindow = true;
      
      // 마커가 있으면 거리 계산
      if (this.marker) {
        this.calculateDistance();
        this.drawLine();
      }
      
      // 두 위치가 모두 보이도록 지도 범위 조정
      this.fitMapToMarkers();
    },
    
    calculateDistance() {
      if (!this.marker || !this.actualPosition) return;
      
      // 실제로는 하버사인 공식을 사용하여 계산
      // 현재는 간단한 유클리드 거리 계산으로 대체
      const dx = this.marker.lat - this.actualPosition.lat;
      const dy = this.marker.lng - this.actualPosition.lng;
      
      // 대략적인 km 변환 (실제 구현에서는 더 정확한 계산 사용)
      this.distance = Math.sqrt(dx * dx + dy * dy) * 111;
    },
    
    drawLine() {
      if (!this.marker || !this.actualPosition) return;
      
      // 선 그리기 로직
      // 실제 구현에서는 카카오맵 API의 Polyline 사용
      this.polyline = {
        positions: [this.marker, this.actualPosition]
      };
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