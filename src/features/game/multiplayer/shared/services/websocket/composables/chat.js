import { ref, readonly } from 'vue';
import { publish, subscribe } from './core';
import { useAuth } from '@/core/composables/useAuth.js';

/**
 * 통합 WebSocket 채팅 모듈
 * 로비 채팅, 게임 채팅, 팀 채팅을 모두 지원하는 통합 채팅 시스템
 */

// 채팅 유형별 메시지 저장소
const lobbyChatMessages = ref([]);
const gameChatMessages = ref([]);
const teamChatMessages = ref({});

// 사용자 정보 관리
const currentUser = ref({
    id: null,
    nickname: null,
});

/**
 * 사용자 정보 초기화 (게임/팀 채팅 전용)
 */
const initializeUserData = () => {
    const { user: authUser, isAuthenticated } = useAuth();
    const localStorageMemberId = localStorage.getItem('memberId');
    
    if (isAuthenticated.value && authUser.value) {
        const userId = authUser.value.id || authUser.value.memberId || localStorageMemberId;
        
        currentUser.value = {
            id: userId,
            nickname: '익명',
            email: null,
            profileImage: null
        };
    } else if (!isAuthenticated.value) {
        console.warn('❌ 인증되지 않은 사용자 - 게임/팀 채팅 기능 제한');
    }
};

/**
 * 채팅 메시지 전송 목적지 결정
 */
const getChatDestination = (chatType, teamId = null) => {
    switch (chatType) {
        case 'lobby':
            return '/app/chat.message.lobby';
        case 'team':
            return teamId ? `/app/game/team/${teamId}/chat` : '/app/game/chat';
        case 'game':
        default:
            return '/app/game/chat';
    }
};

/**
 * 채팅 메시지 구성
 */
const buildChatMessage = (message, chatType, teamId = null) => {
    if (chatType === 'lobby') {
        // API 명세서에 따른 로비 채팅 메시지 형식
        return {
            content: message
        };
    }
    
    return {
        playerId: currentUser.value.id,
        playerName: currentUser.value.nickname || '익명',
        teamId: teamId,
        content: message,
        chatType: chatType,
        timestamp: new Date().toISOString()
    };
};

/**
 * 통합 채팅 메시지 전송
 */
const sendChatMessage = (message, chatType = 'game', options = {}) => {
    if (!message) return false;
    
    // 로비 채팅의 경우 서버 세션으로 사용자 식별 (currentUser 불필요)
    if (chatType === 'lobby') {
        const destination = getChatDestination(chatType, options.teamId);
        const chatMessage = buildChatMessage(message, chatType, options.teamId);
        return publish(destination, chatMessage);
    }
    
    // 게임/팀 채팅의 경우에만 사용자 정보 확인
    if (!currentUser.value?.id) {
        initializeUserData();
    }
    
    if (!currentUser.value?.id) {
        console.error('게임/팀 채팅: 사용자 정보가 없어 메시지를 전송할 수 없습니다.');
        return false;
    }
    
    // 하위 호환성: 기존 게임 채팅 방식 지원
    if (options.player && !currentUser.value.id) {
        currentUser.value = {
            id: options.player.id,
            nickname: options.player.nickname,
            email: options.player.email,
            profileImage: options.player.profileImage
        };
    }
    
    const destination = getChatDestination(chatType, options.teamId);
    const chatMessage = buildChatMessage(message, chatType, options.teamId);
    
    return publish(destination, chatMessage);
};

/**
 * 통합 채팅 메시지 처리
 */
const handleChatMessage = (message) => {
    const chatType = message.chatType || 'game';
    
    console.log('🔄 handleChatMessage 호출:', {
        chatType: chatType,
        message: message,
        hasContent: !!message.content,
        content: message.content
    });
    
    switch (chatType) {
        case 'lobby':
            console.log('📝 로비 채팅 메시지 추가:', {
                beforeCount: lobbyChatMessages.value.length,
                message: message
            });
            
            lobbyChatMessages.value.push(message);
            
            console.log('📝 로비 채팅 메시지 추가 완료:', {
                afterCount: lobbyChatMessages.value.length,
                latestMessage: lobbyChatMessages.value[lobbyChatMessages.value.length - 1]
            });
            
            if (lobbyChatMessages.value.length > 100) {
                lobbyChatMessages.value = lobbyChatMessages.value.slice(-100);
            }
            break;
            
        case 'team': {
            const teamId = message.teamId;
            if (teamId) {
                if (!teamChatMessages.value[teamId]) {
                    teamChatMessages.value[teamId] = [];
                }
                teamChatMessages.value[teamId].push(message);
                if (teamChatMessages.value[teamId].length > 50) {
                    teamChatMessages.value[teamId] = teamChatMessages.value[teamId].slice(-50);
                }
            }
            break;
        }
            
        case 'game':
        default:
            gameChatMessages.value.push(message);
            if (gameChatMessages.value.length > 100) {
                gameChatMessages.value = gameChatMessages.value.slice(-100);
            }
            break;
    }
};

