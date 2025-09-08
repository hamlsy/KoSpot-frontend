<template>
  <div class="teams-container">
    <div 
      v-for="team in teams"
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
          {{ getTeamPlayers(team.id).length }}/{{ maxPlayersPerTeam }}
        </div>
      </div>
      
      <div class="team-players">
        <TransitionGroup 
          name="player-list" 
          tag="div"
          class="player-transition-group players-grid"
        >
          <div 
            v-for="player in getTeamPlayers(team.id)" 
            :key="player.id"
            class="player-wrapper"
            :class="{ 'joining-team': player.id === joiningPlayerId }"
          >
            <BasePlayerCard 
              :player="player"
              :current-user-id="currentUserId"
              :is-host="isHost"
              :player-message="getPlayerMessage(player.id)"
              @click="$emit('show-player-details', player)"
              @kick="$emit('kick-player', player)"
            />
          </div>
        </TransitionGroup>
        
        <button 
          v-if="canJoinTeam(team.id)"
          class="join-team-button"
          :class="{ 'joining': joiningTeamId === team.id }"
          :disabled="joiningTeamId !== null"
          @click="handleJoinTeam(team.id)"
        >
          <div class="join-icon">
            <i :class="joiningTeamId === team.id ? 'fas fa-spinner fa-spin' : 'fas fa-plus'"></i>
          </div>
          <span>{{ joiningTeamId === team.id ? '참가 중...' : '팀 참가하기' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref } from 'vue';
import BasePlayerCard from '@/features/game/shared/components/Player/Card.vue';

const props = defineProps({
  teams: {
    type: Array,
    required: true
  },
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
  maxPlayersPerTeam: {
    type: Number,
    default: 4
  },
  playerMessages: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['show-player-details', 'kick-player', 'join-team']);

// 팀 변경 애니메이션 상태
const joiningTeamId = ref(null);
const joiningPlayerId = ref(null);

// Methods
const getTeamPlayers = (teamId) => {
  return props.players.filter(player => player.teamId === teamId);
};

const getPlayerMessage = (playerId) => {
  return props.playerMessages[playerId] || null;
};

const canJoinTeam = (teamId) => {
  // 팀 변경 중이면 참가 불가
  if (joiningTeamId.value !== null) {
    return false;
  }
  
  // Check if current user is already in this team
  const currentPlayer = props.players.find(player => player.id === props.currentUserId);
  if (currentPlayer && currentPlayer.teamId === teamId) {
    return false;
  }
  
  // Check if team is full
  const teamPlayers = getTeamPlayers(teamId);
  return teamPlayers.length < props.maxPlayersPerTeam;
};

const handleJoinTeam = async (teamId) => {
  joiningTeamId.value = teamId;
  joiningPlayerId.value = props.currentUserId;
  
  try {
    emit('join-team', teamId);
    
    // 애니메이션 시간 후 상태 초기화
    setTimeout(() => {
      joiningTeamId.value = null;
      joiningPlayerId.value = null;
    }, 1500);
  } catch (error) {
    console.error('팀 참가 실패:', error);
    joiningTeamId.value = null;
    joiningPlayerId.value = null;
  }
};
</script>

<style scoped>
.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.team-players-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  position: relative;
}

.team-players-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* Team-specific styling */
.team-blue-card {
  border-top: 3px solid #60a5fa; /* 라이트 블루 */
}

.team-red-card {
  border-top: 3px solid #f87171; /* 라이트 레드 */
}

.team-green-card {
  border-top: 3px solid #34d399; /* 라이트 그린 */
}

.team-yellow-card {
  border-top: 3px solid #fbbf24; /* 라이트 옐로우 */
}

.team-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 0.8rem;
  border-bottom: 1px solid #f3f4f6;
}

.team-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  color: white;
}

.team-blue-bg {
  background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
}

