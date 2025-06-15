import PhotoModeView from '@/features/game/single/main/views/PhotoMainView.vue'
import PhotoModePractice from '@/features/game/single/photo/views/PracticeView.vue'
import PhotoModeRank from '@/features/game/single/photo/views/RankView.vue'

const photoModeRoutes = [
    {
        path: '/photo/main',
        name: "PhotoModeView",
        component: PhotoModeView
    },
    {
        path: '/photo/practice',
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
