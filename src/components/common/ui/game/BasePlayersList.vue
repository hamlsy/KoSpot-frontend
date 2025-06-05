<template>
  <div class="player-list">
    <h3 class="list-title" v-if="showTitle">
      플레이어 <span class="player-count">{{ players.length }}명</span>
    </h3>
    <div class="players-container">
      <!-- 팀 모드일 때 -->
      <template v-if="isTeamMode">
        <div
          v-for="player in sortedPlayers"
          :key="player.id"
          class="team-player-marker"
          :class="{
            'current-user': player.id === currentUserId,
            'has-submitted': player.hasSubmitted,
            [`team-${player.teamId}-marker`]: player.teamId
          }"
          @click="$emit('show-player-details', player)"
        >
          <!-- 플레이어 마커 -->
          <div class="team-player-avatar">
            <img
              :src="player.equippedMarker || '/assets/default-marker.png'"
              alt="플레이어 마커"
            />
          </div>
          
          <!-- 호버 시 표시되는 닉네임 툴팁 -->
          <div class="player-tooltip">
            <div class="player-nickname">
              {{ player.nickname }}
              <i class="fas fa-crown host-badge" v-if="player.isHost" title="방장"></i>
            </div>
            
            <!-- 점수 -->
            <div class="player-score" v-if="player.score !== undefined">
              <i class="fas fa-star"></i> {{ formatNumber(player.score) }}
              <span class="plus-score" v-if="player.lastRoundScore">+{{ player.lastRoundScore }}</span>
            </div>
          </div>
          
          <!-- 제출 상태 표시 -->
          <div class="submission-status" v-if="player.hasSubmitted">
            <i class="fas fa-check"></i>
          </div>
        </div>
      </template>
      
      <!-- 개인 모드일 때 -->
      <template v-else>
        <div
          v-for="player in sortedPlayers"
          :key="player.id"
          class="player-card"
          :class="{
            'current-user': player.id === currentUserId,
            'has-submitted': player.hasSubmitted
          }"
          @click="$emit('show-player-details', player)"
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
                  v-if="player.isHost || (isHost && player.id === currentUserId)"
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
              <div class="kick-button" v-if="isHost && player.id !== currentUserId && !isTeamMode" @click.stop="$emit('kick-player', player)">
                <i class="fas fa-times"></i>
              </div>
            </div>
            
            <!-- 2행: 정답과의 거리, 현재점수, 추가점수 -->
            <div class="player-score-row" v-if="showMultiplayStats && showScores">
              <template v-if="player.score !== undefined">
                <!-- 정답과의 거리 -->
                <div class="score-distance" v-if="player.distanceToTarget !== null">
                  <i class="fas fa-map-marker-alt"></i>
                  {{ formatDistance(player.distanceToTarget) }}km
                </div>
                
                <!-- 현재 점수와 추가 점수 -->
                <div class="score-wrapper">
                  <div class="score-value">
                    {{ formatNumber(player.score) }}
                  </div>
                  <div class="round-score" v-if="player.lastRoundScore">
                    <span class="plus-sign">+</span>{{ player.lastRoundScore }}
                  </div>
                </div>
              </template>
              <div class="no-score" v-else>-</div>
            </div>
            
            <!-- 채팅 메시지 표시 -->
            <div class="player-message" v-if="getPlayerMessage(player.id)">
              <div class="message-bubble">
                {{ getPlayerMessage(player.id) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  players: {
    type: Array,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  },
  isHost: {
    type: Boolean,
    default: false
  },
  playerMessages: {
    type: Object,
    default: () => ({})
  },
  showMultiplayStats: {
    type: Boolean,
    default: true
  },
  showTitle: {
    type: Boolean,
    default: true
  },
  showScores: {
    type: Boolean,
    default: false
  },
  isTeamMode: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['show-player-details', 'kick-player']);

// 정렬된 플레이어 목록
const sortedPlayers = computed(() => {
  if (props.showScores) {
    // 점수에 따라 정렬
    return [...props.players].sort((a, b) => {
      if (b.score === undefined && a.score === undefined) return 0;
      if (b.score === undefined) return -1;
      if (a.score === undefined) return 1;
      return b.score - a.score;
    });
  } else {
    // 현재 사용자를 상단에 표시
    return [...props.players].sort((a, b) => {
      if (a.id === props.currentUserId) return -1;
      if (b.id === props.currentUserId) return 1;
      return 0;
    });
  }
});

// Methods
const getPlayerMessage = (playerId) => {
  return props.playerMessages[playerId] || null;
};

const formatNumber = (number) => {
  if (!number && number !== 0) return "0";
  return number.toLocaleString();
};

const getPlayerRank = (player) => {
  if (!player.score && player.score !== 0) return "-";
  const index = sortedPlayers.value.findIndex(p => p.id === player.id);
  return index + 1;
};

const formatDistance = (distance) => {
  if (!distance && distance !== 0) return "0";
  return (distance / 1000).toFixed(1);
};

// 팀 이름 매핑
const teamNames = {
  0: "블루팀",
  1: "레드팀",
  2: "그린팀",
  3: "퍼플팀"
};

const getTeamName = (teamId) => {
  return teamNames[teamId] || `팀 ${teamId}`;
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
  cursor: pointer;
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

/* 팀별 스타일링 - 플레이어 카드 */
.player-card.team-0-player {
  border-left-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.player-card.team-1-player {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.player-card.team-2-player {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.player-card.team-3-player {
  border-left-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.05);
}

/* 팀 플레이어 마커 스타일 */
.team-player-marker {
  position: relative;
  display: inline-block;
  margin: 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.team-player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #fff;
  transition: all 0.3s ease;
}

.team-player-avatar img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

/* 팀별 마커 스타일링 */
.team-player-marker.team-0-marker .team-player-avatar {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.team-player-marker.team-1-marker .team-player-avatar {
  border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.team-player-marker.team-2-marker .team-player-avatar {
  border-color: #10b981;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.team-player-marker.team-3-marker .team-player-avatar {
  border-color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

/* 현재 유저 표시 */
.team-player-marker.current-user .team-player-avatar {
  transform: scale(1.1);
  box-shadow: 0 0 0 2px white, 0 0 0 4px gold;
}

/* 제출 완료 상태 */
.team-player-marker.has-submitted .team-player-avatar {
  box-shadow: 0 0 0 2px white, 0 0 0 4px #4cd964;
}

/* 제출 상태 표시 */
.submission-status {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #4cd964;
  color: white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  border: 1px solid white;
}

/* 툴팁 스타일 */
.player-tooltip {
  position: absolute;
  bottom: 100%; /* 위치 변경: top 대신 bottom 사용 */
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  color: #333;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 1000; /* z-index 값 상승 */
  pointer-events: none;
  margin-bottom: 8px;
  width: auto;
  min-width: 100px;
}

.player-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: white transparent transparent transparent;
}

.team-player-marker:hover .player-tooltip {
  opacity: 1;
  visibility: visible;
}

.player-nickname {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.player-distance,
.player-score {
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.plus-score {
  color: #4cd964;
  font-size: 0.75rem;
  margin-left: 4px;
}

/* 플레이어 마커 그리드 레이아웃 */
.players-container {
  display: block; /* flex에서 block으로 변경 */
  padding: 8px 8px 40px 8px; /* 하단 패딩 확대 */
  max-height: 350px; /* 최대 높이 증가 */
  overflow-y: auto;
  position: relative; /* static에서 relative로 변경 */
  margin-bottom: 10px;
  overflow-x: hidden; /* 가로 스크롤 방지 */
}

/* float 사용으로 인한 clearfix */
.players-container::after {
  content: "";
  display: table;
  clear: both;
  height: 0;
}

/* 팀 플레이어 마커 그리드 레이아웃 - 1행에 2명씩 */
.team-player-marker {
  width: calc(50% - 8px); /* 1행에 2개씩, 간격 고려 */
  box-sizing: border-box;
  display: inline-block;
  text-align: center;
  margin-bottom: 35px; /* 마진 확대 */
  position: relative;
  float: left;
  padding: 4px;
  min-height: 60px; /* 최소 높이 설정 */
  overflow: visible;
  z-index: 1; /* 기본 z-index 설정 */
}

/* 플레이어 마커 호버 시 z-index 증가 */
.team-player-marker:hover {
  z-index: 10; /* 호버 시 z-index 증가로 툴팁이 위에 표시되도록 */
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

.kick-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ff3b30;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(255, 59, 48, 0.3);
  cursor: pointer;
  margin-left: auto;
}

.kick-button:hover {
  background: #e02e24;
  transform: scale(1.05);
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

.player-message {
  margin-top: 0.3rem;
  width: 100%;
}

.message-bubble {
  background: #f0f2f5;
  padding: 0.5rem 0.8rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #333;
  position: relative;
  max-width: 100%;
  word-break: break-word;
}

.message-bubble::before {
  content: '';
  position: absolute;
  top: -5px;
  left: 15px;
  width: 10px;
  height: 10px;
  background: #f0f2f5;
  transform: rotate(45deg);
}

@media (max-width: 768px) {
  .players-card {
    margin-bottom: 1rem;
  }
}
</style>
