<template>
  <div class="multiplayer-room-waiting">
  
    <!-- 배경 요소 -->
    <div class="mode-background"></div>

    <!-- 메인 컨텐츠 영역 -->
    <div class="room-content">
      <!-- 왼쪽 패널: 헤더 + 플레이어 목록 -->
      <div class="left-panel">
        <!-- 헤더 컴포넌트 -->
        <RoomHeader
          :room-data="localRoomData"
          :is-host="isHost"
          :can-start-game="isRoomDummyMode ? true : canStartGame"
          :is-starting="isStartingGame"
          :is-dummy-mode="isRoomDummyMode"
          :unread-messages="unreadMessages"
          :is-team-mode="isTeamMode"
          :show-chat-toggle="isMobileView"
          @open-settings="openRoomSettings"
          @toggle-chat="handleToggleChat"
          @leave-room="leaveRoom"
          @start-game="startGame"
        />

        <!-- 플레이어 목록 -->
        <div class="panel-section">
          <h3 class="section-title">
            <i class="fas fa-users"></i>
            참가자 ({{ localPlayers.length }}/{{ localRoomData.maxPlayers }})
            
            <!-- WebSocket 연결 상태 표시 -->
            <div class="connection-status">
              <div v-if="isWebSocketConnected" class="status-indicator connected" title="실시간 연결됨">
                <i class="fas fa-wifi"></i>
              </div>
              <div v-else class="status-indicator disconnected" title="폴링 모드">
                <i class="fas fa-clock"></i>
              </div>
              
              <!-- 플레이어 목록 로딩 상태 -->
              <div v-if="isLoadingPlayerList" class="loading-indicator" title="플레이어 목록 업데이트 중">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          </h3>

          <!-- 로딩 상태 표시 -->
          <div v-if="isLoadingPlayerList && localPlayers.length === 0" class="loading-players">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p>플레이어 목록을 불러오는 중...</p>
          </div>

          <!-- 팀 모드인 경우 팀별로 플레이어 목록 표시 -->
          <TeamWaitingList
            v-else-if="isTeamMode"
            :teams="availableTeams"
            :players="localPlayers"
            :current-user-id="currentUserId"
            :is-host="isHost"
            :max-players-per-team="maxPlayersPerTeam"
            :player-messages="playerMessages"
            @show-player-details="showPlayerDetails"
            @kick-player="confirmKickPlayer"
            @join-team="joinTeam"
          />

          <!-- 개인 모드인 경우 플레이어 목록 표시 -->
          <SoloWaitingList
            v-else
            :players="localPlayers"
            :current-user-id="currentUserId"
            :is-host="isHost"
            :max-players="localRoomData.maxPlayers"
            :player-messages="playerMessages"
            @show-player-details="showPlayerDetails"
            @kick-player="confirmKickPlayer"
          />

          <!-- 마지막 업데이트 시간 표시 -->
          <div v-if="lastPlayerListUpdate" class="last-update-time">
            <small>
              <i class="fas fa-clock"></i>
              마지막 업데이트: {{ formatUpdateTime(lastPlayerListUpdate) }}
            </small>
          </div>
        </div>
      </div>

      <!-- 오른쪽 패널: 채팅 전체 높이 -->
      <div class="right-panel" :class="{ 'hidden-mobile': isMobileView && !isChatVisible }">
        <div class="chat-panel">
          <div class="chat-header">
            <div class="chat-title">
              <i class="fas fa-comments"></i>
              <span>채팅</span>
              <div class="chat-notification" v-if="unreadMessages > 0">
                {{ unreadMessages > 9 ? '9+' : unreadMessages }}
              </div>
            </div>
            <div class="chat-controls">
              <div class="chat-status">
                <i class="fas fa-circle online-indicator"></i>
                <span>{{ localPlayers.length }}명 온라인</span>
              </div>
              <button 
                v-if="isMobileView" 
                class="chat-close-button"
                @click="handleToggleChat"
                title="채팅 닫기"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="chat-container">
            <div class="chat-messages" ref="chatMessagesRef">
              
              <ChatMessage
                v-for="(message, index) in chatMessages"
                :key="index"
                :message="message"
                :current-user-id="currentUserId"
              />
            </div>

            <div class="chat-input-container">
              <input
                type="text"
                class="chat-input"
                v-model="chatInput"
                placeholder="메시지를 입력하세요..."
                @keyup.enter="sendChatMessage"
                @focus="handleChatInputFocus"
                ref="chatInputFieldRef"
              />
              <button class="send-button" @click="sendChatMessage">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 방 설정 모달 -->
    <RoomSettingsModal
      :is-active="isRoomSettingsOpen"
      :room-data="localRoomData"
      @close="closeRoomSettings"
      @save="updateRoomSettings"
    />

    <!-- 강퇴 확인 모달 -->
    <KickConfirmationModal
      :is-active="isKickModalOpen"
      :player="playerToKick"
      @close="closeKickModal"
      @confirm="kickPlayer"
    />

    <!-- 플레이어 상세 정보 모달 -->
    <PlayerDetailsModal
      :is-active="isPlayerDetailsOpen"
      :player="selectedPlayer"
      :is-host="isHost"
      :current-user-id="currentUserId"
      @close="closePlayerDetails"
      @kick="confirmKickPlayer"
    />

    <!-- 실시간 알림 토스트 -->
    <ToastNotification ref="toastRef" />

    <!-- 게임 시작 카운트다운 오버레이 -->
    <CountdownOverlay
      :is-active="isCountdownActive"
      :countdown="countdownSeconds"
      :message="countdownMessage"
      :is-host="isHost"
      :can-cancel="false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';

