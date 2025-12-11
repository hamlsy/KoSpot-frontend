<template>
  <div class="team-players-list">
    <!-- Teams container sorted by score -->
    <div 
      v-for="team in sortedTeams" 
      :key="team.id" 
      class="team-container"
      :class="[
        `team-${team.id}-container`,
        { 'team-submitted': getTeamSubmissionStatus(team.id) }
      ]"
    >
      <!-- Team header with name, score, and submission status -->
      <div class="team-header" :class="`team-${team.id}-header`">
        <div class="team-info">
          <div class="team-name">
            {{ getTeamName(team.id) }}
          </div>
          <div class="team-status" v-if="getTeamSubmissionStatus(team.id)">
            <span class="submission-badge">제출 완료</span>
          </div>
        </div>
      </div>
      
      <!-- Team players grid -->
      <div class="team-players-grid">
        <div 
          v-for="player in getTeamPlayers(team.id)" 
          :key="player.id" 
          class="player-marker"
          :class="{ 'current-user': player.id === currentUserId }"
        >
          <div class="player-marker-wrapper" :title="player.nickname">
            <img 
              :src="player.equippedMarker || '/assets/default-marker.png'" 
              :alt="player.nickname" 
              class="player-marker-img"
            />
            <div v-if="player.isHost" class="host-crown">
              <i class="fas fa-crown"></i>
            </div>
          </div>
          <div class="player-tooltip">{{ player.nickname }}</div>
        </div>
        
        <!-- Empty slots for remaining players -->
        <div 
          v-for="n in (maxPlayersPerTeam - getTeamPlayers(team.id).length)" 
          :key="`empty-${team.id}-${n}`" 
          class="player-marker empty"
        >
          <div class="player-marker-wrapper">
            <div class="empty-marker">
              <i class="fas fa-user-plus"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Team round score animation (shows when score changes) -->
      <div 
        v-if="teamRoundScores[team.id]" 
        class="team-round-score"
        :class="{ 'show': showTeamRoundScores }"
      >
        +{{ teamRoundScores[team.id] }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import gameStore from '@/store/gameStore';

export default {
  name: 'TeamPlayersList',
  
  props: {
    currentUserId: {
      type: String,
      required: true
    },
    maxPlayersPerTeam: {
      type: Number,
      default: 4
    }
  },
  
  setup(props) {
    // Store reference
    const store = gameStore;
    
    // Local reactive state
    const teamSubmissionStatus = ref({});
    const teamRoundScores = ref({});
    const showTeamRoundScores = ref(false);
    const previousTeamScores = ref({});
    
    // Get team name by ID
    const getTeamName = (teamId) => {
      const team = store.state.teams.find(t => t.id === teamId);
      return team ? team.name : `팀 ${teamId}`;
    };
    
    // Get players for a specific team
    const getTeamPlayers = (teamId) => {
      return store.state.players.filter(player => player.teamId === teamId);
    };
    
    // Check if a team has submitted their guess
    const getTeamSubmissionStatus = (teamId) => {
      return teamSubmissionStatus.value[teamId] || false;
    };
    
    // Sort teams by score (highest first)
    const sortedTeams = computed(() => {
      return [...store.state.teams].sort((a, b) => {
        // Sort by score (descending)
        return (b.totalScore || 0) - (a.totalScore || 0);
      });
    });
    
    // Watch for round end to show score animations
    watch(() => store.state.roundEnded, async (newValue) => {
      if (newValue) {
        // Calculate score differences
        const newScores = {};
        
        store.state.teams.forEach(team => {
          const prevScore = previousTeamScores.value[team.id] || 0;
          const currentScore = team.totalScore || 0;
          const scoreDiff = currentScore - prevScore;
          
          if (scoreDiff > 0) {
            newScores[team.id] = scoreDiff;
          }
        });
        
        // Update round scores and trigger animation
        teamRoundScores.value = newScores;
        
        // Wait for DOM update
        await nextTick();
        
        // Show score animations
        showTeamRoundScores.value = true;
        
        // Hide after animation completes
        setTimeout(() => {
          showTeamRoundScores.value = false;
        }, 3000);
        
        // Update previous scores for next round
        store.state.teams.forEach(team => {
          previousTeamScores.value[team.id] = team.totalScore || 0;
        });
      }
    });
    
    // Watch for player guess submissions to update team submission status
    watch(() => [...store.state.players], (newPlayers) => {
      const newStatus = {};
      
      // Group players by team
      store.state.teams.forEach(team => {
        const teamPlayers = newPlayers.filter(p => p.teamId === team.id);
        // Team has submitted if all players have submitted
        newStatus[team.id] = teamPlayers.every(p => p.hasSubmittedGuess);
      });
      
      teamSubmissionStatus.value = newStatus;
    }, { deep: true });
    
    // Initialize previous scores on mount
    onMounted(() => {
      store.state.teams.forEach(team => {
        previousTeamScores.value[team.id] = team.totalScore || 0;
      });
    });
    
    return {
      gameStore: store,
      getTeamName,
      getTeamPlayers,
      getTeamSubmissionStatus,
      sortedTeams,
      teamSubmissionStatus,
      teamRoundScores,
      showTeamRoundScores
    };
  }
};
</script>

<style scoped>
/* Main container */
.team-players-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
  height: 100%;
  overflow-y: auto;
}

/* Team container */
.team-container {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
}

.team-container:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Team header styles */
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  position: relative;
  overflow: hidden;
}

/* Team header background patterns and colors */
.team-blue-header {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%);
  color: white;
}

.team-red-header {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%);
  color: white;
}

.team-green-header {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%);
  color: white;
}

.team-purple-header {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%);
  color: white;
}

/* Add subtle pattern overlay to headers */
.team-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

/* Team info styles */
.team-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 1;
}

.team-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.team-score {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}

.team-header:hover .team-score {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Status badges */
.team-status {
  z-index: 1;
}

.submission-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.2);
}

.submission-badge:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 215, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
  }
}

/* Team players grid */
.team-players-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(249, 250, 251, 0.5);
}

/* Player marker styles */
.player-marker {
  position: relative;
  transition: all 0.3s ease;
}

.player-marker:hover {
  transform: translateY(-3px);
}

.player-marker:hover .player-tooltip {
  opacity: 1;
  transform: translateY(0);
}


.player-marker-wrapper {
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
}

.player-marker-img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

/* Host crown */
.host-crown {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
  z-index: 2;
}

.host-crown i {
  font-size: 0.6rem;
  color: white;
}

/* Player tooltip */
.player-tooltip {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 10;
}

/* Empty marker styles */
.player-marker.empty .player-marker-wrapper {
  background: rgba(243, 244, 246, 0.5);
  border: 2px dashed #d1d5db;
  box-shadow: none;
}

.empty-marker {
  color: #9ca3af;
  font-size: 1.2rem;
  opacity: 0.5;
}

/* Current user highlight */
.player-marker.current-user .player-marker-wrapper {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Team submitted state */
.team-submitted {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* Team round score animation */
.team-round-score {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 2rem;
  font-weight: bold;
  padding: 1rem 2rem;
  border-radius: 12px;
  opacity: 0;
  transition: all 0.5s ease;
  z-index: 10;
}

.team-round-score.show {
  animation: scorePopup 3s ease-in-out;
}

@keyframes scorePopup {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .team-players-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
