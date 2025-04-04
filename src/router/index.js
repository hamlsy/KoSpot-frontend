import Vue from 'vue';
import VueRouter from 'vue-router';

import MainPage from '@/components/main/MainPage.vue';
import HomePage from '@/components/main/HomePage.vue';
import RoadViewModeMain from '@/components/game/roadViewMode/RoadViewModeMain.vue';
import PhotoModeMain from '@/components/game/photoMode/PhotoModeMain.vue';
import RoadViewPractice from '@/components/game/roadViewMode/RoadViewPractice.vue';
import MyInfoPage from '@/components/MyInfoPage.vue';
import TempPage from '@/components/dummy/TempPage.vue';
import TestMapPage from '@/components/dummy/TestMapPage.vue';
import CoordData from '@/components/dummy/coordData.vue';
import KakaoMapTest from '@/components/dummy/KakaoMapTest.vue';
import EncryptTest from '@/components/dummy/EncryptTest.vue';
import MultiplayerLobby from '@/components/game/multiplayerMode/MultiplayerLobby.vue';
import MultiplayerGame from '@/components/game/multiplayerMode/MultiplayerGame.vue';
import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import UserManagement from '@/components/admin/UserManagement.vue';
import ShopMain from '@/components/user/shop/ShopMain.vue';
import InventoryMain from '@/components/user/inventory/InventoryMain.vue';
import MyProfile from '@/components/user/mypage/MyProfile.vue';
import FriendsList from '@/components/user/mypage/FriendsList.vue';
import AccountSettings from '@/components/user/mypage/AccountSettings.vue';


Vue.use(VueRouter);

const routes = [
    {
        path:'/',
        redirect: "/homePage",
    },
    {
        path:'/mainPage',
        name: "MainPage",
        component: MainPage
    },
    {
        path: '/homePage',
        name: "HomePage",
        component: HomePage
    },
    {
        path: '/roadViewModeMain',
        name: "RoadViewModeMain",
        component: RoadViewModeMain
    },
    {
        path: '/photoModeMain',
        name: "PhotoModeMain",
        component: PhotoModeMain
    },
    {
        path:'/roadViewPractice',
        name: "RoadViewPractice",
        component: RoadViewPractice
    },
    {
        path: '/myInfoPage',
        name: "MyInfoPage",
        component: MyInfoPage
    },
    {
        path: '/tempPage',
        name: "TempPage",
        component: TempPage
    },
    {
        path: '/testMapPage',
        name: "TestMapPage",
        component: TestMapPage
    },
    {
        path: '/coordData',
        name: "CoordData",
        component: CoordData
    },
    {
        path: '/kakaoMapTest',
        name: "KakaoMapTest",
        component: KakaoMapTest
    },
    {
        path: '/encryptTest',
        name: "EncryptTest",
        component: EncryptTest
    },
    {
        path: '/multiplayerLobby',
        name: "MultiplayerLobby",
        component: MultiplayerLobby
    },
    {
        path: '/multiplayerGame/:roomId',
        name: "MultiplayerGame",
        component: MultiplayerGame,
        props: true
    },
    {
        path: '/admin',
        name: "AdminDashboard",
        component: AdminDashboard
    },
    {
        path: '/admin/users',
        name: "UserManagement",
        component: UserManagement
    },
    // 추가 라우트
    {
        path: '/shopMain',
        name: "ShopMain",
        component: ShopMain
    },
    {
        path: '/inventory',
        name: "InventoryMain",
        component: InventoryMain
    },
    {
        path: '/myProfile',
        name: "MyProfile",
        component: MyProfile
    },
    {
        path: '/friendsList',
        name: "FriendsList",
        component: FriendsList
    },
    {
        path: '/accountSettings',
        name: "AccountSettings",
        component: AccountSettings
    },
    {
        path: '/noticeList',
        redirect: '/tempPage' // 임시 리디렉션, 공지사항 컴포넌트 개발 후 수정 필요
    },
    {
        path: '/myPoints',
        redirect: '/myProfile' // 임시 리디렉션, 포인트 관리 페이지는 마이프로필로 연결
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

export default router;