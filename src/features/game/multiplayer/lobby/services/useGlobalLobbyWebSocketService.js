import { ref, onMounted, onBeforeUnmount, readonly } from 'vue';
import { useAuth } from '@/core/composables/useAuth.js';
import webSocketManager from '../../shared/services/websocket/composables/index.js';
import { 
    lobbyChatMessages, 
    currentUser, 
    sendChatMessage, 
    sendLobbyJoinMessage, 
    createSystemMessage, 
    setupChatSubscriptions,
    initializeUserData 
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

/**
 * 글로벌 로비 WebSocket 서비스를 초기화하고 제공하는 컴포저블 함수
 * 
 * @returns {Object} 글로벌 로비 WebSocket 서비스 관련 함수와 데이터를 포함하는 객체
 */
export function useGlobalLobbyWebSocketService() {
    // 인증 컴포저블에서 사용자 정보 가져오기
    const { user: authUser, isAuthenticated } = useAuth();
    
    /**
     * WebSocket 서버에 연결을 시도합니다.
     * 연결에 성공하면 자동으로 글로벌 로비 채널을 구독합니다.
     * 
     * @param {String} [endpoint='/ws'] - WebSocket 서버의 엔드포인트 URL
     */
    const connectWebSocket = (endpoint = '/ws') => {
        console.log('🔵 useGlobalLobbyWebSocketService.connectWebSocket() 호출됨');
        console.log('현재 연결 상태:', {
            isConnected: webSocketManager.isConnected.value
        });
        
        // 사용자 정보 초기화
        initializeUserData();
        
        // 이미 연결된 경우에는 글로벌 로비 채널만 구독
        if (webSocketManager.isConnected.value) {
            console.log('이미 연결되어 있음, 구독만 진행');
            subscribeToGlobalLobbyChat();
            return;
        }
        
        // 연결 성공 시 호출될 콜백 함수
        const onConnectCallback = () => {
            console.log('🟢 onConnectCallback 실행됨!');
            console.log('콜백 실행 시점 상태:', {
                isConnected: webSocketManager.isConnected.value
            });
            
            // 로비 전용 구독 설정 (게임 채팅, 플레이어 상태, 게임 상태 구독 제외)
            webSocketManager.setupLobbySubscriptions();
            
            subscribeToGlobalLobbyChat();
            joinGlobalLobby();
            // 연결 성공 메시지 표시
            createSystemMessage('채팅 서버에 연결되었습니다.', 'lobby');
        };
        
        console.log('🔵 webSocketManager.connect() 호출 시작');
        // WebSocketManager를 통해 연결
        webSocketManager.connect(endpoint, onConnectCallback);
        console.log('🔵 webSocketManager.connect() 호출 완료');
    };
    
    /**
     * 글로벌 로비 관련 WebSocket 구독을 해제합니다.
     * 컴포넌트가 언마운트되기 전에 호출되어야 합니다.
     */
    const disconnectWebSocket = () => {
        // 글로벌 로비 구독 해제
        globalLobbySubscriptions.value.forEach((_, topic) => {
            try {
                webSocketManager.unsubscribe(topic);
            } catch (error) {
                console.error(`글로벌 로비 구독 해제 중 오류 (${topic}):`, error);
            }
        });
        
        // 구독 목록 초기화
        globalLobbySubscriptions.value.clear();
        console.log('글로벌 로비 구독이 모두 해제되었습니다.');
    };
    
    /**
     * 글로벌 로비 채팅 채널을 구독합니다.
     */
    const subscribeToGlobalLobbyChat = () => {
        // WebSocket이 연결되지 않은 경우 구독 불가
        if (!webSocketManager.isConnected.value) {
            console.warn('WebSocket이 연결되지 않아 구독할 수 없습니다.');
            return;
        }
        
        try {
            console.log('🔍 현재 WebSocket 연결 상태:', webSocketManager.isConnected.value);
            
            // Spring WebSocketChannelConstants에 따른 정확한 로비 채팅 토픽
            // PREFIX_CHAT + GLOBAL_LOBBY_CHANNEL = "/topic/chat/" + "lobby"
            const topic = '/topic/chat/lobby';
            
            // 이미 구독 중인지 확인
            if (globalLobbySubscriptions.value.has(topic)) {
                console.log(`이미 ${topic}에 구독 중입니다.`);
                return;
            }
            
            // 통합 채팅 모듈로 로비 채팅 구독 설정
            setupChatSubscriptions(['lobby']);
            
            // 구독 정보 저장
            globalLobbySubscriptions.value.set(topic, 'lobby-subscription');
            console.log(`✅ 글로벌 로비 채팅 채널 구독 성공: ${topic}`);
            
            // 구독 후 테스트 메시지 (개발용)
            console.log('🔍 구독 후 로비 채팅 메시지 상태:', lobbyChatMessages.value.length);
            
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
        console.log('🔵 로비 채팅 메시지 전송 시도:', message);
        console.log('🔍 현재 WebSocket 연결 상태:', webSocketManager.isConnected.value);
        console.log('🔍 현재 사용자 정보:', currentUser.value);
        
        if (!webSocketManager.isConnected.value) {
            console.error('❌ WebSocket이 연결되지 않아 메시지를 전송할 수 없습니다.');
            return false;
        }
        
        // 통합 채팅 모듈 사용
        const success = sendChatMessage(message, 'lobby');
        console.log('📤 로비 채팅 메시지 전송 결과:', success);
        
        return success;
    };
    
    /**
     * 글로벌 로비에 입장합니다.
     */
    const joinGlobalLobby = () => {
        if (!webSocketManager.isConnected.value) {
            console.warn('WebSocket이 연결되지 않아 로비에 입장할 수 없습니다.');
            return false;
        }
        
        try {
            console.log('🔵 로비 입장 시도');
            
            // 통합 채팅 모듈 사용
            return sendLobbyJoinMessage();
        } catch (error) {
            console.error('글로벌 로비 입장 중 오류:', error);
            return false;
        }
    };
    
    /**
     * 글로벌 로비에서 퇴장합니다.
     * 주의: 이 함수는 브라우저 창 닫기 시에만 호출되어야 합니다.
     */
    const leaveGlobalLobby = () => {
        if (!webSocketManager.isConnected.value) {
            console.warn('WebSocket이 연결되지 않아 로비에서 퇴장할 수 없습니다.');
            return false;
        }
        
        try {
            console.log('🚪 글로벌 로비 퇴장 (퇴장 메시지 없음)');
            // 퇴장 메시지는 더 이상 전송하지 않음
            return true;
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
     * 
     * @param {Object} userInfo - 업데이트할 사용자 정보
     */
    const setCurrentUser = (userInfo) => {
        console.log('🔵 사용자 정보 업데이트:', userInfo);
        
        // 통합 채팅 모듈에서 사용자 정보 초기화
        initializeUserData();
        
        console.log('현재 사용자 정보:', currentUser.value);
    };
    
    /**
     * beforeunload 이벤트 핸들러
     * 브라우저 창 닫기 시에만 로비 퇴장 메시지 전송
     */
    const handleBeforeUnload = () => {
        console.log('🔵 beforeunload 이벤트 - 로비 퇴장 시도');
        leaveGlobalLobby();
    };
    
    // 컴포넌트 마운트 시 이벤트 리스너 등록
    onMounted(() => {
        console.log('🔵 GlobalLobbyWebSocketService mounted');
        
        // 브라우저 창 닫기 시에만 leave 요청 전송
        window.addEventListener('beforeunload', handleBeforeUnload);
    });
    
    // 컴포넌트 언마운트 시 정리 작업
    onBeforeUnmount(() => {
        console.log('🔵 GlobalLobbyWebSocketService unmounting');
        
        // 이벤트 리스너 제거
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        // 구독 해제 (연결은 유지)
        disconnectWebSocket();
    });
    
    // 반환할 객체
    return {
        // 연결 관리
        connectWebSocket,
        disconnectWebSocket,
        
        // 채팅 상태 (통합 채팅 모듈에서 가져옴)
        globalLobbyChatMessages: lobbyChatMessages,
        currentUser,
        
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
