<template>
  <div class="multiplayer-room-waiting" :style="roomColorVars">
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
          :can-start-game="canStartGameWithScreenGate"
          :is-starting="isStartingGame"
          :is-dummy-mode="isRoomDummyMode"
          :start-block-reason="startBlockReason"
          :joining-count="joiningPlayers.length"
          :unread-messages="unreadMessages"
          :is-team-mode="isTeamMode"
          :show-chat-toggle="isMobileView"
          :friend-is-open="friendStore.isPanelOpen"
          :friend-has-notification="friendStore.hasAnyNotification"
          @open-settings="openRoomSettings"
          @toggle-chat="handleToggleChat"
          @toggle-friend="friendStore.togglePanel()"
          @leave-room="leaveRoom"
          @start-game="startGame"
          @refresh-room="handleRefreshRoom"
        />

        <!-- 플레이어 목록 -->
        <div class="panel-section">
          <h3 class="section-title">
            <i class="fas fa-users"></i>
            참가자 ({{ localPlayers.length }}/{{ localRoomData.maxPlayers }})

            <!-- WebSocket 연결 상태 표시 -->
            <div class="connection-status">
              <div
                v-if="isWebSocketConnected"
                class="status-indicator connected"
                title="실시간 연결됨"
              >
                <i class="fas fa-wifi"></i>
              </div>
              <div
                v-else
                class="status-indicator disconnected"
                title="폴링 모드"
              >
                <i class="fas fa-clock"></i>
              </div>

              <!-- 플레이어 목록 로딩 상태 -->
              <div
                v-if="isLoadingPlayerList"
                class="loading-indicator"
                title="플레이어 목록 업데이트 중"
              >
                <i class="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          </h3>

          <!-- 로딩 상태 표시 -->
          <div
            v-if="isLoadingPlayerList && localPlayers.length === 0"
            class="loading-players"
          >
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
      <div
        class="right-panel"
        :class="{ 'hidden-mobile': isMobileView && !isChatVisible }"
      >
        <ChatWindow
          :messages="formattedChatMessages"
          :current-user-id="currentUserId"
          :show-mobile-close="isMobileView && isChatVisible"
          @send-message="(message) => sendChatMessage(message)"
          @close="handleToggleChat"
        />
      </div>
    </div>

    <!-- 친구 패널 -->
    <FriendPanel
      :is-open="friendStore.isPanelOpen"
      :friends="friendStore.friends"
      :pending-requests="friendStore.pendingRequests"
      @close="friendStore.closePanel()"
      @open-chat="(friend) => friendStore.openChatRoom(friend, Number(currentUserId))"
      @open-user-search="friendStore.openSearch()"
      @accept-request="friendStore.acceptFriendRequest"
      @decline-request="friendStore.declineFriendRequest"
    />

    <!-- 유저 검색 모달 -->
    <UserSearchModal
      v-if="friendStore.isSearchOpen"
      @close="friendStore.closeSearch()"
    />

    <!-- 친구 채팅창 -->
    <FriendChatWindow
      v-for="chat in friendStore.openChats"
      :key="chat.friend.id"
      :friend="chat.friend"
      :messages="chat.messages"
      :is-loading="chat.isLoading"
      @close="friendStore.closeChatRoom(chat.friend.id)"
      @send="(text) => friendStore.sendMessage(chat.friend.id, text)"
    />

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
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
  computed,
} from "vue";
import { useRouter, useRoute, onBeforeRouteLeave } from "vue-router";

// Core Components
import NavigationBar from "@/core/components/NavigationBar.vue";

// Room Components
import RoomHeader from "src/features/game/multiplayer/room/components/header/RoomHeader.vue";
//waiting list
import TeamWaitingList from "src/features/game/multiplayer/room/components/list/TeamWaitingList.vue";
import SoloWaitingList from "@/features/game/multiplayer/room/components/list/SoloWaitingList.vue";

//modal
import KickConfirmationModal from "src/features/game/multiplayer/room/components/player/KickConfirmationModal.vue";
import PlayerDetailsModal from "src/features/game/multiplayer/room/components/player/PlayerDetailsModal.vue";
import RoomSettingsModal from "src/features/game/multiplayer/room/components/settings/RoomSettingsModal.vue";
import ChatWindow from "src/features/game/multiplayer/chat/components/Lobby/ChatWindow.vue";

