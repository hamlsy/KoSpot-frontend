<template>
  <div class="hud-lobby">
    <!-- 배경 효과 -->
    <div class="hud-bg-grid"></div>
    <div class="hud-bg-scanline"></div>
    
    <!-- 헤더 -->
    <header class="hud-header">
      <div class="hud-header-border">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
      </div>
      
      <div class="header-content">
        <button class="hud-back-btn" @click="$router.push('/main')">
          <i class="fas fa-chevron-left"></i>
          <span>EXIT</span>
        </button>
        
        <div class="header-center">
          <div class="logo-section">
            <div class="logo-icon">
              <i class="fas fa-globe-asia"></i>
            </div>
            <div class="logo-text">
              <span class="logo-main">KOSPOT</span>
              <span class="logo-sub">MULTIPLAYER LOBBY</span>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <div class="online-status">
            <span class="status-dot"></span>
            <span class="status-text">ONLINE</span>
          </div>
        </div>
      </div>
    </header>
    
    <!-- 메인 콘텐츠 -->
    <main class="hud-main">
      <div class="main-layout">
        <!-- 좌측: 방 목록 -->
        <div class="left-panel">
          <RoomListHUD
            :rooms="rooms"
            :loading="isLoading"
            @refresh-rooms="refreshRooms"
            @join-room="joinRoom"
          />
          
          <!-- 방 생성 버튼 -->
          <button class="hud-create-btn" @click="showCreateRoomModal = true">
            <div class="btn-glow"></div>
            <div class="btn-content">
              <i class="fas fa-plus"></i>
              <span>CREATE NEW ROOM</span>
            </div>
          </button>
        </div>
        
        <!-- 우측: 채팅 (데스크탑) -->
        <div class="right-panel" :class="{ 'mobile-visible': isChatVisible }">
          <div class="hud-chat-panel">
            <div class="chat-border">
              <div class="corner corner-tl"></div>
              <div class="corner corner-tr"></div>
              <div class="corner corner-bl"></div>
              <div class="corner corner-br"></div>
            </div>
            <div class="chat-scanline"></div>
            
            <div class="chat-header">
              <div class="chat-title">
                <i class="fas fa-satellite-dish"></i>
                <span>GLOBAL CHAT</span>
              </div>
              <div class="chat-status">
                <span class="online-count">{{ onlineCount }} ONLINE</span>
              </div>
              <button v-if="isMobile" class="chat-close" @click="isChatVisible = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="chat-messages" ref="chatMessagesRef">
              <div 
                v-for="(msg, idx) in chatMessages" 
                :key="idx"
                class="chat-message"
                :class="{ 'system': msg.system, 'own': msg.senderId === currentUserId }"
              >
                <template v-if="msg.system">
                  <span class="system-text">{{ msg.message }}</span>
                </template>
                <template v-else>
                  <span class="msg-sender">{{ msg.sender }}</span>
                  <span class="msg-text">{{ msg.message }}</span>
                </template>
              </div>
            </div>
            
            <div class="chat-input-area">
              <input
                type="text"
                v-model="chatInput"
                placeholder="ENTER MESSAGE..."
                @keyup.enter="sendChatMessage"
              />
              <button class="send-btn" @click="sendChatMessage">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 모바일 채팅 토글 -->
    <button 
      v-if="isMobile && !isChatVisible"
      class="mobile-chat-toggle"
      @click="isChatVisible = true"
    >
      <i class="fas fa-comments"></i>
      <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
    </button>
    
    <!-- 방 생성 모달 -->
    <CreateRoomModalHUD
      v-if="showCreateRoomModal"
      @close="showCreateRoomModal = false"
      @create-room="createRoom"
    />
    
    <!-- 로딩 오버레이 -->
    <div v-if="isJoining" class="hud-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <p class="loading-text">CONNECTING TO ROOM...</p>
      </div>
    </div>
    
    <!-- 에러 토스트 -->
    <transition name="toast">
      <div v-if="roomError" class="hud-error-toast">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ roomError }}</span>
        <button @click="clearError">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import RoomListHUD from '../components/hud/RoomListHUD.vue';
import CreateRoomModalHUD from '../components/hud/CreateRoomModalHUD.vue';

const router = useRouter();

// 반응형
const isMobile = ref(false);
const isChatVisible = ref(false);

// 데이터
const rooms = ref([]);
const isLoading = ref(false);
const isJoining = ref(false);
const roomError = ref('');
const showCreateRoomModal = ref(false);
const chatInput = ref('');
const chatMessages = ref([]);
const chatMessagesRef = ref(null);
const unreadCount = ref(0);

// 더미 데이터
const currentUserId = 'user-123';
const onlineCount = computed(() => 42);

