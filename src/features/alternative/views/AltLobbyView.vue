<template>
  <div class="alt-lobby-app">
    <AltNavigationBar 
      :is-logged-in="isLoggedIn"
      :user-info="userProfile"
      @open-tutorial="showTutorial = true"
      @logout="handleLogout"
    />

    <main class="alt-lobby-content">
      <div class="alt-container">
        <!-- Page Header -->
        <div class="alt-page-header">
          <button class="alt-back-button" @click="$router.push({ name: 'AltMainView' })">
            <i class="fas fa-arrow-left"></i>
            <span>돌아가기</span>
          </button>
          <h1 class="alt-h1">
            <i class="fas fa-users" style="margin-right: 1rem;"></i>
            <span class="alt-gradient-text">멀티플레이어 로비</span>
          </h1>
        </div>

        <!-- Mobile Chat Toggle -->
        <button 
          v-if="isMobile" 
          class="alt-chat-toggle" 
          @click="isChatVisible = !isChatVisible"
        >
          <i class="fas" :class="isChatVisible ? 'fa-times' : 'fa-comments'"></i>
          <span>{{ isChatVisible ? '채팅 닫기' : '채팅 열기' }}</span>
        </button>

        <div class="alt-lobby-layout">
          <!-- Left: Room List - Masonry Style -->
          <div class="alt-rooms-panel" :class="{ 'alt-hidden': isChatVisible && isMobile }">
            <div class="alt-rooms-header">
              <h2 class="alt-h2">게임 방 목록</h2>
              <button class="alt-btn alt-btn-accent" @click="refreshRooms">
                <i class="fas fa-sync-alt"></i>
                <span>새로고침</span>
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="alt-rooms-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <span>방 목록을 불러오는 중...</span>
            </div>

            <!-- Room Grid - Masonry -->
            <div v-else class="alt-rooms-grid">
              <div 
                v-for="(room, index) in rooms" 
                :key="room.id"
                class="alt-room-card alt-stagger-item"
                :style="{ animationDelay: `${index * 0.05}s` }"
                @click="joinRoom(room.id)"
              >
                <div class="alt-room-header">
                  <h3 class="alt-room-title">{{ room.name }}</h3>
                  <span class="alt-room-status" :class="room.status">
                    {{ room.status === 'WAITING' ? '대기중' : '게임중' }}
                  </span>
                </div>
                <div class="alt-room-info">
                  <span class="alt-room-mode">
                    <i class="fas fa-gamepad"></i>
                    {{ room.gameMode }}
                  </span>
                  <span class="alt-room-players">
                    <i class="fas fa-user"></i>
                    {{ room.currentPlayers }} / {{ room.maxPlayers }}
                  </span>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="rooms.length === 0" class="alt-rooms-empty">
                <i class="fas fa-inbox"></i>
                <p>생성된 방이 없습니다</p>
                <p class="alt-body">첫 번째 방을 만들어보세요!</p>
              </div>
            </div>

            <!-- Create Room Button -->
            <button class="alt-btn alt-btn-large alt-btn-primary alt-create-room-btn" @click="showCreateRoomModal = true">
              <i class="fas fa-plus-circle"></i>
              <span>새 게임방 만들기</span>
            </button>
          </div>

          <!-- Right: Chat - Floating Panel -->
          <div class="alt-chat-panel" :class="{ 'alt-visible': isChatVisible || !isMobile }">
            <div class="alt-chat-header">
              <h3 class="alt-h3">로비 채팅</h3>
              <button v-if="isMobile" class="alt-chat-close" @click="isChatVisible = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="alt-chat-messages">
              <div 
                v-for="msg in formattedChatMessages" 
                :key="msg.id"
                class="alt-chat-message"
                :class="{ 'alt-own': msg.senderId === getCurrentUserId() }"
              >
                <div class="alt-message-author">{{ msg.senderName }}</div>
                <div class="alt-message-content">{{ msg.content }}</div>
                <div class="alt-message-time">{{ msg.time }}</div>
              </div>
            </div>
            <div class="alt-chat-input">
              <input 
                v-model="chatInput"
                @keypress.enter="sendChatMessage"
                placeholder="메시지를 입력하세요..."
              />
              <button @click="sendChatMessage" class="alt-btn alt-btn-primary">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Room Modal -->
    <CreateRoomModal 
      v-if="showCreateRoomModal" 
      @close="showCreateRoomModal = false"
      @create-room="createRoom"
    />

    <!-- Loading Overlay -->
    <transition name="alt-fade">
      <div v-if="isJoining" class="alt-overlay">
        <div class="alt-loading-content">
          <i class="fas fa-spinner fa-spin"></i>
          <p>방에 입장 중...</p>
        </div>
      </div>
    </transition>

    <!-- Error Toast -->
    <transition name="alt-fade">
      <div v-if="roomError" class="alt-toast alt-toast-error">
        {{ roomError }}
        <button @click="clearError" class="alt-toast-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/core/composables/useAuth.js';
