<template>
  <div class="room-f">
    <!-- 헤더 -->
    <header class="room-header">
      <div class="header-inner">
        <button class="leave-btn" @click="leaveRoom">
          <i class="fas fa-sign-out-alt"></i>
          <span>나가기</span>
        </button>
        
        <div class="room-info-header">
          <span class="room-id">#{{ String(roomData.id).padStart(3, '0') }}</span>
          <h1 class="room-title">{{ roomData.title }}</h1>
        </div>
        
        <div class="header-actions">
          <div class="mode-badge">
            <i class="fas fa-street-view"></i>
            <span>{{ roomData.rounds }}R</span>
            <span class="divider">|</span>
            <span>{{ formatTime(roomData.timeLimit) }}</span>
          </div>
          <button v-if="isHost" class="settings-btn" @click="showSettings = true">
            <i class="fas fa-cog"></i>
          </button>
        </div>
      </div>
    </header>
    
    <!-- 메인 콘텐츠 -->
    <main class="room-main">
      <div class="main-grid">
        <!-- 좌측: 프로필 + 플레이어 목록 -->
        <section class="left-section">
          <!-- 내 프로필 카드 -->
          <div class="my-profile-card">
            <div class="profile-header">
              <div class="profile-avatar">
                <img :src="myProfile.avatar" alt="내 프로필" v-if="myProfile.avatar" />
                <i class="fas fa-user" v-else></i>
                <span class="online-dot"></span>
              </div>
              <div class="profile-info">
                <h3 class="profile-name">{{ myProfile.nickname }}</h3>
                <span class="profile-role">{{ isHost ? '방장' : '참가자' }}</span>
              </div>
            </div>
            
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">{{ myProfile.stats.wins }}</span>
                <span class="stat-label">승리</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">{{ myProfile.stats.games }}</span>
                <span class="stat-label">게임</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">{{ myProfile.stats.winRate }}%</span>
                <span class="stat-label">승률</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">{{ myProfile.stats.avgScore }}</span>
                <span class="stat-label">평균</span>
              </div>
            </div>
          </div>
          
          <!-- 플레이어 목록 -->
          <div class="players-section">
            <div class="section-header">
              <div class="header-title">
                <i class="fas fa-users"></i>
                <span>참가자</span>
                <span class="player-count">{{ players.length }}/{{ roomData.maxPlayers }}</span>
              </div>
              <div class="connection-status" :class="{ connected: isConnected }">
                <i :class="isConnected ? 'fas fa-wifi' : 'fas fa-spinner fa-spin'"></i>
              </div>
            </div>
            
            <div class="players-grid">
              <div 
                v-for="slot in roomData.maxPlayers" 
                :key="slot"
                class="player-slot"
                :class="{ 
                  filled: players[slot - 1],
                  host: players[slot - 1]?.isHost,
                  me: players[slot - 1]?.id === currentUserId
                }"
              >
                <template v-if="players[slot - 1]">
                  <div class="slot-number">{{ String(slot).padStart(2, '0') }}</div>
                  <div class="player-avatar">
                    <img :src="players[slot - 1].avatar" v-if="players[slot - 1].avatar" />
                    <i class="fas fa-user" v-else></i>
                    <span v-if="players[slot - 1].isHost" class="host-crown">
                      <i class="fas fa-crown"></i>
                    </span>
                  </div>
                  <div class="player-info">
                    <span class="player-name">{{ players[slot - 1].nickname }}</span>
                    <span class="player-status ready">준비됨</span>
                  </div>
                  <button 
                    v-if="isHost && !players[slot - 1].isHost"
                    class="kick-btn"
                    @click="kickPlayer(players[slot - 1])"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </template>
                <template v-else>
                  <div class="slot-number empty">{{ String(slot).padStart(2, '0') }}</div>
                  <div class="empty-slot">
                    <i class="fas fa-user-plus"></i>
                    <span>대기 중</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
          
          <!-- 게임 시작 버튼 (호스트만) -->
          <button 
            v-if="isHost"
            class="start-game-btn"
            :disabled="players.length < 2"
            @click="startGame"
          >
            <i class="fas fa-play"></i>
            <span>게임 시작</span>
            <span v-if="players.length < 2" class="min-players">(최소 2명 필요)</span>
          </button>
        </section>
        
        <!-- 우측: 컴팩트 채팅 -->
        <section class="right-section" :class="{ 'mobile-visible': isChatOpen }">
          <div class="chat-section">
            <div class="section-header">
              <div class="header-title">
                <i class="fas fa-comments"></i>
                <span>채팅</span>
              </div>
              <button v-if="isMobile" class="close-chat" @click="isChatOpen = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="chat-messages" ref="chatRef">
              <div 
                v-for="(msg, idx) in chatMessages" 
                :key="idx"
                class="chat-msg"
                :class="{ system: msg.system, own: msg.senderId === currentUserId }"
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
            
            <div class="chat-input">
              <input
                type="text"
                v-model="chatInput"
                placeholder="메시지..."
                @keyup.enter="sendChat"
              />
              <button @click="sendChat">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
    
    <!-- 모바일 하단 바 -->
    <div class="mobile-nav" v-if="isMobile">
      <button 
        class="nav-btn"
        :class="{ active: !isChatOpen }"
        @click="isChatOpen = false"
      >
        <i class="fas fa-users"></i>
        <span>플레이어</span>
      </button>
      <button 
        class="nav-btn"
        :class="{ active: isChatOpen }"
        @click="isChatOpen = true"
      >
        <i class="fas fa-comments"></i>
        <span>채팅</span>
        <span v-if="unreadCount > 0" class="unread">{{ unreadCount }}</span>
      </button>
    </div>
    
    <!-- 게임 시작 카운트다운 -->
    <transition name="fade">
      <div v-if="isCountdown" class="countdown-overlay">
        <div class="countdown-content">
          <div class="countdown-ring">
            <span class="countdown-number">{{ countdownNum }}</span>
          </div>
          <p class="countdown-text">게임이 시작됩니다!</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 상태
