// UI 상태 관리 스토어 모듈
export default {
  namespaced: true,
  
  state: () => ({
    isSidebarOpen: false,
    isModalOpen: false,
    activeModal: null,
    modalData: null,
    notifications: [],
    theme: localStorage.getItem('theme') || 'light',
    isMobile: window.innerWidth < 768
  }),
  
  mutations: {
    // 사이드바 토글
    TOGGLE_SIDEBAR(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    
    // 사이드바 상태 설정
    SET_SIDEBAR(state, isOpen) {
      state.isSidebarOpen = isOpen;
    },
    
    // 모달 열기
    OPEN_MODAL(state, { name, data = null }) {
      state.isModalOpen = true;
      state.activeModal = name;
      state.modalData = data;
    },
    
    // 모달 닫기
    CLOSE_MODAL(state) {
      state.isModalOpen = false;
      state.activeModal = null;
      state.modalData = null;
    },
    
    // 알림 추가
    ADD_NOTIFICATION(state, notification) {
      state.notifications.push({
        id: `notification-${Date.now()}`,
        timestamp: new Date(),
        read: false,
        ...notification
      });
    },
    
    // 알림 읽음 처리
    MARK_NOTIFICATION_READ(state, notificationId) {
      const index = state.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        state.notifications[index].read = true;
      }
    },
    
    // 모든 알림 읽음 처리
    MARK_ALL_NOTIFICATIONS_READ(state) {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    // 알림 삭제
    REMOVE_NOTIFICATION(state, notificationId) {
      state.notifications = state.notifications.filter(n => n.id !== notificationId);
    },
    
    // 테마 설정
    SET_THEME(state, theme) {
      state.theme = theme;
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    },
    
    // 모바일 상태 설정
    SET_MOBILE(state, isMobile) {
      state.isMobile = isMobile;
    }
  },
  
  actions: {
    // 사이드바 토글
    toggleSidebar({ commit }) {
      commit('TOGGLE_SIDEBAR');
    },
    
    // 사이드바 열기
    openSidebar({ commit }) {
      commit('SET_SIDEBAR', true);
    },
    
    // 사이드바 닫기
    closeSidebar({ commit }) {
      commit('SET_SIDEBAR', false);
    },
    
    // 모달 열기
    openModal({ commit }, { name, data = null }) {
      commit('OPEN_MODAL', { name, data });
    },
    
    // 모달 닫기
    closeModal({ commit }) {
      commit('CLOSE_MODAL');
    },
    
    // 알림 추가
    addNotification({ commit }, notification) {
      commit('ADD_NOTIFICATION', notification);
    },
    
    // 알림 읽음 처리
    markNotificationRead({ commit }, notificationId) {
      commit('MARK_NOTIFICATION_READ', notificationId);
    },
    
    // 모든 알림 읽음 처리
    markAllNotificationsRead({ commit }) {
      commit('MARK_ALL_NOTIFICATIONS_READ');
    },
    
    // 알림 삭제
    removeNotification({ commit }, notificationId) {
      commit('REMOVE_NOTIFICATION', notificationId);
    },
    
    // 테마 설정
    setTheme({ commit }, theme) {
      commit('SET_THEME', theme);
    },
    
    // 테마 토글
    toggleTheme({ commit, state }) {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      commit('SET_THEME', newTheme);
    },
    
    // 화면 크기 변경 감지
    handleResize({ commit }) {
      commit('SET_MOBILE', window.innerWidth < 768);
    }
  },
  
  getters: {
    // 사이드바 상태
    isSidebarOpen: state => state.isSidebarOpen,
    
    // 모달 상태
    isModalOpen: state => state.isModalOpen,
    activeModal: state => state.activeModal,
    modalData: state => state.modalData,
    
    // 알림 관련
    notifications: state => state.notifications,
    unreadNotifications: state => state.notifications.filter(n => !n.read),
    unreadNotificationCount: state => state.notifications.filter(n => !n.read).length,
    
    // 테마 관련
    currentTheme: state => state.theme,
    isDarkTheme: state => state.theme === 'dark',
    
    // 반응형 관련
    isMobile: state => state.isMobile
  }
};
