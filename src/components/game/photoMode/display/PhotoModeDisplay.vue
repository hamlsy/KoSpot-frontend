<template>
  <div class="photo-display" :class="{ 'loading': loading, 'filtered': applyFilter }">
    <div v-if="loading" class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    
    <div v-show="isLoaded" class="image-container" :style="{ transform: `scale(${zoomLevel})` }">
      <img 
        :src="photoUrl"
        alt="게임 이미지"
        class="photo-image"
        @load="handleImageLoaded"
      />
    </div>
    
    <div v-if="showZoomControls && isLoaded" class="zoom-controls">
      <button 
        class="zoom-button zoom-out"
        :disabled="zoomLevel <= 1"
        @click="zoomOut"
        title="축소"
      >
        <i class="fas fa-search-minus"></i>
      </button>
      <button
        class="zoom-button zoom-in"
        :disabled="zoomLevel >= 2"
        @click="zoomIn"
        title="확대"
      >
        <i class="fas fa-search-plus"></i>
      </button>
      <button
        class="zoom-button zoom-reset"
        :disabled="zoomLevel === 1"
        @click="resetZoom"
        title="원래 크기로"
      >
        <i class="fas fa-compress-arrows-alt"></i>
      </button>
    </div>
    
    <div v-if="showDescription && isLoaded && (title || description)" class="photo-info">
      <h3 v-if="title" class="photo-title">{{ title }}</h3>
      <p v-if="description" class="photo-description">{{ description }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhotoDisplay',
  
  props: {
    photoUrl: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    showDescription: {
      type: Boolean,
      default: false
    },
    showZoomControls: {
      type: Boolean,
      default: false
    },
    applyFilter: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      loading: true,
      isLoaded: false,
      zoomLevel: 1
    };
  },
  
  watch: {
    photoUrl() {
      // 새 이미지로 변경되면 로딩 상태 재설정
      this.loading = true;
      this.isLoaded = false;
      this.resetZoom();
    }
  },
  
  methods: {
    handleImageLoaded() {
      this.loading = false;
      this.isLoaded = true;
      this.$emit('loaded');
    },
    
    zoomIn() {
      if (this.zoomLevel < 2) {
        this.zoomLevel += 0.25;
      }
    },
    
    zoomOut() {
      if (this.zoomLevel > 1) {
        this.zoomLevel -= 0.25;
      }
    },
    
    resetZoom() {
      this.zoomLevel = 1;
    }
  }
};
</script>

<style scoped>
.photo-display {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #f8fafc;
  border-radius: 12px;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2.5rem;
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  overflow: hidden;
}

.photo-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: opacity 0.3s ease;
}

.loading .photo-image {
  opacity: 0;
}

.zoom-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 5;
}

.zoom-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.85);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #334155;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-button:hover:not(:disabled) {
  background-color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.zoom-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.photo-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  padding: 2rem 1.5rem 1rem;
  color: white;
}

.photo-title {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.photo-description {
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.6;
  opacity: 0.9;
}

.filtered {
  filter: blur(8px);
}

@keyframes spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@media (max-width: 768px) {
  .zoom-controls {
    bottom: 0.75rem;
    right: 0.75rem;
  }
  
  .zoom-button {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  
  .photo-info {
    padding: 1.5rem 1rem 0.75rem;
  }
  
  .photo-title {
    font-size: 1.1rem;
  }
  
  .photo-description {
    font-size: 0.85rem;
  }
}
</style> 