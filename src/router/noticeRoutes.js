import NoticeDetailView from "@/features/notice/views/NoticeDetailView.vue";
import NoticeListView from "@/features/notice/views/NoticeListView.vue";
import NoticeWriteView from "@/features/notice/views/NoticeWriteView.vue";

const noticeRoutes = [
    {
        path: '/noticeList',
        name: "NoticeListView",
        component: NoticeListView
    },
    {
        path: '/noticeDetail/:id',
        name: "NoticeDetailView",
        component: NoticeDetailView
    },
    {
        path: '/noticeWrite',
        name: "NoticeWriteView",
        component: NoticeWriteView
    },
]

export default noticeRoutes;