/**
 * 시스템 메시지 생성
 */
const createSystemMessage = (content, chatType = 'game', teamId = null) => {
    const systemMessage = {
        playerId: 'system',
        playerName: '시스템',
        content: content,
        timestamp: new Date().toISOString(),
        isSystem: true,
        chatType: chatType
    };
    
    if (teamId) {
        systemMessage.teamId = teamId;
    }
    
    handleChatMessage(systemMessage);
    return systemMessage;
};

/**
 * 로비 입장 메시지 (본인만 표시)
 */
const sendLobbyJoinMessage = () => {
    const joinMessage = {
        playerName: '시스템',
        content: '로비에 입장했습니다.',
        timestamp: new Date().toISOString(),
        chatType: 'lobby',
        isSystem: true
    };
    
    handleChatMessage(joinMessage);
    return true;
};

/**
 * 채팅 구독 설정
 */
const setupChatSubscriptions = (chatTypes = ['game']) => {
    chatTypes.forEach(chatType => {
        switch (chatType) {
            case 'lobby': {
                // API 명세서에 따른 구독 경로: /topic/lobby
                const topic = '/topic/chat/lobby';
                
                subscribe(topic, (message) => {
                    console.log('📨 로비 채팅 메시지 수신:', {
                        topic: topic,
                        rawMessage: message,
                        messageType: typeof message,
                        timestamp: new Date().toISOString()
                    });
                    
                    try {
                        const data = typeof message === 'string' ? JSON.parse(message) : message;
                        
                
                        
                        // API 명세서에 따른 수신 메시지 형식
                        const processedMessage = {
                            id: data.messageId,
                            playerName: data.nickname,
                            content: data.content,
                            timestamp: data.timestamp,
                            messageType: data.messageType,
                            senderId: data.senderId,
                            chatType: 'lobby',
                            isSystem: data.messageType === 'SYSTEM_CHAT' || data.messageType === 'NOTICE_CHAT'
                        };
                        
                    
                        
                        handleChatMessage(processedMessage);
                        
                
                    } catch (error) {
                        console.error(`❌ 로비 채팅 메시지 처리 오류 (${topic}):`, error, message);
                    }
                });
                break;
            }
                
            case 'game':
                subscribe('/topic/game/chat', (message) => {
                    try {
                        const data = typeof message === 'string' ? JSON.parse(message) : message;
                        data.chatType = 'game';
                        handleChatMessage(data);
                    } catch (error) {
                        console.error('게임 채팅 메시지 처리 오류:', error);
                    }
                });
                break;
                
            case 'team':
                // 팀 채팅은 동적으로 구독되므로 여기서는 설정하지 않음
                break;
        }
    });
};

/**
 * 팀 채팅 구독 설정
 */
const subscribeToTeamChat = (teamId) => {
    if (!teamId) return;
    
    const topic = `/topic/game/team/${teamId}/chat`;
    subscribe(topic, (message) => {
        try {
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            data.chatType = 'team';
            data.teamId = teamId;
            handleChatMessage(data);
        } catch (error) {
            console.error('팀 채팅 메시지 처리 오류:', error);
        }
    });
};

/**
 * 채팅 메시지 초기화
 */
const clearChatMessages = (chatType = 'all', teamId = null) => {
    switch (chatType) {
        case 'lobby':
            lobbyChatMessages.value = [];
            break;
        case 'game':
            gameChatMessages.value = [];
            break;
        case 'team':
            if (teamId) {
                teamChatMessages.value[teamId] = [];
            } else {
                teamChatMessages.value = {};
            }
            break;
        case 'all':
        default:
            lobbyChatMessages.value = [];
            gameChatMessages.value = [];
            teamChatMessages.value = {};
            break;
    }
};

// 읽기 전용 상태 생성
const readonlyLobbyChatMessages = readonly(lobbyChatMessages);
const readonlyGameChatMessages = readonly(gameChatMessages);
const readonlyTeamChatMessages = readonly(teamChatMessages);
const readonlyCurrentUser = readonly(currentUser);

export {
    // 상태 (읽기 전용)
    readonlyLobbyChatMessages as lobbyChatMessages,
    readonlyGameChatMessages as gameChatMessages,
    readonlyTeamChatMessages as teamChatMessages,
    readonlyCurrentUser as currentUser,
    
    // 하위 호환성을 위한 기존 export
    readonlyGameChatMessages as chatMessages,
    
    // 메서드
    sendChatMessage,
    handleChatMessage,
    createSystemMessage,
    setupChatSubscriptions,
    subscribeToTeamChat,
    clearChatMessages,
    
    // 로비 전용 메서드
    sendLobbyJoinMessage,
    
    // 사용자 정보 관리
    initializeUserData
};
