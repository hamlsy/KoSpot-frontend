/**
 * 알림 타입 상수 및 메타데이터
 * 백엔드 NotificationType과 동기화
 */

export const NOTIFICATION_TYPE = {
    ADMIN_MESSAGE: 'ADMIN_MESSAGE',   // 관리자 메시지
    NOTICE: 'NOTICE',                 // 공지사항 업로드 알림
    FRIEND_REQUEST: 'FRIEND_REQUEST', // 친구 요청 알림 (추후 연동)
};

/**
 * 알림 타입별 표시 메타데이터
 */
export const NOTIFICATION_TYPE_META = {
    [NOTIFICATION_TYPE.ADMIN_MESSAGE]: {
        label: '시스템 메시지',
        icon: 'fas fa-bullhorn',
        color: '#6366f1',
        bgColor: 'rgba(99, 102, 241, 0.1)',
    },
    [NOTIFICATION_TYPE.NOTICE]: {
        label: '공지사항',
        icon: 'fas fa-bell',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    [NOTIFICATION_TYPE.FRIEND_REQUEST]: {
        label: '친구 요청',
        icon: 'fas fa-user-plus',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
    },
};

/**
 * 알림 타입 메타데이터 반환 (알 수 없는 타입에 대한 fallback 포함)
 * @param {string} type - 알림 타입
 * @returns {Object} 메타데이터
 */
export const getNotificationMeta = (type) => {
    return NOTIFICATION_TYPE_META[type] || {
        label: '알림',
        icon: 'fas fa-bell',
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
    };
};

/**
 * WebSocket 구독 채널
 */
export const NOTIFICATION_WS_CHANNELS = {
    /** 전역 알림 (공지사항/시스템 브로드캐스트) */
    GLOBAL: '/topic/notification/global',
    /** 개인 알림 (관리자 메시지/친구 요청 등) */
    PERSONAL: '/user/queue/notification',
};

export default {
    NOTIFICATION_TYPE,
    NOTIFICATION_TYPE_META,
    getNotificationMeta,
    NOTIFICATION_WS_CHANNELS,
};
