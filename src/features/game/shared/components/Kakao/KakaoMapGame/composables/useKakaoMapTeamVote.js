import { h, onMounted, onBeforeUnmount, render, ref, watch } from 'vue';
import { useKakaoMapState } from './useKakaoMapState';
import VoteOverlay from 'src/features/game/shared/components/Kakao/VoteOverlay.vue';
import { useTeamWebSocketService } from 'src/features/game/shared/services/useTeamWebSocketService';

export function useKakaoMapTeamVote(props, emit) {
    const { map, marker, teamMarkers } = useKakaoMapState();
    
    // Use the WebSocket service
    const {
        isConnected,
        useDummyData,
        currentPlayer,
        connectWebSocket,
        disconnectWebSocket,
        sendTeamMarker,
        simulateSendMarker,
        getDummyTeamMembers
    } = useTeamWebSocketService();
    
    // Set team ID if provided in props
    if (props.teamId) {
        currentPlayer.value.teamId = props.teamId;
    }

    const startTeamVote = async (playerInfo) => {
        if(!map.value || !marker.value) return;

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
        // VoteOverlay 컴포넌트 props
        const voteProps = {
            approvedVotes,
            totalTeamMembers: playerInfo.totalTeamMembers || 4,
            isInitiator
        };

         // 투표 참여자 목록 (실제 데이터로 대체 필요)
         const approvedVotes = playerInfo.approvedVotes || [];

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
            yAnchor: 1.0 // 오버레이가 마커 위에 표시되도록 조정
        });
        
        // 오버레이에 메타데이터 저장
        overlay.playerInfo = playerInfo;
        overlay.vueContainer = overlayContainer;
        
        return overlay;
    }

    // 팀 마커 채널 구독 설정 및 콜백 연결
    const setupTeamMarkerSubscription = () => {
        // WebSocket 서비스가 연결되고 팀 채널을 구독할 때 호출됨
        // 팀 채널 구독 설정
        if (props.teamId) {
            connectWebSocket('/ws', props.teamId);
        } else if (currentPlayer.value.teamId) {
            connectWebSocket('/ws', currentPlayer.value.teamId);
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
    
    // 라이프사이클 훅 설정
    onMounted(() => {
        // WebSocket 구독 설정
        setupTeamMarkerSubscription();
        
        // 더미 데이터 모드인 경우 초기화
        if (useDummyData.value) {
            setTimeout(() => {
                initDummyData();
                
                // Periodically update dummy markers
                const dummyUpdateInterval = setInterval(updateDummyMarkers, 5000);
                
                // Clean up interval on unmount
                onBeforeUnmount(() => {
                    clearInterval(dummyUpdateInterval);
                });
            }, 1000); // Wait for map to be ready
        }
    });
    
    // WebSocket 서비스는 onBeforeUnmount에서 자체적으로 연결 해제를 처리함
    
    // 지도 변경 감지하여 더미 데이터 초기화
    watch(map, (newMap) => {
        if (newMap && useDummyData.value) {
            initDummyData();
        }
    });

    return {
        startTeamVote,
        createVoteOverlay,
        addTeamMarker,
        shareTeamMarker,
        isConnected,
        currentPlayer,
        useDummyData,
        initDummyData,
        updateDummyMarkers
    };
}