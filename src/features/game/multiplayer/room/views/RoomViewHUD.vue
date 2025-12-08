<template>
  <div class="hud-room">
    <!-- 배경 효과 -->
    <div class="hud-bg-grid"></div>
    <div class="hud-bg-scanline"></div>
    
    <!-- 헤더 -->
    <header class="hud-header">
      <div class="header-border">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
      </div>
      
      <div class="header-content">
        <div class="header-left">
          <button class="hud-back-btn" @click="leaveRoom">
            <i class="fas fa-sign-out-alt"></i>
            <span>LEAVE</span>
          </button>
          
          <div class="room-info">
            <div class="room-id">
              <span class="id-label">ROOM</span>
              <span class="id-value">#{{ String(roomData.id).padStart(3, '0') }}</span>
            </div>
            <h1 class="room-title">{{ roomData.title }}</h1>
          </div>
        </div>
        
        <div class="header-center">
          <div class="game-mode-display">
            <div class="mode-icon">
              <i :class="roomData.gameMode === 'roadview' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
            </div>
            <div class="mode-info">
              <span class="mode-label">{{ roomData.gameMode === 'roadview' ? 'ROADVIEW' : 'PHOTO' }} MODE</span>
              <span class="mode-sub">{{ roomData.totalRounds }} ROUNDS | {{ formatTime(roomData.timeLimit) }}</span>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <button v-if="isHost" class="hud-settings-btn" @click="showSettings = true">
            <i class="fas fa-cog"></i>
          </button>
          
          <button 
            v-if="isHost"
            class="hud-start-btn"
            :disabled="players.length < 2"
            @click="startGame"
          >
            <div class="btn-glow"></div>
            <i class="fas fa-play"></i>
            <span>START GAME</span>
          </button>
        </div>
      </div>
    </header>
    
    <!-- 메인 콘텐츠 -->
    <main class="hud-main">
      <div class="main-layout">
        <!-- 좌측: 플레이어 슬롯 -->
        <div class="left-panel">
          <div class="players-panel">
            <div class="panel-border">
              <div class="corner corner-tl"></div>
              <div class="corner corner-tr"></div>
              <div class="corner corner-bl"></div>
              <div class="corner corner-br"></div>
            </div>
            <div class="panel-scanline"></div>
            
            <div class="panel-header">
              <div class="panel-title">
                <i class="fas fa-users"></i>
                <span>PLAYERS</span>
              </div>
              <div class="player-count">
                {{ players.length }}/{{ roomData.maxPlayers }}
              </div>
            </div>
            
            <div class="player-slots">
              <div 
                v-for="slot in roomData.maxPlayers" 
                :key="slot"
                class="player-slot"
                :class="{ 
                  'filled': players[slot - 1],
                  'host': players[slot - 1]?.isHost,
                  'me': players[slot - 1]?.id === currentUserId
                }"
              >
                <template v-if="players[slot - 1]">
                  <div class="slot-indicator">
                    <span class="slot-number">{{ String(slot).padStart(2, '0') }}</span>
                  </div>
                  <div class="player-info">
                    <div class="player-avatar">
                      <i class="fas fa-user-astronaut"></i>
                      <span v-if="players[slot - 1].isHost" class="host-badge">
                        <i class="fas fa-crown"></i>
                      </span>
                    </div>
                    <div class="player-details">
                      <span class="player-name">{{ players[slot - 1].nickname }}</span>
                      <span class="player-status">
                        <span class="status-dot"></span>
                        {{ players[slot - 1].isHost ? 'HOST' : 'READY' }}
                      </span>
                    </div>
                  </div>
                  <div class="player-actions" v-if="isHost && !players[slot - 1].isHost">
                    <button class="kick-btn" @click="kickPlayer(players[slot - 1])">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="slot-indicator empty">
                    <span class="slot-number">{{ String(slot).padStart(2, '0') }}</span>
                  </div>
                  <div class="empty-slot">
                    <i class="fas fa-user-plus"></i>
                    <span>WAITING...</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 우측: 채팅 -->
        <div class="right-panel" :class="{ 'mobile-visible': isChatVisible }">
          <div class="chat-panel">
            <div class="panel-border">
              <div class="corner corner-tl"></div>
              <div class="corner corner-tr"></div>
              <div class="corner corner-bl"></div>
              <div class="corner corner-br"></div>
            </div>
            <div class="panel-scanline purple"></div>
            
            <div class="chat-header">
              <div class="chat-title">
                <i class="fas fa-comments"></i>
                <span>ROOM CHAT</span>
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
    
    <!-- 모바일 하단 바 -->
    <div class="mobile-bottom-bar" v-if="isMobile">
      <button 
        class="mobile-nav-btn"
        :class="{ active: !isChatVisible }"
        @click="isChatVisible = false"
      >
        <i class="fas fa-users"></i>
        <span>PLAYERS</span>
      </button>
      <button 
        class="mobile-nav-btn"
        :class="{ active: isChatVisible }"
        @click="isChatVisible = true"
      >
        <i class="fas fa-comments"></i>
        <span>CHAT</span>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </button>
    </div>
    
    <!-- 게임 시작 카운트다운 -->
    <transition name="countdown">
      <div v-if="isCountdownActive" class="countdown-overlay">
        <div class="countdown-content">
          <div class="countdown-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
          <div class="countdown-number">{{ countdownSeconds }}</div>
          <p class="countdown-text">GAME STARTING...</p>
        </div>
      </div>
    </transition>
    
    <!-- 설정 모달 -->
    <transition name="modal">
      <div v-if="showSettings" class="hud-modal-overlay" @click.self="showSettings = false">
        <div class="hud-settings-modal">
          <div class="modal-border">
            <div class="corner corner-tl"></div>
            <div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div>
            <div class="corner corner-br"></div>
          </div>
          <div class="modal-scanline"></div>
          
          <div class="modal-content">
            <div class="modal-header">
              <i class="fas fa-cog"></i>
              <h2>ROOM SETTINGS</h2>
              <button class="close-btn" @click="showSettings = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-body">
              <p class="settings-note">Room settings are locked after creation (Demo)</p>
            </div>
            
            <div class="modal-footer">
              <button class="hud-btn" @click="showSettings = false">
                <span>CLOSE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 반응형
