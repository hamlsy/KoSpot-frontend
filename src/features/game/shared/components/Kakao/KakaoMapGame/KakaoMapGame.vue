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
    
    <!-- 다른 플레이어 마커 표시 (실시간 위치) -->
    <div v-for="(marker, index) in teamPlayerMarkers" :key="index" class="team-player-marker">
      <div 
        class="player-marker" 
        :class="`team-${marker.teamId}-marker`"
        :style="{ left: `${marker.x}px`, top: `${marker.y}px` }"
        :title="marker.playerName"
      >
        <img :src="marker.playerImage || '/assets/default-marker.png'" :alt="marker.playerName" />
      </div>
    </div>
    
    <div class="loading-overlay" v-if="isLoading.value">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>지도 로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useKakaoMapState } from './composables/useKakaoMapState';
import { useKakaoMapControls } from './composables/useKakaoMapControls';
import { useKakaoMapMarkers } from './composables/useKakaoMapMarkers';
import { useKakaoMapDistance } from './composables/useKakaoMapDistance';
import { useKakaoMapHintCircles } from './composables/useKakaoMapHintCircles';
import { useKakaoMapGame } from './composables/useKakaoMapGame';
const props = defineProps({
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
});

const emit = defineEmits(['map-loaded', 'map-clicked', 'close', 'submit-answer']);

// 상태 관리
const {
  map,
  marker,
  distance,
  isLoading,
  isInitialized,
  hasMarker,
  teamPlayerMarkers,
  formattedDistance,
  gameStore
} = useKakaoMapState();

// 지도 컨트롤
const {
  initMap,
  resizeMap,
  zoomIn,
  zoomOut,
  resetZoom,
  closeMap
} = useKakaoMapControls(props, emit);

// 마커 관리
const {
  addClickListener,
  removeClickListener,
  removeMarker,
  getMarkerPosition
} = useKakaoMapMarkers(props, emit);

// 거리 계산
const {
  calculateDistance
} = useKakaoMapDistance(props);

// 힌트 원
const {
  createHintCircles,
  removeCircles,
  toggleHints
} = useKakaoMapHintCircles(props);

// 게임 로직
const {
  submitAnswer,
  startTeamVoting,
  onVoteAnswer,
  updateVotingBadge
} = useKakaoMapGame(props, emit);

const getMapInstance = () => {
  return map.value;
};

// defineExpose를 사용하여 메서드 노출
defineExpose({
  getMapInstance,
  getMarkerPosition
});

// 감시자 설정
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    if (!isInitialized.value) {
      initMap();
      
    } else {
      resizeMap();
    }
  }
});

watch(() => props.actualLocation, (newLocation) => {
  if (newLocation && marker.value && map.value) {
    calculateDistance();
  }
});


// 라이프사이클 훅
onMounted(() => {
  if (props.isOpen) {
    initMap();
  
  }
  
  if (props.showHintCircles && props.actualLocation) {
    createHintCircles();
  }
});

onBeforeUnmount(() => {
  removeClickListener();
  removeMarker();
  removeCircles();
});
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
  display: flex;
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
.voting-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ff5722;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  animation: pulse-badge 1.5s infinite;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 팀별 배지 색상 */
.team-blue-badge {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.team-red-badge {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.team-green-badge {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
}

.team-purple-badge {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

/* 플레이어 마커 스타일 */
.team-player-marker {
  position: absolute;
  z-index: 5;
}

.player-marker {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: 2px solid #3498db;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
}

.player-marker img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 팀별 마커 테두리 색상 */
.team-blue-marker {
  border-color: #3498db;
}

.team-red-marker {
  border-color: #e74c3c;
}

.team-green-marker {
  border-color: #2ecc71;
}

.team-purple-marker {
  border-color: #9b59b6;
}

/* 투표 마커 컨테이너 */
.voting-marker-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

/* 배지 펄스 애니메이션 */
@keyframes pulse-badge {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style> 