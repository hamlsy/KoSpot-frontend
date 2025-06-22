import { ref, onMounted, onBeforeUnmount, readOnly } from 'vue';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * 팀 WebSocket 서비스 컴포저블
 * 팀 기반 실시간 위치 공유 및 통신을 처리하는 서비스
 * - WebSocket을 통한 실시간 통신 처리
 * - 더미 데이터 모드 지원 (백엔드 없이 개발/테스트 가능)
 * - 팀원들의 마커 위치 동기화
 */
// WebSocket 클라이언트 인스턴스 (STOMP 프로토콜 사용)
const stompClient = ref(null);
// WebSocket 연결 상태 플래그
const isConnected = ref(false);
// 더미 데이터 사용 여부 (백엔드 없이 테스트 시 true로 설정)
const useDummyData = ref(true);

/**
 * 팀 WebSocket 서비스를 초기화하고 제공하는 컴포저블 함수
 * 
 * @returns {Object} 팀 WebSocket 서비스 관련 함수와 데이터를 포함하는 객체
 */
export function useTeamWebSocketService() {
    // 현재 플레이어 정보 (기본값으로 랜덤 ID와 닉네임 생성)
    const currentPlayer = ref({
        id: `player-${Math.floor(Math.random() * 1000)}`, // 랜덤 플레이어 ID
        nickname: `Player-${Math.floor(Math.random() * 1000)}`, // 랜덤 닉네임
        markerImage: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png', // 현재 플레이어 마커 이미지 (빨강)
        teamId: 'team-1' // 기본 팀 ID
    });
    
    // 테스트용 더미 팀원 데이터 (백엔드 없이 테스트할 때 사용)
    const dummyTeamMembers = [
        {
            id: 'player-101',
            nickname: 'TeamMate1',
            markerImage: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_blue.png', // 파란색 마커
            teamId: 'team-1'
        },
        {
            id: 'player-102',
            nickname: 'TeamMate2',
            markerImage: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_yellow.png', // 노란색 마커
            teamId: 'team-1'
        },
        {
            id: 'player-103',
            nickname: 'TeamMate3',
            markerImage: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_green.png', // 초록색 마커
            teamId: 'team-1'
        }
    ];
    
    /**
     * WebSocket 서버에 연결을 시도합니다.
     * 연결에 성공하면 자동으로 팀 채널을 구독합니다.
     * 
     * @param {String} [endpoint='/ws'] - WebSocket 서버의 엔드포인트 URL
     * @param {String} [teamId=null] - 구독할 팀 ID (기본값: 현재 플레이어의 팀 ID)
     */
    const connectWebSocket = (endpoint = '/ws', teamId = null) => {
        // 이미 연결된 경우 중복 연결 방지
        if (isConnected.value) return;
        
        try {
            // 1. SockJS를 사용해 WebSocket 연결 생성 (하위 호환성 제공)
            const socket = new SockJS(endpoint);
            // 2. STOMP 프로토콜을 사용하는 클라이언트 생성
            stompClient.value = Stomp.over(socket);
            
            // 3. WebSocket 연결 시도
            stompClient.value.connect(
                {}, // 연결 헤더 (필요한 경우 인증 정보 등 추가 가능)
                // 연결 성공 콜백
                frame => {
                    console.log('WebSocket 연결 성공:', frame);
                    isConnected.value = true;
                    
                    // 4. 팀 마커 채널 구독
                    // 명시적으로 teamId가 제공된 경우 해당 팀 구독
                    // 그렇지 않으면 현재 플레이어의 팀 ID 사용
                    const targetTeamId = teamId || currentPlayer.value.teamId;
                    if (targetTeamId) {
                        subscribeToTeamMarkers(targetTeamId);
                    }
                },
                // 연결 실패 콜백
                error => {
                    console.error('WebSocket 연결 오류:', error);
                    isConnected.value = false;
                    
                    // 5. WebSocket 연결 실패 시 더미 데이터 모드로 전환
                    useDummyData.value = true;
                    console.log('더미 데이터 모드로 전환됩니다.');
                    
                    // 6. 5초 후에 자동 재연결 시도
                    console.log('5초 후 재연결을 시도합니다...');
                    setTimeout(() => connectWebSocket(endpoint, teamId), 5000);
                }
            );
        } catch (error) {
            // 연결 과정에서 예외 발생 시 처리
            console.error('WebSocket 연결 중 예외 발생:', error);
            useDummyData.value = true;
            console.log('더미 데이터 모드로 전환됩니다.');
        }
    };
    
    /**
     * WebSocket 서버와의 연결을 안전하게 종료합니다.
     * 컴포넌트가 언마운트되기 전에 호출되어야 합니다.
     */
    const disconnectWebSocket = () => {
        // 연결된 상태에서만 연결 해제 시도
        if (stompClient.value && isConnected.value) {
            try {
                stompClient.value.disconnect();
                console.log('WebSocket 연결이 종료되었습니다.');
            } catch (error) {
                console.error('WebSocket 연결 종료 중 오류 발생:', error);
            } finally {
                isConnected.value = false;
                stompClient.value = null;
            }
        }
    };
    
    /**
     * 특정 팀의 마커 업데이트를 구독합니다.
     * 해당 팀의 마커가 업데이트될 때마다 콜백 함수가 호출됩니다.
     * 
     * @param {String} teamId - 구독할 팀의 고유 ID
     * @param {Function} [callback=null] - 메시지 수신 시 실행할 콜백 함수
     * @returns {Object} 구독 객체 (나중에 구독 취소 시 사용 가능)
     */
    const subscribeToTeamMarkers = (teamId, callback = null) => {
        // 클라이언트가 없거나 연결되지 않은 경우 종료
        if (!stompClient.value || !isConnected.value) {
            console.warn('WebSocket이 연결되지 않아 구독할 수 없습니다.');
            return null;
        }
        
        try {
            // STOMP 구독 시작
            const subscription = stompClient.value.subscribe(
                `/topic/team/${teamId}/markers`, // 구독할 주제 (백엔드와 일치해야 함)
                message => {
                    try {
                        // 수신된 메시지를 JSON으로 파싱
                        const markerData = JSON.parse(message.body);
                        console.log('팀 마커 업데이트 수신:', markerData);
                        
                        // 콜백 함수가 제공된 경우 실행
                        if (callback && typeof callback === 'function') {
                            callback(markerData);
                        }
                    } catch (error) {
                        console.error('마커 데이터 파싱 오류:', error);
                    }
                }
            );
            
            console.log(`팀 ${teamId}의 마커 업데이트를 구독했습니다.`);
            return subscription;
        } catch (error) {
            console.error('팀 마커 구독 중 오류 발생:', error);
            return null;
        }
    };
    
    /**
     * 현재 플레이어의 마커 위치를 팀원들에게 전송합니다.
     * 
     * @param {Object} markerData - 전송할 마커 데이터 객체
     * @param {string} markerData.teamId - 대상 팀 ID
     * @param {Object} markerData.position - 마커 위치 정보 { lat: 위도, lng: 경도 }
     * @param {string} [markerData.playerId] - 플레이어 ID (기본값: 현재 플레이어 ID)
     * @returns {boolean} 전송 성공 여부
     */
    const sendTeamMarker = (markerData) => {
        // 연결 상태와 클라이언트 유효성 검사
        if (!isConnected.value || !stompClient.value) {
            console.warn('WebSocket이 연결되지 않아 마커를 전송할 수 없습니다.');
            return false;
        }
        
        try {
            // 필수 필드 검증
            if (!markerData.teamId) {
                console.error('팀 ID가 없어 마커를 전송할 수 없습니다.');
                return false;
            }
            
            // 기본값 설정
            const payload = {
                ...markerData,
                playerId: markerData.playerId || currentPlayer.value.id,
                timestamp: new Date().toISOString() // 메시지 전송 시간 추가
            };
            
            console.log('팀 마커 전송:', payload);
            
            // STOMP 메시지 전송
            // 백엔드의 @MessageMapping("/team/{teamId}/marker")와 매핑됨
            stompClient.value.send(
                `/app/team/${payload.teamId}/marker`, // 메시지 전송 대상 (백엔드와 일치해야 함)
                {}, // 헤더 (필요한 경우 인증 정보 등 추가)
                JSON.stringify(payload) // 직렬화된 마커 데이터
            );
            
            return true;
        } catch (error) {
            console.error('팀 마커 전송 중 오류 발생:', error);
            return false;
        }
    };
    
    /**
     * 실제 서버 없이 마커 데이터 전송을 시뮬레이션합니다.
     * 개발 및 테스트 목적으로 사용됩니다.
     * 
     * @param {Object} markerData - 시뮬레이션할 마커 데이터
     * @param {Function} callback - 시뮬레이션된 응답을 처리할 콜백 함수
     */
    const simulateSendMarker = (markerData, callback) => {
        // 더미 데이터 모드가 아닌 경우 무시
        if (!useDummyData.value) {
            console.warn('더미 데이터 모드가 비활성화되어 있습니다.');
            return;
        }
        
        console.log('더미 모드: 마커 데이터 시뮬레이션', markerData);
        
        // 네트워크 지연을 모방하기 위해 약간의 지연 후 콜백 실행
        setTimeout(() => {
            try {
                if (callback && typeof callback === 'function') {
                    // 실제 서버 응답과 유사한 형식으로 데이터 가공
                    const response = {
                        ...markerData,
                        simulated: true,
                        receivedAt: new Date().toISOString()
                    };
                    callback(response);
                }
            } catch (error) {
                console.error('더미 마커 처리 중 오류 발생:', error);
            }
        }, 300); // 0.3초 지연
    };
    
    /**
     * 테스트용 더미 팀원 목록을 반환합니다.
     * 실제 서버 없이도 팀원 목록을 표시하는 데 사용됩니다.
     * 
     * @returns {Array<Object>} 더미 팀원 객체 배열 (불변성을 위해 복사본 반환)
     */
    const getDummyTeamMembers = () => {
        console.log('더미 팀원 데이터 요청됨');
        // 원본 배열을 수정하지 않기 위해 복사본 반환
        return [...dummyTeamMembers];
    };
    
    /**
     * 현재 플레이어의 정보를 업데이트합니다.
     * 플레이어가 로그인하거나 프로필을 변경할 때 호출됩니다.
     * 
     * @param {Object} playerInfo - 업데이트할 플레이어 정보
     * @param {string} [playerInfo.id] - 플레이어 고유 ID
     * @param {string} [playerInfo.nickname] - 플레이어 닉네임
     * @param {string} [playerInfo.markerImage] - 마커 이미지 URL
     * @param {string} [playerInfo.teamId] - 소속 팀 ID
     */
    const setCurrentPlayer = (playerInfo) => {
        if (!playerInfo || typeof playerInfo !== 'object') {
            console.error('유효하지 않은 플레이어 정보입니다.');
            return;
        }
        
        console.log('플레이어 정보 업데이트:', playerInfo);
        
        // 기존 값과 병합하여 업데이트 (불변성 유지)
        currentPlayer.value = {
            ...currentPlayer.value,
            ...playerInfo,
            // undefined가 되지 않도록 기본값 유지
            id: playerInfo.id || currentPlayer.value.id,
            teamId: playerInfo.teamId || currentPlayer.value.teamId
        };
    };
    
    // 컴포넌트 마운트 시 호출되는 라이프사이클 훅
    onMounted(() => {
        // 주의: 여기서 자동 연결을 시도하지 않습니다.
        // 컴포넌트가 마운트될 때 자동으로 연결하려면 다음 주석을 해제하세요:
        // connectWebSocket();
        console.log('WebSocket 서비스가 초기화되었습니다.');
    });
    
    // 컴포넌트가 언마운트되기 전에 호출되는 라이프사이클 훅
    onBeforeUnmount(() => {
        console.log('컴포넌트 언마운트 중 WebSocket 연결을 정리합니다...');
        // WebSocket 연결 안전하게 종료
        disconnectWebSocket();
    });
    
    // 외부로 노출할 값과 메서드
    return {
        // 상태 (읽기 전용으로 노출)
        /** @type {import('vue').Ref<Object>} STOMP 클라이언트 인스턴스 */
        stompClient: readOnly(stompClient),
        /** @type {import('vue').Ref<boolean>} WebSocket 연결 상태 */
        isConnected: readOnly(isConnected),
        /** @type {import('vue').Ref<boolean>} 더미 데이터 사용 여부 */
        useDummyData,
        /** @type {import('vue').Ref<Object>} 현재 플레이어 정보 */
        currentPlayer: readOnly(currentPlayer),
        
        // 메서드
        /** WebSocket 서버에 연결 */
        connectWebSocket,
        /** WebSocket 연결 종료 */
        disconnectWebSocket,
        /** 팀 마커 업데이트 구독 */
        subscribeToTeamMarkers,
        /** 팀원들에게 마커 위치 전송 */
        sendTeamMarker,
        /** 더미 모드에서 마커 전송 시뮬레이션 */
        simulateSendMarker,
        /** 더미 팀원 목록 가져오기 */
        getDummyTeamMembers,
        /** 현재 플레이어 정보 설정 */
        setCurrentPlayer
    };
}
