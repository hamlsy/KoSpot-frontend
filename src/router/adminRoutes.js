import DashboardView from '@/features/admin/views/DashboardView.vue'

const adminRoutes = [
    {
        path: '/admin',
        name: "Dashboard",
        component: DashboardView,
        meta: { requiresAuth: true }
    },
];

export default adminRoutes;