// Core Components
import NavigationBar from '@/core/components/NavigationBar.vue';

// Room Components
import RoomHeader from 'src/features/game/multiplayer/room/components/header/RoomHeader.vue'
//waiting list
import TeamWaitingList from 'src/features/game/multiplayer/room/components/list/TeamWaitingList.vue'
import SoloWaitingList from '@/features/game/multiplayer/room/components/list/SoloWaitingList.vue'

//modal
import KickConfirmationModal from 'src/features/game/multiplayer/room/components/player/KickConfirmationModal.vue'
import PlayerDetailsModal from 'src/features/game/multiplayer/room/components/player/PlayerDetailsModal.vue'
import RoomSettingsModal from 'src/features/game/multiplayer/room/components/settings/RoomSettingsModal.vue'
import ChatMessage from 'src/features/game/multiplayer/chat/components/Room/ChatMessage.vue'

//notifications
import ToastNotification from 'src/features/game/multiplayer/room/components/notifications/ToastNotification.vue'
import CountdownOverlay from 'src/features/game/multiplayer/room/components/settings/CountdownOverlay.vue'
import { soloTestData } from 'src/features/game/multiplayer/room/composables/MultiplayerGameTestData.js'

// Composables
import { useRoom } from '../composables/useRoom';

// Services
import roomApiService from '../services/roomApi.service.js';

// Props - route params에서 roomId 받기
const props = defineProps({
  roomId: {
    type: [String, Number],
    required: true
  }
});

// Vue Router
const router = useRouter();
const route = useRoute();

// 현재 사용자 ID (localStorage에서 가져오기)
let currentUserId = localStorage.getItem('memberId') || '';

// 더미 모드: 오직 라우터 state에서만 활성화 가능 (개발자 전용)
// URL 쿼리 파라미터나 기타 방법으로는 더미 모드를 활성화할 수 없음
const shouldUseDummyMode = history.state?.dummyMode === true;

if (shouldUseDummyMode && !currentUserId) {
  currentUserId = soloTestData.currentUser?.id || 'dummy-host';
}

const normalizedCurrentUserId = currentUserId ? currentUserId.toString() : '';

// Router state에서 전달받은 데이터 확인 (방 생성 시 LobbyView에서 전달)
const routerState = history.state?.roomData || null;

// 초기 roomData 설정
// 1순위: router state (방금 생성한 경우)
// 2순위: API 호출 (페이지 새로고침 또는 직접 접근)
const initialRoomData = routerState ? {
  id: routerState.id || props.roomId,
  title: routerState.title || '로딩 중...',
  gameMode: routerState.gameMode || 'roadview',
  isTeamMode: routerState.isTeamMode || false,
  maxPlayers: routerState.maxPlayers || 8,
  rounds: routerState.rounds || 5,
  timeLimit: routerState.timeLimit || 60,
  isPrivate: routerState.isPrivate || false,
  password: routerState.password || '',
  hostId: routerState.hostId || (shouldUseDummyMode ? currentUserId : ''),
  currentPlayerCount: routerState.currentPlayerCount || 0,
  createdAt: routerState.createdAt || new Date().toISOString(),
} : {
  id: props.roomId,
  title: '로딩 중...',
  gameMode: 'roadview',
  isTeamMode: false,
  maxPlayers: 8,
  rounds: 5,
  timeLimit: 60,
  isPrivate: false,
  password: '',
  hostId: shouldUseDummyMode ? currentUserId : '',
  currentPlayerCount: 0,
  createdAt: new Date().toISOString(),
};

