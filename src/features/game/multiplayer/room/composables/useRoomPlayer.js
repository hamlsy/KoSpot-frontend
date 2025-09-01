import { ref, computed, watch } from 'vue';

/**
 * Room Player 관리 컴포저블
 * 플레이어 목록, 팀 관리, 플레이어 상태 변경 등을 관리합니다.
 */
export function useRoomPlayer(props) {
  // 플레이어 상태
  const localPlayers = ref([...props.players]);
  const playerMessages = ref({});
  
  // 사용 가능한 팀 목록
  const availableTeams = computed(() => [
    { id: 'blue', name: '블루 팀' },
    { id: 'red', name: '레드 팀' },
    { id: 'green', name: '그린 팀' },
    { id: 'yellow', name: '옐로우 팀' }
  ]);
  
  // 각 팀별 최대 플레이어 수
  const maxPlayersPerTeam = computed(() => 4);

  /**
   * props 변경 시 로컬 플레이어 목록 업데이트
   */
  watch(() => props.players, (newVal) => {
    localPlayers.value = [...newVal];
  }, { deep: true });

  /**
   * 현재 플레이어 닉네임 가져오기
   */
  const getCurrentPlayerNickname = (currentUserId) => {
    const currentPlayer = localPlayers.value.find(p => p.id === currentUserId);
    return currentPlayer?.nickname || '플레이어';
  };

  /**
   * 현재 플레이어 팀 가져오기
   */
  const getCurrentPlayerTeam = (currentUserId) => {
    const currentPlayer = localPlayers.value.find(p => p.id === currentUserId);
    return currentPlayer?.teamId || null;
  };

  /**
   * 플레이어 목록 업데이트 (Redis에서 받은 최신 데이터로 교체)
   */
  const updatePlayerList = (newPlayers) => {
    console.log('🔄 플레이어 목록 업데이트:', newPlayers);
    
    if (!Array.isArray(newPlayers)) {
      console.warn('⚠️ 잘못된 플레이어 목록 형식:', newPlayers);
      return;
    }
    
    // 기존 플레이어 목록을 새로운 목록으로 교체
    localPlayers.value = [...newPlayers];
    
    console.log(`✅ 플레이어 목록 업데이트 완료: ${newPlayers.length}명`);
  };

  /**
   * 플레이어 상태 변경 처리 (기존 방식 - 호환성 유지)
   */
  const handlePlayerStatusChange = (playerEvent, addSystemMessage) => {
    console.log('🔄 플레이어 상태 변경:', playerEvent);
    
    if (!playerEvent || !playerEvent.eventType || !playerEvent.player) {
      console.warn('⚠️ 잘못된 플레이어 이벤트 형식:', playerEvent);
      return;
    }
    
    const { eventType, player } = playerEvent;
    
    switch (eventType) {
      case 'JOIN':
        // 플레이어 입장 처리
        if (!localPlayers.value.find(p => p.id === player.id)) {
          localPlayers.value.push(player);
          
          // 시스템 메시지 추가
          if (addSystemMessage) {
            addSystemMessage(`${player.nickname || '플레이어'}님이 방에 참가했습니다.`);
          }
          
          console.log(`✅ 플레이어 입장: ${player.nickname} (${player.id})`);
        }
        break;
        
      case 'LEAVE': {
        // 플레이어 퇴장 처리
        const leaveIndex = localPlayers.value.findIndex(p => p.id === player.id);
        if (leaveIndex !== -1) {
          localPlayers.value.splice(leaveIndex, 1);
          
          // 시스템 메시지 추가
          if (addSystemMessage) {
            addSystemMessage(`${player.nickname || '플레이어'}님이 방을 나갔습니다.`);
          }
          
          console.log(`✅ 플레이어 퇴장: ${player.nickname} (${player.id})`);
        }
        break;
      }
        
      case 'KICKED': {
        // 플레이어 강퇴 처리
        const kickIndex = localPlayers.value.findIndex(p => p.id === player.id);
        if (kickIndex !== -1) {
          localPlayers.value.splice(kickIndex, 1);
          
          // 시스템 메시지 추가
          if (addSystemMessage) {
            addSystemMessage(`${player.nickname || '플레이어'}님이 방에서 강퇴되었습니다.`);
          }
          
          console.log(`✅ 플레이어 강퇴: ${player.nickname} (${player.id})`);
        }
        break;
      }
        
      case 'TEAM_CHANGE': {
        // 팀 변경 처리
        const teamChangeIndex = localPlayers.value.findIndex(p => p.id === player.id);
        if (teamChangeIndex !== -1) {
          localPlayers.value[teamChangeIndex] = {
            ...localPlayers.value[teamChangeIndex],
            teamId: player.teamId
          };
          
          // 시스템 메시지 추가
          if (addSystemMessage) {
            const teamName = availableTeams.value.find(t => t.id === player.teamId)?.name || '팀';
            addSystemMessage(`${player.nickname || '플레이어'}님이 ${teamName}으로 팀을 변경했습니다.`);
          }
          
          console.log(`✅ 팀 변경: ${player.nickname} -> ${player.teamId}`);
        }
        break;
      }
        
      default:
        console.warn('⚠️ 알 수 없는 플레이어 이벤트:', eventType);
    }
    
    return localPlayers.value;
  };



  /**
   * 팀 모드에서 게임 시작 가능 여부 확인
   */
  const canStartTeamGame = (isTeamMode) => {
    if (!isTeamMode) return true;
    
    const teamCounts = {};
    localPlayers.value.forEach(player => {
      if (player.teamId) {
        teamCounts[player.teamId] = (teamCounts[player.teamId] || 0) + 1;
      }
    });
    
    // 최소 2개 이상의 팀에 플레이어가 있어야 함
    const teamsWithPlayers = Object.keys(teamCounts).length;
    if (teamsWithPlayers < 2) return false;
    
    // 각 팀에 최소 1명 이상의 플레이어가 있어야 함
    for (const team of availableTeams.value) {
      if (!teamCounts[team.id] || teamCounts[team.id] < 1) {
        return false;
      }
    }
    
    return true;
  };

  /**
   * 게임 시작 가능 여부 확인
   */
  const canStartGame = (isTeamMode) => {
    // 최소 2명 이상의 플레이어가 있어야 시작 가능
    if (localPlayers.value.length < 2) return false;
    
    // 팀 모드인 경우 추가 검증
    if (isTeamMode) {
      return canStartTeamGame(true);
    }
    
    return true;
  };

  /**
   * 팀별 플레이어 수 계산
   */
  const getTeamPlayerCount = (teamId) => {
    return localPlayers.value.filter(player => player.teamId === teamId).length;
  };

  /**
   * 플레이어가 특정 팀에 참가 가능한지 확인
   */
  const canJoinTeam = (teamId) => {
    const currentCount = getTeamPlayerCount(teamId);
    return currentCount < maxPlayersPerTeam.value;
  };

  /**
   * 플레이어 메시지 업데이트
   */
  const updatePlayerMessage = (playerId, message) => {
    playerMessages.value[playerId] = message;
  };

  /**
   * 플레이어 메시지 삭제
   */
  const clearPlayerMessage = (playerId) => {
    delete playerMessages.value[playerId];
  };

  return {
    // 플레이어 상태
    localPlayers: computed(() => localPlayers.value),
    playerMessages: computed(() => playerMessages.value),
    availableTeams,
    maxPlayersPerTeam,
    
    // 플레이어 관리 메서드
    getCurrentPlayerNickname,
    getCurrentPlayerTeam,
    handlePlayerStatusChange,
    updatePlayerList, // 새로 추가된 메서드
    canStartGame,
    canStartTeamGame,
    getTeamPlayerCount,
    canJoinTeam,
    updatePlayerMessage,
    clearPlayerMessage
  };
} 