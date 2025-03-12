<template>
  <router-view></router-view>
</template>

<script>

export default {
  name: "App",
  // components: {
  //   HelloWorld
  // }
  mounted() {
  },
  methods: {
  }
};
</script>

<style>
@import url("@/assets/styles/common/reset.css");
/* @import url("@/assets/styles/common/header.css"); */

body {
  font-family: "Pretendard Variable", Pretendard;
  margin: 0px;
  background: #ffffff;
}
#app {
  font-family: "Pretendard Variable", Pretendard;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

a {
  text-decoration: none;
}


</style>
