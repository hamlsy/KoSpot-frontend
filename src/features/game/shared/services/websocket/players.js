import { ref, readonly } from 'vue';
import { subscribe, useDummyData } from './core';
import { createSystemMessage } from './chat';

/**
 * WebSocket 플레이어 상태 관리 기능
 * 플레이어 입장, 퇴장, 팀 변경 등의 이벤트를 처리합니다.
 */

// 플레이어 관련 상태
const activePlayers = ref([]); // 현재 접속중인 플레이어 목록
const teamPlayers = ref({}); // 팀별 플레이어 목록 (키: 팀ID, 값: 플레이어 배열)

/**
 * 플레이어 상태 변경 처리
 * 입장, 퇴장, 팀 변경 등의 이벤트를 처리합니다.
 * @param {Object} playerEvent - 플레이어 상태 변경 이벤트
 */
const handlePlayerStatusChange = (playerEvent) => {
    if (!playerEvent) return;
    
    const { eventType, player, previousTeamId } = playerEvent;
    
    // 이벤트 유형에 따른 처리
    switch (eventType) {
        case 'JOIN': // 플레이어 입장
            // 플레이어 목록에 추가
            if (!activePlayers.value.some(p => p.id === player.id)) {
                activePlayers.value.push(player);
            }
            
            // 팀 목록에 추가
            if (player.teamId) {
                if (!teamPlayers.value[player.teamId]) {
                    teamPlayers.value[player.teamId] = [];
                }
                
                // 팀에 이미 있는지 확인 후 추가
                if (!teamPlayers.value[player.teamId].some(p => p.id === player.id)) {
                    teamPlayers.value[player.teamId].push(player);
                }
            }
            
            // 시스템 메시지 추가 (입장 알림)
            createSystemMessage(`${player.nickname || '새 플레이어'}님이 입장하셨습니다.`);
            break;
            
        case 'LEAVE': // 플레이어 퇴장
            // 플레이어 목록에서 제거
            const leaveIndex = activePlayers.value.findIndex(p => p.id === player.id);
            if (leaveIndex !== -1) {
                activePlayers.value.splice(leaveIndex, 1);
            }
            
            // 팀 목록에서 제거
            if (player.teamId && teamPlayers.value[player.teamId]) {
                const teamIndex = teamPlayers.value[player.teamId].findIndex(p => p.id === player.id);
                if (teamIndex !== -1) {
                    teamPlayers.value[player.teamId].splice(teamIndex, 1);
                }
            }
            
            // 시스템 메시지 추가 (퇴장 알림)
            createSystemMessage(`${player.nickname || '플레이어'}님이 퇴장하셨습니다.`);
            break;
            
        case 'TEAM_CHANGE': // 플레이어 팀 변경
            // 이전 팀에서 제거
            if (previousTeamId && teamPlayers.value[previousTeamId]) {
                const prevTeamIndex = teamPlayers.value[previousTeamId].findIndex(p => p.id === player.id);
                if (prevTeamIndex !== -1) {
                    teamPlayers.value[previousTeamId].splice(prevTeamIndex, 1);
                }
            }
            
            // 새 팀에 추가
            if (player.teamId) {
                if (!teamPlayers.value[player.teamId]) {
                    teamPlayers.value[player.teamId] = [];
                }
                
                // 팀에 이미 있는지 확인 후 추가
                if (!teamPlayers.value[player.teamId].some(p => p.id === player.id)) {
                    teamPlayers.value[player.teamId].push(player);
                }
            }
            
            // 활성 플레이어 목록에서도 팀 정보 업데이트
            const playerIndex = activePlayers.value.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
                activePlayers.value[playerIndex].teamId = player.teamId;
            }
            
            // 시스템 메시지 추가 (팀 변경 알림)
            createSystemMessage(`${player.nickname || '플레이어'}님이 ${previousTeamId || '대기실'}에서 ${player.teamId || '대기실'}로 이동하셨습니다.`);
            break;
    }
};

/**
 * 플레이어 상태 구독 설정
 */
const setupPlayerSubscriptions = () => {
    // 플레이어 상태 변경 구독
    subscribe('/topic/game/players/status', (message) => {
        try {
            const data = typeof message === 'string' ? JSON.parse(message) : message;
            handlePlayerStatusChange(data);
        } catch (error) {
            console.error('플레이어 상태 변경 처리 오류:', error);
        }
    });
    
    console.log('플레이어 상태 구독 설정 완료');
};

export {
    // 상태 (읽기 전용)
    activePlayers: readonly(activePlayers),
    teamPlayers: readonly(teamPlayers),
    
    // 메서드
    handlePlayerStatusChange,
    setupPlayerSubscriptions
};
