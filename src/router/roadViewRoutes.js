import RoadViewModeMain from '@/components/game/roadViewMode/RoadViewModeMain.vue';
import RoadViewPractice from '@/components/game/roadViewMode/RoadViewPractice.vue';
import RoadViewRank from '@/components/game/roadViewMode/RoadViewRank.vue';

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
