<template>
  <div class="player-list">
    <!-- 모바일 전용 헤더 (닫기 버튼 포함) -->
    <div class="mobile-header" v-if="isMobile">
      <h3 class="list-title">
        플레이어 <span class="player-count">{{ players.length }}명</span>
      </h3>
      <button class="close-button" @click="$emit('close-player-list')" title="목록 닫기">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <!-- 데스크톱용 타이틀 -->
    <h3 class="list-title" v-else>
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
            <!-- 플레이어 제출 상태 (아이콘만 표시) -->
            <div class="player-status" v-if="!showScores">
              <template v-if="player.hasSubmitted">
                <div class="check-badge submitted" title="제출완료">
                  <i class="fas fa-check-circle"></i>
                </div>
              </template>
              <template v-else>
                <div class="waiting-badge waiting" title="대기중">
                  <i class="fas fa-clock"></i>
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
                  {{ player.score || 0 }}점
                </div>
                <div class="round-score" v-if="player.lastRoundScore">
                  <span class="plus-sign">+</span>{{ player.lastRoundScore }}점
                </div>
              </div>
            </template>
            <div class="no-score" v-else>-</div>
          </div>
        </div>
        
        <!-- 채팅 말풍선 -->
        <div 
          v-if="playerChatMessages[player.id]" 
          class="chat-bubble"
        >
          <div class="bubble-content">
            {{ playerChatMessages[player.id].message }}
          </div>
          <div class="bubble-tail"></div>
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
    playerChatMessages: {
      type: Object,
      default: () => ({}),
    },
    // 모바일 여부 prop 추가
    isMobile: {
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
      if (!distance && distance !== 0) return "0";
      return Math.round(distance * 1000) / 1000;
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

/* 플레이어 목록 타이틀 */
.list-title {
  margin: 0 0 0.8rem 0;
  font-size: 1.1rem;
  color: #333;
  display: flex;
  align-items: center;
}

/* 모바일 전용 헤더 */
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
}

.mobile-header .list-title {
  margin: 0;
  padding: 0;
  flex: 1;
}

/* 닫기 버튼 */
.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.close-button:hover {
  background: #ff4757;
  color: white;
  transform: scale(1.1);
}

.close-button:active {
  transform: scale(0.95);
}

.close-button i {
  font-size: 0.9rem;
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
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  background: #f9f9f9;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  gap: 0.6rem;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  margin-bottom: 0.4rem;
  min-height: 60px;
  max-height: 80px;
}

.player-card:hover {
  background: #f0f2f5;
}

.player-card.current-user {
  border-left-color: #4cd964;
  background: #f7fff9;
}

.player-card.has-submitted {
  background: linear-gradient(135deg, #f4f9f4, #e8f5e8);
  border-left-color: #4cd964;
  box-shadow: 0 2px 8px rgba(76, 217, 100, 0.3);
  border: 2px solid rgba(76, 217, 100, 0.3);
  animation: submitSuccess 0.5s ease-out;
}

@keyframes submitSuccess {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(76, 217, 100, 0.2);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 4px 16px rgba(76, 217, 100, 0.4);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(76, 217, 100, 0.3);
  }
}

/* 플레이어 상태 배지 스타일 */
.player-status {
  display: flex;
  align-items: center;
  margin-left: auto;
}

/* 플레이어 상태 배지 (아이콘만) */
.check-badge, .waiting-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.check-badge.submitted {
  background: linear-gradient(135deg, #4cd964, #5ac467);
  color: white;
  box-shadow: 0 2px 6px rgba(76, 217, 100, 0.3);
  animation: pulse 1.5s infinite; /* 제출 완료 시 펄스 애니메이션 */
}

.waiting-badge.waiting {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  box-shadow: 0 2px 6px rgba(243, 156, 18, 0.3);
}


.check-badge i {
  font-size: 0.9rem;
}

.waiting-badge i {
  font-size: 0.8rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
  overflow: hidden;
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
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.player-avatar {
  position: relative;
  min-width: 36px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.player-avatar img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}



.player-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  word-break: break-word;
  overflow-wrap: break-word;
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


/* 제출 완료 배지 펄스 애니메이션 */
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

/* 채팅 말풍선 스타일 */
.chat-bubble {
  position: absolute;
  top: -10px;
  right: -120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  z-index: 10;
  animation: chat-bubble-appear 0.3s ease-out;
  max-width: 100px;
  word-wrap: break-word;
}

.bubble-content {
  position: relative;
  z-index: 1;
}

.bubble-tail {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #667eea;
}

.player-card {
  position: relative;
}

@keyframes chat-bubble-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 모바일에서는 말풍선 위치 조정 */
@media (max-width: 768px) {
  .chat-bubble {
    right: -80px;
    max-width: 70px;
    font-size: 0.7rem;
    padding: 6px 8px;
  }
  
  .player-card {
    padding: 0.4rem 0.6rem;
    gap: 0.4rem;
    min-height: 50px;
    max-height: 65px;
    margin-bottom: 0.3rem;
  }
  
  .player-avatar {
    min-width: 30px;
    width: 30px;
    height: 30px;
  }
  
  .player-name {
    font-size: 0.8rem;
  }
  
  .player-score-row {
    padding: 0.15rem 0.3rem;
    font-size: 0.75rem;
  }
  
  .player-info {
    gap: 0.15rem;
  }
  
  .list-title {
    font-size: 1rem;
    margin-bottom: 0.6rem;
  }
  
  .player-count {
    font-size: 0.8rem;
    padding: 0.15rem 0.4rem;
  }
}
</style>