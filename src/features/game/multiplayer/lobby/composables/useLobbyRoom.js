import { ref, computed, readonly } from 'vue';
import { useRouter } from 'vue-router';
import { apiClient } from '@/core/api/apiClient.js';
import { API_ENDPOINTS } from '@/core/api/endPoint.js';
import { getErrorMessage } from '@/core/constants/errorCodes.js';
import webSocketManager from '../../shared/services/websocket/composables/index.js';

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
  
  // STOMP 구독 관련
  const roomsSubscriptionId = ref(null);
  const isSubscribed = ref(false);
  const ROOMS_TOPIC = '/topic/rooms';
  
  /**
   * 페이지 초기화 시 모든 GAME ROOM 관련 상태를 초기화합니다
   */
  const resetRoomState = () => {
    console.log('🔄 방 목록 상태 초기화');
    rooms.value = [];
    currentPage.value = 0;
    hasNextPage.value = true;
    isLoading.value = false;
    error.value = null;
    isJoining.value = false;
  };
  
  /**
   * 방 목록을 서버에서 가져옵니다
   * Spring API: GET /gameRoom?page={page}
   * @param {number} page - 페이지 번호 (기본값: 0)
   * @param {boolean} refresh - 새로고침 여부 (기본값: false)
   * @returns {Promise<Array<FindGameRoomResponse>>} 방 목록
   */
  const fetchRooms = async (page = 0, refresh = false) => {
    // 첫 페이지 또는 새로고침인 경우 상태 초기화
    if (page === 0 || refresh) {
      resetRoomState();
    }
    
    // 더미 데이터 모드인 경우 즉시 반환
    if (useDummyData.value) {
      console.log('🧪 개발 모드: 더미 데이터 사용');
      if (page === 0) {
        rooms.value = _getDummyRooms();
        rooms.value = _sortRooms(rooms.value);
      }
      return rooms.value;
    }

    isLoading.value = true;
    error.value = null;
    
    try {
      
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
        
        // 첫 페이지이거나 새로고침인 경우 완전히 갈아치우기
        if (page === 0 || refresh) {
          rooms.value = formattedRooms;
          console.log('✅ 방 목록 완전 교체:', formattedRooms.length, '개');
        } else {
          // 추가 페이지는 기존 목록에 추가
          rooms.value = [...rooms.value, ...formattedRooms];
          console.log('➕ 방 목록 추가:', formattedRooms.length, '개');
        }
        
        // 정렬 적용 (대기 중 우선, 최신 우선)
        if (page === 0 || refresh) {
          rooms.value = _sortRooms(rooms.value);
        }
        
        // 페이징 상태 업데이트 (loadMoreRooms용)
        currentPage.value = page;
        hasNextPage.value = roomList.length > 0; // 다음 페이지 존재 여부는 결과 길이로 판단
        
        return formattedRooms;
      } else {
        throw new Error(response.data?.message || '방 목록 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ 방 목록 조회 실패:', err);
      const errorMessage = _handleApiError(err, '방 목록을 불러오는데 실패했습니다.');
      error.value = errorMessage;
      
      // API 요청 실패 시 상태 초기화 (첫 페이지인 경우에만)
      if (page === 0) {
        console.warn('🌐 API 요청 실패 - 방 목록 상태 초기화');
        resetRoomState();
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
  
      
      // Spring GameRoomRequest.Join 구조에 맞는 요청 바디
      const requestBody = {
        password: password || null
      };
      
      // Spring Controller: @PostMapping("/{id}/join") with @CurrentMember and @RequestBody
      const response = await apiClient.post(API_ENDPOINTS.GAME_ROOM.JOIN(roomId), requestBody);
      
      // Spring ApiResponseDto<SuccessStatus> 응답 처리
      if (response.data && response.data.isSuccess) {
        
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
      // 서버에서 제공하는 메시지를 우선 사용 (예: "틀린 비밀번호 입니다.")
      let errorMessage = '방에 입장할 수 없습니다.';
      
      if (err.response?.data?.message) {
        // 서버에서 제공하는 구체적인 메시지 우선 사용
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = '잘못된 요청입니다. 방 정보를 확인해주세요.';
      } else if (err.response?.status === 403) {
        errorMessage = '비밀번호가 일치하지 않습니다.';
      } else if (err.response?.status === 404) {
        errorMessage = '존재하지 않는 방입니다.';
      } else if (err.response?.status === 409) {
        errorMessage = '이미 다른 방에 참여 중이거나 방이 가득 찼습니다.';
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
        
        // 방 생성 성공 시 newRoom 반환
        // 반환 형식: { gameRoomId, title, gameModeKey, playerMatchTypeKey, maxPlayers }
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
        timeLimit: 60,
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
        timeLimit: 90,
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
        timeLimit: 45,
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
        timeLimit: 120,
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
        timeLimit: 60,
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
        timeLimit: 30,
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
   * 모든 상태를 초기화하고 API에서 최신 목록을 받아옵니다
   * 새로고침 후 STOMP 구독도 확인 및 재구독합니다
   */
  const refreshRooms = async () => {
    console.log('🔄 방 목록 새로고침 시작');
    // refresh=true로 호출하면 fetchRooms 내부에서 resetRoomState()가 호출됨
    const result = await fetchRooms(0, true);
    
    // 새로고침 후 STOMP 구독 확인 및 재구독
    // (새로고침 시 WebSocket 연결이 유지되어 있어도 구독이 끊어질 수 있음)
    subscribeToRoomUpdates();
    
    return result;
  };
  
  /**
   * 방 목록을 정렬합니다
   * 1. 대기 중인 방 우선 (WAITING, 대기 중)
   * 2. 최신 방 우선 (gameRoomId 내림차순)
   * @private
   */
  const _sortRooms = (roomList) => {
    if (!roomList || roomList.length === 0) {
      return roomList;
    }
    
    return [...roomList].sort((a, b) => {
      // 대기 중인 방 체크
      const aIsWaiting = a.gameRoomStatus === 'WAITING' || a.gameRoomStatus === '대기 중';
      const bIsWaiting = b.gameRoomStatus === 'WAITING' || b.gameRoomStatus === '대기 중';
      
      // 대기 중인 방을 우선 배치
      if (aIsWaiting && !bIsWaiting) {
        return -1;
      }
      if (!aIsWaiting && bIsWaiting) {
        return 1;
      }
      
      // 둘 다 대기 중이거나 둘 다 게임 중인 경우, 최신 방 우선 (gameRoomId 내림차순)
      return (b.gameRoomId || 0) - (a.gameRoomId || 0);
    });
  };
  
  /**
   * 정렬된 방 목록을 반환하는 computed 속성
   */
  const sortedRooms = computed(() => {
    return _sortRooms(rooms.value);
  });
  
  /**
   * STOMP를 통해 방 업데이트를 구독합니다
   * /topic/rooms 채널을 구독하여 LobbyNotification 메시지를 수신합니다
   */
  const subscribeToRoomUpdates = () => {
    console.log('🔵 subscribeToRoomUpdates 호출됨', {
      useDummyData: useDummyData.value,
      isSubscribed: isSubscribed.value,
      isConnected: webSocketManager.isConnected.value,
      subscriptionId: roomsSubscriptionId.value
    });
    
    // 더미 데이터 모드에서는 구독하지 않음
    if (useDummyData.value) {
      console.log('🧪 더미 데이터 모드: STOMP 구독 건너뛰기');
      return;
    }
    
    // 기존 구독 해제 (재구독을 위해)
    if (isSubscribed.value && roomsSubscriptionId.value) {
      console.log('🔄 기존 구독 해제 후 재구독');
      try {
        webSocketManager.unsubscribe(ROOMS_TOPIC);
        console.log('✅ 기존 구독 해제 완료');
      } catch (error) {
        console.warn('⚠️ 기존 구독 해제 중 오류 (무시):', error);
      }
      isSubscribed.value = false;
      roomsSubscriptionId.value = null;
    }
    
    // WebSocket 연결 확인 및 구독 시도
    const attemptSubscribe = () => {
      console.log('🔍 구독 시도 - WebSocket 연결 상태:', webSocketManager.isConnected.value);
      
      if (!webSocketManager.isConnected.value) {
        console.log('⚠️ WebSocket이 연결되지 않았습니다.');
        return false;
      }
      
      try {
        console.log('📡 STOMP 방 업데이트 구독 시도: /topic/rooms');
        
        const subscriptionId = webSocketManager.subscribe(ROOMS_TOPIC, (notification) => {
          console.log('📨 LobbyNotification 수신 (/topic/rooms):', notification);
          handleLobbyNotification(notification);
        });
        
        if (subscriptionId) {
          roomsSubscriptionId.value = subscriptionId;
          isSubscribed.value = true;
          console.log('✅ 방 업데이트 구독 성공 (/topic/rooms)');
          console.log('   - Subscription ID:', subscriptionId);
          console.log('   - Topic:', ROOMS_TOPIC);
          console.log('   - 구독 상태:', isSubscribed.value);
          return true;
        } else {
          console.error('❌ 방 업데이트 구독 실패: subscriptionId가 null입니다');
          return false;
        }
      } catch (error) {
        console.error('❌ 방 업데이트 구독 중 오류:', error);
        return false;
      }
    };
    
    // 즉시 구독 시도
    if (attemptSubscribe()) {
      console.log('✅ 즉시 구독 성공');
      return;
    }
    
    // 연결이 안 되어 있으면 연결 콜백에 등록
    console.log('⏳ WebSocket 연결 대기 중...');
    webSocketManager.addConnectionCallback(() => {
      console.log('🔗 WebSocket 연결 완료 콜백 실행 - 구독 시도');
      // 약간의 지연 후 구독 시도 (연결이 완전히 안정화될 시간 확보)
      setTimeout(() => {
        console.log('⏰ 지연 후 구독 재시도');
        if (!attemptSubscribe()) {
          console.error('❌ 연결 콜백에서도 구독 실패');
        }
      }, 100);
    });
    
    // 연결이 곧 완료될 수도 있으므로 짧은 간격으로 재시도
    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = setInterval(() => {
      retryCount++;
      if (webSocketManager.isConnected.value) {
        console.log(`🔄 재시도 ${retryCount}/${maxRetries}: WebSocket 연결됨, 구독 시도`);
        if (attemptSubscribe()) {
          clearInterval(retryInterval);
        }
      } else if (retryCount >= maxRetries) {
        console.warn('⚠️ 최대 재시도 횟수 도달, 구독 실패');
        clearInterval(retryInterval);
      }
    }, 200);
  };
  
  /**
   * LobbyNotification 메시지를 타입별로 처리합니다
   * @param {Object} notification - LobbyNotification 객체
   */
  const handleLobbyNotification = (notification) => {
    if (!notification || !notification.type) {
      console.warn('⚠️ 잘못된 LobbyNotification 형식:', notification);
      return;
    }
    
    const { type, roomId, room, statusUpdatedRoom, timestamp } = notification;
    
    try {
      switch (type) {
        case 'ROOM_CREATED':
          handleRoomCreated(room);
          break;
        case 'ROOM_UPDATED':
          // room 객체가 있으면 바로 업데이트, 없으면 roomId로 업데이트
          if (room) {
            handleRoomUpdatedWithData(room);
          } else {
            handleRoomUpdated(roomId);
          }
          break;
        case 'ROOM_DELETED':
          handleRoomDeleted(roomId);
          break;
        case 'ROOM_STATUS_UPDATED':
          handleRoomStatusUpdated(roomId, statusUpdatedRoom);
          break;
        default:
          console.warn('⚠️ 알 수 없는 LobbyNotification 타입:', type);
      }
    } catch (error) {
      console.error('❌ LobbyNotification 처리 중 오류:', error, notification);
    }
  };
  
  /**
   * ROOM_CREATED 이벤트 처리: 새 방을 목록에 추가합니다
   * @param {Object} room - FindGameRoomResponse 객체
   */
  const handleRoomCreated = (room) => {
    if (!room || !room.gameRoomId) {
      console.warn('⚠️ 잘못된 방 정보:', room);
      return;
    }
    
    console.log('➕ 새 방 생성:', room);
    
    // UI 호환성을 위한 필드 추가
    const formattedRoom = {
      ...room,
      id: room.gameRoomId,
      name: room.title
    };
    
    // 중복 체크 (이미 존재하는 방이면 추가하지 않음)
    const exists = rooms.value.some(r => r.gameRoomId === room.gameRoomId);
    if (exists) {
      console.log('⚠️ 이미 존재하는 방입니다. 업데이트합니다.');
      handleRoomUpdated(room.gameRoomId);
      return;
    }
    
    // 방 목록에 추가
    rooms.value.push(formattedRoom);
    
    // 정렬 적용
    rooms.value = _sortRooms(rooms.value);
  };
  
  /**
   * ROOM_UPDATED 이벤트 처리 (room 객체 포함): 방 정보를 직접 업데이트합니다
   * @param {Object} room - FindGameRoomResponse 객체
   */
  const handleRoomUpdatedWithData = (room) => {
    if (!room || !room.gameRoomId) {
      console.warn('⚠️ 잘못된 방 정보:', room);
      return;
    }
    
    console.log('🔄 방 정보 업데이트 (데이터 포함):', room);
    
    const roomIndex = rooms.value.findIndex(r => r.gameRoomId === room.gameRoomId);
    if (roomIndex !== -1) {
      // UI 호환성을 위한 필드 추가
      const formattedRoom = {
        ...room,
        id: room.gameRoomId,
        name: room.title
      };
      
      // 기존 방 정보 업데이트
      rooms.value[roomIndex] = formattedRoom;
      
      // 정렬 재적용
      rooms.value = _sortRooms(rooms.value);
      
      console.log('✅ 방 정보 업데이트 완료:', room.gameRoomId);
    } else {
      console.warn('⚠️ 업데이트할 방이 목록에 없습니다. 새로 추가합니다:', room.gameRoomId);
      // 목록에 없으면 추가 (방이 새로 생성되었거나 목록에 없었던 경우)
      handleRoomCreated(room);
    }
  };
  
  /**
   * ROOM_UPDATED 이벤트 처리 (roomId만 포함): 방 정보를 API로 다시 가져와서 업데이트합니다
   * 백엔드에서 room 객체를 포함하지 않고 roomId만 보내는 경우를 대비
   * @param {number} roomId - 방 ID
   */
  const handleRoomUpdated = async (roomId) => {
    if (!roomId) {
      console.warn('⚠️ 방 ID가 없습니다.');
      return;
    }
    
    console.log('🔄 방 정보 업데이트 (ID만):', roomId);
    
    // 더미 데이터 모드에서는 API 호출하지 않음
    if (useDummyData.value) {
      console.log('🧪 더미 데이터 모드: 방 업데이트 건너뛰기');
      return;
    }
    
    try {
      // 해당 방이 목록에 있는지 확인
      const roomIndex = rooms.value.findIndex(r => r.gameRoomId === roomId);
      if (roomIndex === -1) {
        console.warn('⚠️ 업데이트할 방이 목록에 없습니다:', roomId);
        // 목록에 없다면 새로고침으로 최신 목록을 가져옴
        await refreshRooms();
        return;
      }
      
      // 전체 목록을 새로고침하여 해당 방의 최신 정보를 가져옴
      // (성능 최적화: 나중에 개별 방 조회 API가 추가되면 변경 가능)
      // 현재는 페이지 0만 새로고침하여 최신 정보 반영
      await fetchRooms(0, true);
      console.log('✅ 방 정보 업데이트 완료:', roomId);
    } catch (error) {
      console.error('❌ 방 정보 업데이트 실패:', error);
    }
  };
  
  /**
   * ROOM_DELETED 이벤트 처리: 방을 목록에서 제거합니다
   * @param {number} roomId - 방 ID
   */
  const handleRoomDeleted = (roomId) => {
    if (!roomId) {
      console.warn('⚠️ 방 ID가 없습니다.');
      return;
    }
    
    console.log('🗑️ 방 삭제:', roomId);
    
    const initialLength = rooms.value.length;
    rooms.value = rooms.value.filter(r => r.gameRoomId !== roomId);
    
    if (rooms.value.length < initialLength) {
      console.log('✅ 방이 목록에서 제거되었습니다.');
    } else {
      console.warn('⚠️ 삭제할 방을 찾을 수 없습니다:', roomId);
    }
  };
  
  /**
   * ROOM_STATUS_UPDATED 이벤트 처리: 방 상태와 플레이어 수만 업데이트합니다
   * @param {number} roomId - 방 ID
   * @param {Object} statusUpdatedRoom - { currentPlayerCount, status }
   */
  const handleRoomStatusUpdated = (roomId, statusUpdatedRoom) => {
    if (!roomId || !statusUpdatedRoom) {
      console.warn('⚠️ 잘못된 상태 업데이트 정보:', { roomId, statusUpdatedRoom });
      return;
    }
    
    console.log('🔄 방 상태 업데이트:', roomId, statusUpdatedRoom);
    
    const roomIndex = rooms.value.findIndex(r => r.gameRoomId === roomId);
    if (roomIndex !== -1) {
      // 상태와 플레이어 수만 업데이트
      if (statusUpdatedRoom.currentPlayerCount !== undefined) {
        rooms.value[roomIndex].currentPlayerCount = statusUpdatedRoom.currentPlayerCount;
      }
      if (statusUpdatedRoom.status !== undefined) {
        rooms.value[roomIndex].gameRoomStatus = statusUpdatedRoom.status;
      }
      
      // 정렬 재적용 (상태 변경으로 인해 순서가 바뀔 수 있음)
      rooms.value = _sortRooms(rooms.value);
      
      console.log('✅ 방 상태 업데이트 완료:', roomId);
    } else {
      console.warn('⚠️ 업데이트할 방을 찾을 수 없습니다:', roomId);
    }
  };
  
  /**
   * STOMP 구독을 해제합니다
   */
  const unsubscribeFromRoomUpdates = () => {
    if (!isSubscribed.value) {
      console.log('⚠️ 구독 중이 아닙니다.');
      return;
    }
    
    try {
      if (roomsSubscriptionId.value) {
        webSocketManager.unsubscribe(ROOMS_TOPIC);
        console.log('✅ 방 업데이트 구독 해제 완료');
      }
    } catch (error) {
      console.error('❌ 구독 해제 중 오류:', error);
    } finally {
      roomsSubscriptionId.value = null;
      isSubscribed.value = false;
    }
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
    rooms: sortedRooms, // 정렬된 방 목록 반환
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
    resetRoomState,
    
    // STOMP 관련 메서드
    subscribeToRoomUpdates,
    unsubscribeFromRoomUpdates,
    
    // 개발/디버깅 메서드
    enableDummyData,
    disableDummyData
  };
}