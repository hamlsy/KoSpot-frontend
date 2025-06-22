import { ref, computed } from 'vue';
import gameStore from '@/store/gameStore';

// 상태 정의
const map = ref(null);
const marker = ref(null);
const clickListener = ref(null);
const circles = ref([]);
const showHints = ref(false);
const distance = ref(null);
const isLoading = ref(true);
const isInitialized = ref(false);
const markerImage = ref(null);
const hasMarker = ref(false);

//team vote
const teamVotes = ref([]); // team vote data
const voteOverlays = ref([]); // custom overlays


export function useKakaoMapState() {
  // computed 속성
  const formattedDistance = computed(() => {
    if (distance.value === null) return '';
    
    // 1km 미만이면 m 단위로 표시
    if (distance.value < 1) {
      return `${Math.round(distance.value * 1000)}m`;
    }
    
    // 1km 이상이면 소수점 1자리까지 표시
    return `${distance.value.toFixed(1)}km`;
  });
  
  return {
    // 상태
    map,
    marker,
    clickListener,
    circles,
    showHints,
    distance,
    isLoading,
    isInitialized,
    markerImage,
    hasMarker,
    gameStore,
    
    // computed
    formattedDistance,

    //team vote
    teamVotes,
    voteOverlays
  };
}