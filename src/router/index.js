import Vue from 'vue';
import VueRouter from 'vue-router';

// Import route modules
import homeRoutes from './modules/home.routes';
import gameRoutes from './modules/game.routes';
import userRoutes from './modules/user.routes';
import adminRoutes from './modules/admin.routes';
import devRoutes from './devRoutes';

Vue.use(VueRouter);

// Combine all routes
const routes = [
  ...homeRoutes,
  ...gameRoutes,
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