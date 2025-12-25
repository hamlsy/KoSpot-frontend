<template>
  <div class="player-list">
    <h3 class="list-title" v-if="showTitle">
      플레이어 <span class="player-count">{{ players.length }}명</span>
    </h3>
    <div class="players-container">
      <!-- 팀 모드일 때 -->
      <template v-if="isTeamMode">
        <div class="team-players-grid">
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
                class="player-marker-img"
              />
              <div class="player-status-indicator" v-if="player.status">
                <i class="fas" :class="getStatusIcon(player.status)"></i>
              </div>
              <div class="host-indicator" v-if="player.isHost">
                <i class="fas fa-crown"></i>
              </div>
            </div>
            
            <!-- 플레이어 닉네임 (항상 표시) -->
            <div class="team-player-nickname">
              {{ player.nickname }}
              <span v-if="player.id === currentUserId" class="you-badge">(나)</span>
            </div>
            
            <!-- 호버 시 표시되는 추가 정보 툴팁 -->
            <div class="player-tooltip">
              <div class="player-score" v-if="player.score !== undefined">
                <i class="fas fa-star"></i> {{ formatNumber(player.score) }}
                <span class="plus-score" v-if="player.lastRoundScore">+{{ player.lastRoundScore }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      
      <!-- 개인 모드일 때 -->
      <div v-else class="players-list-single">
        <div 
          v-for="player in sortedPlayers"
          :key="player.id"
          class="player-card"
          :class="{ 'current-user': player.id === currentUserId }"
          @click="$emit('show-player-details', player)"
        >
          <div class="player-avatar-wrapper">
            <img 
              :src="player.avatar || '/images/default-avatar.png'" 
              :alt="player.nickname"
              class="player-avatar"
              :class="{ 'has-streak': player.streak > 0 }"
            />
            <div class="player-streak" v-if="player.streak > 0">
              <i class="fas fa-fire"></i> {{ player.streak }}
            </div>
          </div>
          
          <div class="player-marker-wrapper">
            <img 
              :src="player.markerImage || '/images/default-marker.png'" 
              :alt="player.nickname"
              class="player-marker"
            />
          </div>
          
          <div class="player-info">
            <div class="player-nickname">
              {{ player.nickname }}
              <span v-if="player.id === currentUserId" class="you-badge">(나)</span>
              <i v-if="player.isHost" class="fas fa-crown host-badge" title="방장"></i>
            </div>
            
            <div class="player-stats">
              <div class="player-score" v-if="showScores && player.score !== undefined">
                <i class="fas fa-star"></i>
                <span class="score-value">{{ player.score }}</span>
                <span class="plus-score" v-if="player.lastRoundScore">+{{ player.lastRoundScore }}</span>
              </div>
              
              <div 
                class="player-distance" 
                v-if="showMultiplayStats && player.distanceToTarget !== null && player.distanceToTarget !== undefined"
              >
                <i class="fas fa-map-marker-alt"></i>
                <span class="distance-value">{{ formatDistance(player.distanceToTarget) }}km</span>
              </div>
              
              <div class="player-status" v-if="player.status">
                <i class="fas" :class="getStatusIcon(player.status)"></i>
                {{ getStatusText(player.status) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import gameStore from '@/store/gameStore';
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

const emit = defineEmits(['show-player-details']);

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
const getStatusIcon = (status) => {
  switch (status) {
    case 'playing': return 'fa-gamepad playing';
    case 'submitted': return 'fa-check-circle submitted';
    default: return 'fa-circle';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'playing': return '플레이 중';
    case 'submitted': return '제출 완료';
    default: return '';
  }
};

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
  if (distance === null || distance === undefined) return '-';
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
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0.5rem;
}

.list-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player-count {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  background: var(--bg-tertiary);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}

.players-container {
  width: 100%;
}

/* 팀 모드 스타일 */
.team-player-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: calc(50% - 1rem);
}

.team-player-marker:hover {
  transform: translateY(-2px);
}

.team-player-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  overflow: hidden;
  background: var(--bg-secondary);
}

.team-player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  text-align: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 10;
  pointer-events: none;
}

.team-player-marker:hover .player-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-8px);
}

.team-players-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  padding: 0.5rem;
}

.team-player-nickname {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 0.5rem;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-marker-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
}

.host-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid #ffc107;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: #ffc107;
}

.team-player-marker.current-user {
  transform: scale(1.05);
}

.team-player-marker.current-user .team-player-avatar {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
}

.team-player-marker.has-submitted .team-player-avatar {
  border-color: var(--success-color);
  box-shadow: 0 0 0 2px rgba(var(--success-rgb), 0.2);
}

.player-nickname {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-primary);
  white-space: nowrap;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.host-badge {
  color: #ffc107;
  font-size: 0.8em;
}

.player-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.player-score i {
  color: #fbbf24;
}

.plus-score {
  color: var(--success-color);
  font-weight: 600;
  font-size: 0.75rem;
}

/* 개인 모드 스타일 */
.players-list-single {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  width: 100%;
}

