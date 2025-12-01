/**
 * Alternative (BOLD) Design Routes
 * 
 * These routes provide an alternative BOLD design system
 * that can be compared with the main design.
 */

export default [
  // Comparison Index Page
  {
    path: '/alt',
    name: 'AltIndex',
    component: () => import('@/features/alternative/views/AltIndexView.vue'),
    meta: {
      title: 'Design Comparison'
    }
  },

  // Main View
  {
    path: '/alt/main',
    name: 'AltMainView',
    component: () => import('@/features/alternative/views/AltMainView.vue'),
    meta: {
      title: 'KoSpot - Alternative Main'
    }
  },

  // RoadView Main
  {
    path: '/alt/roadview',
    name: 'AltRoadViewMainView',
    component: () => import('@/features/alternative/views/AltRoadViewMainView.vue'),
    meta: {
      title: 'RoadView - Alternative',
      requiresAuth: true
    }
  },

  // Multiplayer Lobby
  {
    path: '/alt/lobby',
    name: 'AltLobbyView',
    component: () => import('@/features/alternative/views/AltLobbyView.vue'),
    meta: {
      title: 'Multiplayer Lobby - Alternative',
      requiresAuth: true
    }
  },

  // Multiplayer Room
  {
    path: '/alt/room/:id',
    name: 'AltRoomView',
    component: () => import('@/features/alternative/views/AltRoomView.vue'),
    meta: {
      title: 'Game Room - Alternative',
      requiresAuth: true
    }
  },

  // Profile
  {
    path: '/alt/profile',
    name: 'AltProfileView',
    component: () => import('@/features/alternative/views/AltProfileView.vue'),
    meta: {
      title: 'Profile - Alternative',
      requiresAuth: true
    }
  }
];

