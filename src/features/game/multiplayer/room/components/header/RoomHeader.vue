<template>
  <div class="room-header">
    <div class="header-content">
      <!-- 상단: 방 기본 정보 -->
      <div class="room-info-section">
        <div class="room-meta">
          <div class="room-badges">
            <div class="privacy-badge" :class="{ private: roomData.isPrivate }">
              <i
                :class="roomData.isPrivate ? 'fas fa-lock' : 'fas fa-lock-open'"
              ></i>
              {{ roomData.isPrivate ? "비공개" : "공개" }}
            </div>
            <div class="team-badge" v-if="isTeamMode">
              <i class="fas fa-users"></i>
              팀전
            </div>
          </div>
        </div>

        <h2 class="room-title">{{ roomData.title }}</h2>
      </div>

      <!-- 하단: 게임 정보 및 버튼 -->
      <div class="header-actions">
        <!-- 게임 정보 카드 -->
        <div class="game-info-compact">
          <div class="game-info-item">
            <div class="info-icon">
              <i :class="modeIcon"></i>
            </div>
            <div class="info-content">
              <div class="info-label">게임 모드</div>
              <div class="info-value">{{ gameModeName }}</div>
            </div>
          </div>

          <div class="game-info-item">
            <div class="info-icon">
              <i class="fas fa-redo-alt"></i>
            </div>
            <div class="info-content">
              <div class="info-label">라운드</div>
              <div class="info-value">{{ roomData.totalRounds }}회</div>
            </div>
          </div>

          <div class="game-info-item">
            <div class="info-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="info-content">
              <div class="info-label">제한 시간</div>
              <div class="info-value">{{ roomData.timeLimit }}초</div>
            </div>
          </div>

          <div class="game-info-item">
            <div class="info-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="info-content">
              <div class="info-label">지명 공개</div>
              <div class="info-value">
                {{ roomData.poiNameVisible !== false ? "공개" : "비공개" }}
              </div>
            </div>
          </div>
        </div>

        <!-- 버튼 그룹 -->
        <div class="header-buttons">
          <button
            class="action-button chat-toggle-button"
            @click="$emit('toggle-chat')"
            title="채팅 토글"
            v-show="showChatToggle"
          >
            <i class="fas fa-comments"></i>
            <span>채팅</span>
            <div class="chat-notification-mini" v-if="unreadMessages > 0">
              {{ unreadMessages > 9 ? "9+" : unreadMessages }}
            </div>
          </button>

          <button
            class="action-button refresh-button"
            @click="$emit('refresh-room')"
            title="새로고침"
          >
            <i class="fas fa-sync-alt"></i>
            <span>새로고침</span>
          </button>

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
            v-if="showStartButton"
            class="action-button start-button"
            :disabled="startButtonDisabled"
            @click="$emit('start-game')"
            :class="{ disabled: startButtonDisabled }"
            title="게임 시작"
          >
            <i class="fas fa-play"></i>
            <span>시작</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from "vue";

const props = defineProps({
  roomData: {
    type: Object,
    required: true,
  },
  isHost: {
    type: Boolean,
    default: false,
  },
  canStartGame: {
    type: Boolean,
    default: false,
  },
  unreadMessages: {
    type: Number,
    default: 0,
  },
  isTeamMode: {
    type: Boolean,
    default: false,
  },
  showChatToggle: {
    type: Boolean,
    default: false,
  },
  isDummyMode: {
    type: Boolean,
    default: false,
  },
  isStarting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "open-settings",
  "leave-room",
  "start-game",
  "toggle-chat",
  "refresh-room",
]);

const gameModeName = computed(() => {
  // 백엔드에서 대문자(ROADVIEW)로 올 수 있으므로 소문자로 변환하여 비교
  const mode = (props.roomData.gameMode || "").toLowerCase();
  switch (mode) {
    case "roadview":
      return "로드뷰";
    case "photo":
      return "사진";
    default:
      return "게임";
  }
});

