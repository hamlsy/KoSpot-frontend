import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import axios from 'axios';

import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";

// 전역 스타일 가져오기
import '@/assets/styles/index.css';

Vue.config.productionTip = false;

// axios를 전역으로 사용하도록 설정
Vue.prototype.$axios = axios;

// 앱 인스턴스 생성
new Vue({
  render: h => h(App),
  router,
  store,
  beforeCreate() {
    // 앱 초기화 작업
    this.$store.dispatch('initializeApp');
  }
}).$mount('#app');
