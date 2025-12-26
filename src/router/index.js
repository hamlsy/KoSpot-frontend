import { createRouter, createWebHistory } from 'vue-router';

// Import route modules
import mainRoutes from './mainRoutes.js';
import multiplayerRoutes from './multiplayerRoutes.js';
import photoModeRoutes from './photoRoutes.js';
import roadViewRoutes from './roadViewRoutes.js';
import userRoutes from './userRoutes.js';
import devRoutes from './devRoutes.js';
import adminRoutes from './adminRoutes.js';
import noticeRoutes from './noticeRoutes.js';
import shopRoutes from './shopRoutes.js';

// 봇 여부 확인 헬퍼 함수
const isBot = () => {
  return localStorage.getItem('isBot') === 'true'
}

// 로그인 여부 확인 헬퍼 함수
const isAuthenticated = () => {
  // 봇인 경우 항상 true
  if (isBot()) {
    return true
  }
  // 일반 사용자는 accessToken 확인
  return !!localStorage.getItem('accessToken')
}

// Combine all routes
const routes = [
  ...mainRoutes,
  ...photoModeRoutes,
  ...roadViewRoutes,
  ...multiplayerRoutes,
  ...userRoutes,
  ...adminRoutes,
  ...devRoutes,
  ...noticeRoutes,
  ...shopRoutes,

];

const router = createRouter({
  history: createWebHistory(process.env.VUE_APP_BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 브라우저 뒤로가기/앞으로가기 시에만 저장된 스크롤 위치 복원
    if (savedPosition) {
      return savedPosition;
    }
    // router.push로 이동하는 경우 항상 상단으로 스크롤
    // Promise를 반환하여 DOM이 완전히 렌더링된 후 스크롤 이동
    return new Promise((resolve) => {
      // 다음 틱에서 스크롤 이동 (DOM 렌더링 완료 후)
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        resolve({ top: 0, left: 0 });
      }, 0);
    });
  }
});

// 라우터 가드: 로그인이 필요한 페이지 보호
router.beforeEach((to, from, next) => {
  // 봇인 경우 모든 페이지 접근 허용
  if (isBot()) {
    next()
    return
  }

  // meta.requiresAuth가 true인 경우 로그인 필요
  if (to.meta?.requiresAuth) {
    if (isAuthenticated()) {
      next()
    } else {
      // 로그인 페이지로 리다이렉션
      next({
        path: '/loginPage',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    next()
  }
})

const requireComponent = require.context('./', true, /index\.vue$/)
const components = {}

requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)
  const componentName = fileName.split('/')[1]
  components[componentName] = componentConfig.default || componentConfig
})

export default router;