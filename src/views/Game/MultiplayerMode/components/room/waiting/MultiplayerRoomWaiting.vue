<template>
  <div class="multiplayer-room-waiting">
    <!-- 배경 요소 -->
    <div class="mode-background"></div>

    <!-- 헤더 컴포넌트 -->
    <RoomHeader
      :room-data="roomData"
      :is-host="isHost"
      :can-start-game="canStartGame"
      :unread-messages="unreadMessages"
      :is-team-mode="isTeamMode"
      @open-settings="openRoomSettings"
      @toggle-chat="toggleChat"
      @leave-room="leaveRoom"
      @start-game="startGame"
    />

    <!-- 메인 컨텐츠 영역 -->
    <div class="room-content">
      <!-- 왼쪽 패널: 플레이어 목록 및 게임 정보 -->
      <div class="left-panel">
        <!-- 플레이어 목록 섹션 -->
        <div class="panel-section">
          <h3 class="section-title">
            <i class="fas fa-users"></i>
            참가자 ({{ players.length }}/{{ roomData.maxPlayers }})
          </h3>

          <!-- 팀 모드인 경우 팀별로 플레이어 목록 표시 -->
          <TeamPlayersList
            v-if="isTeamMode"
            :teams="availableTeams"
            :players="players"
            :current-user-id="currentUserId"
            :is-host="isHost"
            :max-players-per-team="maxPlayersPerTeam"
            :player-messages="playerMessages"
            @show-player-details="showPlayerDetails"
            @kick-player="confirmKickPlayer"
            @join-team="joinTeam"
          />

          <!-- 개인 모드인 경우 플레이어 목록 표시 -->
          <IndividualPlayersList
            v-else
            :players="players"
            :current-user-id="currentUserId"
            :is-host="isHost"
            :player-messages="playerMessages"
            @show-player-details="showPlayerDetails"
            @kick-player="confirmKickPlayer"
          />
        </div>
      </div>

      <!-- 오른쪽 패널: 게임 정보 및 설정 -->
      <div class="right-panel">
        <!-- 게임 정보 섹션 -->
        <div class="panel-section">
          <h3 class="section-title">
            <i class="fas fa-info-circle"></i> 게임 정보
          </h3>

          <div class="game-info-card">
            <div class="game-info-item">
              <div class="info-label">게임 모드</div>
              <div class="info-value">
                <i :class="modeIcon"></i>
                {{ gameModeName }}
              </div>
            </div>

            <div class="game-info-item">
              <div class="info-label">라운드 수</div>
              <div class="info-value">{{ roomData.rounds }}</div>
            </div>

            <div class="game-info-item">
              <div class="info-label">제한 시간</div>
              <div class="info-value">{{ roomData.timeLimit }}초</div>
            </div>

            <div class="game-info-item">
              <div class="info-label">게임 지역</div>
              <div class="info-value">{{ roomData.region || "전국" }}</div>
            </div>

            <div class="game-info-item" v-if="isTeamMode">
              <div class="info-label">팀 모드</div>
              <div class="info-value"><i class="fas fa-users"></i> 팀전</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 채팅 모달 -->
    <div class="chat-modal" :class="{ active: isChatOpen }">
      <div class="chat-container">
        <div class="chat-header">
          <h3 class="chat-title"><i class="fas fa-comments"></i> 채팅</h3>
          <button class="close-button" @click="toggleChat">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="chat-messages" ref="chatMessages">
          <ChatMessage
            v-for="(message, index) in chatMessages"
            :key="index"
            :message="message"
            :current-user-id="currentUserId"
          />
        </div>

        <div class="chat-input-container">
          <input
            type="text"
            class="chat-input"
            v-model="chatInput"
            placeholder="메시지를 입력하세요..."
            @keyup.enter="sendChatMessage"
          />
          <button class="send-button" @click="sendChatMessage">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 방 설정 모달 -->
    <RoomSettingsModal
      :is-active="isRoomSettingsOpen"
      :room-data="roomData"
      @close="closeRoomSettings"
      @save="updateRoomSettings"
    />

    <!-- 카운트다운 오버레이 -->
    <CountdownOverlay
      :is-active="isCountdownActive"
      :countdown="countdown"
      :message="countdownMessage"
      :is-host="isHost"
      :can-cancel="canCancelCountdown"
      @cancel="cancelCountdown"
    />

    <!-- 강퇴 확인 모달 -->
    <KickConfirmationModal
      :is-active="isKickModalOpen"
      :player="playerToKick"
      @close="closeKickModal"
      @confirm="kickPlayer"
    />

    <!-- 플레이어 상세 정보 모달 -->
    <PlayerDetailsModal
      :is-active="isPlayerDetailsOpen"
      :player="selectedPlayer"
      :is-host="isHost"
      :current-user-id="currentUserId"
      @close="closePlayerDetails"
      @kick="confirmKickPlayer"
    />
    
    <!-- 채팅 토글 버튼 (오른쪽 하단에 고정) -->
    <button class="chat-toggle-button" @click="toggleChat">
      <i class="fas fa-comments"></i>
      <div class="notification-badge" v-if="unreadMessages > 0">
        {{ unreadMessages > 9 ? '9+' : unreadMessages }}
      </div>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import RoomHeader from './components/RoomHeader.vue';
