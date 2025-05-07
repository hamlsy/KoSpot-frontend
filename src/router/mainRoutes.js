import MainPage from '@/components/main/MainPage.vue';
import HomePage from '@/components/main/HomePage.vue';

const mainRoutes = [
    {
        path:'/',
        redirect: "/homePage",
    },
    {
        path:'/mainPage',
        name: "MainPage",
        component: MainPage
    },
    {
        path: '/homePage',
        name: "HomePage",
        component: HomePage
    }
];

export default mainRoutes;
