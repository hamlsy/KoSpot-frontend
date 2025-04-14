<template>
  <div class="game-room-waiting" :class="{ 'roadview-mode': isRoadViewMode, 'photo-mode': !isRoadViewMode }">
    <!-- 헤더 영역 -->
    <div class="room-header">
      <div class="header-left">
        <button class="exit-button" @click="leaveRoom">
          <i class="fas fa-arrow-left"></i>
          로비로 돌아가기
        </button>
        <div class="room-info">
          <h2 class="room-name">{{ roomData.name }}</h2>
          <div class="room-details">
            <span class="game-mode-badge" :class="{ 'roadview': isRoadViewMode, 'photo': !isRoadViewMode }">
              <i :class="isRoadViewMode ? 'fas fa-street-view' : 'fas fa-camera'"></i>
              {{ roomData.gameMode }}
            </span>
            <span class="separator">•</span>
            <span class="match-type-badge" :class="{ 'individual': !isTeamMode, 'team': isTeamMode }">
              <i :class="isTeamMode ? 'fas fa-users' : 'fas fa-user'"></i>
              {{ isTeamMode ? '팀전' : '개인전' }}
            </span>
            <span class="separator">•</span>
            <span class="region-badge">
              <i class="fas fa-map-marker-alt"></i>
              {{ roomData.region }}
            </span>
            <span class="separator">•</span>
            <span class="players-count">
              <i class="fas fa-user-friends"></i>
              {{ players.length }}/{{ roomData.maxPlayers }}명
            </span>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <!-- 호스트인 경우 게임 설정 버튼 표시 -->
        <button v-if="isHost" class="settings-button" @click="openRoomSettingsModal">
          <i class="fas fa-cog"></i>
          방 설정
        </button>
        
        <!-- 호스트인 경우 게임 시작 버튼 -->
        <button 
          v-if="isHost" 
          class="start-game-button" 
          :disabled="!canStartGame"
          @click="startGame"
        >
          <i class="fas fa-play"></i>
          게임 시작
        </button>
        
        <!-- 호스트가 아닌 경우 준비 버튼 -->
        <button 
          v-else 
          class="ready-button"
          :class="{ 'ready-on': isReady }"
          @click="toggleReady"
        >
          <i :class="isReady ? 'fas fa-check-circle' : 'far fa-check-circle'"></i>
          {{ isReady ? '준비 완료' : '준비하기' }}
        </button>

        <!-- 비밀방 표시 -->
        <div v-if="roomData.isPrivate" class="room-privacy-badge">
          <i class="fas fa-lock"></i> 비밀방
        </div>
        <div v-else class="room-privacy-badge public">
          <i class="fas fa-lock-open"></i> 공개방
        </div>
      </div>
    </div>

    <!-- 배경 효과 (게임 모드에 따라 다른 배경) -->
    <div class="mode-background"></div>

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
          
          <!-- 팀 모드인 경우 팀 선택 버튼 표시 -->
          <div v-if="isTeamMode" class="team-selection">
            <div class="current-team" v-if="currentUser.teamId">
              <span class="team-label">내 팀:</span>
              <span 
                class="team-name" 
                :class="`team-${getTeamColor(currentUser.teamId)}`"
              >
                {{ getTeamName(currentUser.teamId) }}
              </span>
            </div>
            <button 
              class="team-selection-button"
              @click="openTeamSelectionModal"
            >
              <i class="fas fa-users"></i>
              {{ currentUser.teamId ? '팀 변경하기' : '팀 선택하기' }}
            </button>
          </div>
          
          <!-- 팀 모드인 경우 팀별로 플레이어 목록 표시 -->
          <div v-if="isTeamMode" class="teams-container">
            <div 
              v-for="team in availableTeams"
              :key="team.id"
              class="team-players-card"
              :class="`team-${team.color}-card`"
            >
              <div class="team-header">
                <div class="team-icon" :class="`team-${team.color}-bg`">
                  <i class="fas fa-users"></i>
                </div>
                <h4 class="team-title">{{ team.name }} 팀</h4>
                <div class="team-count">
                  {{ getTeamPlayers(team.id).length }}/{{ maxTeamSize }}
                </div>
              </div>
              
              <div class="team-players-list">
                <div 
                  v-for="player in getTeamPlayers(team.id)"
                  :key="player.id"
                  class="player-card"
                  :class="{ 
                    'is-host': player.isHost, 
                    'is-current': player.id === currentUser.id
                  }"
                >
                  <!-- 채팅 말풍선 -->
                  <div class="chat-bubble" v-if="playerMessages[player.id]" :class="{ 'active': playerMessages[player.id].show }">
                    {{ playerMessages[player.id].message }}
                  </div>
                  
                  <div class="player-avatar">
                    <img :src="player.profileImage || '/assets/default-avatar.png'" :alt="player.nickname">
                    <div class="host-badge" v-if="player.isHost">
                      <i class="fas fa-crown"></i>
                    </div>
                  </div>
                  <div class="player-info">
                    <div class="player-name">{{ player.nickname }}</div>
                    <div class="player-level">Lv. {{ player.level }}</div>
                  </div>
                  <div class="player-actions">
                    <!-- 준비 완료 상태 표시 -->
                    <span class="status-badge ready" v-if="player.isReady && !player.isHost">
                      <i class="fas fa-check"></i> 준비완료
                    </span>
                    
                    <!-- 호스트만 볼 수 있는 강퇴 버튼 -->
                    <button 
                      v-if="isHost && player.id !== currentUser.id" 
                      class="kick-button"
                      @click="kickPlayer(player.id)"
                      title="강퇴하기"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                
                <!-- 빈 슬롯 표시 -->
                <div 
                  v-for="n in (maxTeamSize - getTeamPlayers(team.id).length)" 
                  :key="`empty-${team.id}-${n}`" 
                  class="player-card empty"
                >
                  <div class="empty-slot">
                    <i class="fas fa-user-plus"></i>
                    <span>비어있음</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 개인전 모드일 경우 기존 플레이어 목록 표시 -->
          <div v-else class="players-list">
            <div 
              v-for="player in players" 
              :key="player.id" 
              class="player-card"
              :class="{ 
                'is-host': player.isHost, 
                'is-current': player.id === currentUser.id
              }"
            >
              <!-- 채팅 말풍선 -->
              <div class="chat-bubble" v-if="playerMessages[player.id]" :class="{ 'active': playerMessages[player.id].show }">
                {{ playerMessages[player.id].message }}
              </div>
              
              <div class="player-avatar">
                <img :src="player.profileImage || '/assets/default-avatar.png'" :alt="player.nickname">
                <div class="host-badge" v-if="player.isHost">
                  <i class="fas fa-crown"></i>
                </div>
              </div>
              <div class="player-info">
                <div class="player-name">{{ player.nickname }}</div>
                <div class="player-level">Lv. {{ player.level }}</div>
              </div>
              <div class="player-actions">
                <!-- 준비 완료 상태 표시 -->
                <span class="status-badge ready" v-if="player.isReady && !player.isHost">
                  <i class="fas fa-check"></i> 준비완료
                </span>
                
                <!-- 호스트만 볼 수 있는 강퇴 버튼 -->
                <button 
                  v-if="isHost && player.id !== currentUser.id" 
                  class="kick-button"
                  @click="kickPlayer(player.id)"
                  title="강퇴하기"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽 패널: 채팅 -->
      <chat-modal 
        :show="showMobileChat"
        :messages="chatMessages"
        @toggle="toggleMobileChat"
        @close="showMobileChat = false"
        @send-message="sendChatMessage"
      />
      
      <!-- 방 설정 모달 -->
      <room-settings-modal 
        :show="showRoomSettingsModal"
        :initial-settings="editSettings"
        @close="closeRoomSettingsModal"
        @apply="applyRoomSettings"
      />
      
      <!-- 팀 선택 모달 -->
      <team-selection-modal
        :visible="isTeamSelectionModalOpen"
        :players="players"
        :available-teams="availableTeams"
        :max-team-size="maxTeamSize"
        :current-user-id="currentUser.id"
        :current-user-team="currentUser.teamId"
        @close="closeTeamSelectionModal"
        @join-team="handleJoinTeam"
      />
    </div>

    <!-- 게임 시작 카운트다운 오버레이 -->
    <div class="countdown-overlay" v-if="showCountdown">
      <div class="countdown-container">
        <div class="countdown-number">{{ countdownNumber }}</div>
        <div class="countdown-text">게임 시작까지</div>
      </div>
    </div>
  </div>
