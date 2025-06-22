import { onMounted, onBeforeUnmount } from 'vue';
import { useKakaoMapState } from './useKakaoMapState';


export function useKakaoMapTeamVote(props) {
    const { map, marker, teamVotes, voteOverlays } = useKakaoMapState();

    const createVoteOverlay = () => {
        if (!map.value) return;

        //해당 팀원이 만든 오버레이만 제거
        
        // 새 오버레이 추가
        // 이 오버레이는 같은 팀에게만 보여야하며, 한 팀원은 하나의 투표만 가능
        voteOverlays.value.push(new kakao.maps.CustomOverlay({
            position: marker.value.getPosition(),
            content: `
                <div class="vote-overlay">
                    <div class="vote-content">
                        <p>팀 투표</p>
                        <button class="vote-button" @click="startTeamVoting">투표하기</button>
                    </div>
                </div>
            `,
            map: map.value,
            xAnchor: 0.5,
            yAnchor: 0.5
        }));
    };

    return {
        createVoteOverlay,
    };
}