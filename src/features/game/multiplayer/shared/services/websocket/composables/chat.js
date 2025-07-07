import { ref, readonly } from 'vue';
import { publish, subscribe } from './core';
import { useAuth } from '@/core/composables/useAuth.js';

/**
 * 통합 WebSocket 채팅 모듈
 * 로비 채팅, 게임 채팅, 팀 채팅을 모두 지원하는 통합 채팅 시스템
 */

// 채팅 유형별 메시지 저장소
const lobbyChatMessages = ref([]); // 로비 채팅 메시지
const gameChatMessages = ref([]); // 게임 전체 채팅 메시지
const teamChatMessages = ref({}); // 팀별 채팅 메시지 (키: 팀ID, 값: 메시지 배열)

// 사용자 정보 관리
const currentUser = ref({
    id: null,
    nickname: null,
});

/**
 * 사용자 정보 초기화
 */
const initializeUserData = () => {
    const { user: authUser, isAuthenticated } = useAuth();
    
    if (isAuthenticated.value && authUser.value) {
        // 실제 인증된 사용자 정보 사용
        currentUser.value = {
            id: authUser.value.id || authUser.value.memberId,
            nickname: authUser.value.nickname || authUser.value.name || authUser.value.username,
            email: authUser.value.email,
            profileImage: authUser.value.profileImage || authUser.value.avatar
        };
        console.log('✅ 채팅 모듈: 실제 사용자 정보로 설정됨:', currentUser.value);
    } else {
        console.warn('❌ 인증되지 않은 사용자 - 채팅 기능 제한');
    }
};

/**
 * 채팅 메시지 전송 목적지 결정
 * @param {String} chatType - 채팅 유형 ('lobby', 'game', 'team')
 * @param {String} teamId - 팀 ID (팀 채팅인 경우)
 * @returns {String} 전송 목적지 경로
 */
const getChatDestination = (chatType, teamId = null) => {
    let destination;
    switch (chatType) {
        case 'lobby':
            destination = '/app/chat.message.lobby';
            break;
        case 'team':
            destination = teamId ? `/app/game/team/${teamId}/chat` : '/app/game/chat';
            break;
        case 'game':
        default:
            destination = '/app/game/chat';
            break;
    }
    
    console.log('📍 메시지 전송 목적지 결정:', { chatType, teamId, destination });
    return destination;
};

/**
 * 채팅 메시지 구성
 * @param {String} message - 메시지 내용
 * @param {String} chatType - 채팅 유형
 * @param {String} teamId - 팀 ID (팀 채팅인 경우)
 * @returns {Object} 구성된 채팅 메시지
 */
const buildChatMessage = (message, chatType, teamId = null) => {
    let chatMessage;
    
    if (chatType === 'lobby') {
        // Spring 서버의 ChatMessageDto 형식 (로비 채팅)
        chatMessage = {
            messageType: 'CHAT',
            channelType: 'LOBBY',
            content: message
        };
    } else {
        // 게임 채팅 형식
        chatMessage = {
            playerId: currentUser.value.id,
            playerName: currentUser.value.nickname || '익명',
            teamId: teamId,
            content: message,
            chatType: chatType,
            timestamp: new Date().toISOString()
        };
    }
    
    console.log('📝 채팅 메시지 구성:', { chatType, teamId, message: chatMessage });
    return chatMessage;
};

/**
 * 통합 채팅 메시지 전송
 * @param {String} message - 메시지 내용
 * @param {String} chatType - 채팅 유형 ('lobby', 'game', 'team')
 * @param {Object} options - 추가 옵션
 * @param {String} options.teamId - 팀 ID (팀 채팅인 경우)
 * @param {Object} options.player - 플레이어 정보 (게임 채팅인 경우, 하위 호환성)
 * @returns {Boolean} 전송 성공 여부
 */
const sendChatMessage = (message, chatType = 'game', options = {}) => {
    if (!message) return false;
    
    // 사용자 정보 확인 및 초기화
    if (!currentUser.value?.id) {
        initializeUserData();
    }
    
    if (!currentUser.value?.id) {
        console.error('사용자 정보가 없어 메시지를 전송할 수 없습니다.');
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
    
    console.log('📤 채팅 메시지 전송:', {
        type: chatType,
        destination,
        message: chatMessage,
        user: currentUser.value
    });
    
    // 서버로 메시지 전송
    return publish(destination, chatMessage);
};

/**
 * 통합 채팅 메시지 처리
 * @param {Object} message - 채팅 메시지 데이터
 */
const handleChatMessage = (message) => {
    const chatType = message.chatType || 'game';
    
    // 채팅 유형에 따라 적절한 저장소에 메시지 추가
    switch (chatType) {
        case 'lobby':
            lobbyChatMessages.value.push(message);
            // 최대 100개만 유지
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
                // 팀별로 최대 50개만 유지
                if (teamChatMessages.value[teamId].length > 50) {
                    teamChatMessages.value[teamId] = teamChatMessages.value[teamId].slice(-50);
                }
            }
            break;
        }
            
        case 'game':
        default:
            gameChatMessages.value.push(message);
            // 최대 100개만 유지
            if (gameChatMessages.value.length > 100) {
                gameChatMessages.value = gameChatMessages.value.slice(-100);
            }
            break;
    }
    
    console.log('📥 채팅 메시지 처리됨:', {
        type: chatType,
        messageCount: {
            lobby: lobbyChatMessages.value.length,
            game: gameChatMessages.value.length,
            teams: Object.keys(teamChatMessages.value).length
        }
    });
};

