import Vue from 'vue';
import VueRouter from 'vue-router';
import MainPage from "@/components/MainPage.vue";
import ModeSelect from '@/components/ModeSelect.vue';
import TempPage from '@/components/TempPage.vue';


Vue.use(VueRouter);

const routes = [
    {
        path:'/',
        redirect: "/mainPage",
    },
    {
        path:'/mainPage',
        name: "MainPage",
        component: MainPage
    },
    {
        path: '/modeSelect',
        name: "ModeSelect",
        component: ModeSelect
    },
    {
        path: '/tempPage',
        name: "TempPage",
        component: TempPage
    }

]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

export default router;