</template>

<script>
import RoomSettingsModal from './RoomSettingsModal.vue';
import ChatModal from './ChatModal.vue';
import TeamSelectionModal from './TeamSelectionModal.vue';

export default {
  name: 'GameRoomWaiting',
  
  components: {
    RoomSettingsModal,
    ChatModal,
    TeamSelectionModal
  },
  
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
  
  data() {
    return {
      roomData: {
        name: '멋진 게임방',
        gameMode: '로드뷰',
        matchType: 'individual', // 'individual' 또는 'team'
        region: '서울',
        maxPlayers: 8,
        password: '1234',
        isPrivate: true, // 비밀방 여부
        rounds: 3,
        timeLimit: 120
      },
      currentUser: {
        id: 'user123',
        nickname: '김코스팟',
        level: 23,
        profileImage: null,
        isHost: true,
        isReady: false,
        teamId: null
      },
      players: [
        {
          id: 'user123',
          nickname: '김코스팟',
          level: 23,
          profileImage: null,
          isHost: true,
          isReady: false,
          teamId: null
        },
        {
          id: 'user456',
          nickname: '박지금',
          level: 15,
          profileImage: null,
          isHost: false,
          isReady: true,
          teamId: null
        },
        {
          id: 'user789',
          nickname: '이강산',
          level: 30,
          profileImage: null,
          isHost: false,
          isReady: false,
          teamId: null
        }
      ],
      chatMessages: [],
      playerMessages: {},
      isReady: false,
      showMobileChat: false,
      showRoomSettingsModal: false,
      editSettings: {},
      showCountdown: false,
      countdownNumber: 5,
      countdownTimer: null,
      
      // 팀 모드 관련 데이터
      isTeamSelectionModalOpen: false,
      availableTeams: [
        { id: 'blue', name: '블루팀', color: '#3b82f6', icon: 'people' },
        { id: 'red', name: '레드팀', color: '#ef4444', icon: 'people' },
        { id: 'green', name: '그린팀', color: '#10b981', icon: 'people' },
        { id: 'yellow', name: '옐로우팀', color: '#f59e0b', icon: 'people' }
      ],
      maxTeamSize: 2 // 팀당 최대 인원
    };
  },
  
  computed: {
    isHost() {
      return this.currentUser.isHost;
    },
    
    isRoadViewMode() {
      return this.roomData.gameMode === '로드뷰';
    },
    
    isTeamMode() {
      return this.roomData.matchType === 'team';
    },
    
    filteredPlayers() {
      return this.players;
    },
    
    canStartGame() {
      // 최소 2명 이상의 플레이어가 필요
      if (this.players.length < 2) return false;
      
      // 호스트를 제외한 모든 플레이어가 준비 완료되어야 함
      const nonHostPlayers = this.players.filter(p => !p.isHost);
      const allReady = nonHostPlayers.every(p => p.isReady);
      
      // 팀 모드일 경우 모든 플레이어가 팀을 선택해야 함
      const allTeamAssigned = !this.isTeamMode || this.players.every(p => p.teamId);
      
      return allReady && allTeamAssigned;
    },
    
    maxRounds() {
      // 로드뷰는 최대 10라운드, 포토 모드는 최대 15라운드
      return this.editSettings.gameMode === '로드뷰' ? 10 : 15;
    },
    
    currentUserTeam() {
      const currentUser = this.players.find(player => player.id === this.currentUser.id);
      return currentUser ? currentUser.teamId : null;
    }
  },
  
  created() {
    // 초기 설정 값 복사
    this.resetEditSettings();
  },
  
  methods: {
    leaveRoom() {
      // 로비로 돌아가기
      this.$emit('leave-room');
    },
    
    toggleMobileChat() {
      this.showMobileChat = !this.showMobileChat;
    },
    
    getTeamPlayerCount(team) {
      return this.players.filter(p => p.teamId === team).length;
    },
    
    openTeamSelectionModal() {
      this.isTeamSelectionModalOpen = true;
    },
    
    closeTeamSelectionModal() {
      this.isTeamSelectionModalOpen = false;
    },
    
    handleJoinTeam(teamId) {
      this.changeTeam(teamId);
      this.closeTeamSelectionModal();
    },
    
    changeTeam(teamId) {
      if (this.roomData.matchType !== 'team') return;
      
      // 원래 코드가 있는 경우 유지하고, 모달을 열도록 수정
      if (!teamId) {
        this.openTeamSelectionModal();
        return;
      }
      
      // 원래 팀 변경 로직
      const currentUser = this.players.find(player => player.id === this.currentUser.id);
      const oldTeam = currentUser.teamId;
      
      if (oldTeam === teamId) return; // 같은 팀이면 변경 불필요
      
      // 팀 변경
      currentUser.teamId = teamId;
      
      // 시스템 메시지 추가
      const teamName = this.getTeamName(teamId);
      this.addSystemMessage(`${this.currentUser.nickname}님이 ${teamName}에 참가했습니다.`);
      
      // 실제 구현에서는 서버에 팀 변경 요청 필요
      console.log(`Changed team to: ${teamId}`);
    },
    
    getTeamPlayers(teamId) {
      return this.players.filter(player => player.teamId === teamId);
    },
    
    getTeamName(teamId) {
      const team = this.availableTeams.find(t => t.id === teamId);
      return team ? team.name : '팀 없음';
    },
    
    getTeamColor(teamId) {
      const team = this.availableTeams.find(t => t.id === teamId);
      return team ? team.color : 'gray';
    },
    
    openRoomSettingsModal() {
      // 방 설정 모달 열기
      this.resetEditSettings();
      this.showRoomSettingsModal = true;
    },
    
    closeRoomSettingsModal() {
      // 방 설정 모달 닫기
      this.showRoomSettingsModal = false;
    },
    
    applyRoomSettings(settings) {
      // 기존 로직 유지
      this.roomData = {
        ...this.roomData,
        ...settings
      };
      
      // 팀 모드 변경 처리
      if (settings.matchType !== undefined) {
        // 개인전으로 변경된 경우 팀 정보 초기화
        if (settings.matchType === 'individual') {
          this.players.forEach(player => {
            player.teamId = null;
          });
          this.currentUser.teamId = null;
          
          this.addSystemMessage('게임 모드가 개인전으로 변경되었습니다.');
        } else {
          // 팀 모드로 변경된 경우 안내 메시지
          this.addSystemMessage('게임 모드가 팀전으로 변경되었습니다. 팀을 선택해주세요.');
        }
      }
      
      this.closeRoomSettingsModal();
    },
    
    startGame() {
      // 게임 시작 (호스트만 가능)
      if (!this.isHost || !this.canStartGame) return;
      
      // 카운트다운 시작
      this.showCountdown = true;
      this.countdownNumber = 5;
      
      const countdownInterval = setInterval(() => {
        this.countdownNumber--;
        
        if (this.countdownNumber <= 0) {
          clearInterval(countdownInterval);
          this.showCountdown = false;
          
          // 게임 시작 이벤트 발생
          this.$emit('start-game');
        }
      }, 1000);
    },
    
    sendChatMessage(message) {
      // 채팅 메시지 전송
      if (!message.trim()) return;
      
      const newMessage = {
        id: `chat-${Date.now()}`,
        sender: this.currentUser.nickname,
        message: message,
        timestamp: new Date(),
        system: false
      };
      
      this.chatMessages.push(newMessage);
      
      // 말풍선 표시
      this.showChatBubble(this.currentUser.id, message);
      
      // 실제 구현에서는 API 호출 필요
    },
    
    showChatBubble(playerId, message) {
      // 채팅 메시지 말풍선 표시
      this.$set(this.playerMessages, playerId, {
        message: message,
        show: true
      });
      
      // 5초 후 자동으로 사라짐
      setTimeout(() => {
        if (this.playerMessages[playerId]) {
          this.$set(this.playerMessages, playerId, {
            ...this.playerMessages[playerId],
            show: false
          });
        }
      }, 5000);
    },
    
    resetEditSettings() {
      // 설정 수정 폼을 현재 방 설정으로 초기화
      this.editSettings = {
        gameMode: this.roomData.gameMode,
        matchType: this.roomData.matchType,
        region: this.roomData.region,
        rounds: this.roomData.rounds,
        timeLimit: this.roomData.timeLimit,
        isPrivate: this.roomData.isPrivate,
        password: this.roomData.password
      };
    },
    
    cancelEditSettings() {
      // 설정 수정 취소
      this.resetEditSettings();
      this.isEditingSettings = false;
    },
    
    applySettings() {
      // 설정 적용
      this.roomData.gameMode = this.editSettings.gameMode;
      this.roomData.matchType = this.editSettings.matchType;
      this.roomData.region = this.editSettings.region;
      this.roomData.rounds = this.editSettings.rounds;
      this.roomData.timeLimit = this.editSettings.timeLimit;
      
      // 실제 구현에서는 API 호출 필요
      this.chatMessages.push({
        id: `chat-${Date.now()}`,
        sender: '시스템',
        message: `게임 설정이 변경되었습니다.`,
        timestamp: new Date(),
        system: true
      });
      
      // 설정 모드 종료
      this.isEditingSettings = false;
    },
    
    incrementRounds() {
      // 라운드 수 증가 (최대값 제한)
      if (this.editSettings.rounds < this.maxRounds) {
        this.editSettings.rounds++;
      }
    },
    
    decrementRounds() {
      // 라운드 수 감소 (최소 3)
      if (this.editSettings.rounds > 3) {
        this.editSettings.rounds--;
      }
    },
    
    kickPlayer(playerId) {
      // 플레이어 강퇴 (호스트만 가능)
      if (!this.isHost) return;
      
      const kickedPlayer = this.players.find(p => p.id === playerId);
      const kickedNickname = kickedPlayer ? kickedPlayer.nickname : '플레이어';
      
      // 실제 구현에서는 API 호출 필요
      this.players = this.players.filter(p => p.id !== playerId);
      
      // 시스템 메시지 추가
      this.chatMessages.push({
        id: `chat-${Date.now()}`,
        sender: '시스템',
        message: `${kickedNickname}님이 방에서 강퇴되었습니다.`,
        timestamp: new Date(),
        system: true
      });
    },
    
    addSystemMessage(message) {
      // 시스템 메시지 추가
      this.chatMessages.push({
        id: `chat-${Date.now()}`,
        sender: '시스템',
        message: message,
        timestamp: new Date(),
        system: true
      });
    }
  },
  
  mounted() {
    // 방 정보 로드
    // 실제 구현에서는 API 호출로 대체
    console.log(`Room ID: ${this.roomId} loaded`);
    
    // 웹소켓 연결 등의 초기화 로직
  },
  
  beforeDestroy() {
    // 웹소켓 연결 해제 등의 정리 로직
  }
};
</script>

