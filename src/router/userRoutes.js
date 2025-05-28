import Shop from '@/views/User/Shop.vue'
import Inventory from '@/views/User/Inventory.vue'
import Profile from '@/views/User/Profile.vue'
import FriendsList from '@/views/User/components/mypage/FriendsList.vue'
import AccountSettings from '@/views/User/components/mypage/AccountSettings.vue'

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
        path: '/noticeList',
        redirect: '/tempPage'
    },
    {
        path: '/myPoints',
        redirect: '/myProfile'
    }
];

export default userRoutes;
