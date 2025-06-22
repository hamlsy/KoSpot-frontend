import { onMounted, onBeforeUnmount } from 'vue';
import { useKakaoMapState } from './useKakaoMapState';


export function useKakaoMapTeamVote(props) {
    const { map, marker, teamVotes, voteOverlays } = useKakaoMapState();

    const createVoteOverlay = (playerInfo) => {
        if (!map.value) return;
        
        marker.value.playerName = playerInfo.nickname || 'None';
        marker.value.playerId = playerInfo.id;
        marker.value.teamId = playerInfo.teamId;

        //해당 팀원이 만든 오버레이만 제거
        removeVoteOverlay(playerInfo.id);
        
        // 새 오버레이 추가
        const overlay = new kakao.maps.CustomOverlay({
            position: marker.value.getPosition(),
            content: `
                <div class="vote-overlay">
                    <div class="vote-content">
                        <p>팀 투표</p>
                        <button class="vote-button" @click="startTeamVoting">투표하기</button>
                    </div>
                </div>
            `,
            // content는 @VoteOverlay.vue를 사용
            map: map.value,
            xAnchor: 0.5,
            yAnchor: 0.5
        });

        // 오버레이에도 플레이어 정보 저장
        overlay.playerName = playerInfo.nickname;
        overlay.playerId = playerInfo.id;
        overlay.teamId = playerInfo.teamId;
        
        // 마커에 오버레이 참조 저장
        marker.value.overlay = overlay;
        
        voteOverlays.value.push(overlay);

        return overlay;
    };

    const removeVoteOverlay = (playerId) => {
        const overlay = teamVotes.value.find(v => v.playerId === playerId);
        if (overlay) {
            overlay.setMap(null);
            teamVotes.value = teamVotes.value.filter(v => v.playerId !== playerId);
        }
    };

    return {
        createVoteOverlay,
        removeVoteOverlay
    };
}