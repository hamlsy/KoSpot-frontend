import tempPage from '@/dummy/TempPage.vue'
import testMapPage from '@/dummy/TestMapPage.vue'
import CoordData from '@/dummy/coordData.vue'
import kakaoMapTest from '@/dummy/KakaoMapTest.vue'
import EncryptTest from 'src/dummy/EncryptTest.vue'

const devRoutes = [
    {
        path: '/tempPage',
        name: "TempPage",
        component: tempPage
    },
    {
        path: '/testMapPage',
        name: "TestMapPage",
        component: testMapPage
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
    }
];

export default devRoutes;
