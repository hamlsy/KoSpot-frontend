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
        <div class="rank-badge" :class="{'first-place': getPlayerRank(player) === 1}" v-if="showScores">
          {{ getPlayerRank(player) }}
        </div>
        <div class="player-info">
          <div class="player-avatar">
            <img :src="player.equippedMarker || '/assets/default-marker.png'" alt="플레이어 마커" />
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
            <div class="score-container">
              <div class="score-wrapper">
                <div class="score-value">
                  {{ formatRoundScore(getPlayerRank(player)) }}
                </div>
                <div class="round-score" v-if="player.lastRoundScore">
                  <span class="plus-sign">+</span>{{ player.lastRoundScore }}
                </div>
              </div>
            </div>
            <div class="score-distance" v-if="player.distanceToTarget !== null">
              <i class="fas fa-map-marker-alt"></i> {{ formatDistance(player.distanceToTarget) }}km
            </div>
          </template>
          <div class="no-score" v-else>-</div>
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
    },
    roundEnded: {
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
    },

    formatRoundScore(rank) {
      // 1등은 10점, 2등은 8점 등의 방식으로 점수 부여
      const scoreMap = {
        1: 10,
        2: 8,
        3: 6,
        4: 4,
        5: 2
      };
      
      return scoreMap[rank] || 1; // 5등 이후는 1점
    },
    
    formatDistance(distance) {
      // 소수점 3자리에서 반올림
      return Math.round(distance * 100) / 100;
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
  max-width: 100%;
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
  display: grid;
  grid-template-columns: auto minmax(120px, 1fr) auto;
  align-items: center;
  padding: 0.8rem;
  border-radius: 10px;
  background: #f9f9f9;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  gap: 0.5rem;
  width: 100%;
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
  min-width: 0;
  overflow: hidden;
}

.player-avatar {
  position: relative;
  min-width: 42px; /* 고정 너비 설정 */
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-avatar img {
  width: 80%;
  height: 80%;
  object-fit: contain;
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
  min-width: 0;
  overflow: hidden;
}

.player-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.host-badge {
  color: #ffc107;
  font-size: 0.8rem;
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  min-width: 60px;
  justify-self: end;
}

.score-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.score-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.score-value {
  font-weight: 600;
  font-size: 1.1rem;
}

.round-score {
  font-size: 0.7rem;
  color: #4cd964;
  background: rgba(76, 217, 100, 0.1);
  padding: 1px 4px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  position: absolute;
  top: -8px;
  right: -10px;
}

.plus-sign {
  font-size: 0.6rem;
  margin-right: 1px;
}

.score-distance {
  font-size: 0.8rem;
  color: #8e8e93;
  display: flex;
  align-items: center;
  gap: 4px;
}

.score-distance i {
  color: #ff3b30;
  font-size: 0.7rem;
}

.no-score {
  color: #999;
  font-size: 1.1rem;
}

.rank-badge {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  background: #e0e0e0;
  color: #555;
  flex-shrink: 0;
  margin-right: 6px;
}

.first-place {
  background: linear-gradient(135deg, #ffd700, #f9a825);
  color: white;
  box-shadow: 0 2px 5px rgba(249, 168, 37, 0.3);
}
</style> 