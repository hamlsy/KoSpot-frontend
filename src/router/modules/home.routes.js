/**
 * 홈 관련 라우트 설정
 */

export default [
  {
    path: '/',
    redirect: "/mainPage",
  },
  {
    path: '/mainPage',
    name: "MainPage",
    component: () => import('@/views/Home/Home.vue')
  },
  {
    path: '/loginPage',
    name: "loginPage",
    component: () => import('@/views/Home/Login.vue')
  }
];
