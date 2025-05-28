import Dashboard from '@/views/Admin/Dashboard.vue'
import UserManagement from '@/views/Admin/UserManagement.vue'

const adminRoutes = [
    {
        path: '/admin',
        name: "Dashboard",
        component: Dashboard
    },
    {
        path: '/admin/users',
        name: "UserManagement",
        component: UserManagement
    }
];

export default adminRoutes;