const isMobile = ref(false);
const isChatVisible = ref(false);
const unreadCount = ref(0);

// 더미 데이터
const currentUserId = 'user-1';
const isHost = ref(true);

const roomData = ref({
  id: 42,
  title: '초보자 환영! 같이 놀아요',
  gameMode: 'roadview',
  maxPlayers: 6,
  totalRounds: 5,
  timeLimit: 180,
  isPrivate: false
});

const players = ref([
  { id: 'user-1', nickname: 'MapMaster', isHost: true },
  { id: 'user-2', nickname: 'GeoKing', isHost: false },
  { id: 'user-3', nickname: 'ProGamer', isHost: false },
  { id: 'user-4', nickname: 'Explorer', isHost: false }
]);

const chatMessages = ref([
  { sender: 'SYSTEM', message: 'Room created. Waiting for players...', system: true },
  { sender: 'GeoKing', senderId: 'user-2', message: '안녕하세요!' },
  { sender: 'ProGamer', senderId: 'user-3', message: '오 게임하러 왔어요' },
  { sender: 'MapMaster', senderId: 'user-1', message: '환영합니다~' }
]);

const chatInput = ref('');
const chatMessagesRef = ref(null);

// 카운트다운
const isCountdownActive = ref(false);
const countdownSeconds = ref(3);

// 설정 모달
const showSettings = ref(false);

// 메서드
const checkMobileView = () => {
  isMobile.value = window.innerWidth <= 1024;
  if (!isMobile.value) {
    isChatVisible.value = false;
  }
};

const formatTime = (seconds) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec === 0 ? `${min}MIN` : `${min}:${String(sec).padStart(2, '0')}`;
};

const leaveRoom = () => {
  if (confirm('Are you sure you want to leave the room?')) {
    router.push('/hud-design-test');
  }
};

const startGame = () => {
  isCountdownActive.value = true;
  countdownSeconds.value = 3;
  
  const interval = setInterval(() => {
    countdownSeconds.value--;
    if (countdownSeconds.value <= 0) {
      clearInterval(interval);
      isCountdownActive.value = false;
      alert('Game Started! (Demo Mode)');
    }
  }, 1000);
};

const kickPlayer = (player) => {
  if (confirm(`Kick ${player.nickname}?`)) {
    const index = players.value.findIndex(p => p.id === player.id);
    if (index > -1) {
      players.value.splice(index, 1);
    }
  }
};

