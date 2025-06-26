import { h, onMounted, onBeforeUnmount, render, ref, watch } from 'vue';
import { useKakaoMapState } from './useKakaoMapState';
import VoteOverlay from 'src/features/game/shared/components/Kakao/VoteOverlay.vue';
import { useTeamWebSocketService } from 'src/features/game/shared/services/useTeamWebSocketService';
import webSocketManager from 'src/features/game/shared/services/websocket';

export function useKakaoMapTeamVote(props, emit) {
    const { map, marker, teamMarkers, isVoteInProgress, voteInitiatorId } = useKakaoMapState();
    
    // 투표 상태 관리를 위한 ref 변수들
    const approvedVotes = ref([]);
    const rejectedVotes = ref([]);
    
    // Use the WebSocket service
    const {
        isConnected,
        useDummyData,
        currentPlayer,
        connectWebSocket,
        disconnectWebSocket,
        sendTeamMarker,
        simulateSendMarker,
        getDummyTeamMembers,
        subscribeToTeamMarkers
    } = useTeamWebSocketService();
    
    // Set team ID if provided in props
    if (props.teamId) {
        currentPlayer.value.teamId = props.teamId;
    }

    const startTeamVote = async (playerInfo) => {
        if(!map.value || !marker.value) return;
        console.log("투표 시작")

        isVoteInProgress.value = true;

        try {
            // 현재 마커 위치 가져오기 (useKakaoMapMarkers에서 설정된 marker 활용)
            const position = marker.value.getPosition();
            
            // 투표 오버레이 생성
            const overlay = createVoteOverlay(position, {
                ...playerInfo,
                approvedVotes: [{ 
                    id: playerInfo.id, 
                    name: playerInfo.nickname,
                    profileImage: playerInfo.profileImage
                }]
            });

            // 팀 마커에 추가 (기존 marker 활용)
            addTeamMarker(playerInfo.id, marker.value, overlay);
            
            emit('team-vote-started', {
                playerId: playerInfo.id,
                position: {
                    lat: position.getLat(),
                    lng: position.getLng()
                },
                teamId: playerInfo.teamId
            });
            return overlay;
        } catch (error) {
            isVoteInProgress.value = false;
            console.error('팀 투표 시작 중 오류 발생:', error);
            return null;
        }
    }


    const addTeamMarker = (playerId, marker, overlay = null) => {
        // 기존 마커가 있는지 확인
        const existingIndex = teamMarkers.value.findIndex(m => m.playerId === playerId);
        if (existingIndex !== -1) {
            // 기존 마커 업데이트
            teamMarkers.value[existingIndex] = {
                ...teamMarkers.value[existingIndex],
                marker,
                overlay
            };
        } else {
            // 새 마커 추가
            teamMarkers.value.push({
                playerId,
                marker,
                overlay
            });
        }
    }

    const shareTeamMarker = (playerInfo) => {
        if (!marker.value) return;
        
        const position = marker.value.getPosition();
        const markerData = {
            playerId: playerInfo?.id || currentPlayer.value.id,
            teamId: playerInfo?.teamId || currentPlayer.value.teamId,
            position: {
                lat: position.getLat(),
                lng: position.getLng()
            },
            nickname: playerInfo?.nickname || currentPlayer.value.nickname,
            profileImage: playerInfo?.profileImage || currentPlayer.value.profileImage,
            timestamp: new Date().getTime()
        };
        
        if (isConnected.value) {
            // Send marker data through WebSocket service
            sendTeamMarker(markerData);
        } else if (useDummyData.value) {
            // For testing: simulate receiving the marker from server
            simulateSendMarker(markerData, handleTeamMarkerReceived);
        }
    }

    const createVoteOverlay = (position, playerInfo) => {
        if (!map.value) return;
        
        marker.value.playerName = playerInfo.nickname || 'None';
        marker.value.playerId = playerInfo.id;
        marker.value.teamId = playerInfo.teamId;

        // 새 오버레이 추가
        const overlay = createCustomOverlay(position, playerInfo, true);

        // 마커에 오버레이 참조 저장
        marker.value.overlay = overlay;

        return overlay;
    };

  

    const createCustomOverlay = (position, playerInfo, isInitiator = false) => {
        const overlayContainer = document.createElement('div');
        // 투표 참여자 목록 (실제 데이터로 대체 필요)
        const approvedVotes = playerInfo.approvedVotes || [];

        // VoteOverlay 컴포넌트 props
        const voteProps = {
            approvedVotes,
            totalTeamMembers: playerInfo.totalTeamMembers || 4,
            isInitiator
        };

        
         // 이벤트 핸들러
        const handleApproveVote = () => {
            console.log(`${playerInfo.nickname || '플레이어'}의 투표를 승인했습니다`);
            // 여기에 투표 승인 로직 추가
        };
        
        const handleRejectVote = () => {
            console.log(`${playerInfo.nickname || '플레이어'}의 투표를 거절했습니다`);
            // 여기에 투표 거절 로직 추가
        };
        
        const handleCancelVote = () => {
            console.log(`${playerInfo.nickname || '플레이어'}의 투표를 취소했습니다`);
            // removeVoteOverlay(playerInfo.id);
            isVoteInProgress.value = false;

            if(overlay) {
                overlay.setMap(null);
            }

            const markerIndex = teamMarkers.value.findIndex(m => m.playerId === playerInfo.id);
            if (markerIndex !== -1) {
                teamMarkers.value.splice(markerIndex, 1);
            }
        };

        // Vue 컴포넌트 렌더링
        const vnode = h(VoteOverlay, {
            ...voteProps,
            onApproveVote: handleApproveVote,
            onRejectVote: handleRejectVote,
            onCancelVote: handleCancelVote
        });

        render(vnode, overlayContainer);

        // Kakao 맵 커스텀 오버레이 생성
        const overlay = new kakao.maps.CustomOverlay({
            position,
            content: overlayContainer,
            map: map.value,
            xAnchor: 0.5,
            yAnchor: 1.5 // 오버레이가 마커 위에 표시되도록 조정
        });
        
        // 오버레이에 메타데이터 저장
        overlay.playerInfo = playerInfo;
        overlay.vueContainer = overlayContainer;
        
        return overlay;
    }

    /**
     * 팀 마커 채널 구독 설정 및 콜백 연결
     * 게임 시작 시 호출되며, 대기실에서 이미 연결된 웹소켓을 재사용하거나 새로 연결합니다.
     * 팀 채널에만 구독하여 팀원 간에만 마커 정보가 공유되도록 합니다.
     */
    const setupTeamMarkerSubscription = () => {
        // 싱글 게임 모드인 경우 WebSocket 연결을 설정하지 않음
        if (props.gameMode === 'single') {
            console.log('싱글 게임 모드: WebSocket 연결 건너뜀');
            return;
        }
        
        const teamId = currentPlayer.value.teamId;
        if (!teamId) {
            console.warn('팀 ID가 설정되지 않아 마커 구독을 설정할 수 없습니다.');
            return;
        }
        
        console.log(`팀 마커 구독 설정 시작: 팀 ID ${teamId}, 게임 모드: ${props.gameMode}`);
        
        // 전역 WebSocketManager가 이미 연결되어 있는지 확인 (대기실에서 연결된 상태일 수 있음)
        if (webSocketManager.isConnected.value) {
            console.log('기존 WebSocket 연결 재사용');
            subscribeToTeamMarkers(teamId);
        } else {
            console.log('새 WebSocket 연결 시도');
            connectWebSocket('/ws', teamId);
        }
    };
    
    // 수신된 팀 마커 데이터 처리
    const handleTeamMarkerReceived = (markerData) => {
        if (!map.value) return;
        
        // 자신의 마커인 경우 건너뜀
        if (markerData.playerId === currentPlayer.value.id) return;
        
        // 팀원의 마커 생성 또는 업데이트
        const position = new kakao.maps.LatLng(markerData.position.lat, markerData.position.lng);
        
        // 이 플레이어의 마커가 이미 존재하는지 확인
        const existingMarkerIndex = teamMarkers.value.findIndex(m => m.playerId === markerData.playerId);
        
        if (existingMarkerIndex !== -1) {
            // 기존 마커 위치 업데이트
            const existingMarker = teamMarkers.value[existingMarkerIndex].marker;
            existingMarker.setPosition(position);
            
            // 오버레이가 있으면 위치 업데이트
            if (teamMarkers.value[existingMarkerIndex].overlay) {
                teamMarkers.value[existingMarkerIndex].overlay.setPosition(position);
            }
        } else {
            // 새 마커 생성
            const newMarker = new kakao.maps.Marker({
                position: position,
                map: map.value
            });
            
            // 마커용 오버레이 생성
            const overlay = createCustomOverlay(position, markerData);
            
            // 팀 마커에 추가
            addTeamMarker(markerData.playerId, newMarker, overlay);
        }
    };
    
    // 테스트용 더미 데이터 초기화
    const initDummyData = () => {
        if (!useDummyData.value || !map.value) return;
        
        // Clear existing markers
        teamMarkers.value.forEach(m => {
            if (m.marker) m.marker.setMap(null);
            if (m.overlay) m.overlay.setMap(null);
        });
        teamMarkers.value = [];
        
        // Create random positions around the center of the map
        const center = map.value.getCenter();
        const baseLat = center.getLat();
        const baseLng = center.getLng();
        
        // Get dummy team members from the service
        const dummyTeamMembers = getDummyTeamMembers();
        
        // Create dummy markers for team members
        dummyTeamMembers.forEach((member) => {
            // Random position near the center
            const randomLat = baseLat + (Math.random() - 0.5) * 0.01;
            const randomLng = baseLng + (Math.random() - 0.5) * 0.01;
            const position = new kakao.maps.LatLng(randomLat, randomLng);
            
            // Create marker
            const dummyMarker = new kakao.maps.Marker({
                position: position,
                map: map.value
            });
            
            // Create overlay
            const overlay = createCustomOverlay(position, {
                ...member,
                position: { lat: randomLat, lng: randomLng }
            });
            
            // Add to team markers
            addTeamMarker(member.id, dummyMarker, overlay);
        });
    };
    
    // 더미 마커 랜덤 업데이트 (테스트용)
    const updateDummyMarkers = () => {
        if (!useDummyData.value || !map.value) return;
        
        teamMarkers.value.forEach(teamMarker => {
            if (teamMarker.playerId === currentPlayer.value.id) return; // Skip current player's marker
            
            const currentPos = teamMarker.marker.getPosition();
            const randomLat = currentPos.getLat() + (Math.random() - 0.5) * 0.001;
            const randomLng = currentPos.getLng() + (Math.random() - 0.5) * 0.001;
            const newPosition = new kakao.maps.LatLng(randomLat, randomLng);
            
            // Update marker position
            teamMarker.marker.setPosition(newPosition);
            
            // Update overlay position if exists
            if (teamMarker.overlay) {
                teamMarker.overlay.setPosition(newPosition);
            }
        });
    };
    
    /**
     * 컴포넌트 마운트 시 실행되는 후
     * 1. 웹소켓 연결 및 팀 채널 구독 설정
     * 2. 더미 데이터 모드 초기화 (테스트용)
     * 3. 플레이어 상태 변경 감지 설정
     */
    onMounted(() => {
        console.log('팀 지도 투표 컴포넌트 초기화 시작');
        
        // 1. 웹소켓 구독 설정 - 대기실에서 연결된 웹소켓을 재사용하거나 새로 연결
        setupTeamMarkerSubscription();
        
        // 2. 더미 데이터 모드인 경우 초기화 (개발 및 테스트 환경용)
        if (useDummyData.value) {
            console.log('더미 데이터 모드 활성화 - 테스트용 더미 마커 생성');
            
            // 지도가 로드될 때까지 약간 대기 후 더미 데이터 초기화
            setTimeout(() => {
                // 더미 팀원 마커 생성
                initDummyData();
                
                // 더미 마커 위치 주기적 업데이트 (5초마다)
                const dummyUpdateInterval = setInterval(updateDummyMarkers, 5000);
                
                // 컴포넌트 언마운트 시 인터벌 정리
                onBeforeUnmount(() => {
                    console.log('더미 데이터 업데이트 인터벌 정리');
                    clearInterval(dummyUpdateInterval);
                });
            }, 1000); // 지도 로드를 위해 1초 대기
        }
        
        // 3. 플레이어 상태 변경 감지 설정 (입장/퇴장, 팀 변경 등)
        // 전역 웹소켓 관리자에서 플레이어 상태 변경 이벤트 구독
        const playerStatusTopic = '/topic/game/players/status';
        webSocketManager.subscribe(playerStatusTopic, handlePlayerStatusChange);
    });
    
    /**
     * 플레이어 상태 변경 이벤트 처리
     * 입장, 퇴장, 팀 변경 등의 이벤트를 처리합니다.
     * 
     * @param {Object} message - 서버에서 수신한 플레이어 상태 메시지
     */
    const handlePlayerStatusChange = (message) => {
        if (!message || !message.body) return;
        
        try {
            const data = JSON.parse(message.body);
            console.log('플레이어 상태 변경 이벤트 수신:', data);
            
            // 이벤트 유형에 따른 처리
            switch (data.eventType) {
                case 'JOIN': // 플레이어 입장
                    console.log(`플레이어 ${data.player.nickname} 입장`);
                    // 현재 플레이어의 팀원이면 팀 마커에 추가
                    if (data.player.teamId === currentPlayer.value.teamId) {
                        // 팀원 마커 추가 로직 추가 가능
                    }
                    break;
                    
                case 'LEAVE': // 플레이어 퇴장
                    console.log(`플레이어 ${data.player.nickname} 퇴장`);
                    // 팀 마커에서 제거
                    {
                        const leaveIndex = teamMarkers.value.findIndex(m => m.playerId === data.player.id);
                        if (leaveIndex !== -1) {
                            // 마커와 오버레이 제거
                            if (teamMarkers.value[leaveIndex].marker) {
                                teamMarkers.value[leaveIndex].marker.setMap(null);
                            }
                            if (teamMarkers.value[leaveIndex].overlay) {
                                teamMarkers.value[leaveIndex].overlay.setMap(null);
                            }
                            // 배열에서 제거
                            teamMarkers.value.splice(leaveIndex, 1);
                        }
                    }
                    break;
                    
                case 'TEAM_CHANGE': // 플레이어 팀 변경
                    console.log(`플레이어 ${data.player.nickname} 팀 변경: ${data.previousTeamId} -> ${data.player.teamId}`);
                    // 현재 플레이어의 팀원이 되었다면 팀 마커에 추가
                    if (data.player.teamId === currentPlayer.value.teamId) {
                        // 팀원 마커 추가 로직 추가 가능
                    } 
                    // 현재 플레이어의 팀원이 아니게 되었다면 팀 마커에서 제거
                    else if (data.previousTeamId === currentPlayer.value.teamId) {
                        const changeIndex = teamMarkers.value.findIndex(m => m.playerId === data.player.id);
                        if (changeIndex !== -1) {
                            // 마커와 오버레이 제거
                            if (teamMarkers.value[changeIndex].marker) {
                                teamMarkers.value[changeIndex].marker.setMap(null);
                            }
                            if (teamMarkers.value[changeIndex].overlay) {
                                teamMarkers.value[changeIndex].overlay.setMap(null);
                            }
                            // 배열에서 제거
                            teamMarkers.value.splice(changeIndex, 1);
                        }
                    }
                    break;
                    
                case 'GAME_START': // 게임 시작
                    console.log('게임 시작 이벤트 수신');
                    // 게임 시작 시 필요한 처리 추가 가능
                    break;
                    
                case 'GAME_END': // 게임 종료
                    console.log('게임 종료 이벤트 수신');
                    // 게임 종료 시 필요한 처리 추가 가능
                    break;
            }
            
            // 이벤트 전파 (부모 컴포넌트에서 추가 처리 가능하도록)
            emit('playerStatusChange', data);
        
    } catch (error) {
        console.error('플레이어 상태 변경 메시지 처리 오류:', error);
    }
};

/**
 * 컴포넌트 언마운트 시 자원 정리
 * 1. 플레이어 상태 구독 해제
 * 2. 팀 채널 구독 해제
 * 3. 마커와 오버레이 제거
 */
onBeforeUnmount(() => {
    console.log('팀 지도 투표 컴포넌트 자원 정리 시작');
    
    // 1. 플레이어 상태 구독 해제
    const playerStatusTopic = '/topic/game/players/status';
    webSocketManager.unsubscribe(playerStatusTopic);
    
    // 2. 팀 채널 구독 해제 (전체 연결은 유지)
    disconnectWebSocket();
    
    // 3. 마커와 오버레이 제거
    teamMarkers.value.forEach(m => {
        if (m.marker) m.marker.setMap(null);
        if (m.overlay) m.overlay.setMap(null);
    });
    teamMarkers.value = [];
    
    console.log('팀 지도 투표 컴포넌트 자원 정리 완료');
});

// 지도 변경 감지하여 더미 데이터 초기화
watch(map, (newMap) => {
    if (newMap && useDummyData.value) {
        initDummyData();
    }
});

// 컴포넌트 마운트 시 게임 모드에 따라 WebSocket 연결 설정
onMounted(() => {
    // 싱글 게임 모드인 경우 WebSocket 연결을 설정하지 않음
    if (props.gameMode === 'single') {
        console.log('싱글 게임 모드: WebSocket 연결을 설정하지 않습니다.');
        return;
    }
    
    // 멀티 게임 모드(team, individual)인 경우에만 WebSocket 연결 설정
    console.log(`멀티 게임 모드(${props.gameMode}): WebSocket 연결을 설정합니다.`);
    setupTeamMarkerSubscription();
});

/**
 * 채팅 메시지 전송 함수
 * 팀 채팅 또는 전체 채팅에 메시지를 전송합니다.
 * 
 * @param {String} message - 전송할 메시지 내용
 * @param {Boolean} isTeamChat - 팀 채팅 여부 (기본값: true)
 */
const sendChatMessage = (message, isTeamChat = true) => {
    if (!message || !currentPlayer.value) return;
    
    const destination = isTeamChat 
        ? `/app/game/team/${currentPlayer.value.teamId}/chat` // 팀 채팅
        : '/app/game/chat'; // 전체 채팅
    
    const chatMessage = {
        playerId: currentPlayer.value.id,
        playerName: currentPlayer.value.nickname,
        teamId: currentPlayer.value.teamId,
        content: message,
        timestamp: new Date().toISOString()
    };
    
    // 웹소켓 관리자를 통해 메시지 전송
    webSocketManager.publish(destination, JSON.stringify(chatMessage));
    
    console.log(`채팅 메시지 전송 (${isTeamChat ? '팀' : '전체'}): ${message}`);
} // Added a closing curly brace here

return {
    // 팀 마커 관련 함수
    startTeamVote,
    createVoteOverlay,
    addTeamMarker,
    shareTeamMarker,
    
    // 채팅 관련 함수
    sendChatMessage,
    handlePlayerStatusChange,
    
    // 상태 변수
    isConnected,
    currentPlayer,
    useDummyData,
    teamMarkers,
    approvedVotes,
    rejectedVotes
};
}