import AltNavigationBar from '@/features/alternative/components/AltNavigationBar.vue';
import CreateRoomModal from '@/features/game/multiplayer/lobby/components/CreateRoomModal.vue';
import useGlobalLobbyWebSocketService from '@/features/game/multiplayer/lobby/services/useGlobalLobbyWebSocketService';
import { useLobbyRoom } from '@/features/game/multiplayer/lobby/composables/useLobbyRoom.js';

const router = useRouter();
const { logout: logoutAuth } = useAuth();

const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));
const isMobile = ref(window.innerWidth <= 768);
const isChatVisible = ref(false);
const showCreateRoomModal = ref(false);
const chatInput = ref('');

const userProfile = ref({
  name: "사용자",
  email: "user@example.com",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
});

const lobbyService = useGlobalLobbyWebSocketService();

const {
  rooms,
  isLoading,
  error: roomError,
  isJoining,
  joinRoom,
  createRoom,
  loadRooms,
  clearError
} = useLobbyRoom(lobbyService);

const chatMessages = ref([]);

const formattedChatMessages = computed(() => {
  return chatMessages.value.map(msg => ({
    ...msg,
    time: new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }));
});

function getCurrentUserId() {
  return localStorage.getItem('memberId') || '';
}

function refreshRooms() {
  loadRooms();
}

function sendChatMessage() {
  if (!chatInput.value.trim()) return;
  
  lobbyService.sendMessage({
    type: 'CHAT',
    content: chatInput.value,
    senderId: getCurrentUserId(),
    senderName: userProfile.value.name
  });
  
  chatInput.value = '';
}

function handleLogout() {
  logoutAuth();
  router.push({ name: 'AltMainView' });
}

function handleResize() {
  isMobile.value = window.innerWidth <= 768;
}

onMounted(() => {
  if (!isLoggedIn.value) {
    alert('로그인한 사용자만 접근할 수 있습니다.');
    router.push({ name: 'AltMainView' });
    return;
  }

  loadRooms();
  lobbyService.connect();
  
  lobbyService.onMessage((message) => {
    if (message.type === 'CHAT') {
      chatMessages.value.push({
        id: Date.now(),
        ...message,
        timestamp: Date.now()
      });
    } else if (message.type === 'ROOM_UPDATE') {
      loadRooms();
    }
  });

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  lobbyService.disconnect();
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

.alt-lobby-app {
  min-height: 100vh;
  background: var(--alt-bg-base);
}

.alt-lobby-content {
  padding: var(--alt-space-lg) 0 var(--alt-space-2xl);
}

.alt-page-header {
  margin-bottom: var(--alt-space-xl);
}

.alt-back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--alt-space-xs);
  padding: 0.75rem 1.5rem;
  background: var(--alt-surface);
  border: 2px solid var(--alt-primary);
  border-radius: var(--alt-radius-md);
  color: var(--alt-primary);
  font-family: var(--alt-font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--alt-transition-base);
  margin-bottom: var(--alt-space-md);
}

.alt-back-button:hover {
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  transform: translateX(-4px);
}

.alt-chat-toggle {
  display: flex;
  align-items: center;
  gap: var(--alt-space-xs);
  padding: var(--alt-space-sm) var(--alt-space-md);
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  border: none;
  border-radius: var(--alt-radius-md);
  font-weight: 600;
  cursor: pointer;
  margin-bottom: var(--alt-space-md);
}

.alt-lobby-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--alt-space-xl);
}

.alt-rooms-panel {
  display: flex;
  flex-direction: column;
  gap: var(--alt-space-md);
}

