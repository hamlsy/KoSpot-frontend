<template>
  <div class="road-view-game">
    <RoadView
      :position="initialPosition"
      :showControls="showControls"
      :showCompass="showCompass"
      :preventMouseEvents="preventInteraction"
      @load-complete="onLoadComplete"
      @load-error="onLoadError"
      @pano-changed="onPanoChanged"
    />
    
    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>로드뷰 로딩 중...</p>
      </div>
    </div>
    
    <div class="error-overlay" v-if="hasError">
      <div class="error-content">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>로드뷰를 불러올 수 없습니다</h3>
        <p>이 위치에 로드뷰 데이터가 없습니다. 다른 위치를 시도합니다.</p>
        <button class="retry-btn" @click="retryLoading">
          <i class="fas fa-redo"></i> 다시 시도
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import RoadView from 'src/features/game/shared/components/roadview/RoadView.vue'

export default {
  name: 'RoadViewGame',
  components: {
    RoadView
  },
  
  props: {
    initialPosition: {
      type: Object,
      required: true,
      validator: prop => Object.prototype.hasOwnProperty.call(prop, 'lat') && Object.prototype.hasOwnProperty.call(prop, 'lng')
    },
    showControls: {
      type: Boolean,
      default: false
    },
    showCompass: {
      type: Boolean,
      default: false
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
      currentPanoId: null
    };
  },
  
  methods: {
    onLoadComplete(data) {
      this.isLoading = false;
      this.hasError = false;
      this.currentPanoId = data.panoId;
      
      this.$emit('load-complete', {
        panoId: data.panoId,
        position: this.initialPosition
      });
    },
    
    onLoadError() {
      this.isLoading = false;
      this.hasError = true;
      this.$emit('load-error');
    },
    
    onPanoChanged(data) {
      this.currentPanoId = data.panoId;
      this.$emit('pano-changed', data);
    },
    
    retryLoading() {
      this.isLoading = true;
      this.hasError = false;
      this.$emit('retry-requested');
    }
  }
};
</script>

<style scoped>
.road-view-game {
  width: 100%;
  height: 100%;
  position: absolute;
  background: #f5f7fa;
}

.loading-overlay, .error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-overlay {
  background: rgba(255, 255, 255, 0.8);
}

.error-overlay {
  background: rgba(0, 0, 0, 0.7);
}

.loading-spinner, .error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.loading-spinner i, .error-icon i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-spinner i {
  color: #3498db;
}

.error-icon i {
  color: #e74c3c;
}

.loading-spinner p {
  font-size: 1.1rem;
  color: #333;
}

.error-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 90%;
  width: 400px;
}

.error-content h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.error-content p {
  margin: 0 0 1.5rem 0;
  color: #666;
  line-height: 1.5;
}

.retry-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.retry-btn:active {
  transform: translateY(-1px);
}
</style> 