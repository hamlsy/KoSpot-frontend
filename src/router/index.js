import Vue from 'vue';
import VueRouter from 'vue-router';
import TempPage from '@/components/TempPage.vue';
import RoadViewModeMain from '@/components/roadViewMode/RoadViewModeMain.vue';
import PhotoModeMain from '@/components/photoMode/PhotoModeMain.vue';
import HomePage from '@/components/HomePage.vue';
import MainPage from '@/components/MainPage.vue';
import RoadViewPractice from '@/components/roadViewMode/RoadViewPractice.vue';
import TestMapPage from '@/components/TestMapPage.vue';
import MyInfoPage from '@/components/MyInfoPage.vue';
import CoordData from '@/components/dummy/coordData.vue';
import KakaoMapTest from '@/components/dummy/KakaoMapTest.vue';
import EncryptTest from '@/components/dummy/EncryptTest.vue';
import MultiplayerLobby from '@/components/multiplayerMode/MultiplayerLobby.vue';
import MultiplayerGame from '@/components/multiplayerMode/MultiplayerGame.vue';
import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import UserManagement from '@/components/admin/UserManagement.vue';


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
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

export default router;