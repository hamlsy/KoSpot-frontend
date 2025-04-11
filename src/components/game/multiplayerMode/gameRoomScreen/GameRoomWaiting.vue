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
          <div v-if="isTeamMode" class="team-selection-buttons">
            <button 
              class="team-button team1" 
              :class="{ active: currentUser.team === 'team1' }"
              @click="changeTeam('team1')"
              title="블루팀"
            >
              <i class="fas fa-square"></i> 블루
            </button>
            <button 
              class="team-button team2" 
              :class="{ active: currentUser.team === 'team2' }"
              @click="changeTeam('team2')"
              title="레드팀"
            >
              <i class="fas fa-square"></i> 레드
            </button>
            <button 
              class="team-button team3" 
              :class="{ active: currentUser.team === 'team3' }"
              @click="changeTeam('team3')"
              title="그린팀"
            >
              <i class="fas fa-square"></i> 그린
            </button>
            <button 
              class="team-button team4" 
              :class="{ active: currentUser.team === 'team4' }"
              @click="changeTeam('team4')"
              title="옐로우팀"
            >
              <i class="fas fa-square"></i> 옐로우
            </button>
          </div>
          
          <div class="players-list">
            <div 
              v-for="player in players" 
              :key="player.id" 
              class="player-card"
              :class="{ 
                'is-host': player.isHost, 
                'is-current': player.id === currentUser.id,
                'team1': isTeamMode && player.team === 'team1',
                'team2': isTeamMode && player.team === 'team2',
                'team3': isTeamMode && player.team === 'team3',
                'team4': isTeamMode && player.team === 'team4'
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
              v-for="n in (roomData.maxPlayers - players.length)" 
              :key="`empty-${n}`" 
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

