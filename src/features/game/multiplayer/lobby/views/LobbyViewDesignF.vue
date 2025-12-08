<template>
  <div class="lobby-f">
    <!-- 헤더 -->
    <header class="lobby-header">
      <div class="header-inner">
        <button class="back-btn" @click="$router.push('/main')">
          <i class="fas fa-arrow-left"></i>
        </button>
        
        <div class="logo-area">
          <div class="logo-icon">
            <i class="fas fa-globe-asia"></i>
          </div>
          <div class="logo-text">
            <span class="brand">KOSPOT</span>
            <span class="sub">멀티플레이어</span>
          </div>
        </div>
        
        <div class="header-actions">
          <div class="online-badge">
            <span class="pulse-dot"></span>
            <span>{{ onlineCount }} 온라인</span>
          </div>
        </div>
      </div>
    </header>
    
    <!-- 메인 콘텐츠 -->
    <main class="lobby-main">
      <div class="main-grid">
        <!-- 좌측: 방 목록 -->
        <section class="rooms-section">
          <div class="section-card">
            <div class="card-header">
              <div class="header-title">
                <i class="fas fa-door-open"></i>
                <h2>게임 방 목록</h2>
                <span class="room-count">{{ filteredRooms.length }}개</span>
              </div>
              <div class="header-actions">
                <div class="search-box">
                  <i class="fas fa-search"></i>
                  <input 
                    type="text" 
                    v-model="searchQuery" 
                    placeholder="방 검색..."
                  />
                </div>
                <button class="refresh-btn" @click="refreshRooms" :disabled="isLoading">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoading }"></i>
                </button>
              </div>
            </div>
            
            <div class="rooms-list" v-if="filteredRooms.length > 0">
              <div 
                v-for="room in filteredRooms" 
                :key="room.gameRoomId"
                class="room-item"
                :class="roomClass(room)"
                @click="joinRoom(room)"
              >
                <div class="room-status-bar"></div>
                
                <div class="room-content">
                  <div class="room-header">
                    <div class="room-id">#{{ String(room.gameRoomId).padStart(3, '0') }}</div>
                    <div class="room-badges">
                      <span class="badge" :class="statusBadgeClass(room)">
                        {{ isPlaying(room) ? '진행 중' : '대기 중' }}
                      </span>
                      <span v-if="room.privateRoom" class="badge private">
                        <i class="fas fa-lock"></i>
                      </span>
                    </div>
                  </div>
                  
                  <h3 class="room-name">{{ room.title }}</h3>
                  
                  <div class="room-meta">
                    <span class="meta-item">
                      <i class="fas fa-user"></i>
                      {{ room.hostNickname }}
                    </span>
                    <span class="meta-divider">•</span>
                    <span class="meta-item">
                      <i :class="room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
                      {{ room.gameMode }}
                    </span>
                  </div>
                  
                  <div class="room-footer">
                    <div class="player-bar">
                      <div class="bar-fill" :style="{ width: playerPercent(room) + '%' }"></div>
                    </div>
                    <span class="player-count">{{ room.currentPlayerCount }}/{{ room.maxPlayers }}</span>
                    <span class="join-hint" v-if="!isPlaying(room)">입장 →</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="empty-rooms" v-else>
              <div class="empty-icon">
                <i class="fas fa-inbox"></i>
              </div>
              <p>생성된 방이 없습니다</p>
              <span>첫 번째 방을 만들어보세요!</span>
            </div>
          </div>
          
          <!-- 방 만들기 버튼 -->
          <button class="create-room-btn" @click="showCreateModal = true">
            <i class="fas fa-plus"></i>
            <span>새 게임방 만들기</span>
          </button>
        </section>
        
        <!-- 우측: 채팅 -->
        <section class="chat-section" :class="{ 'mobile-visible': isChatOpen }">
          <div class="section-card chat-card">
            <div class="card-header">
              <div class="header-title">
                <i class="fas fa-comments"></i>
                <h2>전체 채팅</h2>
              </div>
              <button v-if="isMobile" class="close-chat" @click="isChatOpen = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="chat-messages" ref="chatMessagesRef">
              <div 
                v-for="(msg, idx) in chatMessages" 
                :key="idx"
                class="chat-msg"
                :class="{ 'system': msg.system, 'own': msg.senderId === currentUserId }"
              >
                <template v-if="msg.system">
                  <span class="system-text">{{ msg.message }}</span>
                </template>
                <template v-else>
                  <span class="msg-sender">{{ msg.sender }}</span>
                  <span class="msg-content">{{ msg.message }}</span>
                </template>
              </div>
            </div>
            
            <div class="chat-input-area">
              <input
                type="text"
                v-model="chatInput"
                placeholder="메시지 입력..."
                @keyup.enter="sendChat"
              />
              <button class="send-btn" @click="sendChat">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <!-- 모바일 채팅 토글 -->
    <button v-if="isMobile && !isChatOpen" class="mobile-chat-btn" @click="isChatOpen = true">
      <i class="fas fa-comments"></i>
      <span v-if="unreadCount > 0" class="unread">{{ unreadCount }}</span>
    </button>
    
    <!-- 방 생성 모달 -->
    <CreateRoomModalDesignF
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @create-room="createRoom"
    />
    
    <!-- 비밀번호 모달 -->
    <div class="modal-overlay" v-if="showPasswordModal" @click.self="showPasswordModal = false">
      <div class="password-modal">
        <div class="modal-header">
          <i class="fas fa-lock"></i>
          <h3>비밀번호 입력</h3>
        </div>
        <div class="modal-body">
          <input 
            type="password" 
            v-model="passwordInput"
            placeholder="비밀번호를 입력하세요"
            @keyup.enter="submitPassword"
          />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showPasswordModal = false">취소</button>
          <button class="btn-confirm" @click="submitPassword">입장</button>
        </div>
      </div>
    </div>
    
    <!-- 로딩 오버레이 -->
    <div v-if="isJoining" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-circle-notch fa-spin"></i>
        <p>입장 중...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import CreateRoomModalDesignF from '../components/designs/CreateRoomModalDesignF.vue';

