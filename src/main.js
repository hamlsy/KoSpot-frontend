// Vue 3 feature flags 설정
window.__VUE_OPTIONS_API__ = true;
window.__VUE_PROD_DEVTOOLS__ = false;
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';
import * as VueCompositionAPI from 'vue';

// local api 경로 분기
axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL;

import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";

// 전역 스타일 가져오기
import '@/shared/assets/styles/index.css'

//vue-number-animation
import CountUp from 'vue-countup-v3';

// 앱 인스턴스 생성
const app = createApp(App);

app.component('CountUp', CountUp);

// 전역 속성 설정 (Vue 3 방식으로 변경)
app.config.globalProperties.$axios = axios;

// 플러그인 등록
app.use(router);

// 앱 마운트
app.mount('#app');
