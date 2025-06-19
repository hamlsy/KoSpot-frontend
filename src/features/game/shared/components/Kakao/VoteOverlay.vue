<template>
  <div class="vote-overlay-wrapper">
    <div class="vote-overlay">
      <!-- 투표 헤더 -->
      <div class="vote-header">
        <div class="vote-progress">
          <span>{{ approvedVotes.length }}/{{ totalTeamMembers }}</span>
        </div>
        <div class="vote-title">위치 투표</div>
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
  }
}
</script>

<style scoped>
.vote-overlay-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.vote-overlay {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translate(-50%, -20px);
  width: 200px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,240,240,0.95));
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: popIn 0.3s ease-out;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.vote-overlay:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(240,240,240,0.95);
}

.vote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.vote-progress {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.vote-title {
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
}

.vote-players {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin: 4px 0;
}

.player-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #3498db;
  background-color: white;
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-avatar.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border: 2px dashed #ccc;
  color: #aaa;
}

.vote-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.vote-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.approve-button {
  background-color: #10b981;
  color: white;
}

.approve-button:hover {
  background-color: #059669;
  transform: scale(1.1);
}

.cancel-button {
  background-color: #ef4444;
  color: white;
}

.cancel-button:hover {
  background-color: #dc2626;
  transform: scale(1.1);
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px) scale(0.8);
  }
  70% {
    transform: translate(-50%, -25px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -20px) scale(1);
  }
}
</style>
