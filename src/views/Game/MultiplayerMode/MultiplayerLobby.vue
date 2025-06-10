<template>
  <div class="multiplayer-container">
    <!-- 헤더 -->
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="$router.push('/mainPage')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="header-left">
          <app-logo class="home-link" to="/mainPage" />
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
        @click="isChatVisible = !isChatVisible"
        :class="{ 'active': isChatVisible }"
      >
        <i class="fas" :class="isChatVisible ? 'fa-times' : 'fa-comments'"></i>
        <span>{{ isChatVisible ? '채팅 닫기' : '채팅 열기' }}</span>
      </button>

      <div class="lobby-layout">
        <!-- 왼쪽 패널: 게임 방 목록 -->
        <GameRoomList 
          :rooms="rooms" 
          @join-room="joinRoom"
          @refresh-rooms="fetchRooms"
          class="game-room-list"
          :class="{ 'chat-open': isChatVisible && isMobile }"
        />

        <!-- 오른쪽 패널: 채팅 및 방 생성 -->
        <div 
          class="right-panel" 
          :class="{ 'mobile-visible': isChatVisible, 'mobile-hidden': !isChatVisible }"
        >
          <ChatWindow 
            :messages="chatMessages" 
            @send-message="sendChatMessage"
            :current-user-id="currentUser.id"
            :show-mobile-close="isMobile"
            @close="isChatVisible = false"
          />
          
          <button class="create-room-button" @click="showCreateRoomModal = true">
            <i class="fas fa-plus"></i> 새 게임방 만들기
          </button>
        </div>
      </div>
    </main>

    <!-- 방 생성 모달 -->
    <CreateRoomModal 
      v-if="showCreateRoomModal" 
      @close="showCreateRoomModal = false"
      @create-room="createRoom"
    />

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<script>
import MultiplayerRoomList from './components/lobby/room/MultiplayerRoomList.vue';
import MultiplayerLobbyChatWindow from './components/lobby/chat/MultiplayerLobbyChatWindow.vue';
import MultiplayerCreateRoomModal from './components/lobby/room/MultiplayerCreateRoomModal.vue';
import AppLogo from '@/core/components/AppLogo.vue'; // AppLogo 컴포넌트 추가

export default {
  name: "MultiplayerLobby",
  
  components: {
    GameRoomList: MultiplayerRoomList,
    ChatWindow: MultiplayerLobbyChatWindow,
    CreateRoomModal: MultiplayerCreateRoomModal,
    AppLogo // AppLogo 컴포넌트 등록
  },
  
  data() {
    return {
      rooms: [],
      chatMessages: [],
      showCreateRoomModal: false,
      isLoading: false,
      currentUser: {
        id: 'user123',
        nickname: '김코스팟',
        level: 23,
        profileImage: '/assets/default-profile.png'
      },
      isInitialized: false,
      isMobile: false,
      isChatVisible: false,
      windowWidth: window.innerWidth
    };
  },
  
  mounted() {
    this.initializeData();
    this.checkMobileView();
    window.addEventListener('resize', this.checkMobileView);
  },
  
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.disconnectFromChat();
    window.removeEventListener('resize', this.checkMobileView);
  },
  
  methods: {
    checkMobileView() {
      this.windowWidth = window.innerWidth;
      this.isMobile = this.windowWidth <= 900;
      this.isChatVisible = !this.isMobile;
    },
    async initializeData() {
      this.isLoading = true;
      await this.fetchRooms();
      this.connectToChat();
      this.isInitialized = true;
      this.isLoading = false;
      
      // 30초마다 방 목록 갱신
      this.refreshInterval = setInterval(() => {
        this.fetchRooms();
      }, 30000);
    },
    
    async fetchRooms() {
      if (!this.isInitialized) {
        this.isLoading = true;
      }
      
      try {
        // 실제 구현에서는 API 호출로
        // const response = await axios.get('/api/multiplayer/rooms');
        // this.rooms = response.data.rooms;
        
        // 테스트용 즉시 데이터 설정 (setTimeout 제거)
        this.rooms = [
          {
            id: 'room1',
            name: '방 제목 A',
            host: 'host A',
            players: 2,
            maxPlayers: 4,
            mode: '로드뷰',
            status: 'waiting',
          },
          {
            id: 'room2',
            name: '방 제목 B',
            host: 'host B',
            players: 3,
            maxPlayers: 4,
            mode: '포토',
            status: 'waiting',
          },
          {
            id: 'room3',
            name: '방 제목 C',
            host: 'host c',
            players: 1,
            maxPlayers: 2,
            mode: '로드뷰',
            status: 'waiting',
          },
          {
            id: 'room5',
            name: '게임 진행 중 - 3라운드',
            host: 'host F',
            players: 4,
            maxPlayers: 8,
            mode: '로드뷰',
            status: 'playing',
            region: '전국',
            currentRound: 3,
            totalRounds: 5,
          },
          {
            id: 'room6',
            name: '포토모드 5라운드 진행중',
            host: 'host D',
            players: 6,
            maxPlayers: 6,
            mode: '포토',
            status: 'playing',
            currentRound: 5,
            totalRounds: 8,
          }
        ];
        
        // 초기화 이후에는 로딩 상태 해제
        if (!this.isInitialized) {
          this.isLoading = false;
        }
        
        return Promise.resolve();
      } catch (error) {
        console.error('방 목록 조회 중 오류 발생:', error);
        this.isLoading = false;
        return Promise.reject(error);
      }
    },
    
    connectToChat() {
      // 실제 구현에서는 웹소켓 연결로 대체
      // 테스트용 채팅 메시지
      this.chatMessages = [
        {
          id: 'm1',
          sender: '시스템',
          message: '채팅방에 오신 것을 환영합니다.',
          timestamp: new Date().toISOString(),
          system: true
        },
        {
          id: 'm2',
          sender: '포토킹',
          message: '안녕하세요! 같이 게임하실 분?',
          timestamp: new Date().toISOString(),
          system: false
        },
        {
          id: 'm3',
          sender: '로드마스터',
          message: '저요! 초보인데 괜찮을까요?',
          timestamp: new Date().toISOString(),
          system: false
        },
        {
          id: 'm4',
          sender: '포토킹',
          message: '넵! 제 방에 들어오세요~',
          timestamp: new Date().toISOString(),
          system: false
        }
      ];
    },
    
    disconnectFromChat() {
      // 웹소켓 연결 해제 로직
      console.log('채팅 연결 해제');
    },
    
    sendChatMessage(message) {
      if (!message.trim()) return;
      
      // 실제 구현에서는 웹소켓을 통해 전송
      const newMessage = {
        id: `m${Date.now()}`,
        sender: this.currentUser.nickname,
        senderId: this.currentUser.id,
        message: message,
        timestamp: new Date().toISOString(),
        system: false
      };
      
      this.chatMessages.push(newMessage);
    },
    
    joinRoom(roomId) {
      this.isLoading = true;
      
      // 실제 구현에서는 API 호출 후 게임 화면으로 이동
      console.log(`방 ${roomId}에 참가합니다.`);
      
      setTimeout(() => {
        this.isLoading = false;
        // 게임 방으로 이동 (대기실 모드로 시작됨)
        this.$router.push({
          name: 'MultiplayerGame',
          params: { roomId }
        });
      }, 1000);
    },
    
    createRoom(roomData) {
      this.isLoading = true;
      
      // 실제 구현에서는 API 호출
      console.log('새 방 생성:', roomData);
      
      setTimeout(() => {
        this.showCreateRoomModal = false;
        this.isLoading = false;
        
        // 생성된 방 목록에 추가
        const newRoom = {
          id: `room${Date.now()}`,
          name: roomData.name,
          host: this.currentUser.nickname,
          players: 1,
          maxPlayers: roomData.maxPlayers,
          mode: roomData.gameMode,
          status: 'waiting',
          region: roomData.region,
          createdAt: new Date().toISOString()
        };
        
        this.rooms.unshift(newRoom);
        
        // 시스템 메시지 추가
        this.chatMessages.push({
          id: `m${Date.now()}`,
          sender: '시스템',
          message: `${this.currentUser.nickname}님이 '${roomData.name}' 방을 생성했습니다.`,
          timestamp: new Date().toISOString(),
          system: true
        });
        
        // 생성한 방으로 자동 입장 (대기실 모드로 시작됨)
        this.joinRoom(newRoom.id);
      }, 1000);
    }
  }
};
</script>

