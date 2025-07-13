<template>
  <div class="multiplayer-room-waiting">
    <!-- 배경 요소 -->
    <div class="mode-background"></div>

    <!-- 메인 컨텐츠 영역 -->
    <div class="room-content">
      <!-- 왼쪽 패널: 헤더 + 플레이어 목록 -->
      <div class="left-panel">
        <!-- 헤더 컴포넌트 -->
        <RoomHeader
          :room-data="localRoomData"
          :is-host="isHost"
          :can-start-game="canStartGame"
          :unread-messages="unreadMessages"
          :is-team-mode="isTeamMode"
          @open-settings="openRoomSettings"
          @toggle-chat="toggleChat"
          @leave-room="leaveRoom"
          @start-game="startGame"
        />

        <!-- 플레이어 목록 -->
        <div class="panel-section">
          <h3 class="section-title">
            <i class="fas fa-users"></i>
            참가자 ({{ localPlayers.length }}/{{ localRoomData.maxPlayers }})
          </h3>

          <!-- 팀 모드인 경우 팀별로 플레이어 목록 표시 -->
          <TeamWaitingList
            v-if="isTeamMode"
            :teams="availableTeams"
            :players="localPlayers"
            :current-user-id="currentUserId"
            :is-host="isHost"
            :max-players-per-team="maxPlayersPerTeam"
            :player-messages="playerMessages"
            @show-player-details="showPlayerDetails"
            @kick-player="confirmKickPlayer"
            @join-team="joinTeam"
          />

          <!-- 개인 모드인 경우 플레이어 목록 표시 -->
          <IndividualWaitingList
            v-else
            :players="localPlayers"
            :current-user-id="currentUserId"
            :is-host="isHost"
            :max-players="localRoomData.maxPlayers"
            :player-messages="playerMessages"
            @show-player-details="showPlayerDetails"
            @kick-player="confirmKickPlayer"
          />
        </div>
      </div>

      <!-- 오른쪽 패널: 채팅 전체 높이 -->
      <div class="right-panel">
        <div class="chat-panel">
          <div class="chat-header">
            <div class="chat-title">
              <i class="fas fa-comments"></i>
              <span>채팅</span>
              <div class="chat-notification" v-if="unreadMessages > 0">
                {{ unreadMessages > 9 ? '9+' : unreadMessages }}
              </div>
            </div>
            <div class="chat-status">
              <i class="fas fa-circle online-indicator"></i>
              <span>{{ localPlayers.length }}명 온라인</span>
            </div>
          </div>

          <div class="chat-container">
            <div class="chat-messages" ref="chatMessagesRef">
              <div class="chat-welcome">
                <div class="welcome-icon">
                  <i class="fas fa-comments"></i>
                </div>
                <p class="welcome-text">채팅으로 다른 플레이어들과 소통해보세요!</p>
              </div>
              
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
      </div>
    </div>

    <!-- 방 설정 모달 -->
    <RoomSettingsModal
      :is-active="isRoomSettingsOpen"
      :room-data="localRoomData"
      @close="closeRoomSettings"
      @save="updateRoomSettings"
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
  </div>
</template>

<script setup>
import RoomHeader from 'src/features/game/multiplayer/room/components/header/RoomHeader.vue'
//waiting list
import TeamWaitingList from 'src/features/game/multiplayer/room/components/list/TeamWaitingList.vue'
import IndividualWaitingList from 'src/features/game/multiplayer/room/components/list/IndividualWaitingList.vue'

//modal
import KickConfirmationModal from 'src/features/game/multiplayer/room/components/player/KickConfirmationModal.vue'
import PlayerDetailsModal from 'src/features/game/multiplayer/room/components/player/PlayerDetailsModal.vue'
import RoomSettingsModal from 'src/features/game/multiplayer/room/components/settings/RoomSettingsModal.vue'
import ChatMessage from 'src/features/game/multiplayer/chat/components/Room/ChatMessage.vue'

// Composables
import { useRoom } from '../composables/useRoom';

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
      { id: 'user1', nickname: '방장닉네임', profileImage: '', team: 1, isHost: true },
      { id: 'user2', nickname: '플레이어2', profileImage: '', team: 1, isHost: false },
      { id: 'user3', nickname: '플레이어3', profileImage: '', team: 2, isHost: false },
      { id: 'user4', nickname: '플레이어4', profileImage: '', team: 2, isHost: false },
      { id: 'user5', nickname: '플레이어5', profileImage: '', team: 1, isHost: false },
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
  'join-team',
  'player-list-updated' // 웹소켓으로 플레이어 목록 업데이트 시 사용
]);

