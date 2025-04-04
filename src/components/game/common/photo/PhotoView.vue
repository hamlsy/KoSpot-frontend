<template>
  <div class="photo-view">
    <div class="photo-container" ref="photoContainer">
      <img 
        :src="photoUrl" 
        :class="{ 'zoomed': isZoomed }" 
        @click="toggleZoom"
        @load="onImageLoaded"
        @error="onImageError"
        alt="위치 사진"
        ref="photoImage"
      />
      
      <div class="photo-overlay" v-if="isZoomed" @click="toggleZoom"></div>
    </div>
    
    <div class="controls" v-if="showControls && !preventInteraction">
      <div class="zoom-controls">
        <button 
          class="zoom-btn" 
          @click="toggleZoom" 
          :title="isZoomed ? '축소' : '확대'"
        >
          <i :class="isZoomed ? 'fas fa-search-minus' : 'fas fa-search-plus'"></i>
        </button>
      </div>
    </div>
    
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>사진 로딩 중...</p>
      </div>
    </div>
    
    <div class="error-overlay" v-if="hasError">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>이미지를 불러올 수 없습니다</h3>
        <p>{{ errorMessage }}</p>
      </div>
    </div>
    
    <div class="photo-info" v-if="showInfo && photoInfo">
      <div class="info-header">
        <h3>{{ photoInfo.title || '사진 정보' }}</h3>
        <span class="info-date" v-if="photoInfo.date">{{ photoInfo.date }}</span>
      </div>
      <p class="info-description" v-if="photoInfo.description">
        {{ photoInfo.description }}
      </p>
      <div class="info-source" v-if="photoInfo.source">
        출처: {{ photoInfo.source }}
      </div>
    </div>
    
    <div class="hint-overlay" v-if="!isZoomed && !isLoading && !hasError && showHint">
      <div class="hint-message">
        <i class="fas fa-search"></i>
        <span>클릭하여 확대</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhotoView',
  
  props: {
    photoUrl: {
      type: String,
      required: true
    },
    photoInfo: {
      type: Object,
      default: null
    },
    showControls: {
      type: Boolean,
      default: true
    },
    showInfo: {
      type: Boolean,
      default: true
    },
    preventInteraction: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      isLoading: true,
      hasError: false,
      errorMessage: '',
      isZoomed: false,
      showHint: true,
      zoomLevel: 1,
      initialLoad: true
    };
  },
  
  watch: {
    photoUrl() {
      this.resetView();
      this.loadImage();
    }
  },
  
  mounted() {
    this.loadImage();
    
    // 힌트를 5초 후에 숨김
    setTimeout(() => {
      this.showHint = false;
    }, 5000);
  },
  
  methods: {
    loadImage() {
      this.isLoading = true;
      this.hasError = false;
      
      // 실제 구현에서는 이미지가 로드되면 로딩 상태 변경됨
      // onImageLoaded와 onImageError에서 처리
      
      // 데모 목적으로 타이머 설정
      if (this.initialLoad) {
        setTimeout(() => {
          if (!this.hasError) {
            this.isLoading = false;
          }
          this.initialLoad = false;
        }, 1500);
      }
    },
    
    onImageLoaded() {
      this.isLoading = false;
      this.hasError = false;
      this.$emit('load-complete', { success: true });
    },
    
    onImageError() {
      this.isLoading = false;
      this.hasError = true;
      this.errorMessage = '이미지를 불러오는 중 오류가 발생했습니다.';
      this.$emit('load-complete', { success: false, error: this.errorMessage });
    },
    
    toggleZoom() {
      if (this.preventInteraction) return;
      
      this.isZoomed = !this.isZoomed;
      this.showHint = false;
      
      if (this.isZoomed) {
        document.body.style.overflow = 'hidden';
        this.enableImageDrag();
      } else {
        document.body.style.overflow = '';
        this.disableImageDrag();
        this.resetImagePosition();
      }
    },
    
    enableImageDrag() {
      const image = this.$refs.photoImage;
      if (!image) return;
      
      // 이미지 드래그 기능 구현
      // 실제 구현에서는 마우스/터치 이벤트를 사용하여 이미지 드래그 기능 추가
    },
    
    disableImageDrag() {
      // 이미지 드래그 기능 해제
    },
    
    resetImagePosition() {
      const image = this.$refs.photoImage;
      if (!image) return;
      
      // 이미지 위치 초기화
      image.style.transform = '';
    },
    
    resetView() {
      this.isZoomed = false;
      this.showHint = true;
      this.resetImagePosition();
      document.body.style.overflow = '';
    }
  }
};
</script>

<style scoped>
.photo-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #000;
}

.photo-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.photo-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
  cursor: zoom-in;
}

.photo-container img.zoomed {
  cursor: grab;
  transform: scale(2);
  max-width: none;
  max-height: none;
}

.photo-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  cursor: zoom-out;
}

.controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
}

.zoom-controls {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 6px;
}

.zoom-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.zoom-btn:hover {
  transform: scale(1.1);
}

.loading-overlay, .error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.loading-spinner, .error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 80%;
}

.loading-spinner i, .error-message i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.error-message i {
  color: #f44336;
}

.loading-spinner p, .error-message p {
  margin: 0.5rem 0 0 0;
  font-size: 1rem;
}

.error-message h3 {
  margin: 0;
  font-size: 1.2rem;
}

.photo-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  color: white;
  padding: 20px;
  z-index: 5;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.info-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.info-date {
  font-size: 0.9rem;
  opacity: 0.8;
}

.info-description {
  margin: 8px 0;
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0.9;
}

.info-source {
  font-size: 0.8rem;
  opacity: 0.7;
  font-style: italic;
}

.hint-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  pointer-events: none;
}

.hint-message {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  animation: fadeInOut 2s ease infinite;
}

@keyframes fadeInOut {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}

@media (max-width: 768px) {
  .controls {
    bottom: 10px;
    right: 10px;
  }
  
  .zoom-btn {
    width: 36px;
    height: 36px;
  }
  
  .photo-info {
    padding: 15px;
  }
  
  .info-header h3 {
    font-size: 1rem;
  }
  
  .info-description {
    font-size: 0.8rem;
  }
}
</style> 