//notifications
import ToastNotification from "src/features/game/multiplayer/room/components/notifications/ToastNotification.vue";
import CountdownOverlay from "src/features/game/multiplayer/room/components/settings/CountdownOverlay.vue";
import { soloTestData } from "src/features/game/multiplayer/room/composables/MultiplayerGameTestData.js";

// 친구 기능
import FriendToggleButton from "@/features/friend/components/FriendToggleButton.vue";
import FriendPanel from "@/features/friend/components/FriendPanel.vue";
import FriendChatWindow from "@/features/friend/components/FriendChatWindow.vue";
import UserSearchModal from "@/features/friend/components/UserSearchModal.vue";
import { useFriendStore } from "@/features/friend/stores/friend.store.js";
import { BRAND, TEXT, BACKGROUND } from "@/core/constants/colors.js";

// Composables
import { useRoom } from "../composables/useRoom";

// Services
import roomApiService from "../services/roomApi.service.js";

// Props - route params에서 roomId 받기
const props = defineProps({
  roomId: {
    type: [String, Number],
    required: true,
  },
});

// Vue Router
const router = useRouter();
const route = useRoute();

// 친구 Store
const friendStore = useFriendStore();

// 현재 사용자 ID (localStorage에서 가져오기)
let currentUserId = localStorage.getItem("memberId") || "";

// 더미 모드: 오직 라우터 state에서만 활성화 가능 (개발자 전용)
// URL 쿼리 파라미터나 기타 방법으로는 더미 모드를 활성화할 수 없음
const shouldUseDummyMode = history.state?.dummyMode === true;

if (shouldUseDummyMode && !currentUserId) {
  currentUserId = soloTestData.currentUser?.id || "dummy-host";
}

const normalizedCurrentUserId = currentUserId ? currentUserId.toString() : "";

const roomColorVars = computed(() => ({
  "--color-primary": BRAND.PRIMARY,
  "--color-secondary": BRAND.SECONDARY,
  "--color-success": BRAND.SUCCESS,
  "--color-warning": BRAND.WARNING,
  "--color-danger": BRAND.DANGER,
  "--color-info": BRAND.INFO,
  "--color-background": BACKGROUND.GRAY,
  "--color-surface": BACKGROUND.LIGHT,
  "--color-border": BRAND.SECONDARY,
  "--color-text-primary": TEXT.PRIMARY,
  "--color-text-secondary": TEXT.SECONDARY,
  "--color-text-tertiary": TEXT.MUTED,
}));

// Router state에서 전달받은 데이터 확인 (방 생성 시 LobbyView에서 전달)
const routerState = history.state?.roomData || null;

// 초기 roomData 설정
// 1순위: router state (방금 생성한 경우)
// 2순위: API 호출 (페이지 새로고침 또는 직접 접근)
const initialRoomData = routerState
  ? {
      id: routerState.id || props.roomId,
      title: routerState.title || "로딩 중...",
      gameMode: routerState.gameMode || "roadview",
      isTeamMode: routerState.isTeamMode || false,
      maxPlayers: routerState.maxPlayers || 8,
      totalRounds: routerState.totalRounds || 5,
      timeLimit: routerState.timeLimit || 60,
      isPrivate: routerState.isPrivate || false,
      poiNameVisible: routerState.poiNameVisible ?? true,
      password: routerState.password || "",
      hostId: routerState.hostId || (shouldUseDummyMode ? currentUserId : ""),
      currentPlayerCount: routerState.currentPlayerCount || 0,
      createdAt: routerState.createdAt || new Date().toISOString(),
    }
  : {
      id: props.roomId,
      title: "로딩 중...",
      gameMode: "roadview",
      isTeamMode: false,
      maxPlayers: 8,
      totalRounds: 5,
      timeLimit: 60,
      isPrivate: false,
      poiNameVisible: true,
      password: "",
      hostId: shouldUseDummyMode ? currentUserId : "",
      currentPlayerCount: 0,
      createdAt: new Date().toISOString(),
    };

const initialHostId =
  routerState?.hostId != null
    ? routerState.hostId.toString()
    : initialRoomData.hostId != null
    ? initialRoomData.hostId.toString()
    : "";