const router = useRouter();

// 반응형 상태
const isMobile = ref(false);
const isChatOpen = ref(false);
const isLoading = ref(false);
const isJoining = ref(false);
const searchQuery = ref('');
const showCreateModal = ref(false);
const showPasswordModal = ref(false);
const passwordInput = ref('');
const selectedRoom = ref(null);
const chatInput = ref('');
const chatMessagesRef = ref(null);
const unreadCount = ref(0);

const currentUserId = 'user-123';
const onlineCount = computed(() => 42);

// 더미 데이터
const rooms = ref([
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
  }
]);

const chatMessages = ref([
  { sender: 'SYSTEM', message: '전체 채팅에 오신 것을 환영합니다!', system: true },
  { sender: 'MapMaster', senderId: 'user-1', message: '안녕하세요!' },
  { sender: 'GeoKing', senderId: 'user-2', message: '같이 게임하실 분?' }
]);

// 계산된 속성
const filteredRooms = computed(() => {
  if (!searchQuery.value.trim()) return rooms.value;
  const q = searchQuery.value.toLowerCase();
  return rooms.value.filter(r => 
    r.title.toLowerCase().includes(q) ||
    r.hostNickname.toLowerCase().includes(q)
  );
});

// 메서드
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 900;
  if (!isMobile.value) isChatOpen.value = false;
};

const isPlaying = (room) => room.gameRoomStatus === 'PLAYING' || room.gameRoomStatus === '게임 중';

const roomClass = (room) => ({
  'is-playing': isPlaying(room),
  'is-private': !isPlaying(room) && room.privateRoom,
  'is-public': !isPlaying(room) && !room.privateRoom
});

const statusBadgeClass = (room) => ({
  'playing': isPlaying(room),
  'waiting': !isPlaying(room)
});

const playerPercent = (room) => (room.currentPlayerCount / room.maxPlayers) * 100;

const refreshRooms = () => {
  isLoading.value = true;
  setTimeout(() => isLoading.value = false, 500);
};

const joinRoom = (room) => {
  if (isPlaying(room)) {
    alert('게임이 진행 중인 방입니다.');
    return;
  }
  if (room.currentPlayerCount >= room.maxPlayers) {
    alert('방이 가득 찼습니다.');
    return;
  }
  if (room.privateRoom) {
    selectedRoom.value = room;
    passwordInput.value = '';
    showPasswordModal.value = true;
  } else {
    proceedJoin(room);
  }
};

const submitPassword = () => {
  if (!passwordInput.value.trim()) {
    alert('비밀번호를 입력하세요.');
    return;
  }
  showPasswordModal.value = false;
  proceedJoin(selectedRoom.value, passwordInput.value);
};

const proceedJoin = (room, password = null) => {
  isJoining.value = true;
  setTimeout(() => {
    isJoining.value = false;
    alert(`"${room.title}" 입장 (테스트 모드)`);
  }, 800);
};

const createRoom = (data) => {
  showCreateModal.value = false;
  isJoining.value = true;
  setTimeout(() => {
    isJoining.value = false;
    alert(`"${data.title}" 방 생성 (테스트 모드)`);
  }, 800);
};

const sendChat = () => {
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

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
});
</script>

