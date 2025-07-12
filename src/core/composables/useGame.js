import { ref, computed, reactive } from 'vue';
import apiClient from '@/core/api/apiClient';

/**
 * 게임 관련 기능을 제공하는 컴포저블
 * @param {Object} options - 게임 옵션
 * @returns {Object} - 게임 관련 상태 및 메서드
 */
export default function useGame(options = {}) {
  // 게임 상태
  const gameState = reactive({
    isPlaying: false,
    isPaused: false,
    currentRound: 1,
    totalRounds: options.totalRounds || 5,
    timeRemaining: 0,
    score: 0,
    guessPosition: null,
    actualPosition: null,
    distance: 0,
    roundScores: [],
    gameMode: null,
    region: null
  });

  // 로딩 상태
  const isLoading = ref(false);
  const error = ref(null);

  // 게임 시작
  const startGame = async (gameMode, params = {}) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 게임 상태 초기화
      gameState.isPlaying = true;
      gameState.isPaused = false;
      gameState.currentRound = 1;
      gameState.score = 0;
      gameState.roundScores = [];
      gameState.gameMode = gameMode;
      gameState.region = params.region || 'all';
      gameState.totalRounds = params.totalRounds || 5;
      
      // 게임 데이터 로드
      if (gameMode === 'photo') {
        await loadPhotoModeData(params);
      } else if (gameMode === 'roadview') {
        await loadRoadViewData(params);
      }
      
      isLoading.value = false;
    } catch (err) {
      error.value = err.message || '게임을 시작하는 중 오류가 발생했습니다.';
      isLoading.value = false;
      throw err;
    }
  };

  // 포토 모드 데이터 로드
  const loadPhotoModeData = async (params) => {
    try {
      const response = await apiClient.get('/api/game/photo', {
        params: {
          region: params.region || 'all',
          totalRounds: params.totalRounds || 5
        }
      });
      return response.data;
    } catch (error) {
      console.warn('API 호출 실패, 더미 데이터를 사용합니다:', error);
      // API가 없는 경우 더미 데이터 반환
      return {
        photos: Array.from({ length: params.totalRounds || 5 }, (_, i) => ({
          id: i + 1,
          url: `/images/photo/${params.region || 'seoul'}/photo_${i + 1}.jpg`,
          region: params.region || 'seoul'
        }))
      };
    }
  };

  // 로드뷰 모드 데이터 로드
  const loadRoadViewData = async (params) => {
    try {
      const response = await apiClient.get('/api/game/roadview', {
        params: {
          region: params.region || 'all',
          totalRounds: params.totalRounds || 5
        }
      });
      return response.data;
    } catch (error) {
      console.warn('API 호출 실패, 더미 데이터를 사용합니다:', error);
      // API가 없는 경우 더미 데이터 반환
      return {
        locations: Array.from({ length: params.totalRounds || 5 }, (_, i) => ({
          id: i + 1,
          position: { lat: 37.5665, lng: 126.9780 },
          region: params.region || 'seoul'
        }))
      };
    }
  };

  // 게임 일시정지
  const pauseGame = () => {
    gameState.isPaused = true;
  };

  // 게임 재개
  const resumeGame = () => {
    gameState.isPaused = false;
  };

  // 게임 종료
  const endGame = () => {
    gameState.isPlaying = false;
    gameState.isPaused = false;
  };

  // 추측 제출
  const submitGuess = (position) => {
    gameState.guessPosition = position;
    
    if (gameState.actualPosition) {
      const distance = calculateDistance(position, gameState.actualPosition);
      const score = calculateScore(distance);
      
      gameState.distance = distance;
      gameState.roundScores.push(score);
      gameState.score += score;
    }
  };

  // 다음 라운드
  const nextRound = () => {
    if (gameState.currentRound < gameState.totalRounds) {
      gameState.currentRound += 1;
      gameState.guessPosition = null;
      gameState.actualPosition = null;
      gameState.distance = 0;
    }
  };

  // 거리 계산 (미터 단위)
  const calculateDistance = (pos1, pos2) => {
    // 하버사인 공식을 사용한 거리 계산
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = pos1.lat * Math.PI / 180;
    const φ2 = pos2.lat * Math.PI / 180;
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
    const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance);
  };

  // 점수 계산
  const calculateScore = (distance) => {
    // 거리에 따른 점수 계산 (거리가 가까울수록 높은 점수)
    if (distance <= 100) return 5000;
    if (distance <= 500) return 4000;
    if (distance <= 1000) return 3000;
    if (distance <= 5000) return 2000;
    if (distance <= 10000) return 1000;
    
    // 10km 이상은 점수 감소
    return Math.max(0, 1000 - Math.floor((distance - 10000) / 1000) * 100);
  };

  // 게임 진행률
  const progress = computed(() => {
    return (gameState.currentRound / gameState.totalRounds) * 100;
  });

  // 게임 완료 여부
  const isGameCompleted = computed(() => {
    return gameState.currentRound > gameState.totalRounds;
  });

  // 총 점수
  const totalScore = computed(() => {
    return gameState.roundScores.reduce((sum, score) => sum + score, 0);
  });

  return {
    gameState,
    isLoading,
    error,
    progress,
    isGameCompleted,
    totalScore,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    submitGuess,
    nextRound,
    calculateDistance,
    calculateScore
  };
} 