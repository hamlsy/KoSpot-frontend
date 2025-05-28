<template>
  <div class="photo-grid" :class="[`photos-${photos.length}`, { 
    'incorrect-shake': showIncorrectAnimation, 
    'correct-highlight': showCorrectAnimation,
    'timeout-highlight': showTimeoutAnimation
  }]">
    <div v-for="(photo, index) in photos" :key="index" class="photo-item">
      <photo-display 
        :photo-url="photo" 
        :show-zoom-controls="true"
        @loaded="$emit('photo-loaded')"
      />
      <div v-if="showCorrectAnimation || showTimeoutAnimation" class="photo-description">
        <div class="location-name">{{ photo.locationName }}</div>
        <p>{{ photo.shortDescription || photo.locationDescription }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import PhotoDisplay from '@/components/game/common/photo/PhotoView.vue';

export default {
  name: 'PhotoModePhotoGrid',
  
  components: {
    PhotoDisplay
  },
  
  props: {
    photos: {
      type: Array,
      required: true
    },
    showIncorrectAnimation: {
      type: Boolean,
      default: false
    },
    showCorrectAnimation: {
      type: Boolean,
      default: false
    },
    showTimeoutAnimation: {
      type: Boolean,
      default: false
    },
    correctRegion: {
      type: String,
      default: null
    }
  },
  
  emits: ['photo-loaded']
};
</script>

<style scoped>
.photo-grid {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 1rem;
  padding: 1rem;
}

.photo-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.photo-description {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease-out;
}

.location-name {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #0f172a;
}

.photo-description p {
  margin: 0;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.4;
}

/* 사진 개수에 따른 그리드 레이아웃 */
.photos-1 {
  grid-template-columns: 1fr;
}

.photos-2 {
  grid-template-columns: repeat(2, 1fr);
}

.photos-3 {
  grid-template-columns: repeat(3, 1fr);
}

.photos-4 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

/* 애니메이션 효과 */
.incorrect-shake {
  animation: shake 0.6s ease-in-out;
}

.correct-highlight .photo-item { 
  transition: background-color 0.3s ease;
}

.timeout-highlight .photo-item {
  transition: background-color 0.3s ease;
}

@keyframes shake {
  0% { transform: translateX(0); }
  10% { transform: translateX(-5px); }
  20% { transform: translateX(5px); }
  30% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  50% { transform: translateX(-5px); }
  60% { transform: translateX(5px); }
  70% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
  90% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .photos-3, .photos-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .photos-4 {
    grid-template-rows: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .photos-2, .photos-3, .photos-4 {
    grid-template-columns: 1fr;
  }
  
  .photos-4 {
    grid-template-rows: repeat(4, 1fr);
  }
}
</style>
