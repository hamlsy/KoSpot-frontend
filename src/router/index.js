import Vue from 'vue';
import VueRouter from 'vue-router';

import MainPage from '@/components/main/MainPage.vue';
import HomePage from '@/components/main/HomePage.vue';
import RoadViewModeMain from '@/components/game/roadViewMode/RoadViewModeMain.vue';
import PhotoModeMain from '@/components/game/photoMode/PhotoModeMain.vue';
import PhotoModePage from '@/components/game/photoMode/PhotoModeMainPage.vue';
import PhotoPlayGame from '@/components/game/photoMode/gameplay/PhotoModeGameplay.vue';
import RoadViewPractice from '@/components/game/roadViewMode/RoadViewPractice.vue';
import TempPage from '@/components/dummy/TempPage.vue';
import TestMapPage from '@/components/dummy/TestMapPage.vue';
import CoordData from '@/components/dummy/coordData.vue';
import KakaoMapTest from '@/components/dummy/KakaoMapTest.vue';
import EncryptTest from '@/components/dummy/EncryptTest.vue';
import MultiplayerLobby from '@/components/game/multiplayerMode/lobby/MultiplayerLobbyMain.vue';
import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import UserManagement from '@/components/admin/UserManagement.vue';
import ShopMain from '@/components/user/shop/ShopMain.vue';
import InventoryMain from '@/components/user/inventory/InventoryMain.vue';
import MyProfile from '@/components/user/mypage/MyProfile.vue';
import FriendsList from '@/components/user/mypage/FriendsList.vue';
import AccountSettings from '@/components/user/mypage/AccountSettings.vue';
import RoadViewRank from '@/components/game/roadViewMode/RoadViewRank.vue';
import MultiplayerRoadViewGame from '@/components/game/multiplayerMode/gameplay/roadview/MultiplayerRoadViewGame.vue';
import MainPage2 from '@/components/main/MainPage.vue';

Vue.use(VueRouter);

const routes = [
    // Main routes
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
    
    // Road View Mode routes
    {
        path: '/roadViewModeMain',
        name: "RoadViewModeMain",
        component: RoadViewModeMain
    },
    { 
        path:'/roadViewPractice',
        name: "RoadViewPractice",
        component: RoadViewPractice
    },
    {
        path: '/roadViewRank',
        name: "RoadViewRank",
        component: RoadViewRank
    },
    
    // Photo Mode routes
    {
        path: '/photoModeMain',
        name: "PhotoModeMain",
        component: PhotoModeMain
    },
    {
        path: '/photoModePage',
        name: "PhotoModePage",
        component: PhotoModePage
    },
    {
        path: '/photoPlayGame',
        name: "PhotoPlayGame",
        component: PhotoPlayGame,
        props: route => ({
            mode: route.query.mode || 'practice',
            region: route.query.region || null,
            theme: route.query.theme || null,
            totalRounds: Number(route.query.totalRounds) || 5
        })
    },
    
    // Multiplayer routes
    {
        path: '/multiplayerLobby',
        name: "MultiplayerLobby",
        component: MultiplayerLobby
    },
    {
        path: '/gameRoom/:roomId',
        name: "GameRoomWaiting",
        component: () => import('@/components/game/multiplayerMode/room/waiting/MultiplayerRoomWaiting.vue'),
        props: true
    },
    {
        path: '/game/roadview/:roomId',
        name: "RoadViewGame",
        component: MultiplayerRoadViewGame,
        props: true
    },
    {
        path: '/game/photo/:roomId',
        name: "PhotoGame",
        component: () => import('@/components/game/multiplayerMode/gameplay/photo/MultiplayerPhotoGame.vue'),
        props: true
    },
    {
        path: '/testTeamGame',
        name: "TestTeamGame",
        component: () => import('@/components/game/multiplayerMode/gameplay/roadview/MultiplayerRoadViewGame.vue'),
        props: { roomId: 'team-test-123', isTeamMode: true }
    },
    {
        path: '/testIndividualGame',
        name: "TestIndividualGame",
        component: () => import('@/components/game/multiplayerMode/gameplay/roadview/MultiplayerRoadViewGame.vue'),
        props: { roomId: 'individual-test-123', isTeamMode: false }
    },
    {
        path: '/team-mode',
        name: 'TeamModeGame',
        component: () => import('@/components/game/multiplayerMode/gameplay/roadview/MultiplayerRoadViewGame.vue'),
        props: { isTeamMode: true }
    },
    
    // User routes
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
        redirect: '/tempPage'
    },
    {
        path: '/myPoints',
        redirect: '/myProfile'
    },
    
    // Admin routes
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
    {
        path: '/mainPage2',
        name: "MainPage2",
        component: MainPage2
    },
    
    // Test/Development routes
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
    }
]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

export default router;