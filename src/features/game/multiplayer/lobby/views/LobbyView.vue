<template>
  <div class="multiplayer-container">
    <!-- 헤더 -->
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="$router.push('/main')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="logo-container">
          <img src="/images/logo/kospot_logo_1-removebg.png" alt="KoSpot" class="header-logo" />
        </div>
        <div class="header-right">
          <h3>멀티플레이어 로비</h3>
          <!-- 개발 모드 토글 버튼 (관리자에게만 표시) -->
          <button 
            v-if="isAdmin && isDevelopment"
            class="dev-mode-toggle"
            @click="toggleDevMode"
            :class="{ 'active': useDummyData }"
            :title="useDummyData ? '개발 모드 끄기' : '개발 모드 켜기'"
          >
            <i class="fas" :class="useDummyData ? 'fa-database' : 'fa-wifi'"></i>
            <span>{{ useDummyData ? 'DEV' : 'API' }}</span>
          </button>
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
        <div class="left-panel">
          <GameRoomList 
            :rooms="rooms" 
            :loading="isLoading"
            @join-room="joinRoom"
            @refresh-rooms="refreshRooms"
            @load-more="loadMoreRooms"
            class="game-room-list"
            :class="{ 'chat-open': isChatVisible && isMobile }"
          />
          <!-- 새 게임방 만들기 버튼 - 게임방 목록 아래에 배치 -->
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
            :messages="formattedChatMessages" 
            @send-message="sendChatMessage"
            :current-user-id="getCurrentUserId()"
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
      @create-room="createRoom"
    />

    <!-- 방 입장 중 로딩 오버레이 (전체 화면) -->
    <div v-if="isJoining" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>방에 입장 중...</p>
      </div>
    </div>
    
    <!-- 에러 알림 (Toast 형태) -->
    <div v-if="roomError" class="error-toast">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <span class="error-message">{{ roomError }}</span>
        <button class="error-close" @click="clearError">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
    
    <!-- 더미 데이터 모드 알림 -->
    <div v-if="useDummyData && isDevelopment" class="dummy-mode-toast">
      <div class="dummy-content">
        <i class="fas fa-database"></i>
        <span>개발 모드: 더미 데이터 사용 중</span>
        <button class="dummy-action-btn" @click="handleDisableDummyData">
          <i class="fas fa-wifi"></i>
          실제 API 사용
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useAuth } from '@/core/composables/useAuth.js';
import useGlobalLobbyWebSocketService from '../services/useGlobalLobbyWebSocketService';
import { useLobbyRoom } from '../composables/useLobbyRoom.js';
import GameRoomList from '../components/RoomList.vue';
import ChatWindow from '../../chat/components/Lobby/ChatWindow.vue';
import CreateRoomModal from '../components/CreateRoomModal.vue';

// Vue3 script setup에서 process.env 접근을 위한 정의
// const isDevelopment = process.env.NODE_ENV === 'development';
const isDevelopment = true;

// Vue Router
const router = useRouter();

// 관리자 여부 확인
const isAdmin = ref(false);

// 로컬 스토리지에서 관리자 여부 확인
const checkAdminStatus = () => {
  const adminStatus = localStorage.getItem('isAdmin');
  isAdmin.value = adminStatus === 'true';
};

// WebSocket 로비 서비스 초기화
const lobbyService = useGlobalLobbyWebSocketService();

// 방 관리 composables 초기화
const {
  rooms,
  isLoading,
  error: roomError,
  isJoining,
  useDummyData,
  fetchRooms,
  loadMoreRooms,
  refreshRooms,
  joinRoom: joinRoomAPI,
  joinRoomByObject,
  createRoom: createRoomAPI,
  clearError,
  enableDummyData,
  disableDummyData,
  subscribeToRoomUpdates,
  unsubscribeFromRoomUpdates,
  resetRoomState
} = useLobbyRoom();

// 반응형 데이터
const showCreateRoomModal = ref(false);
const isInitialized = ref(false);
const isMobile = ref(false);
const isChatVisible = ref(false);
const windowWidth = ref(window.innerWidth);

// 계산된 속성
const formattedChatMessages = computed(() => {
  // WebSocket 서비스에서 받은 채팅 메시지를 UI 컴포넌트 형식에 맞게 변환
  const rawMessages = lobbyService.globalLobbyChatMessages.value;
  
  return rawMessages.map(msg => ({
    id: msg.messageId || msg.id || `msg-${msg.timestamp}`,
    sender: msg.nickname || msg.playerName || msg.sender || '익명',
    senderId: msg.senderId || msg.playerId || msg.memberId, // 백엔드에서 제공하는 senderId
    message: msg.content || msg.message,
    timestamp: msg.timestamp,
    system: msg.messageType === 'SYSTEM' || msg.messageType === 'JOIN' || msg.messageType === 'LEAVE' || msg.isSystem === true,
    messageType: msg.messageType,
    channelType: msg.channelType
  }));
});

