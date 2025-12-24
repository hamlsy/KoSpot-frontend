import Shop from '@/features/shop/views/ShopView.vue'
import Inventory from '@/features/user/components/Inventory.vue'
import Profile from '@/features/user/view/ProfileView.vue'
import FriendsList from '@/features/user/components/FriendsList.vue'
import AccountSettings from '@/features/user/components/AccountSettings.vue'

const userRoutes = [
    {
        path: '/shop',
        name: "Shop",
        component: Shop
    },
    {
        path: '/inventory',
        name: "Inventory",
        component: Inventory
    },
    {
        path: '/profile',
        name: "Profile",
        component: Profile
    },
    {
        path: '/myProfile',
        name: "MyProfile",
        component: Profile
    },
    {
        path: '/friendsList',
        name: "FriendsList",
        component: FriendsList
    },
    {
        path: '/accountSettings',
        name: "AccountSettings",
        component: AccountSettings
    },
    {
        path: '/myPoints',
        redirect: '/myProfile'
    }
];

export default userRoutes;
