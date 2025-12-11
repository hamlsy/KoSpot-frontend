<template>
  <div class="photo-game-controller">
    <div class="game-info">
      <div class="round-info">
        <div class="round-number">라운드 {{ currentRound }}/{{ totalRounds }}</div>
        <div class="round-timer">
          <i class="fas fa-clock"></i>
          <span>{{ formattedTime }}</span>
        </div>
      </div>
      
      <div class="score-info">
        <div class="score-label">점수</div>
        <div class="score-value">{{ formattedScore }}</div>
      </div>

      <div v-if="isTeamMode" class="team-info">
        <div class="team-name" :style="{ backgroundColor: teamColor + '33', color: teamColor }">
          {{ teamName }}
        </div>
        <div class="team-members">
          <div
            v-for="(player) in teamMembers"
            :key="player.id"
            class="team-member"
            :class="{ 'active': player.id === currentPlayerId }"
            :style="{ borderColor: player.id === currentPlayerId ? teamColor : 'transparent' }"
          >
            <img :src="player.avatar" :alt="player.nickname" class="member-avatar">
            <span class="member-name">{{ player.nickname }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 사진 뷰어 -->
    <div class="photo-container">
      <photo-view
        :photo-url="currentPhoto"
        :prevent-interaction="isSubmitting || isRoundEnded"
      />
    </div>

    <!-- 지도 컨트롤러 -->
    <div class="map-controller">
      <div class="map-container">
        <kakao-map
          :height="'100%'"
          :width="'100%'"
          :level="defaultZoomLevel"
          :draggable="!isSubmitting && !isRoundEnded"
          :zoomable="!isSubmitting && !isRoundEnded"
          @click="handleMapClick"
        >
          <map-marker
            v-if="selectedPosition"
            :position="selectedPosition"
            :image="markerImages.guess"
          />
        </kakao-map>
      </div>

      <div class="map-controls">
        <button 
          class="zoom-in-btn" 
          @click="zoomIn"
          :disabled="isSubmitting || isRoundEnded"
        >
          <i class="fas fa-plus"></i>
        </button>
        <button 
          class="zoom-out-btn" 
          @click="zoomOut"
          :disabled="isSubmitting || isRoundEnded"
        >
          <i class="fas fa-minus"></i>
        </button>
      </div>

      <div class="action-buttons">
        <button 
          v-if="!isTeamMode"
          class="submit-btn" 
          :disabled="!canSubmit || isSubmitting || isRoundEnded"
          @click="submitGuess"
        >
          <span v-if="isSubmitting">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span v-else>답안 제출하기</span>
        </button>

        <button 
          v-else
          class="submit-btn" 
          :disabled="!canSubmit || isSubmitting || isRoundEnded"
          @click="submitGuess"
        >
          <span v-if="isSubmitting">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
          <span v-else>답안 제출하기</span>
        </button>

        <button 
          class="skip-btn" 
          :disabled="isSubmitting || isRoundEnded"
          @click="skipRound"
        >
          <i class="fas fa-forward"></i> 스킵
        </button>
      </div>
    </div>

    <!-- 팀 채팅 (협동 모드에서만 보임) -->
    <team-chat
      v-if="isTeamMode"
      :team-id="teamId"
      :team-name="teamName"
      :team-color="teamColor"
      :messages="teamChatMessages"
      :current-user-id="currentPlayerId"
    />

    <!-- 라운드 로딩 중 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <i class="fas fa-camera loading-icon"></i>
        <div class="loading-text">사진을 가져오는 중...</div>
        <div class="loading-subtext">잠시만 기다려주세요!</div>
      </div>
    </div>
  </div>
</template>

<script>
import PhotoView from './PhotoDisplay.vue';
import TeamChat from '../../../multiplayer/chat/components/Game/TeamChat';

export default {
  name: 'PhotoGameController',
  
  components: {
    PhotoView,
    TeamChat
  },
  
  props: {
    // 게임 설정
    isTeamMode: {
      type: Boolean,
      default: false
    },
    currentRound: {
      type: Number,
      required: true
    },
    totalRounds: {
      type: Number,
      required: true
    },
    timeLimit: {
      type: Number,
      required: true
    },
    currentScore: {
      type: Number,
      default: 0
    },
    
    // 팀 정보 (협동 모드에서만 사용)
    teamId: {
      type: String,
      default: ''
    },
    teamName: {
      type: String,
      default: ''
    },
    teamColor: {
      type: String,
      default: '#7f5af0'
    },
    teamMembers: {
      type: Array,
      default: () => []
    },
    teamChatMessages: {
      type: Array,
      default: () => []
    },
    
    // 현재 플레이어 정보
    currentPlayerId: {
      type: String,
      required: true
    },
    
    // 게임 상태
    isLoading: {
      type: Boolean,
      default: false
    },
    isRoundEnded: {
      type: Boolean,
      default: false
    },
    isSubmitting: {
      type: Boolean,
      default: false
    },
    
    // 게임 데이터
    currentPhoto: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      selectedPosition: null,
      remainingTime: this.timeLimit,
      timerInterval: null,
      defaultZoomLevel: 3,
      markerImages: {
        guess: {
          src: require('@/assets/images/markers/guess-marker.png'),
          size: { width: 32, height: 32 },
          options: { offset: { x: 16, y: 32 } }
        }
      }
    };
  },
  
  computed: {
    canSubmit() {
      return this.selectedPosition !== null && this.remainingTime > 0;
    },
    
    formattedTime() {
      const minutes = Math.floor(this.remainingTime / 60);
      const seconds = this.remainingTime % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
    
    formattedScore() {
      return this.currentScore.toLocaleString();
    }
  },
  
  watch: {
    currentRound() {
      this.resetController();
    },
    
    isRoundEnded(newValue) {
      if (newValue) {
        this.stopTimer();
      }
    }
  },
  
  mounted() {
    this.startTimer();
  },
  
  beforeUnmount() {
    this.stopTimer();
  },
  
  methods: {
    startTimer() {
      this.remainingTime = this.timeLimit;
      
      this.stopTimer();
      
      this.timerInterval = setInterval(() => {
        if (this.remainingTime > 0 && !this.isRoundEnded) {
          this.remainingTime -= 1;
        } else {
          this.stopTimer();
          if (!this.isRoundEnded && this.remainingTime <= 0) {
            this.$emit('time-up');
          }
        }
      }, 1000);
    },
    
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },
    
    resetController() {
      this.selectedPosition = null;
      this.startTimer();
    },
    
    handleMapClick(event) {
      if (this.isSubmitting || this.isRoundEnded) return;
      
      const position = {
        lat: event.latLng.getLat(),
        lng: event.latLng.getLng()
      };
      
      this.selectedPosition = position;
    },
    
    zoomIn() {
      this.$emit('zoom-in');
    },
    
    zoomOut() {
      this.$emit('zoom-out');
    },
    
    submitGuess() {
      if (!this.canSubmit || this.isSubmitting || this.isRoundEnded) return;
      
      this.$emit('submit-guess', {
        position: this.selectedPosition,
        remainingTime: this.remainingTime
      });
    },
    
    
    skipRound() {
      if (this.isSubmitting || this.isRoundEnded) return;
      
      this.$emit('skip-round');
    }
  }
};
</script>