const initialHostId = routerState?.hostId != null
  ? routerState.hostId.toString()
  : (initialRoomData.hostId != null ? initialRoomData.hostId.toString() : '');

// isHost 판단: routerState의 hostId와 현재 사용자 ID 비교
const isHost = ref(shouldUseDummyMode || (initialHostId !== '' && initialHostId === normalizedCurrentUserId));

// 초기 players 빈 배열 (API에서 가져올 예정)
const initialPlayers = [];

console.log('🏠 RoomView 초기화:', {
  roomId: props.roomId,
  hasRouterState: !!routerState,
  initialRoomData,
  isHost: isHost.value,
  currentUserId
});

const emit = defineEmits([
  'leave-room',
  'start-game',
  'send-chat',
  'update-room-settings',
  'kick-player',
  'join-team',
  'player-list-updated', // 웹소켓으로 플레이어 목록 업데이트 시 사용
  'team-change-success' // 팀 변경 성공 시 사용
]);

// 알림 시스템 - 반드시 useRoom 호출보다 먼저 선언되어야 함
const toastRef = ref(null);

// 게임 시작 카운트다운 상태
const isCountdownActive = ref(false);
const countdownSeconds = ref(3);
const countdownMessage = ref('게임이 곧 시작됩니다!');
const pendingGameStartPayload = ref(null);
const hasNavigatedToGame = ref(false);
let countdownIntervalId = null;

const clearCountdownTimer = () => {
  if (countdownIntervalId !== null) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
};

const navigateToSoloGame = (payload = {}) => {
  if (hasNavigatedToGame.value) {
    return;
  }

  clearCountdownTimer();
  hasNavigatedToGame.value = true;
  isCountdownActive.value = false;

  const targetRoomId = payload?.roomId || localRoomData?.value?.id || props.roomId;

  prepareForGameNavigation();

  router.push({
    name: 'SoloRoadViewGameView',
    params: { roomId: targetRoomId },
    state: {
      expectedPlayers: localPlayers.value.length || localRoomData.value.currentPlayerCount || 1,
      dummyMode: isRoomDummyMode.value,
      timeLimit: localRoomData.value.timeLimit || 120,
      roomData: {
        ...localRoomData.value,
        isPoiNameVisible: localRoomData.value?.isPoiNameVisible !== false
      }
    }
  }).catch((error) => {
    console.error('❌ 게임 화면 이동 중 오류:', error);
    setDisconnectReason(null);
    hasNavigatedToGame.value = false;
    throw error;
  });
};

function handleGameStartSignal(startEvent = {}) {
  clearCountdownTimer();
  hasNavigatedToGame.value = false;
  pendingGameStartPayload.value = startEvent;

  const rawCountdown = Number(
    startEvent?.countdown ?? startEvent?.countDown ?? startEvent?.countdownSeconds ?? 3
  );
  const sanitizedCountdown = Number.isFinite(rawCountdown) && rawCountdown > 0
    ? Math.floor(rawCountdown)
    : 3;

  countdownSeconds.value = sanitizedCountdown;
  countdownMessage.value = startEvent?.message || '게임이 곧 시작됩니다!';
  isCountdownActive.value = true;

  if (typeof addSystemMessage === 'function') {
    addSystemMessage(`게임이 ${countdownSeconds.value}초 후 시작됩니다.`);
  }

  if (sanitizedCountdown <= 0) {
    navigateToSoloGame(startEvent);
    return;
  }

  countdownIntervalId = window.setInterval(() => {
    if (countdownSeconds.value > 1) {
      countdownSeconds.value -= 1;
      return;
    }

    countdownSeconds.value = 0;
    clearCountdownTimer();
    navigateToSoloGame(pendingGameStartPayload.value || {});
  }, 1000);
}

// Room composable에 전달할 props 구성 (접근 권한 확인 후 업데이트될 수 있음)
const roomProps = {
  roomData: initialRoomData,
  players: initialPlayers,
  isHost: isHost.value,
  currentUserId: normalizedCurrentUserId
};

