import tempPage from '@/dummy/TempPage.vue'
import CoordData from '@/dummy/coordData.vue'
import kakaoMapTest from '@/dummy/KakaoMapTest.vue'
import EncryptTest from 'src/dummy/EncryptTest.vue'
// import ComponentTest from 'src/dummy/ComponentTest.vue'
import TempLoginView from '@/features/auth/views/TempLoginView.vue'
import SoloGameView from '@/features/game/multiplayer/roadview/views/SoloGameView.vue'
import RoomView from '@/features/game/multiplayer/room/views/RoomView.vue'
import DevTestPage from '@/dummy/DevTestPage.vue'
import ResultOverlay from '@/features/game/single/roadview/components/Result/ResultOverlay.vue'
import DesignTestView from '@/features/game/multiplayer/roadview/views/DesignTestView.vue'


const devRoutes = [
    {
        path: '/design-test',
        name: "DesignTestView",
        component: DesignTestView,
        meta: {
            title: 'RoundResults 디자인 테스트'
        }
    },

    {
        path: '/temp-login',
        name: "TempLogin",
        component: TempLoginView
    },

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
    },
];

export default devRoutes;
