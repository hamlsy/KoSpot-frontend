import RoadViewModeView from '@/views/Game/RoadViewMode/RoadViewModeView.vue'
import RoadViewPractice from '@/views/Game/RoadViewMode/RoadViewPractice.vue'
import RoadViewRank from '@/views/Game/RoadViewMode/RoadViewRank.vue'

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
