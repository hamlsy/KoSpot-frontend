<template>
  <div class="multiplayer-room-waiting">
    <!-- 배경 요소 -->
    <div class="mode-background"></div>

    <!-- 메인 컨텐츠 영역 -->
    <div class="room-content">
      <!-- 왼쪽 패널: 헤더 + 플레이어 목록 -->
      <div class="left-panel">
        <!-- 헤더 컴포넌트 -->
        <RoomHeader
          :room-data="dummyRoomData"
          :is-host="true"
          :can-start-game="true"
          :is-starting="false"
          :is-dummy-mode="true"
          :unread-messages="0"
          :is-team-mode="false"
          :show-chat-toggle="isMobile"
          @open-settings="handleOpenSettings"
          @toggle-chat="handleToggleChat"
          @leave-room="handleLeaveRoom"
          @start-game="handleStartGame"
        />

        <!-- 플레이어 목록 -->
        <div class="panel-section">
          <h3 class="section-title">
            <i class="fas fa-users"></i>
            참가자 ({{ dummyPlayers.length }}/{{ dummyRoomData.maxPlayers }})
          </h3>

          <!-- 개인 모드인 경우 플레이어 목록 표시 -->
          <SoloWaitingList
            :players="dummyPlayers"
            :current-user-id="currentUserId"
            :is-host="true"
            :max-players="dummyRoomData.maxPlayers"
            :player-messages="{}"
            @show-player-details="handleShowPlayerDetails"
            @kick-player="handleKickPlayer"
          />
        </div>
      </div>

      <!-- 오른쪽 패널: 채팅 전체 높이 -->
      <div class="right-panel" :class="{ 'hidden-mobile': isMobile && !isChatVisible }">
        <div class="chat-panel">
          <div class="chat-header">
            <div class="chat-title">
              <i class="fas fa-comments"></i>
              <span>채팅</span>
            </div>
            <div class="chat-controls">
              <div class="chat-status">
                <i class="fas fa-circle online-indicator"></i>
                <span>{{ dummyPlayers.length }}명 온라인</span>
              </div>
              <button 
                v-if="isMobile" 
                class="chat-close-button"
                @click="handleToggleChat"
                title="채팅 닫기"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="chat-container">
            <div class="chat-messages" ref="chatMessagesRef">
              <ChatMessage
                v-for="(message, index) in dummyChatMessages"
                :key="index"
                :message="message"
                :current-user-id="currentUserId"
              />
            </div>

            <div class="chat-input-container">
              <input
                type="text"
                class="chat-input"
                v-model="chatInput"
                placeholder="메시지를 입력하세요..."
                @keyup.enter="handleSendMessage"
              />
              <button class="send-button" @click="handleSendMessage">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import RoomHeader from '@/features/game/multiplayer/room/components/header/RoomHeader.vue';
import SoloWaitingList from '@/features/game/multiplayer/room/components/list/SoloWaitingList.vue';
import ChatMessage from '@/features/game/multiplayer/chat/components/Room/ChatMessage.vue';
import { soloTestData } from '@/features/game/multiplayer/room/composables/MultiplayerGameTestData.js';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isChatVisible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-chat']);

// 더미 데이터
const currentUserId = 'user123';
const chatInput = ref('');
const chatMessagesRef = ref(null);

// 더미 방 데이터
const dummyRoomData = computed(() => ({
  id: props.roomId,
  title: '테스트 게임방',
  gameMode: 'roadview',
  isTeamMode: false,
  maxPlayers: 8,
  totalRounds: 5,
  timeLimit: 180,
  isPrivate: false,
  password: '',
  hostId: currentUserId,
  currentPlayerCount: dummyPlayers.value.length,
  createdAt: new Date().toISOString(),
  poiNameVisible: true
}));

// 더미 플레이어 목록
const dummyPlayers = ref([
  {
    id: 'user123',
    nickname: '테스트 방장',
    profileImage: 'https://via.placeholder.com/40',
    isHost: true,
    isReady: true,
    teamId: null
  },
  {
    id: 'user456',
    nickname: '플레이어2',
    profileImage: 'https://via.placeholder.com/40',
    isHost: false,
    isReady: true,
    teamId: null
  },
  {
    id: 'user789',
    nickname: '플레이어3',
    profileImage: 'https://via.placeholder.com/40',
    isHost: false,
    isReady: false,
    teamId: null
  },
  {
    id: 'user101',
    nickname: '플레이어4',
    profileImage: 'https://via.placeholder.com/40',
    isHost: false,
    isReady: true,
    teamId: null
  }
]);

