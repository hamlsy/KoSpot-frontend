import Vue from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';

import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";

Vue.config.productionTip = false;
// axios를 전역으로 사용하도록 설정
Vue.prototype.$axios = axios;

new Vue({
  render: h => h(App),
  router,
}).$mount('#app');
