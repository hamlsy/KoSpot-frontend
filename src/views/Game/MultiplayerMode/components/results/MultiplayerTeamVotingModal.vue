<template>
  <div class="voting-modal" v-if="visible">
    <div class="modal-backdrop"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-vote-yea"></i> 팀 투표
        </h3>
      </div>
      
      <div class="modal-body">
        <div class="voting-info">
          <div class="initiator-info">
            <img :src="initiator.profileImage || '/assets/default-avatar.png'" :alt="initiator.nickname" class="initiator-avatar">
            <div class="initiator-name">{{ initiator.nickname }}님이 제안한 위치</div>
          </div>
          
          <div class="vote-question">
            <p>이 위치로 제출하시겠습니까?</p>
            <div class="location-preview">
              <img :src="mapPreviewUrl" alt="위치 미리보기" class="map-preview">
              <div class="coords">{{ formatCoords(guessPosition) }}</div>
            </div>
          </div>
          
          <div class="voting-status">
            <div class="time-remaining">
              <div class="progress-bar">
                <div class="progress" :style="{ width: `${timePercentage}%` }"></div>
              </div>
              <div class="time-text">{{ remainingTimeText }}</div>
            </div>
            
            <div class="vote-count">
              <div class="vote-yes">
                <i class="fas fa-check-circle"></i>
                <span>{{ voteStats.yes }}</span>
              </div>
              <div class="vote-no">
                <i class="fas fa-times-circle"></i>
                <span>{{ voteStats.no }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="vote-buttons" v-if="!hasVoted && !isInitiator">
          <button class="vote-button vote-yes-button" @click="submitVote(true)">
            <i class="fas fa-check"></i>
            예, 동의합니다
          </button>
          <button class="vote-button vote-no-button" @click="submitVote(false)">
            <i class="fas fa-times"></i>
            아니오, 거부합니다
          </button>
        </div>
        
        <div class="vote-status" v-else>
          <div v-if="isInitiator" class="waiting-message">
            <i class="fas fa-spinner fa-spin"></i>
            팀원들의 투표를 기다리는 중입니다...
          </div>
          <div v-else class="vote-submitted">
            <i :class="myVote ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
            투표가 완료되었습니다.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamVotingModal',
  
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    initiator: {
      type: Object,
      required: true
    },
    guessPosition: {
      type: Object,
      required: true
    },
    timeLimit: {
      type: Number,
      default: 20 // 초
    },
    mapPreviewUrl: {
      type: String,
      required: true
    },
    currentUserId: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      remainingTime: 0,
      voteStats: {
        yes: 0,
        no: 0
      },
      hasVoted: false,
      myVote: null,
      timer: null
    };
  },
  
  computed: {
    isInitiator() {
      return this.initiator.id === this.currentUserId;
    },
    
    timePercentage() {
      return (this.remainingTime / this.timeLimit) * 100;
    },
    
    remainingTimeText() {
      return `${this.remainingTime}초 남음`;
    }
  },
  
  watch: {
    visible(newValue) {
      if (newValue) {
        this.initializeVoting();
      } else {
        this.resetVoting();
      }
    }
  },
  
  methods: {
    initializeVoting() {
      this.remainingTime = this.timeLimit;
      this.hasVoted = this.isInitiator; // 발의자는 자동으로 찬성으로 처리
      this.myVote = this.isInitiator ? true : null;
      this.voteStats = {
        yes: this.isInitiator ? 1 : 0,
        no: 0
      };
      
      this.startTimer();
    },
    
    resetVoting() {
      this.clearTimer();
      this.hasVoted = false;
      this.myVote = null;
    },
    
    startTimer() {
      this.clearTimer();
      
      this.timer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          this.completeVoting();
        }
      }, 1000);
    },
    
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    
    submitVote(isApproved) {
      if (this.hasVoted) return;
      
      this.hasVoted = true;
      this.myVote = isApproved;
      
      // 투표 결과 업데이트
      if (isApproved) {
        this.voteStats.yes++;
      } else {
        this.voteStats.no++;
      }
      
      // 투표 결과 이벤트 발생
      this.$emit('vote-submitted', {
        userId: this.currentUserId,
        approved: isApproved
      });
      
      // 모든 팀원이 투표했는지 확인하는 로직은 상위 컴포넌트에서 처리
    },
    
    completeVoting() {
      this.clearTimer();
      
      // 미투표자는 기권으로 처리
      if (!this.hasVoted && !this.isInitiator) {
        this.hasVoted = true;
        this.myVote = null;
      }
      
      // 투표 결과 전송
      this.$emit('voting-completed', {
        approved: this.voteStats.yes > this.voteStats.no,
        stats: this.voteStats
      });
    },
    
    formatCoords(position) {
      if (!position) return '';
      
      const lat = position.lat.toFixed(6);
      const lng = position.lng.toFixed(6);
      return `위도: ${lat}, 경도: ${lng}`;
    }
  },
  
  beforeUnmount() {
    this.clearTimer();
  }
};
</script>

<style scoped>
.voting-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.modal-container {
  position: relative;
  width: 90%;
  max-width: 500px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #4a6cf7 0%, #2563eb 100%);
}

.modal-title {
  margin: 0;
  color: white;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-body {
  padding: 1.5rem;
}

.voting-info {
  margin-bottom: 1.5rem;
}

.initiator-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}

.initiator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4a6cf7;
}

.initiator-name {
  font-weight: 600;
  color: #333;
}

.vote-question {
  text-align: center;
  margin-bottom: 1.5rem;
}

.vote-question p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #333;
}

.location-preview {
  margin: 0 auto;
  width: 100%;
  max-width: 300px;
}

.map-preview {
  width: 100%;
  height: 150px;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 0.5rem;
  border: 1px solid #ddd;
}

.coords {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
}

.voting-status {
  margin-top: 1.5rem;
}

.time-remaining {
  margin-bottom: 1rem;
}

.progress-bar {
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #4a6cf7 0%, #2563eb 100%);
  transition: width 1s linear;
}

.time-text {
  font-size: 0.9rem;
  color: #666;
  text-align: right;
}

.vote-count {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.vote-yes, .vote-no {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.vote-yes i {
  font-size: 1.8rem;
  color: #10b981;
}

.vote-no i {
  font-size: 1.8rem;
  color: #ef4444;
}

.vote-count span {
  font-size: 1.2rem;
  font-weight: 600;
}

.vote-buttons {
  display: flex;
  gap: 1rem;
}

.vote-button {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.vote-yes-button {
  background-color: #dcfce7;
  color: #10b981;
}

.vote-yes-button:hover {
  background-color: #10b981;
  color: white;
}

.vote-no-button {
  background-color: #fee2e2;
  color: #ef4444;
}

.vote-no-button:hover {
  background-color: #ef4444;
  color: white;
}

.vote-status {
  text-align: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
}

.waiting-message, .vote-submitted {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  font-size: 1.1rem;
  color: #666;
}

.vote-submitted i.fa-check-circle {
  color: #10b981;
}

.vote-submitted i.fa-times-circle {
  color: #ef4444;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .vote-buttons {
    flex-direction: column;
  }
}
</style> 