// Room composable 사용 - 알림 시스템과 연결
// 주의: roomProps는 접근 권한 확인 후 업데이트될 수 있으므로, useRoom 내부에서 참조로 사용됨
const room = useRoom(roomProps, emit, { toastRef, onGameStartMessage: handleGameStartSignal, dummyMode: shouldUseDummyMode });

// 템플릿에서 사용할 상태와 메서드 추출
const {
  // 상태
  localRoomData,
  isTeamMode,
  canStartGame,
  isStartingGame,
  isDummyMode: isRoomDummyMode,
  
  
  // WebSocket 및 로딩 상태
  isWebSocketConnected,
  isLoadingPlayerList,
  lastPlayerListUpdate,
  
  // 모달 상태
  isRoomSettingsOpen,
  isKickModalOpen,
  isPlayerDetailsOpen,
  playerToKick,
  selectedPlayer,
  
  // 채팅 상태
  chatMessages,
  chatInput,
  unreadMessages,
  chatMessagesRef,
  
  // 플레이어 상태
  localPlayers,
  playerMessages,
  availableTeams,
  maxPlayersPerTeam,
  
  // 방 관련 메서드
  updateRoomSettings,
  leaveRoom: leaveRoomOriginal,
  startGame,
  kickPlayer,
  joinTeam,
  sendChatMessage,
  
  // 실시간 업데이트 메서드
  handlePlayerListUpdate,
  startPlayersPolling,
  stopPlayersPolling,
  
  // 모달 메서드
  openRoomSettings,
  closeRoomSettings,
  showPlayerDetails,
  closePlayerDetails,
  confirmKickPlayer,
  closeKickModal,
  
  // 채팅 메서드
  toggleChat,
  scrollChatToBottom,
  addSystemMessage,
  
  // 플레이어 메서드
  getCurrentPlayerNickname,
  getCurrentPlayerTeam,
  canJoinTeam,
  getTeamPlayerCount,
  prepareForGameNavigation,
  setDisconnectReason,
  disconnectWebSocket,
  
  // 초기화 메서드
  initializeRoom
} = room;

// leaveRoom 래퍼: 방 퇴장 후 로비로 새로고침 리다이렉션
const leaveRoom = async () => {
  try {
    // 원래 leaveRoom 호출 (API 호출 + WebSocket 연결 해제)
    await leaveRoomOriginal();
    
    // 로비로 새로고침 리다이렉션 (페이지 전체 리로드)
    window.location.href = '/lobby';
    console.log('✅ 로비로 이동 완료');
  } catch (error) {
    console.error('❌ 방 퇴장 중 오류 발생:', error);
    // 에러가 발생해도 로비로 이동
    window.location.href = '/lobby';
  }
};

// 반응형 디자인 상태 관리
const isMobileView = ref(false);
const isChatVisible = ref(false);
const chatInputFieldRef = ref(null);

// 화면 크기 감지
const checkScreenSize = (preserveChatState = false) => {
  isMobileView.value = window.innerWidth <= 1024;
  
  // 리사이즈 이벤트로 인한 호출이 아닌 경우에만 채팅창 상태 초기화
  if (!preserveChatState) {
    if (!isMobileView.value) {
      isChatVisible.value = true; // 데스크톱에서는 항상 채팅 표시
    } else {
      // 반응형 전환 시 기본은 플레이어 리스트 화면이 먼저 보이도록 채팅 숨김
      isChatVisible.value = false;
    }
  }
  // preserveChatState가 true인 경우 (리사이즈 이벤트)에는 채팅창 상태를 변경하지 않음
  // 이렇게 하면 모바일에서 키보드로 인한 뷰포트 변경 시에도 채팅창이 닫히지 않음
};

// 채팅 토글 래퍼 함수
const handleToggleChat = () => {
  if (isMobileView.value) {
    isChatVisible.value = !isChatVisible.value;
  }
  toggleChat();
};

const handleChatInputFocus = () => {
  if (!isMobileView.value) {
    return;
  }

  nextTick(() => {
    // 채팅 메시지 영역의 스크롤만 조정 (레이아웃 재계산 방지)
    scrollChatToBottom();
    // scrollIntoView 제거: 키보드 포커스 시 모달 위치 변경 방지
  });
};

