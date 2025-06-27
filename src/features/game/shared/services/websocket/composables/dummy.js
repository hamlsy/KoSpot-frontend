import { useDummyData } from './core';
import { handleChatMessage } from './chat';
import { handlePlayerStatusChange } from './players';
import { handleGameStateChange } from './game';

/**
 * WebSocket 더미 데이터 시뮬레이션 기능
 * 개발 및 테스트 환경에서 백엔드 없이 기능을 테스트할 수 있도록 합니다.
 */

/**
 * 더미 메시지 시뮤레이션
 * 개발 및 테스트 환경에서 사용합니다.
 * @param {Object} message - 시뮤레이션할 메시지 데이터
 * @param {Function} callback - 시뮤레이션 메시지를 처리할 콜백 함수
 */
const simulateMessage = (message, callback = null) => {
    if (!useDummyData.value) {
        console.warn('더미 데이터 모드가 아닐 때는 시뮤레이션을 사용할 수 없습니다.');
        return;
    }
    
    // 메시지 형식 가공
    const simulatedMessage = {
        body: typeof message === 'string' ? message : JSON.stringify(message)
    };
    
    // 콜백이 있으면 콜백 실행, 없으면 메시지 유형에 따라 기본 처리
    if (callback) {
        setTimeout(() => callback(simulatedMessage), 100);
    } else {
        // 메시지 유형 추측
        try {
            const data = typeof simulatedMessage.body === 'string' 
                ? JSON.parse(simulatedMessage.body) 
                : simulatedMessage.body;
            
            // 채팅 메시지
            if (data.content && (data.playerId || data.playerName)) {
                setTimeout(() => handleChatMessage(data), 100);
            }
            // 플레이어 상태 변경
            else if (data.eventType && data.player) {
                setTimeout(() => handlePlayerStatusChange(data), 100);
            }
            // 게임 상태 변경
            else if (data.status !== undefined) {
                setTimeout(() => handleGameStateChange(data), 100);
            }
        } catch (error) {
            console.error('더미 메시지 시뮤레이션 오류:', error);
        }
    }
};

/**
 * 더미 채팅 메시지 생성
 * @param {String} content - 메시지 내용
 * @param {String} playerName - 플레이어 이름
 * @param {String} teamId - 팀 ID (팀 채팅인 경우)
 */
const simulateChatMessage = (content, playerName = '테스트 유저', teamId = null) => {
    const chatMessage = {
        playerId: `dummy-${Date.now()}`,
        playerName: playerName,
        content: content,
        timestamp: new Date().toISOString(),
        chatType: teamId ? 'team' : 'all'
    };
    
    if (teamId) {
        chatMessage.teamId = teamId;
    }
    
    simulateMessage(chatMessage);
};

/**
 * 더미 플레이어 입장 이벤트 생성
 * @param {String} playerName - 플레이어 이름
 * @param {String} teamId - 팀 ID (선택 사항)
 */
const simulatePlayerJoin = (playerName = '테스트 유저', teamId = null) => {
    const playerId = `dummy-${Date.now()}`;
    const playerEvent = {
        eventType: 'JOIN',
        player: {
            id: playerId,
            nickname: playerName,
            teamId: teamId
        }
    };
    
    simulateMessage(playerEvent);
    return playerId;
};

/**
 * 더미 플레이어 퇴장 이벤트 생성
 * @param {String} playerId - 플레이어 ID
 * @param {String} playerName - 플레이어 이름
 * @param {String} teamId - 팀 ID (선택 사항)
 */
const simulatePlayerLeave = (playerId, playerName = '테스트 유저', teamId = null) => {
    const playerEvent = {
        eventType: 'LEAVE',
        player: {
            id: playerId,
            nickname: playerName,
            teamId: teamId
        }
    };
    
    simulateMessage(playerEvent);
};

/**
 * 더미 플레이어 팀 변경 이벤트 생성
 * @param {String} playerId - 플레이어 ID
 * @param {String} playerName - 플레이어 이름
 * @param {String} newTeamId - 새 팀 ID
 * @param {String} previousTeamId - 이전 팀 ID
 */
const simulatePlayerTeamChange = (playerId, playerName = '테스트 유저', newTeamId, previousTeamId) => {
    const playerEvent = {
        eventType: 'TEAM_CHANGE',
        player: {
            id: playerId,
            nickname: playerName,
            teamId: newTeamId
        },
        previousTeamId: previousTeamId
    };
    
    simulateMessage(playerEvent);
};

/**
 * 더미 게임 시작 이벤트 생성
 * @param {String} gameMode - 게임 모드 ('team' 또는 'individual')
 * @param {Number} totalRounds - 총 라운드 수
 */
const simulateGameStart = (gameMode = 'team', totalRounds = 3) => {
    const gameEvent = {
        status: 'playing',
        currentRound: 1,
        totalRounds: totalRounds,
        timeRemaining: 300, // 5분
        gameMode: gameMode,
        gameId: `game-${Date.now()}`
    };
    
    simulateMessage(gameEvent);
};

/**
 * 더미 게임 종료 이벤트 생성
 */
const simulateGameEnd = () => {
    const gameEvent = {
        status: 'finished',
        timeRemaining: 0
    };
    
    simulateMessage(gameEvent);
};

/**
 * 더미 라운드 변경 이벤트 생성
 * @param {Number} currentRound - 현재 라운드
 * @param {Number} totalRounds - 총 라운드 수
 */
const simulateRoundChange = (currentRound, totalRounds) => {
    const gameEvent = {
        status: 'playing',
        currentRound: currentRound,
        totalRounds: totalRounds,
        timeRemaining: 300 // 5분
    };
    
    simulateMessage(gameEvent);
};

export {
    // 메서드
    simulateMessage,
    simulateChatMessage,
    simulatePlayerJoin,
    simulatePlayerLeave,
    simulatePlayerTeamChange,
    simulateGameStart,
    simulateGameEnd,
    simulateRoundChange
};