// isHost 판단: routerState의 hostId와 현재 사용자 ID 비교
const isHost = ref(
  shouldUseDummyMode ||
    (initialHostId !== "" && initialHostId === normalizedCurrentUserId),
);

// 초기 players 빈 배열 (API에서 가져올 예정)
const initialPlayers = [];

const emit = defineEmits([
  "leave-room",
  "start-game",
  "send-chat",
  "update-room-settings",
  "kick-player",
  "join-team",
  "player-list-updated", // 웹소켓으로 플레이어 목록 업데이트 시 사용
  "team-change-success", // 팀 변경 성공 시 사용
  "kicked-from-room", // 방장에 의해 강퇴된 경우
]);

// 알림 시스템 - 반드시 useRoom 호출보다 먼저 선언되어야 함
const toastRef = ref(null);

// 게임 시작 카운트다운 상태
const isCountdownActive = ref(false);
const countdownSeconds = ref(3);
const countdownMessage = ref("게임이 곧 시작됩니다!");
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

  const targetRoomId =
    payload?.roomId || localRoomData?.value?.id || props.roomId;

  prepareForGameNavigation();

  router
    .push({
      name: "SoloRoadViewGameView",
      params: { roomId: targetRoomId },
      state: {
        expectedPlayers:
          localPlayers.value.length ||
          localRoomData.value.currentPlayerCount ||
          1,
        dummyMode: isRoomDummyMode.value,
        timeLimit: localRoomData.value.timeLimit || 120,
        roomData: {
          ...localRoomData.value,
          poiNameVisible: localRoomData.value?.poiNameVisible !== false,
        },
      },
    })
    .catch((error) => {
      console.error("❌ 게임 화면 이동 중 오류:", error);
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
    startEvent?.countdown ??
      startEvent?.countDown ??
      startEvent?.countdownSeconds ??
      3,
  );
  const sanitizedCountdown =
    Number.isFinite(rawCountdown) && rawCountdown > 0
      ? Math.floor(rawCountdown)
      : 3;

  countdownSeconds.value = sanitizedCountdown;
  countdownMessage.value = startEvent?.message || "게임이 곧 시작됩니다!";
  isCountdownActive.value = true;

  if (typeof addSystemMessage === "function") {
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
  currentUserId: normalizedCurrentUserId,
};

// Room composable 사용 - 알림 시스템과 연결
// 주의: roomProps는 접근 권한 확인 후 업데이트될 수 있으므로, useRoom 내부에서 참조로 사용됨
const room = useRoom(roomProps, emit, {
  toastRef,
  onGameStartMessage: handleGameStartSignal,
  dummyMode: shouldUseDummyMode,
});

// 강퇴 이벤트 리스너 등록
// useRoom에서 emit('kicked-from-room')이 발생하면 handleKickedFromRoom이 호출됨
// 하지만 script setup에서는 직접적으로 이벤트를 감지할 수 없으므로,
// 대신 useRoom의 handleGameRoomNotification에서 직접 leaveRoom을 호출하도록 이미 구현되어 있음
// 여기서는 추가 안전장치로 이벤트 핸들러를 준비만 함

// 템플릿에서 사용할 상태와 메서드 추출
const {
  // 상태
  localRoomData,
  isTeamMode,
  canStartGameWithScreenGate,
  startBlockReason,
  joiningPlayers,
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
  unreadMessages,

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
  initializeRoom,
} = room;

// 채팅 메시지를 ChatWindow 형식에 맞게 변환
const formattedChatMessages = computed(() => {
  return chatMessages.value.map((msg) => ({
    id: msg.id,
    sender: msg.senderName || msg.sender || "익명",
    senderId: msg.senderId,
    message: msg.content || msg.message,
    timestamp: msg.timestamp,
    system: msg.isSystem || msg.system || msg.messageType === "SYSTEM",
  }));
});

// leaveRoom 래퍼: 방 퇴장 후 로비로 새로고침 리다이렉션
const leaveRoom = async () => {
  try {
    // 원래 leaveRoom 호출 (API 호출 + WebSocket 연결 해제)
    await leaveRoomOriginal();

    // 로비로 새로고침 리다이렉션 (페이지 전체 리로드)
    // window.location.href = '/lobby';
    router.push("/lobby");
    console.log("✅ 로비로 이동 완료");
  } catch (error) {
    console.error("❌ 방 퇴장 중 오류 발생:", error);
    // 에러가 발생해도 로비로 이동
    router.push("/lobby");
  }
};

// 강퇴 이벤트 핸들러: 방장에 의해 강퇴된 경우 로비로 이동
const handleKickedFromRoom = async () => {
  console.log("🚫 방장에 의해 강퇴됨 - 로비로 이동");
  try {
    // WebSocket 연결 해제
    await disconnectWebSocket();
    // 로비로 이동
    router.push("/lobby");
    console.log("✅ 강퇴 후 로비로 이동 완료");
  } catch (error) {
    console.error("❌ 강퇴 후 로비 이동 중 오류:", error);
    // 에러가 발생해도 로비로 이동
    router.push("/lobby");
  }
};

// 새로고침 버튼 클릭 핸들러: 방 상세 정보 및 플레이어 목록 다시 불러오기
const handleRefreshRoom = async () => {
  console.log("🔄 방 정보 새로고침 시작");
  try {
    // 로딩 상태 표시
    isLoadingPlayerList.value = true;

    // 방 상세 정보 다시 조회
    const roomDetail = await roomApiService.getRoomDetail(
      localRoomData.value?.id || props.roomId,
    );

    if (roomDetail) {
      // 방 정보 업데이트
      localRoomData.value = {
        ...localRoomData.value,
        id: roomDetail.roomId ?? localRoomData.value.id,
        title: roomDetail.title ?? localRoomData.value.title,
        timeLimit: roomDetail.timeLimit ?? localRoomData.value.timeLimit,
        gameMode:
          roomDetail.gameMode?.toLowerCase?.() ??
          roomDetail.gameMode ??
          localRoomData.value.gameMode,
        isTeamMode: roomDetail.gameType
          ? roomDetail.gameType.toLowerCase() === "team"
          : localRoomData.value.isTeamMode,
        isPrivate: roomDetail.privateRoom ?? localRoomData.value.isPrivate,
        maxPlayers: roomDetail.maxPlayers ?? localRoomData.value.maxPlayers,
        totalRounds:
          roomDetail.totalRounds ??
          roomDetail.rounds ??
          localRoomData.value.totalRounds,
        poiNameVisible:
          roomDetail.poiNameVisible ??
          localRoomData.value.poiNameVisible ??
          true,
      };

      // 플레이어 목록 업데이트
      const playersFromApi = roomDetail.connectedPlayers || roomDetail.players;
      if (playersFromApi && Array.isArray(playersFromApi)) {
        // useRoom의 transformGameRoomPlayers와 동일한 변환 로직 사용
        const transformedPlayers = playersFromApi.map((player, index) => {
          const memberId = player?.memberId ?? player?.id ?? `player-${index}`;
          return {
            id: memberId != null ? memberId.toString() : `player-${index}`,
            memberId: memberId,
            nickname: player?.nickname || "알 수 없는 플레이어",
            profileImage: player?.markerImageUrl || player?.profileImage || "",
            markerImageUrl: player?.markerImageUrl || "",
            isHost: Boolean(player?.isHost),
            teamId: player?.team ?? player?.teamId ?? null,
            team: player?.team ?? null,
            screenState: String(player?.screenState || "ROOM").toUpperCase(),
            screenStateSeq: Number.isFinite(
              Number(player?.screenStateSeq ?? player?.clientSeq),
            )
              ? Number(player?.screenStateSeq ?? player?.clientSeq)
              : 0,
            screenStateUpdatedAt: Number.isFinite(
              Number(player?.screenStateUpdatedAt ?? player?.updatedAt),
            )
              ? Number(player?.screenStateUpdatedAt ?? player?.updatedAt)
              : null,
            isOnline:
              "isOnline" in (player || {}) ? Boolean(player.isOnline) : true,
            joinedAt: player?.joinedAt ? new Date(player.joinedAt) : new Date(),
            raw: player,
          };
        });

        localPlayers.value = transformedPlayers;
        localRoomData.value.currentPlayerCount = transformedPlayers.length;
      }

      // 방장 여부 업데이트 (API 응답에서 host 필드 사용)
      if (roomDetail.host !== undefined) {
        isHost.value = Boolean(roomDetail.host);
        roomProps.isHost = isHost.value;
        console.log('✅ 방장 여부 업데이트:', isHost.value);
      }

      // 마지막 업데이트 시간 갱신
      lastPlayerListUpdate.value = Date.now();

      console.log(
        "✅ 방 정보 새로고침 완료:",
        localRoomData.value.title,
        "플레이어:",
        localPlayers.value.length,
      );

      // 토스트 알림 표시
      if (toastRef.value) {
        toastRef.value.showSuccessNotification(
          "새로고침 완료",
          "방 정보가 업데이트되었습니다.",
        );
      }
    }
  } catch (error) {
    console.error("❌ 방 정보 새로고침 실패:", error);
    if (toastRef.value) {
      toastRef.value.showErrorNotification(
        "새로고침 실패",
        "방 정보를 불러오는데 실패했습니다.",
      );
    }
  } finally {
    isLoadingPlayerList.value = false;
  }
};

// 반응형 디자인 상태 관리
const isMobileView = ref(false);
const isChatVisible = ref(false);

// 화면 크기 감지
const checkScreenSize = (preserveChatState = false) => {
  const wasDesktop = !isMobileView.value;
  isMobileView.value = window.innerWidth <= 1024;

  // 데스크톱에서 모바일로 전환 시 채팅창 숨김
  if (wasDesktop && isMobileView.value) {
    isChatVisible.value = false;
  } else if (!isMobileView.value) {
    isChatVisible.value = true; // 데스크톱에서는 항상 표시
  }
  // preserveChatState가 true이고 모바일->모바일인 경우 상태 유지
  // 키보드로 인한 뷰포트 변경 시에도 채팅창이 닫히지 않도록 함
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
  console.log("🚪 페이지 종료 감지 - 퇴장 처리 시도");

  try {
    const roomId = localRoomData.value?.id || props.roomId;
    const currentUserId = normalizedCurrentUserId;

    if (!roomId || !currentUserId) {
      console.warn(
        "⚠️ roomId 또는 currentUserId가 없어 퇴장 처리를 건너뜁니다.",
      );
      return;
    }

    // fetch with keepalive를 사용하여 비동기적으로 퇴장 요청
    // keepalive 옵션은 페이지가 닫혀도 요청이 보장됨
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const leaveUrl = `${apiBaseUrl}/api/rooms/${roomId}/leave`;

    // fetch with keepalive로 DELETE 요청 시도 (비동기이지만 keepalive로 보장)
    fetch(leaveUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ memberId: currentUserId }),
      keepalive: true, // 페이지가 닫혀도 요청 보장
      credentials: "include", // 쿠키 포함
    }).catch(() => {
      // fetch 실패는 무시 (페이지가 닫히는 중이므로)
    });

    console.log("✅ fetch keepalive로 퇴장 요청 전송 시도");

    // WebSocket 연결 해제 시도 (동기적으로만 가능, 완료 보장 안 됨)
    // disconnectWebSocket은 비동기이므로 완료를 기다릴 수 없음
    disconnectWebSocket().catch(() => {
      // 실패는 무시
    });
  } catch (error) {
    console.error("❌ beforeunload 퇴장 처리 중 오류:", error);
  }
};

