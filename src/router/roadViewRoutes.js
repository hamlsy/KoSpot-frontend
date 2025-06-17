import RoadViewModeView from '@/features/game/single/main/views/RoadViewMainView.vue'
import RoadViewPractice from '@/features/game/single/roadview/views/PracticeView.vue'
import RoadViewRank from '@/features/game/single/roadview/views/RankView.vue'

const roadViewRoutes = [
    {
        path: '/roadView/main',
        name: "RoadViewModeView",
        component: RoadViewModeView
    },
    { 
        path:'/roadView/practice',
        name: "RoadViewPractice",
        component: RoadViewPractice
    },
    {
        path: '/roadView/rank',
        name: "RoadViewRank",
        component: RoadViewRank
    }
];

export default roadViewRoutes;