// 메서드
const checkMobileView = (preserveChatState = false) => {
  windowWidth.value = window.innerWidth;
  isMobile.value = windowWidth.value <= 900;
  
  // 리사이즈 이벤트로 인한 호출이 아닌 경우에만 채팅창 상태 초기화
  if (!preserveChatState) {
    // 모든 화면 크기에서 기본적으로 채팅창은 닫혀있음
    isChatVisible.value = false;
  }
  // preserveChatState가 true인 경우 (리사이즈 이벤트)에는 채팅창 상태를 변경하지 않음
  // 이렇게 하면 모바일에서 키보드로 인한 뷰포트 변경 시에도 채팅창이 닫히지 않음
};

const getCurrentUserId = () => {
  // localStorage에서 memberId 가져오기
  const localStorageMemberId = localStorage.getItem('memberId');
  return localStorageMemberId;
};

const initializeData = async () => {
  try {
    // 페이지 초기화 시 모든 GAME ROOM 상태 초기화
    resetRoomState();
    
    // 기존 구독 해제 (새로고침 또는 재진입 시)
    unsubscribeFromRoomUpdates();
    
    // WebSocket 연결 및 채팅 서비스 시작
    // (사용자 정보는 서비스 내에서 자동으로 초기화됨)
    await connectToChat();
    
    // 방 목록 가져오기 (첫 페이지) - fetchRooms 내부에서도 상태 초기화가 되지만
    // 명시적으로 초기화를 위해 resetRoomState를 먼저 호출
    await fetchRooms(0);
    
    // WebSocket 연결이 완료된 후 STOMP 구독 시작 (실시간 방 업데이트)
    // connectToChat 내부에서 WebSocket 연결이 완료되면 콜백으로 구독 시도
    // 이미 연결되어 있으면 즉시 구독 시도
    subscribeToRoomUpdates();
    
    isInitialized.value = true;
    
  } catch (error) {
    console.error('로비 초기화 중 오류:', error);
  }
};

// fetchRooms는 이제 composables에서 가져옴 (더 이상 여기서 정의하지 않음)

const connectToChat = async () => {
  try {
    lobbyService.connectWebSocket();
  } catch (error) {
    console.error('채팅 서비스 연결 실패:', error);
  }
};

const disconnectFromChat = async () => {
  try {
    await lobbyService.disconnectWebSocket();
  } catch (error) {
    console.error('채팅 연결 해제 중 오류:', error);
  }
};

const sendChatMessage = (message) => {
      if (!message.trim()) return;
      
  // WebSocket 서비스를 통해 메시지 전송
  const success = lobbyService.sendGlobalLobbyChat(message);
  
  if (!success) {
    console.error('메시지 전송 실패');
    // 사용자에게 오류 알림 (Toast 메시지 등)
  }
};

const joinRoom = async (roomParam, password = null) => {
  try {
    // Spring API에 맞는 방 입장 처리
    if (typeof roomParam === 'string' || typeof roomParam === 'number') {
      // roomId로 직접 입장 (기존 호환성 유지)
      await joinRoomAPI(roomParam, password);
    } else if (roomParam && (roomParam.gameRoomId || roomParam.id)) {
      // FindGameRoomResponse 객체로 입장 (개선된 방식)
      await joinRoomByObject(roomParam, password);
    } else {
      console.error('❌ 잘못된 방 입장 파라미터:', roomParam);
      return;
    }
  } catch (error) {
    console.error('❌ 방 입장 처리 중 오류:', error);
    // 에러는 composables에서 처리됨
  }
};
    
