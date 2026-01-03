import ShopView from "@/features/shop/views/ShopView.vue";
import ShopPreview from "@/features/shop/views/ShopPreview.vue";

const shopRoutes = [
    {
        path: '/shop',
        name: "Shop",
        component: ShopView
    },
    {
        path: '/shop-preview',
        name: "ShopPreview",
        component: ShopPreview,
        meta: { requiresAuth: true }
    }
]

export default shopRoutes;