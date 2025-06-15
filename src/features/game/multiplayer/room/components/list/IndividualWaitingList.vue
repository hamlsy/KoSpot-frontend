<template>
  <div class="individual-players-container">
    <BasePlayersList
      :players="players"
      :current-user-id="currentUserId"
      :is-host="isHost"
      :player-messages="playerMessages"
      :show-multiplay-stats="true"
      :show-scores="false"
      :show-title="true"
      @show-player-details="$emit('show-player-details', $event)"
      @kick-player="$emit('kick-player', $event)"
    />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import BasePlayersList from '@/features/game/shared/components/Player/List.vue';

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
</script>

<style scoped>
.individual-players-container {
  /* Any individual-specific styling can go here */
}
</style>
