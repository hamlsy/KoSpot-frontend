import RoadViewModeView from '@/features/game/single/main/views/RoadViewMainView.vue'
import RoadViewPractice from '@/features/game/single/roadview/views/PracticeView.vue'
import RoadViewRank from '@/features/game/single/roadview/views/RankView.vue'

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
