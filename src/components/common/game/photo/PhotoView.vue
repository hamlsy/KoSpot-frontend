<template>
  <div class="photo-view" :class="{ 'prevent-interaction': preventInteraction }">
    <div class="photo-wrapper">
      <img 
        v-if="photoUrl" 
        :src="photoUrl" 
        alt="위치 사진"
        class="photo-image"
        :class="{ 'loading': isLoading }"
        @load="handleImageLoaded"
      >
      <div v-else class="placeholder">
        <i class="fas fa-image placeholder-icon"></i>
        <p>사진이 로드되지 않았습니다</p>
      </div>
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>사진 로딩 중...</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhotoView',
  
  props: {
    // 사진 URL
    photoUrl: {
      type: String,
      required: true
    },
    
    // 상호작용 막기 (라운드 종료 등의 상황에서)
    preventInteraction: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      isLoading: true,
      isFullscreen: false,
      zoomLevel: 1,
      minZoomLevel: 0.8,
      maxZoomLevel: 3,
      zoomStep: 0.2
    };
  },
  
  watch: {
    photoUrl() {
      this.isLoading = true;
      this.zoomLevel = 1;
    }
  },
  
  mounted() {
    // 풀스크린 이벤트 리스너 추가
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);
  },
  
  beforeUnmount() {
    // 이벤트 리스너 정리
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
  },
  
  methods: {
    handleImageLoaded() {
      this.isLoading = false;
    },
    
    zoomIn() {
      if (this.zoomLevel < this.maxZoomLevel && !this.preventInteraction) {
        this.zoomLevel = Math.min(this.maxZoomLevel, this.zoomLevel + this.zoomStep);
      }
    },
    
    zoomOut() {
      if (this.zoomLevel > this.minZoomLevel && !this.preventInteraction) {
        this.zoomLevel = Math.max(this.minZoomLevel, this.zoomLevel - this.zoomStep);
      }
    },
    
    toggleFullscreen() {
      if (this.preventInteraction) return;
      
      const el = this.$el;
      
      if (!this.isFullscreen) {
        // 풀스크린 모드 진입
        if (el.requestFullscreen) {
          el.requestFullscreen();
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        }
      } else {
        // 풀스크린 모드 종료
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    },
    
    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement ||
                          !!document.mozFullScreenElement ||
                          !!document.webkitFullscreenElement ||
                          !!document.msFullscreenElement;
    }
  }
};
</script>

<style scoped>
.photo-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #0f0f1a;
}

.photo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.photo-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform-origin: center;
  transition: all 0.3s ease;
  transform: scale(v-bind(zoomLevel));
  opacity: 0;
  animation: fadeIn 0.5s forwards;
}

.photo-image.loading {
  opacity: 0.3;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #555;
  height: 100%;
  width: 100%;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #333;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.loading-spinner i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #7f5af0;
}

.controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
  z-index: 5;
}

.zoom-button,
.fullscreen-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-button:hover:not(:disabled),
.fullscreen-button:hover:not(:disabled) {
  background-color: rgba(60, 60, 100, 0.8);
  transform: translateY(-2px);
}

.zoom-button:disabled,
.fullscreen-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prevent-interaction {
  pointer-events: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .controls {
    bottom: 5px;
    right: 5px;
    gap: 5px;
  }
  
  .zoom-button,
  .fullscreen-button {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
}
</style> 