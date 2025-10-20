<template>
  <router-link :to="to" class="app-logo">
    <h1 class="logo">KoSpot</h1>
    <span class="badge">Beta</span>
  </router-link>
</template>

<script>
export default {
  name: 'AppLogo',
  props: {
    to: {
      type: String,
      default: '/main'
    }
  }
}
</script>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: #2563eb;
  margin: 0;
}

.badge {
  background-color: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  text-transform: uppercase;
}
</style>
