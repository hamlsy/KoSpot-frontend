import webSocketManager from '@/features/game/multiplayer/shared/services/websocket/composables';

export const MULTIPLAYER_SCREEN_STATES = Object.freeze({
  JOINING: 'JOINING',
  IN_GAME: 'IN_GAME',
  RESULT: 'RESULT',
  ROOM: 'ROOM',
  DISCONNECTED: 'DISCONNECTED',
});

const SCREEN_STATE_LABELS = Object.freeze({
  [MULTIPLAYER_SCREEN_STATES.JOINING]: '입장 중',
  [MULTIPLAYER_SCREEN_STATES.IN_GAME]: '게임 화면',
  [MULTIPLAYER_SCREEN_STATES.RESULT]: '결과 화면',
  [MULTIPLAYER_SCREEN_STATES.ROOM]: '방 화면',
  [MULTIPLAYER_SCREEN_STATES.DISCONNECTED]: '연결 끊김',
});

const OUTGOING_SCREEN_STATES = new Set([
  MULTIPLAYER_SCREEN_STATES.IN_GAME,
  MULTIPLAYER_SCREEN_STATES.RESULT,
  MULTIPLAYER_SCREEN_STATES.ROOM,
]);

const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeIncomingScreenState = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (Object.prototype.hasOwnProperty.call(SCREEN_STATE_LABELS, normalized)) {
    return normalized;
  }
  return MULTIPLAYER_SCREEN_STATES.ROOM;
};

// Backward compatibility alias
export const normalizeScreenState = normalizeIncomingScreenState;

export const normalizeOutgoingScreenState = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (!OUTGOING_SCREEN_STATES.has(normalized)) {
    return null;
  }
  return normalized;
};

export const toMemberKey = (value) => {
  if (value == null) {
    return null;
  }
  return String(value);
};

export const extractMemberKeyFromPlayer = (player = {}) => {
  return toMemberKey(player.memberId ?? player.id ?? player.playerId);
};

export const extractScreenStateSeq = (player = {}, fallback = 0) => {
  const seq = toNumber(player.screenStateSeq ?? player.clientSeq, fallback);
  return seq == null ? fallback : seq;
};

export const extractScreenStateUpdatedAt = (player = {}, fallback = null) => {
  return toNumber(
    player.screenStateUpdatedAt ?? player.updatedAt ?? player.serverTimestamp,
    fallback,
  );
};

export const shouldApplyScreenState = (
  currentSeq,
  incomingSeq,
  currentState = null,
  incomingState = null,
) => {
  const current = toNumber(currentSeq, 0);
  const incoming = toNumber(incomingSeq, 0);

  if (incoming < current) {
    return false;
  }

  if (incoming === current) {
    if (incomingState == null && currentState == null) {
      return false;
    }

    return (
      normalizeIncomingScreenState(currentState) !==
      normalizeIncomingScreenState(incomingState)
    );
  }

  return true;
};

export const mergeScreenStateFields = (currentPlayer = {}, incomingPlayer = {}) => {
  const incomingSeq = extractScreenStateSeq(incomingPlayer, 0);
  const currentSeq = extractScreenStateSeq(currentPlayer, 0);

  if (
    !shouldApplyScreenState(
      currentSeq,
      incomingSeq,
      currentPlayer?.screenState,
      incomingPlayer?.screenState,
    )
  ) {
    return currentPlayer;
  }

  return {
    ...currentPlayer,
    screenState: normalizeIncomingScreenState(incomingPlayer.screenState),
    screenStateSeq: incomingSeq,
    screenStateUpdatedAt:
      extractScreenStateUpdatedAt(incomingPlayer, Date.now()) ?? Date.now(),
  };
};

export const getScreenStateLabel = (state) => {
  const normalized = normalizeIncomingScreenState(state);
  return SCREEN_STATE_LABELS[normalized] || SCREEN_STATE_LABELS.ROOM;
};

class ScreenStateSyncService {
  constructor() {
    this.roomSeqMap = new Map();
  }

  nextSeq(roomId) {
    const key = String(roomId || '');
    if (!key) {
      return 1;
    }

    const current = this.roomSeqMap.get(key) || 0;
    const next = current + 1;
    this.roomSeqMap.set(key, next);
    return next;
  }

  resetRoomSeq(roomId) {
    const key = String(roomId || '');
    if (!key) {
      return;
    }
    this.roomSeqMap.delete(key);
  }

  sendScreenState(roomId, state) {
    if (!roomId || !webSocketManager.isConnected.value) {
      return false;
    }

    const normalizedState = normalizeOutgoingScreenState(state);
    if (!normalizedState) {
      console.warn('[ScreenStateSync] 지원되지 않는 송신 상태:', state);
      return false;
    }

    const destination = `/app/room.${roomId}.screen.state`;
    const clientSeq = this.nextSeq(roomId);
    const payload = {
      state: normalizedState,
      clientSeq,
      clientTimestamp: Date.now(),
    };

    return webSocketManager.publish(destination, payload);
  }
}

export const screenStateSyncService = new ScreenStateSyncService();

export default screenStateSyncService;
