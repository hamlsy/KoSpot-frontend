<template>
  <div class="multiplayer-container">
    <!-- 헤더 -->
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="handleBack">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="logo-container">
          <img src="/images/logo/kospot_logo_1-removebg.png" alt="KoSpot" class="header-logo" />
        </div>
        <div class="header-right">
          <h3>멀티플레이어 로비</h3>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 모바일 채팅 토글 버튼 -->
      <button 
        v-if="isMobile" 
        class="chat-toggle-button" 
        @click="handleToggleChat"
        :class="{ 'active': isChatVisible }"
      >
        <i class="fas" :class="isChatVisible ? 'fa-times' : 'fa-comments'"></i>
        <span>{{ isChatVisible ? '채팅 닫기' : '채팅 열기' }}</span>
      </button>

      <div class="lobby-layout">
        <!-- 왼쪽 패널: 게임 방 목록 -->
        <div class="left-panel">
          <GameRoomList 
            :rooms="dummyRooms" 
            :loading="false"
            @join-room="handleJoinRoom"
            @refresh-rooms="handleRefreshRooms"
            @load-more="handleLoadMore"
            class="game-room-list"
            :class="{ 'chat-open': isChatVisible && isMobile }"
          />
          <!-- 새 게임방 만들기 버튼 -->
          <button class="create-room-button" @click="showCreateRoomModal = true">
            <i class="fas fa-plus"></i> 새 게임방 만들기
          </button>
        </div>

        <!-- 오른쪽 패널: 채팅 -->
        <div 
          class="right-panel" 
          :class="{ 'mobile-visible': isChatVisible, 'mobile-hidden': !isChatVisible }"
        >
          <ChatWindow 
            :messages="dummyChatMessages" 
            @send-message="handleSendMessage"
            :current-user-id="currentUserId"
            :show-mobile-close="isMobile"
            @close="isChatVisible = false"
          />
        </div>
      </div>
    </main>

    <!-- 방 생성 모달 -->
    <CreateRoomModal 
      v-if="showCreateRoomModal" 
      @close="showCreateRoomModal = false"
      @create-room="handleCreateRoom"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import GameRoomList from '@/features/game/multiplayer/lobby/components/RoomList.vue';
import ChatWindow from '@/features/game/multiplayer/chat/components/Lobby/ChatWindow.vue';
import CreateRoomModal from '@/features/game/multiplayer/lobby/components/CreateRoomModal.vue';

