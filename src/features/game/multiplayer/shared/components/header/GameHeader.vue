<template>
  <div class="game-header">
    <div class="header-left">
      <button class="exit-button" @click="$emit('exit-game')">
        <i class="fas fa-door-open"></i>
        <span class="exit-text">나가기</span>
      </button>
      <div class="room-info">
        <h2 class="room-name">{{ roomData.name }}</h2>
        <div class="game-mode">
          {{ roomData.gameMode }} - {{ roomData.region }}
        </div>
      </div>
    </div>

    <div class="header-center">
      <div class="round-info">
        <span class="round-number">
          라운드 {{ currentRound }}/{{ totalRounds }}
        </span>
        <div class="round-progress">
          <div
            class="progress-bar"
            :style="{
              width: `${(currentRound / totalRounds) * 100}%`,
            }"
          ></div>
        </div>
      </div>
    </div>

    <div class="header-right">
      <game-timer
        ref="gameTimer"
        :initialTime="remainingTime"
        :totalTime="120"
        :warning-threshold="30"
        :danger-threshold="10"
        :is-running="isTimerRunning"
      />
      <div v-if="showCorrectRegion" class="correct-region-display">
        정답: {{ correctRegion }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import GameTimer from "@/features/game/shared/components/Common/Timer.vue";

const props = defineProps({
  roomData: {
    type: Object,
    required: true
  },
  currentRound: {
    type: Number,
    required: true
  },
  totalRounds: {
    type: Number,
    required: true
  },
  remainingTime: {
    type: Number,
    required: true
  },
  isTimerRunning: {
    type: Boolean,
    default: true
  },
  showCorrectRegion: {
    type: Boolean,
    default: false
  },
  correctRegion: {
    type: String,
    default: ''
  }
});

defineEmits(['exit-game']);

const gameTimer = ref(null);
</script>

<style scoped>
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #222831;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.exit-text {
  display: inline-block;
}

.exit-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.room-info {
  margin-left: 1rem;
}

.room-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.game-mode {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 1rem;
}

.round-info {
  text-align: center;
}

.round-number {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.round-progress {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ffffff, #e0f7fa);
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

.header-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.correct-region-display {
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .game-header {
    flex-direction: row;
    padding: 0.5rem;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    flex: 1;
    min-width: 150px;
  }

  .header-center {
    flex: 1;
    margin: 0 0.5rem;
    max-width: 100%;
  }

  .header-right {
    align-self: center;
  }
  
  .exit-text {
    display: none;
  }
}
</style>