export default {
  name: 'GameRoomWaiting',
  
  components: {
    RoomSettingsModal,
    ChatModal
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
        profileImage: '/assets/default-profile.png'
      },
      players: [
        {
          id: 'user123',
          nickname: '김코스팟',
          level: 23,
          profileImage: '/assets/default-profile.png',
          isHost: true,
          isReady: true,
          team: 'team1'
        },
        {
          id: 'user456',
          nickname: '지리학자',
          level: 45,
          profileImage: '/assets/avatar1.png',
          isHost: false,
          isReady: true,
          team: 'team1'
        },
        {
          id: 'user789',
          nickname: '여행마니아',
          level: 31,
          profileImage: '/assets/avatar2.png',
          isHost: false,
          isReady: false,
          team: 'team2'
        }
      ],
      // 플레이어별 채팅 메시지 말풍선
      playerMessages: {},
      // 모바일에서 채팅창 표시 여부
      showMobileChat: false,
      // 팀 선택 모달
      showTeamSelectionModal: false,
      currentUserTeam: 'team1',  // 기본 팀
      // 방 설정 모달
      showRoomSettingsModal: false,
      chatMessages: [
        {
          id: 'chat1',
          sender: '시스템',
          message: '게임 방에 오신 것을 환영합니다.',
          timestamp: new Date(),
          system: true
        },
        {
          id: 'chat2',
          sender: '지리학자',
          message: '안녕하세요! 다들 준비되셨나요?',
          timestamp: new Date(),
          system: false
        }
      ],
      isReady: false,
      showCountdown: false,
      countdownNumber: 5,
      
      // 팀 모드 관련
      activeTeamTab: 'all', // 'all', 'team1', 'team2'
      
      // 설정 수정 관련
      isEditingSettings: false,
      editSettings: {
        gameMode: '로드뷰',
        matchType: 'individual',
        region: '서울',
        rounds: 3,
        timeLimit: 120,
        isPrivate: true,
        password: '1234'
      }
    };
  },
  
  computed: {
    isHost() {
      const currentPlayer = this.players.find(p => p.id === this.currentUser.id);
      return currentPlayer && currentPlayer.isHost;
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
      // 호스트만 게임을 시작할 수 있음
      if (!this.isHost) return false;
      
      // 최소 2명 이상의 플레이어 필요
      if (this.players.length < 2) return false;
      
      // 호스트를 제외한 모든 플레이어가 준비 완료되어야 함
      const allPlayersReady = this.players
        .filter(p => !p.isHost)
        .every(p => p.isReady);
      
      // 팀 모드인 경우 각 팀에 최소 1명 이상 있어야 함
      if (this.isTeamMode) {
        const team1Count = this.getTeamPlayerCount('team1');
        const team2Count = this.getTeamPlayerCount('team2');
        return allPlayersReady && team1Count > 0 && team2Count > 0;
      }
      
      return allPlayersReady;
    },
    
    maxRounds() {
      // 로드뷰는 최대 10라운드, 포토 모드는 최대 15라운드
      return this.editSettings.gameMode === '로드뷰' ? 10 : 15;
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
      return this.players.filter(p => p.team === team).length;
    },
    
    openTeamSelectionModal() {
      const currentPlayer = this.players.find(p => p.id === this.currentUser.id);
      if (currentPlayer) {
        this.currentUserTeam = currentPlayer.team;
      }
      this.showTeamSelectionModal = true;
    },
    
    closeTeamSelectionModal() {
      this.showTeamSelectionModal = false;
    },
    
    selectTeam(team) {
      this.currentUserTeam = team;
    },
    
    applyTeamSelection() {
      this.changeTeam(this.currentUserTeam);
      this.closeTeamSelectionModal();
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
    
    applyRoomSettings() {
      // 방 설정 적용
      this.roomData.gameMode = this.editSettings.gameMode;
      this.roomData.matchType = this.editSettings.matchType;
      this.roomData.region = this.editSettings.region;
      this.roomData.rounds = this.editSettings.rounds;
      this.roomData.timeLimit = this.editSettings.timeLimit;
      this.roomData.isPrivate = this.editSettings.isPrivate;
      this.roomData.password = this.editSettings.password;
      
      // 실제 구현에서는 API 호출 필요
      this.chatMessages.push({
        id: `chat-${Date.now()}`,
        sender: '시스템',
        message: `게임 설정이 변경되었습니다.`,
        timestamp: new Date(),
        system: true
      });
      
      // 설정 모달 닫기
      this.closeRoomSettingsModal();
    },
    
    changeTeam(team) {
      // 팀 변경 (본인만 가능)
      const playerIndex = this.players.findIndex(p => p.id === this.currentUser.id);
      if (playerIndex !== -1) {
        this.players[playerIndex].team = team;
        
        // 실제 구현에서는 API 호출 필요
        this.chatMessages.push({
          id: `chat-${Date.now()}`,
          sender: '시스템',
          message: `${this.currentUser.nickname}님이 ${
            team === 'team1' ? '블루팀' : 
            team === 'team2' ? '레드팀' : 
            team === 'team3' ? '그린팀' : '옐로우팀'
          }으로 이동했습니다.`,
          timestamp: new Date(),
          system: true
        });
      }
    },
    
    toggleReady() {
      // 준비 상태 토글 (호스트가 아닌 경우만)
      if (this.isHost) return;
      
      this.isReady = !this.isReady;
      
      // 실제 구현에서는 API 호출 필요
      const playerIndex = this.players.findIndex(p => p.id === this.currentUser.id);
      if (playerIndex !== -1) {
        this.players[playerIndex].isReady = this.isReady;
      }
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

/* 팀 선택 탭 */
.team-tabs {
  display: flex;
  margin-bottom: 1rem;
  background-color: #f1f5f9;
  border-radius: 8px;
  padding: 0.25rem;
}

.team-tab {
  flex: 1;
  padding: 0.5rem;
  text-align: center;
  background: none;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.team-tab.active {
  background-color: white;
  color: #333;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.player-card.team1 {
  border-left-color: #3b82f6;
}

.player-card.team2 {
  border-left-color: #ef4444;
}

.player-card.team3 {
  border-left-color: #22c55e;
}

.player-card.team4 {
  border-left-color: #fbbf24;
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

.team-selector {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.team-button {
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
}

.team-button.active {
  opacity: 1;
}

.team-button.team1 {
  background-color: #dbeafe;
  color: #2563eb;
}

.team-button.team2 {
  background-color: #fee2e2;
  color: #ef4444;
}

.team-button.team3 {
  background-color: #dcfce7;
  color: #22c55e;
}

.team-button.team4 {
  background-color: #fef9c3;
  color: #eab308;
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
  
  /* 모바일에서 채팅 토글 버튼 표시 */
  .mobile-chat-toggle {
    display: flex;
    z-index: 1100; /* 더 높은 z-index */
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
  top: -40px;
  left: 20%;
  background-color: white;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 0.875rem;
  max-width: 200px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.3s;
  z-index: 10;
  word-break: break-word;
}

.chat-bubble:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 20px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid white;
}

.chat-bubble.active {
  opacity: 1;
  visibility: visible;
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

/* 팀 선택 버튼 */
.team-selection-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.team-selection-buttons .team-button {
  background-color: #f8fafc;
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.8;
}

.team-selection-buttons .team-button:hover {
  opacity: 1;
}

.team-selection-buttons .team-button.active {
  opacity: 1;
  border-color: currentColor;
}

.team-selection-buttons .team-button.team1 {
  background-color: #dbeafe;
  color: #2563eb;
}

.team-selection-buttons .team-button.team2 {
  background-color: #fee2e2;
  color: #ef4444;
}

.team-selection-buttons .team-button.team3 {
  background-color: #dcfce7;
  color: #22c55e;
}

.team-selection-buttons .team-button.team4 {
  background-color: #fef9c3;
  color: #eab308;
}

/* 모바일 채팅 토글 버튼 */
.mobile-chat-toggle {
  display: none; /* 기본적으로 숨김 (모바일에서만 표시) */
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 2000; /* 더 높은 z-index로 설정 */
  cursor: pointer;
  transition: all 0.3s;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.7rem;
}

.mobile-chat-toggle i {
  font-size: 1.2rem;
}

.mobile-chat-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

/* 방 설정 모달 관련 스타일은 RoomSettingsModal로 이동 */

/* 모바일 반응형 추가 스타일 */
@media (max-width: 768px) {
  .room-settings-content {
    width: 95%;
    max-height: 90vh;
    padding: 1rem;
  }
  
  .setting-controls {
    flex-wrap: wrap;
  }
  
  .mode-button,
  .match-button {
    flex: 1;
    min-width: 45%;
  }
  
  .my-team-button {
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }
}
</style> 