<template>
  <div class="photo-mode-practice">
    <photo-mode-game
      mode="practice"
      :region="region"
    />
  </div>
</template>

<script>
import PhotoModeGame from '../gameplay/PhotoModeGame.vue';

export default {
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
    
  }
};
</script>

<style scoped>
.photo-mode-practice {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>