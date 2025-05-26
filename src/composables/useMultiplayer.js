import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import multiplayerService from '@/api/multiplayerService';
import useAuth from './useAuth';

/**
 * 멀티플레이어 관련 기능을 제공하는 컴포저블
 * @returns {Object} - 멀티플레이어 관련 상태 및 메서드
 */
export default function useMultiplayer() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  
  // 멀티플레이어 상태
  const roomState = reactive({
    roomId: null,
    roomName: '',
    host: null,
    players: [],
    gameMode: 'photo',
    region: 'all',
    totalRounds: 5,
    status: 'waiting', // waiting, playing, finished
    chat: [],
    isPrivate: false,
    maxPlayers: 8,
    currentRound: 0
  });
  
  // 로딩 상태
  const isLoading = ref(false);
  const error = ref(null);
  
  // 웹소켓 연결
  const socket = ref(null);
  
  // 방 목록
  const rooms = ref([]);
  
  // 방 목록 조회
  const getRooms = async (params = {}) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await multiplayerService.getRooms(params);
      rooms.value = response.data;
      
      isLoading.value = false;
      return rooms.value;
    } catch (err) {
      error.value = err.response?.data?.message || '방 목록을 불러오는데 실패했습니다.';
      isLoading.value = false;
      return [];
    }
  };
  
  // 방 생성
  const createRoom = async (roomData) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await multiplayerService.createRoom(roomData);
      const createdRoom = response.data;
      
      // 방 정보 설정
      roomState.roomId = createdRoom.id;
      roomState.roomName = createdRoom.name;
      roomState.host = createdRoom.host;
      roomState.players = createdRoom.players;
      roomState.gameMode = createdRoom.gameMode;
      roomState.region = createdRoom.region;
      roomState.totalRounds = createdRoom.totalRounds;
      roomState.isPrivate = createdRoom.isPrivate;
      roomState.maxPlayers = createdRoom.maxPlayers;
      
      // 웹소켓 연결
      connectToRoom(createdRoom.id);
      
      isLoading.value = false;
      return createdRoom;
    } catch (err) {
      error.value = err.response?.data?.message || '방 생성에 실패했습니다.';
      isLoading.value = false;
      return null;
    }
  };
  
  // 방 참가
  const joinRoom = async (roomId, password = '') => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await multiplayerService.joinRoom(roomId, { password });
      const roomDetails = response.data;
      
      // 방 정보 설정
      roomState.roomId = roomDetails.id;
      roomState.roomName = roomDetails.name;
      roomState.host = roomDetails.host;
      roomState.players = roomDetails.players;
      roomState.gameMode = roomDetails.gameMode;
      roomState.region = roomDetails.region;
      roomState.totalRounds = roomDetails.totalRounds;
      roomState.status = roomDetails.status;
      roomState.isPrivate = roomDetails.isPrivate;
      roomState.maxPlayers = roomDetails.maxPlayers;
      
      // 웹소켓 연결
      connectToRoom(roomId);
      
      isLoading.value = false;
      return roomDetails;
    } catch (err) {
      error.value = err.response?.data?.message || '방 참가에 실패했습니다.';
      isLoading.value = false;
      return null;
    }
  };
  
  // 방 나가기
  const leaveRoom = async () => {
    try {
      if (!roomState.roomId) return true;
      
      isLoading.value = true;
      
      await multiplayerService.leaveRoom(roomState.roomId);
      
      // 웹소켓 연결 해제
      disconnectFromRoom();
      
      // 방 정보 초기화
      resetRoomState();
      
      isLoading.value = false;
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || '방 나가기에 실패했습니다.';
      isLoading.value = false;
      return false;
    }
  };
  
  // 게임 시작
  const startGame = async () => {
    try {
      if (!roomState.roomId) return false;
      if (roomState.host.id !== user.value.id) return false;
      
      isLoading.value = true;
      error.value = null;
      
      await multiplayerService.startGame(roomState.roomId);
      
      isLoading.value = false;
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || '게임 시작에 실패했습니다.';
      isLoading.value = false;
      return false;
    }
  };
  
  // 채팅 메시지 전송
  const sendChatMessage = async (message) => {
    try {
      if (!roomState.roomId) return false;
      
      await multiplayerService.sendChatMessage(roomState.roomId, {
        content: message,
        senderId: user.value.id
      });
      
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || '메시지 전송에 실패했습니다.';
      return false;
    }
  };
  
  // 게임 결과 제출
  const submitResult = async (result) => {
    try {
      if (!roomState.roomId) return false;
      
      isLoading.value = true;
      error.value = null;
      
      await multiplayerService.submitMultiplayerResult(roomState.roomId, result);
      
      isLoading.value = false;
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || '결과 제출에 실패했습니다.';
      isLoading.value = false;
      return false;
    }
  };
  
  // 웹소켓 연결
  const connectToRoom = (roomId) => {
    // 이미 연결된 경우 연결 해제
    if (socket.value) {
      disconnectFromRoom();
    }
    
    // 웹소켓 연결
    const wsUrl = `${process.env.VUE_APP_WS_URL}/multiplayer/${roomId}`;
    socket.value = new WebSocket(wsUrl);
    
    // 웹소켓 이벤트 핸들러 등록
    socket.value.onopen = () => {
      console.log('웹소켓 연결 성공');
    };
    
    socket.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSocketMessage(data);
    };
    
    socket.value.onerror = (error) => {
      console.error('웹소켓 오류:', error);
    };
    
    socket.value.onclose = () => {
      console.log('웹소켓 연결 종료');
    };
  };
  
  // 웹소켓 연결 해제
  const disconnectFromRoom = () => {
    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }
  };
  
  // 웹소켓 메시지 처리
  const handleSocketMessage = (data) => {
    switch (data.type) {
      case 'PLAYER_JOIN':
        roomState.players.push(data.player);
        break;
        
      case 'PLAYER_LEAVE':
        roomState.players = roomState.players.filter(p => p.id !== data.playerId);
        
        // 호스트가 나간 경우 새로운 호스트 설정
        if (data.playerId === roomState.host.id && roomState.players.length > 0) {
          roomState.host = roomState.players[0];
        }
        break;
        
      case 'GAME_START':
        roomState.status = 'playing';
        roomState.currentRound = 1;
        break;
        
      case 'NEXT_ROUND':
        roomState.currentRound = data.round;
        break;
        
      case 'GAME_END':
        roomState.status = 'finished';
        break;
        
      case 'CHAT_MESSAGE':
        roomState.chat.push(data.message);
        break;
        
      case 'ROOM_UPDATE':
        Object.assign(roomState, data.room);
        break;
    }
  };
  
  // 방 상태 초기화
  const resetRoomState = () => {
    roomState.roomId = null;
    roomState.roomName = '';
    roomState.host = null;
    roomState.players = [];
    roomState.gameMode = 'photo';
    roomState.region = 'all';
    roomState.totalRounds = 5;
    roomState.status = 'waiting';
    roomState.chat = [];
    roomState.isPrivate = false;
    roomState.maxPlayers = 8;
    roomState.currentRound = 0;
  };
  
  // 방이 가득 찼는지 확인
  const isRoomFull = computed(() => {
    return roomState.players.length >= roomState.maxPlayers;
  });
  
  // 현재 사용자가 호스트인지 확인
  const isHost = computed(() => {
    if (!user.value || !roomState.host) return false;
    return user.value.id === roomState.host.id;
  });
  
  // 게임 진행률
  const gameProgress = computed(() => {
    if (roomState.currentRound === 0) return 0;
    return (roomState.currentRound / roomState.totalRounds) * 100;
  });
  
  return {
    roomState,
    rooms,
    isLoading,
    error,
    isRoomFull,
    isHost,
    gameProgress,
    getRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    sendChatMessage,
    submitResult
  };
}
