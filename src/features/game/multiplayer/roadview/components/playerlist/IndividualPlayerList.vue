<template>
  <div class="player-list">
    <h3 class="list-title">
      플레이어 <span class="player-count">{{ players.length }}명</span>
    </h3>
    <div class="players-container">
      <div
        v-for="player in sortedPlayers"
        :key="player.id"
        class="player-card"
        :class="{
          'current-user': player.id === currentUserId,
          'has-submitted': player.hasSubmitted,
        }"
      >
        <!-- 순위 -->
        <div
          class="rank-badge"
          :class="{ 'first-place': getPlayerRank(player) === 1 }"
          v-if="showScores"
        >
          {{ getPlayerRank(player) }}
        </div>
        
        <!-- 프로필 사진 -->
        <div class="player-avatar">
          <img
            :src="player.equippedMarker || '/assets/default-marker.png'"
            alt="플레이어 마커"
          />
        </div>
        
        <!-- 닉네임, 점수, 거리 정보 -->
        <div class="player-info">
          <!-- 1행: 닉네임 -->
          <div class="player-name-row">
            <div class="player-name">
              {{ player.nickname }}
              <i
                class="fas fa-crown host-badge"
                v-if="player.isHost"
                title="방장"
              ></i>
            </div>
            <div class="player-status" v-if="!showScores">
              <template v-if="player.hasSubmitted">
                <div class="check-badge">
                  <i class="fas fa-check"></i>
                </div>
              </template>
              <template v-else>
                <div class="waiting-badge">
                  <i class="fas fa-hourglass-half"></i>
                </div>
              </template>
            </div>
            <div class="player-streak" v-if="player.streak > 0">
              <i class="fas fa-fire"></i> {{ player.streak }}
            </div>
          </div>
          
          <!-- 2행: 정답과의 거리, 현재점수, 추가점수 -->
          <div class="player-score-row" v-if="showScores">
            <template v-if="player.score !== undefined">
              <!-- 정답과의 거리 -->
              <div class="score-distance" v-if="player.distanceToTarget !== null">
                <i class="fas fa-map-marker-alt"></i>
                {{ formatDistance(player.distanceToTarget) }}km
              </div>
              
              <!-- 현재 점수와 추가 점수 -->
              <div class="score-wrapper">
                <div class="score-value">
                  {{ formatRoundScore(getPlayerRank(player)) }}
                </div>
                <div class="round-score" v-if="player.lastRoundScore">
                  <span class="plus-sign">+</span>{{ player.lastRoundScore }}
                </div>
              </div>
            </template>
            <div class="no-score" v-else>-</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PlayerList",

  props: {
    players: {
      type: Array,
      required: true,
    },
    currentUserId: {
      type: String,
      required: true,
    },
    showScores: {
      type: Boolean,
      default: false,
    },
    roundEnded: {
      type: Boolean,
      default: false,
    },
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
    },
  },

  methods: {
    formatNumber(number) {
      if (!number && number !== 0) return "0";
      return number.toLocaleString();
    },

    getPlayerRank(player) {
      if (!this.showScores || player.score === undefined) return "-";

      const index = this.sortedPlayers.findIndex((p) => p.id === player.id);
      return index + 1;
    },

    formatRoundScore(rank) {
      // 1등은 10점, 2등은 8점 등의 방식으로 점수 부여
      const scoreMap = {
        1: 10,
        2: 8,
        3: 6,
        4: 4,
        5: 2,
      };

      return scoreMap[rank] || 1; // 5등 이후는 1점
    },

    formatDistance(distance) {
      // 소수점 3자리에서 반올림
      return Math.round(distance * 100) / 100;
    },
  },
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
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  padding-right: 0.2rem; /* 스크롤바 공간 확보 */
}

.player-card {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  padding: 0.8rem;
  border-radius: 10px;
  background: #f9f9f9;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  gap: 0.8rem;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  margin-bottom: 0.5rem;
}

.player-card:hover {
  background: #f0f2f5;
}

.player-card.current-user {
  border-left-color: #4cd964;
  background: #f7fff9;
}

.player-card.has-submitted {
  background: #f4f9f4;
  border-left-color: #4cd964;
  box-shadow: 0 2px 8px rgba(76, 217, 100, 0.2);
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
  flex: 1;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  width: 100%;
}

.player-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: rgba(245, 245, 245, 0.5);
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
}

.player-avatar {
  position: relative;
  min-width: 42px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
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



.player-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
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

.check-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #4cd964;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(76, 217, 100, 0.3);
  animation: pulse 1.5s infinite;
}

.waiting-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ff9800;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(255, 152, 0, 0.3);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 5px rgba(76, 217, 100, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(76, 217, 100, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 5px rgba(76, 217, 100, 0.3);
  }
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

/* 2번째 열: 점수와 거리 정보 */


.score-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.score-value {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  white-space: nowrap;
}

.round-score {
  font-size: 0.85rem;
  color: #359245;
  background: rgba(76, 217, 100, 0.1);
  padding: 1px 4px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  position: absolute;
  top: -12px;
  right: -20px;
}

.plus-sign {
  font-size: 0.8rem;
  margin-right: 1px;
}

.score-distance {
  font-size: 0.75rem;
  color: #8e8e93;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.score-distance i {
  color: #ff3b30;
  font-size: 0.7rem;
}

.no-score {
  color: #999;
  font-size: 0.9rem;
  text-align: right;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 2px;
  color: darkslategray;
}

.first-place {
  color: gold;
}
</style>