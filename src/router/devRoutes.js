import tempPage from '@/dummy/TempPage.vue'
import CoordData from '@/dummy/coordData.vue'
import kakaoMapTest from '@/dummy/KakaoMapTest.vue'
import EncryptTest from 'src/dummy/EncryptTest.vue'
import ComponentTest from 'src/dummy/ComponentTest.vue'
import TempLoginView from '@/features/auth/views/TempLoginView.vue'
import SoloGameView from '@/features/game/multiplayer/roadview/views/SoloGameView.vue'
import RoomView from '@/features/game/multiplayer/room/views/RoomView.vue'
import DevTestPage from '@/dummy/DevTestPage.vue'
import ResultOverlay from '@/features/game/single/roadview/components/Result/ResultOverlay.vue'

const devRoutes = [
    // {
    //     path: '/dev/test',
    //     name: "DevTestPage",
    //     component: DevTestPage,
    //     meta: {
    //         title: '개발자 테스트 페이지'
    //     }
    // },
    // {
    //     path: '/tempPage',
    //     name: "TempPage",
    //     component: tempPage
    // },
    // {
    //     path: '/coordData',
    //     name: "CoordData",
    //     component: CoordData
    // },
    // {
    //     path: '/kakaoMapTest',
    //     name: "KakaoMapTest",
    //     component: kakaoMapTest
    // },
    // {
    //     path: '/encryptTest',
    //     name: "EncryptTest",
    //     component: EncryptTest
    // },
    // {
    //     path: '/componentTest',
    //     name: "ComponentTest",
    //     component: ComponentTest
    // },
    // {
    //     path: '/temp-login',
    //     name: "TempLogin",
    //     component: TempLoginView
    // },
    // {
    //     path: '/test/roadview-solo',
    //     name: "TestRoadviewSolo",
    //     component: SoloGameView,
    //     meta: {
    //         title: '로드뷰 개인전 테스트'
    //     }
    // },
    // {
    //     path: '/test/room-start',
    //     name: "TestRoomStartCountdown",
    //     component: RoomView,
    //     props: {
    //         roomId: 'dev-room-start'
    //     },
    //     meta: {
    //         title: '멀티플레이어 방 시작 테스트'
    //     }
    // },
    {
        path: '/devRoute',
        name: "DevRoundTest",
        component: ResultOverlay,
        props: {
            show: true,
            score: 87.5,
            distance: 0.83,
            currentRankPoints: 1200,
            rankPointChange: 24,
            previousRankTier: 'SILVER',
            previousRankLevel: 'ONE',
            currentRankTier: 'GOLD',
            currentRankLevel: 'TWO',
            poiName: '서울특별시 마포구 어디',
            fullAddress: '서울 마포구 ...',
            userNickname: '테스트유저',
            currentLocation: { lat: 37.55, lng: 126.98 },
            guessedLocation: { lat: 37.57, lng: 126.99 },
            locationDescription: '테스트 좌표',
            markerImageUrl: null,
          },
    }
];

export default devRoutes;
