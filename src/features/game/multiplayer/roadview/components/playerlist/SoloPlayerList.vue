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
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%);
  backdrop-filter: blur(16px);
  padding: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  max-width: 100%;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

/* 플레이어 목록 타이틀 */
.list-title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* 모바일 전용 헤더 */
.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.4);
  position: sticky;
  top: 0;
  z-index: 10;
  border-radius: 20px 20px 0 0;
  margin: -1rem -1rem 0 -1rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  min-height: 56px;
}

.mobile-header .list-title {
  margin: 0;
  padding: 0;
  flex: 1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* 닫기 버튼 */
.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
}

.close-button:hover {
  background: #ff4757;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(255, 71, 87, 0.3);
}

.close-button:active {
  transform: scale(0.95);
}

.close-button i {
  font-size: 0.875rem;
}

.player-count {
  margin-left: 0.75rem;
  font-size: 0.875rem;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  color: #475569;
  font-weight: 600;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.players-container {
  padding-top: 30px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  padding-right: 0.25rem;
  gap: 0.75rem;
}

.player-card {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.6);
  gap: 0.5rem;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  min-height: 48px;
  max-height: 64px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}

.player-card:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.player-card.current-user {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 197, 253, 0.15));
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2);
}

.player-card.has-submitted {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(134, 239, 172, 0.15));
  border: 1px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.2);
  animation: submitSuccess 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes submitSuccess {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.1);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 8px 32px rgba(34, 197, 94, 0.25);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(34, 197, 94, 0.15);
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
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 0.875rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
}

.check-badge.submitted {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  animation: pulse 1.5s infinite;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.waiting-badge.waiting {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  width: 100%;
  overflow: hidden;
}

.player-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: rgba(245, 245, 245, 0.5);
  padding: 0.15rem 0.3rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.player-avatar {
  position: relative;
  min-width: 36px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.player-avatar img {
  width: 75%;
  height: 75%;
  object-fit: contain;
}

.player-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  letter-spacing: -0.01em;
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.host-badge {
  color: #f59e0b;
  font-size: 0.75rem;
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
  background: linear-gradient(135deg, #3182f6 0%, #1d4ed8 100%);
  color: white;
  border-radius: 16px;
  padding: 8px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(49, 130, 246, 0.25);
  z-index: 10;
  animation: chat-bubble-appear 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-width: 100px;
  word-wrap: break-word;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
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
  border-right: 6px solid #3182f6;
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

/* 스크롤바 스타일링 */
.players-container::-webkit-scrollbar {
  width: 6px;
}

.players-container::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.3);
  border-radius: 3px;
}

.players-container::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 3px;
}

.players-container::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.7);
}

/* 모바일에서는 말풍선 위치 조정 */
@media (max-width: 768px) {
  .player-list {
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.98) 100%);
    backdrop-filter: blur(20px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.7);
  }
  
  .chat-bubble {
    right: -80px;
    max-width: 70px;
    font-size: 0.7rem;
    padding: 6px 8px;
  }
  
  .player-card {
    padding: 0.375rem 0.5rem;
    gap: 0.375rem;
    min-height: 44px;
    max-height: 60px;
    margin-bottom: 0.25rem;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
  }
  
  .player-avatar {
    min-width: 32px;
    width: 32px;
    height: 32px;
  }
  
  .player-name {
    font-size: 0.8125rem;
  }
  
  .player-score-row {
    padding: 0.125rem 0.25rem;
    font-size: 0.6875rem;
  }
  
  .player-info {
    gap: 0.125rem;
  }
  
  .list-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }
  
  .player-count {
    font-size: 0.8125rem;
    padding: 0.25rem 0.5rem;
  }
  
  .mobile-header {
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.98) 100%);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    padding: 0.75rem 1rem;
    min-height: 42px;
  }
}
</style>