// 강제 종료 시 탈퇴 처리
const handleBeforeUnload = (event) => {
  // 브라우저가 닫히기 전에 퇴장 처리 시도
  // 주의: beforeunload는 동기적으로만 작동하므로 async/await 사용 불가
  console.log('🚪 페이지 종료 감지 - 퇴장 처리 시도');
  
  try {
    const roomId = localRoomData.value?.id || props.roomId;
    const currentUserId = normalizedCurrentUserId;
    
    if (!roomId || !currentUserId) {
      console.warn('⚠️ roomId 또는 currentUserId가 없어 퇴장 처리를 건너뜁니다.');
      return;
    }
    
    // fetch with keepalive를 사용하여 비동기적으로 퇴장 요청
    // keepalive 옵션은 페이지가 닫혀도 요청이 보장됨
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const leaveUrl = `${apiBaseUrl}/api/rooms/${roomId}/leave`;
    
    // fetch with keepalive로 DELETE 요청 시도 (비동기이지만 keepalive로 보장)
    fetch(leaveUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memberId: currentUserId }),
      keepalive: true, // 페이지가 닫혀도 요청 보장
      credentials: 'include', // 쿠키 포함
    }).catch(() => {
      // fetch 실패는 무시 (페이지가 닫히는 중이므로)
    });
    
    console.log('✅ fetch keepalive로 퇴장 요청 전송 시도');
    
    // WebSocket 연결 해제 시도 (동기적으로만 가능, 완료 보장 안 됨)
    // disconnectWebSocket은 비동기이므로 완료를 기다릴 수 없음
    disconnectWebSocket().catch(() => {
      // 실패는 무시
    });
  } catch (error) {
    console.error('❌ beforeunload 퇴장 처리 중 오류:', error);
  }
};

onMounted(async () => {
  checkScreenSize();
  window.addEventListener('resize', () => checkScreenSize(true));
  
  // 강제 종료 감지를 위한 beforeunload 이벤트 리스너 추가
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Room 초기화 전에 접근 권한 확인
  try {
    // 더미 모드가 아닌 경우에만 접근 권한 확인
    if (!shouldUseDummyMode) {
      // 1. 접근 권한 확인 (URL로 강제 접근하는 것을 막기 위함)
      const accessCheck = await roomApiService.checkGameAccess(props.roomId);
      
      if (!accessCheck.allowed) {
        // 접근 불가: 메시지 표시 후 로비로 리다이렉트
        const message = accessCheck.message || '이 방에 접근할 수 없습니다.';
        console.warn('⚠️ 방 접근 권한 없음:', message);
        alert(message);
        window.location.href = '/lobby';
        return;
      }
      
      // 2. 접근 가능: gameRoomDetailResponse를 받아서 초기 방 데이터로 설정
      let preloadedRoomDetail = null;
      
      if (accessCheck.gameRoomDetailResponse) {
        const roomDetail = accessCheck.gameRoomDetailResponse;
        preloadedRoomDetail = roomDetail; // initializeRoom에 전달
        
        // routerState가 없거나 덮어쓰기 가능한 경우에만 initialRoomData 업데이트
        if (!routerState || routerState.allowOverride) {
          // gameRoomDetailResponse를 초기 방 데이터 형식으로 변환
          initialRoomData.id = roomDetail.roomId ?? props.roomId;
          initialRoomData.title = roomDetail.title ?? initialRoomData.title;
          initialRoomData.timeLimit = roomDetail.timeLimit ?? initialRoomData.timeLimit;
          initialRoomData.gameMode = roomDetail.gameMode?.toLowerCase?.() ?? roomDetail.gameMode ?? initialRoomData.gameMode;
          initialRoomData.isTeamMode = roomDetail.gameType ? roomDetail.gameType.toLowerCase() === 'team' : initialRoomData.isTeamMode;
          initialRoomData.isPrivate = roomDetail.privateRoom ?? initialRoomData.isPrivate;
          initialRoomData.maxPlayers = roomDetail.maxPlayers ?? initialRoomData.maxPlayers;
          initialRoomData.hostId = roomDetail.hostId ?? initialRoomData.hostId;
          initialRoomData.currentPlayerCount = roomDetail.currentPlayerCount ?? initialRoomData.currentPlayerCount;
          
          // roomProps도 업데이트
          roomProps.roomData = { ...initialRoomData };
          
          console.log('✅ 접근 권한 확인 완료, 방 정보 업데이트:', initialRoomData);
        }
      }
      
      // 3. Room 초기화 (방 데이터 로딩 및 WebSocket 연결)
      // preloadedRoomDetail을 전달하여 중복 API 호출 방지
      await initializeRoom(preloadedRoomDetail);
    } else {
      console.log('🧪 더미 모드: 접근 권한 확인 건너뜀');
      
      // 3. Room 초기화 (더미 모드)
      await initializeRoom();
    }
  } catch (error) {
    console.error('❌ RoomView 초기화 실패:', error);
    
    // 접근 권한 확인 실패 또는 방 조회 실패 시 로비로 리다이렉트
    const errorCode = error?.code || '';
    const isAccessDenied = errorCode === 'ACCESS_DENIED' || error?.response?.status === 403;
    const isRoomNotFound = errorCode === 'ROOM_NOT_FOUND' || errorCode === 'ROOM_LOAD_FAILED' || error?.response?.status === 404;
    const isNetworkError = !navigator.onLine || error?.message?.includes('network') || error?.message?.includes('Network');
    
    if (isAccessDenied) {
      const message = error?.response?.data?.message || '이 방에 접근할 수 없습니다.';
      console.warn('⚠️ 방 접근 권한 없음:', message);
      alert(message);
      window.location.href = '/lobby';
      return;
    }
    
    if (isRoomNotFound || isNetworkError) {
      console.warn('⚠️ 방을 조회할 수 없거나 인터넷 연결이 끊겼습니다. 로비로 이동합니다.');
      alert('방을 조회할 수 없거나 인터넷 연결이 끊겼습니다. 로비로 이동합니다.');
      window.location.href = '/lobby';
      return;
    }
    
    // 기타 에러는 사용자에게 알림
    alert('방 정보를 불러오는 중 오류가 발생했습니다. 로비로 이동합니다.');
    window.location.href = '/lobby';
  }
});

