import tempPage from '@/dummy/TempPage.vue'
import CoordData from '@/dummy/coordData.vue'
import kakaoMapTest from '@/dummy/KakaoMapTest.vue'
import EncryptTest from 'src/dummy/EncryptTest.vue'
import ComponentTest from 'src/dummy/ComponentTest.vue'

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
    }
];

export default devRoutes;