const sendChatMessage = () => {
  if (!chatInput.value.trim()) return;
  
  chatMessages.value.push({
    sender: 'MapMaster',
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
  checkMobileView();
  window.addEventListener('resize', checkMobileView);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobileView);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

.hud-room {
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
  height: 80px;
  background: linear-gradient(180deg, rgba(12, 18, 34, 0.98) 0%, rgba(12, 18, 34, 0.9) 100%);
  backdrop-filter: blur(10px);
  z-index: 100;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
}

.header-border {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.hud-back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
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
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.room-id {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.id-label {
  font-size: 0.55rem;
  color: #64748b;
  letter-spacing: 0.1em;
}

.id-value {
  font-size: 0.65rem;
  font-weight: 700;
  color: #22d3ee;
}

.room-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: 0.05em;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.game-mode-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.2);
  padding: 0.5rem 1rem;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.mode-icon {
  font-size: 1.25rem;
  color: #22d3ee;
}

.mode-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.mode-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #22d3ee;
  letter-spacing: 0.1em;
}

.mode-sub {
  font-size: 0.55rem;
  color: #64748b;
  letter-spacing: 0.05em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hud-settings-btn {
  width: 40px;
  height: 40px;
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.hud-settings-btn:hover {
  background: rgba(100, 116, 139, 0.2);
  color: #e2e8f0;
}

.hud-start-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%);
  border: 2px solid rgba(34, 211, 238, 0.5);
  color: #22d3ee;
  padding: 0.6rem 1.25rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  letter-spacing: 0.1em;
  overflow: hidden;
}

.hud-start-btn .btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.3), transparent);
  transform: translateX(-100%);
  animation: glow-slide 2s infinite;
}

@keyframes glow-slide {
  0% { transform: translateX(-100%); }
  50%, 100% { transform: translateX(100%); }
}

.hud-start-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(34, 211, 238, 0.15) 100%);
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.4);
}

.hud-start-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.hud-start-btn:disabled .btn-glow {
  animation: none;
}

/* 메인 콘텐츠 */
.hud-main {
  padding: 100px 1.5rem 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100vh;
}

.main-layout {
  display: flex;
  gap: 1.5rem;
  height: calc(100vh - 120px);
}

.left-panel {
  flex: 1;
  min-width: 0;
}

.right-panel {
  width: 350px;
  flex-shrink: 0;
}

/* 플레이어 패널 */
.players-panel {
  position: relative;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  height: 100%;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  display: flex;
  flex-direction: column;
}

.panel-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.panel-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(34, 211, 238, 0.02) 2px,
    rgba(34, 211, 238, 0.02) 4px
  );
  pointer-events: none;
}

.panel-scanline.purple {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(167, 139, 250, 0.02) 2px,
    rgba(167, 139, 250, 0.02) 4px
  );
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
  position: relative;
  z-index: 1;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #22d3ee;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.player-count {
  font-size: 0.8rem;
  font-weight: 700;
  color: #22d3ee;
  background: rgba(34, 211, 238, 0.1);
  padding: 0.35rem 0.75rem;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.player-slots {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  z-index: 1;
}

.player-slot {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(100, 116, 139, 0.05);
  border: 1px solid rgba(100, 116, 139, 0.2);
  padding: 0.85rem 1rem;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.player-slot.filled {
  background: rgba(34, 211, 238, 0.05);
  border-color: rgba(34, 211, 238, 0.3);
}

.player-slot.host {
  background: rgba(251, 191, 36, 0.05);
  border-color: rgba(251, 191, 36, 0.3);
}

.player-slot.me {
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
}

.slot-indicator {
  width: 36px;
  height: 36px;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.slot-indicator.empty {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.2);
}

.slot-number {
  font-size: 0.7rem;
  font-weight: 700;
  color: #22d3ee;
}

.slot-indicator.empty .slot-number {
  color: #64748b;
}

.player-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.player-avatar {
  position: relative;
  width: 44px;
  height: 44px;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.1rem;
  color: #22d3ee;
}

.host .player-avatar {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fbbf24;
}

.host-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: #fbbf24;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  color: #0c1222;
  border: 2px solid #0c1222;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.player-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: 0.05em;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6rem;
  color: #64748b;
  letter-spacing: 0.1em;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #22d3ee;
  border-radius: 50%;
  box-shadow: 0 0 6px #22d3ee;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.player-actions {
  margin-left: auto;
}