const props = defineProps({
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

// 상태
const showCreateRoomModal = ref(false);
const currentUserId = 'user-123';

// 더미 방 데이터
const dummyRooms = ref([
  {
    gameRoomId: 1,
    title: '🏙️ 서울 시내 투어방',
    gameMode: '로드뷰',
    gameType: '개인전',
    maxPlayers: 4,
    timeLimit: 60,
    totalRounds: 5,
    currentPlayerCount: 2,
    hostNickname: '김서울',
    privateRoom: false,
    gameRoomStatus: 'WAITING'
  },
  {
    gameRoomId: 2,
    title: '📸 부산 맛집 포토존',
    gameMode: '로드뷰',
    gameType: '개인전',
    maxPlayers: 6,
    timeLimit: 90,
    totalRounds: 3,
    currentPlayerCount: 4,
    hostNickname: '부산갈매기',
    privateRoom: false,
    gameRoomStatus: 'WAITING'
  },
  {
    gameRoomId: 3,
    title: '🎮 제주 관광지 랜덤게임',
    gameMode: '로드뷰',
    gameType: '개인전',
    maxPlayers: 8,
    timeLimit: 45,
    totalRounds: 7,
    currentPlayerCount: 6,
    hostNickname: '제주감귤',
    privateRoom: false,
    gameRoomStatus: 'PLAYING'
  },
  {
    gameRoomId: 4,
    title: '🔒 VIP 전용 경기도 탐험',
    gameMode: '로드뷰',
    gameType: '개인전',
    maxPlayers: 4,
    timeLimit: 120,
    totalRounds: 5,
    currentPlayerCount: 3,
    hostNickname: '경기마스터',
    privateRoom: true,
    gameRoomStatus: 'WAITING'
  },
  {
    gameRoomId: 5,
    title: '초보자 환영! 같이 놀아요',
    gameMode: '로드뷰',
    gameType: '개인전',
    maxPlayers: 8,
    timeLimit: 180,
    totalRounds: 5,
    currentPlayerCount: 1,
    hostNickname: 'MapMaster',
    privateRoom: false,
    gameRoomStatus: 'WAITING'
  }
]);

// 더미 채팅 메시지
const dummyChatMessages = ref([
  {
    id: 'msg1',
    sender: '시스템',
    senderId: 'system',
    message: '전역 채팅에 입장했습니다.',
    timestamp: Date.now() - 120000,
    system: true,
    messageType: 'SYSTEM'
  },
  {
    id: 'msg2',
    sender: '김서울',
    senderId: 'user1',
    message: '안녕하세요! 방 만들어서 같이 게임하실 분?',
    timestamp: Date.now() - 90000,
    system: false,
    messageType: 'CHAT'
  },
  {
    id: 'msg3',
    sender: '부산갈매기',
    senderId: 'user2',
    message: '저요! 부산 방에 들어갈게요~',
    timestamp: Date.now() - 60000,
    system: false,
    messageType: 'CHAT'
  },
  {
    id: 'msg4',
    sender: '제주감귤',
    senderId: 'user3',
    message: '제주 방도 있으니 많이 참여해주세요!',
    timestamp: Date.now() - 30000,
    system: false,
    messageType: 'CHAT'
  }
]);

// 메서드
const handleBack = () => {
  console.log('뒤로가기');
};

const handleToggleChat = () => {
  emit('toggle-chat');
};

const handleJoinRoom = (room) => {
  console.log('방 입장:', room);
};

const handleRefreshRooms = () => {
  console.log('방 목록 새로고침');
};

const handleLoadMore = () => {
  console.log('더 많은 방 로드');
};

const handleSendMessage = (message) => {
  if (!message.trim()) return;
  
  const newMessage = {
    id: `msg-${Date.now()}`,
    sender: '테스트유저',
    senderId: currentUserId,
    message: message,
    timestamp: Date.now(),
    system: false,
    messageType: 'CHAT'
  };
  
  dummyChatMessages.value.push(newMessage);
};

const handleCreateRoom = (roomData) => {
  console.log('방 생성:', roomData);
  showCreateRoomModal.value = false;
};
</script>

<style scoped>
.multiplayer-container {
  min-height: 100vh;
  padding-bottom: 40px;
  position: relative;
  font-family: var(--font-body);
  background-color: var(--color-background);
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
  transition: all var(--transition-normal);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-button {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: rgba(37, 99, 235, 0.05);
  border: 1px solid rgba(37, 99, 235, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.back-button:hover {
  background: var(--color-primary);
  color: white;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.logo-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header-logo {
  height: 50px;
  width: auto;
  filter: drop-shadow(0 2px 8px rgba(37, 99, 235, 0.15));
  transition: transform var(--transition-normal);
}

.header-logo:hover {
  transform: scale(1.05);
}

.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header-right h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.main-content {
  padding: 100px var(--spacing-xl) var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.lobby-layout {
  display: flex;
  gap: 1.5rem;
  position: relative;
  height: calc(100vh - 120px);
  max-height: 700px;
  margin-top: 1rem;
  animation: fadeIn 0.5s ease-out;
}

.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.right-panel {
  display: flex;
  flex-direction: column;
  width: 30%;
  min-width: 300px;
}

.create-room-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.1rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  width: 100%;
  margin-top: auto;
}

.create-room-button i {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.create-room-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
}

.create-room-button:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.chat-toggle-button {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  padding: 12px 20px;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  z-index: 50;
}

.chat-toggle-button i {
  margin-right: 8px;
}

.chat-toggle-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.chat-toggle-button.active {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
}

.game-room-list {
  width: 100%;
  transition: all 0.3s ease;
  z-index: 10;
}

.game-room-list.chat-open {
  opacity: 0;
  pointer-events: none;
}

.right-panel {
  width: 100%;
  min-width: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  z-index: 20;
  transition: all 0.3s ease;
}

.right-panel.mobile-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateX(100%);
}

.right-panel.mobile-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
}

@media (max-width: 900px) {
  .lobby-layout {
    flex-direction: column;
    height: auto;
    max-height: none;
    position: relative;
    overflow: hidden;
  }
}

@media (max-width: 640px) {
  .header-content {
    padding: 0.6rem 0.8rem;
  }
  
  .header-logo {
    height: 32px;
  }
  
  .logo-container {
    position: static;
    transform: none;
  }
  
  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
  }
  
  .header-right h3 {
    font-size: 0.85rem;
    white-space: nowrap;
  }
  
  .main-content {
    padding: 70px 15px 15px;
    margin-bottom: 0px;
  }
  
  .chat-toggle-button {
    bottom: 15px;
    right: 15px;
    padding: 10px 16px;
    font-size: 0.85rem;
  }
  
  .create-room-button {
    font-size: 0.9rem;
    padding: 0.9rem 1.2rem;
  }
}
</style>

