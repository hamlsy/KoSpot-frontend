import Vue from 'vue';
import Vuex from 'vuex';

// 스토어 모듈 가져오기
import game from './modules/game';
import user from './modules/user';
import auth from './modules/auth';
import ui from './modules/ui';

// 기존 게임 스토어 (이전 버전과의 호환성 유지)
import gameStore from './gameStore';

Vue.use(Vuex);

// 루트 스토어 생성
export default new Vuex.Store({
  modules: {
    game,
    user,
    auth,
    ui
  },
  
  // 루트 상태
  state: {
    appVersion: process.env.VUE_APP_VERSION || '1.0.0',
    appName: 'KoSpot',
    isInitialized: false
  },
  
  // 루트 뮤테이션
  mutations: {
    SET_INITIALIZED(state, value) {
      state.isInitialized = value;
    }
  },
  
  // 루트 액션
  actions: {
    initializeApp({ commit, dispatch }) {
      // 앱 초기화 로직
      dispatch('auth/loadUser');
      commit('SET_INITIALIZED', true);
    }
  },
  
  // 루트 게터
  getters: {
    appVersion: state => state.appVersion,
    appName: state => state.appName,
    isInitialized: state => state.isInitialized
  }
});

// 이전 버전과의 호환성을 위해 gameStore 내보내기
export { gameStore };
