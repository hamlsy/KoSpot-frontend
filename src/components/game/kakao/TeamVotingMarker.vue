<template>
  <div 
    class="team-voting-marker"
    :class="{ 'pulse': isActive }"
  >
    <div class="marker-icon" :class="`team-${teamId}-marker`">
      <i class="fas fa-map-marker-alt"></i>
    </div>
    <team-voting-overlay
      v-if="showOverlay"
      :position="overlayPosition"
      :is-visible="showOverlay"
      @vote="handleVote"
      @cancel="handleCancel"
      @complete="handleComplete"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import TeamVotingOverlay from './TeamVotingOverlay.vue';
import gameStore from '@/store/gameStore';

export default {
  name: 'TeamVotingMarker',
  components: {
    TeamVotingOverlay
  },
  
  props: {
    position: {
      type: Object,
      required: true
    },
    teamId: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  setup(props, { emit }) {
    const showOverlay = ref(false);
    const overlayPosition = ref({ x: 0, y: 0 });
    
    // 오버레이 위치 계산
    const calculateOverlayPosition = () => {
      // 실제 구현에서는 마커 위치를 기반으로 계산
      // 여기서는 간단하게 동일한 위치 사용
      overlayPosition.value = {
        x: 0, // 중앙 정렬을 위해 0으로 설정
        y: 0  // 마커 위에 표시하기 위해 0으로 설정
      };
    };
    
    // 투표 처리
    const handleVote = (isApproved) => {
      emit('vote', isApproved);
    };
    
    // 취소 처리
    const handleCancel = () => {
      emit('cancel');
    };
    
    // 완료 처리
    const handleComplete = (isApproved) => {
      emit('complete', isApproved);
    };
    
    // 활성화 상태 변경 시 오버레이 표시
    watch(() => props.isActive, (newValue) => {
      if (newValue) {
        calculateOverlayPosition();
        showOverlay.value = true;
      } else {
        showOverlay.value = false;
      }
    }, { immediate: true });
    
    onMounted(() => {
      if (props.isActive) {
        calculateOverlayPosition();
        showOverlay.value = true;
      }
    });
    
    return {
      showOverlay,
      overlayPosition,
      handleVote,
      handleCancel,
      handleComplete
    };
  }
};
</script>

<style scoped>
.team-voting-marker {
  position: absolute;
  z-index: 10;
}

.marker-icon {
  font-size: 2.5rem;
  color: #3498db;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transform-origin: bottom center;
}

/* 팀별 마커 색상 */
.team-blue-marker {
  color: #3498db;
}

.team-red-marker {
  color: #e74c3c;
}

.team-green-marker {
  color: #2ecc71;
}

.team-purple-marker {
  color: #9b59b6;
}

/* 펄스 애니메이션 */
.pulse .marker-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 뽀잉 등장 애니메이션 */
.team-voting-marker {
  animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}
</style>
