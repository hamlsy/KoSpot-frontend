<template>
  <div
    class="game-mode-card"
    :style="cardColorVars"
    :class="{ 
      'mode-card-hover': isHovered,
      'practice-mode': mode.id === 'practice',
      'rank-mode': mode.id === 'rank',
      'theme-mode': mode.id === 'theme'
    }"
    @click="$emit('select', mode)"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="game-mode-icon" :class="mode.color">
      <i :class="mode.icon"></i>
    </div>
    <div class="game-mode-details">
      <h3>{{ mode.title }}</h3>
      <p>{{ mode.shortDescription }}</p>
    </div>
    <div class="game-mode-arrow">
      <i class="fas fa-chevron-right"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { BRAND, TEXT, BACKGROUND } from '@/core/constants/colors.js';

const props = defineProps({
  mode: {
    type: Object,
    required: true
  }
});

defineEmits(['select']);

const isHovered = ref(false);

const cardColorVars = computed(() => ({
  '--color-primary': BRAND.PRIMARY,
  '--color-secondary': BRAND.SECONDARY,
  '--color-success': BRAND.SUCCESS,
  '--color-warning': BRAND.WARNING,
  '--color-surface': BACKGROUND.LIGHT,
  '--color-text-primary': TEXT.PRIMARY,
  '--color-text-secondary': TEXT.SECONDARY,
  '--color-text-tertiary': TEXT.MUTED,
}));
</script>

<style scoped>
.game-mode-card {
  display: flex;
  align-items: center;
  background-color: var(--color-surface);
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 1rem;
}

.game-mode-card:hover,
.mode-card-hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.game-mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.game-mode-icon.practice-color {
  background-color: var(--color-success);
}

.game-mode-icon.rank-color {
  background-color: var(--color-warning);
}

.game-mode-icon.theme-color {
  background-color: #8b5cf6;
}

.game-mode-details {
  flex: 1;
}

.game-mode-details h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.game-mode-details p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.game-mode-arrow {
  color: var(--color-text-tertiary);
  font-size: 1rem;
}

.practice-mode:hover .game-mode-arrow,
.practice-mode.mode-card-hover .game-mode-arrow {
  color: var(--color-success);
}

.rank-mode:hover .game-mode-arrow,
.rank-mode.mode-card-hover .game-mode-arrow {
  color: var(--color-warning);
}

.theme-mode:hover .game-mode-arrow,
.theme-mode.mode-card-hover .game-mode-arrow {
  color: #8b5cf6;
}
</style>
