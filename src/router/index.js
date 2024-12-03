import Vue from 'vue';
import VueRouter from 'vue-router';
import MainPage from "@/components/MainPage.vue";
import ModeSelect from '@/components/ModeSelect.vue';

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
    }

]

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

export default router;