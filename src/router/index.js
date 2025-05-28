import { createRouter, createWebHistory } from 'vue-router';

// Import route modules
import mainRoutes from 'src/router/mainRoutes.js'
import multiplayerRoutes from 'src/router/multiplayerRoutes.js'
import photoModeRoutes from 'src/router/photoModeRoutes.js'
import roadViewRoutes from 'src/router/roadViewRoutes.js'
import userRoutes from 'src/router/userRoutes.js'
import devRoutes from 'src/router/devRoutes.js'
import adminRoutes from 'src/router/adminRoutes.js'

// Combine all routes
const routes = [
  ...mainRoutes,
  ...photoModeRoutes,
  ...roadViewRoutes,
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

//컴포넌트 자동 등록
const requireComponent = require.context('./', true, /index\.vue$/)
const components = {}

requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)
  const componentName = fileName.split('/')[1]
  components[componentName] = componentConfig.default || componentConfig
})

export default router;