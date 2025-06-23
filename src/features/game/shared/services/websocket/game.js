import { ref, readonly } from 'vue';
import { subscribe } from './core';
import { createSystemMessage } from './chat';

/**
 * WebSocket 게임 상태 관리 기능
 * 게임 시작, 종료, 라운드 변경 등의 이벤트를 처리합니다.
 */

// 게임 상태
const gameState = ref({
    status: 'waiting', // 'waiting', 'playing', 'finished'
    currentRound: 0,
    totalRounds: 0,
    timeRemaining: 0,
    gameMode: null, // 'team' 또는 'individual'
    gameId: null
});

/**
 * 게임 상태 변경 처리
 * 게임 시작, 종료, 라운드 변경 등의 이벤트를 처리합니다.
 * @param {Object} gameEvent - 게임 상태 변경 이벤트
 */
const handleGameStateChange = (gameEvent) => {
    if (!gameEvent) return;
    
    // 이전 상태 저장
    const previousStatus = gameState.value.status;
    
    // 게임 상태 업데이트
    gameState.value = {
        ...gameState.value,
        ...gameEvent
    };
    
    // 상태 변경에 따른 시스템 메시지 생성
    if (previousStatus !== gameEvent.status) {
        switch (gameEvent.status) {
            case 'playing': // 게임 시작
                if (previousStatus === 'waiting') {
                    // 게임 시작 메시지
                    createSystemMessage(`게임이 시작되었습니다. 라운드 ${gameEvent.currentRound}/${gameEvent.totalRounds}`);
                } else {
                    // 라운드 변경 메시지
                    createSystemMessage(`라운드 ${gameEvent.currentRound}/${gameEvent.totalRounds} 시작`);
                }
                break;
                
            case 'waiting': // 대기 상태로 변경
                if (previousStatus === 'playing') {
                    // 라운드 종료 메시지
                    createSystemMessage(`라운드가 종료되었습니다. 다음 라운드를 준비해주세요.`);
                }
                break;
                
            case 'finished': // 게임 종료
                // 게임 종료 메시지
                createSystemMessage(`게임이 종료되었습니다.`);
                break;
        }
    } else if (gameEvent.status === 'playing' && gameEvent.currentRound !== gameState.value.currentRound) {
        // 라운드 변경 메시지
        createSystemMessage(`라운드 ${gameEvent.currentRound}/${gameEvent.totalRounds} 시작`);
    }
    
    // 타이머 변경 처리
    if (gameEvent.timeRemaining !== undefined && gameEvent.timeRemaining <= 10 && gameEvent.timeRemaining > 0) {
        // 10초 이하로 남았을 때 카운트다운 메시지
        createSystemMessage(`${gameEvent.timeRemaining}초 남았습니다!`);
    }
};

/**
 * 게임 상태 구독 설정
 */
const setupGameSubscriptions = () => {
    // 게임 상태 변경 구독
    subscribe('/topic/game/state', (message) => {
        try {
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            handleGameStateChange(data);
        } catch (error) {
            console.error('게임 상태 변경 처리 오류:', error);
        }
    });
    
    console.log('게임 상태 구독 설정 완료');
};

export {
    // 상태 (읽기 전용)
    gameState: readonly(gameState),
    
    // 메서드
    handleGameStateChange,
    setupGameSubscriptions
};
