import TempPage from '@/components/dummy/TempPage.vue';
import TestMapPage from '@/components/dummy/TestMapPage.vue';
import CoordData from '@/components/dummy/coordData.vue';
import KakaoMapTest from '@/components/dummy/KakaoMapTest.vue';
import EncryptTest from '@/components/dummy/EncryptTest.vue';

const devRoutes = [
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
];

export default devRoutes;
