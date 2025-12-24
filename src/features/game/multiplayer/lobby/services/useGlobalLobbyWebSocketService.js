import { ref, onMounted, onBeforeUnmount, readonly } from 'vue';
import { useAuth } from '@/core/composables/useAuth.js';
import webSocketManager from '../../shared/services/websocket/composables/index.js';
import { publish } from '../../shared/services/websocket/composables/core.js';
import { 
    lobbyChatMessages, 
    sendChatMessage, 
    createSystemMessage, 
    setupChatSubscriptions
} from '../../shared/services/websocket/composables/chat.js';

/**
 * 글로벌 로비 WebSocket 서비스 컴포저블
 * 게임방 리스트 화면에서 전체 채팅 기능을 제공하는 서비스
 * - WebSocket을 통한 실시간 채팅 처리
 * - 더미 데이터 모드 지원 (백엔드 없이 개발/테스트 가능)
 * - 실제 사용자 인증 정보 활용
 * 
 * 이 서비스는 기존 WebSocket 관리자와 통합 채팅 컴포저블을 활용하여
 * 글로벌 로비 채팅 기능을 제공합니다.
 */

// 글로벌 로비 구독 정보
const globalLobbySubscriptions = ref(new Map());
const LOBBY_TOPIC = '/topic/chat/lobby';

/**
 * 글로벌 로비 WebSocket 서비스를 초기화하고 제공하는 컴포저블 함수
 * 
 * @returns {Object} 글로벌 로비 WebSocket 서비스 관련 함수와 데이터를 포함하는 객체
 */
