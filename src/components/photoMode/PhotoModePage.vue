<template>
  <div class="photo-mode-page">
    <NavigationBar v-if="!isGameActive" />
    <div class="content" :class="{ 'with-navbar': !isGameActive }">
      <!-- 페이지 내용 -->
    </div>
  </div>
</template>

<script>
import NavigationBar from '../shared/NavigationBar.vue';

export default {
  name: 'PhotoModePage',
  components: {
    NavigationBar
  },
  data() {
    return {
      isGameActive: false
    };
  }
};
</script>

<style scoped>
.photo-mode-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.content {
  padding: 1rem;
}

.content.with-navbar {
  padding-top: 80px; /* 네비게이션바 높이만큼 여백 */
}
</style> 