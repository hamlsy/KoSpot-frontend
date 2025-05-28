import Home from '@/views/Home/Home.vue'
import Login from '@/views/Home/Login.vue'

const mainRoutes = [
    {
        path:'/',
        redirect: "/home",
    },
    {
        path:'/home',
        name: "Home",
        component: Home
    },
    {
        path: '/loginPage',
        name: "loginPage",
        component: Login
    }
];

export default mainRoutes;
