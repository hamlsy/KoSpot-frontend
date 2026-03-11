<template>
  <div class="test-container">
    <BaseGameLayout>
      <template #game>
        <div class="dummy-game-content">
          <p>This is the dummy game screen</p>
          <p>The Results modal should overlay this entirely.</p>
        </div>
      </template>
      <template #results>
        <FinalResults
          :playerResults="mockPlayerResults"
          currentUserId="user_a"
          :totalRounds="5"
          :totalGameTime="342"
          :autoExitRemaining="21"
          :autoExitTotal="30"
          @exit-to-lobby="onExit"
          @play-again="onPlayAgain"
        />
      </template>
    </BaseGameLayout>
  </div>
</template>

<script setup>
import BaseGameLayout from '@/features/game/multiplayer/roadview/views/BaseGameLayout.vue';
import FinalResults from '@/features/game/multiplayer/roadview/components/results/FinalResults.vue';

// 4명의 유저 목업 데이터
const mockPlayerResults = [
  {
    playerId: "user_a",
    nickname: "UI Expert",
    totalScore: 48500,
    earnedPoint: 1500,
    finalRank: 1,
    markerImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
  },
  {
    playerId: "user_b",
    nickname: "Player Two",
    totalScore: 32100,
    earnedPoint: 800,
    finalRank: 2,
    markerImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
  },
  {
    playerId: "user_c",
    nickname: "Third Wheel",
    totalScore: 15400,
    earnedPoint: 300,
    finalRank: 3,
    markerImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mimi"
  },
  {
    playerId: "user_d",
    nickname: "Last Place",
    totalScore: 8900,
    earnedPoint: 50,
    finalRank: 4,
    markerImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Buster"
  }
];

function onExit() {
  alert('Exit to lobby clicked');
}

function onPlayAgain() {
  alert('Play again clicked');
}
</script>

<style scoped>
.test-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #f3f4f6;
}

.dummy-game-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') center/cover no-repeat;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
}
</style>
