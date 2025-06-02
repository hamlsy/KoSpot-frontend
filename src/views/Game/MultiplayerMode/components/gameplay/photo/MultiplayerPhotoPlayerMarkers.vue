<template>
  <div class="player-markers-container">
    <div class="player-markers">
      <div 
        v-for="player in props.players" 
        :key="player.id" 
        class="player-marker"
        :class="{ 
          'current-user': player.id === props.currentUserId,
          'has-submitted': player.hasSubmitted,
          'team-mode': props.isTeamMode
        }"
        :style="props.isTeamMode ? { borderColor: getTeamColor(player.teamId) } : {}"
      >
        <!-- 플레이어 마커 이미지 -->
        <div class="marker-image">
          <img 
            :src="player.equippedMarker || '/assets/default-marker.png'" 
            alt="플레이어 마커"
          />
        </div>
        
        <!-- 플레이어 닉네임 -->
        <div class="marker-nickname">
          {{ player.nickname }}
        </div>
        
        <!-- 채팅 말풍선 -->
        <div 
          v-if="playerChatMessages.value[player.id]" 
          class="chat-bubble"
          :class="{ 'fade-out': playerChatMessages.value[player.id].fading }"
        >
          {{ playerChatMessages.value[player.id].message }}
        </div>
        
        <!-- 점수 표시 애니메이션 -->
        <div 
          v-if="playerScoreAnimations.value[player.id]" 
          class="score-animation"
        >
          +{{ playerScoreAnimations.value[player.id] }}
        </div>
      </div>
    </div>
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

const playerChatMessages = ref({}); // { playerId: { message, fading, timerId } }
const playerScoreAnimations = ref({}); // { playerId: score }

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

// 채팅 메시지 표시
const showChatMessage = (playerId, message) => {
  // 이전 타이머가 있으면 제거
  if (playerChatMessages.value[playerId] && playerChatMessages.value[playerId].timerId) {
    clearTimeout(playerChatMessages.value[playerId].timerId);
  }
  
  // 새 메시지 설정
  playerChatMessages.value[playerId] = {
    message,
    fading: false,
    timerId: null
  };
  
  // 5초 후 페이드아웃 시작
  const fadeTimerId = setTimeout(() => {
    if (playerChatMessages.value[playerId]) {
      playerChatMessages.value[playerId] = {
        ...playerChatMessages.value[playerId],
        fading: true
      };
      
      // 페이드아웃 후 제거
      setTimeout(() => {
        if (playerChatMessages.value[playerId]) {
          delete playerChatMessages.value[playerId];
        }
      }, 1000);
    }
  }, 5000);
  
  // 타이머 ID 저장
  playerChatMessages.value[playerId] = {
    ...playerChatMessages.value[playerId],
    timerId: fadeTimerId
  };
};

// 점수 애니메이션 표시
const showScoreAnimation = (playerId, score) => {
  // 점수 애니메이션 설정
  playerScoreAnimations.value[playerId] = score;
  
  // 2초 후 애니메이션 제거
  setTimeout(() => {
    delete playerScoreAnimations.value[playerId];
  }, 2000);
};

// 외부로 메서드 노출
defineExpose({
  showChatMessage,
  showScoreAnimation
});
</script>

<style scoped>
.player-markers-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1rem;
  z-index: 10;
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
}

.player-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;
  transform-origin: bottom center;
}

.player-marker.current-user .marker-image {
  border: 3px solid #4cd964;
  box-shadow: 0 0 0 2px rgba(76, 217, 100, 0.3);
}

.player-marker.has-submitted .marker-image {
  animation: pulse 2s infinite;
}

.marker-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #e2e8f0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.marker-image img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

.marker-nickname {
  margin-top: 0.5rem;
  font-size: 0.8rem;
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
}

.chat-bubble {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #333;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  max-width: 150px;
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  text-align: center;
  pointer-events: none;
  opacity: 1;
  transition: opacity 1s ease;
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
  background: #4cd964;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.9rem;
  animation: scorePopup 2s ease-out;
  pointer-events: none;
}

.team-mode .marker-image {
  border-width: 4px;
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

/* 반응형 스타일 */
@media (max-width: 768px) {
  .player-markers {
    gap: 1rem;
  }
  
  .marker-image {
    width: 40px;
    height: 40px;
  }
  
  .marker-nickname {
    font-size: 0.7rem;
    max-width: 80px;
  }
  
  .chat-bubble {
    max-width: 120px;
    font-size: 0.75rem;
  }
}
</style>
