// src/stores/ui.js
import { defineStore } from 'pinia';

// UI 스토어 정의 (Vuex ui 모듈에 해당)
export const useUiStore = defineStore('ui', {
  // 상태 (Vuex state)
  state: () => ({
    isSidebarOpen: false,
    isModalOpen: false,
    activeModal: null,
    modalData: null,
    notifications: [],
    theme: localStorage.getItem('theme') || 'light',
    isMobile: window.innerWidth < 768
  }),
  
  // 액션 (Vuex actions + mutations)
  actions: {
    // 사이드바 토글
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    
    // 사이드바 상태 설정
    setSidebar(isOpen) {
      this.isSidebarOpen = isOpen;
    },
    
    // 사이드바 열기
    openSidebar() {
      this.isSidebarOpen = true;
    },
    
    // 사이드바 닫기
    closeSidebar() {
      this.isSidebarOpen = false;
    },
    
    // 모달 열기
    openModal({ name, data = null }) {
      this.isModalOpen = true;
      this.activeModal = name;
      this.modalData = data;
    },
    
    // 모달 닫기
    closeModal() {
      this.isModalOpen = false;
      this.activeModal = null;
      this.modalData = null;
    },
    
    // 알림 추가
    addNotification(notification) {
      this.notifications.push({
        id: `notification-${Date.now()}`,
        timestamp: new Date(),
        read: false,
        ...notification
      });
    },
    
    // 알림 읽음 처리
    markNotificationRead(notificationId) {
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        this.notifications[index].read = true;
      }
    },
    
    // 모든 알림 읽음 처리
    markAllNotificationsRead() {
      this.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    // 알림 삭제
    removeNotification(notificationId) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
    },
    
    // 테마 설정
    setTheme(theme) {
      this.theme = theme;
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    },
    
    // 테마 토글
    toggleTheme() {
      const newTheme = this.theme === 'light' ? 'dark' : 'light';
      this.setTheme(newTheme);
    },
    
    // 화면 크기 변경 감지
    handleResize() {
      this.isMobile = window.innerWidth < 768;
    }
  },
  
  // 게터 (Vuex getters)
  getters: {
    // 알림 관련
    unreadNotifications: (state) => state.notifications.filter(n => !n.read),
    unreadNotificationCount: (state) => state.notifications.filter(n => !n.read).length,
    
    // 테마 관련
    isDarkTheme: (state) => state.theme === 'dark'
  }
});
