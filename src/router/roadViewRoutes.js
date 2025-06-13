import RoadViewModeView from '@/features/game/single/main/views/RoadViewModeView.vue'
import RoadViewPractice from '@/features/game/single/roadview/views/RoadViewPractice.vue'
import RoadViewRank from '@/features/game/single/roadview/views/RoadViewRank.vue'

const roadViewRoutes = [
    {
        path: '/roadViewModeView',
        name: "RoadViewModeView",
        component: RoadViewModeView
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
    }
];

export default roadViewRoutes;