<style scoped>
.photo-game-controller {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background-color: #1a1a2e;
  color: #ffffff;
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #16213e;
  border-bottom: 1px solid #2a2a45;
}

.round-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.round-number {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e6e6ff;
}

.round-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #ff9f1c;
}

.round-timer i {
  font-size: 1rem;
}

.score-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-size: 0.9rem;
  color: #b8b8d0;
}

.score-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #7f5af0;
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 200px;
}

.team-name {
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.team-members {
  display: flex;
  gap: 10px;
}

.team-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 5px;
  transition: all 0.2s;
}

.team-member.active {
  background-color: rgba(255, 255, 255, 0.1);
}

.member-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 4px;
}

.member-name {
  font-size: 0.7rem;
  max-width: 60px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-container {
  flex: 1;
  overflow: hidden;
  min-height: 300px;
  position: relative;
  border-bottom: 1px solid #2a2a45;
}

.map-controller {
  position: relative;
  height: 250px;
  display: flex;
  flex-direction: column;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zoom-in-btn,
.zoom-out-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.zoom-in-btn:hover,
.zoom-out-btn:hover {
  background-color: rgba(255, 255, 255, 1);
}

.zoom-in-btn:disabled,
.zoom-out-btn:disabled {
  background-color: rgba(255, 255, 255, 0.3);
  color: #777;
  cursor: not-allowed;
}

.action-buttons {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  z-index: 10;
}

.submit-btn,
.skip-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.submit-btn {
  background-color: #7f5af0;
  color: #ffffff;
  min-width: 180px;
}

.submit-btn:hover:not(:disabled) {
  background-color: #6a4ad8;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background-color: #4d4d69;
  color: #9595b1;
  cursor: not-allowed;
}

.skip-btn {
  background-color: #3a3a5e;
  color: #d2d2f0;
}

.skip-btn:hover:not(:disabled) {
  background-color: #494973;
}

.skip-btn:disabled {
  background-color: #2a2a45;
  color: #7777a0;
  cursor: not-allowed;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 10, 20, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.loading-icon {
  font-size: 3rem;
  color: #7f5af0;
  animation: pulse 1.5s infinite;
}

.loading-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.loading-subtext {
  color: #b8b8d0;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.9);
  }
}

@media (max-width: 768px) {
  .game-info {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .round-info, .score-info, .team-info {
    width: 100%;
    align-items: center;
  }
  
  .team-info {
    align-items: center;
  }
  
  .team-members {
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 10px;
    width: 90%;
  }
  
  .submit-btn, .skip-btn {
    width: 100%;
  }
}
</style> 