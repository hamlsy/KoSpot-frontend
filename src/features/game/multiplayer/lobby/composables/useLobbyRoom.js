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
  const useDummyData = ref(false); // 더미 데이터 사용 여부
  
  // 페이징 관련 (loadMoreRooms에서만 사용)
  const currentPage = ref(0);
  const hasNextPage = ref(true);
  

  
  /**
   * 방 목록을 서버에서 가져옵니다
   * Spring API: GET /gameRoom?page={page}
   * @param {number} page - 페이지 번호 (기본값: 0)
   * @param {boolean} refresh - 새로고침 여부 (기본값: false)
   * @returns {Promise<Array<FindGameRoomResponse>>} 방 목록
   */
  const fetchRooms = async (page = 0, refresh = false) => {
    // 더미 데이터 모드인 경우 즉시 반환
    if (useDummyData.value) {
      console.log('🧪 개발 모드: 더미 데이터 사용');
      if (page === 0) {
        rooms.value = _getDummyRooms();
      }
      return rooms.value;
    }

    isLoading.value = true;
    error.value = null;
    
    try {
      console.log(`🔍 방 목록 조회 요청... (페이지: ${page})`);
      
      // Spring Controller: @GetMapping("/") with @RequestParam("page")
      const response = await apiClient.get(API_ENDPOINTS.GAME_ROOM.LIST, {
        params: { page }
      });
      
      // Spring ApiResponseDto 응답 구조에 맞게 처리
      if (response.data && response.data.isSuccess) {
        const roomList = response.data.result || [];
        
        // FindGameRoomResponse 배열을 UI에서 사용할 수 있도록 변환
        const formattedRooms = roomList.map(room => ({
          ...room,
          // Spring에서 오는 필드명과 UI에서 사용하는 필드명 매핑
          id: room.gameRoomId, // UI 호환성을 위해 추가
          name: room.title,     // UI 호환성을 위해 추가
        }));
        
        // 첫 페이지이거나 새로고침인 경우 전체 교체, 아니면 추가
        if (page === 0 || refresh) {
          rooms.value = formattedRooms;
        } else {
          rooms.value = [...rooms.value, ...formattedRooms];
        }
        
        // 페이징 상태 업데이트 (loadMoreRooms용)
        currentPage.value = page;
        hasNextPage.value = roomList.length > 0; // 다음 페이지 존재 여부는 결과 길이로 판단
        
        console.log('✅ 방 목록 조회 성공:', roomList.length, '개의 방 (총:', rooms.value.length, '개)');
        return formattedRooms;
      } else {
        throw new Error(response.data?.message || '방 목록 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 방 목록 조회 실패:', err);
      const errorMessage = _handleApiError(err, '방 목록을 불러오는데 실패했습니다.');
      error.value = errorMessage;
      
      // API 요청 실패 시 빈 배열로 설정 (첫 페이지인 경우에만)
      if (page === 0) {
        console.warn('🌐 API 요청 실패 - 방 목록 클리어');
        rooms.value = [];
      }
      
      return [];
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * 특정 방에 입장합니다
   * Spring API: POST /gameRoom/{id}/join with GameRoomRequest.Join
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
      console.log(`🚪 방 입장 시도: ${roomId}${password ? ' (비밀방)' : ''}`);
      
      // Spring GameRoomRequest.Join 구조에 맞는 요청 바디
      const requestBody = {
        password: password || null
      };
      
      // Spring Controller: @PostMapping("/{id}/join") with @CurrentMember and @RequestBody
      const response = await apiClient.post(API_ENDPOINTS.GAME_ROOM.JOIN(roomId), requestBody);
      
      // Spring ApiResponseDto<SuccessStatus> 응답 처리
      if (response.data && response.data.isSuccess) {
        console.log('✅ 방 입장 성공 - API 응답:', response.data);
        
        // Redis에서 관리되는 현재 플레이어 수를 즉시 업데이트
        _updateRoomPlayerCountAfterJoin(roomId);
        
        // 방 페이지로 이동 (라우트 파라미터는 문자열로 변환)
        await router.push({
          name: 'RoomView', 
          params: { roomId: roomId.toString() }
        });
        
        return true;
      } else {
        // Spring에서 실패 응답이 온 경우
        const errorMessage = response.data?.message || '방 입장에 실패했습니다.';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ 방 입장 실패:', err);
      
      // Spring에서 발생할 수 있는 구체적인 에러 처리
      let errorMessage = '방에 입장할 수 없습니다.';
      
      if (err.response?.status === 400) {
        errorMessage = '잘못된 요청입니다. 방 정보를 확인해주세요.';
      } else if (err.response?.status === 403) {
        errorMessage = '비밀번호가 일치하지 않습니다.';
      } else if (err.response?.status === 404) {
        errorMessage = '존재하지 않는 방입니다.';
      } else if (err.response?.status === 409) {
        errorMessage = '이미 다른 방에 참여 중이거나 방이 가득 찼습니다.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      error.value = errorMessage;
      return false;
    } finally {
      isJoining.value = false;
    }
  };
  
  /**
   * 방 객체를 통해 입장합니다 (UI에서 방 카드 클릭 시 사용)
   * FindGameRoomResponse 객체를 검증한 후 joinRoom 호출
   * @param {Object} room - 방 객체 (FindGameRoomResponse 구조)
   * @param {string} [password] - 비밀방인 경우 비밀번호
   * @returns {Promise<boolean>} 입장 성공 여부
   */
  const joinRoomByObject = async (room, password = null) => {
    if (!room || !room.gameRoomId) {
      console.error('❌ 잘못된 방 정보:', room);
      error.value = '잘못된 방 정보입니다.';
      return false;
    }
    
    // FindGameRoomResponse.gameRoomStatus 검증
    // Spring에서 올 수 있는 상태값들을 고려 (대기 중, 게임 중 등)
    if (room.gameRoomStatus && room.gameRoomStatus !== '대기 중' && room.gameRoomStatus !== 'WAITING') {
      error.value = '게임이 진행 중인 방에는 입장할 수 없습니다.';
      return false;
    }
    
    // FindGameRoomResponse.currentPlayerCount, maxPlayers 검증
    if (room.currentPlayerCount >= room.maxPlayers) {
      error.value = '방이 가득 찼습니다.';
      return false;
    }
    
    // FindGameRoomResponse.privateRoom 처리
    if (room.privateRoom && !password) {
      error.value = '비밀방 입장을 위해서는 비밀번호가 필요합니다.';
      return false;
    }
    
    // Spring API 호출
    return await joinRoom(room.gameRoomId, password);
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
   * Spring ApiResponseDto 응답 구조에 맞게 처리
   * @private
   */
  const _handleApiError = (err, defaultMessage) => {
    if (err.response?.data) {
      const data = err.response.data;
      
      // Spring ApiResponseDto에서 제공하는 메시지 우선 사용
      if (data.message) {
        return data.message;
      }
      
      // 에러 코드가 있는 경우 상수 파일에서 메시지 조회
      if (data.code) {
        const enhancedMessage = getErrorMessage(data.code);
        if (enhancedMessage) {
          return enhancedMessage;
        }
      }
    }
    
    // HTTP 상태코드별 기본 처리
    if (err.response?.status) {
      const status = err.response.status;
      switch (status) {
        case 400:
          return '잘못된 요청입니다. 입력 정보를 확인해주세요.';
        case 401:
          return '로그인이 필요합니다. 다시 로그인해주세요.';
        case 403:
          return '해당 작업을 수행할 권한이 없습니다.';
        case 404:
          return '요청하신 방을 찾을 수 없습니다.';
        case 409:
          return '이미 다른 방에 참여 중이거나 방이 가득 찼습니다.';
        case 500:
          return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        default:
          return defaultMessage;
      }
    }
    
    // 네트워크 에러
    if (err.request) {
      return '네트워크 연결을 확인해주세요.';
    }
    
    // 기타 에러
    return err.message || defaultMessage;
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
   * 개발용 더미 데이터 (Spring FindGameRoomResponse 구조)
   * @private
   * @returns {Array<FindGameRoomResponse>} 더미 방 목록
   */
  const _getDummyRooms = () => {
    // Spring FindGameRoomResponse 필드에 정확히 맞는 더미 데이터
    const dummyRooms = [
      {
        gameRoomId: 1,
        title: '🏙️ 서울 시내 투어방',
        gameMode: '로드뷰',
        gameType: '개인전',
        maxPlayers: 4,
        currentPlayerCount: 2,
        hostNickname: '김서울',
        privateRoom: false,
        gameRoomStatus: '대기 중'
      },
      {
        gameRoomId: 2,
        title: '📸 부산 맛집 포토존',
        gameMode: '포토모드',
        gameType: '팀전',
        maxPlayers: 6,
        currentPlayerCount: 4,
        hostNickname: '부산갈매기',
        privateRoom: false,
        gameRoomStatus: '대기 중'
      },
      {
        gameRoomId: 3,
        title: '🎮 제주 관광지 랜덤게임',
        gameMode: '로드뷰',
        gameType: '개인전',
        maxPlayers: 8,
        currentPlayerCount: 6,
        hostNickname: '제주감귤',
        privateRoom: false,
        gameRoomStatus: '게임 중'
      },
      {
        gameRoomId: 4,
        title: '🔒 VIP 전용 경기도 탐험',
        gameMode: '포토모드',
        gameType: '팀전',
        maxPlayers: 4,
        currentPlayerCount: 1,
        hostNickname: '경기도민',
        privateRoom: true,
        gameRoomStatus: '대기 중'
      },
      {
        gameRoomId: 5,
        title: '🌸 대구 벚꽃 명소 찾기',
        gameMode: '로드뷰',
        gameType: '개인전',
        maxPlayers: 6,
        currentPlayerCount: 3,
        hostNickname: '대구사과',
        privateRoom: false,
        gameRoomStatus: '대기 중'
      },
      {
        gameRoomId: 6,
        title: '⚡ 인천 스피드 배틀',
        gameMode: '포토모드',
        gameType: '팀전',
        maxPlayers: 8,
        currentPlayerCount: 7,
        hostNickname: '인천바다',
        privateRoom: false,
        gameRoomStatus: '게임 중'
      }
    ];
    
    // UI 호환성을 위한 필드 추가 (실제 API 호출과 동일한 변환 적용)
    return dummyRooms.map(room => ({
      ...room,
      id: room.gameRoomId, // UI 호환성
      name: room.title      // UI 호환성
    }));
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
  
  /**
   * 더미 데이터 사용 여부를 설정합니다 (개발/테스트 목적)
   * @param {boolean} enabled - 더미 데이터 사용 여부
   */
  const enableDummyData = (enabled = true) => {
    useDummyData.value = enabled;
    if (enabled) {
      console.log('🧪 더미 데이터 모드 활성화');
      rooms.value = _getDummyRooms();
      error.value = null; // 기존 에러 클리어
    }
  };
  
  /**
   * 더미 데이터를 비활성화하고 실제 API를 다시 호출합니다
   */
  const disableDummyData = async () => {
    useDummyData.value = false;
    console.log('🌐 실제 API 모드로 전환');
    rooms.value = [];
    await fetchRooms(0, true);
  };
  
  return {
    // 상태
    rooms: readonly(rooms),
    isLoading: readonly(isLoading),
    error: readonly(error),
    isJoining: readonly(isJoining),
    useDummyData: readonly(useDummyData),
    
    // 메서드
    fetchRooms,
    loadMoreRooms,
    refreshRooms,
    joinRoom,
    joinRoomByObject,
    createRoom,
    clearError,
    
    // 개발/디버깅 메서드
    enableDummyData,
    disableDummyData
  };
}