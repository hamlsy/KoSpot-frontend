<template>
  <div class="player-list">
    <h3 class="list-title">플레이어 <span class="player-count">{{ players.length }}명</span></h3>
    <div class="players-container">
      <div 
        v-for="player in sortedPlayers" 
        :key="player.id"
        class="player-card" 
        :class="{ 
          'current-user': player.id === currentUserId,
          'has-submitted': player.hasSubmitted
        }"
      >
        <div class="player-info">
          <div class="player-avatar">
            <img :src="player.profileImage || '/assets/default-avatar.png'" alt="프로필 이미지" />
            <div class="player-level">{{ player.level }}</div>
          </div>
          <div class="player-details">
            <div class="player-name">
              {{ player.nickname }}
              <i class="fas fa-crown host-badge" v-if="player.isHost" title="방장"></i>
            </div>
            <div class="player-status" v-if="!showScores">
              <template v-if="player.hasSubmitted">
                <i class="fas fa-check-circle"></i> 제출 완료
              </template>
              <template v-else>
                <i class="fas fa-hourglass-half"></i> 선택 중...
              </template>
            </div>
            <div class="player-streak" v-if="player.streak > 0">
              <i class="fas fa-fire"></i> {{ player.streak }}
            </div>
          </div>
        </div>
        
        <div class="player-score" v-if="showScores">
          <template v-if="player.score !== undefined">
            <div 
              class="score-value" 
              :class="{
                'high-score': player.score >= 4000,
                'medium-score': player.score >= 2000 && player.score < 4000,
                'low-score': player.score < 2000
              }"
            >
              {{ formatNumber(player.score) }}
            </div>
            <div class="score-distance" v-if="player.distanceToTarget !== null">
              {{ player.distanceToTarget.toFixed(2) }}km
            </div>
          </template>
          <div class="no-score" v-else>-</div>
        </div>
        
        <div class="player-rank" v-if="showScores && sortedPlayers.length > 1">
          <div 
            class="rank-badge"
            :class="{
              'first-place': getPlayerRank(player) === 1,
              'second-place': getPlayerRank(player) === 2,
              'third-place': getPlayerRank(player) === 3
            }"
          >
            {{ getPlayerRank(player) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlayerList',
  
  props: {
    players: {
      type: Array,
      required: true
    },
    currentUserId: {
      type: String,
      required: true
    },
    showScores: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    sortedPlayers() {
      if (this.showScores) {
        // 점수에 따라 정렬
        return [...this.players].sort((a, b) => {
          if (b.score === undefined && a.score === undefined) return 0;
          if (b.score === undefined) return -1;
          if (a.score === undefined) return 1;
          return b.score - a.score;
        });
      } else {
        // 현재 사용자를 상단에 표시
        return [...this.players].sort((a, b) => {
          if (a.id === this.currentUserId) return -1;
          if (b.id === this.currentUserId) return 1;
          return 0;
        });
      }
    }
  },
  
  methods: {
    formatNumber(number) {
      if (!number && number !== 0) return '0';
      return number.toLocaleString();
    },
    
    getPlayerRank(player) {
      if (!this.showScores || player.score === undefined) return '-';
      
      const index = this.sortedPlayers.findIndex(p => p.id === player.id);
      return index + 1;
    }
  }
};
</script>

<style scoped>
.player-list {
  background: white;
  padding: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.list-title {
  margin: 0 0 0.8rem 0;
  font-size: 1.1rem;
  color: #333;
  display: flex;
  align-items: center;
}

.player-count {
  margin-left: 0.5rem;
  font-size: 0.9rem;
  background: #f0f2f5;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  color: #555;
}

.players-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.player-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  border-radius: 10px;
  background: #f9f9f9;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.player-card:hover {
  background: #f0f2f5;
}

.player-card.current-user {
  border-left-color: #4cd964;
  background: #f7fff9;
}

.player-card.has-submitted {
  background: #f5f9ff;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
}

.player-avatar {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-level {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #4cd964;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.player-details {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.host-badge {
  color: #ffc107;
  font-size: 0.8rem;
}

.player-status {
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.2rem;
}

.player-status i {
  font-size: 0.9rem;
}

.player-status i.fa-check-circle {
  color: #4cd964;
}

.player-status i.fa-hourglass-half {
  color: #ff9800;
}

.player-streak {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #ff5722;
  margin-top: 0.2rem;
  font-weight: 600;
}

.player-streak i {
  font-size: 0.9rem;
}

.player-score {
  font-weight: 700;
  text-align: right;
  margin-right: 0.8rem;
}

.score-value {
  font-size: 1.1rem;
}

.high-score {
  color: #4caf50;
}

.medium-score {
  color: #2196f3;
}

.low-score {
  color: #f44336;
}

.score-distance {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.2rem;
}

.no-score {
  color: #999;
  font-size: 1.1rem;
}

.player-rank {
  display: flex;
  justify-content: center;
  width: 32px;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e0e0e0;
  color: #555;
}

.first-place {
  background: linear-gradient(135deg, #ffd700, #f9a825);
  color: white;
  box-shadow: 0 2px 5px rgba(249, 168, 37, 0.3);
  transform: scale(1.2);
}

.second-place {
  background: linear-gradient(135deg, #bdbdbd, #9e9e9e);
  color: white;
  box-shadow: 0 2px 5px rgba(158, 158, 158, 0.3);
  transform: scale(1.1);
}

.third-place {
  background: linear-gradient(135deg, #d68f56, #bf6c36);
  color: white;
  box-shadow: 0 2px 5px rgba(183, 110, 64, 0.3);
  transform: scale(1.05);
}
</style> 