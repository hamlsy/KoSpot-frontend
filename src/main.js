import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import axios from 'axios';

import "@fortawesome/fontawesome-free/css/all.css";
import "@fortawesome/fontawesome-free/js/all.js";

// 전역 스타일 가져오기
import '@/assets/styles/index.css';

// Pinia 스토어 생성
const pinia = createPinia();

// 앱 인스턴스 생성
const app = createApp(App);

// 전역 속성 설정 (Vue 3 방식으로 변경)
app.config.globalProperties.$axios = axios;

// 플러그인 등록
app.use(router);
app.use(pinia);

// 앱 초기화 작업 (Pinia 스토어 사용 방식으로 변경 예정)
// 임시로 주석 처리: 스토어 마이그레이션 후 다시 활성화
// const store = useMainStore();
// store.initializeApp();

// 앱 마운트
app.mount('#app');
