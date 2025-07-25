import { createRouter, createWebHistory } from 'vue-router';

// Import route modules
import mainRoutes from './mainRoutes.js';
import multiplayerRoutes from './multiplayerRoutes.js';
import photoModeRoutes from './photoRoutes.js';
import roadViewRoutes from './roadViewRoutes.js';
import userRoutes from './userRoutes.js';
import devRoutes from './devRoutes.js';
import adminRoutes from './adminRoutes.js';

// Combine all routes
const routes = [
  ...mainRoutes,
  ...photoModeRoutes,
  ...roadViewRoutes,
  ...multiplayerRoutes,
  ...userRoutes,
  ...adminRoutes,
  ...devRoutes
];

const router = createRouter({
  history: createWebHistory(process.env.VUE_APP_BASE_URL),
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 };
  }
});

const requireComponent = require.context('./', true, /index\.vue$/)
const components = {}

requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)
  const componentName = fileName.split('/')[1]
  components[componentName] = componentConfig.default || componentConfig
})

export default router;