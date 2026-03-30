import MainView from 'src/features/main/views/MainView.vue'
import LoginView from '@/features/auth/views/LoginView.vue'
import OAuthCallbackView from '@/features/auth/views/OAuthCallbackView.vue'
import EmailSignupView from '@/features/auth/views/EmailSignupView.vue'

const mainRoutes = [
    {
        path: '/',
        redirect: "/main",
    },
    {
        path: '/main',
        name: "MainView",
        component: MainView
    },
    {
        path: '/loginPage',
        name: "loginPage",
        component: LoginView
    },
    {
        path: '/login/oauth2/callback',
        name: "OAuthCallback",
        component: OAuthCallbackView
    },
    {
        path: '/signup',
        name: "EmailSignup",
        component: EmailSignupView
    }
];

export default mainRoutes;