import TeamPlayersList from './components/TeamWaitingList.vue';
import IndividualPlayersList from './components/IndividualWaitingList.vue';
import CountdownOverlay from './components/CountdownOverlay.vue';
import KickConfirmationModal from './components/KickConfirmationModal.vue';
import PlayerDetailsModal from './components/PlayerDetailsModal.vue';
import RoomSettingsModal from './components/RoomSettingsModal.vue';
import ChatMessage from './components/ChatMessage.vue';

// Props
const props = defineProps({
  roomData: {
    type: Object,
    default: () => ({
      id: 'room123',
      title: 'KoSpot 멀티플레이어 게임방',
      gameMode: 'roadview',
      isTeamMode: true,
      maxPlayers: 8,
      rounds: 5,
      timeLimit: 60,
      isPrivate: false,
      password: '',
      hostId: 'user1',
      createdAt: new Date().toISOString(),
    })
  },
  players: {
    type: Array,
    default: () => [
      { id: 'user1', nickname: '방장닉네임', profileImage: '', team: 1, isReady: true, isHost: true },
      { id: 'user2', nickname: '플레이어2', profileImage: '', team: 1, isReady: true, isHost: false },
      { id: 'user3', nickname: '플레이어3', profileImage: '', team: 2, isReady: false, isHost: false },
      { id: 'user4', nickname: '플레이어4', profileImage: '', team: 2, isReady: true, isHost: false },
      { id: 'user5', nickname: '플레이어5', profileImage: '', team: 1, isReady: false, isHost: false },
    ]
  },
  isHost: {
    type: Boolean,
    default: true
  },
  currentUserId: {
    type: String,
    default: 'user1'
  },
});

const emit = defineEmits([
  'leave-room',
  'start-game',
  'send-chat',
  'update-room-settings',
  'kick-player',
  'join-team'
]);

// State
const isChatOpen = ref(false);
const isRoomSettingsOpen = ref(false);
const isCountdownActive = ref(false);
const isKickModalOpen = ref(false);
const isPlayerDetailsOpen = ref(false);
const chatMessages = ref([
  {
    id: 1,
    senderId: 'user2',
    content: '안녕하세요! 게임 시작하나요?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 2,
    senderId: 'user1',
    content: '네, 곧 시작할게요. 모두 준비해주세요!',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 3,
    senderId: 'user3',
    content: '첫 게임이라 잘 모르겠어요. 어떻게 하는 건가요?',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 4,
    senderId: 'user1',
    content: '로드뷰나 사진을 보고 지도에 위치를 찍는 게임이에요!',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: 5,
    senderId: 'user4',
    content: '저는 준비 완료했습니다!',
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
  },
]);
const chatInput = ref('');
const unreadMessages = ref(0);
const countdown = ref(5);
const countdownMessage = ref('준비하세요!');
const canCancelCountdown = ref(true);
const playerToKick = ref(null);
const selectedPlayer = ref(null);
const playerMessages = ref({});