<style scoped>
@import url("@/assets/styles/common/header.css");

.multiplayer-container {
  min-height: 100vh;
  padding-bottom: 40px;
  position: relative;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 헤더 스타일 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.03);
  z-index: 100;
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-button {
  background: none;
  border: none;
  color: #333;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-right: 1rem;
}

.back-button:hover {
  transform: translateX(-3px);
}

.header-left {
  display: flex;
  align-items: center;
}

/* 로고 스타일 */
.header-right {
  margin-left: auto;
}

.header-right h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #111827;
  font-weight: 700;
  position: relative;
  letter-spacing: -0.01em;
}

.header-right h3::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40%;
  height: 3px;
  background: linear-gradient(90deg, #60a5fa, #8b5cf6);
  border-radius: 2px;
}

/* 메인 콘텐츠 스타일 */
.main-content {
  padding: 80px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 로비 레이아웃 */
.lobby-layout {
  display: flex;
  gap: 1.5rem;
  position: relative;
  height: calc(100vh - 120px);
  max-height: 700px;
  margin-top: 1rem;
  animation: fadeIn 0.5s ease-out;
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
  padding: 1rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.25);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.create-room-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #60a5fa 100%);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.create-room-button i {
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.create-room-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(96, 165, 250, 0.35);
}

.create-room-button:hover::before {
  opacity: 1;
}

.create-room-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 10px rgba(96, 165, 250, 0.2);
}

/* 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner i {
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 1rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.loading-spinner p {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

/* 채팅 토글 버튼 */
.chat-toggle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  z-index: 50;
}

.chat-toggle-button i {
  margin-right: 8px;
}

.chat-toggle-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.chat-toggle-button.active {
  background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%);
}

/* 반응형 스타일 */
@media (max-width: 900px) {
  .lobby-layout {
    flex-direction: column;
    height: auto;
    max-height: none;
    position: relative;
    overflow: hidden;
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
}

@media (max-width: 640px) {
  .header-content {
    padding: 0.8rem 1rem;
  }
  
  .header-right h3 {
    font-size: 1rem;
  }
  
  .main-content {
    padding: 70px 15px 15px;
  }
  
  .chat-toggle-button {
    bottom: 15px;
    right: 15px;
    padding: 10px 16px;
    font-size: 0.85rem;
  }
}
</style>