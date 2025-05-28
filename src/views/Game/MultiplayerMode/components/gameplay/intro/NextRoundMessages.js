/**
 * 다음 라운드로 넘어갈 때 표시되는 메시지 모음
 * 사용자의 등수에 따라 다른 메시지가 표시됩니다.
 */

// 상위권 메시지 (1~33%)
export const topRankMessages = [
  "훌륭해요!",
  "계속 이대로만!",
  "선두를 유지하세요!",
  "최고의 실력이에요!",
  "우승을 노려봐요!",
  "놀라운 실력이에요!",
  "당신을 따라잡기 힘들어요!",
  "완벽해요!"
];

// 중위권 메시지 (34~66%)
export const midRankMessages = [
  "좋은 페이스예요!",
  "조금만 더 힘내세요!",
  "아직 기회가 있어요!",
  "상위권을 노려보세요!",
  "지금부터가 중요해요!",
  "조금만 더 노력하면 상위권도 가능해요!",
  "계속 도전하세요!" 
];

// 하위권 메시지 (67~100%)
export const bottomRankMessages = [
  "포기하지 마세요!",
  "집중하세요!",
  "할 수 있어요!",
  "더 좋은 결과가 있을 거예요!",
  "끝까지 최선을 다하세요!"
];

/**
 * 사용자의 등수에 따라 적절한 메시지를 랜덤하게 반환합니다.
 * @param {number} userRank - 사용자의 현재 등수
 * @param {number} totalPlayers - 전체 플레이어 수
 * @returns {string} 랜덤하게 선택된 메시지
 */
export function getRandomMessageByRank(userRank, totalPlayers) {
  // 상위/중위/하위 구분을 위한 경계값 계산
  const topThreshold = Math.ceil(totalPlayers * 0.33);
  const midThreshold = Math.ceil(totalPlayers * 0.66);
  
  let messageArray;
  
  if (userRank <= topThreshold) {
    // 상위권
    messageArray = topRankMessages;
  } else if (userRank <= midThreshold) {
    // 중위권
    messageArray = midRankMessages;
  } else {
    // 하위권
    messageArray = bottomRankMessages;
  }
  
  // 랜덤 메시지 선택
  const randomIndex = Math.floor(Math.random() * messageArray.length);
  return messageArray[randomIndex];
}