onMounted(async () => {
  checkScreenSize();
  window.addEventListener("resize", () => checkScreenSize(true));

  // 강제 종료 감지를 위한 beforeunload 이벤트 리스너 추가
  window.addEventListener("beforeunload", handleBeforeUnload);

  // 친구 데이터 초기화 (패널 오픈 시 바로 보이도록)
  friendStore.loadInitialData().catch(() => {
    // 실패해도 방 입장은 계속 진행
  });

  // Room 초기화 전에 접근 권한 확인
  try {
    // 더미 모드가 아닌 경우에만 접근 권한 확인
    if (!shouldUseDummyMode) {
      // 1. 접근 권한 확인 (URL로 강제 접근하는 것을 막기 위함)
      const accessCheck = await roomApiService.checkGameAccess(props.roomId);

      if (!accessCheck.allowed) {
        // 접근 불가: 메시지 표시 후 로비로 리다이렉트
        const message = accessCheck.message || "이 방에 접근할 수 없습니다.";
        console.warn("⚠️ 방 접근 권한 없음:", message);
        alert(message);
        window.location.href = "/lobby";
        return;
      }

      console.log("✅ 접근 권한 확인 완료");

      // 2. 접근 가능: getRoomDetail API를 호출하여 방 상세 정보 조회
      const roomDetail = await roomApiService.getRoomDetail(props.roomId);
      
      if (roomDetail) {
        // routerState가 없거나 덮어쓰기 가능한 경우에만 initialRoomData 업데이트
        if (!routerState || routerState.allowOverride) {
          // getRoomDetail 응답을 초기 방 데이터 형식으로 변환
          initialRoomData.id = roomDetail.roomId ?? props.roomId;
          initialRoomData.title = roomDetail.title ?? initialRoomData.title;
          initialRoomData.timeLimit =
            roomDetail.timeLimit ?? initialRoomData.timeLimit;
          initialRoomData.gameMode =
            roomDetail.gameMode?.toLowerCase?.() ??
            roomDetail.gameMode ??
            initialRoomData.gameMode;
          initialRoomData.isTeamMode = roomDetail.gameType
            ? roomDetail.gameType.toLowerCase() === "team"
            : initialRoomData.isTeamMode;
          initialRoomData.isPrivate =
            roomDetail.privateRoom ?? initialRoomData.isPrivate;
          initialRoomData.maxPlayers =
            roomDetail.maxPlayers ?? initialRoomData.maxPlayers;
          initialRoomData.hostId = roomDetail.hostId ?? initialRoomData.hostId;
          initialRoomData.currentPlayerCount =
            roomDetail.currentPlayerCount ?? initialRoomData.currentPlayerCount;

          // roomProps도 업데이트
          roomProps.roomData = { ...initialRoomData };

          console.log(
            "✅ 방 정보 업데이트:",
            initialRoomData,
          );
        }

        // 방장 여부 업데이트 (API 응답에서 host 필드 사용)
        // 항상 업데이트해야 하므로 routerState 조건 밖에서 처리
        if (roomDetail.host !== undefined) {
          isHost.value = Boolean(roomDetail.host);
          roomProps.isHost = isHost.value;
          console.log('✅ 방장 여부 초기화:', isHost.value);
        }
      }

      // 3. Room 초기화 (방 데이터 로딩 및 WebSocket 연결)
      // roomDetail을 전달하여 중복 API 호출 방지
      await initializeRoom(roomDetail);
    } else {
      console.log("🧪 더미 모드: 접근 권한 확인 건너뜀");

      // 3. Room 초기화 (더미 모드)
      await initializeRoom();
    }
  } catch (error) {
    console.error("❌ RoomView 초기화 실패:", error);

    // 접근 권한 확인 실패 또는 방 조회 실패 시 로비로 리다이렉트
    const errorCode = error?.code || "";
    const isAccessDenied =
      errorCode === "ACCESS_DENIED" || error?.response?.status === 403;
    const isRoomNotFound =
      errorCode === "ROOM_NOT_FOUND" ||
      errorCode === "ROOM_LOAD_FAILED" ||
      error?.response?.status === 404;
    const isNetworkError =
      !navigator.onLine ||
      error?.message?.includes("network") ||
      error?.message?.includes("Network");

    if (isAccessDenied) {
      const message =
        error?.response?.data?.message || "이 방에 접근할 수 없습니다.";
      console.warn("⚠️ 방 접근 권한 없음:", message);
      alert(message);
      window.location.href = "/lobby";
      return;
    }

    if (isRoomNotFound || isNetworkError) {
      console.warn(
        "⚠️ 방을 조회할 수 없거나 인터넷 연결이 끊겼습니다. 로비로 이동합니다.",
      );
      alert(
        "방을 조회할 수 없거나 인터넷 연결이 끊겼습니다. 로비로 이동합니다.",
      );
      window.location.href = "/lobby";
      return;
    }

    // 기타 에러는 사용자에게 알림
    alert("방 정보를 불러오는 중 오류가 발생했습니다. 로비로 이동합니다.");
    window.location.href = "/lobby";
  }
});