// 더미 방 데이터
const dummyRooms = [
  {
    gameRoomId: 1,
    title: '초보자 환영! 같이 놀아요',
    hostNickname: 'MapMaster',
    gameMode: '로드뷰',
    gameType: '개인전',
    currentPlayerCount: 3,
    maxPlayers: 8,
    privateRoom: false,
    gameRoomStatus: 'WAITING'
  },
  {
    gameRoomId: 2,
    title: '고수만 입장',
    hostNickname: 'ProGamer123',
    gameMode: '로드뷰',
    gameType: '개인전',
    currentPlayerCount: 6,
    maxPlayers: 6,
    privateRoom: true,
    gameRoomStatus: 'WAITING'
  },
  {
    gameRoomId: 3,
    title: '한국 지리왕 결정전',
    hostNickname: 'GeoKing',
    gameMode: '로드뷰',
    gameType: '개인전',
    currentPlayerCount: 5,
    maxPlayers: 8,
    privateRoom: false,
    gameRoomStatus: 'PLAYING'
  },
  {
    gameRoomId: 4,
    title: '친목방',
    hostNickname: 'FriendlyHost',
    gameMode: '로드뷰',
    gameType: '개인전',
    currentPlayerCount: 2,
    maxPlayers: 4,
    privateRoom: true,
    gameRoomStatus: 'WAITING'
  }
];

// 더미 채팅 데이터
const dummyChatMessages = [
  { sender: 'SYSTEM', message: 'Welcome to the Global Lobby', system: true },
  { sender: 'MapMaster', senderId: 'user-1', message: '안녕하세요!' },
  { sender: 'GeoKing', senderId: 'user-2', message: '같이 게임하실 분?' },
  { sender: 'ProGamer', senderId: 'user-3', message: '저요!' }
];

// 메서드
const checkMobileView = () => {
  isMobile.value = window.innerWidth <= 1024;
  if (!isMobile.value) {
    isChatVisible.value = false;
  }
};

const refreshRooms = () => {
  isLoading.value = true;
  setTimeout(() => {
    rooms.value = [...dummyRooms];
    isLoading.value = false;
  }, 500);
};

const joinRoom = (room, password = null) => {
  console.log('Joining room:', room, password);
  isJoining.value = true;
  
  setTimeout(() => {
    isJoining.value = false;
    // 실제로는 RoomView로 이동
    alert(`Room "${room.title}" 입장 (테스트 모드)`);
  }, 1000);
};

const createRoom = (roomData) => {
  console.log('Creating room:', roomData);
  showCreateRoomModal.value = false;
  isJoining.value = true;
  
  setTimeout(() => {
    isJoining.value = false;
    alert(`Room "${roomData.title}" 생성 완료 (테스트 모드)`);
  }, 1000);
};

const sendChatMessage = () => {
  if (!chatInput.value.trim()) return;
  
  chatMessages.value.push({
    sender: 'You',
    senderId: currentUserId,
    message: chatInput.value
  });
  
  chatInput.value = '';
  
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
};

const clearError = () => {
  roomError.value = '';
};

onMounted(() => {
  checkMobileView();
  window.addEventListener('resize', checkMobileView);
  
  // 초기 데이터 로드
  rooms.value = [...dummyRooms];
  chatMessages.value = [...dummyChatMessages];
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobileView);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

.hud-lobby {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  font-family: 'Orbitron', monospace;
  position: relative;
  overflow: hidden;
}

/* 배경 효과 */
.hud-bg-grid {
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.hud-bg-scanline {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(34, 211, 238, 0.01) 2px,
    rgba(34, 211, 238, 0.01) 4px
  );
  pointer-events: none;
}

/* 헤더 */
.hud-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: linear-gradient(180deg, rgba(12, 18, 34, 0.98) 0%, rgba(12, 18, 34, 0.9) 100%);
  backdrop-filter: blur(10px);
  z-index: 100;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
}

.hud-header-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #22d3ee;
}

.corner-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.corner-tr { top: 0; right: 0; border-left: none; border-bottom: none; }
.corner-bl { bottom: 0; left: 0; border-right: none; border-top: none; }
.corner-br { bottom: 0; right: 0; border-left: none; border-top: none; }

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  height: 100%;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hud-back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  color: #22d3ee;
  padding: 0.5rem 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  letter-spacing: 0.1em;
}

.hud-back-btn:hover {
  background: rgba(34, 211, 238, 0.2);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%);
  border: 1px solid rgba(34, 211, 238, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.logo-icon i {
  font-size: 1.1rem;
  color: #22d3ee;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-main {
  font-size: 1.1rem;
  font-weight: 800;
  color: #22d3ee;
  letter-spacing: 0.2em;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
}

.logo-sub {
  font-size: 0.55rem;
  color: #64748b;
  letter-spacing: 0.15em;
}

.header-right {
  display: flex;
  align-items: center;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.2);
  padding: 0.4rem 0.75rem;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #22d3ee;
  border-radius: 50%;
  box-shadow: 0 0 10px #22d3ee;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 0.65rem;
  font-weight: 600;
  color: #22d3ee;
  letter-spacing: 0.1em;
}

/* 메인 콘텐츠 */
.hud-main {
  padding: 90px 1.5rem 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
}

