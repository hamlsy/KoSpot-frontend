import tempPage from '@/dummy/TempPage.vue'
import CoordData from '@/dummy/coordData.vue'
import kakaoMapTest from '@/dummy/KakaoMapTest.vue'
import EncryptTest from 'src/dummy/EncryptTest.vue'
import ComponentTest from 'src/dummy/ComponentTest.vue'
import TempLoginView from '@/features/auth/views/TempLoginView.vue'
import IndividualGameView from '@/features/game/multiplayer/roadview/views/IndividualGameView.vue'

const devRoutes = [
    {
        path: '/tempPage',
        name: "TempPage",
        component: tempPage
    },
    {
        path: '/coordData',
        name: "CoordData",
        component: CoordData
    },
    {
        path: '/kakaoMapTest',
        name: "KakaoMapTest",
        component: kakaoMapTest
    },
    {
        path: '/encryptTest',
        name: "EncryptTest",
        component: EncryptTest
    },
    {
        path: '/componentTest',
        name: "ComponentTest",
        component: ComponentTest
    },
    {
        path: '/temp-login',
        name: "TempLogin",
        component: TempLoginView
    },
    {
        path: '/test/roadview-individual',
        name: "TestRoadviewIndividual",
        component: IndividualGameView,
        meta: {
            title: '로드뷰 개인전 테스트'
        }
    }
];

export default devRoutes;
