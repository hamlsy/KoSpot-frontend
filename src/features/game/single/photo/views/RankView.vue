<template>
  <div class="photo-mode-rank">
    <photo-mode-game
      mode="rank"
      :region="region"
      :total-rounds="totalRounds"
    />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import PhotoModeGame from 'src/features/game/single/photo/components/gameplay/PhotoModeGame.vue'
// import useGame from '@/composables/useGame';
// import useAuth from '../../../../../core/composables/useAuth';

export default defineComponent({
  name: 'PhotoModeRank',
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
  // setup(props) {
  //   // 인증 관련 composable 사용
  //   const { isLoggedIn } = useAuth();
    
  //   // 게임 관련 composable 사용
  //   const { gameState, startGame } = useGame({
  //     totalRounds: props.totalRounds,
  //     gameMode: 'photo'
  //   });
    
  //   return {
  //     isLoggedIn,
  //     gameState
  //   };
  // }
});
</script>

<style scoped>
.photo-mode-rank {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>