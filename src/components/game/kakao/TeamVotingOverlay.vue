<template>
  <div 
    class="voting-overlay"
    :class="{ 'show': isVisible, 'approved': isApproved }"
    :style="overlayStyle"
  >
    <div class="voting-content">
      <!-- 투표 상태 표시 -->
      <div class="voting-status">
        <div class="voting-progress">
          <div 
            class="voting-progress-bar" 
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="voting-count">
          <span>{{ votingResults.yes }}/{{ requiredVotes }}</span>
        </div>
      </div>
      
      <!-- 투표자 마커 표시 -->
      <div class="voter-markers">
        <div 
          v-for="vote in teamVotes" 
          :key="vote.playerId"
          class="voter-marker"
          :class="{ 'approved': vote.approved }"
          :title="vote.playerName"
        >
          <img 
            :src="vote.playerImage || '/assets/default-marker.png'" 
            :alt="vote.playerName"
          />
        </div>
      </div>
      
      <!-- 투표 버튼 (다른 플레이어들에게만 표시) -->
      <div v-if="!isInitiator && !hasVoted" class="voting-buttons">
        <button 
          class="vote-button approve" 
          @click="submitVote(true)"
          :disabled="hasVoted"
        >
          <i class="fas fa-check"></i>
        </button>
        <button 
          class="vote-button reject" 
          @click="submitVote(false)"
          :disabled="hasVoted"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 취소 버튼 (제안자에게만 표시) -->
      <div v-if="isInitiator" class="voting-buttons">
        <button 
          class="vote-button cancel" 
          @click="cancelVoting"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, watch } from 'vue';
import gameStore from '@/store/gameStore';

export default {
  name: 'TeamVotingOverlay',
  
  props: {
    position: {
      type: Object,
      required: true
    },
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  
  setup(props, { emit }) {
    const store = gameStore;
    
    // 현재 사용자가 투표 제안자인지 확인
    const isInitiator = computed(() => {
      return store.state.votingInitiator?.id === store.state.currentUser.id;
    });
    
    // 현재 사용자가 이미 투표했는지 확인
    const hasVoted = computed(() => {
      return store.state.teamVotes.some(vote => vote.playerId === store.state.currentUser.id);
    });
    
    // 투표 결과 계산
    const votingResults = computed(() => {
      return store.state.votingResults;
    });
    
    // 투표 배열
    const teamVotes = computed(() => {
      return store.state.teamVotes;
    });
    
    // 필요한 투표 수 (과반수)
    const requiredVotes = computed(() => {
      const teamSize = store.getTeamSize(store.state.votingTeamId);
      return Math.ceil(teamSize / 2);
    });
    
    // 진행률 계산
    const progressPercentage = computed(() => {
      return (votingResults.value.yes / requiredVotes.value) * 100;
    });
    
    // 승인 여부 확인
    const isApproved = computed(() => {
      return votingResults.value.yes >= requiredVotes.value;
    });
    
    // 오버레이 스타일 (위치 설정)
    const overlayStyle = computed(() => {
      return {
        left: `${props.position.x}px`,
        top: `${props.position.y}px`
      };
    });
    
    // 투표 제출
    const submitVote = (isApproved) => {
      store.submitVote(isApproved);
      emit('vote', isApproved);
    };
    
    // 투표 취소
    const cancelVoting = () => {
      store.cancelVoting();
      emit('cancel');
    };
    
    // 투표 결과 감시
    watch(() => isApproved.value, (newValue) => {
      if (newValue) {
        // 과반수 찬성 시 자동으로 완료 처리
        setTimeout(() => {
          emit('complete', true);
        }, 1000); // 1초 후 완료 처리 (애니메이션 효과를 위해)
      }
    });
    
    return {
      isInitiator,
      hasVoted,
      votingResults,
      teamVotes,
      requiredVotes,
      progressPercentage,
      isApproved,
      overlayStyle,
      submitVote,
      cancelVoting
    };
  }
};
</script>

<style scoped>
.voting-overlay {
  position: absolute;
  transform: translate(-50%, -130%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 100;
  width: 180px;
  opacity: 0;
  transform-origin: bottom center;
  transform: translate(-50%, -120%) scale(0.8);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.voting-overlay:after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid rgba(255, 255, 255, 0.95);
}

.voting-overlay.show {
  opacity: 1;
  transform: translate(-50%, -130%) scale(1);
}

.voting-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 투표 상태 표시 */
.voting-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.voting-progress {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.voting-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.voting-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
}

/* 투표자 마커 표시 */
.voter-markers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.voter-marker {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #f44336;
  transition: all 0.3s ease;
  transform: scale(1);
}

.voter-marker.approved {
  border-color: #4CAF50;
  animation: pulse 1s infinite alternate;
}

.voter-marker img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 투표 버튼 */
.voting-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 4px;
}

.vote-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.vote-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.vote-button:active {
  transform: translateY(0);
}

.vote-button.approve {
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
}

.vote-button.reject, .vote-button.cancel {
  background: linear-gradient(135deg, #f44336, #e53935);
}

.vote-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

/* 승인 애니메이션 */
.voting-overlay.approved {
  background: rgba(76, 175, 80, 0.9);
}

.voting-overlay.approved:after {
  border-top-color: rgba(76, 175, 80, 0.9);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.1);
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .voting-overlay {
    width: 160px;
    padding: 10px;
  }
  
  .voter-marker {
    width: 25px;
    height: 25px;
  }
  
  .vote-button {
    width: 32px;
    height: 32px;
  }
}
</style>