// DOM refs
const chatMessagesRef = ref(null);

// 로컬 상태 (props 복사)
const localRoomData = ref({...props.roomData});

// props가 변경되면 로컬 상태 업데이트
watch(() => props.roomData, (newVal) => {
  localRoomData.value = {...newVal};
}, { deep: true });

// Computed properties
const isTeamMode = computed(() => {
  return localRoomData.value.isTeamMode === true;
});

const gameModeName = computed(() => {
const modes = {
'roadview': '로드뷰 모드',
'photo': '포토 모드',
'mixed': '믹스 모드',
'team': '팀 모드'
};
return modes[props.roomData.gameMode] || '알 수 없음';
});

const modeIcon = computed(() => {
const icons = {
'roadview': 'fas fa-street-view',
'photo': 'fas fa-camera',
'mixed': 'fas fa-random',
'team': 'fas fa-users'
};
return icons[props.roomData.gameMode] || 'fas fa-question';
});

const canStartGame = computed(() => {
  // 최소 2명 이상의 플레이어가 있어야 시작 가능
  if (props.players.length < 2) return false;
  
  // 팀 모드인 경우 각 팀에 최소 1명 이상의 플레이어가 있어야 함
  if (isTeamMode.value) {
    const teamCounts = {};
    props.players.forEach(player => {
      if (player.teamId) {
        teamCounts[player.teamId] = (teamCounts[player.teamId] || 0) + 1;
      }
    });
    
    // 최소 2개 이상의 팀에 플레이어가 있어야 함
    const teamsWithPlayers = Object.keys(teamCounts).length;
    if (teamsWithPlayers < 2) return false;
    
    // 각 팀에 최소 1명 이상의 플레이어가 있어야 함
    for (const team of availableTeams.value) {
      if (!teamCounts[team.id] || teamCounts[team.id] < 1) {
        return false;
      }
    }
    
    return true;
  }
  
  return true;
});

const availableTeams = computed(() => {
return [
{ id: 'blue', name: '블루 팀' },
{ id: 'red', name: '레드 팀' },
{ id: 'green', name: '그린 팀' },
{ id: 'yellow', name: '옐로우 팀' }
];
});

const maxPlayersPerTeam = computed(() => {
  return 4; // 각 팀별 플레이어 제한은 4명으로 고정
});

// Methods
const openRoomSettings = () => {
isRoomSettingsOpen.value = true;
};

const closeRoomSettings = () => {
isRoomSettingsOpen.value = false;
}

const updateRoomSettings = (settings) => {
  // 로컬 상태 업데이트 (UI 즉시 반영을 위해)
  localRoomData.value = {
    ...localRoomData.value,
    ...settings
  };
  
  // 부모 컴포넌트에 업데이트 알림
  emit('update-room-settings', settings);
  closeRoomSettings();
};

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
  if (isChatOpen.value) {
    unreadMessages.value = 0;
    nextTick(() => {
      scrollChatToBottom();
    });
  }
};

const scrollChatToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

const sendChatMessage = () => {
  if (!chatInput.value.trim()) return;
  
  emit('send-chat', chatInput.value);
  chatInput.value = '';
};

const leaveRoom = () => {
  emit('leave-room');
};

const startGame = () => {
  if (!canStartGame.value) return;
  
  isCountdownActive.value = true;
  countdown.value = 5;
  
  const countdownInterval = setInterval(() => {
    countdown.value--;
    
    if (countdown.value <= 0) {
      clearInterval(countdownInterval);
      isCountdownActive.value = false;
      emit('start-game');
    }
  }, 1000);
};

const cancelCountdown = () => {
  isCountdownActive.value = false;
  countdown.value = 5;
};

