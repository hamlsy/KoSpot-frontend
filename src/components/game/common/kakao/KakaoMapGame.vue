<template>
  <div class="kakao-map-game" :class="{ 'map-open': isOpen }">
    <div id="map-container" ref="mapContainer"></div>
    
    <div v-if="!disabled && showDistance" class="distance-info" v-show="distance !== null">
      <span class="distance-value">{{ formattedDistance }}</span>
      <span class="distance-label">현재 거리</span>
    </div>
    
    <button 
      v-if="!disabled && actionButtonText && showActionButton" 
      class="action-button"
      @click="submitAnswer"
      :disabled="!hasMarker"
    >
      {{ actionButtonText }}
    </button>
    
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>지도 로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KakaoMapGame',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    centerLocation: {
      type: Object,
      default: () => ({
        lat: 36.480401, 
        lng: 127.574667 // 한국 중심점
      })
    },
    actualLocation: {
      type: Object,
      default: null
    },
    zoomLevel: {
      type: Number,
      default: 13
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showHintCircles: {
      type: Boolean,
      default: true
    },
    showCloseButton: {
      type: Boolean,
      default: true
    },
    actionButtonText: {
      type: String,
      default: ''
    },
    showDistance: {
      type: Boolean,
      default: true
    },
    showActionButton: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      map: null,
      marker: null,
      clickListener: null,
      circles: [],
      showHints: false,
      distance: null,
      isLoading: true,
      isInitialized: false,
      markerImage: null,
      hasMarker: false
    };
  },
  
  computed: {
    formattedDistance() {
      if (this.distance === null) return '';
      
      // 1km 미만이면 m 단위로 표시
      if (this.distance < 1) {
        return `${Math.round(this.distance * 1000)}m`;
      }
      
      // 1km 이상이면 소수점 1자리까지 표시
      return `${this.distance.toFixed(1)}km`;
    }
  },
  
  watch: {
    isOpen(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          if (!this.isInitialized) {
            this.initMap();
          } else {
            // 이미 초기화되어 있는 경우 지도 크기 재조정만 수행
            this.resizeMap();
          }
        });
      }
    },
    
    actualLocation(newLocation) {
      if (newLocation && this.marker && this.map) {
        this.calculateDistance();
      }
    }
  },
  
  mounted() {
    if (this.isOpen) {
      this.initMap();
    }
  },
  
  beforeDestroy() {
    this.removeClickListener();
    this.removeMarker();
    this.removeCircles();
  },
  
  methods: {
    initMap() {
      // 이미 초기화되어 있는 경우 리턴
      if (this.isInitialized && this.map) {
        this.resizeMap();
        return;
      }
      
      this.isLoading = true;
      
      if (window.kakao && window.kakao.maps) {
        const container = this.$refs.mapContainer;
        const options = {
          center: new kakao.maps.LatLng(
            this.centerLocation.lat, 
            this.centerLocation.lng
          ),
          level: this.zoomLevel
        };
        
        this.map = new kakao.maps.Map(container, options);
        
        // 마커 이미지 설정
        const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
        const imageSize = new kakao.maps.Size(24, 35);
        const imageOption = { offset: new kakao.maps.Point(12, 35) };
        this.markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
        
        if (!this.disabled) {
          // 클릭 이벤트 등록
          this.addClickListener();
        }
        
        // 힌트 원 생성
        if (this.showHintCircles && this.actualLocation) {
          this.createHintCircles();
        }
        
        this.isLoading = false;
        this.isInitialized = true;
        
        // 지도 로드 완료 이벤트 발생
        this.$emit('map-loaded');
      } else {
        console.error('Kakao Maps API가 로드되지 않았습니다.');
        this.isLoading = false;
      }
    },
    
    resizeMap() {
      if (this.map) {
        // 지도 크기가 변경되었을 때 호출
        setTimeout(() => {
          this.map.relayout();
          
          // 센터 위치 재설정
          this.map.setCenter(new kakao.maps.LatLng(
            this.centerLocation.lat, 
            this.centerLocation.lng
          ));
          
          this.isLoading = false;
        }, 100);
      }
    },
    
    addClickListener() {
      if (!this.map) return;
      
      // 기존 리스너 제거
      this.removeClickListener();
      
      // 새 리스너 추가
      this.clickListener = kakao.maps.event.addListener(this.map, 'click', (mouseEvent) => {
        // 비활성화 상태에서는 마커 설정 불가
        if (this.disabled) return;
        
        // 기존 마커 제거
        this.removeMarker();
        
        // 클릭한 위치에 마커 생성
        const latlng = mouseEvent.latLng;
        this.marker = new kakao.maps.Marker({
          position: latlng,
          map: this.map
        });
        
        this.hasMarker = true;
        
        // 거리 계산
        this.calculateDistance();
        
        // 클릭 이벤트 발생
        this.$emit('map-clicked', {
          lat: latlng.getLat(),
          lng: latlng.getLng()
        });
      });
    },
    
    removeClickListener() {
      if (this.clickListener) {
        kakao.maps.event.removeListener(this.clickListener);
        this.clickListener = null;
      }
    },
    
    removeMarker() {
      if (this.marker) {
        this.marker.setMap(null);
        this.marker = null;
        this.hasMarker = false;
        this.distance = null;
      }
    },
    
    createHintCircles() {
      if (!this.map || !this.actualLocation) return;
      
      // 기존 원 제거
      this.removeCircles();
      
      // 정확한 위치에서 원 생성
      const position = new kakao.maps.LatLng(
        this.actualLocation.lat,
        this.actualLocation.lng
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
          map: this.showHints ? this.map : null // 힌트가 켜져 있을 때만 표시
        });
        
        this.circles.push(circle);
      });
    },
    
    removeCircles() {
      this.circles.forEach(circle => {
        circle.setMap(null);
      });
      this.circles = [];
    },
    
    toggleHints() {
      this.showHints = !this.showHints;
      
      // 힌트 원 표시/숨김
      this.circles.forEach(circle => {
        circle.setMap(this.showHints ? this.map : null);
      });
    },
    
    calculateDistance() {
      if (!this.marker || !this.actualLocation || !this.map) return;
      
      const markerPosition = this.marker.getPosition();
      
      // Haversine 공식을 사용한 거리 계산
      this.distance = this.getDistance(
        markerPosition.getLat(), markerPosition.getLng(),
        this.actualLocation.lat, this.actualLocation.lng
      );
    },
    
    getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // 킬로미터 단위
    },
    
    deg2rad(deg) {
      return deg * (Math.PI/180);
    },
    
    zoomIn() {
      if (this.map) {
        this.map.setLevel(this.map.getLevel() - 1);
      }
    },
    
    zoomOut() {
      if (this.map) {
        this.map.setLevel(this.map.getLevel() + 1);
      }
    },
    
    resetZoom() {
      if (this.map) {
        this.map.setLevel(this.zoomLevel);
        this.map.setCenter(new kakao.maps.LatLng(
          this.centerLocation.lat, 
          this.centerLocation.lng
        ));
      }
    },
    
    closeMap() {
      this.$emit('close');
    },
    
    submitAnswer() {
      if (!this.marker || !this.map) return;
      
      const position = this.marker.getPosition();
      this.$emit('check-answer', {
        lat: position.getLat(),
        lng: position.getLng()
      });
    },
    
    // 마커 위치 반환하는 메서드 추가
    getMarkerPosition() {
      return new Promise((resolve, reject) => {
        if (!this.marker || !this.map) {
          reject('마커가 설정되지 않았습니다.');
          return;
        }
        
        const position = this.marker.getPosition();
        resolve({
          lat: position.getLat(),
          lng: position.getLng()
        });
      });
    }
  }
};
</script>

