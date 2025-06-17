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
        <div 
          v-for="player in getTeamPlayers(team.id)" 
          :key="player.id"
          class="player-wrapper"
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
        
        <button 
          v-if="canJoinTeam(team.id)"
          class="join-team-button"
          @click="$emit('join-team', team.id)"
        >
          <div class="join-icon">
            <i class="fas fa-plus"></i>
          </div>
          <span>팀 참가하기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
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

// Methods
const getTeamPlayers = (teamId) => {
  return props.players.filter(player => player.teamId === teamId);
};

const getPlayerMessage = (playerId) => {
  return props.playerMessages[playerId] || null;
};

const canJoinTeam = (teamId) => {
  // Check if current user is already in this team
  const currentPlayer = props.players.find(player => player.id === props.currentUserId);
  if (currentPlayer && currentPlayer.teamId === teamId) {
    return false;
  }
  
  // Check if team is full
  const teamPlayers = getTeamPlayers(teamId);
  return teamPlayers.length < props.maxPlayersPerTeam;
};
</script>

<style scoped>
.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.team-players-card {
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.team-players-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* Team-specific styling */
.team-blue-card {
  border-top: 4px solid #3b82f6;
}

.team-red-card {
  border-top: 4px solid #ef4444;
}

.team-green-card {
  border-top: 4px solid #10b981;
}

.team-yellow-card {
  border-top: 4px solid #f59e0b;
}

.team-header {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.team-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  color: white;
}

.team-blue-bg {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.team-red-bg {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.team-green-bg {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.team-yellow-bg {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.team-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: black;
  margin: 0;
  flex: 1;
}

.team-count {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
}

.team-players {
  padding: 1.25rem;
}

.player-wrapper {
  margin-bottom: 0.75rem;
}

.player-wrapper:last-child {
  margin-bottom: 1.25rem;
}

.join-team-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.join-team-button:hover {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
  border-color: #9ca3af;
}

.join-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .teams-container {
    grid-template-columns: 1fr;
  }
}
</style>
