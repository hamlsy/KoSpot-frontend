<template>
  <div class="team-marker-vote" :style="positionStyle">
    <div class="vote-container" :class="{ 'vote-active': isActive }">
      <!-- 투표 상태 표시 -->
      <div class="vote-status">
        <div class="vote-players">
          <div 
            v-for="vote in votes" 
            :key="vote.playerId" 
            class="player-vote"
            :class="{ 'vote-yes': vote.approved, 'vote-no': vote.approved === false }"
            :title="vote.playerName"
          >
            <img 
              :src="vote.playerImage || '/assets/default-avatar.png'" 
              :alt="vote.playerName"
              class="player-avatar"
            />
          </div>
        </div>
        <div class="vote-count">
          <span>{{ votesApproved }} / {{ teamSize }}</span>
        </div>
      </div>
      
      <!-- 투표 버튼 (현재 사용자가 투표하지 않았고, 제안자가 아닌 경우만 표시) -->
      <div class="vote-buttons" v-if="!hasVoted && !isInitiator">
        <button 
          class="vote-button approve" 
          @click="submitVote(true)"
          title="찬성"
        >
          <i class="fas fa-check"></i>
        </button>
        <button 
          class="vote-button reject" 
          @click="submitVote(false)"
          title="반대"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 제안자인 경우 취소 버튼 표시 -->
      <div class="vote-buttons" v-if="isInitiator">
        <button 
          class="vote-button cancel" 
          @click="cancelVote"
          title="투표 취소"
        >
          <i class="fas fa-ban"></i>
        </button>
      </div>
      
      <!-- 투표 타이머 -->
      <div class="vote-timer">
        <div class="progress-bar">
          <div class="progress" :style="{ width: `${timePercentage}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamMarkerVote',
  
  props: {
    position: {
      type: Object,
      required: true
    },
    initiator: {
      type: Object,
      required: true
    },
    votes: {
      type: Array,
      default: () => []
    },
    teamSize: {
      type: Number,
      required: true
    },
    currentUserId: {
      type: String,
      required: true
    },
    timeLimit: {
      type: Number,
      default: 15 // 초
    },
    isActive: {
      type: Boolean,
      default: true
    },
    mapOffset: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    }
  },
  
  data() {
    return {
      remainingTime: 0,
      timer: null,
      positionStyle: {}
    };
  },
  
  computed: {
    isInitiator() {
      return this.initiator.id === this.currentUserId;
    },
    
    hasVoted() {
      return this.votes.some(vote => vote.playerId === this.currentUserId);
    },
    
    votesApproved() {
      return this.votes.filter(vote => vote.approved).length;
    },
    
    timePercentage() {
      return (this.remainingTime / this.timeLimit) * 100;
    }
  },
  
  watch: {
    position: {
      immediate: true,
      handler() {
        this.updatePosition();
      }
    },
    
    isActive(newValue) {
      if (newValue) {
        this.startTimer();
      } else {
        this.clearTimer();
      }
    }
  },
  
  mounted() {
    if (this.isActive) {
      this.startTimer();
    }
    this.updatePosition();
  },
  
  beforeUnmount() {
    this.clearTimer();
  },
  
  methods: {
    updatePosition() {
      // 마커 위치에 투표 UI를 표시하기 위한 스타일 계산
      // 실제 구현에서는 맵 컴포넌트의 좌표 변환 함수를 사용해야 함
      this.positionStyle = {
        position: 'absolute',
        left: `calc(50% + ${this.mapOffset.x}px)`,
        top: `calc(50% + ${this.mapOffset.y - 60}px)`, // 마커 위에 표시하기 위해 Y 좌표 조정
        transform: 'translate(-50%, -100%)'
      };
    },
    
    startTimer() {
      this.remainingTime = this.timeLimit;
      this.clearTimer();
      
      this.timer = setInterval(() => {
        this.remainingTime--;
        
        if (this.remainingTime <= 0) {
          this.clearTimer();
          this.$emit('vote-timeout');
        }
      }, 1000);
    },
    
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    
    submitVote(approved) {
      this.$emit('vote-submitted', {
        playerId: this.currentUserId,
        approved
      });
    },
    
    cancelVote() {
      this.$emit('vote-cancelled');
    }
  }
};
</script>

<style scoped>
.team-marker-vote {
  z-index: 1000;
  pointer-events: auto;
}

.vote-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  min-width: 120px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.vote-active {
  opacity: 1;
  transform: translateY(0);
}

.vote-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.vote-players {
  display: flex;
  gap: 4px;
}

.player-vote {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid transparent;
}

.vote-yes {
  border-color: #10b981;
}

.vote-no {
  border-color: #ef4444;
}

.player-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vote-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
}

.vote-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 8px;
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
  transition: all 0.2s ease;
}

.approve {
  background-color: #dcfce7;
  color: #10b981;
}

.approve:hover {
  background-color: #10b981;
  color: white;
}

.reject {
  background-color: #fee2e2;
  color: #ef4444;
}

.reject:hover {
  background-color: #ef4444;
  color: white;
}

.cancel {
  background-color: #f3f4f6;
  color: #6b7280;
}

.cancel:hover {
  background-color: #6b7280;
  color: white;
}

.vote-timer {
  width: 100%;
}

.progress-bar {
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #4a6cf7 0%, #2563eb 100%);
  transition: width 1s linear;
}

/* 마커 아래에 화살표 표시 */
.vote-container::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid white;
}
</style>