.main-layout {
  display: flex;
  gap: 1.5rem;
  height: calc(100vh - 110px);
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.right-panel {
  width: 350px;
  flex-shrink: 0;
}

/* 방 생성 버튼 */
.hud-create-btn {
  position: relative;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(34, 211, 238, 0.05) 100%);
  border: 2px solid rgba(34, 211, 238, 0.5);
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  overflow: hidden;
}

.btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.hud-create-btn:hover .btn-glow {
  transform: translateX(100%);
}

.hud-create-btn:hover {
  border-color: #22d3ee;
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.3);
}

.btn-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #22d3ee;
  font-family: 'Orbitron', monospace;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.btn-content i {
  font-size: 1rem;
}

/* 채팅 패널 */
.hud-chat-panel {
  position: relative;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.chat-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hud-chat-panel .corner {
  border-color: #a78bfa;
}

.chat-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(167, 139, 250, 0.02) 2px,
    rgba(167, 139, 250, 0.02) 4px
  );
  pointer-events: none;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.2);
  position: relative;
  z-index: 1;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #a78bfa;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.chat-title i {
  font-size: 0.9rem;
}

.chat-status {
  margin-left: auto;
}

.online-count {
  font-size: 0.6rem;
  color: #64748b;
  letter-spacing: 0.1em;
}

.chat-close {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-close:hover {
  background: rgba(239, 68, 68, 0.2);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: relative;
  z-index: 1;
}

.chat-messages::-webkit-scrollbar {
  width: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #a78bfa;
}

.chat-message {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  background: rgba(167, 139, 250, 0.05);
  border-left: 2px solid rgba(167, 139, 250, 0.3);
}

.chat-message.system {
  background: rgba(34, 211, 238, 0.05);
  border-left-color: rgba(34, 211, 238, 0.3);
}

.chat-message.own {
  background: rgba(34, 211, 238, 0.1);
  border-left-color: #22d3ee;
}

.system-text {
  color: #22d3ee;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
  font-style: italic;
}

.msg-sender {
  color: #a78bfa;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.msg-text {
  color: #e2e8f0;
  font-size: 0.7rem;
  word-break: break-word;
}

.chat-input-area {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid rgba(167, 139, 250, 0.2);
  position: relative;
  z-index: 1;
}

.chat-input-area input {
  flex: 1;
  background: rgba(167, 139, 250, 0.05);
  border: 1px solid rgba(167, 139, 250, 0.3);
  padding: 0.6rem 0.85rem;
  color: #e2e8f0;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  outline: none;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.chat-input-area input:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 15px rgba(167, 139, 250, 0.2);
}

.chat-input-area input::placeholder {
  color: #475569;
}

.send-btn {
  width: 40px;
  height: 40px;
  background: rgba(167, 139, 250, 0.2);
  border: 1px solid rgba(167, 139, 250, 0.5);
  color: #a78bfa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.send-btn:hover {
  background: rgba(167, 139, 250, 0.3);
  box-shadow: 0 0 15px rgba(167, 139, 250, 0.3);
}

/* 모바일 채팅 토글 */
.mobile-chat-toggle {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.3) 0%, rgba(167, 139, 250, 0.1) 100%);
  border: 2px solid rgba(167, 139, 250, 0.5);
  color: #a78bfa;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  z-index: 50;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  transition: all 0.3s ease;
}

.mobile-chat-toggle:hover {
  box-shadow: 0 0 30px rgba(167, 139, 250, 0.4);
}

.unread-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 700;
}

/* 로딩 오버레이 */
.hud-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 34, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-top-color: #22d3ee;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(2) {
  inset: 8px;
  border-top-color: #a78bfa;
  animation-duration: 1.2s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  inset: 16px;
  border-top-color: #fbbf24;
  animation-duration: 0.9s;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #22d3ee;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 에러 토스트 */
.hud-error-toast {
  position: fixed;
  top: 90px;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
  border: 1px solid rgba(239, 68, 68, 0.5);
  padding: 0.85rem 1.25rem;
  color: #ef4444;
  font-size: 0.75rem;
  z-index: 1000;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.hud-error-toast i {
  font-size: 1rem;
}

.hud-error-toast button {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 반응형 */
@media (max-width: 1024px) {
  .right-panel {
    position: fixed;
    top: 70px;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 400px;
    z-index: 200;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .right-panel.mobile-visible {
    transform: translateX(0);
  }
  
  .mobile-chat-toggle {
    display: flex;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }
  
  .header-center {
    position: static;
    transform: none;
  }
  
  .logo-text {
    display: none;
  }
  
  .hud-back-btn span {
    display: none;
  }
  
  .hud-main {
    padding: 80px 1rem 1rem;
  }
  
  .main-layout {
    height: auto;
    min-height: calc(100vh - 100px);
  }
  
  .hud-create-btn {
    padding: 0.85rem 1rem;
  }
  
  .btn-content {
    font-size: 0.75rem;
  }
}
</style>

