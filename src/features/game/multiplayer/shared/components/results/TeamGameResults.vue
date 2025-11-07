<template>
  <div class="team-game-results" v-if="visible">
    <div class="results-backdrop"></div>
    <div class="results-container">
      <div class="results-header">
        <h2 class="results-title">
          <i class="fas fa-trophy"></i> 게임 결과
        </h2>
        <p class="results-subtitle">{{ roomData.name }}</p>
      </div>
      
      <div class="results-content">
        <div class="winner-section">
          <div class="winner-badge">
            <i class="fas fa-crown"></i> 우승
          </div>
          
          <div class="winner-team" :class="`team-${getTeamColor(winnerTeam.id)}`">
            <div class="team-name">{{ winnerTeam.name }} 팀</div>
            <div class="team-score">{{ formatNumber(winnerTeam.totalScore) }} 점</div>
          </div>
          
          <div class="winner-players">
            <div 
              v-for="player in getTeamPlayers(winnerTeam.id)"
              :key="player.id"
              class="player-card"
            >
              <img :src="player.profileImage" :alt="player.nickname" class="player-avatar">
              <div class="player-info">
                <div class="player-name">{{ player.nickname }}</div>
                <div class="player-level">Lv. {{ player.level }}</div>
              </div>
              <div class="player-score">{{ formatNumber(player.score) }} 점</div>
            </div>
          </div>
        </div>
        
        <div class="other-teams-section">
          <h3 class="section-title">다른 팀 결과</h3>
          
          <div class="team-results-list">
            <div 
              v-for="(team, index) in otherTeams"
              :key="team.id"
              class="team-result-card"
              :class="`team-${getTeamColor(team.id)}-border`"
            >
              <div class="team-rank">{{ index + 2 }}</div>
              <div class="team-result-info">
                <div class="team-name">{{ team.name }} 팀</div>
                <div class="team-score">{{ formatNumber(team.totalScore) }} 점</div>
              </div>
              <button 
                class="view-team-details" 
                @click="toggleTeamDetails(team.id)"
                :class="{ 'active': expandedTeamId === team.id }"
              >
                <i :class="expandedTeamId === team.id ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
              </button>
              
              <!-- 팀원 상세 정보 -->
              <div 
                class="team-details"
                v-if="expandedTeamId === team.id"
              >
                <div 
                  v-for="player in getTeamPlayers(team.id)"
                  :key="player.id"
                  class="team-player-item"
                >
                  <img :src="player.profileImage || '/assets/default-avatar.png'" :alt="player.nickname" class="mini-avatar">
                  <div class="player-name">{{ player.nickname }}</div>
                  <div class="player-score">{{ formatNumber(player.score) }} 점</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="highlight-section">
          <div class="highlight-card">
            <div class="highlight-icon">
              <i class="fas fa-bullseye"></i>
            </div>
            <div class="highlight-content">
              <h4>최고 정확도</h4>
              <div class="highlight-value">{{ bestAccuracyPlayer.nickname }}</div>
              <div class="highlight-description">
                평균 {{ bestAccuracyPlayer.averageDistance.toFixed(2) }}km
              </div>
            </div>
          </div>
          
          <div class="highlight-card">
            <div class="highlight-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <div class="highlight-content">
              <h4>가장 빠른 응답</h4>
              <div class="highlight-value">{{ fastestPlayer.nickname }}</div>
              <div class="highlight-description">
                평균 {{ fastestPlayer.averageTime.toFixed(1) }}초
              </div>
            </div>
          </div>
          
          <div class="highlight-card">
            <div class="highlight-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="highlight-content">
              <h4>최고 점수</h4>
              <div class="highlight-value">{{ highestScorePlayer.nickname }}</div>
              <div class="highlight-description">
                {{ formatNumber(highestScorePlayer.score) }} 점
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="results-chat">
        <h3 class="chat-title">채팅</h3>
        <div class="chat-messages" ref="chatMessages">
          <div 
            v-for="message in chatMessages" 
            :key="message.id"
            class="chat-message"
            :class="{ 'system-message': message.system }"
          >
            <template v-if="message.system">
              <div class="system-message-content">{{ message.message }}</div>
            </template>
            <template v-else>
              <div class="message-sender">{{ message.sender }}:</div>
              <div class="message-content">{{ message.message }}</div>
            </template>
          </div>
        </div>
        
        <div class="chat-input">
          <input 
            type="text" 
            v-model="newMessage" 
            placeholder="메시지 입력..." 
            @keyup.enter="sendChatMessage"
          />
          <button @click="sendChatMessage" :disabled="!newMessage.trim()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
      
      <div class="results-footer">
        <button class="play-again-button" @click="playAgain">
          <i class="fas fa-redo"></i> 다시 플레이
        </button>
        <button class="exit-button" @click="exit">
          <i class="fas fa-sign-out-alt"></i> 로비로 나가기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamGameResults',
  
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    teams: {
      type: Array,
      required: true
    },
    players: {
      type: Array,
      required: true
    },
    roomData: {
      type: Object,
      required: true
    },
    chatMessages: {
      type: Array,
      default: () => []
    }
  },
  
  data() {
    return {
      newMessage: '',
      expandedTeamId: null
    };
  },
  
  computed: {
    // 팀 점수 순으로 정렬
    sortedTeams() {
      return [...this.teams].sort((a, b) => b.totalScore - a.totalScore);
    },
    
    // 1등 팀
    winnerTeam() {
      return this.sortedTeams[0] || { id: null, name: '', totalScore: 0 };
    },
    
    // 2등 이하 팀
    otherTeams() {
      return this.sortedTeams.slice(1);
    },
    
    // 최고 정확도 플레이어
    bestAccuracyPlayer() {
      const playersWithAccuracy = this.players.filter(p => p.averageDistance !== undefined);
      if (playersWithAccuracy.length === 0) return { nickname: '없음', averageDistance: 0 };
      
      return [...playersWithAccuracy].sort((a, b) => a.averageDistance - b.averageDistance)[0];
    },
    
    // 가장 빠른 플레이어
    fastestPlayer() {
      const playersWithTime = this.players.filter(p => p.averageTime !== undefined);
      if (playersWithTime.length === 0) return { nickname: '없음', averageTime: 0 };
      
      return [...playersWithTime].sort((a, b) => a.averageTime - b.averageTime)[0];
    },
    
    // 최고 점수 플레이어
    highestScorePlayer() {
      if (this.players.length === 0) return { nickname: '없음', score: 0 };
      
      return [...this.players].sort((a, b) => b.score - a.score)[0];
    }
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.scrollChatToBottom();
        });
      }
    },
    
    chatMessages() {
      this.$nextTick(() => {
        this.scrollChatToBottom();
      });
    }
  },
  
  methods: {
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    getTeamColor(teamId) {
      const colorMap = {
        'team1': 'blue',
        'team2': 'red',
        'team3': 'green',
        'team4': 'yellow'
      };
      
      return colorMap[teamId] || 'blue';
    },
    
    getTeamPlayers(teamId) {
      return this.players.filter(player => player.teamId === teamId)
        .sort((a, b) => b.score - a.score);
    },
    
    toggleTeamDetails(teamId) {
      this.expandedTeamId = this.expandedTeamId === teamId ? null : teamId;
    },
    
    scrollChatToBottom() {
      if (this.$refs.chatMessages) {
        this.$refs.chatMessages.scrollTop = this.$refs.chatMessages.scrollHeight;
      }
    },
    
    sendChatMessage() {
      if (!this.newMessage.trim()) return;
      
      this.$emit('send-chat-message', this.newMessage);
      this.newMessage = '';
    },
    
    playAgain() {
      this.$emit('play-again');
    },
    
    exit() {
      this.$emit('exit');
    }
  }
};
</script>