// 라우터 네비게이션 가드: 다른 페이지로 이동하기 전에 구독 해제
onBeforeRouteLeave(async (to, from, next) => {
  console.log('🚪 라우터 네비게이션 감지:', { to: to.path, from: from.path });
  
  // 구독 해제 및 정리 작업
  try {
    window.removeEventListener('resize', checkScreenSize);
    clearCountdownTimer();
    await disconnectWebSocket();
    console.log('✅ 라우터 네비게이션 전 구독 해제 완료');
  } catch (error) {
    console.error('❌ 라우터 네비게이션 전 구독 해제 중 오류:', error);
  } finally {
    // 에러가 발생해도 네비게이션은 계속 진행
    next();
  }
});

onBeforeUnmount(() => {
  // 이벤트 리스너 정리
  window.removeEventListener('resize', checkScreenSize);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  
  // onBeforeRouteLeave가 호출되지 않은 경우를 대비한 안전장치
  clearCountdownTimer();
  disconnectWebSocket();
});

watch(
  () => localRoomData.value?.hostId,
  (newHostId) => {
    const match = newHostId != null && newHostId.toString() === normalizedCurrentUserId;
    const nextIsHost = shouldUseDummyMode || match;
    if (nextIsHost !== isHost.value) {
      isHost.value = nextIsHost;
      roomProps.isHost = nextIsHost;
    }
  },
  { immediate: true }
);