export function useGlobalLobbyWebSocketService() {
    const isTeardownInProgress = ref(false);
    const isLobbyActive = ref(false);

    // 인증 컴포저블에서 사용자 정보 가져오기
    const { user: authUser, isAuthenticated } = useAuth();
    
    /**
     * WebSocket 서버에 연결을 시도합니다.
     * 연결에 성공하면 자동으로 글로벌 로비 채널을 구독합니다.
     * 
     * @param {String} [endpoint='/ws'] - WebSocket 서버의 엔드포인트 URL
     */
    const connectWebSocket = (endpoint = '/ws') => {
        const bootstrapLobby = () => {
            webSocketManager.setupLobbySubscriptions();
            subscribeToGlobalLobbyChat();
            joinGlobalLobby();
            isLobbyActive.value = true;
            createSystemMessage('채팅 서버에 연결되었습니다.', 'lobby');
        };

        if (webSocketManager.isConnected.value) {
            bootstrapLobby();
            return;
        }

        const onConnectCallback = () => {
            bootstrapLobby();
        };

        try {
            webSocketManager.connect(endpoint, onConnectCallback);
        } catch (error) {
            console.error('글로벌 로비 WebSocket 연결 중 오류:', error);
        }
    };
    
    /**
     * 글로벌 로비 관련 WebSocket 구독을 해제합니다.
     * 컴포넌트가 언마운트되기 전에 호출되어야 합니다.
     */
    const unsubscribeFromGlobalLobbyChat = () => {
        const topics = Array.from(globalLobbySubscriptions.value.keys());
        topics.forEach((topic) => {
            try {
                webSocketManager.unsubscribe(topic);
            } catch (error) {
                console.error(`글로벌 로비 구독 해제 중 오류 (${topic}):`, error);
            } finally {
                globalLobbySubscriptions.value.delete(topic);
            }
        });
    };

    const disconnectWebSocket = async ({ force = false } = {}) => {
        if (isTeardownInProgress.value) {
            return;
        }

        isTeardownInProgress.value = true;

        try {
            unsubscribeFromGlobalLobbyChat();

            if (isLobbyActive.value) {
                leaveGlobalLobby();
            }

            if (force) {
                if (typeof webSocketManager.deactivate === 'function') {
                    await webSocketManager.deactivate();
                } else {
                    webSocketManager.disconnect();
                }
            }
        } catch (error) {
            console.error('글로벌 로비 WebSocket 종료 처리 중 오류:', error);
        } finally {
            isLobbyActive.value = false;
            isTeardownInProgress.value = false;
        }
    };
    
    /**
     * 글로벌 로비 채팅 채널을 구독합니다.
     * API 명세서: 구독 경로 /topic/chat/lobby
     */
    const subscribeToGlobalLobbyChat = () => {
        // WebSocket이 연결되지 않은 경우 구독 불가
        if (!webSocketManager.isConnected.value) {
            return;
        }
        
        try {
            const topic = LOBBY_TOPIC;

            // 이미 구독 중인지 확인
            if (globalLobbySubscriptions.value.has(topic)) {
                return;
            }
            
            // 통합 채팅 모듈로 로비 채팅 구독 설정
            setupChatSubscriptions(['lobby']);
            
            // 구독 정보 저장
            globalLobbySubscriptions.value.set(topic, 'lobby-subscription');
            
            
        } catch (error) {
            console.error('❌ 글로벌 로비 채팅 구독 중 오류:', error);
        }
    };
    
    /**
     * 글로벌 로비에 채팅 메시지를 전송합니다.
     * 
     * @param {String} message - 전송할 메시지 내용
     * @returns {Boolean} 전송 성공 여부
     */
    const sendGlobalLobbyChat = (message) => {
        // 로비 채팅은 서버 세션으로 사용자 식별
        
        if (!webSocketManager.isConnected.value) {
            return false;
        }
        
        // 통합 채팅 모듈 사용
        return sendChatMessage(message, 'lobby');
    };
    
    /**
     * 글로벌 로비에 입장합니다.
     * API 명세서: /app/chat.join.lobby로 빈 객체 전송
     */
    const joinGlobalLobby = () => {
        if (!webSocketManager.isConnected.value) {
            return false;
        }
        
        try {
            // API 명세서에 따라 빈 객체 전송
            const success = publish('/app/chat.join.lobby', {});
            
            return success;
        } catch (error) {
            console.error('글로벌 로비 입장 중 오류:', error);
            return false;
        }
    };
    
    /**
     * 글로벌 로비에서 퇴장합니다.
     * API 명세서: /app/chat.leave.lobby로 빈 객체 전송
     * 주의: 이 함수는 브라우저 창 닫기 시에만 호출되어야 합니다.
     */
    const leaveGlobalLobby = () => {
        if (!webSocketManager.isConnected.value) {
            return false;
        }
        
        try {
            // API 명세서에 따라 빈 객체 전송
            return publish('/app/chat.leave.lobby', {});
        } catch (error) {
            console.error('글로벌 로비 퇴장 중 오류:', error);
            return false;
        }
    };
    
    /**
     * 글로벌 로비에 시스템 메시지를 생성합니다.
     * 
     * @param {String} content - 시스템 메시지 내용
     * @returns {Object} 생성된 시스템 메시지 객체
     */
    const createGlobalSystemMessage = (content) => {
        // 통합 채팅 모듈 사용
        return createSystemMessage(content, 'lobby');
    };
    

    
    /**
     * 현재 사용자 정보를 업데이트합니다.
     * 로비 채팅은 서버 세션으로 사용자 식별하므로 별도 처리 불필요
     * 
     * @param {Object} userInfo - 업데이트할 사용자 정보
     */
    const setCurrentUser = (userInfo) => {
        // 로비 채팅은 서버 세션으로 사용자 식별하므로 별도 처리 불필요
    };
    
    /**
     * beforeunload 이벤트 핸들러
     * 브라우저 창 닫기 시에만 로비 퇴장 메시지 전송
     */
    const handleBeforeUnload = async () => {
        await disconnectWebSocket({ force: true });
    };
    
    // 컴포넌트 마운트 시 이벤트 리스너 등록
    onMounted(() => {
        // 브라우저 창 닫기 시에만 leave 요청 전송
        window.addEventListener('beforeunload', handleBeforeUnload);
    });
    
    // 컴포넌트 언마운트 시 정리 작업
    onBeforeUnmount(async () => {
        // 이벤트 리스너 제거
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        // 구독 해제 (연결은 유지)
        await disconnectWebSocket();
    });
    
    // 반환할 객체
    return {
        // 연결 관리
        connectWebSocket,
        disconnectWebSocket,
        
        // 채팅 상태 (통합 채팅 모듈에서 가져옴)
        globalLobbyChatMessages: lobbyChatMessages,
        
        // 구독 관리
        subscribeToGlobalLobbyChat,
        
        // 채팅 기능
        sendGlobalLobbyChat,
        
        // 로비 기능
        joinGlobalLobby,
        leaveGlobalLobby,
        
        // 시스템 메시지
        createGlobalSystemMessage,
        
        // 사용자 관리
        setCurrentUser,
        
        // 이벤트 핸들러
        handleBeforeUnload
    };
}

export default useGlobalLobbyWebSocketService;