.kick-btn {
  width: 32px;
  height: 32px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.75rem;
}

.kick-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
}

.empty-slot {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #475569;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}

.empty-slot i {
  font-size: 1rem;
}

/* 채팅 패널 */
.chat-panel {
  position: relative;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  height: 100%;
  display: flex;
  flex-direction: column;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.chat-panel .corner {
  border-color: #a78bfa;
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

.chat-close {
  margin-left: auto;
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

/* 모바일 하단 바 */
.mobile-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(180deg, rgba(12, 18, 34, 0.95) 0%, rgba(12, 18, 34, 0.98) 100%);
  border-top: 1px solid rgba(34, 211, 238, 0.2);
  display: none;
  z-index: 100;
}

.mobile-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: transparent;
  border: none;
  color: #64748b;
  font-family: 'Orbitron', monospace;
  font-size: 0.55rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.mobile-nav-btn i {
  font-size: 1.1rem;
}

.mobile-nav-btn.active {
  color: #22d3ee;
}

.unread-badge {
  position: absolute;
  top: 8px;
  right: 30%;
  background: #ef4444;
  color: white;
  font-size: 0.5rem;
  padding: 0.1rem 0.3rem;
  border-radius: 8px;
  font-weight: 700;
}

/* 카운트다운 오버레이 */
.countdown-overlay {
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 34, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.countdown-content {
  text-align: center;
}

.countdown-rings {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 2rem;
}

.ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.ring-1 {
  border-top-color: #22d3ee;
}

.ring-2 {
  inset: 15px;
  border-top-color: #a78bfa;
  animation-duration: 1.5s;
  animation-direction: reverse;
}

.ring-3 {
  inset: 30px;
  border-top-color: #fbbf24;
  animation-duration: 1s;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.countdown-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4rem;
  font-weight: 900;
  color: #22d3ee;
  text-shadow: 0 0 40px rgba(34, 211, 238, 0.5);
}

.countdown-text {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #22d3ee;
  letter-spacing: 0.2em;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.countdown-enter-active,
.countdown-leave-active {
  transition: all 0.3s ease;
}

.countdown-enter-from,
.countdown-leave-to {
  opacity: 0;
}

/* 설정 모달 */
.hud-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.hud-settings-modal {
  position: relative;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  width: 100%;
  max-width: 500px;
  clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
}

.modal-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.modal-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(34, 211, 238, 0.02) 2px,
    rgba(34, 211, 238, 0.02) 4px
  );
  pointer-events: none;
}

.modal-content {
  position: relative;
  z-index: 1;
  padding: 1.5rem;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
}

.modal-header i {
  font-size: 1.25rem;
  color: #22d3ee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #22d3ee;
  letter-spacing: 0.1em;
}

.close-btn {
  margin-left: auto;
  width: 32px;
  height: 32px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.settings-note {
  color: #64748b;
  font-size: 0.75rem;
  text-align: center;
  padding: 2rem 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid rgba(34, 211, 238, 0.2);
}

.hud-btn {
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  color: #22d3ee;
  padding: 0.6rem 1.25rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  letter-spacing: 0.1em;
}

.hud-btn:hover {
  background: rgba(34, 211, 238, 0.2);
  box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .hud-settings-modal,
.modal-leave-to .hud-settings-modal {
  transform: scale(0.95) translateY(-20px);
}

/* 반응형 */
@media (max-width: 1024px) {
  .right-panel {
    position: fixed;
    top: 80px;
    right: 0;
    bottom: 60px;
    width: 100%;
    max-width: 400px;
    z-index: 200;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .right-panel.mobile-visible {
    transform: translateX(0);
  }
  
  .mobile-bottom-bar {
    display: flex;
  }
  
  .hud-main {
    padding-bottom: 80px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }
  
  .header-center {
    display: none;
  }
  
  .hud-back-btn span,
  .hud-start-btn span {
    display: none;
  }
  
  .hud-start-btn {
    padding: 0.6rem;
  }
  
  .room-title {
    font-size: 0.85rem;
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .hud-main {
    padding: 90px 1rem 80px;
  }
  
  .main-layout {
    height: auto;
    min-height: calc(100vh - 170px);
  }
}
</style>