// Room composable 사용
const room = useRoom(props, emit);

// 템플릿에서 사용할 상태와 메서드 추출
const {
  // 상태
  localRoomData,
  isTeamMode,
  canStartGame,
  
  // 모달 상태
  isRoomSettingsOpen,
  isKickModalOpen,
  isPlayerDetailsOpen,
  playerToKick,
  selectedPlayer,
  
  // 채팅 상태
  chatMessages,
  chatInput,
  unreadMessages,
  chatMessagesRef,
  
  // 플레이어 상태
  localPlayers,
  playerMessages,
  availableTeams,
  maxPlayersPerTeam,
  
  // 방 관련 메서드
  updateRoomSettings,
  leaveRoom,
  startGame,
  kickPlayer,
  joinTeam,
  sendChatMessage,
  
  // 모달 메서드
  openRoomSettings,
  closeRoomSettings,
  showPlayerDetails,
  closePlayerDetails,
  confirmKickPlayer,
  closeKickModal,
  
  // 채팅 메서드
  toggleChat,
  scrollChatToBottom,
  addSystemMessage,
  
  // 플레이어 메서드
  getCurrentPlayerNickname,
  getCurrentPlayerTeam,
  canJoinTeam,
  getTeamPlayerCount
} = room;
</script>

<style scoped>
.multiplayer-room-waiting {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  padding: 1rem;
  overflow: hidden;
}

.mode-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  z-index: -1;
}

.room-content {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.left-panel {
  flex: 1.2;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.right-panel {
  flex: 1;
  min-width: 380px;
  display: flex;
  flex-direction: column;
}

.panel-section {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #667eea;
  font-size: 1rem;
}

/* 채팅 패널 전체 높이 */
.chat-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  position: relative;
}

.chat-title i {
  font-size: 1.2rem;
}

.chat-notification {
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-left: 0.5rem;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  opacity: 0.9;
}

.online-indicator {
  color: #22c55e;
  font-size: 0.6rem;
  text-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
}

/* 채팅 컨테이너 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.chat-welcome {
  text-align: center;
  padding: 1.5rem 1rem;
  color: #64748b;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 1rem;
}

.welcome-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.welcome-icon i {
  font-size: 1.2rem;
  color: white;
}

.welcome-text {
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.5;
  margin: 0;
}

.chat-input-container {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  font-size: 0.9rem;
  color: #1e293b;
  outline: none;
  transition: all 0.2s ease;
  background: white;
}

.chat-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.send-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-button:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #553c9a 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.send-button:active {
  transform: translateY(0);
}

.send-button i {
  font-size: 0.9rem;
}

/* Responsive design */
@media (max-width: 1200px) {
  .left-panel {
    flex: 1.4;
  }
  
  .right-panel {
    min-width: 350px;
  }
}

@media (max-width: 1024px) {
  .room-content {
    flex-direction: column;
    gap: 1rem;
  }

  .left-panel {
    flex: none;
    height: 50vh;
  }

  .right-panel {
    flex: 1;
    min-width: 0;
    min-height: 45vh;
  }
}

@media (max-width: 768px) {
  .multiplayer-room-waiting {
    padding: 0.75rem;
  }

  .room-content {
    gap: 0.75rem;
  }

  .panel-section {
    padding: 1rem;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .chat-header {
    padding: 0.75rem 1rem;
  }

  .chat-title {
    font-size: 1rem;
  }

  .chat-status {
    font-size: 0.8rem;
  }

  .chat-messages {
    padding: 0.75rem 1rem;
  }

  .chat-input-container {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }

  .send-button {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .left-panel {
    height: 45vh;
  }

  .right-panel {
    min-height: 50vh;
  }

  .chat-welcome {
    padding: 1rem 0.5rem;
  }

  .welcome-icon {
    width: 40px;
    height: 40px;
  }

  .welcome-text {
    font-size: 0.8rem;
  }

  .chat-input {
    padding: 0.65rem 0.85rem;
    font-size: 0.85rem;
  }

  .send-button {
    width: 36px;
    height: 36px;
  }

  .send-button i {
    font-size: 0.8rem;
  }
}
</style>

