import Vue from 'vue';
import VueRouter from 'vue-router';

// Import route modules
import mainRoutes from './mainRoutes';
import roadViewRoutes from './roadViewRoutes';
import photoModeRoutes from './photoModeRoutes';
import multiplayerRoutes from './multiplayerRoutes';
import userRoutes from './userRoutes';
import adminRoutes from './adminRoutes';
import devRoutes from './devRoutes';

Vue.use(VueRouter);

// Combine all routes
const routes = [
  ...mainRoutes,
  ...roadViewRoutes,
  ...photoModeRoutes,
  ...multiplayerRoutes,
  ...userRoutes,
  ...adminRoutes,
  ...devRoutes
];

const router = new VueRouter({ // eslint-disable-line no-unused-vars
  mode: 'history',
  base: process.env.BASE_URL,
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