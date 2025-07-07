import { 
    isConnected, 
    useDummyData, 
    connect, 
    disconnect, 
    subscribe, 
    unsubscribe, 
    publish, 
    setDummyMode, 
    addConnectionCallback 
} from './core';

import {
    chatMessages,
    teamChatMessages,
    sendChatMessage,
    handleChatMessage,
    createSystemMessage,
    setupChatSubscriptions
} from './chat';

import {
    activePlayers,
    teamPlayers,
    handlePlayerStatusChange,
    setupPlayerSubscriptions
} from './players';

import {
    gameState,
    handleGameStateChange,
    setupGameSubscriptions
} from './game';

import {
    simulateMessage,
    simulateChatMessage,
    simulatePlayerJoin,
    simulatePlayerLeave,
    simulatePlayerTeamChange,
    simulateGameStart,
    simulateGameEnd,
    simulateRoundChange
} from './dummy';

/**
 * 기본 구독 설정
 * 웹소켓 연결 성공 시 기본적으로 구독할 채널들을 설정합니다.
 */
const setupDefaultSubscriptions = () => {
    setupChatSubscriptions();
    setupPlayerSubscriptions();
    setupGameSubscriptions();
    console.log('모든 기본 구독 설정 완료');
};

/**
 * 로비 전용 구독 설정
 * 로비에서만 필요한 채널들을 설정합니다.
 */
const setupLobbySubscriptions = () => {
    setupChatSubscriptions(['lobby']);
    console.log('로비 전용 구독 설정 완료');
};

/**
 * WebSocket 관리자
 * 게임 시작 전 대기실부터 게임 화면까지 웹소켓 연결을 유지하기 위한 싱글톤 서비스
 */
const webSocketManager = {
    // 상태 (읽기 전용)
    isConnected,
    useDummyData,
    chatMessages,
    teamChatMessages,
    activePlayers,
    teamPlayers,
    gameState,
    
    // 웹소켓 기본 기능
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    
    // 채팅 관련 기능
    sendChatMessage,
    handleChatMessage,
    createSystemMessage,
    
    // 플레이어 및 게임 상태 관리
    handlePlayerStatusChange,
    handleGameStateChange,
    
    // 더미 데이터 관련
    setDummyMode,
    simulateMessage,
    simulateChatMessage,
    simulatePlayerJoin,
    simulatePlayerLeave,
    simulatePlayerTeamChange,
    simulateGameStart,
    simulateGameEnd,
    simulateRoundChange,
    
    // 구독 관리
    setupDefaultSubscriptions,
    setupLobbySubscriptions
};

export default webSocketManager;
