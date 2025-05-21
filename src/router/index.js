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

export default router;