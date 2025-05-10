import ShopMain from '@/components/user/shop/ShopMain.vue';
import InventoryMain from '@/components/user/inventory/InventoryMain.vue';
import MyProfile from '@/components/user/mypage/MyProfile.vue';
import FriendsList from '@/components/user/mypage/FriendsList.vue';
import AccountSettings from '@/components/user/mypage/AccountSettings.vue';

const userRoutes = [
    {
        path: '/shopMain',
        name: "ShopMain",
        component: ShopMain
    },
    {
        path: '/inventory',
        name: "InventoryMain",
        component: InventoryMain
    },
    {
        path: '/myProfile',
        name: "MyProfile",
        component: MyProfile
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
