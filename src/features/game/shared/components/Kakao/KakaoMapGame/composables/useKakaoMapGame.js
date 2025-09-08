// src/shared/composables/kakao/useKakaoMapGame.js
import { useKakaoMapState } from './useKakaoMapState';
import { useKakaoMapControls } from './useKakaoMapControls';
import { useKakaoMapTeamVote } from './useKakaoMapTeamVote';

export function useKakaoMapGame(props, emit) {
  const { 
    marker, 
  } = useKakaoMapState();
  
  const { getMarkerPosition } = useKakaoMapControls(props, emit);
  
  // 팀 투표 기능 - individual 모드에서는 사용하지 않음
  const teamVote = props.gameMode === 'individual' ? null : useKakaoMapTeamVote(props, emit);
  
  const submitAnswer = async () => {
    if (!marker.value) return;
    
    try {
      const position = await getMarkerPosition();
      emit('submit-answer', position);
    } catch (error) {
      console.error('마커 위치를 가져오는 중 오류 발생:', error);
    }
  };
  
  // 팀 투표 시작 함수
  const startTeamVoting = async (playerInfo) => {
    if (!marker.value || !teamVote) return null;
    
    try {
      // useKakaoMapTeamVote의 startTeamVote 함수 호출
      const overlay = await teamVote.startTeamVote(playerInfo);
      return overlay;
    } catch (error) {
      console.error('팀 투표 시작 중 오류 발생:', error);
      return null;
    }
  };

  // 투표에 응답하는 함수
  const onVoteAnswer = (voteId, isApproved) => {
    // 투표 응답 처리 로직 추가 가능
    emit('vote-response', { voteId, isApproved });
  };

  // 투표 배지 업데이트 함수
  const updateVotingBadge = (count) => {
    // 투표 배지 업데이트 로직 추가 가능
    emit('update-voting-badge', count);
  };

  return {
    submitAnswer,
    startTeamVoting,
    onVoteAnswer,
    updateVotingBadge
  };
}
