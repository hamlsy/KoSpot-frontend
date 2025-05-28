// src/stores/main.js
import { defineStore } from 'pinia';

// 메인 스토어 정의 (Vuex의 루트 스토어에 해당)
export const useMainStore = defineStore('main', {
  // 상태 (Vuex state)
  state: () => ({
    appVersion: process.env.VUE_APP_VERSION || '1.0.0',
    appName: 'KoSpot',
    isInitialized: false
  }),
  
  // 액션 (Vuex actions)
  actions: {
    initializeApp() {
      // 앱 초기화 로직
      // Pinia에서는 다른 스토어를 직접 import하여 사용할 수 있습니다.
      // 예: const authStore = useAuthStore();
      // authStore.loadUser();
      
      this.isInitialized = true;
    }
  },
  
  // 게터 (Vuex getters)
  getters: {
    getAppVersion: (state) => state.appVersion,
    getAppName: (state) => state.appName,
    getIsInitialized: (state) => state.isInitialized
  }
});
