/**
 * 사용자 관련 라우트 설정
 */

export default [
  {
    path: '/shopMain',
    name: "ShopMain",
    component: () => import('@/views/User/Shop.vue')
  },
  {
    path: '/inventory',
    name: "InventoryMain",
    component: () => import('@/views/User/Inventory.vue')
  },
  {
    path: '/myProfile',
    name: "MyProfile",
    component: () => import('@/views/User/Profile.vue')
  },
  {
    path: '/friendsList',
    name: "FriendsList",
    component: () => import('@/components/user/mypage/FriendsList.vue')
  },
  {
    path: '/accountSettings',
    name: "AccountSettings",
    component: () => import('@/components/user/mypage/AccountSettings.vue')
  },
  {
    path: '/noticeList',
    redirect: '/tempPage'
  },
  {
    path: '/myPoints',
    redirect: '/myProfile'
  }
];
