import { ref, onMounted, onBeforeUnmount, readOnly } from 'vue';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * 팀 WebSocket 서비스
 * 팀 기반 기능을 위한 실시간 통신 처리
 */
// WebSocket 연결 상태
const stompClient = ref(null);
const isConnected = ref(false);
const useDummyData = ref(true);

export function useTeamWebSocketService() {
    
    // 현재 플레이어 정보
    const currentPlayer = ref({
        id: `player-${Math.floor(Math.random() * 1000)}`,
        nickname: `Player-${Math.floor(Math.random() * 1000)}`,
        profileImage: 'https://via.placeholder.com/50',
        teamId: 'team-1'
    });
    
    // 테스트용 더미 팀원 데이터
    const dummyTeamMembers = [
        {
            id: 'player-101',
            nickname: 'TeamMate1',
            profileImage: 'https://via.placeholder.com/50',
            teamId: 'team-1'
        },
        {
            id: 'player-102',
            nickname: 'TeamMate2',
            profileImage: 'https://via.placeholder.com/50',
            teamId: 'team-1'
        },
        {
            id: 'player-103',
            nickname: 'TeamMate3',
            profileImage: 'https://via.placeholder.com/50',
            teamId: 'team-1'
        }
    ];
    
    /**
     * WebSocket 서버에 연결
     * @param {String} endpoint - WebSocket 엔드포인트
     * @param {String} teamId - 구독할 팀 ID
     */
    const connectWebSocket = (endpoint = '/ws', teamId = null) => {
        if (isConnected.value) return;
        
        try {
            // SockJS 및 Stomp 클라이언트 생성
            const socket = new SockJS(endpoint);
            stompClient.value = Stomp.over(socket);
            
            stompClient.value.connect(
                {}, // 헤더
                frame => {
                    console.log('WebSocket 연결됨:', frame);
                    isConnected.value = true;
                    
                    // 팀 마커 채널 구독
                    if (teamId) {
                        subscribeToTeamMarkers(teamId);
                    } else if (currentPlayer.value.teamId) {
                        subscribeToTeamMarkers(currentPlayer.value.teamId);
                    }
                },
                error => {
                    console.error('WebSocket 연결 오류:', error);
                    isConnected.value = false;
                    
                    // WebSocket 연결 실패 시 더미 데이터 모드 활성화
                    useDummyData.value = true;
                    
                    // 지연 후 재연결 시도
                    setTimeout(() => connectWebSocket(endpoint, teamId), 5000);
                }
            );
        } catch (error) {
            console.error('WebSocket 연결 실패:', error);
            useDummyData.value = true;
        }
    };
    
    /**
     * WebSocket 서버 연결 해제
     */
    const disconnectWebSocket = () => {
        if (stompClient.value && isConnected.value) {
            stompClient.value.disconnect();
            isConnected.value = false;
        }
    };
    
    /**
     * 팀 마커 채널 구독
     * @param {String} teamId - 구독할 팀 ID
     * @param {Function} callback - 수신된 메시지를 처리할 콜백 함수
     */
    const subscribeToTeamMarkers = (teamId, callback = null) => {
        if (!stompClient.value || !isConnected.value) return;
        
        stompClient.value.subscribe(`/topic/team/${teamId}/markers`, message => {
            const markerData = JSON.parse(message.body);
            if (callback) {
                callback(markerData);
            }
        });
    };
    
    /**
     * 팀원들에게 마커 데이터 전송
     * @param {Object} markerData - 전송할 마커 데이터
     */
    const sendTeamMarker = (markerData) => {
        if (!isConnected.value || !stompClient.value) return false;
        
        try {
            stompClient.value.send(
                `/app/team/${markerData.teamId}/marker`, 
                {}, 
                JSON.stringify(markerData)
            );
            return true;
        } catch (error) {
            console.error('팀 마커 전송 실패:', error);
            return false;
        }
    };
    
    /**
     * 마커 데이터 전송 시뮬레이션 (더미 모드용)
     * @param {Object} markerData - 시뮬레이션할 마커 데이터
     * @param {Function} callback - 시뮬레이션된 응답을 처리할 콜백 함수
     */
    const simulateSendMarker = (markerData, callback) => {
        if (!useDummyData.value) return;
        
        setTimeout(() => {
            if (callback) {
                callback(markerData);
            }
        }, 300);
    };
    
    /**
     * 더미 팀원 데이터 가져오기
     * @returns {Array} 더미 팀원 배열
     */
    const getDummyTeamMembers = () => {
        return [...dummyTeamMembers];
    };
    
    /**
     * 현재 플레이어 정보 설정
     * @param {Object} playerInfo - 플레이어 정보
     */
    const setCurrentPlayer = (playerInfo) => {
        currentPlayer.value = {
            ...currentPlayer.value,
            ...playerInfo
        };
    };
    
    // 라이프사이클 훅 설정
    onMounted(() => {
        // 연결은 소비자 컴포넌트에서 초기화할 수 있음
    });
    
    onBeforeUnmount(() => {
        disconnectWebSocket();
    });
    
    return {
        // 상태
        stompClient: readOnly(stompClient),
        isConnected: readOnly(isConnected),
        useDummyData,
        currentPlayer,
        
        // 메서드
        connectWebSocket,
        disconnectWebSocket,
        subscribeToTeamMarkers,
        sendTeamMarker,
        simulateSendMarker,
        getDummyTeamMembers,
        setCurrentPlayer
    };
}
