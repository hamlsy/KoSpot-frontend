import { createRouter, createWebHistory } from 'vue-router';

// Import route modules
import homeRoutes from './modules/home.routes';
import gameRoutes from './modules/game.routes';
import userRoutes from './modules/user.routes';
import adminRoutes from './modules/admin.routes';
import devRoutes from './devRoutes';

// Combine all routes
const routes = [
  ...homeRoutes,
  ...gameRoutes,
  ...userRoutes,
  ...adminRoutes,
  ...devRoutes
];

// Vue 3에서는 createRouter 함수를 사용하여 라우터를 생성합니다.
const router = createRouter({
  // history 모드는 createWebHistory로 변경되었습니다.
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 };
  }
});

export default router;