// 더미 채팅 메시지
const dummyChatMessages = ref([
  {
    id: 'msg1',
    sender: '시스템',
    senderId: 'system',
    message: '게임방에 입장했습니다.',
    timestamp: Date.now() - 60000,
    system: true,
    messageType: 'SYSTEM'
  },
  {
    id: 'msg2',
    sender: '플레이어2',
    senderId: 'user456',
    message: '안녕하세요! 다들 준비되셨나요?',
    timestamp: Date.now() - 30000,
    system: false,
    messageType: 'CHAT'
  },
  {
    id: 'msg3',
    sender: '플레이어3',
    senderId: 'user789',
    message: '네! 열심히 해봐요~',
    timestamp: Date.now() - 10000,
    system: false,
    messageType: 'CHAT'
  }
]);

// 메서드
const handleOpenSettings = () => {
  console.log('방 설정 열기');
};

const handleToggleChat = () => {
  emit('toggle-chat');
};

const handleLeaveRoom = () => {
  console.log('방 나가기');
};

const handleStartGame = () => {
  console.log('게임 시작');
};

const handleShowPlayerDetails = (player) => {
  console.log('플레이어 상세:', player);
};

const handleKickPlayer = (player) => {
  console.log('플레이어 강퇴:', player);
};

const handleSendMessage = () => {
  if (!chatInput.value.trim()) return;
  
  const newMessage = {
    id: `msg-${Date.now()}`,
    sender: '테스트 방장',
    senderId: currentUserId,
    message: chatInput.value,
    timestamp: Date.now(),
    system: false,
    messageType: 'CHAT'
  };
  
  dummyChatMessages.value.push(newMessage);
  chatInput.value = '';
  
  // 스크롤을 맨 아래로
  setTimeout(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  }, 100);
};
</script>

<style scoped>
.multiplayer-room-waiting {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  padding: var(--spacing-md);
  padding-top: 5rem;
  overflow: hidden;
}

.mode-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background);
  z-index: -1;
  transition: background-color var(--transition-slow);
}

.room-content {
  display: flex;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
}

.left-panel {
  flex: 0 0 65%;
  max-width: 65%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.right-panel {
  flex: 0 0 35%;
  max-width: 35%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
}

.panel-section {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
  transition: all var(--transition-normal);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-title i {
  color: var(--color-primary);
  font-size: 1.1rem;
}

.chat-panel {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.chat-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.chat-close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.chat-title {
  font-family: var(--font-heading);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-h3);
  font-weight: 700;
  position: relative;
}

.chat-title i {
  font-size: 1.25rem;
}

.chat-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-small);
  opacity: 0.95;
}

.online-indicator {
  color: var(--color-success);
  font-size: 0.6rem;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.chat-input-container {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-hover);
}

.chat-input {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  outline: none;
  transition: all var(--transition-normal);
  background: var(--color-surface);
}

.chat-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.chat-input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.send-button {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.send-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.send-button:active {
  transform: translateY(0);
}

.send-button i {
  font-size: 1rem;
}

.right-panel.hidden-mobile {
  display: none;
}

/* Responsive design */
@media (max-width: 1024px) {
  .room-content {
    flex-direction: column;
    gap: 1rem;
    position: relative;
  }

  .left-panel {
    flex: none;
    max-width: 100%;
    height: auto;
    min-height: 50vh;
  }

  .right-panel {
    flex: 1;
    max-width: 100%;
    min-width: 0;
    min-height: 45vh;
  }

  .panel-section {
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .right-panel:not(.hidden-mobile) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.5);
    padding: 1rem;
    transform: translateX(0);
  }

  .right-panel:not(.hidden-mobile) .chat-panel {
    max-width: 500px;
    width: 100%;
    height: 100%;
    margin: 0 auto;
  }
}
</style>

