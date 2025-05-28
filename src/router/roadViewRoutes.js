import RoadViewModeMain from '@/views/Game/RoadViewMode/RoadViewModeMain.vue'
import RoadViewPractice from '@/views/Game/RoadViewMode/RoadViewPractice.vue'
import RoadViewRank from '@/views/Game/RoadViewMode/RoadViewRank.vue'

const roadViewRoutes = [
    {
        path: '/roadViewModeMain',
        name: "RoadViewModeMain",
        component: RoadViewModeMain
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
