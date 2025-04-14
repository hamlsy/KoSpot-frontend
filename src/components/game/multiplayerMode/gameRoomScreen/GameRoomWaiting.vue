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
          
          <!-- 팀 모드인 경우 팀별로 플레이어 목록 표시 -->
          <div v-if="isTeamMode" class="teams-container">
            <div 
              v-for="team in availableTeams"
              :key="team.id"
              class="team-players-card"
              :class="`team-${team.id}-card`"
            >
              <div class="team-header">
                <div class="team-icon" :class="`team-${team.id}-bg`">
                  <i class="fas fa-users"></i>
                </div>
                <h4 class="team-title">{{ team.name }}</h4>
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
                    'is-current': player.id === currentUser.id,
                    [`team-${team.id}-player`]: true
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
                      @click="confirmKickPlayer(player)"
                      title="강퇴하기"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                
                <!-- 빈 슬롯: 클릭 시 팀 참가 가능 -->
                <div 
                  v-for="n in (maxTeamSize - getTeamPlayers(team.id).length)" 
                  :key="`empty-${team.id}-${n}`" 
                  class="player-card empty"
                  :class="`team-${team.id}-empty`"
                  @click="joinTeam(team.id)"
                >
                  <div class="empty-slot">
                    <i class="fas fa-user-plus"></i>
                    <span>클릭하여 참가</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 개인전 모드일 경우 기존 플레이어 목록 표시 -->
          <div v-else class="players-grid">
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
                <div class="player-stats">
                  <div class="player-level">Lv. {{ player.level }}</div>
                  <div class="multiplayer-stats">멀티: {{ player.multiplayCount || 0 }}판</div>
                </div>
              </div>
              <div class="player-ranks">
                <div class="rank-badge roadview">
                  <i class="fas fa-street-view"></i>
                  <span class="rank-tier" :class="getRankClass(player.roadviewRank)">
                    {{ formatRank(player.roadviewRank) }}
                  </span>
                </div>
                <div class="rank-badge photo">
                  <i class="fas fa-camera"></i>
                  <span class="rank-tier" :class="getRankClass(player.photoRank)">
                    {{ formatRank(player.photoRank) }}
                  </span>
                </div>
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
                  @click="confirmKickPlayer(player)"
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
    </div>

    <!-- 게임 시작 카운트다운 오버레이 -->
    <div class="countdown-overlay" v-if="showCountdown">
      <div class="countdown-container">
        <div class="countdown-number">{{ countdownNumber }}</div>
        <div class="countdown-text">게임 시작까지</div>
      </div>
    </div>
    
    <!-- 강퇴 확인 모달 -->
    <div class="kick-confirmation-modal" v-if="showKickConfirmation">
      <div class="kick-modal-content">
        <h4 class="kick-modal-title">플레이어 강퇴</h4>
        <p class="kick-modal-message">
          <span class="player-to-kick">{{ playerToKick.nickname }}</span>님을 정말 강퇴하시겠습니까?
        </p>
        <div class="kick-modal-actions">
          <button class="cancel-kick-button" @click="cancelKickPlayer">취소</button>
          <button class="confirm-kick-button" @click="kickPlayerConfirmed">강퇴하기</button>
        </div>
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
        profileImage: null,
        isHost: true,
        isReady: false,
        teamId: null,
        roadviewRank: 'gold-3',
        photoRank: 'platinum-2',
        multiplayCount: 15
      },
      players: [
        {
          id: 'user123',
          nickname: '김코스팟',
          level: 23,
          profileImage: null,
          isHost: true,
          isReady: false,
          teamId: null,
          roadviewRank: 'gold-3',
          photoRank: 'platinum-2',
          multiplayCount: 15
        },
        {
          id: 'user456',
          nickname: '박지금',
          level: 15,
          profileImage: null,
          isHost: false,
          isReady: true,
          teamId: null,
          roadviewRank: 'master-1',
          photoRank: 'diamond-4',
          multiplayCount: 32
        },
        {
          id: 'user789',
          nickname: '이강산',
          level: 30,
          profileImage: null,
          isHost: false,
          isReady: false,
          teamId: null,
          roadviewRank: 'bronze-5',
          photoRank: 'silver-2',
          multiplayCount: 7
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
      
      // 강퇴 관련
      showKickConfirmation: false,
      playerToKick: null,
      
      // 팀 모드 관련 데이터
      availableTeams: [
        { id: 'blue', name: '블루팀', color: '#3b82f6', icon: 'people' },
        { id: 'red', name: '레드팀', color: '#ef4444', icon: 'people' },
        { id: 'green', name: '그린팀', color: '#10b981', icon: 'people' },
        { id: 'yellow', name: '옐로우팀', color: '#f59e0b', icon: 'people' }
      ],
      maxTeamSize: 2, // 팀당 최대 인원
      
      // 랭크 정보
      rankTiers: [
        { id: 'bronze', name: '브론즈', color: '#CD7F32' },
        { id: 'silver', name: '실버', color: '#C0C0C0' },
        { id: 'gold', name: '골드', color: '#FFD700' },
        { id: 'platinum', name: '플래티넘', color: '#00CED1' },
        { id: 'diamond', name: '다이아', color: '#B9F2FF' },
        { id: 'master', name: '마스터', color: '#9370DB' },
        { id: 'admin', name: '관리자', color: '#FF5675' }
      ]
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
    
    confirmKickPlayer(player) {
      // 강퇴 확인 모달 표시
      this.playerToKick = player;
      this.showKickConfirmation = true;
    },
    
    cancelKickPlayer() {
      // 강퇴 취소
      this.showKickConfirmation = false;
      this.playerToKick = null;
    },
    
    kickPlayerConfirmed() {
      // 강퇴 확인 후 실행
      if (!this.isHost || !this.playerToKick) return;
      
      const kickedNickname = this.playerToKick.nickname;
      const kickedId = this.playerToKick.id;
      
      // 실제 구현에서는 API 호출 필요
      this.players = this.players.filter(p => p.id !== kickedId);
      
      // 시스템 메시지 추가
      this.chatMessages.push({
        id: `chat-${Date.now()}`,
        sender: '시스템',
        message: `${kickedNickname}님이 방에서 강퇴되었습니다.`,
        timestamp: new Date(),
        system: true
      });
      
      // 모달 닫기
      this.showKickConfirmation = false;
      this.playerToKick = null;
    },
    
    joinTeam(teamId) {
      if (this.roomData.matchType !== 'team') return;
      
      // 팀이 가득 찼는지 확인
      const teamPlayers = this.getTeamPlayers(teamId);
      if (teamPlayers.length >= this.maxTeamSize) {
        // 팀이 가득 찬 경우 참가 불가
        return;
      }
      
      // 사용자 팀 변경
      this.changeTeam(teamId);
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
      return team ? team.id : 'gray';
    },
    
    changeTeam(teamId) {
      if (this.roomData.matchType !== 'team') return;
      
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
    
    addSystemMessage(message) {
      // 시스템 메시지 추가
      this.chatMessages.push({
        id: `chat-${Date.now()}`,
        sender: '시스템',
        message: message,
        timestamp: new Date(),
        system: true
      });
    },
    
    formatRank(rankString) {
      if (!rankString) return 'N/A';
      
      // 랭크 형식이 'tier-level'이 아닌 경우 그대로 반환
      if (!rankString.includes('-')) return rankString;
      
      const [tier, level] = rankString.split('-');
      const rankTier = this.rankTiers.find(r => r.id === tier);
      
      if (!rankTier) return rankString;
      
      return `${rankTier.name} ${level}`;
    },
    
    getRankClass(rankString) {
      if (!rankString || !rankString.includes('-')) return '';
      
      const tier = rankString.split('-')[0];
      return `rank-${tier}`;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 12px;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.exit-button:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.room-info {
  margin-left: 1.5rem;
}

.room-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.room-details {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
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
  padding: 0.6rem 1.2rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 12px;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.settings-button:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 헤더 배지 스타일 */
.game-mode-badge,
.match-type-badge,
.region-badge,
.players-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.game-mode-badge {
  color: white;
}

.game-mode-badge.roadview {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}

.game-mode-badge.photo {
  background: linear-gradient(135deg, #16a34a 0%, #0d9488 100%);
}

.match-type-badge {
  background-color: #f1f5f9;
  color: #475569;
}

.match-type-badge.team {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.region-badge,
.players-count {
  background-color: #f1f5f9;
  color: #475569;
}

.separator {
  color: #94a3b8;
}

/* 메인 컨텐츠 스타일 */
.room-content {
  display: flex;
  flex: 1;
  padding: 1.5rem;
  gap: 1.5rem;
  position: relative;
  z-index: 5;
  overflow-y: auto;
  height: calc(100vh - 90px);
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
  border-radius: 16px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 1.2rem;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 3px;
}

/* 팀 선택 관련 스타일 */

.current-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.team-name {
  font-weight: 600;
  font-size: 1rem;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.team-selection-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}

.team-players-card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;
}

.team-players-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

/* 팀 색상별 카드 스타일 */
.team-blue-card {
  border-top: 5px solid #3b82f6;
}

.team-red-card {
  border-top: 5px solid #ef4444;
}

.team-green-card {
  border-top: 5px solid #10b981;
}

.team-yellow-card {
  border-top: 5px solid #f59e0b;
}

.team-header {
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border-bottom: 1px solid #f1f5f9;
  background-color: #f8fafc;
}

.team-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.team-blue-bg {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.team-red-bg {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.team-green-bg {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.team-yellow-bg {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.team-title {
  flex: 1;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
}

.team-count {
  font-size: 0.8rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
}

.team-players-list {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 플레이어 카드 기본 스타일 */
.player-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.player-card:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 팀별 플레이어 카드 스타일 */
.team-blue-player {
  background-color: #eff6ff;
  border-left-color: #3b82f6;
}

.team-red-player {
  background-color: #fee2e2;
  border-left-color: #ef4444;
}

.team-green-player {
  background-color: #ecfdf5;
  border-left-color: #10b981;
}

.team-yellow-player {
  background-color: #fef3c7;
  border-left-color: #f59e0b;
}

/* 호스트와 현재 유저 스타일 */
.player-card.is-host {
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.1);
}

.player-card.is-current {
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.1);
}

/* 빈 슬롯 스타일 */
.player-card.empty {
  border: 2px dashed #cbd5e1;
  border-left: 4px solid transparent;
  justify-content: center;
  color: #94a3b8;
  background-color: transparent;
  cursor: pointer;
  box-shadow: none;
}

.player-card.empty:hover {
  background-color: rgba(255, 255, 255, 0.7);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

/* 팀별 빈 슬롯 호버 스타일 */
.team-blue-empty:hover {
  border-color: #93c5fd;
  color: #3b82f6;
}

.team-red-empty:hover {
  border-color: #fca5a5;
  color: #ef4444;
}

.team-green-empty:hover {
  border-color: #6ee7b7;
  color: #10b981;
}

.team-yellow-empty:hover {
  border-color: #fcd34d;
  color: #f59e0b;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.empty-slot i {
  font-size: 1.5rem;
  opacity: 0.7;
}

/* 플레이어 아바타 스타일 */
.player-avatar {
  position: relative;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  border: 3px solid white;
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
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
  border: 2px solid white;
}

.host-badge i {
  font-size: 0.6rem;
  color: white;
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: 600;
  color: #334155;
  font-size: 1rem;
}

.player-level {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.2rem;
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
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
}

.status-badge.ready {
  background-color: #d1fae5;
  color: #059669;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
}

.kick-button {
  background: none;
  border: none;
  color: #ef4444;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
  padding: 0.25rem;
  font-size: 1rem;
}

.player-card:hover .kick-button {
  opacity: 1;
}

/* 액션 버튼 스타일 */
.start-game-button, .ready-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.start-game-button {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.roadview-mode .start-game-button {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}

.photo-mode .start-game-button {
  background: linear-gradient(135deg, #16a34a 0%, #14532d 100%);
}

.start-game-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3);
}

.start-game-button:disabled {
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  transform: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  cursor: not-allowed;
  opacity: 0.8;
}

.ready-button {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #475569;
}

.ready-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.ready-button.ready-on {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.ready-button.ready-on:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
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
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.countdown-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.countdown-number {
  font-size: 8rem;
  font-weight: 800;
  color: white;
  animation: pulse 1s infinite;
  text-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
}

.countdown-text {
  font-size: 1.8rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    text-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
  }
  50% {
    transform: scale(1.1);
    text-shadow: 0 0 30px rgba(59, 130, 246, 1);
  }
  100% {
    transform: scale(1);
    text-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
  }
}

/* 비밀방 배지 */
.room-privacy-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.room-privacy-badge.public {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
}

.room-privacy-badge:not(.public) {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #ef4444;
}

/* 채팅 말풍선 스타일 */
.chat-bubble {
  position: absolute;
  top: -40px;
  left: 20px;
  background-color: white;
  border-radius: 12px;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
  max-width: 200px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s, transform 0.3s;
  z-index: 5;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.chat-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 20px;
  width: 16px;
  height: 16px;
  background-color: white;
  transform: rotate(45deg);
  z-index: -1;
  box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.03);
}

.chat-bubble.active {
  opacity: 1;
  transform: translateY(0);
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
  
  .players-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
  }
}

@media (max-width: 768px) {
  .game-room-waiting {
    overflow: hidden;
  }
  
  .room-content {
    height: calc(100vh - 130px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 1rem;
  }
  
  .room-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
  }
  
  .header-right {
    align-self: flex-end;
  }
  
  .teams-container {
    grid-template-columns: 1fr;
  }
  
  .players-grid {
    grid-template-columns: 1fr;
  }
  
  .player-card {
    padding: 0.8rem;
  }
  
  .player-avatar {
    width: 40px;
    height: 40px;
    margin-right: 0.8rem;
  }
  
  .player-ranks {
    flex-direction: row;
    margin-right: 0;
  }
  
  .team-icon {
    width: 36px;
    height: 36px;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.2rem;
}

/* 플레이어 카드 기본 스타일 */
.player-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.player-card:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 플레이어 정보 스타일 */
.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1.5;
}

.player-stats {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.player-level, .multiplayer-stats {
  font-size: 0.8rem;
  color: #64748b;
}

/* 랭크 표시 스타일 */
.player-ranks {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  margin-right: 0.5rem;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rank-badge.roadview {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(30, 58, 138, 0.15) 100%);
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.rank-badge.photo {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(20, 83, 45, 0.15) 100%);
  color: #16a34a;
  border: 1px solid rgba(22, 163, 74, 0.2);
}

/* 티어별 랭크 색상 */
.rank-tier {
  font-weight: 700;
}

.rank-bronze {
  color: #CD7F32;
  text-shadow: 0 0 1px rgba(205, 127, 50, 0.4);
}

.rank-silver {
  color: #6b7280;
  text-shadow: 0 0 1px rgba(192, 192, 192, 0.4);
}

.rank-gold {
  color: #b45309;
  text-shadow: 0 0 1px rgba(255, 215, 0, 0.5);
}

.rank-platinum {
  color: #0891b2;
  text-shadow: 0 0 1px rgba(0, 206, 209, 0.5);
}

.rank-diamond {
  color: #1e40af;
  text-shadow: 0 0 1px rgba(185, 242, 255, 0.5);
}

.rank-master {
  color: #7e22ce;
  text-shadow: 0 0 1px rgba(147, 112, 219, 0.5);
}

.rank-admin {
  color: #be123c;
  text-shadow: 0 0 2px rgba(255, 86, 117, 0.5);
  font-style: italic;
}

/* 강퇴 확인 모달 스타일 */
.kick-confirmation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 3000;
  backdrop-filter: blur(5px);
}

.kick-modal-content {
  background-color: white;
  border-radius: 16px;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: modalAppear 0.3s ease-out;
}

.kick-modal-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 1rem;
  text-align: center;
}

.kick-modal-message {
  text-align: center;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  color: #334155;
}

.player-to-kick {
  font-weight: 700;
  color: #ef4444;
}

.kick-modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.cancel-kick-button, 
.confirm-kick-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-kick-button {
  background-color: #f1f5f9;
  color: #64748b;
}

.cancel-kick-button:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
}

.confirm-kick-button {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.confirm-kick-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 