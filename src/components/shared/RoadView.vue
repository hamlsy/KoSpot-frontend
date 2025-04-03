<template>
  <div class="road-view">
    <div id="roadview-container" ref="roadviewContainer"></div>
    
    <div class="controls" v-if="showControls">
      <div class="zoom-controls">
        <button class="zoom-btn zoom-in" @click="zoomIn" title="줌 인">
          <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-btn zoom-out" @click="zoomOut" title="줌 아웃">
          <i class="fas fa-minus"></i>
        </button>
      </div>
      
      <div class="direction-controls">
        <button class="dir-btn dir-up" @click="panUp" title="위로">
          <i class="fas fa-arrow-up"></i>
        </button>
        <div class="mid-controls">
          <button class="dir-btn dir-left" @click="panLeft" title="왼쪽으로">
            <i class="fas fa-arrow-left"></i>
          </button>
          <button class="dir-btn dir-reset" @click="resetView" title="뷰 초기화">
            <i class="fas fa-crosshairs"></i>
          </button>
          <button class="dir-btn dir-right" @click="panRight" title="오른쪽으로">
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
        <button class="dir-btn dir-down" @click="panDown" title="아래로">
          <i class="fas fa-arrow-down"></i>
        </button>
      </div>
    </div>
    
    <div class="compass" v-if="showCompass">
      <div 
        class="compass-needle" 
        :style="{ transform: `rotate(${compassHeading}deg)` }"
      ></div>
      <div class="compass-direction">{{ compassDirection }}</div>
    </div>
    
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>로드뷰 로딩 중...</p>
      </div>
    </div>
    
    <div class="road-error" v-if="hasError">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="error-message">
        <h3>로드뷰를 불러올 수 없습니다</h3>
        <p>이 위치에 로드뷰 데이터가 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoadView',
  
  props: {
    position: {
      type: Object,
      required: true,
      validator: prop => Object.prototype.hasOwnProperty.call(prop, 'lat') && Object.prototype.hasOwnProperty.call(prop, 'lng')
    },
    panoId: {
      type: String,
      default: null
    },
    showControls: {
      type: Boolean,
      default: true
    },
    showCompass: {
      type: Boolean,
      default: true
    },
    preventMouseEvents: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      roadview: null,
      viewpoint: null,
      isLoading: true,
      hasError: false,
      compassHeading: 0,
      panAmount: 30, // 이동 단위 (도)
      zoomLevel: 0
    };
  },
  
  computed: {
    compassDirection() {
      const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서', '북'];
      const index = Math.round((this.compassHeading % 360) / 45);
      return directions[index % 8];
    }
  },
  
  watch: {
    position(newPosition) {
      this.updateRoadview(newPosition);
    },
    
    panoId(newPanoId) {
      if (newPanoId && this.roadview) {
        this.isLoading = true;
        this.hasError = false;
        this.roadview.setPanoId(newPanoId);
      }
    }
  },
  
  mounted() {
    this.initRoadview();
    
    if (this.preventMouseEvents) {
      this.disableMouseEvents();
    }
  },
  
  beforeDestroy() {
    // 이벤트 리스너 정리
    if (this.roadview) {
      // window.kakao.maps.event.removeListener(this.viewpointChangedListener);
    }
  },
  
  methods: {
    initRoadview() {
      // Kakao Maps Roadview API 사용하여 구현
      // 실제 구현에서는 아래 주석 부분을 구현
      
      /*
      if (window.kakao && window.kakao.maps) {
        this.isLoading = true;
        this.hasError = false;
        
        const container = this.$refs.roadviewContainer;
        this.roadview = new kakao.maps.Roadview(container);
        
        // 로드뷰 표시 위치 설정
        const position = new kakao.maps.LatLng(this.position.lat, this.position.lng);
        const roadviewClient = new kakao.maps.RoadviewClient();
        
        // 가장 가까운 로드뷰 파노라마 ID 로드
        roadviewClient.getNearestPanoId(position, 50, (panoId) => {
          if (panoId === null) {
            this.isLoading = false;
            this.hasError = true;
            this.$emit('load-error');
            return;
          }
          
          // 로드뷰 표시
          this.roadview.setPanoId(panoId, position);
          
          // 로드뷰 초기 로드 이벤트
          this.viewpointChangedListener = kakao.maps.event.addListener(this.roadview, 'viewpoint_changed', () => {
            this.viewpoint = this.roadview.getViewpoint();
            this.compassHeading = this.viewpoint.pan;
          });
          
          // 로드뷰 로드 완료 이벤트
          kakao.maps.event.addListener(this.roadview, 'init', () => {
            this.isLoading = false;
            this.viewpoint = this.roadview.getViewpoint();
            this.compassHeading = this.viewpoint.pan;
            this.zoomLevel = 0;
            this.$emit('load-complete', { panoId: this.roadview.getPanoId() });
          });
          
          // 파노라마 변경 이벤트
          kakao.maps.event.addListener(this.roadview, 'panoid_changed', () => {
            this.$emit('pano-changed', { panoId: this.roadview.getPanoId() });
          });
        });
      } else {
        console.error('Kakao Maps SDK가 로드되지 않았습니다.');
        this.isLoading = false;
        this.hasError = true;
        this.$emit('load-error');
      }
      */
      
      // 목업 데이터로 대체 (데모 목적)
      setTimeout(() => {
        this.isLoading = false;
        this.compassHeading = 45; // 임의의 방향
        this.$emit('load-complete', { panoId: 'demo123' });
      }, 1500);
    },
    
    updateRoadview(newPosition) {
      if (!this.roadview) return;
      
      this.isLoading = true;
      this.hasError = false;
      
      /*
      const position = new kakao.maps.LatLng(newPosition.lat, newPosition.lng);
      const roadviewClient = new kakao.maps.RoadviewClient();
      
      roadviewClient.getNearestPanoId(position, 50, (panoId) => {
        if (panoId === null) {
          this.isLoading = false;
          this.hasError = true;
          this.$emit('load-error');
          return;
        }
        
        this.roadview.setPanoId(panoId, position);
      });
      */
      
      // 목업 데이터로 대체 (데모 목적)
      console.log(`새 위치로 로드뷰 업데이트: ${newPosition.lat}, ${newPosition.lng}`);
      setTimeout(() => {
        this.isLoading = false;
        this.compassHeading = Math.random() * 360; // 임의의 방향
        this.$emit('load-complete', { panoId: 'demo' + Date.now() });
      }, 1500);
    },
    
    panLeft() {
      if (!this.roadview || !this.viewpoint) return;
      
      /*
      const newPan = (this.viewpoint.pan - this.panAmount) % 360;
      this.roadview.setViewpoint({
        pan: newPan,
        tilt: this.viewpoint.tilt,
        zoom: this.viewpoint.zoom
      });
      */
      
      // 목업 동작 (데모 목적)
      this.compassHeading = (this.compassHeading - this.panAmount) % 360;
      if (this.compassHeading < 0) this.compassHeading += 360;
    },
    
    panRight() {
      if (!this.roadview || !this.viewpoint) return;
      
      /*
      const newPan = (this.viewpoint.pan + this.panAmount) % 360;
      this.roadview.setViewpoint({
        pan: newPan,
        tilt: this.viewpoint.tilt,
        zoom: this.viewpoint.zoom
      });
      */
      
      // 목업 동작 (데모 목적)
      this.compassHeading = (this.compassHeading + this.panAmount) % 360;
    },
    
    panUp() {
      if (!this.roadview || !this.viewpoint) return;
      
      /*
      // 최대 위 90도까지만 올라가도록 제한 (머리 위)
      const newTilt = Math.max(this.viewpoint.tilt - this.panAmount, -90);
      this.roadview.setViewpoint({
        pan: this.viewpoint.pan,
        tilt: newTilt,
        zoom: this.viewpoint.zoom
      });
      */
    },
    
    panDown() {
      if (!this.roadview || !this.viewpoint) return;
      
      /*
      // 최대 아래 90도까지만 내려가도록 제한 (발 밑)
      const newTilt = Math.min(this.viewpoint.tilt + this.panAmount, 90);
      this.roadview.setViewpoint({
        pan: this.viewpoint.pan,
        tilt: newTilt,
        zoom: this.viewpoint.zoom
      });
      */
    },
    
    zoomIn() {
      if (!this.roadview || !this.viewpoint || this.zoomLevel >= 3) return;
      
      this.zoomLevel++;
      
      /*
      this.roadview.setViewpoint({
        pan: this.viewpoint.pan,
        tilt: this.viewpoint.tilt,
        zoom: this.viewpoint.zoom + 1
      });
      */
    },
    
    zoomOut() {
      if (!this.roadview || !this.viewpoint || this.zoomLevel <= -3) return;
      
      this.zoomLevel--;
      
      /*
      this.roadview.setViewpoint({
        pan: this.viewpoint.pan,
        tilt: this.viewpoint.tilt,
        zoom: this.viewpoint.zoom - 1
      });
      */
    },
    
    resetView() {
      if (!this.roadview) return;
      
      /*
      this.roadview.setViewpoint({
        pan: 0,
        tilt: 0,
        zoom: 0
      });
      */
      
      // 목업 동작 (데모 목적)
      this.compassHeading = 0;
      this.zoomLevel = 0;
    },
    
    disableMouseEvents() {
      const container = this.$refs.roadviewContainer;
      if (container) {
        const style = document.createElement('style');
        style.innerHTML = `
          #${container.id} * {
            pointer-events: none !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }
};
</script>

<style scoped>
.road-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f0f2f5;
}

#roadview-container {
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zoom-controls, .direction-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.direction-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.mid-controls {
  display: flex;
  gap: 5px;
}

.zoom-btn, .dir-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 4px;
  background: white;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.zoom-btn:hover, .dir-btn:hover {
  background: #f0f2f5;
  transform: translateY(-2px);
}

.zoom-btn:active, .dir-btn:active {
  background: #e0e0e0;
  transform: translateY(0);
}

.compass {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.compass-needle {
  width: 40px;
  height: 40px;
  background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L8 12 12 15 16 12z" fill="red"/><path d="M12 15L8 12 12 22 16 12z" fill="gray"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  transition: transform 0.3s ease;
}

.compass-direction {
  font-size: 0.8rem;
  margin-top: 4px;
  font-weight: 600;
  color: #333;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
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
  color: #4285F4;
}

.loading-spinner p {
  font-size: 1rem;
  color: #333;
}

.road-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.error-icon {
  font-size: 3rem;
  color: #f44336;
  margin-bottom: 1rem;
}

.error-message {
  text-align: center;
}

.error-message h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.error-message p {
  margin: 0;
  color: #666;
}

@media (max-width: 768px) {
  .controls {
    bottom: 10px;
    right: 10px;
  }
  
  .zoom-btn, .dir-btn {
    width: 36px;
    height: 36px;
  }
  
  .compass {
    top: 10px;
    right: 10px;
    width: 60px;
    height: 60px;
  }
  
  .compass-needle {
    width: 30px;
    height: 30px;
  }
}
</style> 