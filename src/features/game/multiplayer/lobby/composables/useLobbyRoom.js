import { ref, computed, readonly } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '@/core/api/apiClient.js';
import { API_ENDPOINTS } from '@/core/api/endPoint.js';
import { getErrorMessage } from '@/core/constants/errorCodes.js';

/**
 * 로비에서 방 관련 기능을 제공하는 composables
 * - 방 목록 조회
 * - 방 입장
 * - 방 생성
 * - 에러 처리
 */
export function useLobbyRoom() {
  const router = useRouter();
  
  // 반응형 상태
  const rooms = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const isJoining = ref(false);
  const currentPage = ref(0);
  const hasNextPage = ref(true);
  
  // 계산된 속성
  const availableRooms = computed(() => {
    return rooms.value.filter(room => room.gameRoomStatus === 'WAITING');
  });
  
  const playingRooms = computed(() => {
    return rooms.value.filter(room => room.gameRoomStatus === 'PLAYING');
  });
  
  /**
   * 방 목록을 서버에서 가져옵니다
   * @param {number} page - 페이지 번호 (기본값: 0)
   * @param {boolean} refresh - 새로고침 여부 (기본값: false)
   * @returns {Promise<Array>} 방 목록
   */
  const fetchRooms = async (page = 0, refresh = false) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      console.log(`🔍 방 목록 조회 요청... (페이지: ${page})`);
      
      const response = await apiClient.get(API_ENDPOINTS.GAME_ROOM.LIST(page));
      
      if (response.data && response.data.isSuccess) {
        const roomList = response.data.result || [];
        
        // 첫 페이지이거나 새로고침인 경우 전체 교체, 아니면 추가
        if (page === 0 || refresh) {
          rooms.value = roomList;
        } else {
          rooms.value = [...rooms.value, ...roomList];
        }
        
        currentPage.value = page;
        hasNextPage.value = roomList.length > 0; // 더 정확한 판단은 백엔드에서 총 페이지 수 제공 필요
        
        console.log('✅ 방 목록 조회 성공:', roomList.length, '개의 방 (총:', rooms.value.length, '개)');
        return roomList;
      } else {
        throw new Error(response.data?.message || '방 목록 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 방 목록 조회 실패:', err);
      error.value = _handleApiError(err, '방 목록을 불러오는데 실패했습니다.');
      
      // 개발 모드에서는 더미 데이터 사용 (첫 페이지만)
      if (process.env.NODE_ENV === 'development' && page === 0) {
        console.log('🧪 개발 모드: 더미 데이터 사용');
        rooms.value = _getDummyRooms();
      }
      
      return [];
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * 특정 방에 입장합니다
   * @param {string|number} roomId - 방 ID
   * @param {string} [password] - 비밀번호 (private 방인 경우)
   * @returns {Promise<boolean>} 입장 성공 여부
   */
  const joinRoom = async (roomId, password = null) => {
    if (!roomId) {
      throw new Error('방 ID가 필요합니다.');
    }
    
    isJoining.value = true;
    error.value = null;
    
    try {
      console.log(`🚪 방 입장 시도: ${roomId}`);
      
      // API 요청 바디 구성 (GameRoomRequest.Join)
      const requestBody = {};
      if (password) {
        requestBody.password = password;
      }
      
      const response = await apiClient.post(API_ENDPOINTS.GAME_ROOM.JOIN(roomId), requestBody);
      
      if (response.data && response.data.isSuccess) {
        console.log('✅ 방 입장 성공');
        
        // 방 목록에서 해당 방의 플레이어 수 업데이트 (Redis에서 관리되므로 다시 조회)
        _updateRoomPlayerCountAfterJoin(roomId);
        
        // 방 페이지로 이동
        await router.push({
          name: 'RoomView', 
          params: { roomId: roomId.toString() }
        });
        
        return true;
      } else {
        throw new Error(response.data?.message || '방 입장에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 방 입장 실패:', err);
      error.value = _handleApiError(err, '방에 입장할 수 없습니다.');
      return false;
    } finally {
      isJoining.value = false;
    }
  };
  
  /**
   * 방 객체를 통해 입장합니다 (UI에서 방 카드 클릭 시 사용)
   * @param {Object} room - 방 객체 (FindGameRoomResponse 구조)
   * @returns {Promise<boolean>} 입장 성공 여부
   */
  const joinRoomByObject = async (room) => {
    if (!room || !room.gameRoomId) {
      console.error('❌ 잘못된 방 정보:', room);
      error.value = '잘못된 방 정보입니다.';
      return false;
    }
    
    // 방 상태 검증 (FindGameRoomResponse.gameRoomStatus)
    if (room.gameRoomStatus !== 'WAITING') {
      error.value = '게임이 진행 중인 방에는 입장할 수 없습니다.';
      return false;
    }
    
    // 방이 가득 찬 경우 (FindGameRoomResponse.currentPlayerCount, maxPlayers)
    if (room.currentPlayerCount >= room.maxPlayers) {
      error.value = '방이 가득 찼습니다.';
      return false;
    }
    
    // 비밀방인 경우 비밀번호 처리 (향후 모달로 처리 예정)
    if (room.privateRoom) {
      error.value = '비밀방 입장 기능은 준비 중입니다.';
      return false;
    }
    
    return await joinRoom(room.gameRoomId);
  };
  
  /**
   * 새로운 방을 생성합니다
   * @param {Object} roomData - 방 생성 데이터 (GameRoomRequest.Create)
   * @returns {Promise<Object|null>} 생성된 방 정보 (GameRoomResponse)
   */
  const createRoom = async (roomData) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      console.log('🏗️ 방 생성 시도:', roomData);
      
      const response = await apiClient.post(API_ENDPOINTS.GAME_ROOM.CREATE, roomData);
      
      if (response.data && response.data.isSuccess) {
        const newRoom = response.data.result;
        console.log('✅ 방 생성 성공:', newRoom);
        
        // 방 목록 새로고침 (생성 후 즉시 입장하므로 목록 업데이트 필요)
        await fetchRooms(0, true);
        
        // 생성한 방으로 자동 입장 (GameRoomResponse.gameRoomId 사용)
        await joinRoom(newRoom.gameRoomId);
        
        return newRoom;
      } else {
        throw new Error(response.data?.message || '방 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 방 생성 실패:', err);
      error.value = _handleApiError(err, '방을 생성할 수 없습니다.');
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * 에러 상태를 초기화합니다
   */
  const clearError = () => {
    error.value = null;
  };
  
  /**
   * API 에러를 처리하고 사용자 친화적인 메시지를 반환합니다
   * 백엔드 메시지를 우선 사용하되, UX 개선을 위해 프론트엔드에서 보완
   * @private
   */
  const _handleApiError = (err, defaultMessage) => {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      
      // 백엔드에서 구체적인 에러 정보가 온 경우
      if (data && !data.isSuccess) {
        const backendMessage = data.message;
        const errorCode = data.code;
        
        // 에러 코드별 추가 처리 (UX 개선)
        const enhancedMessage = _enhanceErrorMessage(errorCode, backendMessage);
        if (enhancedMessage) {
          return enhancedMessage;
        }
        
        // 백엔드 메시지 그대로 사용
        if (backendMessage) {
          return backendMessage;
        }
      }
      
      // HTTP 상태코드별 기본 처리
      switch (status) {
        case 400:
          return data?.message || '잘못된 요청입니다.';
        case 401:
          return '로그인이 필요합니다. 다시 로그인해주세요.';
        case 403:
          return '해당 작업을 수행할 권한이 없습니다.';
        case 404:
          return '요청하신 방을 찾을 수 없습니다.';
        case 409:
          return data?.message || '이미 다른 방에 참여 중입니다.';
        case 422:
          return data?.message || '입력 정보를 확인해주세요.';
        case 500:
          return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        case 503:
          return '서비스가 일시적으로 이용할 수 없습니다.';
        default:
          return data?.message || defaultMessage;
      }
    } else if (err.request) {
      return '네트워크 연결을 확인해주세요. 인터넷 연결 상태를 점검해보세요.';
    } else {
      return err.message || defaultMessage;
    }
  };
  
  /**
   * 에러 코드별 메시지 개선 (UX 최적화)
   * @private
   */
  const _enhanceErrorMessage = (errorCode, backendMessage) => {
    // 상수 파일에서 정의된 메시지 사용
    return getErrorMessage(errorCode);
  };
  
  /**
   * 방 입장 후 해당 방의 플레이어 수를 업데이트합니다
   * @private
   */
  const _updateRoomPlayerCountAfterJoin = (roomId) => {
    const roomIndex = rooms.value.findIndex(room => room.gameRoomId === roomId);
    if (roomIndex !== -1) {
      // Redis에서 관리되므로 +1 (정확한 수는 다음 새로고침 시 동기화)
      rooms.value[roomIndex].currentPlayerCount += 1;
    }
  };
  
  /**
   * 개발용 더미 데이터 (FindGameRoomResponse 구조)
   * @private
   */
  const _getDummyRooms = () => {
    return [
      {
        gameRoomId: 1,
        title: '방 제목 A',
        gameMode: 'ROADVIEW',
        gameType: 'INDIVIDUAL',
        maxPlayers: 4,
        currentPlayerCount: 2,
        hostNickname: 'host A',
        privateRoom: false,
        gameRoomStatus: 'WAITING'
      },
      {
        gameRoomId: 2,
        title: '방 제목 B',
        gameMode: 'PHOTO',
        gameType: 'TEAM',
        maxPlayers: 4,
        currentPlayerCount: 3,
        hostNickname: 'host B',
        privateRoom: false,
        gameRoomStatus: 'WAITING'
      },
      {
        gameRoomId: 3,
        title: '게임 진행 중 - 3라운드',
        gameMode: 'ROADVIEW',
        gameType: 'INDIVIDUAL',
        maxPlayers: 8,
        currentPlayerCount: 4,
        hostNickname: 'host C',
        privateRoom: false,
        gameRoomStatus: 'PLAYING'
      },
      {
        gameRoomId: 4,
        title: '비밀방 테스트',
        gameMode: 'PHOTO',
        gameType: 'TEAM',
        maxPlayers: 6,
        currentPlayerCount: 1,
        hostNickname: 'host D',
        privateRoom: true,
        gameRoomStatus: 'WAITING'
      }
    ];
  };
  
  /**
   * 다음 페이지의 방 목록을 추가로 불러옵니다 (무한 스크롤용)
   */
  const loadMoreRooms = async () => {
    if (!hasNextPage.value || isLoading.value) {
      return [];
    }
    
    return await fetchRooms(currentPage.value + 1, false);
  };
  
  /**
   * 방 목록을 새로고침합니다
   */
  const refreshRooms = async () => {
    return await fetchRooms(0, true);
  };

  return {
    // 상태
    rooms: readonly(rooms),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isJoining: readonly(isJoining),
    currentPage: readonly(currentPage),
    hasNextPage: readonly(hasNextPage),
    
    // 계산된 속성
    availableRooms,
    playingRooms,
    
    // 메서드
    fetchRooms,
    loadMoreRooms,
    refreshRooms,
    joinRoom,
    joinRoomByObject,
    createRoom,
    clearError
  };
}