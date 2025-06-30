import { ref, onMounted, onBeforeUnmount, readonly } from 'vue';
import webSocketManager from '../../../shared/services/websocket/composables';

/**
 * 글로벌 로비 WebSocket 서비스 컴포저블
 * 게임방 리스트 화면에서 전체 채팅 기능을 제공하는 서비스
 * - WebSocket을 통한 실시간 채팅 처리
 * - 더미 데이터 모드 지원 (백엔드 없이 개발/테스트 가능)
 * 
 * 이 서비스는 기존 WebSocket 관리자와 채팅 컴포저블을 활용하여
 * 글로벌 로비 채팅 기능을 제공합니다.
 */

// 글로벌 로비 구독 정보
const globalLobbySubscriptions = ref(new Map());

// 글로벌 로비 채팅 메시지
const globalLobbyChatMessages = ref([]);

/**
 * 글로벌 로비 WebSocket 서비스를 초기화하고 제공하는 컴포저블 함수
 * 
 * @returns {Object} 글로벌 로비 WebSocket 서비스 관련 함수와 데이터를 포함하는 객체
 */
export function useGlobalLobbyWebSocketService() {
    // 현재 사용자 정보 (기본값으로 랜덤 ID와 닉네임 생성)
    const currentUser = ref({
        id: `user-${Math.floor(Math.random() * 1000)}`, // 랜덤 사용자 ID
        nickname: `User-${Math.floor(Math.random() * 1000)}`, // 랜덤 닉네임
    });
    
    /**
     * WebSocket 서버에 연결을 시도합니다.
     * 연결에 성공하면 자동으로 글로벌 로비 채널을 구독합니다.
     * 
     * @param {String} [endpoint='/ws'] - WebSocket 서버의 엔드포인트 URL
     */
    const connectWebSocket = (endpoint = '/ws') => {
        // 이미 연결된 경우에는 글로벌 로비 채널만 구독
        if (webSocketManager.isConnected.value) {
            subscribeToGlobalLobbyChat();
            return;
        }
        
        // 연결 성공 시 호출될 콜백 함수
        const onConnectCallback = () => {
            subscribeToGlobalLobbyChat();
            // 연결 성공 메시지 표시
            createGlobalSystemMessage('채팅 서버에 연결되었습니다.');
        };
        
        // WebSocketManager를 통해 연결
        webSocketManager.connect(endpoint, onConnectCallback);
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
        if (!webSocketManager.isConnected.value && !webSocketManager.useDummyData.value) {
            console.warn('WebSocket이 연결되지 않아 구독할 수 없습니다.');
            return;
        }
        
        try {
            // 글로벌 로비 채팅 채널 구독
            const topic = '/topic/lobby/chat';
            
            // 이미 구독 중인지 확인
            if (globalLobbySubscriptions.value.has(topic)) {
                console.log(`이미 ${topic}에 구독 중입니다.`);
                return;
            }
            
            // 채널 구독
            const subscriptionId = webSocketManager.subscribe(topic, handleGlobalLobbyMessage);
            
            if (subscriptionId) {
                globalLobbySubscriptions.value.set(topic, subscriptionId);
                console.log(`글로벌 로비 채팅 채널 구독 성공: ${topic}`);
                
                // 더미 데이터 모드인 경우 시스템 메시지 추가
                if (webSocketManager.useDummyData.value) {
                    createGlobalSystemMessage('더미 모드: 글로벌 로비 채팅 시뮬레이션 중입니다.');
                    // 더미 채팅 메시지 추가 (예시)
                    simulateGlobalLobbyChat();
                }
            }
        } catch (error) {
            console.error('글로벌 로비 채팅 구독 중 오류:', error);
        }
    };
    
    /**
     * 글로벌 로비 채팅 메시지를 처리합니다.
     * 
     * @param {Object} message - 수신된 메시지 객체
     */
    const handleGlobalLobbyMessage = (message) => {
        try {
            // 메시지가 문자열인 경우 파싱
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            
            // 채팅 메시지 처리
            if (data.type === 'CHAT' || data.content) {
                // 글로벌 로비 채팅 메시지 추가
                globalLobbyChatMessages.value.push(data);
                
                // 최대 100개만 유지 (메모리 관리)
                if (globalLobbyChatMessages.value.length > 100) {
                    globalLobbyChatMessages.value = globalLobbyChatMessages.value.slice(-100);
                }
                
                // 일반 채팅 메시지도 처리 (기존 채팅 컴포저블과 통합)
                webSocketManager.handleChatMessage({
                    ...data,
                    chatType: 'lobby' // 글로벌 로비 채팅임을 표시
                });
            }
        } catch (error) {
            console.error('글로벌 로비 메시지 처리 중 오류:', error);
        }
    };
    
    /**
     * 글로벌 로비에 채팅 메시지를 전송합니다.
     * 
     * @param {String} message - 전송할 메시지 내용
     * @returns {Boolean} 전송 성공 여부
     */
    const sendGlobalLobbyChat = (message) => {
        if (!message) return false;
        
        // 사용자 정보 확인
        if (!currentUser.value || !currentUser.value.id) {
            console.error('사용자 정보가 없어 메시지를 전송할 수 없습니다.');
            return false;
        }
        
        // 글로벌 로비 채팅 메시지 구성
        const chatMessage = {
            memberId: currentUser.value.id,
            playerName: currentUser.value.nickname || '익명',
            content: message,
            chatType: 'lobby',
            timestamp: new Date().toISOString(),
            type: 'CHAT'
        };
        
        // 더미 데이터 모드일 경우 로컬에서 처리
        if (webSocketManager.useDummyData.value) {
            handleGlobalLobbyMessage(chatMessage);
            return true;
        }
        
        // 서버로 메시지 전송
        return webSocketManager.publish('/app/lobby/chat', chatMessage);
    };
    
    /**
     * 글로벌 로비에 시스템 메시지를 생성합니다.
     * 
     * @param {String} content - 시스템 메시지 내용
     * @returns {Object} 생성된 시스템 메시지 객체
     */
    const createGlobalSystemMessage = (content) => {
        const systemMessage = {
            playerId: 'system',
            playerName: '시스템',
            content: content,
            timestamp: new Date().toISOString(),
            isSystem: true,
            chatType: 'lobby',
            type: 'CHAT'
        };
        
        handleGlobalLobbyMessage(systemMessage);
        return systemMessage;
    };
    
    /**
     * 더미 모드에서 글로벌 로비 채팅을 시뮬레이션합니다.
     * 개발 및 테스트 목적으로 사용됩니다.
     */
    const simulateGlobalLobbyChat = () => {
        if (!webSocketManager.useDummyData.value) return;
        
        const dummyMessages = [
            { playerId: 'dummy-1', playerName: '방문자1', content: '안녕하세요! 오늘 처음 왔어요.' },
            { playerId: 'dummy-2', playerName: '방문자2', content: '여기 게임 재밌나요?' },
            { playerId: 'dummy-3', playerName: '단골손님', content: '저는 매일 즐겨하고 있어요!' },
            { playerId: 'dummy-4', playerName: '게임마스터', content: '오늘 새로운 게임이 추가되었습니다.' }
        ];
        
        // 1~3초 간격으로 더미 메시지 전송 시뮬레이션
        dummyMessages.forEach((msg, index) => {
            setTimeout(() => {
                const chatMessage = {
                    ...msg,
                    chatType: 'lobby',
                    timestamp: new Date().toISOString(),
                    type: 'CHAT'
                };
                handleGlobalLobbyMessage(chatMessage);
            }, (index + 1) * (1000 + Math.random() * 2000));
        });
    };
    
    /**
     * 현재 사용자 정보를 업데이트합니다.
     * 
     * @param {Object} userInfo - 업데이트할 사용자 정보
     */
    const setCurrentUser = (userInfo) => {
        if (!userInfo || typeof userInfo !== 'object') {
            console.error('유효하지 않은 사용자 정보입니다.');
            return;
        }
        
        console.log('사용자 정보 업데이트:', userInfo);
        
        // 기존 값과 병합하여 업데이트 (불변성 유지)
        currentUser.value = {
            ...currentUser.value,
            ...userInfo,
            // undefined가 되지 않도록 기본값 유지
            id: userInfo.id || currentUser.value.id
        };
    };
    
    // 컴포넌트 마운트 시 호출되는 라이프사이클 훅
    onMounted(() => {
        // 주의: 여기서 자동 연결을 시도하지 않습니다.
        // 컴포넌트가 마운트될 때 자동으로 연결하려면 다음 주석을 해제하세요:
        // connectWebSocket();
        console.log('글로벌 로비 WebSocket 서비스가 초기화되었습니다.');
    });
    
    // 컴포넌트가 언마운트되기 전에 호출되는 라이프사이클 훅
    onBeforeUnmount(() => {
        console.log('컴포넌트 언마운트 중 글로벌 로비 WebSocket 연결을 정리합니다...');
        // WebSocket 연결 안전하게 종료
        disconnectWebSocket();
    });
    
    // 외부로 노출할 값과 메서드
    return {
        // 상태 (읽기 전용으로 노출)
        isConnected: readonly(webSocketManager.isConnected),
        useDummyData: readonly(webSocketManager.useDummyData),
        currentUser: readonly(currentUser),
        globalLobbyChatMessages: readonly(globalLobbyChatMessages),
        chatMessages: webSocketManager.chatMessages, // 기존 채팅 메시지와 통합
        
        // 메서드
        connectWebSocket,
        disconnectWebSocket,
        subscribeToGlobalLobbyChat,
        sendGlobalLobbyChat,
        createGlobalSystemMessage,
        setCurrentUser,
        
        // 테스트용 메서드
        simulateGlobalLobbyChat
    };
}

export default useGlobalLobbyWebSocketService;
