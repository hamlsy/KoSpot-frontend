<template>
  <div class="road-view">
    <!-- road-reset-btn은 각 부모 컴포넌트에서 직접 구현 -->
    <div id="roadview-container" ref="roadviewContainer"></div>
    <!-- 임시로 제거 -->
    <!-- <div class="road-error" v-if="hasError && !suppressError">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="error-message">
        <h3>로드뷰를 불러올 수 없습니다</h3>
        <p>이 위치에 로드뷰 데이터가 없습니다.</p>
      </div>
    </div> -->
  </div>
</template>

<script>
export default {
  name: 'RoadView',

  // 부모 컴포넌트에서 resetToInitial 메서드를 호출할 수 있도록 expose
  expose: ['resetToInitial'],
  
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
      default: false
    },
    showCompass: {
      type: Boolean,
      default: false
    },
    preventMouseEvents: {
      type: Boolean,
      default: false
    },
    suppressError: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      roadview: null,
      viewpoint: null,
      isLoading: false,
      hasError: false,
      initialPosition: null,
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
    this.$nextTick(() => {
      // DOM이 업데이트된 후 로드뷰 초기화
      setTimeout(() => {
        this.initRoadview();
      }, 500);
    });
    
    if (this.preventMouseEvents) {
      this.disableMouseEvents();
    }
  },
  
  beforeUnmount() {
    // 이벤트 리스너 정리
    if (this.roadview && this.viewpointChangedListener && window.kakao && window.kakao.maps) {
      kakao.maps.event.removeListener(this.viewpointChangedListener);
    }
  },
  
  methods: {
    initRoadview() {
      console.log('로드뷰 초기화 시작', this.position);
      
      // position이 null인 경우 오류 처리
      if (!this.position || typeof this.position.lat === 'undefined' || typeof this.position.lng === 'undefined') {
        console.error('[RoadView] 유효한 위치 정보가 없습니다:', this.position);
        this.hasError = true;
        this.$emit('load-error', { position: this.position, error: 'Invalid position' });
        return;
      }
      
      // Kakao Maps Roadview API 사용하여 구현
      if (window.kakao && window.kakao.maps) {
        this.hasError = false;
        
        try {
          const container = this.$refs.roadviewContainer;
          if (!container) {
            console.error('[RoadView] 로드뷰 컨테이너를 찾을 수 없습니다.');
            this.hasError = true;
            this.$emit('load-error', { position: this.position, error: 'Container not found' });
            return;
          }
          
          this.roadview = new kakao.maps.Roadview(container);
          
          // 로드뷰 표시 위치 설정
          const position = new kakao.maps.LatLng(this.position.lat, this.position.lng);
          const roadviewClient = new kakao.maps.RoadviewClient();
          
          // 가장 가까운 로드뷰 파노라마 ID 로드 (최대 거리 100미터로 늘림)
          console.log('로드뷰 파노라마 ID 검색 중...');
          roadviewClient.getNearestPanoId(position, 100, (panoId) => {
            if (panoId === null) {
              console.error('[RoadView] 해당 위치에서 로드뷰를 찾을 수 없습니다:', this.position);
              console.log('[RoadView] load-error 이벤트 emit 시작 (suppressError:', this.suppressError, ')');
              this.hasError = true;
              
              // suppressError가 true여도 재발급 요청을 위해 이벤트는 emit해야 함
              // (에러 화면 표시만 막으면 됨)
              this.$emit('load-error', { position: this.position });
              console.log('[RoadView] load-error 이벤트 emit 완료');
              return;
            }
            
            console.log('로드뷰 파노라마 ID 찾음:', panoId);
            
            try {
              // 초기 좌표 저장 (최초 성공 시 1회만)
              if (!this.initialPosition && this.position && typeof this.position.lat === 'number' && typeof this.position.lng === 'number') {
                this.initialPosition = { lat: this.position.lat, lng: this.position.lng };
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
                console.log('로드뷰 초기화 완료');
                this.viewpoint = this.roadview.getViewpoint();
                this.compassHeading = this.viewpoint.pan;
                this.zoomLevel = 0;
                this.$emit('load-complete', { panoId: this.roadview.getPanoId() });
              });
              
              // 파노라마 변경 이벤트
              kakao.maps.event.addListener(this.roadview, 'panoid_changed', () => {
                this.$emit('pano-changed', { panoId: this.roadview.getPanoId() });
              });
            } catch (error) {
              console.error('[RoadView] 로드뷰 설정 중 오류 발생:', error);
              this.hasError = true;
              this.$emit('load-error', { position: this.position, error });
            }
          });
        } catch (error) {
          console.error('[RoadView] 로드뷰 초기화 중 오류 발생:', error);
          this.hasError = true;
          this.$emit('load-error', { position: this.position, error });
        }
      } else {
        console.error('[RoadView] Kakao Maps SDK가 로드되지 않았습니다.');
        this.hasError = true;
        this.$emit('load-error', { position: this.position, error: 'Kakao Maps SDK not loaded' });
      }
    },
    
    updateRoadview(newPosition) {
      console.log('로드뷰 위치 업데이트:', newPosition);
      if (!this.roadview) {
        console.error('로드뷰가 초기화되지 않았습니다.');
        this.initRoadview();
        return;
      }
      
      this.hasError = false;
      
      if (window.kakao && window.kakao.maps) {
        try {
          const position = new kakao.maps.LatLng(newPosition.lat, newPosition.lng);
          const roadviewClient = new kakao.maps.RoadviewClient();
          
          roadviewClient.getNearestPanoId(position, 100, (panoId) => {
            if (panoId === null) {
              console.error('[RoadView] 새 위치에서 로드뷰를 찾을 수 없습니다:', newPosition);
              this.hasError = true;
              this.$emit('load-error', { position: newPosition });
              return;
            }
            
            console.log('새 위치의 로드뷰 파노라마 ID 찾음:', panoId);
            this.roadview.setPanoId(panoId, position);
          });
        } catch (error) {
          console.error('[RoadView] 로드뷰 위치 업데이트 중 오류 발생:', error);
          this.hasError = true;
          this.$emit('load-error', { position: newPosition, error });
        }
      } else {
        console.error('[RoadView] Kakao Maps SDK가 로드되지 않았습니다.');
        this.hasError = true;
        this.$emit('load-error', { position: newPosition, error: 'Kakao Maps SDK not loaded' });
      }
    },
    
    resetToInitial() {
      if (!this.initialPosition) {
        return;
      }
      this.hasError = false;
      if (!this.roadview) {
        // 로드뷰가 없으면 초기화 시도 후 업데이트
        this.initRoadview();
        // initRoadview가 비동기이므로 잠시 대기 후 업데이트 시도
        setTimeout(() => {
          this.updateRoadview(this.initialPosition);
        }, 200);
        return;
      }
      this.updateRoadview(this.initialPosition);
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

/* road-reset-btn 스타일은 각 부모 컴포넌트에서 구현 */
</style> 