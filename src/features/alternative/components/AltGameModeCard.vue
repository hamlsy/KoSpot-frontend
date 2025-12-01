<template>
  <div 
    class="alt-game-card"
    :class="[
      `alt-card-${mode}`,
      { 'alt-card-locked': locked },
      tiltClass
    ]"
    @click="handleClick"
  >
    <!-- Background Gradient -->
    <div class="alt-card-bg"></div>
    
    <!-- Icon -->
    <div class="alt-card-icon">
      <i :class="iconClass"></i>
    </div>
    
    <!-- Content -->
    <div class="alt-card-content">
      <h3 class="alt-card-title">{{ title }}</h3>
      <p class="alt-card-description">{{ description }}</p>
      
      <!-- Stats (if provided) -->
      <div v-if="stats" class="alt-card-stats">
        <span v-if="stats.players" class="alt-card-stat">
          <i class="fas fa-user"></i>
          {{ stats.players }}
        </span>
        <span v-if="stats.difficulty" class="alt-card-stat">
          <i class="fas fa-star"></i>
          {{ stats.difficulty }}
        </span>
      </div>
      
      <!-- Badge (if provided) -->
      <div v-if="badge" class="alt-card-badge" :class="`alt-badge-${badge.type || 'default'}`">
        {{ badge.text }}
      </div>
    </div>
    
    <!-- Lock Overlay -->
    <div v-if="locked" class="alt-card-lock-overlay">
      <i class="fas fa-lock"></i>
      <span>{{ lockMessage || '준비 중' }}</span>
    </div>
    
    <!-- Hover Effect -->
    <div class="alt-card-hover-effect"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['roadview', 'photo', 'multiplayer', 'user'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  iconClass: {
    type: String,
    default: 'fas fa-gamepad'
  },
  locked: {
    type: Boolean,
    default: false
  },
  lockMessage: {
    type: String,
    default: '준비 중'
  },
  stats: {
    type: Object,
    default: null
  },
  badge: {
    type: Object,
    default: null
  },
  tilt: {
    type: String,
    default: 'none',
    validator: (value) => ['left', 'right', 'none'].includes(value)
  }
});

const emit = defineEmits(['click']);

const tiltClass = computed(() => {
  if (props.tilt === 'left') return 'alt-card-tilt-left';
  if (props.tilt === 'right') return 'alt-card-tilt-right';
  return '';
});

const handleClick = () => {
  if (!props.locked) {
    emit('click');
  }
};
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

/* ========================================
   ALTERNATIVE GAME MODE CARD - BOLD & TILTED
   ======================================== */

.alt-game-card {
  position: relative;
  padding: var(--alt-space-lg);
  background: var(--alt-surface);
  border-radius: var(--alt-radius-lg);
  box-shadow: var(--alt-surface-shadow);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--alt-transition-bounce);
  min-height: 280px;
  display: flex;
  flex-direction: column;
}

.alt-game-card:hover {
  transform: translateY(-12px) scale(1.03);
  box-shadow: var(--alt-surface-shadow-hover);
  z-index: 10;
}

/* Tilted Variants */
.alt-card-tilt-left {
  transform: rotate(-2deg);
}

.alt-card-tilt-left:hover {
  transform: rotate(0deg) translateY(-12px) scale(1.03);
}

.alt-card-tilt-right {
  transform: rotate(2deg);
}

.alt-card-tilt-right:hover {
  transform: rotate(0deg) translateY(-12px) scale(1.03);
}

/* Background Gradient */
.alt-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  opacity: 0.1;
  transition: all var(--alt-transition-base);
  z-index: 0;
}

.alt-card-roadview .alt-card-bg {
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
}

.alt-card-photo .alt-card-bg {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.alt-card-multiplayer .alt-card-bg {
  background: linear-gradient(135deg, var(--alt-korea-red) 0%, var(--alt-korea-yellow) 100%);
}

.alt-card-user .alt-card-bg {
  background: linear-gradient(135deg, var(--alt-primary-light) 0%, var(--alt-primary) 100%);
}

.alt-game-card:hover .alt-card-bg {
  opacity: 0.2;
  height: 100%;
}

/* Icon */
.alt-card-icon {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--alt-radius-md);
  margin-bottom: var(--alt-space-md);
  font-size: 2.5rem;
  color: var(--alt-text-secondary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all var(--alt-transition-base);
  z-index: 1;
}

.alt-card-roadview .alt-card-icon {
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
}

.alt-card-photo .alt-card-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.alt-card-multiplayer .alt-card-icon {
  background: linear-gradient(135deg, var(--alt-korea-red) 0%, var(--alt-korea-yellow) 100%);
}

.alt-card-user .alt-card-icon {
  background: linear-gradient(135deg, var(--alt-primary-light) 0%, var(--alt-primary) 100%);
}

.alt-game-card:hover .alt-card-icon {
  transform: scale(1.15) rotate(5deg);
}

/* Content */
.alt-card-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.alt-card-title {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h3);
  font-weight: 700;
  color: var(--alt-text-primary);
  margin-bottom: var(--alt-space-sm);
}

.alt-card-description {
  font-size: var(--alt-font-body);
  color: var(--alt-text-muted);
  line-height: 1.6;
  margin-bottom: var(--alt-space-md);
  flex: 1;
}

/* Stats */
.alt-card-stats {
  display: flex;
  gap: var(--alt-space-md);
  margin-top: auto;
}

.alt-card-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--alt-font-small);
  color: var(--alt-text-muted);
  font-weight: 600;
}

.alt-card-stat i {
  color: var(--alt-primary);
}

/* Badge */
.alt-card-badge {
  position: absolute;
  top: var(--alt-space-md);
  right: var(--alt-space-md);
  padding: 0.5rem 1rem;
  background: var(--alt-accent);
  color: var(--alt-text-secondary);
  font-size: var(--alt-font-small);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: var(--alt-radius-full);
  box-shadow: 0 4px 12px rgba(255, 127, 80, 0.3);
  z-index: 2;
  animation: alt-pulse 2s ease-in-out infinite;
}

.alt-badge-new {
  background: linear-gradient(135deg, var(--alt-korea-red) 0%, var(--alt-korea-yellow) 100%);
}

.alt-badge-hot {
  background: var(--alt-accent);
}

.alt-badge-beta {
  background: var(--alt-primary);
}

/* Lock Overlay */
.alt-card-locked {
  cursor: not-allowed;
  opacity: 0.7;
}

.alt-card-lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--alt-space-sm);
  color: var(--alt-text-secondary);
  font-size: 1.5rem;
  font-weight: 700;
  z-index: 3;
}

.alt-card-lock-overlay i {
  font-size: 3rem;
  margin-bottom: var(--alt-space-sm);
}

.alt-card-lock-overlay span {
  font-size: 1.25rem;
  font-family: var(--alt-font-heading-en);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.alt-card-locked:hover {
  transform: none;
}

/* Hover Effect */
.alt-card-hover-effect {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(14, 165, 233, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity var(--alt-transition-fast);
  pointer-events: none;
  z-index: 0;
}

.alt-game-card:hover .alt-card-hover-effect {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .alt-game-card {
    min-height: 240px;
    padding: var(--alt-space-md);
  }

  .alt-card-tilt-left,
  .alt-card-tilt-right {
    transform: none;
  }

  .alt-card-icon {
    width: 64px;
    height: 64px;
    font-size: 2rem;
  }

  .alt-card-title {
    font-size: var(--alt-font-h3);
  }

  .alt-card-description {
    font-size: var(--alt-font-small);
  }
}
</style>