const confirmKickPlayer = (player) => {
  playerToKick.value = player;
  isKickModalOpen.value = true;
  isPlayerDetailsOpen.value = false;
};

const closeKickModal = () => {
  isKickModalOpen.value = false;
  playerToKick.value = null;
};

const kickPlayer = () => {
  if (playerToKick.value) {
    emit('kick-player', playerToKick.value.id);
    closeKickModal();
  }
};

const showPlayerDetails = (player) => {
  selectedPlayer.value = player;
  isPlayerDetailsOpen.value = true;
};

const closePlayerDetails = () => {
  isPlayerDetailsOpen.value = false;
  selectedPlayer.value = null;
};

const joinTeam = (teamId) => {
  // 현재 사용자의 플레이어 객체 찾기
  const currentPlayerIndex = props.players.findIndex(player => player.id === props.currentUserId);
  if (currentPlayerIndex === -1) return;
  
  // 플레이어 객체 복사 및 팀 ID 업데이트
  const updatedPlayers = [...props.players];
  updatedPlayers[currentPlayerIndex] = {
    ...updatedPlayers[currentPlayerIndex],
    teamId: teamId
  };
  
  // 부모 컴포넌트에 업데이트된 플레이어 목록 전달
  emit('join-team', { teamId, updatedPlayers });
};

const getPlayerName = (playerId) => {
  const player = props.players.find(p => p.id === playerId);
  return player ? player.nickname : '알 수 없음';
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

// Watchers
watch(() => props.chatMessages, (newMessages) => {
  if (newMessages && newMessages.length > chatMessages.value.length) {
    const newCount = newMessages.length - chatMessages.value.length;
    
    if (!isChatOpen.value) {
      unreadMessages.value += newCount;
    }
    
    chatMessages.value = newMessages;
    
    if (isChatOpen.value) {
      nextTick(() => {
        scrollChatToBottom();
      });
    }
  }
}, { deep: true });

// Lifecycle hooks
onMounted(() => {
  // 초기 채팅 메시지 로드
  if (props.chatMessages) {
    chatMessages.value = props.chatMessages;
  }
});
</script>

<style scoped>
.multiplayer-room-waiting {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  padding: 1.5rem;
  overflow-x: hidden;
  overflow-y: auto;
}

.mode-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  z-index: -1;
}

.room-content {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.left-panel {
  flex: 2;
  min-width: 0;
}

.right-panel {
  flex: 1;
  min-width: 300px;
}

.panel-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: black;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #6366f1;
}

/* Game info card styling */
.game-info-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.game-info-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
}

.game-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.game-info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-weight: 600;
  color: black;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}


.settings-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: none;
  border-radius: 8px;
  color: #4b5563;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-button:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  transform: translateY(-1px);
}

.settings-button i {
  color: #4b5563;
}

.start-game-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.start-game-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.start-game-button:disabled {
  background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

.start-game-button i {
  color: white;
}

/* Chat modal styling */
.chat-modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 350px;
  background: white;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.chat-modal.active {
  transform: translateX(0);
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
}

.chat-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

.chat-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: black;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-title i {
  color: #3b82f6;
}

.close-button {
  background: none;
  border: none;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.chat-messages {
  flex: 1;
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-input-container {
  display: flex;
  padding: 1rem;
  border-top: 1px solid #f3f4f6;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  font-size: 0.9rem;
  color: black;
  outline: none;
  transition: all 0.2s ease;
}

.chat-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: all 0.2s ease;
}

.send-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: scale(1.05);
}

/* 채팅 토글 버튼 스타일링 */
.chat-toggle-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  z-index: 50;
}

.chat-toggle-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.chat-toggle-button i {
  font-size: 1.5rem;
}

.chat-toggle-button .notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

/* Responsive styling */
@media (max-width: 1024px) {
  .room-content {
    flex-direction: column;
  }

  .right-panel {
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .multiplayer-room-waiting {
    padding: 1rem;
  }

  .chat-modal {
    width: 100%;
  }
  
  .chat-toggle-button {
    bottom: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
  }
}
</style>

