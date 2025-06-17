import MainView from 'src/features/main/views/MainView.vue'
import LoginView from '@/features/auth/views/LoginView.vue'

const mainRoutes = [
    {
        path:'/',
        redirect: "/main",
    },
    {
        path:'/main',
        name: "MainView",
        component: MainView
    },
    {
        path: '/loginPage',
        name: "loginPage",
        component: LoginView
    }
];

export default mainRoutes;