// 시간 포맷팅 유틸리티
const formatUpdateTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 1000) {
    return '방금 전';
  } else if (diff < 60000) {
    return `${Math.floor(diff / 1000)}초 전`;
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}분 전`;
  } else {
    return new Date(timestamp).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};
</script>

<style scoped>
.multiplayer-room-waiting {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  padding: 1rem;
  padding-top: 5rem;
  overflow: hidden;
}

.mode-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  z-index: -1;
}

.room-content {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.left-panel {
  flex: 0 0 65%;
  max-width: 65%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.right-panel {
  flex: 0 0 35%;
  max-width: 35%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
}

.panel-section {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* 데스크톱에서는 자연스러운 레이아웃 유지 */
  overflow: visible;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #667eea;
  font-size: 1rem;
}

/* 연결 상태 표시 */
.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.7rem;
  transition: all 0.2s ease;
}

.status-indicator.connected {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  animation: pulse-green 2s infinite;
}

.status-indicator.disconnected {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  animation: pulse-orange 2s infinite;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #667eea;
  font-size: 0.8rem;
}

@keyframes pulse-green {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 2px 12px rgba(34, 197, 94, 0.6);
  }
}

@keyframes pulse-orange {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 2px 12px rgba(245, 158, 11, 0.6);
  }
}

/* 플레이어 목록 로딩 상태 */
.loading-players {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #64748b;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.loading-players p {
  margin: 0;
  font-weight: 500;
  font-size: 0.9rem;
}

/* 마지막 업데이트 시간 */
.last-update-time {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  text-align: center;
}

.last-update-time small {
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.last-update-time i {
  font-size: 0.7rem;
  opacity: 0.8;
}

/* 채팅 패널 전체 높이 */
.chat-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.chat-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.chat-close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  position: relative;
}

.chat-title i {
  font-size: 1.2rem;
}

.chat-notification {
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-left: 0.5rem;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.3);
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  opacity: 0.9;
}

.online-indicator {
  color: #22c55e;
  font-size: 0.6rem;
  text-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
}

/* 채팅 컨테이너 */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 10px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.chat-welcome {
  text-align: center;
  padding: 1.5rem 1rem;
  color: #64748b;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 1rem;
}

.welcome-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.welcome-icon i {
  font-size: 1.2rem;
  color: white;
}

.welcome-text {
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.5;
  margin: 0;
}

.chat-input-container {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 24px;
  font-size: 0.9rem;
  color: #1e293b;
  outline: none;
  transition: all 0.2s ease;
  background: white;
}

.chat-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.chat-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.send-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-button:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #553c9a 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.send-button:active {
  transform: translateY(0);
}

.send-button i {
  font-size: 0.9rem;
}

/* 모바일에서 채팅 숨김 */
.right-panel.hidden-mobile {
  display: none;
}

/* Responsive design */
@media (max-width: 1200px) {
  .left-panel {
    flex: 1;
    max-width: 100%;
  }
  
  .right-panel {
    flex: 1;
    max-width: 100%;
    min-width: 280px;
  }
}

@media (max-width: 1024px) {
  .room-content {
    flex-direction: column;
    gap: 1rem;
    position: relative;
  }

  .left-panel {
    flex: none;
    max-width: 100%;
    height: auto;
    min-height: 50vh;
  }

  .right-panel {
    flex: 1;
    max-width: 100%;
    min-width: 0;
    min-height: 45vh;
  }

  /* 모바일/태블릿에서 플레이어 목록은 고정 높이 내 스크롤 */
  .panel-section {
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 모바일에서 채팅이 표시될 때 전체 화면 */
  .right-panel:not(.hidden-mobile) {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.5);
    padding: 1rem;
    transform: translateX(0);
  }

  .right-panel:not(.hidden-mobile) .chat-panel {
    max-width: 500px;
    width: 100%;
    height: 100%;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .multiplayer-room-waiting {
    padding: 0.75rem;
  }

  .room-content {
    gap: 0.75rem;
  }

  .left-panel {
    min-height: 70vh;
  }

  .panel-section {
    padding: 1rem;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .chat-header {
    padding: 0.75rem 1rem;
  }

  .chat-title {
    font-size: 1rem;
  }

  .chat-controls {
    gap: 0.75rem;
  }

  .chat-status {
    font-size: 0.8rem;
  }

  .chat-status span {
    display: none;
  }

  .chat-messages {
    padding: 0.75rem 1rem;
  }

  .chat-input-container {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }

  .send-button {
    width: 40px;
    height: 40px;
  }

  .right-panel:not(.hidden-mobile) .chat-panel {
    max-width: 100%;
    margin: 0;
  }
}

@media (max-width: 480px) {
  .left-panel {
    min-height: 75vh;
  }

  /* 작은 화면에서 전체 컨테이너는 세로 스크롤 허용 */
  .multiplayer-room-waiting {
    overflow-x: hidden;
    overflow-y: auto;
  }

  .chat-welcome {
    padding: 1rem 0.5rem;
  }

  .welcome-icon {
    width: 40px;
    height: 40px;
  }

  .welcome-text {
    font-size: 0.8rem;
  }

  .chat-input {
    padding: 0.65rem 0.85rem;
    font-size: 0.85rem;
  }

  .send-button {
    width: 36px;
    height: 36px;
  }

  .send-button i {
    font-size: 0.8rem;
  }

  .chat-close-button {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}
</style>

