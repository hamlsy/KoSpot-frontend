import PhotoModeMain from '@/components/game/photoMode/PhotoModeMain.vue';
import PhotoModePractice from '@/components/game/photoMode/views/PhotoModePractice.vue';
import PhotoModeRank from '@/components/game/photoMode/views/PhotoModeRank.vue';

const photoModeRoutes = [
    {
        path: '/photoModeMain',
        name: "PhotoModeMain",
        component: PhotoModeMain
    },
    {
        path: '/photoModePractice',
        name: "PhotoModePractice",
        component: PhotoModePractice,
        props: route => ({
            mode: route.query.mode || 'practice',
            region: route.query.region || null,
            theme: route.query.theme || null,
            totalRounds: Number(route.query.totalRounds) || 5
        })
    },
    
    {
        path: '/photoModeRank',
        name: "PhotoModeRank",
        component: PhotoModeRank,
        props: route => ({
            mode: 'rank',
            region: route.query.region || null,
            theme: route.query.theme || null,
            totalRounds: Number(route.query.totalRounds) || 5
        })
    }
];

export default photoModeRoutes;
