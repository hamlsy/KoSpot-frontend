import { ref, readonly } from 'vue';
import { publish, subscribe, useDummyData } from './core';

/**
 * WebSocket 채팅 기능
 * 채팅 메시지 전송 및 수신, 채팅 기록 관리 기능을 제공합니다.
 */

// 채팅 관련 상태
const chatMessages = ref([]); // 전체 채팅 메시지 기록
const teamChatMessages = ref({}); // 팀별 채팅 메시지 기록 (키: 팀ID, 값: 메시지 배열)

/**
 * 채팅 메시지 전송
 * @param {String} message - 메시지 내용
 * @param {Object} player - 플레이어 정보 (아이디, 닉네임, 팀 등)
 * @param {String} chatType - 채팅 유형 ('team' 또는 'all')
 * @returns {Boolean} 전송 성공 여부
 */
const sendChatMessage = (message, player, chatType = 'team') => {
    if (!message || !player) return false;
    
    // 채팅 유형에 따라 다른 목적지 사용
    const destination = chatType === 'team' && player.teamId
        ? `/app/game/team/${player.teamId}/chat` // 팀 채팅
        : '/app/game/chat'; // 전체 채팅
    
    // 채팅 메시지 구성
    const chatMessage = {
        playerId: player.id,
        playerName: player.nickname || '익명',
        teamId: player.teamId,
        content: message,
        chatType: chatType,
        timestamp: new Date().toISOString()
    };
    
    // 더미 데이터 모드일 경우 로컬에서 처리
    if (useDummyData.value) {
        handleChatMessage(chatMessage);
        return true;
    }
    
    // 서버로 메시지 전송
    return publish(destination, chatMessage);
};

/**
 * 채팅 메시지 처리
 * 서버에서 수신한 채팅 메시지나 더미 메시지를 처리합니다.
 * @param {Object} message - 채팅 메시지 데이터
 */
const handleChatMessage = (message) => {
    // 전체 채팅 기록에 추가
    chatMessages.value.push(message);
    
    // 최대 100개만 유지 (메모리 관리)
    if (chatMessages.value.length > 100) {
        chatMessages.value = chatMessages.value.slice(-100);
    }
    
    // 팀 채팅인 경우 해당 팀 채팅 기록에도 추가
    if (message.chatType === 'team' && message.teamId) {
        if (!teamChatMessages.value[message.teamId]) {
            teamChatMessages.value[message.teamId] = [];
        }
        
        teamChatMessages.value[message.teamId].push(message);
        
        // 팀별로도 최대 50개만 유지
        if (teamChatMessages.value[message.teamId].length > 50) {
            teamChatMessages.value[message.teamId] = 
                teamChatMessages.value[message.teamId].slice(-50);
        }
    }
};

/**
 * 시스템 메시지 생성
 * @param {String} content - 메시지 내용
 * @param {String} teamId - 팀 ID (팀 채팅인 경우)
 * @returns {Object} 시스템 메시지 객체
 */
const createSystemMessage = (content, teamId = null) => {
    const systemMessage = {
        playerId: 'system',
        playerName: '시스템',
        content: content,
        timestamp: new Date().toISOString(),
        isSystem: true
    };
    
    if (teamId) {
        systemMessage.teamId = teamId;
        systemMessage.chatType = 'team';
    } else {
        systemMessage.chatType = 'all';
    }
    
    handleChatMessage(systemMessage);
    return systemMessage;
};

/**
 * 채팅 구독 설정
 * 전체 채팅과 팀 채팅 토픽을 구독합니다.
 */
const setupChatSubscriptions = () => {
    // 전체 채팅 구독
    subscribe('/topic/game/chat', (message) => {
        try {
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            handleChatMessage(data);
        } catch (error) {
            console.error('채팅 메시지 처리 오류:', error);
        }
    });
    
    console.log('채팅 구독 설정 완료');
};

// 읽기 전용 상태 생성
const readonlyChatMessages = readonly(chatMessages);
const readonlyTeamChatMessages = readonly(teamChatMessages);

export {
    // 상태 (읽기 전용)
    readonlyChatMessages as chatMessages,
    readonlyTeamChatMessages as teamChatMessages,
    
    // 메서드
    sendChatMessage,
    handleChatMessage,
    createSystemMessage,
    setupChatSubscriptions
};
