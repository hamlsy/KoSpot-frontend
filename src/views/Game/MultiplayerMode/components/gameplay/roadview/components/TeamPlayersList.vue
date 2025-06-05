<template>
  <div class="team-players-container">
    <div v-for="team in sortedTeams" :key="team.id" class="team-section" :class="{'team-submitted': getTeamSubmissionStatus(team.id)}">
      <div class="team-header" :class="`team-${team.id}-header`">
        <div class="team-info">
          <div class="team-name">{{ getTeamName(team.id) }}</div>
          <div class="team-status" v-if="getTeamSubmissionStatus(team.id)">
            <span class="submission-badge">제출 완료</span>
          </div>
        </div>
        <div class="team-stats">
          <div class="team-distance" v-if="getTeamDistance(team.id) !== null">
            <i class="fas fa-map-marker-alt"></i> {{ formatDistance(getTeamDistance(team.id)) }}km
          </div>
          <div class="team-score" v-if="showTeamScores">{{ getTeamScore(team.id) }} 점</div>
        </div>
      </div>
      <BasePlayersList
        :players="getTeamPlayers(team.id)"
        :current-user-id="currentUserId"
        :is-host="isHost"
        :player-messages="playerMessages"
        :show-multiplay-stats="showMultiplayStats"
        :show-scores="false"
        :show-title="false"
        :is-team-mode="true"
        @show-player-details="$emit('show-player-details', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import BasePlayersList from '@/components/common/ui/game/BasePlayersList.vue';

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
  playerMessages: {
    type: Object,
    default: () => ({})
  },
  showTeamScores: {
    type: Boolean,
    default: true
  },
  showMultiplayStats: {
    type: Boolean,
    default: false
  },
  showScores: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['show-player-details', 'kick-player']);

// 팀 이름 매핑
const teamNames = {
  0: "블루팀",
  1: "레드팀",
  2: "그린팀",
  3: "퍼플팀"
};

// 팀 점수 기준 정렬
const sortedTeams = computed(() => {
  return [...props.teams].sort((a, b) => {
    const scoreA = getTeamScore(a.id);
    const scoreB = getTeamScore(b.id);
    return scoreB - scoreA; // 내림차순 정렬 (높은 점수가 위로)
  });
});

// Methods
const getTeamName = (teamId) => {
  return teamNames[teamId] || `팀 ${teamId}`;
};

const getTeamPlayers = (teamId) => {
  return props.players.filter(player => player.teamId === teamId);
};

const getTeamScore = (teamId) => {
  const team = props.teams.find(t => t.id === teamId);
  return team ? (team.score || 0) : 0;
};

// 팀 제출 상태 확인
const getTeamSubmissionStatus = (teamId) => {
  const teamPlayers = getTeamPlayers(teamId);
  // 팀원 중 한 명이라도 제출했으면 팀 제출 완료
  return teamPlayers.some(player => player.hasSubmitted);
};

// 팀 정답과의 거리 가져오기
const getTeamDistance = (teamId) => {
  const teamPlayers = getTeamPlayers(teamId);
  // 팀원 중 정답과의 거리가 있는 플레이어 찾기
  const playerWithDistance = teamPlayers.find(player => player.distanceToTarget !== undefined && player.distanceToTarget !== null);
  return playerWithDistance ? playerWithDistance.distanceToTarget : null;
};

// 거리 포맷팅
const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return '-';
  return distance.toFixed(2);
};
</script>

<style scoped>
.team-players-container {
  width: 100%;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.team-section {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: var(--bg-secondary);
  transition: all 0.3s ease;
}

/* Team submitted styling with subtle green glow and floating effect */
.team-submitted {
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
  transform: translateY(-4px);
  position: relative;
  z-index: 2;
  animation: teamSubmitted 0.5s ease-out;
}

@keyframes teamSubmitted {
  0% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(0);
  }
  50% {
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
    transform: translateY(-6px);
  }
  100% {
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
    transform: translateY(-4px);
  }
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  color: white;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.team-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.team-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 팀 헤더 색상 */
.team-0-header {
  background-color: #3b82f6; /* 파란색 */
  background-image: linear-gradient(135deg, #3b82f6, #2563eb);
}

.team-1-header {
  background-color: #ef4444; /* 빨간색 */
  background-image: linear-gradient(135deg, #ef4444, #dc2626);
}

.team-2-header {
  background-color: #10b981; /* 초록색 */
  background-image: linear-gradient(135deg, #10b981, #059669);
}

.team-3-header {
  background-color: #8b5cf6; /* 보라색 */
  background-image: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.team-name {
  font-size: 1.1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.team-score {
  font-size: 1rem;
  font-weight: bold;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
}

.team-distance {
  font-size: 0.9rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
}

.submission-badge {
  font-size: 0.75rem;
  background-color: rgba(16, 185, 129, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.team-status {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .team-stats {
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
}


@media (max-width: 768px) {
  .team-section {
    margin-bottom: 1rem;
  }
  
  .team-header {
    padding: 0.5rem 0.75rem;
  }
}
</style>