<style scoped>
.lobby-f {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 헤더 */
.lobby-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand {
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
}

.sub {
  font-size: 0.65rem;
  color: #9ca3af;
  font-weight: 500;
}

.header-actions {
  margin-left: auto;
}

.online-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #16a34a;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

/* 메인 */
.lobby-main {
  padding: 80px 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  min-height: calc(100vh - 120px);
}

/* 섹션 카드 */
.section-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-title i {
  color: #10b981;
  font-size: 1rem;
}

.header-title h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.room-count {
  background: #f3f4f6;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
}

.search-box i {
  color: #9ca3af;
  font-size: 0.8rem;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 0.8rem;
  width: 140px;
  color: #374151;
}

.search-box input::placeholder {
  color: #9ca3af;
}

.refresh-btn {
  width: 34px;
  height: 34px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

/* 방 목록 */
.rooms-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rooms-section .section-card {
  flex: 1;
}

.rooms-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.room-item {
  display: flex;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.room-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transform: translateY(-1px);
}

.room-status-bar {
  width: 4px;
  flex-shrink: 0;
}

.is-public .room-status-bar { background: linear-gradient(180deg, #10b981, #059669); }
.is-private .room-status-bar { background: linear-gradient(180deg, #6366f1, #4f46e5); }
.is-playing .room-status-bar { background: linear-gradient(180deg, #f59e0b, #d97706); }

.is-playing {
  opacity: 0.6;
  cursor: not-allowed;
}

.is-playing:hover {
  transform: none;
  box-shadow: none;
}

.room-content {
  flex: 1;
  padding: 0.75rem 1rem;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.room-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  color: #9ca3af;
}

.room-badges {
  display: flex;
  gap: 0.3rem;
}

.badge {
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.6rem;
  font-weight: 600;
}

.badge.waiting {
  background: #ecfdf5;
  color: #059669;
}

.badge.playing {
  background: #fef3c7;
  color: #d97706;
}

.badge.private {
  background: #eef2ff;
  color: #6366f1;
}

.room-name {
  margin: 0 0 0.35rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #6b7280;
}

.meta-item i {
  font-size: 0.65rem;
  color: #9ca3af;
}

.meta-divider {
  color: #d1d5db;
}

.room-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-bar {
  flex: 1;
  max-width: 80px;
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.is-public .bar-fill { background: #10b981; }
.is-private .bar-fill { background: #6366f1; }
.is-playing .bar-fill { background: #f59e0b; }

.player-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: #374151;
}

.join-hint {
  margin-left: auto;
  font-size: 0.65rem;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.is-public .join-hint { color: #059669; }
.is-private .join-hint { color: #6366f1; }

.room-item:hover .join-hint {
  transform: translateX(3px);
}

/* 빈 상태 */
.empty-rooms {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #9ca3af;
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty-icon i {
  font-size: 1.5rem;
  color: #9ca3af;
}

.empty-rooms p {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: #6b7280;
}

.empty-rooms span {
  font-size: 0.8rem;
}

/* 방 만들기 버튼 */
.create-room-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.create-room-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* 채팅 섹션 */
.chat-section {
  display: flex;
  flex-direction: column;
}

.chat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.close-chat {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-height: 200px;
}

.chat-msg {
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.chat-msg.system {
  background: #f3f4f6;
  text-align: center;
}

.system-text {
  color: #6b7280;
  font-size: 0.7rem;
}

.chat-msg:not(.system) {
  background: #f8fafc;
  border-left: 2px solid #e5e7eb;
}

.chat-msg.own {
  background: #ecfdf5;
  border-left-color: #10b981;
}

.msg-sender {
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
  margin-right: 0.4rem;
}

.msg-content {
  color: #374151;
}

.chat-input-area {
  display: flex;
  gap: 0.4rem;
  padding: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.chat-input-area input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input-area input:focus {
  border-color: #10b981;
}

.send-btn {
  width: 38px;
  height: 38px;
  background: #10b981;
  border: none;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-btn:hover {
  background: #059669;
}

/* 모바일 채팅 버튼 */
.mobile-chat-btn {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 1.2rem;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
  z-index: 50;
}

.unread {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 700;
}

/* 비밀번호 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.password-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 360px;
  overflow: hidden;
}

.password-modal .modal-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.password-modal .modal-header i {
  color: #6366f1;
}

.password-modal .modal-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #111827;
}

.password-modal .modal-body {
  padding: 1.25rem;
}

.password-modal input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
}

.password-modal input:focus {
  border-color: #6366f1;
}

.password-modal .modal-footer {
  display: flex;
  gap: 0.6rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 0.7rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.btn-confirm {
  background: #6366f1;
  border: none;
  color: white;
}

.btn-confirm:hover {
  background: #4f46e5;
}

/* 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  text-align: center;
}

.loading-spinner i {
  font-size: 2.5rem;
  color: #10b981;
  margin-bottom: 0.75rem;
}

.loading-spinner p {
  margin: 0;
  font-weight: 600;
  color: #374151;
}

/* 반응형 */
@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  
  .chat-section {
    position: fixed;
    top: 64px;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 400px;
    background: white;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 200;
    box-shadow: -4px 0 20px rgba(0,0,0,0.1);
  }
  
  .chat-section.mobile-visible {
    transform: translateX(0);
  }
  
  .mobile-chat-btn {
    display: flex;
  }
}

@media (max-width: 640px) {
  .header-inner {
    padding: 0 1rem;
  }
  
  .logo-text {
    display: none;
  }
  
  .lobby-main {
    padding: 74px 1rem 1.5rem;
  }
  
  .search-box {
    display: none;
  }
  
  .room-item {
    padding: 0;
  }
}
</style>