<style scoped>
.game-room-waiting {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;
}

/* 배경 효과 */
.mode-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

/* 로드뷰 모드 배경 */
.roadview-mode .mode-background {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(30, 58, 138, 0.1) 100%);
  border-top: 4px solid #2563eb;
}

/* 포토 모드 배경 */
.photo-mode .mode-background {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(20, 83, 45, 0.1) 100%);
  border-top: 4px solid #16a34a;
}

/* 헤더 스타일 */
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.exit-button:hover {
  background-color: #e2e8f0;
}

.room-info {
  margin-left: 1.5rem;
}

.room-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.room-details {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 설정 버튼 */
.settings-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-button:hover {
  background-color: #e2e8f0;
}

/* 헤더 배지 스타일 */
.game-mode-badge,
.match-type-badge,
.region-badge,
.players-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.game-mode-badge {
  color: white;
}

.game-mode-badge.roadview {
  background-color: #2563eb;
}

.game-mode-badge.photo {
  background-color: #16a34a;
}

.match-type-badge {
  background-color: #f1f5f9;
  color: #475569;
}

.match-type-badge.team {
  background-color: #fef2f2;
  color: #ef4444;
}

.region-badge,
.players-count {
  background-color: #f1f5f9;
  color: #475569;
}

.separator {
  color: #94a3b8;
}

.room-password {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f1f5f9;
  border-radius: 8px;
}

.password-label {
  font-size: 0.875rem;
  color: #64748b;
}

.password-value {
  font-weight: 600;
  color: #334155;
  letter-spacing: 1px;
}

/* 메인 컨텐츠 스타일 */
.room-content {
  display: flex;
  flex: 1;
  padding: 1.5rem;
  gap: 1.5rem;
  position: relative;
  z-index: 5;
  overflow-y: auto; /* 전체 화면에서도 스크롤 가능하도록 */
  height: calc(100vh - 80px); /* 헤더 높이 고려 */
}

.left-panel {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 60%;
}

.right-panel {
  flex: 1;
}

.panel-section {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  padding: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 1rem;
}

/* 설정 수정 버튼 */
.edit-settings-button {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 6px;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-settings-button:hover {
  background-color: #e2e8f0;
}

/* 팀 선택 관련 스타일 */
.team-selection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.8rem;
  background-color: #f9fafb;
  border-radius: 8px;
}

.current-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-label {
  font-size: 0.9rem;
  color: #64748b;
}

.team-name {
  font-weight: 600;
  font-size: 1rem;
  padding: 0.3rem 0.8rem;
  border-radius: 16px;
}

.team-blue {
  color: #3b82f6;
  background-color: #dbeafe;
}

.team-red {
  color: #ef4444;
  background-color: #fee2e2;
}

.team-green {
  color: #10b981;
  background-color: #dcfce7;
}

.team-yellow {
  color: #f59e0b;
  background-color: #fef3c7;
}

.team-selection-button {
  padding: 0.6rem 1rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.team-selection-button:hover {
  background-color: #3b5de7;
}

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.team-players-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #eee;
}

.team-blue-card {
  border-top: 4px solid #3b82f6;
}

.team-red-card {
  border-top: 4px solid #ef4444;
}

.team-green-card {
  border-top: 4px solid #10b981;
}

.team-yellow-card {
  border-top: 4px solid #f59e0b;
}

.team-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border-bottom: 1px solid #f1f5f9;
}

