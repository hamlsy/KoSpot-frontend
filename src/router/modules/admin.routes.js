/**
 * 관리자 관련 라우트 설정
 */

export default [
  {
    path: '/admin',
    name: "AdminDashboard",
    component: () => import('@/views/Admin/Dashboard.vue')
  },
  {
    path: '/admin/users',
    name: "UserManagement",
    component: () => import('@/views/Admin/UserManagement.vue')
  }
];
