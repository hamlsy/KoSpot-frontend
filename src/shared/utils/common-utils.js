// 🧹 Auto-generated common utilities

export function commonUtil1() {
const locations = testData.locations;
  const randomIndex = Math.floor(Math.random() * locations.length);
  return locations[randomIndex];
}

/* Replaces:
 * getRandomLocation() in src\store\MultiplayerGameTestData.js
 * getRandomLocation() in src\store\MultiplayerGameTestData.js
 * getRandomLocation() in src\features\game\multiplayer\room\composables\MultiplayerGameTestData.js
 * getRandomLocation() in src\features\game\multiplayer\room\composables\MultiplayerGameTestData.js
 */

export function commonUtil2() {
if (distance < 1) return 1000;
  if (distance < 5) return 750;
  if (distance < 10) return 500;
  if (distance < 20) return 250;
  return 100;
}

/* Replaces:
 * calculateScore() in src\store\MultiplayerGameTestData.js
 * calculateScore() in src\store\MultiplayerGameTestData.js
 * calculateScore() in src\features\game\multiplayer\room\composables\MultiplayerGameTestData.js
 * calculateScore() in src\features\game\multiplayer\room\composables\MultiplayerGameTestData.js
 */

export function commonUtil3() {
const R = 6371; // 지구 반경 (km)
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLng = toRad(pos2.lng - pos1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/* Replaces:
 * calculateDistance() in src\store\MultiplayerGameTestData.js
 * calculateDistance() in src\store\MultiplayerGameTestData.js
 * calculateDistance() in src\features\game\multiplayer\room\composables\MultiplayerGameTestData.js
 * calculateDistance() in src\features\game\multiplayer\room\composables\MultiplayerGameTestData.js
 */

export function commonUtil4() {
// Polygon: [ [ [lng, lat], ... ] ]
  return coords.map(
    ring => ring.map(([lng, lat]) => [lat, lng])
  );
}

/* Replaces:
 * convertCoordinates() in src\shared\assets\polygons\scripts\convertSidoJson.js
 * convertCoordinates() in src\shared\assets\polygons\scripts\convertSidoJson.js
 */

export function commonUtil5() {
if (ring.length < 2) return false;
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  return firstLng === lastLng && firstLat === lastLat;
}

/* Replaces:
 * isClosed() in src\shared\assets\polygons\scripts\convertSidoJson.js
 * isClosed() in src\shared\assets\polygons\scripts\convertSidoJson.js
 */

export function commonUtil6() {
if (!isClosed(ring)) {
    ring.push([...ring[0]]);
  }
  return ring;
}

/* Replaces:
 * closeRing() in src\shared\assets\polygons\scripts\convertSidoJson.js
 * closeRing() in src\shared\assets\polygons\scripts\convertSidoJson.js
 */

export function commonUtil7() {
const { map, marker, distance } = useKakaoMapState();
  
  const calculateDistance = () => {
    if (!marker.value || !props.actualLocation || !map.value) return;
    
    const markerPosition = marker.value.getPosition();
    
    // Haversine 공식을 사용한 거리 계산
    distance.value = getDistance(
      markerPosition.getLat(), markerPosition.getLng(),
      props.actualLocation.lat, props.actualLocation.lng
    );
  };
  
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // 킬로미터 단위
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  return {
    calculateDistance,
    getDistance,
    deg2rad
  };
}

/* Replaces:
 * useKakaoMapDistance() in src\features\game\shared\components\Kakao\KakaoMapGame\composables\useKakaoMapDistance.js
 * useKakaoMapDistance() in src\features\game\shared\components\Kakao\KakaoMapGame\composables\useKakaoMapDistance.js
 */

export function commonUtil8() {
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
        setupDefaultSubscriptions: webSocketManager.setupDefaultSubscriptions
    };
}

/* Replaces:
 * useWebSocketManager() in src\features\game\multiplayer\shared\services\websocket\useWebSocketManager.js
 * useWebSocketManager() in src\features\game\multiplayer\shared\services\websocket\useWebSocketManager.js
 */

export function commonUtil9() {
if (!teamPlayers.value[player.teamId]) {
                    teamPlayers.value[player.teamId] = [];
                }
                
                // 팀에 이미 있는지 확인 후 추가
                if (!teamPlayers.value[player.teamId].some(p => p.id === player.id)) {
                    teamPlayers.value[player.teamId].push(player);
                }
}

/* Replaces:
 * if() in src\features\game\multiplayer\shared\services\websocket\composables\players.js
 * if() in src\features\game\multiplayer\shared\services\websocket\composables\players.js
 */

export function commonUtil10() {
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

/* Replaces:
 * getRandomMessageByRank() in src\features\game\multiplayer\shared\components\intro\NextRoundMessages.js
 * getRandomMessageByRank() in src\features\game\multiplayer\shared\components\intro\NextRoundMessages.js
 */

export function commonUtil11() {
stop();
        if (options.onFinish) options.onFinish();
        return;
}

/* Replaces:
 * if() in src\composables\useTimer.js
 * if() in src\composables\useTimer.js
 */

export function commonUtil12() {
showProfileMenu.value = !showProfileMenu.value;
  
  if (showProfileMenu.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}

/* Replaces:
 * toggleProfileMenu() in src\features\main\views\MainView.vue
 * toggleProfileMenu() in src\features\main\views\MainView.vue
 * toggleProfileMenu() in src\core\components\TheHeader.vue
 */

export function commonUtil13() {
bannerInterval.value = setInterval(() => {
    currentBanner.value = (currentBanner.value + 1) % banners.length;
  }, 5000);
}

/* Replaces:
 * startBannerRotation() in src\features\main\views\MainView.vue
 * startBannerRotation() in src\features\main\views\MainView.vue
 */

export function commonUtil14() {
currentBanner.value = index;
  // 자동 회전 재시작
  stopBannerRotation();
  startBannerRotation();
}

/* Replaces:
 * setCurrentBanner() in src\features\main\views\MainView.vue
 * setCurrentBanner() in src\features\main\views\MainView.vue
 */

export function commonUtil15() {
toastMessage.value = "포토 모드는 곧 오픈 예정입니다! 기대해주세요.";
  showToast.value = true;

  // 토스트 메시지 3초 후 사라짐
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

/* Replaces:
 * showLockedMessage() in src\features\main\views\MainView.vue
 * showLockedMessage() in src\features\main\views\MainView.vue
 */

export function commonUtil16() {
const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
}

/* Replaces:
 * formatTime() in src\features\game\single\roadview\views\RankView.vue
 * formatTime() in src\features\game\single\roadview\views\PracticeView.vue
 */

export function commonUtil17() {
// 지도 닫기
            this.isMapOpen = false;

            // 결과 확인
            this.$nextTick(() => {
              this.checkAnswer(markerPosition);
            });
}

/* Replaces:
 * if() in src\features\game\single\roadview\views\RankView.vue
 * if() in src\features\game\single\roadview\views\PracticeView.vue
 */

export function commonUtil18() {
if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }

      this.toastMessage = message;
      this.showToast = true;

      this.toastTimeout = setTimeout(() => {
        this.showToast = false;
      }, 3000);
}

/* Replaces:
 * showToastMessage() in src\features\game\single\roadview\views\RankView.vue
 * showToastMessage() in src\features\game\single\roadview\views\PracticeView.vue
 */

export function commonUtil19() {
const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // 킬로미터 단위
}

/* Replaces:
 * calculateDistance() in src\features\game\single\roadview\views\RankView.vue
 * calculateDistance() in src\features\game\single\roadview\views\PracticeView.vue
 */

export function commonUtil20() {
this.showToastMessage(
          "지도를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
        );
        return;
}

/* Replaces:
 * if() in src\features\game\single\roadview\views\PracticeView.vue
 * if() in src\features\game\single\roadview\views\PracticeView.vue
 */

export function commonUtil21() {
setTimeout(() => {
          this.nextRound();
        }, 2000);
}

/* Replaces:
 * if() in src\features\game\single\photo\components\gameplay\PhotoModeGame.vue
 * if() in src\features\game\single\photo\components\gameplay\PhotoModeGame.vue
 */

export function commonUtil22() {
const minutes = Math.floor(this.remainingTime / 60);
      const seconds = this.remainingTime % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/* Replaces:
 * formattedTime() in src\features\game\single\photo\components\Common\ProgressTimer.vue
 * formattedTime() in src\features\game\shared\components\photo\PhotoGameController.vue
 */

export function commonUtil23() {
// 랭크에 따른 아이콘 클래스 반환
  if (rank.includes("Gold")) return "fas fa-trophy gold";
  if (rank.includes("Silver")) return "fas fa-trophy silver";
  if (rank.includes("Bronze")) return "fas fa-trophy bronze";
  return "fas fa-trophy";
}

/* Replaces:
 * getRankIcon() in src\features\game\single\main\views\RoadViewMainView.vue
 * getRankIcon() in src\features\game\single\main\views\RoadViewMainView.vue
 */

export function commonUtil24() {
try {
    // 실제 구현에서는 API 호출로 대체
    // const response = await axios.get('/api/user/stats');
    // stats.value = response.data.stats;
    // userRank.value = response.data.userRank;
    // recentRecords.value = response.data.recentRecords;
    // 테스트 데이터는 이미 설정되어 있음
  } catch (error) {
    console.error("사용자 통계 조회 중 오류 발생:", error);
  }
}

/* Replaces:
 * fetchUserStats() in src\features\game\single\main\views\RoadViewMainView.vue
 * fetchUserStats() in src\features\game\single\main\views\RoadViewMainView.vue
 */

export function commonUtil25() {
if (mode.id === "theme") {
    showThemeModePopup.value = true;
  } else {
    selectedGameMode.value = mode;
    selectedRegion.value = null;
  }
}

/* Replaces:
 * openGameModePopup() in src\features\game\single\main\views\RoadViewMainView.vue
 * openGameModePopup() in src\features\game\single\main\views\RoadViewMainView.vue
 */

export function commonUtil26() {
if (!gameStore.state.teamVoting || !gameStore.state.teamVoting.active) return false;
  
  const player = gameStore.state.players.find(p => p.id === playerId);
  if (!player) return false;
  
  return player.teamId === gameStore.state.teamVoting.teamId;
}

/* Replaces:
 * isPlayerVoting() in src\features\game\shared\components\Player\List.vue
 * isPlayerVoting() in src\features\game\multiplayer\roadview\components\playerlist\TeamPlayersList.vue
 */

export function commonUtil27() {
if (!gameStore.state.teamVoting || !gameStore.state.teamVoting.active) return null;
  
  const vote = gameStore.state.teamVoting.votes.find(v => v.playerId === playerId);
  if (!vote) return null;
  
  return vote.choice; // 'approve' or 'reject'
}

/* Replaces:
 * getPlayerVoteChoice() in src\features\game\shared\components\Player\List.vue
 * getPlayerVoteChoice() in src\features\game\multiplayer\roadview\components\playerlist\TeamPlayersList.vue
 */

export function commonUtil28() {
if (!rank) return 'rank-bronze';
  const [tier] = rank.split('-');
  return `rank-${tier}`;
}

/* Replaces:
 * getRankClass() in src\features\game\shared\components\Player\Card.vue
 * getRankClass() in src\features\game\multiplayer\room\components\player\PlayerDetailsModal.vue
 */

export function commonUtil29() {
if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
}

/* Replaces:
 * stopTimer() in src\features\game\shared\components\photo\PhotoGameController.vue
 * stopTimer() in src\features\game\shared\components\Common\Timer.vue
 */

export function commonUtil30() {
this.$nextTick(() => {
          this.scrollChatToBottom();
        });
}

/* Replaces:
 * if() in src\features\game\multiplayer\shared\components\results\TeamGameResults.vue
 * chatMessages() in src\features\game\multiplayer\shared\components\results\TeamGameResults.vue
 */

export function commonUtil31() {
const locations = [
            {
              lat: 37.5665,
              lng: 126.978,
              name: "서울시청",
              description: "서울 중심부에 위치한 시청",
            },
            {
              lat: 35.1796,
              lng: 129.0756,
              name: "부산 해운대",
              description: "부산의 유명한 해변",
            },
            {
              lat: 33.4996,
              lng: 126.5312,
              name: "제주 성산일출봉",
              description: "제주도의 유명한 관광지",
            },
          ];
          return locations[Math.floor(Math.random() * locations.length)];
}

/* Replaces:
 * getRandomLocation() in src\features\game\multiplayer\roadview\views\TeamGameView.vue
 * getRandomLocation() in src\features\game\multiplayer\roadview\views\IndividualGameView.vue
 */

export function commonUtil32() {
return (
        gameStore.state.votingInitiator === gameStore.state.currentUser?.id
      );
}

/* Replaces:
 * isCurrentUserInitiator() in src\features\game\multiplayer\roadview\views\TeamGameView.vue
 * isCurrentUserVotingInitiator() in src\features\game\multiplayer\roadview\views\TeamGameView.vue
 */

export function commonUtil33() {
console.log("라운드가 종료되었습니다.");
      // 라운드 종료 처리 로직
      this.clearTimer();
}

/* Replaces:
 * handleRoundEnded() in src\features\game\multiplayer\roadview\views\TeamGameView.vue
 * handleRoundEnded() in src\features\game\multiplayer\roadview\views\IndividualGameView.vue
 */

export function commonUtil34() {
if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
}

/* Replaces:
 * clearTimer() in src\features\game\multiplayer\roadview\views\TeamGameView.vue
 * clearTimer() in src\features\game\multiplayer\roadview\views\IndividualGameView.vue
 * clearTimer() in src\features\game\multiplayer\photo\views\GameView.vue
 */

export function commonUtil35() {
// 누적 점수 계산
          if (!player.totalScore) player.totalScore = 0;
          player.totalScore += score;

          // PlayerList 컴포넌트에서 사용하는 속성명으로 설정
          player.score = player.totalScore;
          player.lastScore = score;
          player.lastRoundScore = score;
          player.distanceToTarget = parseFloat(distance.toFixed(2));
}

/* Replaces:
 * if() in src\features\game\multiplayer\roadview\views\TeamGameView.vue
 * if() in src\features\game\multiplayer\roadview\views\IndividualGameView.vue
 */

export function commonUtil36() {
const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // 거리 (km)
      return distance;
}

/* Replaces:
 * calculateDistance() in src\features\game\multiplayer\roadview\views\TeamGameView.vue
 * calculateDistance() in src\features\game\multiplayer\roadview\views\IndividualGameView.vue
 */

export function commonUtil37() {
this.toastMessage = message;
      this.showToastFlag = true;

      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }

      this.toastTimeout = setTimeout(() => {
        this.showToastFlag = false;
      }, 3000);
}

/* Replaces:
 * showToast() in src\features\game\multiplayer\roadview\views\IndividualGameView.vue
 * showToast() in src\features\game\multiplayer\roadview\views\BaseGameView.vue
 */

export function commonUtil38() {
this.webSocket.send(JSON.stringify({
          type: 'PLAYER_GUESS',
          payload: guessData
        }));
}

/* Replaces:
 * if() in src\features\game\multiplayer\roadview\views\IndividualGameView.vue
 * if() in src\features\game\multiplayer\roadview\views\BaseGameView.vue
 */

export function commonUtil39() {
if (
        confirm(
          "정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다."
        )
      ) {
        this.exitToLobby();
      }
}

/* Replaces:
 * exitGame() in src\features\game\multiplayer\roadview\views\BaseGameView.vue
 * exitGame() in src\features\game\multiplayer\photo\views\GameView.vue
 */

export function commonUtil40() {
const date = new Date(timestamp);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // 0시는 12시로 표시
      
      return `${ampm} ${hours}:${minutes}`;
}

/* Replaces:
 * formatTime() in src\features\game\multiplayer\chat\components\Lobby\ChatWindow.vue
 * formatTime() in src\features\game\multiplayer\chat\components\Game\TeamChat.vue
 * formatTime() in src\features\game\multiplayer\chat\components\Game\IndividualChat.vue
 */

export function commonUtil41() {
if (!newMessage.value.trim()) return;
      
      emit('send-message', newMessage.value);
      newMessage.value = '';
}

/* Replaces:
 * sendMessage() in src\features\game\multiplayer\chat\components\Game\TeamChat.vue
 * sendMessage() in src\features\game\multiplayer\chat\components\Game\IndividualChat.vue
 */

export function commonUtil42() {
if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
}

/* Replaces:
 * scrollToBottom() in src\features\game\multiplayer\chat\components\Game\TeamChat.vue
 * scrollToBottom() in src\features\game\multiplayer\chat\components\Game\IndividualChat.vue
 */

export function commonUtil43() {
// 메시지의 senderId 또는 sender가 현재 사용자와 일치하는지 확인
      if (message.system) return false;
      
      if (message.senderId) {
        return message.senderId === props.currentUserId;
      }
      
      // 테스트 환경에서 사용
      return message.sender === '김코스팟';
}

/* Replaces:
 * isMyMessage() in src\features\game\multiplayer\chat\components\Game\TeamChat.vue
 * isMyMessage() in src\features\game\multiplayer\chat\components\Game\IndividualChat.vue
 */

export function commonUtil44() {
if (currentPage.value > 1) {
    currentPage.value--;
  }
}

/* Replaces:
 * prevPage() in src\features\admin\components\User\UserManagement.vue
 * prevPage() in src\features\admin\components\Shop\ShopManagement.vue
 */

export function commonUtil45() {
if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

/* Replaces:
 * nextPage() in src\features\admin\components\User\UserManagement.vue
 * nextPage() in src\features\admin\components\Shop\ShopManagement.vue
 */

export function commonUtil46() {
const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
            return buf;
}

/* Replaces:
 * s2ab() in src\dummy\KakaoMapTest.vue
 * s2ab() in src\dummy\coordData.vue
 */

export function commonUtil47() {
const script = document.createElement("script");
        script.src =
            "https://dapi.kakao.com/v2/maps/sdk.js?appkey=c66fbf360458039285570a638bad813a&libraries=services&autoload=false";
        script.onload = () => console.log("Kakao Map API loaded");
        document.head.appendChild(script);
}

/* Replaces:
 * mounted() in src\dummy\KakaoMapTest.vue
 * mounted() in src\dummy\coordData.vue
 */

