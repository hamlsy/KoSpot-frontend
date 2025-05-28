<template>
  <div class="photo-mode-practice">
    <photo-mode-game
      mode="practice"
      :region="region"
      :theme="theme"
      :total-rounds="totalRounds"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import PhotoModeGame from '../gameplay/PhotoModeGame.vue';
import useGame from '@/composables/useGame';

export default defineComponent({
  name: 'PhotoModePractice',
  components: {
    PhotoModeGame
  },
  props: {
    region: {
      type: String,
      default: 'all'
    },
    theme: {
      type: String,
      default: ''
    },
    totalRounds: {
      type: Number,
      default: 5
    }
  },
  setup(props) {
    // 게임 관련 composable 사용
    const { gameState, startGame } = useGame({
      totalRounds: props.totalRounds,
      gameMode: 'photo'
      
    });
    
    return {
      gameState
    };
  }
});

</script>

<style scoped>
.photo-mode-practice {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>