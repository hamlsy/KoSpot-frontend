import Inventory from '@/features/user/components/Inventory.vue'
import Profile from '@/features/user/view/ProfileView.vue'
import AccountSettings from '@/features/user/components/AccountSettings.vue'

const userRoutes = [
    {
        path: '/inventory',
        name: "Inventory",
        component: Inventory,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: "Profile",
        component: Profile,
        meta: { requiresAuth: true }
    },
    {
        path: '/myProfile',
        name: "MyProfile",
        component: Profile,
        meta: { requiresAuth: true }
    },
    {
        path: '/accountSettings',
        name: "AccountSettings",
        component: AccountSettings,
        meta: { requiresAuth: true }
    },
    {
        path: '/myPoints',
        redirect: '/myProfile'
    }
];

export default userRoutes;
