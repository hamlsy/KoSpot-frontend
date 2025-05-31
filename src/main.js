// Vue 3 feature flags 설정
window.__VUE_OPTIONS_API__ = true;
window.__VUE_PROD_DEVTOOLS__ = false;
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';

// 카카오 맵 플러그인 가져오기
// import { KakaoMapsPlugin } from '@/plugins/kakaoMaps';

import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";

// 전역 스타일 가져오기
import '@/assets/styles/index.css'
// Vuex 스토어 가져오기 (Pinia로 마이그레이션 전까지 임시 사용)
// import store from './store'; // 임시로 주석 처리

//vue-number-animation
import CountUp from 'vue-countup-v3';

// 앱 인스턴스 생성
const app = createApp(App);

app.component('CountUp', CountUp);

// 전역 속성 설정 (Vue 3 방식으로 변경)
app.config.globalProperties.$axios = axios;

// 플러그인 등록
app.use(router);
// app.use(store); // Vuex 스토어 사용 (임시로 주석 처리)
// app.use(KakaoMapsPlugin, {
//   appKey: 'c66fbf360458039285570a638bad813a', // 현재 index.html에 있는 앱키 사용
//   libraries: 'services,clusterer,drawing,geometry' // 필요한 라이브러리 추가
// });

// 앱 초기화 작업 (임시로 주석 처리)
// if (store.state.initialized === false) {
//   store.dispatch('initializeApp');
// }


// 앱 마운트
app.mount('#app');