// 라우터 네비게이션 가드: 다른 페이지로 이동하기 전에 구독 해제
onBeforeRouteLeave(async (to, from, next) => {
  console.log("🚪 라우터 네비게이션 감지:", { to: to.path, from: from.path });

  // 구독 해제 및 정리 작업
  try {
    window.removeEventListener("resize", checkScreenSize);
    clearCountdownTimer();
    await disconnectWebSocket();
    console.log("✅ 라우터 네비게이션 전 구독 해제 완료");
  } catch (error) {
    console.error("❌ 라우터 네비게이션 전 구독 해제 중 오류:", error);
  } finally {
    // 에러가 발생해도 네비게이션은 계속 진행
    next();
  }
});

onBeforeUnmount(() => {
  // 이벤트 리스너 정리
  window.removeEventListener("resize", checkScreenSize);
  window.removeEventListener("beforeunload", handleBeforeUnload);

  // onBeforeRouteLeave가 호출되지 않은 경우를 대비한 안전장치
  clearCountdownTimer();
  disconnectWebSocket();
});

watch(
  () => localRoomData.value?.hostId,
  (newHostId) => {
    const match =
      newHostId != null && newHostId.toString() === normalizedCurrentUserId;
    const nextIsHost = shouldUseDummyMode || match;
    if (nextIsHost !== isHost.value) {
      isHost.value = nextIsHost;
      roomProps.isHost = nextIsHost;
    }
  },
  { immediate: true },
);