<style scoped>
.team-game-results {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.results-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
}

.results-container {
  position: relative;
  width: 90%;
  max-width: 1000px;
  height: 90vh;
  max-height: 800px;
  overflow-y: auto;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.5s ease;
}

.results-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #4a6cf7 0%, #2563eb 100%);
  color: white;
  text-align: center;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.results-title {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.results-subtitle {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.results-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.winner-section {
  background: linear-gradient(to bottom, #f9fafb, white);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.winner-badge {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #f59e0b;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: 0 3px 8px rgba(245, 158, 11, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.winner-team {
  margin: 1.5rem 0;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.team-blue {
  color: #3b82f6;
}

.team-red {
  color: #ef4444;
}

.team-green {
  color: #10b981;
}

.team-yellow {
  color: #f59e0b;
}

.team-name {
  font-size: 1.8rem;
  font-weight: 700;
}

.team-score {
  font-size: 2rem;
  font-weight: 800;
  margin-top: 0.5rem;
}

.winner-players {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.player-card:hover {
  transform: translateY(-3px);
}

.player-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.8rem;
  border: 3px solid white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.player-info {
  text-align: center;
  margin-bottom: 0.8rem;
}

.player-name {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.2rem;
}

.player-level {
  font-size: 0.8rem;
  color: #64748b;
}

.player-score {
  font-weight: 700;
  font-size: 1.2rem;
  color: #4a6cf7;
}

.other-teams-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem;
}

.team-results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-result-card {
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  transition: height 0.3s ease;
}

.team-blue-border {
  border-left: 4px solid #3b82f6;
}

.team-red-border {
  border-left: 4px solid #ef4444;
}

.team-green-border {
  border-left: 4px solid #10b981;
}

.team-yellow-border {
  border-left: 4px solid #f59e0b;
}

.team-rank {
  font-size: 1.5rem;
  font-weight: 700;
  color: #64748b;
  width: 40px;
  text-align: center;
}

.team-result-info {
  flex: 1;
}

.view-team-details {
  background: none;
  border: none;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-team-details:hover {
  background-color: #f1f5f9;
  color: #333;
}

.view-team-details.active {
  background-color: #e0f2fe;
  color: #3b82f6;
}

.team-details {
  width: 100%;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.team-player-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 6px;
}

.mini-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.highlight-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.highlight-card {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 1.2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.highlight-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4a6cf7 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.highlight-content {
  flex: 1;
}

.highlight-content h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #64748b;
}

.highlight-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.3rem;
}

.highlight-description {
  font-size: 0.9rem;
  color: #64748b;
}

.results-chat {
  height: 250px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-top: 1px solid #eee;
  background-color: #f9fafb;
}

.chat-title {
  margin: 0 0 0.8rem;
  font-size: 1.1rem;
  color: #333;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.5rem;
}

.chat-message {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  max-width: 100%;
  word-break: break-word;
}

.system-message {
  align-self: center;
  color: #64748b;
  font-style: italic;
  font-size: 0.85rem;
}

.message-sender {
  font-weight: 600;
  color: #333;
}

.message-content {
  color: #4b5563;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.8rem;
}

.chat-input input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input input:focus {
  border-color: #4a6cf7;
}

.chat-input button {
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-input button:hover {
  background-color: #3b5de7;
}

.chat-input button:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.results-footer {
  padding: 1.2rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  border-top: 1px solid #eee;
}

.play-again-button, .exit-button {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.play-again-button {
  background-color: #4a6cf7;
  color: white;
  border: none;
}

.play-again-button:hover {
  background-color: #3b5de7;
  transform: translateY(-2px);
}

.exit-button {
  background-color: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.exit-button:hover {
  background-color: #f1f5f9;
  color: #333;
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .results-container {
    width: 95%;
    height: 95vh;
  }
  
  .results-title {
    font-size: 1.5rem;
  }
  
  .winner-section, .other-teams-section, .highlight-section {
    padding: 1rem;
  }
  
  .winner-players {
    grid-template-columns: 1fr;
  }
  
  .results-chat {
    height: 200px;
  }
}
</style> 