/**
 * 시스템 메시지 생성
 * @param {String} content - 메시지 내용
 * @param {String} chatType - 채팅 유형
 * @param {String} teamId - 팀 ID (팀 채팅인 경우)
 * @returns {Object} 시스템 메시지 객체
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
 * 로비 입장 메시지 전송
 * @returns {Boolean} 전송 성공 여부
 */
const sendLobbyJoinMessage = () => {
    if (!currentUser.value?.id) {
        initializeUserData();
    }
    
    const joinMessage = {
        messageType: 'JOIN',
        channelType: 'LOBBY',
        content: `${currentUser.value.nickname || '익명'}님이 로비에 입장했습니다.`
    };
    
    console.log('🚪 로비 입장 메시지 전송:', joinMessage);
    return publish('/app/chat.join.lobby', joinMessage);
};

/**
 * 로비 퇴장 메시지 전송
 * @returns {Boolean} 전송 성공 여부
 */
const sendLobbyLeaveMessage = () => {
    if (!currentUser.value?.id) return false;
    
    const leaveMessage = {
        messageType: 'LEAVE',
        channelType: 'LOBBY',
        content: `${currentUser.value.nickname || '익명'}님이 로비에서 퇴장했습니다.`
    };
    
    console.log('🚪 로비 퇴장 메시지 전송:', leaveMessage);
    return publish('/app/chat.leave.lobby', leaveMessage);
};

/**
 * 채팅 구독 설정
 * @param {Array} chatTypes - 구독할 채팅 유형 배열 ['lobby', 'game', 'team']
 */
const setupChatSubscriptions = (chatTypes = ['game']) => {
    chatTypes.forEach(chatType => {
        switch (chatType) {
            case 'lobby': {
                // 서버에서 보내는 경로와 일치하는지 확인하기 위해 여러 경로 시도
                const lobbyTopics = [
                    '/topic/lobby',           // 기본 경로
                    '/topic/chat/lobby',      // PREFIX_CHAT + GLOBAL_LOBBY_CHANNEL 가능성 1
                    '/topic/chat/global-lobby', // PREFIX_CHAT + GLOBAL_LOBBY_CHANNEL 가능성 2
                    '/topic/global-lobby'     // 다른 가능성
                ];
                
                lobbyTopics.forEach(topic => {
                    console.log(`🔍 로비 채팅 구독 시도: ${topic}`);
                    subscribe(topic, (message) => {
                        console.log(`📥 로비 채팅 메시지 수신 (${topic}):`, message);
                        try {
                            const data = typeof message === 'string' ? JSON.parse(message) : message;
                            console.log('🔍 파싱된 메시지 데이터:', data);
                            
                            // Spring ChatMessageResponse.GlobalLobby 형식 처리
                            const processedMessage = {
                                id: data.messageId,
                                playerName: data.nickname,
                                content: data.content,
                                timestamp: data.timestamp,
                                messageType: data.messageType,
                                channelType: data.channelType,
                                chatType: 'lobby',
                                isSystem: data.messageType !== 'CHAT'
                            };
                            
                            console.log('📝 처리된 메시지:', processedMessage);
                            handleChatMessage(processedMessage);
                        } catch (error) {
                            console.error(`❌ 로비 채팅 메시지 처리 오류 (${topic}):`, error, message);
                        }
                    });
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
    
    console.log('✅ 채팅 구독 설정 완료:', chatTypes);
};

/**
 * 팀 채팅 구독 설정
 * @param {String} teamId - 팀 ID
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
    
    console.log('✅ 팀 채팅 구독 설정 완료:', teamId);
};

/**
 * 채팅 메시지 초기화
 * @param {String} chatType - 초기화할 채팅 유형 ('lobby', 'game', 'team', 'all')
 * @param {String} teamId - 팀 ID (팀 채팅 초기화 시)
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
    
    console.log('🧹 채팅 메시지 초기화:', chatType, teamId);
};

// 사용자 정보 초기화
initializeUserData();

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
    sendLobbyLeaveMessage,
    
    // 사용자 정보 관리
    initializeUserData
};