.alt-rooms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--alt-space-md);
}

.alt-rooms-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--alt-space-sm);
  padding: var(--alt-space-xl);
  color: var(--alt-text-muted);
}

.alt-rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--alt-space-md);
  margin-bottom: var(--alt-space-md);
}

.alt-room-card {
  padding: var(--alt-space-md);
  background: var(--alt-surface);
  border-radius: var(--alt-radius-md);
  box-shadow: var(--alt-surface-shadow);
  cursor: pointer;
  transition: all var(--alt-transition-base);
}

.alt-room-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--alt-surface-shadow-hover);
}

.alt-room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--alt-space-sm);
}

.alt-room-title {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h3);
  margin: 0;
  color: var(--alt-text-primary);
}

.alt-room-status {
  padding: 0.25rem 0.75rem;
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  font-size: var(--alt-font-small);
  font-weight: 700;
  text-transform: uppercase;
  border-radius: var(--alt-radius-full);
}

.alt-room-status.PLAYING {
  background: var(--alt-korea-red);
}

.alt-room-info {
  display: flex;
  gap: var(--alt-space-md);
  color: var(--alt-text-muted);
  font-size: var(--alt-font-small);
}

.alt-rooms-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--alt-space-2xl);
  color: var(--alt-text-muted);
}

.alt-rooms-empty i {
  font-size: 4rem;
  margin-bottom: var(--alt-space-md);
  opacity: 0.5;
}

.alt-create-room-btn {
  width: 100%;
}

.alt-chat-panel {
  position: sticky;
  top: calc(80px + var(--alt-space-md));
  height: calc(100vh - 180px);
  background: var(--alt-surface);
  border-radius: var(--alt-radius-lg);
  box-shadow: var(--alt-surface-shadow);
  display: flex;
  flex-direction: column;
}

.alt-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--alt-space-md);
  border-bottom: 2px solid rgba(14, 165, 233, 0.2);
}

.alt-chat-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 165, 233, 0.1);
  border: none;
  border-radius: var(--alt-radius-md);
  color: var(--alt-primary);
  cursor: pointer;
}

.alt-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--alt-space-md);
  display: flex;
  flex-direction: column;
  gap: var(--alt-space-sm);
}

.alt-chat-message {
  padding: var(--alt-space-sm) var(--alt-space-md);
  background: rgba(14, 165, 233, 0.1);
  border-radius: var(--alt-radius-md);
  max-width: 80%;
}

.alt-chat-message.alt-own {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  color: var(--alt-text-secondary);
}

.alt-message-author {
  font-size: var(--alt-font-small);
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.alt-message-content {
  font-size: var(--alt-font-body);
}

.alt-message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

.alt-chat-input {
  display: flex;
  gap: var(--alt-space-xs);
  padding: var(--alt-space-md);
  border-top: 2px solid rgba(14, 165, 233, 0.2);
}

.alt-chat-input input {
  flex: 1;
  padding: var(--alt-space-sm) var(--alt-space-md);
  background: rgba(14, 165, 233, 0.05);
  border: 2px solid rgba(14, 165, 233, 0.2);
  border-radius: var(--alt-radius-md);
  color: var(--alt-text-primary);
  font-family: var(--alt-font-body);
}

.alt-chat-input input:focus {
  outline: none;
  border-color: var(--alt-primary);
}

.alt-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--alt-space-md);
  color: var(--alt-text-secondary);
  font-size: var(--alt-font-body-large);
}

.alt-loading-content i {
  font-size: 3rem;
}

.alt-toast-error {
  background: var(--alt-korea-red);
  color: var(--alt-text-secondary);
}

.alt-toast-close {
  margin-left: var(--alt-space-md);
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: var(--alt-radius-sm);
  color: inherit;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .alt-lobby-layout {
    grid-template-columns: 1fr;
  }

  .alt-chat-panel {
    display: none;
  }

  .alt-chat-panel.alt-visible {
    display: flex;
    position: fixed;
    inset: 80px 0 0 0;
    z-index: var(--alt-z-modal);
    border-radius: 0;
    height: auto;
  }

  .alt-rooms-panel.alt-hidden {
    display: none;
  }
}

@media (max-width: 768px) {
  .alt-rooms-grid {
    grid-template-columns: 1fr;
  }
}
</style>

