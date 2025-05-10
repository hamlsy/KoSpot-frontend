import MainPage from '@/components/main/MainPage.vue';
import LoginPage from '@/components/main/LoginPage.vue';

const mainRoutes = [
    {
        path:'/',
        redirect: "/loginPage",
    },
    {
        path:'/mainPage',
        name: "MainPage",
        component: MainPage
    },
    {
        path: '/loginPage',
        name: "loginPage",
        component: LoginPage
    }
];

export default mainRoutes;
