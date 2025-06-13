<template>
  <div class="test-voting-container">
    <h1>Team Voting Test</h1>
    
    <div class="controls">
      <h2>Controls</h2>
      <button @click="startVoting" :disabled="!!gameStore.state.teamVoting">Start Team Voting</button>
      <button @click="submitApproveVote" :disabled="!canVote || hasVoted">Vote Approve</button>
      <button @click="submitRejectVote" :disabled="!canVote || hasVoted">Vote Reject</button>
      <button @click="cancelVoting" :disabled="!gameStore.state.teamVoting">Cancel Voting</button>
    </div>
    
    <div class="team-players-section">
      <h2>Team Players</h2>
      <TeamPlayersList />
    </div>
    
    <div class="player-cards-section">
      <h2>Player Cards</h2>
      <div class="player-cards">
        <BasePlayerCard 
          v-for="player in gameStore.state.players" 
          :key="player.id" 
          :player="player"
          class="player-card"
        />
      </div>
    </div>
    
    <div class="voting-status" v-if="gameStore.state.teamVoting">
      <h2>Current Voting Status</h2>
      <div class="status-details">
        <p><strong>Team ID:</strong> {{ gameStore.state.teamVoting.teamId }}</p>
        <p><strong>Initiator:</strong> {{ getInitiatorName() }}</p>
        <p><strong>Started:</strong> {{ formatTime(gameStore.state.teamVoting.startTime) }}</p>
        <p><strong>Votes:</strong> {{ gameStore.state.teamVoting.votes.length }} / {{ getTeamSize() }}</p>
        <div class="votes-list">
          <div v-for="vote in gameStore.state.teamVoting.votes" :key="vote.playerId" class="vote-item">
            <span class="player-name">{{ vote.playerName }}</span>
            <span class="vote-choice" :class="vote.choice">
              {{ vote.choice === 'approve' ? '찬성' : '반대' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import TeamPlayersList from 'src/views/Game/MultiplayerMode/components/gameplay/roadview/components/TeamPlayersList.vue'
import BasePlayerCard from '@/features/game/shared/components/Player/Card.vue';
import gameStore from '@/store/gameStore';

// Load test data when component mounts
gameStore.loadTestData(true);

// Check if current user can vote
const canVote = computed(() => {
  if (!gameStore.state.teamVoting) return false;
  
  const currentUser = gameStore.state.currentUser;
  if (!currentUser) return false;
  
  return currentUser.teamId === gameStore.state.teamVoting.teamId;
});

// Check if current user has already voted
const hasVoted = computed(() => {
  if (!gameStore.state.teamVoting) return false;
  
  const currentUser = gameStore.state.currentUser;
  if (!currentUser) return false;
  
  return gameStore.state.teamVoting.votes.some(v => v.playerId === currentUser.id);
});

// Start a new team voting
const startVoting = () => {
  const currentUser = gameStore.state.currentUser;
  if (!currentUser) return;
  
  // Mock position for testing
  const position = { lat: 37.5665, lng: 126.9780 };
  
  gameStore.startTeamVoting(currentUser, position);
};

// Submit approve vote
const submitApproveVote = () => {
  gameStore.submitVote('approve');
};

// Submit reject vote
const submitRejectVote = () => {
  gameStore.submitVote('reject');
};

// Cancel voting
const cancelVoting = () => {
  gameStore.cancelVoting();
};

// Get initiator name
const getInitiatorName = () => {
  if (!gameStore.state.teamVoting) return '';
  
  const initiatorId = gameStore.state.teamVoting.initiatorId;
  const initiator = gameStore.state.players.find(p => p.id === initiatorId);
  
  return initiator ? initiator.nickname : '알 수 없음';
};

// Get team size
const getTeamSize = () => {
  if (!gameStore.state.teamVoting) return 0;
  
  const teamId = gameStore.state.teamVoting.teamId;
  return gameStore.getTeamSize(teamId);
};

// Format time
const formatTime = (time) => {
  if (!time) return '';
  
  const date = new Date(time);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
};
</script>

<style scoped>
.test-voting-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans KR', sans-serif;
}

h1 {
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

h2 {
  color: #555;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.controls {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  margin-right: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.team-players-section,
.player-cards-section,
.voting-status {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.player-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.player-card {
  flex: 0 0 calc(20% - 15px);
}

.status-details {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
}

.votes-list {
  margin-top: 15px;
}

.vote-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.vote-item:last-child {
  border-bottom: none;
}

.player-name {
  font-weight: 500;
}

.vote-choice {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.9rem;
}

.vote-choice.approve {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  color: white;
}

.vote-choice.reject {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

@media (max-width: 768px) {
  .player-card {
    flex: 0 0 calc(33.33% - 15px);
  }
}

@media (max-width: 480px) {
  .player-card {
    flex: 0 0 calc(50% - 15px);
  }
}
</style>
