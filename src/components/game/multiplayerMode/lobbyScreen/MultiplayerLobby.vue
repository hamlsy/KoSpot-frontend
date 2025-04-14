<template>
  <div class="multiplayer-container">
    <!-- 헤더 -->
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="$router.push('/mainPage')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="header-left">
          <h1 class="logo">KoSpot</h1>
          <span class="badge">Beta</span>
        </div>
        <div class="header-right">
          <h3>멀티플레이어 로비</h3>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="lobby-layout">
        <!-- 왼쪽 패널: 게임 방 목록 -->
        <GameRoomList 
          :rooms="rooms" 
          @join-room="joinRoom"
          @refresh-rooms="fetchRooms"
        />

        <!-- 오른쪽 패널: 채팅 및 방 생성 -->
        <div class="right-panel">
          <ChatWindow 
            :messages="chatMessages" 
            @send-message="sendChatMessage"
            :current-user-id="currentUser.id"
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
import GameRoomList from './GameRoomList.vue';
import ChatWindow from './ChatWindow.vue';
import CreateRoomModal from './CreateRoomModal.vue';

export default {
  name: "MultiplayerLobby",
  
  components: {
    GameRoomList,
    ChatWindow,
    CreateRoomModal
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
      }
    };
  },
  
  mounted() {
    this.fetchRooms();
    this.connectToChat();
    
    // 30초마다 방 목록 갱신
    this.refreshInterval = setInterval(() => {
      this.fetchRooms();
    }, 30000);
  },
  
  beforeDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.disconnectFromChat();
  },
  
  methods: {
    async fetchRooms() {
      this.isLoading = true;
      
      try {
        // 실제 구현에서는 API 호출로 대체
        // const response = await axios.get('/api/multiplayer/rooms');
        // this.rooms = response.data.rooms;
        
        // 테스트용 데이터
        setTimeout(() => {
          this.rooms = [
            {
              id: 'room1',
              name: '초보 환영! 같이 게임해요',
              host: '로드마스터',
              players: 2,
              maxPlayers: 4,
              mode: '로드뷰',
              status: 'waiting',
              region: '전국',
              createdAt: new Date().toISOString()
            },
            {
              id: 'room2',
              name: '숙련자만! 경상도 지역 배틀',
              host: '포토킹',
              players: 3,
              maxPlayers: 4,
              mode: '포토',
              status: 'waiting',
              region: '경상도',
              createdAt: new Date().toISOString()
            },
            {
              id: 'room3',
              name: '서울 지역만 대회 연습',
              host: '김서울',
              players: 1,
              maxPlayers: 2,
              mode: '로드뷰',
              status: 'waiting',
              region: '서울',
              createdAt: new Date().toISOString()
            },
            {
              id: 'room4',
              name: '부산 로컬들의 모임',
              host: '부산바다',
              players: 2,
              maxPlayers: 6,
              mode: '포토',
              status: 'waiting',
              region: '부산',
              createdAt: new Date().toISOString()
            },
            {
              id: 'room5',
              name: '게임 진행 중 - 3라운드',
              host: '지리마스터',
              players: 4,
              maxPlayers: 8,
              mode: '로드뷰',
              status: 'playing',
              region: '전국',
              currentRound: 3,
              totalRounds: 5,
              createdAt: new Date().toISOString()
            },
            {
              id: 'room6',
              name: '포토모드 5라운드 진행중',
              host: '사진킹',
              players: 6,
              maxPlayers: 6,
              mode: '포토',
              status: 'playing',
              region: '제주도',
              currentRound: 5,
              totalRounds: 8,
              createdAt: new Date(Date.now() - 3600000).toISOString()
            }
          ];
          this.isLoading = false;
        }, 800);
      } catch (error) {
        console.error('방 목록 조회 중 오류 발생:', error);
        this.isLoading = false;
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
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  padding-bottom: 40px;
  position: relative;
}

/* 헤더 스타일 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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

.logo {
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  background: #e74c3c;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-left: 0.5rem;
  text-transform: uppercase;
  font-weight: 700;
}

.header-right {
  margin-left: auto;
}

.header-right h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
  font-weight: 700;
  position: relative;
}

.header-right h3::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.create-room-button i {
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.create-room-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
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

/* 반응형 스타일 */
@media (max-width: 900px) {
  .lobby-layout {
    flex-direction: column;
    height: auto;
    max-height: none;
  }
  
  .right-panel {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 640px) {
  .header-content {
    padding: 0.8rem 1rem;
  }
  
  .logo {
    font-size: 1.5rem;
  }
  
  .header-right h3 {
    font-size: 1rem;
  }
  
  .main-content {
    padding: 70px 15px 15px;
  }
}
</style> 