.player-card {
  position: relative;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.player-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-card.current-user {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.player-avatar-wrapper {
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 0.75rem;
}

.player-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
  transition: all 0.2s ease;
}

.player-avatar.has-streak {
  border-color: var(--danger-color);
  box-shadow: 0 0 0 2px rgba(var(--danger-rgb), 0.2);
}

.player-streak {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #f43f5e, #f87171);
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  border: 2px solid var(--bg-secondary);
  z-index: 2;
}

.player-marker-wrapper {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 32px;
  height: 32px;
  background: var(--bg-secondary);
  border-radius: 50%;
  padding: 4px;
  border: 2px solid var(--border-color);
  z-index: 1;
}

.player-marker {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.player-info {
  width: 100%;
  text-align: center;
  margin-top: 0.5rem;
}

.player-nickname {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.you-badge {
  font-size: 0.7em;
  color: var(--primary-color);
  background: rgba(var(--primary-rgb), 0.1);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-weight: 500;
}

.host-badge {
  color: #f59e0b;
  font-size: 0.9em;
}

.player-stats {
  margin-top: 0.5rem;
  width: 100%;
}

.player-score,
.player-distance,
.player-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.player-score i {
  color: #fbbf24;
}

.player-distance i {
  color: var(--primary-color);
  font-size: 0.9em;
}

.player-status i {
  font-size: 0.9em;
}

.player-status .playing { color: var(--primary-color); }
.player-status .submitted { color: var(--success-color); }

.plus-score {
  color: var(--success-color);
  font-weight: 600;
  font-size: 0.75rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .players-list-single {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .player-card {
    padding: 1rem 0.75rem;
  }
  
  .player-avatar-wrapper {
    width: 50px;
    height: 50px;
  }
  
  .player-marker-wrapper {
    width: 28px;
    height: 28px;
    bottom: -4px;
    right: -4px;
  }
  
  .player-nickname {
    font-size: 0.85rem;
  }
  
  .player-score,
  .player-distance,
  .player-status {
    font-size: 0.75rem;
  }
}

/* 다크 모드 대응 */
@media (prefers-color-scheme: dark) {
  .player-card {
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
  }
  
  .player-avatar {
    border-color: var(--border-color);
  }
  
  .player-marker-wrapper {
    background-color: var(--bg-tertiary);
    border-color: var(--border-color);
  }
}

/* 팀 모드 스타일 */
.players-list {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

/* 팀 섹션 스타일 */
.team-section {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background-color: var(--bg-secondary);
  transition: all 0.3s ease;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.team-section.current-team {
  border: 2px solid var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.15);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.team-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.team-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.team-score {
  font-weight: 700;
  color: var(--primary-color);
  font-size: 1rem;
  margin-left: 4px;
}

.team-player-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 500;
  border: 1px solid var(--border-color);
}

.team-players-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.25rem;
}

.team-player {
  position: relative;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.team-player.is-me {
  background: rgba(var(--primary-rgb), 0.08);
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.team-player:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-avatar-wrapper {
  position: relative;
  width: 50px;
  height: 50px;
  margin-bottom: 0.75rem;
}

.player-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
  transition: all 0.2s ease;
}

.player-avatar.has-streak {
  border-color: var(--danger-color);
}

.player-marker-wrapper {
  position: absolute;
  bottom: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  background: var(--bg-secondary);
  border-radius: 50%;
  padding: 3px;
  border: 2px solid var(--border-color);
  z-index: 2;
}

.player-marker {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 50%;
}

.player-info {
  width: 100%;
  text-align: center;
}

.player-nickname {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.you-badge {
  font-size: 0.7em;
  color: var(--primary-color);
  background: rgba(var(--primary-rgb), 0.1);
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-weight: 500;
}

.player-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}

.player-score,
.player-distance {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.player-score {
  color: var(--success-color);
  font-weight: 600;
}

.player-score i {
  color: #ffc107;
  font-size: 0.9em;
}

.plus-score {
  color: var(--success-color);
  font-size: 0.85em;
  font-weight: 500;
  opacity: 0.9;
}

.player-streak {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  border: 2px solid var(--bg-primary);
  padding: 0 0.2rem;
  z-index: 3;
}

.player-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
}

.kick-button {
  color: var(--danger-color);
  background: rgba(var(--danger-rgb), 0.08);
}

.kick-button:hover {
  background: rgba(var(--danger-rgb), 0.15);
  transform: scale(1.1);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .team-players-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 1rem;
  }
  
  .team-player {
    padding: 0.8rem 0.6rem;
  }
  
  .player-avatar-wrapper {
    width: 44px;
    height: 44px;
  }
  
  .player-marker-wrapper {
    width: 24px;
    height: 24px;
    bottom: -6px;
    right: -6px;
  }
  
  .player-nickname {
    font-size: 0.85rem;
  }
  
  .player-score,
  .player-distance {
    font-size: 0.8rem;
  }
  
  .team-header {
    padding: 0.65rem 1rem;
  }
  
  .team-name {
    font-size: 1rem;
  }
  
  .team-player-count {
    padding: 0.2rem 0.6rem;
    font-size: 0.8rem;
  }
}

/* 다크 모드 대응 */
@media (prefers-color-scheme: dark) {
  .team-section {
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
  }
  
  .team-header {
    background-color: var(--bg-tertiary);
    border-bottom-color: var(--border-color);
  }
  
  .team-player {
    background-color: var(--bg-primary);
    border-color: var(--border-color);
  }
  
  .player-avatar {
    border-color: var(--border-color);
  }
}
</style>
