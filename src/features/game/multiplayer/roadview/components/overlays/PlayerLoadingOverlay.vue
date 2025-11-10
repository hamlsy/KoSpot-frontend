<template>
  <div class="player-loading-overlay">
    <div class="loading-card">
      <div class="loading-header">
        <div class="loading-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="loading-text">
          <h2>플레이어 준비 중</h2>
          <p>방에 입장한 플레이어를 기다리고 있습니다.</p>
        </div>
      </div>

      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-label">
          <span>{{ readyCount }} / {{ totalCount }} 명 도착</span>
        </div>
      </div>

      <ul class="player-status-list" v-if="players && players.length > 0">
        <li
          v-for="player in players"
          :key="player.memberId"
          :class="{ arrived: player.arrived }"
        >
          <span class="player-name">{{ formatPlayerName(player) }}</span>
          <span class="player-state">{{ player.arrived ? '도착' : '대기 중' }}</span>
        </li>
      </ul>

      <div class="loading-footer">
        <i class="fas fa-spinner fa-spin"></i>
        <span>모든 플레이어가 준비되면 게임이 시작됩니다.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  readyCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 1
  },
  players: {
    type: Array,
    default: () => []
  }
});

const progressPercent = computed(() => {
  if (!props.totalCount || props.totalCount <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((props.readyCount / props.totalCount) * 100));
});

const formatPlayerName = (player) => {
  if (!player) {
    return '플레이어';
  }

  if (player.nickname) {
    return player.nickname;
  }

  if (player.memberId) {
    return `플레이어 ${player.memberId}`;
  }

  return '플레이어';
};
</script>

<style scoped>
.player-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1.5rem;
}

.loading-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-sizing: border-box;
}

.loading-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.loading-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.6rem;
  box-shadow: 0 12px 25px rgba(99, 102, 241, 0.35);
}

.loading-text h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
}

.loading-text p {
  margin: 0.35rem 0 0;
  color: #475569;
  font-size: 0.95rem;
}

.loading-progress {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: inherit;
  transition: width 0.35s ease;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 600;
}

.player-status-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.player-status-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.65rem 0.85rem;
  background: #f8fafc;
  border-radius: 12px;
  color: #1e293b;
  font-weight: 500;
  transition: background 0.2s ease, transform 0.2s ease;
}

.player-status-list li.arrived {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
  transform: translateY(-1px);
}

.player-name {
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-state {
  font-size: 0.85rem;
  color: #475569;
}

.player-status-list li.arrived .player-state {
  color: #2563eb;
  font-weight: 600;
}

.loading-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-size: 0.9rem;
}

.loading-footer i {
  color: #6366f1;
}

@media (max-width: 480px) {
  .loading-card {
    padding: 1.5rem;
  }

  .loading-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .loading-icon {
    width: 52px;
    height: 52px;
    font-size: 1.3rem;
  }

  .loading-text h2 {
    font-size: 1.15rem;
  }

  .player-status-list li {
    font-size: 0.85rem;
  }
}
</style>

