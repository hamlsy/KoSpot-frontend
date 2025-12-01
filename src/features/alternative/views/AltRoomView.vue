<template>
  <div class="alt-room-app">
    <AltNavigationBar 
      :is-logged-in="isLoggedIn"
      simple-mode
    />

    <main class="alt-room-content">
      <div class="alt-container">
        <!-- Room Header -->
        <div class="alt-room-header">
          <button class="alt-leave-button" @click="leaveRoom">
            <i class="fas fa-arrow-left"></i>
            <span>나가기</span>
          </button>
          <h1 class="alt-h2">{{ roomInfo.name }}</h1>
          <div class="alt-room-status-badge">
            {{ roomInfo.status === 'WAITING' ? '대기중' : '게임중' }}
          </div>
        </div>

        <div class="alt-room-layout">
          <!-- Left: Players - Fan Layout -->
          <div class="alt-players-section">
            <h2 class="alt-h3">플레이어 ({{ players.length }} / {{ roomInfo.maxPlayers }})</h2>
            <div class="alt-players-fan">
              <div 
                v-for="(player, index) in players" 
                :key="player.id"
                class="alt-player-card alt-stagger-item"
                :style="{ 
                  animationDelay: `${index * 0.1}s`,
                  transform: `rotate(${(index - players.length/2) * 5}deg) translateY(${Math.abs(index - players.length/2) * -10}px)`
                }"
              >
                <div class="alt-player-avatar">
                  <img :src="player.avatar" :alt="player.name" />
                  <div v-if="player.isReady" class="alt-ready-badge">
                    <i class="fas fa-check"></i>
                  </div>
                </div>
                <div class="alt-player-info">
                  <h4>{{ player.name }}</h4>
                  <span class="alt-player-team" :class="`alt-team-${player.team}`">
                    {{ player.team === 'A' ? '팀 A' : '팀 B' }}
                  </span>
                </div>
                <div v-if="player.isHost" class="alt-host-badge">
                  <i class="fas fa-crown"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Chat - Full Height -->
          <div class="alt-chat-section">
            <div class="alt-chat-header">
              <h3 class="alt-h3">채팅</h3>
            </div>
            <div class="alt-chat-messages">
              <div 
                v-for="msg in chatMessages" 
                :key="msg.id"
                class="alt-chat-message"
                :class="{ 'alt-own': msg.senderId === currentUserId }"
              >
                <div class="alt-message-author">{{ msg.senderName }}</div>
                <div class="alt-message-content">{{ msg.content }}</div>
              </div>
            </div>
            <div class="alt-chat-input">
              <input 
                v-model="chatInput"
                @keypress.enter="sendMessage"
                placeholder="메시지를 입력하세요..."
              />
              <button @click="sendMessage" class="alt-btn alt-btn-primary">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="alt-room-actions">
          <button class="alt-btn alt-btn-large alt-btn-accent" @click="toggleReady">
            {{ isReady ? '준비 해제' : '준비 완료' }}
          </button>
          <button 
            v-if="isHost" 
            class="alt-btn alt-btn-large alt-btn-primary" 
            :disabled="!canStartGame"
            @click="startGame"
          >
            <i class="fas fa-play"></i>
            <span>게임 시작</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AltNavigationBar from '@/features/alternative/components/AltNavigationBar.vue';

const router = useRouter();
const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));
const currentUserId = ref(localStorage.getItem('memberId') || '');
const chatInput = ref('');
const isReady = ref(false);

const roomInfo = ref({
  name: '게임 방',
  status: 'WAITING',
  maxPlayers: 6
});

const players = ref([
  { id: '1', name: '플레이어1', avatar: 'https://i.pravatar.cc/100?img=1', team: 'A', isHost: true, isReady: true },
  { id: '2', name: '플레이어2', avatar: 'https://i.pravatar.cc/100?img=2', team: 'B', isHost: false, isReady: false },
]);

const chatMessages = ref([
  { id: 1, senderId: '1', senderName: '플레이어1', content: '안녕하세요!' },
]);