const modeIcon = computed(() => {
  // 백엔드에서 대문자(ROADVIEW)로 올 수 있으므로 소문자로 변환하여 비교
  const mode = (props.roomData.gameMode || "").toLowerCase();
  switch (mode) {
    case "roadview":
      return "fas fa-street-view";
    case "photo":
      return "fas fa-image";
    default:
      return "fas fa-gamepad";
  }
});

const showStartButton = computed(() => props.isHost || props.isDummyMode);
const startButtonDisabled = computed(
  () => props.isStarting || (!props.canStartGame && !props.isDummyMode),
);

const copyRoomId = () => {
  navigator.clipboard
    .writeText(props.roomData.id)
    .then(() => {
      // TODO: Add toast notification
      console.log("Room ID copied to clipboard");
    })
    .catch((err) => {
      console.error("Failed to copy room ID: ", err);
    });
};

const leaveRoomWithConfirm = () => {
  if (confirm("정말 방을 나가시겠습니까?")) {
    emit("leave-room");
  }
};
</script>

<style scoped>
.room-header {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.room-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #93c5fd 0%, #c4b5fd 100%);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Room info section */
.room-info-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.room-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.room-id-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
  font-size: 0.8rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.room-id-label {
  color: #64748b;
  margin-right: 0.4rem;
  font-weight: 500;
}

.room-id-value {
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
  font-family: "Courier New", monospace;
}

.copy-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.2rem;
  margin-left: 0.4rem;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.copy-button:hover {
  background-color: #e2e8f0;
  color: #475569;
  transform: scale(1.1);
}

.room-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.privacy-badge,
.team-badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.privacy-badge {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.15);
}

.privacy-badge.private {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.15);
}

.team-badge {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  border: 1px solid rgba(217, 119, 6, 0.15);
}

.room-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Game info compact */
.game-info-compact {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 1rem;
  width: 100%;
}

.game-info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
  font-size: 0.9rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.info-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

/* Header buttons */
.header-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.chat-toggle-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 1px solid rgba(102, 126, 234, 0.3);
  position: relative;
}

.chat-toggle-button:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #553c9a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.chat-notification-mini {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
  border: 2px solid white;
}

.settings-button {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #475569;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.settings-button:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.refresh-button {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.refresh-button:hover {
  background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%);
  color: #047857;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(5, 150, 105, 0.2);
}

.leave-button {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.15);
}

.leave-button:hover {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.15);
}

.start-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.start-button:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #553c9a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.start-button.disabled {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.start-button.disabled:hover {
  transform: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* Responsive design */
@media (max-width: 1024px) {
  .room-header {
    padding: 0.6rem 0.75rem;
    border-radius: 14px;
  }
  .header-content {
    gap: 0.6rem;
  }
  .room-info-section {
    gap: 0.3rem;
  }
  .room-title {
    font-size: 1.05rem;
  }
  .game-info-compact {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
    gap: 0.75rem;
  }
  .info-icon {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  .info-value {
    font-size: 0.75rem;
  }
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  .header-buttons {
    justify-content: center;
  }
  .action-button {
    padding: 0.4rem 0.7rem;
    font-size: 0.73rem;
    border-radius: 9px;
  }
}

@media (max-width: 768px) {
  .room-header {
    padding: 0.5rem 0.6rem;
    border-radius: 12px;
  }

  .room-title {
    font-size: 0.95rem;
  }

  .game-info-compact {
    grid-template-columns: repeat(2, minmax(130px, 1fr));
    gap: 0.6rem;
  }

  .header-buttons {
    width: 100%;
    justify-content: stretch;
  }

  .action-button {
    flex: 1;
    padding: 0.4rem;
    font-size: 0.72rem;
  }
}

@media (max-width: 480px) {
  .room-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .room-id-badge {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
  }

  .room-title {
    font-size: 0.9rem;
  }

  .game-info-compact {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.45rem;
  }

  .action-button span {
    display: none;
  }

  .action-button {
    padding: 0.4rem;
    justify-content: center;
  }
}
</style>
