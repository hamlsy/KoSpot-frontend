/**
 * 게임 관련 라우트 설정
 */

// 포토 모드 라우트
const photoModeRoutes = [
  {
    path: '/photoModeMain',
    name: "PhotoModeMain",
    component: () => import('@/components/game/photoMode/PhotoModeMain.vue')
  },
  {
    path: '/photoModePractice',
    name: "PhotoModePractice",
    component: () => import('@/views/Game/PhotoMode/PhotoModePractice.vue'),
    props: route => ({
      mode: route.query.mode || 'practice',
      region: route.query.region || null,
      theme: route.query.theme || null,
      totalRounds: Number(route.query.totalRounds) || 5
    })
  },
  {
    path: '/photoModeRank',
    name: "PhotoModeRank",
    component: () => import('@/views/Game/PhotoMode/PhotoModeRank.vue'),
    props: route => ({
      mode: 'rank',
      region: route.query.region || null,
      theme: route.query.theme || null,
      totalRounds: Number(route.query.totalRounds) || 5
    })
  }
];

// 로드뷰 모드 라우트
const roadViewRoutes = [
  {
    path: '/roadViewModeMain',
    name: "RoadViewModeMain",
    component: () => import('@/views/Game/RoadViewMode/RoadViewModeMain.vue')
  },
  {
    path: '/roadViewPractice',
    name: "RoadViewPractice",
    component: () => import('@/views/Game/RoadViewMode/RoadViewPractice.vue'),
    props: route => ({
      mode: route.query.mode || 'practice',
      region: route.query.region || null,
      theme: route.query.theme || null,
      totalRounds: Number(route.query.totalRounds) || 5
    })
  },
  {
    path: '/roadViewRank',
    name: "RoadViewRank",
    component: () => import('@/views/Game/RoadViewMode/RoadViewRank.vue'),
    props: route => ({
      mode: 'rank',
      region: route.query.region || null,
      theme: route.query.theme || null,
      totalRounds: Number(route.query.totalRounds) || 5
    })
  }
];

// 멀티플레이어 모드 라우트
const multiplayerRoutes = [
  {
    path: '/multiplayerLobby',
    name: "MultiplayerLobby",
    component: () => import('@/views/Game/MultiplayerMode/MultiplayerLobby.vue')
  },
  {
    path: '/multiplayerGame/:roomId',
    name: "MultiplayerGame",
    component: () => import('@/views/Game/MultiplayerMode/MultiplayerGame.vue'),
    props: true
  }
];

// 모든 게임 라우트 통합
export default [
  ...photoModeRoutes,
  ...roadViewRoutes,
  ...multiplayerRoutes
];
