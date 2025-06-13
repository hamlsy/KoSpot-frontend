<template>
  <div class="room-header">
    <div class="header-content">
      <!-- 왼쪽: 방 정보 및 모드 -->
      <div class="room-info">
        <div class="room-id-badge">
          <span class="room-id-label">방 ID:</span>
          <span class="room-id-value">{{ roomData.id }}</span>
          <button 
            class="copy-button" 
            @click="copyRoomId" 
            title="방 ID 복사"
          >
            <i class="fas fa-copy"></i>
          </button>
        </div>
        
        <h2 class="room-title">{{ roomData.title }}</h2>
        
        <div class="room-badges">
          <div class="mode-badge">
            <i :class="modeIcon"></i>
            {{ gameModeName }}
          </div>
          <div class="privacy-badge" :class="{ 'private': roomData.isPrivate }">
            <i :class="roomData.isPrivate ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
            {{ roomData.isPrivate ? '비공개' : '공개' }}
          </div>
          <div class="team-badge" v-if="isTeamMode">
            <i class="fas fa-users"></i>
            팀전
          </div>
        </div>
      </div>
      
      <!-- 오른쪽: 버튼 그룹 -->
      <div class="header-buttons">
        <button 
          class="action-button settings-button" 
          @click="$emit('open-settings')"
          title="방 설정"
          v-if="isHost"
        >
          <i class="fas fa-cog"></i>
          <span>설정</span>
        </button>
        
        <button 
          class="action-button leave-button" 
          @click="leaveRoomWithConfirm"
          title="방 나가기"
        >
          <i class="fas fa-sign-out-alt"></i>
          <span>나가기</span>
        </button>
        
        <button 
          v-if="isHost" 
          class="action-button start-button" 
          :disabled="!canStartGame" 
          @click="$emit('start-game')"
          :class="{ 'disabled': !canStartGame }"
          title="게임 시작"
        >
          <i class="fas fa-play"></i>
          <span>시작</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  roomData: {
    type: Object,
    required: true
  },
  isHost: {
    type: Boolean,
    default: false
  },
  canStartGame: {
    type: Boolean,
    default: false
  },
  unreadMessages: {
    type: Number,
    default: 0
  },
  isTeamMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['open-settings', 'leave-room', 'start-game']);

const gameModeName = computed(() => {
  switch(props.roomData.gameMode) {
    case 'roadview':
      return '로드뷰';
    case 'photo':
      return '사진';
    default:
      return '게임';
  }
});

const modeIcon = computed(() => {
  switch(props.roomData.gameMode) {
    case 'roadview':
      return 'fas fa-street-view';
    case 'photo':
      return 'fas fa-image';
    default:
      return 'fas fa-gamepad';
  }
});

const copyRoomId = () => {
  navigator.clipboard.writeText(props.roomData.id)
    .then(() => {
      // TODO: Add toast notification
      console.log('Room ID copied to clipboard');
    })
    .catch(err => {
      console.error('Failed to copy room ID: ', err);
    });
};

const leaveRoomWithConfirm = () => {
  if (confirm('정말 방을 나가시겠습니까?')) {
    emit('leave-room');
  }
};
</script>

<style scoped>
.room-header {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
}

.room-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Room info styling */
.room-info {
  flex: 1;
  min-width: 250px;
}

.room-id-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.room-id-label {
  color: #6b7280;
  margin-right: 0.3rem;
}

.room-id-value {
  font-weight: 600;
  color: black;
  letter-spacing: 0.5px;
}

.copy-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.2rem;
  margin-left: 0.5rem;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background-color: #e5e7eb;
  color: #4b5563;
}

.room-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: black;
  margin: 0.3rem 0 0.6rem;
  line-height: 1.2;
}

.room-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mode-badge, .privacy-badge, .team-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.mode-badge {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%);
  color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.privacy-badge {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.privacy-badge.private {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.team-badge {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

/* Header buttons styling */
.header-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.settings-button {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
}

.settings-button:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #1f2937;
}

.leave-button {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #ef4444;
}

.leave-button:hover {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #dc2626;
}

.start-button {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #22c55e;
}

.start-button:hover {
  background: linear-gradient(135deg, #bbf7d0 0%, #86efac 100%);
  color: #16a34a;
}

.start-button.disabled {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 중간 크기 화면에서의 스타일 조정 */
@media (max-width: 992px) {
  .room-info {
    min-width: 220px;
  }
  
  .room-title {
    font-size: 1.2rem;
    margin: 0.2rem 0 0.5rem;
  }
  
  .action-button {
    padding: 0.4rem 0.8rem;
  }
}

/* 작은 화면에서의 스타일 조정 */
@media (max-width: 768px) {
  .room-header {
    padding: 0.8rem;
  }
  
  .header-content {
    gap: 0.5rem;
  }
  
  .room-info {
    width: 100%;
  }
  
  .room-badges {
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }
  
  .mode-badge, .privacy-badge, .team-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .header-buttons {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.4rem;
  }
  
  .action-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
    justify-content: center;
    width: 100%;
  }
}

/* 매우 작은 화면에서의 스타일 조정 */
@media (max-width: 480px) {
  .room-id-badge {
    font-size: 0.7rem;
    padding: 0.3rem 0.6rem;
  }
  
  .room-title {
    font-size: 1.1rem;
    margin: 0.2rem 0 0.4rem;
  }
  
  .room-badges {
    flex-wrap: wrap;
  }
  
  .action-button span {
    display: none;
  }
  
  .action-button {
    padding: 0.4rem;
    aspect-ratio: 1/1;
  }
  
  .action-button i {
    font-size: 1rem;
    margin: 0;
  }
}
</style>
