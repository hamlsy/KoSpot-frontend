<template>
  <div class="vote-overlay-wrapper">
    <!-- 투표 아이콘 버튼 (접힌 상태) -->
    <button 
      v-if="!isExpanded" 
      @click="expandOverlay" 
      class="vote-icon-button"
      :class="{ 'pulse-animation': hasNewVotes }"
    >
    <!-- <svg class="vote-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V11.08z"></path>
      <path d="M18 8h-6V2"></path>
      <circle cx="12" cy="14" r="2"></circle>
      <path d="M14 17.5v1a1.5 1.5 0 0 1-3 0v-1"></path>
    </svg> -->
    <i class="fas fa-vote-yea"></i>
      <span class="vote-count">{{ approvedVotes.length }}/{{ totalTeamMembers }}</span>
    </button>

    <!-- 펼쳐진 투표 오버레이 -->
    <div v-else class="vote-overlay">
      <!-- 투표 헤더 -->
      <div class="vote-header">
        <div class="vote-progress">
          <span>{{ approvedVotes.length }}/{{ totalTeamMembers }}</span>
        </div>
        <!-- 접기 버튼 추가 -->
        <button @click="collapseOverlay" class="collapse-button">
          <span>접기</span>
        </button>
      </div>
      
      <!-- 투표 플레이어 목록 -->
      <div class="vote-players">
        <div 
          v-for="player in approvedVotes" 
          :key="player.id" 
          class="player-avatar"
          :title="player.name"
        >
          <img 
            :src="player.profileImage || '/assets/default-avatar.png'" 
            :alt="player.name"
          />
        </div>
        <!-- 빈 자리 표시 -->
        <div 
          v-for="i in (totalTeamMembers - approvedVotes.length)" 
          :key="`empty-${i}`" 
          class="player-avatar empty"
        >
          <i class="fas fa-user"></i>
        </div>
      </div>
      
      <!-- 투표 버튼 영역 -->
      <div class="vote-buttons">
        <!-- 투표 발의자는 취소 버튼만 표시 -->
        <template v-if="isInitiator">
          <button @click="$emit('cancel-vote')" class="vote-button cancel-button" title="취소">
            <i class="fas fa-times"></i>
          </button>
        </template>
        <!-- 다른 팀원들은 찬성/거절 버튼 표시 -->
        <template v-else>
          <button @click="$emit('approve-vote')" class="vote-button approve-button" title="동의">
            <i class="fas fa-check"></i>
          </button>
          <button @click="$emit('reject-vote')" class="vote-button cancel-button" title="거절">
            <i class="fas fa-times"></i>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VoteOverlay',
  props: {
    // 투표에 찬성한 플레이어 목록
    approvedVotes: {
      type: Array,
      default: () => []
    },
    // 팀 전체 인원 수
    totalTeamMembers: {
      type: Number,
      default: 4
    },
    // 현재 사용자가 투표 발의자인지 여부
    isInitiator: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isExpanded: false,
      lastVoteCount: 0,
      hasNewVotes: false
    }
  },
  watch: {
    // 투표 수가 변경되면 아이콘에 애니메이션 효과 추가
    'approvedVotes.length': function(newVal, oldVal) {
      if (newVal > oldVal && !this.isExpanded) {
        this.hasNewVotes = true;
        setTimeout(() => {
          this.hasNewVotes = false;
        }, 2000);
      }
      this.lastVoteCount = newVal;
    }
  },
  methods: {
    expandOverlay() {
      this.isExpanded = true;
      this.hasNewVotes = false;
    },
    collapseOverlay() {
      this.isExpanded = false;
    }
  }
  }
</script>

<style scoped>
.vote-overlay-wrapper {
  position: absolute; /* relative에서 absolute로 변경 */
  width: 150px;
  z-index: 1000;
  left: 50%; /* 중앙 정렬을 위해 추가 */
  transform: translateX(-50%); /* 중앙 정렬을 위해 추가 */
  bottom: 100%; /* 마커 위에 위치하도록 설정 */
  margin-bottom: 5px; /* 마커와의 간격 */
}

/* 투표 아이콘 버튼 스타일 */
.vote-icon-button {
  width: 80px;
  height: 36px;
  border-radius: 18px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  margin: 0 auto;
}

.vote-icon-button:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.vote-count {
  font-size: 0.8rem;
}

.vote-icon {
  width: 16px;
  height: 16px;
  stroke: white;
  margin-right: 4px;
}

.vote-count {
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}
/* 펄스 애니메이션 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.pulse-animation {
  animation: pulse 1.5s infinite;
}

/* 접기 버튼 스타일 */
.collapse-button {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.collapse-button:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.vote-overlay {
  position: absolute; /* relative에서 absolute로 변경 */
  width: 180px;
  background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,248,248,0.98));
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  left: 50%; /* 중앙 정렬 */
  bottom: 100%; /* 마커 위에 위치 */
  transform: translateX(-50%); /* 중앙 정렬 */
  margin-bottom: 10px; /* 마커와의 간격 */
  animation: popIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.vote-overlay:after {
  /* content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(240,240,240,0.95); */
}

.vote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.vote-progress {
  background-color: #e5e7eb;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #4b5563;
}

.vote-title {
  font-weight: bold;
  color: #1f2937;
}

.vote-players {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 12px;
  justify-content: center;
}

.player-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #3b82f6;
  background-color: #e5e7eb;
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vote-buttons {
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.vote-button {
  width: 5rem;
  height: 2rem;
  border-radius:10%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.approve-button {
  background-color: #10b981;
}

.approve-button:hover {
  background-color: #059669;
  transform: scale(1.03);
}

.cancel-button {
  background-color: #ef4444;
}

.cancel-button:hover {
  background-color: #dc2626;
  transform: scale(1.03);
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: translate(-50%) scale(0.8);
  }
  70% {
    transform: translate(-50%) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: translate(-50%) scale(1);
  }
}
</style>