const createRoom = async (roomData) => {
  try {
    // 모달 닫기
    showCreateRoomModal.value = false;
    
    // API를 통해 방 생성 - response.data.result에서 방 정보 받음
    const newRoom = await createRoomAPI(roomData);
    
    if (newRoom && newRoom.gameRoomId) {
      // 생성된 방으로 자동 입장 및 RoomView로 이동
      // newRoom 구조: { gameRoomId, title, gameModeKey, playerMatchTypeKey, maxPlayers, totalRounds, timeLimit }
      await router.push({
        name: 'RoomView',
        params: { roomId: newRoom.gameRoomId.toString() },
        state: {
          roomData: {
            id: newRoom.gameRoomId,
            title: newRoom.title,
            gameMode: newRoom.gameModeKey,
            isTeamMode: newRoom.playerMatchTypeKey === 'TEAM',
            maxPlayers: newRoom.maxPlayers,
            isPrivate: newRoom.privateRoom || false,
            hostId: getCurrentUserId(),
            totalRounds: newRoom.totalRounds,
            timeLimit: newRoom.timeLimit,
            currentPlayerCount: 1
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ 방 생성 처리 중 오류:', error);
    // 에러 발생 시 모달 다시 열기
    showCreateRoomModal.value = true;
  }
};

// 개발 모드 관련 메서드
const handleDisableDummyData = async () => {
  console.log('🌐 실제 API 모드로 전환');
  try {
    await disableDummyData();
  } catch (error) {
    console.error('❌ API 모드 전환 실패:', error);
  }
};

const toggleDevMode = async () => {
  if (useDummyData.value) {
    console.log('🌐 API 모드로 전환');
    try {
      await disableDummyData();
    } catch (error) {
      console.error('❌ API 모드 전환 실패:', error);
    }
  } else {
    console.log('🧪 개발 모드로 전환');
    clearError();
    enableDummyData(true);
  }
};

// 라이프사이클 훅
onMounted(async () => {
  // DOM이 완전히 렌더링된 후 페이지 상단으로 스크롤
  await nextTick();
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // 로그인 여부 확인
  const isLoggedIn = !!localStorage.getItem('accessToken');
  
  if (!isLoggedIn) {
    // 로그인하지 않은 경우 메인 페이지로 리다이렉션
    alert('로그인한 사용자만 접근할 수 있습니다.');
    router.push('/');
    return;
  }
  
  checkAdminStatus();
  initializeData();
  checkMobileView(); // 초기화 시에는 상태 설정
  window.addEventListener('resize', () => checkMobileView(true)); // 리사이즈 시에는 채팅창 상태 보존
});

// 페이지 이탈 시 구독 해제 (라우트 전환)
onBeforeRouteLeave((to, from, next) => {
  console.log('🚪 로비 페이지 이탈 - 구독 해제');
  unsubscribeFromRoomUpdates();
  next();
});

onBeforeUnmount(async () => {
  // 정리 작업
  // STOMP 구독 해제
  unsubscribeFromRoomUpdates();
  
  // 채팅 연결 해제
  await disconnectFromChat();
  
  // 리사이즈 이벤트 리스너 제거
  window.removeEventListener('resize', checkMobileView);
});
</script>

<style scoped>
.multiplayer-container {
  min-height: 100vh;
  padding-bottom: 40px;
  position: relative;
  font-family: var(--font-body);
  background-color: var(--color-background);
}

/* 헤더 스타일 */
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

/* 개발 모드 토글 버튼 */
.dev-mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: rgba(107, 114, 128, 0.08);
  border: 1px solid rgba(107, 114, 128, 0.15);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.dev-mode-toggle i {
  font-size: 0.75rem;
}

.dev-mode-toggle span {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.dev-mode-toggle:hover {
  background: rgba(107, 114, 128, 0.12);
  transform: translateY(-2px);
}

.dev-mode-toggle.active {
  background: linear-gradient(135deg, var(--color-primary) 0%, #1d4ed8 100%);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.dev-mode-toggle.active:hover {
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

/* 메인 콘텐츠 스타일 */
.main-content {
  padding: 100px var(--spacing-xl) var(--spacing-xl);
  max-width: 1400px;
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
  color: var(--color-primary);
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
  color: var(--color-text-primary);
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 600;
}

/* 채팅 토글 버튼 */
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

/* 에러 토스트 */
.error-toast {
  position: fixed;
  top: 100px;
  right: 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
  z-index: 1000;
  cursor: pointer;
  animation: slideInRight 0.3s ease-out;
  max-width: 400px;
  min-width: 300px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-content i {
  font-size: 1.1rem;
  color: #fef2f2;
}

.error-content span {
  flex: 1;
  font-weight: 500;
  line-height: 1.4;
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.error-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 더미 데이터 모드 토스트 */
.dummy-mode-toast {
  position: fixed;
  top: 100px;
  left: var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary) 0%, #1d4ed8 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.3);
  z-index: 1000;
  animation: slideInLeft 0.3s ease-out;
  max-width: 400px;
  min-width: 300px;
}

.dummy-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dummy-content i {
  font-size: 1.1rem;
  color: #dbeafe;
}

.dummy-content span {
  flex: 1;
  font-weight: 500;
  line-height: 1.4;
}

.dummy-action-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dummy-action-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
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
    padding: 0.6rem 0.8rem;
  }
  
  /* 모바일에서 로고 크기 축소 */
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
  
  .dev-mode-toggle {
    margin-left: 0;
    padding: 0.4rem 0.6rem;
    font-size: 0.7rem;
  }
  
  .dev-mode-toggle span {
    font-size: 0.6rem;
  }
  
  .dev-mode-toggle i {
    font-size: 0.7rem;
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
  
  .error-toast {
    top: 80px;
    left: 15px;
    right: 15px;
    max-width: none;
    min-width: auto;
  }
  
  .dummy-mode-toast {
    top: 80px;
    left: 15px;
    right: auto;
    max-width: none;
    min-width: auto;
    width: calc(100% - 30px);
  }
}
</style>