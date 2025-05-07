import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import UserManagement from '@/components/admin/UserManagement.vue';

const adminRoutes = [
    {
        path: '/admin',
        name: "AdminDashboard",
        component: AdminDashboard
    },
    {
        path: '/admin/users',
        name: "UserManagement",
        component: UserManagement
    }
];

export default adminRoutes;
