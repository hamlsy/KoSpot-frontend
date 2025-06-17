<template>
    <div class="player-markers-container">
      <transition-group 
        name="player-order" 
        tag="div" 
        class="player-markers"
      >
        <div 
          v-for="(player, index) in sortedPlayers" 
          :key="player.id" 
          class="player-marker"
          :class="{ 
            'current-user': player.id === props.currentUserId,
            'has-submitted': player.hasSubmitted,
            'correct-guess': playerCorrectGuess[player.id],
            'wrong-guess': playerWrongGuess[player.id],
            'team-mode': props.isTeamMode,
            'first-place': index === 0
          }"
          :style="getPlayerStyle(player)"
        >
          <!-- 플레이어 마커 이미지 -->
          <div class="marker-image">
            <img 
              :src="player.equippedMarker || '/assets/default-marker.png'" 
              alt="플레이어 마커"
            />
          </div>
          
          <!-- 플레이어 닉네임과 점수 -->
          <div class="marker-info">
            <div class="marker-nickname">
              {{ player.nickname }}
            </div>
            <div class="marker-score">
              {{ player.score || 0 }}점
            </div>
          </div>
          
          <!-- 채팅 말풍선 -->
          <div 
            v-if="playerChatMessages[player.id]" 
            class="chat-bubble"
            :class="{ 'fade-out': playerChatMessages[player.id].fading }"
          >
            {{ playerChatMessages[player.id].message }}
          </div>
          
          <!-- 점수 표시 애니메이션 -->
          <div 
            v-if="playerScoreAnimations[player.id]" 
            class="score-animation"
          >
            +{{ playerScoreAnimations[player.id] }}
          </div>
        </div>
      </transition-group>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  
  const props = defineProps({
    players: {
      type: Array,
      required: true
    },
    currentUserId: {
      type: String,
      required: true
    },
    isTeamMode: {
      type: Boolean,
      default: false
    },
    teams: {
      type: Array,
      default: () => []
    }
  });
  
  // 플레이어를 점수 순으로 정렬
  const sortedPlayers = computed(() => {
    return [...props.players].sort((a, b) => {
      // 점수 내림차순 정렬
      return (b.score || 0) - (a.score || 0);
    });
  });
  
  const playerChatMessages = ref({}); // { playerId: { message, fading, timerId } }
  const playerScoreAnimations = ref({}); // { playerId: score }
  const playerCorrectGuess = ref({}); // { playerId: boolean }
  const playerWrongGuess = ref({}); // { playerId: boolean }
  
  // 팀 색상 가져오기
  const getTeamColor = (teamId) => {
    if (!props.isTeamMode) return '#666';
    
    const team = props.teams.find(t => t.id === teamId);
    if (!team) return '#666';
    
    const teamColors = {
      'red': '#e53e3e',
      'blue': '#3182ce',
      'green': '#38a169',
      'yellow': '#d69e2e',
      'purple': '#805ad5'
    };
    
    return teamColors[team.color] || '#666';
  };
  
  // 플레이어 스타일 계산
  const getPlayerStyle = (player) => {
    const style = {};
    
    // 팀 모드일 경우 팀 색상 적용
    if (props.isTeamMode && player.teamId) {
      style.borderColor = getTeamColor(player.teamId);
    }
    
    return style;
  };
  
  // 채팅 메시지 표시
  const showChatMessage = (playerId, message) => {
    // 이전 타이머가 있으면 제거
    if (playerChatMessages[playerId] && playerChatMessages[playerId].timerId) {
      clearTimeout(playerChatMessages[playerId].timerId);
    }
    
    // 새 메시지 설정
    playerChatMessages[playerId] = {
      message,
      fading: false,
      timerId: null
    };
    
    // 5초 후 페이드아웃 시작
    const fadeTimerId = setTimeout(() => {
      if (playerChatMessages[playerId]) {
        playerChatMessages[playerId] = {
          ...playerChatMessages[playerId],
          fading: true
        };
        
        // 페이드아웃 후 제거
        setTimeout(() => {
          if (playerChatMessages[playerId]) {
            delete playerChatMessages[playerId];
          }
        }, 1000);
      }
    }, 5000);
    
    // 타이머 ID 저장
    playerChatMessages[playerId] = {
      ...playerChatMessages[playerId],
      timerId: fadeTimerId
    };
  };
  
  // 점수 애니메이션 표시
  const showScoreAnimation = (playerId, score) => {
    // 점수 애니메이션 설정
    playerScoreAnimations[playerId] = score;
    
    // 2초 후 애니메이션 제거
    setTimeout(() => {
      delete playerScoreAnimations[playerId];
    }, 2000);
  };
  
  // 정답 애니메이션 표시
  const showCorrectGuessAnimation = (playerId) => {
    // 정답 애니메이션 설정
    playerCorrectGuess[playerId] = true;
    
    // 2초 후 애니메이션 제거
    setTimeout(() => {
      playerCorrectGuess[playerId] = false;
    }, 2000);
  };
  
  // 오답 애니메이션 표시
  const showWrongGuessAnimation = (playerId) => {
    // 오답 애니메이션 설정
    playerWrongGuess[playerId] = true;
    
    // 2초 후 애니메이션 제거
    setTimeout(() => {
      playerWrongGuess[playerId] = false;
    }, 2000);
  };
  
  // 외부로 메서드 노출
  defineExpose({
    showChatMessage,
    showScoreAnimation,
    showCorrectGuessAnimation,
    showWrongGuessAnimation
  });
  </script>
  
  <style scoped>
  .player-markers-container {
    position: fixed;
    bottom: 70px; /* 채팅 입력 위에 위치 */
    left: 0;
    width: 100%;
    padding: 1rem;
    z-index: 50;
    pointer-events: none; /* 마커 영역이 클릭을 방해하지 않도록 */
  }
  
  .player-markers {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 1.5rem;
    max-width: 100%;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
    padding: 1.5rem 1rem 1rem;
    border-radius: 16px 16px 0 0;
    backdrop-filter: blur(5px);
  }
  
  .player-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    transition: all 0.5s ease;
    transform-origin: bottom center;
  }
  
  .player-marker.current-user .marker-image {
    border: 3px solid #4cd964;
    box-shadow: 0 0 0 2px rgba(76, 217, 100, 0.3), 0 0 15px rgba(76, 217, 100, 0.5);
  }
  
  .player-marker.has-submitted .marker-image {
    animation: pulse 2s infinite;
  }
  
  .player-marker.correct-guess .marker-image {
    animation: correctGuess 1s ease-out;
    border-color: #4cd964;
    box-shadow: 0 0 20px rgba(76, 217, 100, 0.7);
  }
  
  .player-marker.wrong-guess .marker-image {
    animation: wrongGuess 1s ease-out;
    border-color: #ff3b30;
    box-shadow: 0 0 20px rgba(255, 59, 48, 0.7);
  }
  
  .player-marker.first-place .marker-image {
    border-color: #ffd700;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  }
  
  .marker-image {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #e2e8f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .marker-image img {
    width: 80%;
    height: 80%;
    object-fit: contain;
  }
  
  .marker-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 0.5rem;
  }
  
  .marker-nickname {
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
    background: rgba(0, 0, 0, 0.6);
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    max-width: 100px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.25rem;
  }
  
  .marker-score {
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
    background: rgba(0, 0, 0, 0.4);
    padding: 0.15rem 0.4rem;
    border-radius: 10px;
    text-align: center;
  }
  
  .chat-bubble {
    position: absolute;
    top: -70px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    color: #333;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    max-width: 180px;
    font-size: 0.85rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    word-break: break-word;
    text-align: center;
    pointer-events: none;
    opacity: 1;
    transition: opacity 1s ease;
    z-index: 5;
  }
  
  .chat-bubble:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid white;
  }
  
  .chat-bubble.fade-out {
    opacity: 0;
  }
  
  .score-animation {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #4cd964, #34c759);
    color: white;
    padding: 0.3rem 0.6rem;
    border-radius: 8px;
    font-weight: bold;
    font-size: 1rem;
    animation: scorePopup 2s ease-out;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(76, 217, 100, 0.4);
    z-index: 5;
  }
  
  .team-mode .marker-image {
    border-width: 4px;
  }
  
  /* 플레이어 순서 변경 애니메이션 */
  .player-order-move {
    transition: transform 0.8s ease;
  }
  
  .player-order-enter-active,
  .player-order-leave-active {
    transition: all 0.5s ease;
  }
  
  .player-order-enter-from,
  .player-order-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 6px 12px rgba(76, 217, 100, 0.4);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }
  
  @keyframes scorePopup {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    20% {
      opacity: 1;
      transform: translateX(-50%) translateY(-10px);
    }
    80% {
      opacity: 1;
      transform: translateX(-50%) translateY(-10px);
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(-30px);
    }
  }
  
  @keyframes correctGuess {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15) translateY(-10px);
    }
    100% {
      transform: scale(1);
    }
  }
  
  @keyframes wrongGuess {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    50% {
      transform: translateX(5px);
    }
    75% {
      transform: translateX(-5px);
    }
    100% {
      transform: translateX(0);
    }
  }
  
  /* 반응형 스타일 */
  @media (max-width: 768px) {
    .player-markers-container {
      bottom: 60px;
    }
    
    .player-markers {
      gap: 1rem;
      padding: 1rem 0.5rem 0.5rem;
    }
    
    .marker-image {
      width: 45px;
      height: 45px;
    }
    
    .marker-nickname {
      font-size: 0.7rem;
      max-width: 80px;
      margin-bottom: 0.15rem;
    }
    
    .marker-score {
      font-size: 0.65rem;
    }
    
    .chat-bubble {
      max-width: 120px;
      font-size: 0.75rem;
      top: -60px;
    }
    
    .score-animation {
      font-size: 0.85rem;
      padding: 0.2rem 0.4rem;
    }
  }
  </style>