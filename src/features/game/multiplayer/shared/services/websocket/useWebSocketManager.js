/**
 * 전역 WebSocket 관리자
 * 게임 시작 전 대기실부터 게임 화면까지 웹소켓 연결을 유지하기 위한 싱글톤 서비스
 * 채팅, 플레이어 상태 관리, 팀 마커 공유 등을 처리합니다.
 *
 * 이 파일은 모듈화된 WebSocket 관리자를 가져와서 기존 인터페이스와 호환되도록 제공합니다.
 * 실제 구현은 ./composables 디렉토리의 모듈들에 있습니다.
 */
import webSocketManager from './composables';

/**
 * WebSocket 관리자 컴포저블
 * @returns {Object} WebSocket 관리 관련 함수와 상태를 포함한 객체
 */
function useWebSocketManager() {
    // 모듈화된 WebSocket 관리자에서 필요한 기능과 상태를 가져옵니다.
    return {
        // 상태 (읽기 전용)
        isConnected: webSocketManager.isConnected,
        useDummyData: webSocketManager.useDummyData,
        chatMessages: webSocketManager.chatMessages,
        teamChatMessages: webSocketManager.teamChatMessages,
        activePlayers: webSocketManager.activePlayers,
        teamPlayers: webSocketManager.teamPlayers,
        gameState: webSocketManager.gameState,
        
        // 웹소켓 기본 기능
        connect: webSocketManager.connect,
        disconnect: webSocketManager.disconnect,
        deactivate: webSocketManager.deactivate,
        subscribe: webSocketManager.subscribe,
        unsubscribe: webSocketManager.unsubscribe,
        publish: webSocketManager.publish,
        
        // 채팅 관련 기능
        sendChatMessage: webSocketManager.sendChatMessage,
        handleChatMessage: webSocketManager.handleChatMessage,
        createSystemMessage: webSocketManager.createSystemMessage,
        
        // 플레이어 및 게임 상태 관리
        handlePlayerStatusChange: webSocketManager.handlePlayerStatusChange,
        handleGameStateChange: webSocketManager.handleGameStateChange,
        
        // 더미 데이터 관련
        setDummyMode: webSocketManager.setDummyMode,
        simulateMessage: webSocketManager.simulateMessage,
        simulateChatMessage: webSocketManager.simulateChatMessage,
        simulatePlayerJoin: webSocketManager.simulatePlayerJoin,
        simulatePlayerLeave: webSocketManager.simulatePlayerLeave,
        simulatePlayerTeamChange: webSocketManager.simulatePlayerTeamChange,
        simulateGameStart: webSocketManager.simulateGameStart,
        simulateGameEnd: webSocketManager.simulateGameEnd,
        simulateRoundChange: webSocketManager.simulateRoundChange,
        
        // 구독 관리
        setupDefaultSubscriptions: webSocketManager.setupDefaultSubscriptions,
        setupLobbySubscriptions: webSocketManager.setupLobbySubscriptions
    };
}

export default useWebSocketManager;