const isMobile = ref(false);
const isChatOpen = ref(false);
const isConnected = ref(true);
const unreadCount = ref(0);
const chatInput = ref('');
const chatRef = ref(null);
const showSettings = ref(false);
const isCountdown = ref(false);
const countdownNum = ref(3);

const currentUserId = 'user-1';
const isHost = ref(true);

// 더미 프로필
const myProfile = ref({
  nickname: 'MapMaster',
  avatar: null,
  stats: {
    wins: 42,
    games: 86,
    winRate: 49,
    avgScore: 847
  }
});

// 더미 방 데이터
const roomData = ref({
  id: 42,
  title: '초보자 환영! 같이 놀아요',
  maxPlayers: 6,
  rounds: 5,
  timeLimit: 180
});

// 더미 플레이어
const players = ref([
  { id: 'user-1', nickname: 'MapMaster', isHost: true, avatar: null },
  { id: 'user-2', nickname: 'GeoKing', isHost: false, avatar: null },
  { id: 'user-3', nickname: 'Explorer', isHost: false, avatar: null },
  { id: 'user-4', nickname: 'Traveler', isHost: false, avatar: null }
]);

// 더미 채팅
const chatMessages = ref([
  { sender: 'SYSTEM', message: '방이 생성되었습니다.', system: true },
  { sender: 'GeoKing', senderId: 'user-2', message: '안녕하세요!' },
  { sender: 'Explorer', senderId: 'user-3', message: '오 게임하러 왔어요' }
]);

// 메서드
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 900;
  if (!isMobile.value) isChatOpen.value = false;
};

const formatTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}분` : `${m}:${String(s).padStart(2, '0')}`;
};

const leaveRoom = () => {
  if (confirm('정말 방을 나가시겠습니까?')) {
    router.push('/design-f-test');
  }
};

const kickPlayer = (player) => {
  if (confirm(`${player.nickname}님을 내보내시겠습니까?`)) {
    const idx = players.value.findIndex(p => p.id === player.id);
    if (idx > -1) players.value.splice(idx, 1);
  }
};

const startGame = () => {
  isCountdown.value = true;
  countdownNum.value = 3;
  
  const interval = setInterval(() => {
    countdownNum.value--;
    if (countdownNum.value <= 0) {
      clearInterval(interval);
      isCountdown.value = false;
      alert('게임 시작! (테스트 모드)');
    }
  }, 1000);
};

const sendChat = () => {
  if (!chatInput.value.trim()) return;
  chatMessages.value.push({
    sender: myProfile.value.nickname,
    senderId: currentUserId,
    message: chatInput.value
  });
  chatInput.value = '';
  nextTick(() => {
    if (chatRef.value) {
      chatRef.value.scrollTop = chatRef.value.scrollHeight;
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
.room-f {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 헤더 */
.room-header {
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

.leave-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leave-btn:hover {
  background: #fee2e2;
}

.room-info-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.room-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.room-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.mode-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #059669;
}

.mode-badge .divider {
  color: #a7f3d0;
}

.settings-btn {
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

/* 메인 */
.room-main {
  padding: 80px 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  min-height: calc(100vh - 120px);
}

/* 좌측 섹션 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 프로필 카드 */
.my-profile-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.profile-avatar {
  position: relative;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.4rem;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
}

.online-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background: #22c55e;
  border: 3px solid white;
  border-radius: 50%;
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0 0 0.2rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.profile-role {
  font-size: 0.75rem;
  font-weight: 600;
  color: #10b981;
  background: #ecfdf5;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #e5e7eb;
}

/* 플레이어 섹션 */
.players-section {
  flex: 1;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.25rem;
  background: #fafafa;
  border-bottom: 1px solid #f3f4f6;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
}

.header-title i {
  color: #10b981;
}

.player-count {
  background: #f3f4f6;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #6b7280;
}

.connection-status {
  width: 24px;
  height: 24px;
  background: #fef3c7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: #f59e0b;
}

.connection-status.connected {
  background: #d1fae5;
  color: #10b981;
}

.players-grid {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-slot {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.player-slot.filled {
  background: white;
}

.player-slot.host {
  border-color: #fcd34d;
  background: #fffbeb;
}

.player-slot.me {
  border-color: #10b981;
  background: #ecfdf5;
}

.slot-number {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  color: #10b981;
  min-width: 20px;
}

.slot-number.empty {
  color: #d1d5db;
}

.player-avatar {
  position: relative;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
}

.player-slot.host .player-avatar {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.player-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}

.host-crown {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  background: #fbbf24;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.host-crown i {
  font-size: 0.5rem;
  color: white;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-status {
  font-size: 0.65rem;
  font-weight: 600;
}

.player-status.ready {
  color: #10b981;
}

.kick-btn {
  width: 28px;
  height: 28px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s ease;
}

.kick-btn:hover {
  background: #fee2e2;
}

.empty-slot {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
  font-size: 0.8rem;
}

.empty-slot i {
  font-size: 0.9rem;
}

/* 게임 시작 버튼 */
.start-game-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.start-game-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.start-game-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.min-players {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
}

/* 우측: 채팅 섹션 */
.right-section {
  display: flex;
  flex-direction: column;
}

.chat-section {
  flex: 1;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.close-chat {
  width: 28px;
  height: 28px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 200px;
}

.chat-msg {
  padding: 0.35rem 0.5rem;
  border-radius: 5px;
  font-size: 0.75rem;
}

.chat-msg.system {
  background: #f3f4f6;
  text-align: center;
}

.system-text {
  color: #6b7280;
  font-size: 0.65rem;
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
  font-size: 0.65rem;
  font-weight: 600;
  color: #6b7280;
  margin-right: 0.3rem;
}

.msg-text {
  color: #374151;
}

.chat-input {
  display: flex;
  gap: 0.35rem;
  padding: 0.6rem;
  border-top: 1px solid #f3f4f6;
}

.chat-input input {
  flex: 1;
  padding: 0.5rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8rem;
  outline: none;
}

.chat-input input:focus {
  border-color: #10b981;
}

.chat-input button {
  width: 32px;
  height: 32px;
  background: #10b981;
  border: none;
  border-radius: 6px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
}

.chat-input button:hover {
  background: #059669;
}

/* 모바일 하단 바 */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: none;
  z-index: 100;
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
}

.nav-btn i {
  font-size: 1rem;
}

.nav-btn.active {
  color: #10b981;
}

.unread {
  position: absolute;
  top: 6px;
  right: 30%;
  background: #ef4444;
  color: white;
  font-size: 0.5rem;
  padding: 0.1rem 0.3rem;
  border-radius: 8px;
  font-weight: 700;
}

/* 카운트다운 */
.countdown-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.countdown-content {
  text-align: center;
}

.countdown-ring {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 0 40px rgba(16, 185, 129, 0.5);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.countdown-number {
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
}

.countdown-text {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 반응형 */
@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  
  .right-section {
    position: fixed;
    top: 64px;
    right: 0;
    bottom: 56px;
    width: 100%;
    max-width: 360px;
    background: white;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 200;
    box-shadow: -4px 0 20px rgba(0,0,0,0.1);
  }
  
  .right-section.mobile-visible {
    transform: translateX(0);
  }
  
  .mobile-nav {
    display: flex;
  }
  
  .room-main {
    padding-bottom: 72px;
  }
}

@media (max-width: 640px) {
  .header-inner {
    padding: 0 1rem;
  }
  
  .leave-btn span {
    display: none;
  }
  
  .room-title {
    font-size: 0.9rem;
    max-width: 140px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .room-main {
    padding: 74px 1rem 72px;
  }
  
  .profile-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .stat-divider {
    display: none;
  }
  
  .stat-item {
    flex: 0 0 calc(50% - 0.25rem);
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 8px;
  }
}
</style>