const isHost = computed(() => players.value.some(p => p.id === currentUserId.value && p.isHost));
const canStartGame = computed(() => players.value.every(p => p.isReady));

function leaveRoom() {
  router.push({ name: 'AltLobbyView' });
}

function toggleReady() {
  isReady.value = !isReady.value;
}

function sendMessage() {
  if (!chatInput.value.trim()) return;
  chatMessages.value.push({
    id: Date.now(),
    senderId: currentUserId.value,
    senderName: '나',
    content: chatInput.value
  });
  chatInput.value = '';
}

function startGame() {
  console.log('Starting game...');
}
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

.alt-room-app {
  min-height: 100vh;
  background: var(--alt-bg-base);
}

.alt-room-content {
  padding: var(--alt-space-lg) 0 var(--alt-space-2xl);
}

.alt-room-header {
  display: flex;
  align-items: center;
  gap: var(--alt-space-md);
  margin-bottom: var(--alt-space-xl);
}

.alt-leave-button {
  display: flex;
  align-items: center;
  gap: var(--alt-space-xs);
  padding: 0.75rem 1.5rem;
  background: var(--alt-surface);
  border: 2px solid var(--alt-korea-red);
  border-radius: var(--alt-radius-md);
  color: var(--alt-korea-red);
  font-family: var(--alt-font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--alt-transition-base);
}

.alt-leave-button:hover {
  background: var(--alt-korea-red);
  color: var(--alt-text-secondary);
}

.alt-room-status-badge {
  padding: 0.5rem 1rem;
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  font-weight: 700;
  text-transform: uppercase;
  border-radius: var(--alt-radius-full);
}

.alt-room-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--alt-space-xl);
  margin-bottom: var(--alt-space-xl);
}

.alt-players-section h2 {
  margin-bottom: var(--alt-space-lg);
}

.alt-players-fan {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--alt-space-lg);
  padding: var(--alt-space-xl);
}

.alt-player-card {
  position: relative;
  width: 150px;
  padding: var(--alt-space-md);
  background: var(--alt-surface);
  border-radius: var(--alt-radius-lg);
  box-shadow: var(--alt-surface-shadow);
  text-align: center;
  transition: all var(--alt-transition-bounce);
}

.alt-player-card:hover {
  transform: translateY(-8px) scale(1.05) !important;
  box-shadow: var(--alt-surface-shadow-hover);
}

.alt-player-avatar {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto var(--alt-space-sm);
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--alt-primary);
}

.alt-player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alt-ready-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
}

.alt-player-info h4 {
  font-family: var(--alt-font-heading-en);
  margin: 0 0 0.5rem 0;
  color: var(--alt-text-primary);
}

.alt-player-team {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: var(--alt-font-small);
  font-weight: 700;
  text-transform: uppercase;
  border-radius: var(--alt-radius-full);
}

.alt-team-A {
  background: #3b82f6;
  color: white;
}

.alt-team-B {
  background: #ef4444;
  color: white;
}

.alt-host-badge {
  position: absolute;
  top: var(--alt-space-xs);
  right: var(--alt-space-xs);
  width: 28px;
  height: 28px;
  background: var(--alt-korea-yellow);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--alt-text-primary);
}

.alt-chat-section {
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
  padding: var(--alt-space-md);
  border-bottom: 2px solid rgba(14, 165, 233, 0.2);
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

.alt-room-actions {
  display: flex;
  gap: var(--alt-space-md);
  justify-content: center;
}

@media (max-width: 1024px) {
  .alt-room-layout {
    grid-template-columns: 1fr;
  }

  .alt-chat-section {
    position: static;
    height: 400px;
  }
}

@media (max-width: 768px) {
  .alt-players-fan {
    flex-direction: column;
    align-items: center;
  }

  .alt-player-card {
    transform: none !important;
  }

  .alt-room-actions {
    flex-direction: column;
  }

  .alt-room-actions .alt-btn {
    width: 100%;
  }
}
</style>