.team-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.team-blue-bg {
  background-color: #3b82f6;
}

.team-red-bg {
  background-color: #ef4444;
}

.team-green-bg {
  background-color: #10b981;
}

.team-yellow-bg {
  background-color: #f59e0b;
}

.team-title {
  flex: 1;
  margin: 0;
  font-size: 1rem;
}

.team-count {
  font-size: 0.8rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.3rem 0.6rem;
  border-radius: 16px;
}

.team-players-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* 게임 설정 스타일 */
.settings-section {
  border-top: 4px solid #e2e8f0;
}

.roadview-mode .settings-section {
  border-top-color: #2563eb;
}

.photo-mode .settings-section {
  border-top-color: #16a34a;
}

.game-settings {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-label {
  font-size: 0.875rem;
  color: #64748b;
}

.setting-value {
  font-weight: 500;
  color: #334155;
}

/* 설정 수정 모드 */
.game-settings.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.setting-row .setting-label {
  width: 100px;
  font-size: 0.875rem;
  color: #64748b;
}

.setting-controls {
  display: flex;
  gap: 0.5rem;
}

.mode-button,
.match-button {
  background-color: #f1f5f9;
  color: #64748b;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-button.active,
.match-button.active {
  background-color: #dbeafe;
  color: #2563eb;
}

.mode-button.active:nth-child(2) {
  background-color: #dcfce7;
  color: #16a34a;
}

.setting-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #334155;
  background-color: white;
}

.round-minus,
.round-plus {
  width: 30px;
  height: 30px;
  background-color: #f1f5f9;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.round-minus:hover,
.round-plus:hover {
  background-color: #e2e8f0;
}

.rounds-value {
  width: 60px;
  text-align: center;
  font-weight: 500;
  color: #334155;
}

.setting-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.cancel-button,
.apply-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background-color: #f1f5f9;
  color: #64748b;
}

.apply-button {
  background-color: #2563eb;
  color: white;
}

.cancel-button:hover {
  background-color: #e2e8f0;
}

.apply-button:hover {
  background-color: #1d4ed8;
}

/* 액션 버튼 스타일 */
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding: 1rem 0;
}

