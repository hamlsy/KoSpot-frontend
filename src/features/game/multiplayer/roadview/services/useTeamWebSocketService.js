import { ref, onMounted, onBeforeUnmount, readonly } from 'vue';
import useWebSocketManager from 'src/features/game/shared/services/websocket/useWebSocketManager.js'
import webSocketManager from './websocket';
import { isConnected } from 'src/features/game/shared/services/websocket/core';

/**
 * 팀 WebSocket 서비스 컴포저블
 * 팀 기반 실시간 위치 공유 및 통신을 처리하는 서비스
 * - WebSocket을 통한 실시간 통신 처리
 * - 더미 데이터 모드 지원 (백엔드 없이 개발/테스트 가능)
 * - 팀원들의 마커 위치 동기화
 * 
 * 이 서비스는 useWebSocketManager를 활용하여 게임 시작 전 방에서부터
 * 게임 화면까지 웹소켓 연결을 유지합니다.
 */
// 팀 채널 구독 정보
const teamSubscriptions = ref(new Map());

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
    
    // WebSocketManager에서 상태 가져오기
    const { isConnected, useDummyData } = webSocketManager;
    
    /**
     * WebSocket 서버에 연결을 시도합니다.
     * 연결에 성공하면 자동으로 팀 채널을 구독합니다.
     * 
     * @param {String} [endpoint='/ws'] - WebSocket 서버의 엔드포인트 URL
     * @param {String} [teamId=null] - 구독할 팀 ID (기본값: 현재 플레이어의 팀 ID)
     */
    const connectWebSocket = (endpoint = '/ws', teamId = null) => {
        // 이미 연결된 경우에는 팀 채널만 구독
        if (isConnected.value) {
            const targetTeamId = teamId || currentPlayer.value.teamId;
            if (targetTeamId) {
                subscribeToTeamMarkers(targetTeamId);
            }
            return;
        }
        
        // 연결 성공 시 호출될 콜백 함수
        const onConnectCallback = () => {
            const targetTeamId = teamId || currentPlayer.value.teamId;
            if (targetTeamId) {
                subscribeToTeamMarkers(targetTeamId);
            }
        };
        
        // WebSocketManager를 통해 연결
        webSocketManager.connect(endpoint, onConnectCallback);
    };
    
    /**
     * 팀 관련 WebSocket 구독을 해제합니다.
     * 컴포넌트가 언마운트되기 전에 호출되어야 합니다.
     * 전체 연결을 종료하지 않고 팀 구독만 해제합니다.
     */
    const disconnectWebSocket = () => {
        // 팀 구독 해제
        teamSubscriptions.value.forEach((topic) => {
            try {
                webSocketManager.unsubscribe(topic);
            } catch (error) {
                console.error(`팀 구독 해제 중 오류 (${topic}):`, error);
            }
        });
        
        // 구독 목록 초기화
        teamSubscriptions.value.clear();
        console.log('팀 구독이 모두 해제되었습니다.');
    };
    
    /**
     * 특정 팀의 마커 업데이트 채널을 구독합니다.
     * 
     * @param {String} teamId - 구독할 팀 ID
     */
    const subscribeToTeamMarkers = (teamId) => {
        // WebSocket이 연결되지 않은 경우 구독 불가
        if (!isConnected.value) {
            console.warn('WebSocket이 연결되지 않아 구독할 수 없습니다.');
            return;
        }
        
        try {
            // 팀 마커 업데이트 채널 구독
            const topic = `/topic/team/${teamId}/markers`;
            
            // 이미 구독 중인지 확인
            if (teamSubscriptions.value.has(topic)) {
                console.log(`이미 팀 ${teamId}의 마커 채널에 구독 중입니다.`);
                return;
            }
            
            // 메시지 처리 콜백 함수
            const handleMessage = (message) => {
                try {
                    // 수신된 메시지 받아서 처리
                    const markerData = JSON.parse(message);
                    console.log('팀 마커 업데이트 수신:', markerData);
                    
                    // 이곳에서 수신된 마커 데이터를 처리하는 코드 추가 가능
                    // 예: 마커 업데이트 이벤트 발생 등
                } catch (error) {
                    console.error('팀 마커 메시지 파싱 오류:', error);
                }
            };
            
            // WebSocketManager를 통해 구독
            const subscriptionId = webSocketManager.subscribe(topic, handleMessage);
            
            // 구독 정보 저장
            teamSubscriptions.value.set(topic, subscriptionId);
            
            console.log(`팀 ${teamId}의 마커 채널에 구독했습니다.`);
        } catch (error) {
            console.error('팀 채널 구독 중 오류 발생:', error);
            console.error('팀 마커 구독 중 오류 발생:', error);
            return null;
        }
    };
    
    /**
     * 팀 마커 정보를 WebSocket을 통해 서버로 전송합니다.
     * 
     * @param {Object} markerData - 전송할 마커 데이터 객체
     * @param {String} teamId - 마커가 속한 팀 ID
     */
    const sendTeamMarker = (markerData, teamId = null) => {
        // 더미 데이터 모드에서는 실제 전송하지 않고 시ミュ레이션만 수행
        if (useDummyData.value) {
            console.log('더미 모드: 마커 전송 시ミュ레이션', markerData);
            return;
        }
        
        // WebSocket 연결이 없는 경우 전송 불가
        if (!isConnected.value) {
            console.warn('WebSocket이 연결되지 않아 마커를 전송할 수 없습니다.');
            return;
        }
        
        try {
            // 팀 ID가 지정되지 않은 경우 현재 플레이어의 팀 ID 사용
            const targetTeamId = teamId || currentPlayer.value.teamId;
            
            // 마커 데이터에 플레이어 정보 추가
            const enrichedMarkerData = {
                ...markerData,
                playerId: currentPlayer.value.id,
                playerNickname: currentPlayer.value.nickname,
                timestamp: new Date().toISOString()
            };
            
            // WebSocketManager를 통해 마커 데이터 전송
            const destination = `/app/team/${targetTeamId}/markers`;
            webSocketManager.publish(destination, enrichedMarkerData);
            
            console.log(`팀 ${targetTeamId}에 마커 데이터를 전송했습니다:`, enrichedMarkerData);
        } catch (error) {
            console.error('마커 데이터 전송 중 오류 발생:', error);
        }
    };
    
    /**
     * 실제 서버 없이 마커 데이터 전송을 시ミュ레이션합니다.
     * 개발 및 테스트 목적으로 사용됩니다.
     * 
     * @param {Object} markerData - 시ミュ레이션할 마커 데이터
     * @param {String} teamId - 마커가 속한 팀 ID
     * @param {Function} callback - 시ミュ레이션된 응답을 처리할 콜백 함수
     */
    const simulateSendMarker = (markerData, teamId = null, callback) => {
        // 더미 데이터 모드가 아닌 경우 실제 전송 시도
        if (!useDummyData.value) {
            sendTeamMarker(markerData, teamId);
            return;
        }
        
        // 팀 ID가 지정되지 않은 경우 현재 플레이어의 팀 ID 사용
        const targetTeamId = teamId || currentPlayer.value.teamId;
        
        // 마커 데이터에 플레이어 정보 추가
        const enrichedMarkerData = {
            ...markerData,
            playerId: currentPlayer.value.id,
            playerNickname: currentPlayer.value.nickname,
            timestamp: new Date().toISOString(),
            simulated: true
        };
        
        console.log(`[더미 모드] 팀 ${targetTeamId}에 마커 데이터 전송 시ミュ레이션:`, enrichedMarkerData);
        
        // WebSocketManager의 더미 데이터 모드 활용
        const topic = `/topic/team/${targetTeamId}/markers`;
        webSocketManager.simulateMessage(topic, enrichedMarkerData);
        
        // 콜백 함수가 있는 경우 약간의 지연 후 실행
        if (callback && typeof callback === 'function') {
            setTimeout(() => {
                callback({
                    ...enrichedMarkerData,
                    receivedAt: new Date().toISOString()
                });
            }, 300); // 0.3초 지연
        }
    };
    
    // 테스트용 더미 팀원 데이터
    const dummyTeamMembers = [
        {
            id: 'dummy-player-1',
            nickname: '팀원 1',
            markerImage: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
            teamId: 'team-1',
            lastPosition: { lat: 37.5665, lng: 126.9780 },
            lastUpdate: new Date().toISOString()
        },
        {
            id: 'dummy-player-2',
            nickname: '팀원 2',
            markerImage: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
            teamId: 'team-1',
            lastPosition: { lat: 37.5668, lng: 126.9770 },
            lastUpdate: new Date().toISOString()
        },
        {
            id: 'dummy-player-3',
            nickname: '팀원 3',
            markerImage: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_gold.png',
            teamId: 'team-1',
            lastPosition: { lat: 37.5658, lng: 126.9795 },
            lastUpdate: new Date().toISOString()
        }
    ];

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
        /** @type {import('vue').Ref<boolean>} WebSocket 연결 상태 */
        isConnected: readonly(isConnected),
        /** @type {import('vue').Ref<boolean>} 더미 데이터 사용 여부 */
        useDummyData,
        /** @type {import('vue').Ref<Object>} 현재 플레이어 정보 */
        currentPlayer: readonly(currentPlayer),
        
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
