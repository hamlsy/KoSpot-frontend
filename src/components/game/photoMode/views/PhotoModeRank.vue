<template>
  <div class="photo-mode-rank">
    <photo-mode-game
      mode="rank"
    />
  </div>
</template>

<script>
import PhotoModeGame from '../gameplay/PhotoModeGame.vue';

export default {
  name: 'PhotoModeRank',
  components: {
    PhotoModeGame
  },
  props: {
  }
};
</script>

<style scoped>
.photo-mode-rank {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>