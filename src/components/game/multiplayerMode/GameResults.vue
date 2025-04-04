<template>
  <div class="game-results" v-if="visible">
    <div class="results-container">
      <div class="results-header">
        <div class="game-title">
          <h2>게임 종료</h2>
          <div class="room-details">
            <span class="room-name">{{ roomData.name }}</span>
            <span class="separator">·</span>
            <span class="game-mode">{{ roomData.gameMode }} - {{ roomData.region }}</span>
          </div>
        </div>
      </div>
      
      <div class="results-content">
        <!-- 우승자 및 상위 3명 포디움 -->
        <div class="winners-podium" v-if="players.length > 0">
          <div class="second-place" v-if="players.length > 1">
            <div class="podium-player" :class="{'current-user': players[1].id === currentUserId}">
              <div class="medal silver">2</div>
              <div class="player-avatar">
                <img :src="players[1].profileImage" :alt="players[1].nickname">
              </div>
              <div class="player-name">{{ players[1].nickname }}</div>
              <div class="player-score">{{ formatNumber(players[1].score) }}</div>
            </div>
            <div class="podium-stand silver"></div>
          </div>
          
          <div class="first-place">
            <div class="podium-player" :class="{'current-user': players[0].id === currentUserId}">
              <div class="medal gold">1</div>
              <div class="player-avatar">
                <img :src="players[0].profileImage" :alt="players[0].nickname">
              </div>
              <div class="player-name">{{ players[0].nickname }}</div>
              <div class="player-score">{{ formatNumber(players[0].score) }}</div>
              <div class="trophy-icon">
                <i class="fas fa-trophy"></i>
              </div>
            </div>
            <div class="podium-stand gold"></div>
          </div>
          
          <div class="third-place" v-if="players.length > 2">
            <div class="podium-player" :class="{'current-user': players[2].id === currentUserId}">
              <div class="medal bronze">3</div>
              <div class="player-avatar">
                <img :src="players[2].profileImage" :alt="players[2].nickname">
              </div>
              <div class="player-name">{{ players[2].nickname }}</div>
              <div class="player-score">{{ formatNumber(players[2].score) }}</div>
            </div>
            <div class="podium-stand bronze"></div>
          </div>
        </div>
        
        <!-- 전체 플레이어 순위표 -->
        <div class="player-rankings">
          <h3>최종 순위</h3>
          
          <div class="rankings-table">
            <div class="table-header">
              <div class="rank-column">순위</div>
              <div class="player-column">플레이어</div>
              <div class="score-column">점수</div>
              <div class="accuracy-column">정확도</div>
            </div>
            
            <div class="table-body">
              <div 
                v-for="(player, index) in players" 
                :key="player.id"
                class="player-row"
                :class="{'current-user': player.id === currentUserId}"
              >
                <div class="rank-column">
                  <div class="rank">{{ index + 1 }}</div>
                </div>
                <div class="player-column">
                  <div class="player-avatar">
                    <img :src="player.profileImage" :alt="player.nickname">
                    <div class="player-level">{{ player.level }}</div>
                  </div>
                  <div class="player-info">
                    <div class="player-name">
                      {{ player.nickname }}
                      <span class="host-badge" v-if="player.isHost">방장</span>
                    </div>
                  </div>
                </div>
                <div class="score-column">{{ formatNumber(player.score) }}</div>
                <div class="accuracy-column">{{ calculateAccuracy(player) }}%</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 통계 카드 -->
        <div class="stats-cards">
          <div class="stats-card">
            <div class="stats-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <div class="stats-value">{{ getBestDistance() }}</div>
            <div class="stats-label">최고 정확도</div>
          </div>
          
          <div class="stats-card">
            <div class="stats-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <div class="stats-value">{{ getLongestStreak() }}</div>
            <div class="stats-label">최장 연속 정답</div>
          </div>
          
          <div class="stats-card">
            <div class="stats-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stats-value">{{ players.length }}</div>
            <div class="stats-label">참가자 수</div>
          </div>
        </div>
      </div>
      
      <div class="results-footer">
        <button class="action-button play-again" @click="playAgain">
          <i class="fas fa-redo"></i>
          다시 플레이
        </button>
        <button class="action-button exit-game" @click="exit">
          <i class="fas fa-sign-out-alt"></i>
          로비로 돌아가기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameResults',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    players: {
      type: Array,
      required: true
    },
    roomData: {
      type: Object,
      required: true
    },
    currentUserId: {
      type: String,
      default: ''
    }
  },
  
  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => b.score - a.score);
    }
  },
  
  methods: {
    formatNumber(num) {
      if (num === null || num === undefined) return '0';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    calculateAccuracy(player) {
      if (!player.distanceToTarget) return '0';
      
      // 평균 거리가 10km 이하일 때 100% ~ 0%로 계산
      // 0km면 100%, 10km면 0%
      const accuracy = Math.max(0, 100 - (player.distanceToTarget * 10));
      return accuracy.toFixed(1);
    },
    
    getBestDistance() {
      if (this.players.length === 0) return '0m';
      
      const bestPlayer = this.players.reduce((best, player) => {
        if (!player.distanceToTarget) return best;
        if (!best.distanceToTarget) return player;
        return player.distanceToTarget < best.distanceToTarget ? player : best;
      }, { distanceToTarget: null });
      
      if (!bestPlayer.distanceToTarget) return '0m';
      
      const distance = bestPlayer.distanceToTarget;
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      } else {
        return `${distance.toFixed(2)}km`;
      }
    },
    
    getLongestStreak() {
      if (this.players.length === 0) return 0;
      
      return this.players.reduce((maxStreak, player) => {
        return Math.max(maxStreak, player.streak || 0);
      }, 0);
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
.game-results {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.results-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: zoomIn 0.5s ease;
}

.results-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  text-align: center;
}

.game-title h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #333;
  background: linear-gradient(135deg, #764ba2, #667eea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.room-details {
  color: #666;
  font-size: 1rem;
}

.separator {
  margin: 0 0.5rem;
}

.results-content {
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* 우승자 포디움 */
.winners-podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 2rem;
  height: 280px;
  position: relative;
}

.first-place, .second-place, .third-place {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.podium-stand {
  width: 100px;
  border-radius: 6px 6px 0 0;
}

.podium-stand.gold {
  height: 120px;
  background: linear-gradient(to bottom, #FFD700, #FFC107);
}

.podium-stand.silver {
  height: 80px;
  background: linear-gradient(to bottom, #E0E0E0, #BDBDBD);
}

.podium-stand.bronze {
  height: 50px;
  background: linear-gradient(to bottom, #CD7F32, #A1887F);
}

.podium-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  bottom: 120px;
  z-index: 2;
}

.first-place .podium-player {
  bottom: 120px;
}

.second-place .podium-player {
  bottom: 80px;
}

.third-place .podium-player {
  bottom: 50px;
}

.medal {
  position: absolute;
  top: -15px;
  right: -15px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 3;
}

.medal.gold {
  background: linear-gradient(135deg, #FFD700, #FFC107);
}

.medal.silver {
  background: linear-gradient(135deg, #E0E0E0, #BDBDBD);
}

.medal.bronze {
  background: linear-gradient(135deg, #CD7F32, #A1887F);
}

.podium-player .player-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  margin-bottom: 0.8rem;
}

.first-place .player-avatar {
  width: 100px;
  height: 100px;
}

.podium-player .player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.podium-player .player-name {
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 0.3rem;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.podium-player .player-score {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.trophy-icon {
  color: #FFC107;
  font-size: 1.5rem;
  position: absolute;
  top: -30px;
  animation: pulse 2s infinite ease-in-out;
}

.podium-player.current-user .player-name {
  color: #4285F4;
}

/* 플레이어 순위표 */
.player-rankings {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
}

.player-rankings h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.3rem;
}

.rankings-table {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-header {
  display: flex;
  background: #f0f2f5;
  padding: 0.8rem 1rem;
  font-weight: 600;
  color: #555;
}

.table-body {
  max-height: 300px;
  overflow-y: auto;
}

.player-row {
  display: flex;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.player-row:last-child {
  border-bottom: none;
}

.player-row.current-user {
  background: #EBF3FF;
}

.rank-column {
  width: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #555;
}

.player-column {
  flex: 1;
  display: flex;
  align-items: center;
}

.player-avatar {
  position: relative;
  margin-right: 1rem;
}

.player-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.player-level {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #555;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.player-info {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.host-badge {
  background: #4285F4;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
}

.score-column {
  width: 100px;
  text-align: center;
  font-weight: 600;
  color: #333;
}

.accuracy-column {
  width: 80px;
  text-align: center;
  color: #4CAF50;
}

/* 통계 카드 */
.stats-cards {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.stats-card {
  width: 180px;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
}

.stats-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #667eea;
}

.stats-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.stats-label {
  color: #666;
  font-size: 0.9rem;
}

/* 푸터 */
.results-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.action-button {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-again {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.play-again:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.exit-game {
  background: #f5f5f5;
  color: #555;
}

.exit-game:hover {
  background: #e0e0e0;
}

/* 애니메이션 */
@keyframes zoomIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .winners-podium {
    gap: 1rem;
    height: 220px;
  }
  
  .podium-stand {
    width: 70px;
  }
  
  .podium-stand.gold {
    height: 100px;
  }
  
  .podium-stand.silver {
    height: 70px;
  }
  
  .podium-stand.bronze {
    height: 40px;
  }
  
  .first-place .podium-player {
    bottom: 100px;
  }
  
  .second-place .podium-player {
    bottom: 70px;
  }
  
  .third-place .podium-player {
    bottom: 40px;
  }
  
  .first-place .player-avatar {
    width: 70px;
    height: 70px;
  }
  
  .podium-player .player-avatar {
    width: 60px;
    height: 60px;
  }
  
  .stats-card {
    width: 150px;
    padding: 1rem;
  }
  
  .table-header, .player-row {
    padding: 0.6rem 0.8rem;
  }
  
  .accuracy-column, .score-column {
    width: 70px;
  }
}

@media (max-width: 576px) {
  .results-container {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .winners-podium {
    height: 180px;
  }
  
  .podium-stand {
    width: 50px;
  }
  
  .podium-stand.gold {
    height: 80px;
  }
  
  .podium-stand.silver {
    height: 50px;
  }
  
  .podium-stand.bronze {
    height: 30px;
  }
  
  .first-place .podium-player {
    bottom: 80px;
  }
  
  .second-place .podium-player {
    bottom: 50px;
  }
  
  .third-place .podium-player {
    bottom: 30px;
  }
  
  .first-place .player-avatar {
    width: 60px;
    height: 60px;
  }
  
  .podium-player .player-avatar {
    width: 45px;
    height: 45px;
  }
  
  .podium-player .player-name {
    font-size: 0.8rem;
    max-width: 80px;
  }
  
  .results-footer {
    flex-direction: column;
    gap: 0.8rem;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
  
  .accuracy-column {
    display: none;
  }
}
</style> 