.team-red-bg {
  background: linear-gradient(135deg, #fca5a5 0%, #f87171 100%);
}

.team-green-bg {
  background: linear-gradient(135deg, #86efac 0%, #34d399 100%);
}

.team-yellow-bg {
  background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%);
}

.team-title {
  font-size: 1rem;
  font-weight: 600;
  color: black;
  margin: 0;
  flex: 1;
}

.team-count {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
}

.team-players {
  padding: 0.6rem 0.75rem 0.75rem;
}

.player-transition-group {
  position: relative;
}

/* 2열 그리드: 작은 화면에서도 2명씩 배치 */
.players-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem 0.6rem;
}

.player-wrapper {
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.player-wrapper:last-child {
  margin-bottom: 0.75rem;
}

.player-wrapper.joining-team {
  transform: scale(1.05);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
  border-radius: 12px;
  padding: 0.25rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.join-team-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0.6rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.join-team-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.join-team-button.joining {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #3b82f6;
  border-color: #60a5fa;
  cursor: not-allowed;
}

.join-team-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.join-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 플레이어 이동 애니메이션 */
.player-list-enter-active,
.player-list-leave-active {
  transition: all 0.4s ease;
}

.player-list-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.player-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.player-list-move {
  transition: all 0.4s ease;
}

/* 팀 변경 성공 애니메이션 */
@keyframes teamJoinSuccess {
  0% {
    transform: scale(1.05);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
  }
  50% {
    transform: scale(1.1);
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%);
  }
  100% {
    transform: scale(1);
    background: transparent;
  }
}

.player-wrapper.team-join-success {
  animation: teamJoinSuccess 1s ease-out;
}

/* Compact overrides to ensure nickname and avatar visibility inside BasePlayerCard */
.team-players :deep(.player-card) {
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
}

.team-players :deep(.player-avatar) {
  margin-right: 0.5rem;
}

.team-players :deep(.avatar-wrapper) {
  width: 42px;
  height: 42px;
}

.team-players :deep(.player-info) {
  min-width: 0;
}

.team-players :deep(.player-name) {
  font-size: 0.9rem;
  white-space: normal;
  line-height: 1.2;
  overflow: visible;
  text-overflow: unset;
}

.team-players :deep(.player-stats) {
  gap: 0.5rem;
  font-size: 0.75rem;
}

.team-players :deep(.player-ranks) {
  gap: 0.35rem;
}

/* Reflow: place level and rank below nickname to protect name width */
.team-players :deep(.player-card) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.team-players :deep(.player-info) {
  order: 2;
  width: 100%;
  text-align: center;
}

.team-players :deep(.player-name) {
  margin-bottom: 0.15rem;
}

.team-players :deep(.player-stats) {
  order: 3;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  margin-top: 0.1rem;
}

.team-players :deep(.player-ranks) {
  order: 4;
  width: 100%;
  display: flex;
  flex-direction: row; /* 세로 → 가로 배치 */
  flex-wrap: nowrap;   /* 한 줄에 2개 고정 */
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.1rem;
}

.team-players :deep(.rank-badge) {
  padding: 0.2rem 0.45rem;
  border-radius: 14px;
  font-size: 0.7rem;
}

@media (max-width: 768px) {
  .teams-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .players-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.4rem 0.45rem;
  }

  .team-players-card {
    border-radius: 8px;
  }

  .team-title {
    font-size: 0.95rem;
  }

  .team-players {
    padding: 0.55rem 0.7rem 0.7rem;
  }

  .join-team-button {
    padding: 0.45rem 0.55rem;
  }

  /* Further compact on small screens */
  .team-players :deep(.player-card) {
    padding: 0.45rem 0.5rem;
  }

  .team-players :deep(.avatar-wrapper) {
    width: 38px;
    height: 38px;
  }

  .team-players :deep(.player-name) {
    font-size: 0.85rem;
  }

  .team-players :deep(.player-stats),
  .team-players :deep(.player-ranks) {
    display: none;
  }
}

/* 최대 2열 제한 (반응형 구간에서 3열 방지) */
@media (max-width: 1200px) {
  .teams-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 카드가 작아지는 구간에서는 랭크 숨김(닉네임 우선) */
@media (max-width: 1024px) {
  .team-players :deep(.player-ranks) {
    display: none;
  }
}
</style>