.start-game-button, .ready-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.start-game-button {
  background-color: #3b82f6;
  color: white;
}

.roadview-mode .start-game-button {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}

.photo-mode .start-game-button {
  background: linear-gradient(135deg, #16a34a 0%, #14532d 100%);
}

.start-game-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.start-game-button:disabled {
  background-color: #94a3b8;
  transform: none;
  box-shadow: none;
  cursor: not-allowed;
}

.ready-button {
  background-color: #e2e8f0;
  color: #475569;
}

.ready-button:hover {
  background-color: #cbd5e1;
}

.ready-button.ready-on {
  background-color: #10b981;
  color: white;
}

.ready-button.ready-on:hover {
  background-color: #059669;
}

/* 카운트다운 오버레이 스타일 */
.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}

.countdown-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.countdown-number {
  font-size: 6rem;
  font-weight: 700;
  color: white;
  animation: pulse 1s infinite;
}

.countdown-text {
  font-size: 1.5rem;
  font-weight: 500;
  color: white;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 반응형 스타일 */
@media (max-width: 1024px) {
  .room-content {
    flex-direction: column;
  }
  
  .left-panel {
    max-width: 100%;
  }
  
  .right-panel {
    min-height: 300px;
  }
  
  .players-list {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  /* 모바일에서만 팀 선택 버튼 가리고, 팀 선택 간소화 버튼 표시 */
  .team-selector {
    display: none;
  }
  
  /* 헤더 조정 */
  .header-right {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  
  .settings-button,
  .start-game-button,
  .ready-button {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
}

@media (max-width: 768px) {
  .game-room-waiting {
    overflow: hidden;
  }
  
  .room-content {
    height: calc(100vh - 120px); /* 헤더 높이 조정 */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch; /* 모바일 스크롤 부드럽게 */
  }
  
  .room-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-right {
    align-self: flex-end;
  }
  
  .game-settings {
    grid-template-columns: 1fr;
    overflow-y: auto;
    max-height: calc(100vh - 400px);
  }
  
  .setting-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .setting-row .setting-label {
    width: 100%;
  }
  
  .setting-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .mode-button, .match-button {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  /* 모바일 채팅 스타일은 ChatModal로 이동 */
}

/* 스크롤바 스타일 */
.game-settings::-webkit-scrollbar {
  width: 8px;
}

.game-settings::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.game-settings::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.game-settings::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 채팅 말풍선 스타일 */
.chat-bubble {
  position: absolute;
  top: -35px;
  left: 20px;
  background-color: white;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  max-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s, transform 0.3s;
  z-index: 5;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-bubble::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 20px;
  width: 12px;
  height: 12px;
  background-color: white;
  transform: rotate(45deg);
  z-index: -1;
}

.chat-bubble.active {
  opacity: 1;
  transform: translateY(0);
}

/* 비밀방 배지 */
.room-privacy-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background-color: #fee2e2;
  color: #ef4444;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
}

.room-privacy-badge.public {
  background-color: #f1f5f9;
  color: #475569;
}

/* 플레이어 목록 스타일 */
.players-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.player-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 8px;
  transition: all 0.2s;
  border-left: 4px solid transparent;
  position: relative;
}

.player-card:hover {
  background-color: #f1f5f9;
}

.player-card.is-host {
  background-color: #eff6ff;
  border-left-color: #2563eb;
}

.player-card.is-current {
  background-color: #ecfdf5;
  border-left-color: #10b981;
}

.player-card.empty {
  border: 1px dashed #cbd5e1;
  border-left: 4px solid transparent;
  justify-content: center;
  color: #94a3b8;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.empty-slot i {
  font-size: 1.5rem;
  opacity: 0.5;
}

.player-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.host-badge {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 16px;
  height: 16px;
  background-color: #fbbf24;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.host-badge i {
  font-size: 0.6rem;
  color: white;
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: 500;
  color: #334155;
}

.player-level {
  font-size: 0.75rem;
  color: #64748b;
}

.player-actions {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-badge.ready {
  background-color: #d1fae5;
  color: #059669;
}

.kick-button {
  background: none;
  border: none;
  color: #ef4444;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.player-card:hover .kick-button {
  opacity: 1;
}

/* 모바일 채팅 관련 스타일은 ChatModal 컴포넌트로 이동됨 */
</style> 