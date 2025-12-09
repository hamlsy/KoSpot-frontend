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
import DesignTestView from '@/features/game/multiplayer/roadview/views/DesignTestView.vue'
import RoomCardDesignTest from '@/features/game/multiplayer/lobby/views/RoomCardDesignTest.vue'
import HUDDesignTest from '@/features/game/multiplayer/views/HUDDesignTest.vue'
import LobbyViewHUD from '@/features/game/multiplayer/lobby/views/LobbyViewHUD.vue'
import RoomViewHUD from '@/features/game/multiplayer/room/views/RoomViewHUD.vue'
import DesignFTest from '@/features/game/multiplayer/views/DesignFTest.vue'
import LobbyViewDesignF from '@/features/game/multiplayer/lobby/views/LobbyViewDesignF.vue'
import RoomViewDesignF from '@/features/game/multiplayer/room/views/RoomViewDesignF.vue'
import ComponentDesignTest from '@/features/game/multiplayer/views/ComponentDesignTest.vue'

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
        path: '/room-card-test',
        name: "RoomCardDesignTest",
        component: RoomCardDesignTest,
        meta: {
            title: '방 카드 디자인 테스트'
        }
    },
    {
        path: '/hud-design-test',
        name: "HUDDesignTest",
        component: HUDDesignTest,
        meta: {
            title: 'HUD 디자인 테스트'
        }
    },
    {
        path: '/hud-lobby',
        name: "LobbyViewHUD",
        component: LobbyViewHUD,
        meta: {
            title: 'HUD 로비'
        }
    },
    {
        path: '/hud-room',
        name: "RoomViewHUD",
        component: RoomViewHUD,
        meta: {
            title: 'HUD 대기실'
        }
    },
    {
        path: '/design-f-test',
        name: "DesignFTest",
        component: DesignFTest,
        meta: {
            title: 'Design F 테스트'
        }
    },
    {
        path: '/design-f-lobby',
        name: "LobbyViewDesignF",
        component: LobbyViewDesignF,
        meta: {
            title: 'Design F 로비'
        }
    },
    {
        path: '/design-f-room',
        name: "RoomViewDesignF",
        component: RoomViewDesignF,
        meta: {
            title: 'Design F 대기실'
        }
    },
    {
        path: '/component-design-test',
        name: "ComponentDesignTest",
        component: ComponentDesignTest,
        meta: {
            title: '컴포넌트 디자인 테스트'
        }
    },
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