<style scoped>
.kakao-map-game {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background: white;
  z-index: 1000;
  display: none;
  flex-direction: column;
}

.kakao-map-game.map-open {
  display: flex;
}

#map-container {
  width: 100%;
  flex: 1;
  background: #f0f2f5;
}

.map-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.close-map {
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 1.2rem;
  color: #333;
  transition: all 0.2s ease;
  align-self: flex-end;
}

.close-map:hover {
  transform: scale(1.1);
}

.zoom-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: white;
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.zoom-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  transition: all 0.2s ease;
}

.zoom-btn:hover {
  background: #f5f5f5;
}

.hint-toggle {
  position: absolute;
  bottom: 100px;
  right: 20px;
  z-index: 10;
}

.hint-btn {
  background: white;
  border: none;
  padding: 10px 15px;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.hint-btn.active {
  background: #4285F4;
  color: white;
}

.hint-btn:hover {
  transform: translateY(-2px);
}

.distance-info {
  position: absolute;
  bottom: 160px;
  right: 20px;
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
}

.distance-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
}

.distance-label {
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

.action-button {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  z-index: 10;
}

.action-button:hover:not(:disabled) {
  transform: translateX(-50%) translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.action-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
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
  font-size: 2.5rem;
  color: #3498db;
}

.loading-spinner p {
  font-size: 1rem;
  color: #333;
}

@media (max-width: 768px) {
  .map-controls {
    top: 10px;
    right: 10px;
  }
  
  .close-map, .zoom-btn {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  
  .hint-toggle, .distance-info {
    right: 10px;
  }
  
  .hint-toggle {
    bottom: 80px;
  }
  
  .distance-info {
    bottom: 130px;
  }
  
  .hint-btn, .action-button {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .action-button {
    bottom: 20px;
  }
}
</style> 