<template>
  <router-view></router-view>
</template>

<script setup>
import { onMounted } from 'vue';
onMounted(() => {
});
</script>

<style>
@import url("@/shared/assets/styles/common/reset.css");
@import url('https://use.fontawesome.com/releases/v5.15.4/css/all.css');

:root {
  --primary-color: #4a6cf7;
  --secondary-color: #6366f1;
  --header-height: 60px;
}

* {
  box-sizing: border-box;
}

body {
  font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  margin: 0;
  padding: 0;
  background: #f5f7fa;
  color: #333;
  line-height: 1.5;
}

#app {
  font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>
