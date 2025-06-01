<template>
  <div class="individual-players-container">
    <div class="players-card">
      <div class="players-list">
        <div 
          v-for="player in players" 
          :key="player.id"
          class="player-wrapper"
        >
          <BasePlayerCard 
            :player="player"
            :current-user-id="currentUserId"
            :is-host="isHost"
            :player-message="getPlayerMessage(player.id)"
            :show-multiplay-stats="true"
            @click="$emit('show-player-details', player)"
            @kick="$emit('kick-player', player)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import BasePlayerCard from '@/components/common/ui/game/BasePlayerCard.vue';

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
  }
});

const emit = defineEmits(['show-player-details', 'kick-player']);

// Methods
const getPlayerMessage = (playerId) => {
  return props.playerMessages[playerId] || null;
};
</script>

<style scoped>
.individual-players-container {
  margin-bottom: 1.5rem;
}

.players-card {
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
}

.players-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
}

.players-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.players-list {
  padding: 1.25rem;
}

.player-wrapper {
  margin-bottom: 0.75rem;
}

.player-wrapper:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .players-card {
    margin-bottom: 1rem;
  }
}
</style>