// 시간 포맷팅 유틸리티
const formatUpdateTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) {
    return "방금 전";
  } else if (diff < 60000) {
    return `${Math.floor(diff / 1000)}초 전`;
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}분 전`;
  } else {
    return new Date(timestamp).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
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
  padding: var(--spacing-md);
  padding-top: 2rem;
  overflow: hidden;
  max-width: 100vw;
}

.mode-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background);
  z-index: -1;
  transition: background-color var(--transition-slow);
}

.room-content {
  display: flex;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  width: 100%;
  box-sizing: border-box;
}

.left-panel {
  flex: 0 0 65%;
  max-width: 65%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow: hidden;
}

.right-panel {
  flex: 0 0 35%;
  max-width: 35%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
}

/* ─── 친구 플로팅 버튼 영역 ─────────────────────── */
.friend-floating-area {
  position: fixed;
  top: 1rem;
  right: 1.25rem;
  z-index: 200;
  display: flex;
  align-items: center;
}

.panel-section {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-title i {
  color: var(--color-primary);
  font-size: 1.1rem;
}

/* 플레이어 목록이 들어있는 영역을 스크롤 가능하게 */
.panel-section :deep(.solo-players-container),
.panel-section :deep(.teams-container) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
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
  background: var(--color-success);
  color: white;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  animation: pulse-green 2s infinite;
}

.status-indicator.disconnected {
  background: var(--color-warning);
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
  color: var(--color-primary);
  font-size: 0.8rem;
}

@keyframes pulse-green {
  0%,
  100% {
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 2px 12px rgba(34, 197, 94, 0.6);
  }
}

@keyframes pulse-orange {
  0%,
  100% {
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
  color: var(--color-text-secondary);
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(82, 222, 229, 0.35);
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
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.last-update-time small {
  color: var(--color-text-tertiary);
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

/* ChatWindow 컴포넌트가 자체 스타일을 가지고 있으므로 채팅 관련 스타일 제거 */

/* 모바일에서 채팅 숨김 */
.right-panel.hidden-mobile {
  display: none;
}

/* 데스크톱에서 양사이드 광고 공간 확보 */
@media (min-width: 1400px) {
  .multiplayer-room-waiting {
    padding-left: calc((100vw - 1400px) / 2 + var(--spacing-md));
    padding-right: calc((100vw - 1400px) / 2 + var(--spacing-md));
  }

  .room-content {
    margin: 0;
  }
}

/* Responsive design */
@media (max-width: 1200px) {
  .room-content {
    max-width: 100%;
    padding: 0 1rem;
  }

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

  /* 모바일에서 채팅이 표시될 때 적절한 크기로 제한 */
  .right-panel:not(.hidden-mobile) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 420px;
    height: 70vh;
    max-height: 600px;
    z-index: 1000;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35); /* 어두운 배경 없이 채팅창을 부각시키기 위한 그림자 */
    padding: 1rem;
    overflow: hidden;
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
}
</style>
