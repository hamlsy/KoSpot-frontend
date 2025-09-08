<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="toast-notification"
          :class="[`toast-${notification.type}`, { 'toast-show': notification.show }]"
        >
          <div class="toast-icon">
            <i :class="getIconClass(notification.type)"></i>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ notification.title }}</div>
            <div v-if="notification.message" class="toast-message">{{ notification.message }}</div>
          </div>
          <button 
            class="toast-close"
            @click="removeNotification(notification.id)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';

const notifications = ref([]);

// 알림 타입별 아이콘 매핑
const getIconClass = (type) => {
  const iconMap = {
    'success': 'fas fa-check-circle',
    'info': 'fas fa-info-circle', 
    'warning': 'fas fa-exclamation-triangle',
    'error': 'fas fa-times-circle',
    'player-join': 'fas fa-user-plus',
    'player-leave': 'fas fa-user-minus',
    'team-change': 'fas fa-exchange-alt',
    'settings-change': 'fas fa-cog',
    'game-start': 'fas fa-play'
  };
  return iconMap[type] || 'fas fa-info-circle';
};

// 알림 추가
const addNotification = (notification) => {
  const id = Date.now() + Math.random();
  const newNotification = {
    id,
    show: false,
    duration: 4000, // 기본 4초
    ...notification
  };
  
  notifications.value.push(newNotification);
  
  // 즉시 표시
  setTimeout(() => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value[index].show = true;
    }
  }, 100);
  
  // 자동 제거
  setTimeout(() => {
    removeNotification(id);
  }, newNotification.duration);
  
  return id;
};

// 알림 제거
const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.value[index].show = false;
    setTimeout(() => {
      notifications.value.splice(index, 1);
    }, 300);
  }
};

// 플레이어 입장 알림
const showPlayerJoinNotification = (playerName) => {
  addNotification({
    type: 'player-join',
    title: '플레이어 입장',
    message: `${playerName}님이 입장했습니다.`
  });
};

// 플레이어 퇴장 알림  
const showPlayerLeaveNotification = (playerName) => {
  addNotification({
    type: 'player-leave',
    title: '플레이어 퇴장',
    message: `${playerName}님이 퇴장했습니다.`
  });
};

// 팀 변경 알림
const showTeamChangeNotification = (playerName, teamName) => {
  addNotification({
    type: 'team-change',
    title: '팀 변경',
    message: `${playerName}님이 ${teamName}팀으로 이동했습니다.`
  });
};

// 방 설정 변경 알림
const showSettingsChangeNotification = (settingType) => {
  addNotification({
    type: 'settings-change',
    title: '방 설정 변경',
    message: `${settingType} 설정이 변경되었습니다.`
  });
};

// 게임 시작 알림
const showGameStartNotification = () => {
  addNotification({
    type: 'game-start',
    title: '게임 시작!',
    message: '게임이 곧 시작됩니다. 준비하세요!',
    duration: 6000
  });
};

// 일반 성공 알림
const showSuccessNotification = (title, message) => {
  addNotification({
    type: 'success',
    title,
    message
  });
};

// 일반 오류 알림
const showErrorNotification = (title, message) => {
  addNotification({
    type: 'error',
    title,
    message,
    duration: 6000
  });
};

// 외부에서 사용할 수 있도록 expose
defineExpose({
  addNotification,
  removeNotification,
  showPlayerJoinNotification,
  showPlayerLeaveNotification,
  showTeamChangeNotification,
  showSettingsChangeNotification,
  showGameStartNotification,
  showSuccessNotification,
  showErrorNotification
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
  pointer-events: none;
}

.toast-notification {
  display: flex;
  align-items: flex-start;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-left: 4px solid #e5e7eb;
  pointer-events: auto;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s ease;
  min-width: 300px;
}

.toast-notification.toast-show {
  transform: translateX(0);
  opacity: 1;
}

/* 타입별 스타일링 */
.toast-success {
  border-left-color: #22c55e;
}

.toast-success .toast-icon {
  color: #22c55e;
}

.toast-info {
  border-left-color: #3b82f6;
}

.toast-info .toast-icon {
  color: #3b82f6;
}

.toast-warning {
  border-left-color: #f59e0b;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-error {
  border-left-color: #ef4444;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-player-join {
  border-left-color: #10b981;
}

.toast-player-join .toast-icon {
  color: #10b981;
}

.toast-player-leave {
  border-left-color: #f97316;
}

.toast-player-leave .toast-icon {
  color: #f97316;
}

.toast-team-change {
  border-left-color: #8b5cf6;
}

.toast-team-change .toast-icon {
  color: #8b5cf6;
}

.toast-settings-change {
  border-left-color: #6366f1;
}

.toast-settings-change .toast-icon {
  color: #6366f1;
}

.toast-game-start {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
}

.toast-game-start .toast-icon {
  color: #f59e0b;
}

.toast-icon {
  font-size: 1.2rem;
  margin-right: 0.75rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: black;
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

.toast-message {
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #9ca3af;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
  flex-shrink: 0;
  font-size: 0.7rem;
}

.toast-close:hover {
  background-color: #f3f4f6;
  color: #6b7280;
}

/* 애니메이션 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: all 0.3s ease;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .toast-container {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }
  
  .toast-notification {
    min-width: 0;
    font-size: 0.85rem;
    padding: 0.75rem;
  }
  
  .toast-title {
    font-size: 0.85rem;
  }
  
  .toast-message {
    font-size: 0.75rem;
  }
}
</style>
