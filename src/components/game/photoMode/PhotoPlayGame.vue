<template>
  <div class="photo-play-game">
    <!-- 게임 헤더 -->
    <div class="game-header">
      <div class="header-left">
        <button class="exit-button" @click="confirmExit">
          <i class="fas fa-door-open"></i>
          나가기
        </button>
        <div class="game-info">
          <h2>{{ gameMode }} 게임</h2>
          <div class="game-details">
            <span class="region-badge">
              <i class="fas fa-map-marker-alt"></i>
              {{ regionLabel }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="header-center">
        <div class="round-info">
          <span class="round-number">라운드 {{ currentRound }}/{{ totalRounds }}</span>
          <div class="round-progress">
            <div 
              class="progress-bar" 
              :style="{ width: `${(currentRound / totalRounds) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <progress-timer
          :initial-time="roundTimeLimit"
          :warning-threshold="10"
          :danger-threshold="5"
          :is-active="timerActive"
          @time-update="handleTimeUpdate"
          @time-up="handleTimeUp"
          ref="timer"
        />
      </div>
    </div>
    
    <!-- 게임 메인 콘텐츠 -->
    <div class="game-content">
      <!-- 사진 영역 - 왼쪽에 배치 -->
      <div class="photo-section">
        <photo-display 
          :photo-url="currentPhoto ? currentPhoto.photoUrl : ''"
          :show-zoom-controls="true"
          @loaded="handlePhotoLoaded"
        />
      </div>
      
      <!-- 지도 영역 - 오른쪽에 배치 -->
      <div class="map-section">
        <region-map
          :disabled="mapDisabled"
          :show-region-names="!isRankMode"
          :correct-region="correctRegion"
          :wrong-region="wrongRegion"
          :selectedRegion="selectedRegion"
          @update:selectedRegion="region => selectedRegion = region"
          @submit-guess="submitGuess"
          ref="regionMap"
        />
      </div>
    </div>
    
    <!-- 하단 상태 바 -->
    <div class="game-footer">
      <div class="selected-region" v-if="selectedRegion">
        <i class="fas fa-map-marker-alt"></i>
        <span>선택한 지역: {{ getRegionName(selectedRegion) }}</span>
      </div>
      
      <div class="score-display">
        <i class="fas fa-star"></i>
        <span>현재 점수: {{ score }}</span>
      </div>
    </div>
    
    <!-- 모달 컴포넌트들 -->
    <round-result
      :visible="showRoundResult"
      :is-correct="isLastGuessCorrect"
      :score="lastRoundScore"
      :current-round="currentRound"
      :total-rounds="totalRounds"
      :location-name="currentPhoto ? currentPhoto.locationName : ''"
      :location-description="currentPhoto ? currentPhoto.locationDescription : ''"
      :photo-url="currentPhoto ? currentPhoto.photoUrl : ''"
      :fact="currentPhoto ? currentPhoto.fact : ''"
      :correct-region="correctRegion"
      :wrong-region="wrongRegion"
      @close="closeRoundResult"
      @next-round="nextRound"
      @finish-game="finishGame"
    />
    
    <game-result
      :visible="showGameResult"
      :total-score="score"
      :correct-count="correctCount"
      :wrong-count="wrongCount"
      :average-time="averageTime"
      :rounds="completedRounds"
      :show-rank="isRankMode"
      :rank="rank"
      :rank-percentile="rankPercentile"
      :rank-point-change="rankPointChange"
      @close="closeGameResult"
      @replay="restartGame"
      @go-to-main="goToMainMenu"
    />
    
    <!-- 로딩 오버레이 -->
    <!-- <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>로딩 중...</p>
      </div>
    </div> -->
    
    <!-- 사용자 확인 모달 -->
    <div v-if="showExitConfirmation" class="confirmation-modal">
      <div class="confirmation-backdrop" @click="cancelExit"></div>
      <div class="confirmation-dialog">
        <h3>게임 나가기</h3>
        <p>정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다.</p>
        <div class="confirmation-actions">
          <button class="cancel-button" @click="cancelExit">취소</button>
          <button class="confirm-button" @click="exitGame">나가기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProgressTimer from './ProgressTimer.vue';
import PhotoDisplay from './PhotoDisplay.vue';
import RegionMap from './RegionMap.vue';
import RoundResult from './RoundResult.vue';
import GameResult from './GameResult.vue';

export default {
  name: 'PhotoPlayGame',
  
  components: {
    ProgressTimer,
    PhotoDisplay,
    RegionMap,
    RoundResult,
    GameResult
  },
  
  props: {
    mode: {
      type: String,
      default: 'practice', // practice, rank, theme
      validator: (value) => ['practice', 'rank', 'theme'].includes(value)
    },
    region: {
      type: String,
      default: null
    },
    theme: {
      type: String,
      default: null
    },
    totalRounds: {
      type: Number,
      default: 5 // 기본 5라운드
    }
  },
  
  data() {
    return {
      // 임시 더미 데이터 (실제로는 API에서 가져올 것)
      photoData: [
        { id: 1, photoUrl: 'https://via.placeholder.com/800x600?text=Seoul', region: 'seoul', locationName: '서울 광화문', locationDescription: '서울특별시 종로구에 위치한 역사적인 랜드마크입니다.' },
        { id: 2, photoUrl: 'https://via.placeholder.com/800x600?text=Busan', region: 'busan', locationName: '부산 해운대', locationDescription: '부산광역시 해운대구에 위치한 유명한 해변입니다.' },
        { id: 3, photoUrl: 'https://via.placeholder.com/800x600?text=Jeju', region: 'jeju', locationName: '제주 성산일출봉', locationDescription: '제주특별자치도 서귀포시에 위치한 유네스코 세계자연유산입니다.' },
        { id: 4, photoUrl: 'https://via.placeholder.com/800x600?text=Gyeonggi', region: 'gyeonggi', locationName: '수원 화성', locationDescription: '경기도 수원시에 위치한 유네스코 세계문화유산입니다.' },
        { id: 5, photoUrl: 'https://via.placeholder.com/800x600?text=Gangwon', region: 'gangwon', locationName: '강원도 설악산', locationDescription: '강원도에 위치한 대한민국의 대표적인 국립공원입니다.' },
        { id: 6, photoUrl: 'https://via.placeholder.com/800x600?text=Daegu', region: 'daegu', locationName: '대구 근대골목', locationDescription: '대구광역시 중구에 위치한 역사적인 골목길입니다.' },
        { id: 7, photoUrl: 'https://via.placeholder.com/800x600?text=Incheon', region: 'incheon', locationName: '인천 송도센트럴파크', locationDescription: '인천광역시 연수구에 위치한 현대적인 공원입니다.' },
        { id: 8, photoUrl: 'https://via.placeholder.com/800x600?text=Daejeon', region: 'daejeon', locationName: '대전 엑스포다리', locationDescription: '대전광역시 유성구에 위치한 상징적인 다리입니다.' },
        { id: 9, photoUrl: 'https://via.placeholder.com/800x600?text=Gwangju', region: 'gwangju', locationName: '광주 5.18 민주광장', locationDescription: '광주광역시에 위치한 역사적 의미가 있는 장소입니다.' },
        { id: 10, photoUrl: 'https://via.placeholder.com/800x600?text=Chungbuk', region: 'chungbuk', locationName: '충북 청남대', locationDescription: '충청북도에 위치한 전 대통령 별장입니다.' }
      ],
      
      // 지역명 매핑
      regionNames: {
        seoul: '서울',
        busan: '부산',
        daegu: '대구',
        incheon: '인천',
        gwangju: '광주',
        daejeon: '대전',
        ulsan: '울산',
        sejong: '세종',
        gyeonggi: '경기도',
        gangwon: '강원도',
        chungbuk: '충청북도',
        chungnam: '충청남도',
        jeonbuk: '전라북도',
        jeonnam: '전라남도',
        gyeongbuk: '경상북도',
        gyeongnam: '경상남도',
        jeju: '제주도'
      },
      
      // 게임 상태
      gameStarted: false,
      gameFinished: false,
      isLoading: true,
      photos: [],
      currentPhoto: null,
      currentRound: 1,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      totalTimeTaken: 0,
      averageTime: 0,
      completedRounds: [],
      
      // 라운드 상태
      roundTimeLimit: 30,
      timerActive: false,
      selectedRegion: null,
      correctRegion: null,
      wrongRegion: null,
      lastRoundScore: 0,
      isLastGuessCorrect: false,
      mapDisabled: false,
      
      // 모달 상태
      showExitConfirmation: false,
      showRoundResult: false,
      showGameResult: false,
      
      // 랭킹 정보 (랭크 모드)
      rank: null,
      rankPercentile: null,
      rankPointChange: null
    };
  },
  
  computed: {
    isRankMode() {
      return this.mode === 'rank';
    },
    
    gameMode() {
      if (this.mode === 'practice') return '연습';
      if (this.mode === 'rank') return '랭크';
      if (this.mode === 'theme') return '테마';
      return '';
    },
    
    regionLabel() {
      if (this.mode === 'rank') return '전국';
      if (this.mode === 'theme') return this.theme || '테마';
      return this.getRegionName(this.region) || '전국';
    }
  },
  
  created() {
    this.prepareGame();
  },
  
  mounted() {
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  
  methods: {
    // 게임 준비 및 시작 관련 메소드
    prepareGame() {
      this.isLoading = true;
      
      // 게임 모드에 따라 사진 필터링
      let filteredPhotos = [...this.photoData];
      
      if (this.mode === 'practice' && this.region) {
        filteredPhotos = this.photoData.filter(photo => photo.region === this.region);
      } else if (this.mode === 'theme' && this.theme) {
        // 테마 모드는 실제 구현에서는 테마별 필터링 필요
      }
      
      // 사진 랜덤 섞기
      this.shufflePhotos(filteredPhotos);
      
      // 총 라운드 수에 맞게 자르기
      this.photos = filteredPhotos.slice(0, this.totalRounds);
      
      // 첫 라운드 시작
      this.startRound();
    },
    
    shufflePhotos(photos) {
      // Fisher-Yates 알고리즘으로 배열 섞기
      for (let i = photos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [photos[i], photos[j]] = [photos[j], photos[i]];
      }
    },
    
    startRound() {
      this.selectedRegion = null;
      this.correctRegion = null;
      this.wrongRegion = null;
      this.mapDisabled = false;
      
      // 현재 라운드에 맞는 사진 설정
      this.currentPhoto = this.photos[this.currentRound - 1];
      
      // 로딩 표시 (실제로는 이미지 로드 완료 후 숨겨짐)
      this.isLoading = true;
      
      // 라운드 시간 제한 설정 (라운드마다 감소)
      if (this.isRankMode) {
        // 랭크 모드: 마지막 라운드에는 10초까지 감소
        const decreasePerRound = (30 - 10) / (this.totalRounds - 1);
        this.roundTimeLimit = Math.floor(30 - (decreasePerRound * (this.currentRound - 1)));
      } else {
        // 연습/테마 모드: 모든 라운드 30초로 고정
        this.roundTimeLimit = 30;
      }
    },
    
    handlePhotoLoaded() {
      // 사진 로딩 완료 후 타이머 시작
      this.isLoading = false;
      this.timerActive = true;
      this.gameStarted = true;
    },
    
    // 게임 플레이 관련 메소드
    submitGuess(region) {
      if (this.mapDisabled) return;
      
      // 타이머 정지
      this.timerActive = false;
      this.mapDisabled = true;
      
      // 남은 시간 기록
      const remainingTime = this.$refs.timer ? this.$refs.timer.remainingTime : 0;
      const timeTaken = this.roundTimeLimit - remainingTime;
      this.totalTimeTaken += timeTaken;
      
      // 정답 체크
      const isCorrect = region === this.currentPhoto.region;
      this.isLastGuessCorrect = isCorrect;
      
      // 정답/오답 표시
      this.correctRegion = this.currentPhoto.region;
      if (!isCorrect) {
        this.wrongRegion = region;
      }
      
      // 점수 계산
      let roundScore = 0;
      if (isCorrect) {
        // 정답인 경우 남은 시간에 따라 보너스 점수
        const baseScore = 500;
        const timeBonus = Math.round((remainingTime / this.roundTimeLimit) * 300);
        roundScore = baseScore + timeBonus;
        
        this.correctCount++;
      } else {
        // 오답인 경우 페널티
        roundScore = this.isRankMode ? -200 : 0;
        
        this.wrongCount++;
      }
      
      this.lastRoundScore = roundScore;
      this.score += roundScore;
      
      // 라운드 정보 저장
      this.completedRounds.push({
        round: this.currentRound,
        locationName: this.currentPhoto.locationName,
        isCorrect: isCorrect,
        score: roundScore,
        time: timeTaken
      });
      
      // 라운드 결과 표시
      setTimeout(() => {
        this.showRoundResult = true;
      }, 500);
    },
    
    handleTimeUpdate() {
      // 남은 시간 업데이트 처리
      // 필요시 추가 구현
    },
    
    handleTimeUp() {
      // 시간 초과 처리
      if (this.selectedRegion) {
        // 이미 선택한 경우 그 선택으로 제출
        this.submitGuess(this.selectedRegion);
      } else {
        // 아직 선택하지 않은 경우 오답 처리
        this.mapDisabled = true;
        this.correctRegion = this.currentPhoto.region;
        
        // 점수 페널티
        const roundScore = this.isRankMode ? -300 : 0;
        this.lastRoundScore = roundScore;
        this.score += roundScore;
        
        this.wrongCount++;
        
        // 라운드 정보 저장
        this.completedRounds.push({
          round: this.currentRound,
          locationName: this.currentPhoto.locationName,
          isCorrect: false,
          score: roundScore,
          time: this.roundTimeLimit
        });
        
        // 라운드 결과 표시
        setTimeout(() => {
          this.showRoundResult = true;
        }, 500);
      }
    },
    
    // 라운드 전환 관련 메소드
    closeRoundResult() {
      this.showRoundResult = false;
    },
    
    nextRound() {
      this.showRoundResult = false;
      
      // 다음 라운드로 진행
      this.currentRound++;
      this.startRound();
    },
    
    finishGame() {
      this.closeRoundResult();
      this.gameFinished = true;
      
      // 평균 소요 시간 계산
      this.averageTime = Math.round(this.totalTimeTaken / this.totalRounds);
      
      // 랭크 모드인 경우 서버에 결과 전송 및 랭킹 정보 가져오기
      if (this.isRankMode) {
        // 실제 구현에서는 API 호출 필요
        // 테스트용 더미 데이터
        this.rank = 123;
        this.rankPercentile = 15;
        this.rankPointChange = 25;
      }
      
      // 게임 결과 모달 표시
      this.showGameResult = true;
    },
    
    // 게임 재시작 및 종료 관련 메소드
    closeGameResult() {
      this.showGameResult = false;
    },
    
    restartGame() {
      // 게임 상태 초기화
      this.closeGameResult();
      this.currentRound = 1;
      this.score = 0;
      this.correctCount = 0;
      this.wrongCount = 0;
      this.totalTimeTaken = 0;
      this.completedRounds = [];
      this.gameFinished = false;
      
      // 게임 다시 준비
      this.prepareGame();
    },
    
    goToMainMenu() {
      // 포토 모드 메인 화면으로 이동
      this.$router.push('/photoModeMain');
    },
    
    // 게임 나가기 관련 메소드
    confirmExit() {
      if (this.gameStarted && !this.gameFinished) {
        this.showExitConfirmation = true;
      } else {
        this.exitGame();
      }
    },
    
    cancelExit() {
      this.showExitConfirmation = false;
    },
    
    exitGame() {
      this.showExitConfirmation = false;
      this.goToMainMenu();
    },
    
    handleBeforeUnload(event) {
      // 게임 진행 중 페이지 이탈 방지
      if (this.gameStarted && !this.gameFinished) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    
    // 유틸리티 메소드
    getRegionName(regionCode) {
      return this.regionNames[regionCode] || regionCode;
    }
  }
};
</script>

<style scoped>
.photo-play-game {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
  position: relative;
  overflow: hidden;
}

/* 게임 헤더 스타일 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background-color: #f1f5f9;
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.exit-button:hover {
  background-color: #e2e8f0;
  color: #475569;
}

.game-info h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.game-details {
  display: flex;
  gap: 0.75rem;
}

.region-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.header-center {
  flex: 1;
  max-width: 400px;
}

.round-info {
  text-align: center;
}

.round-number {
  display: block;
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.round-progress {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.header-right {
  display: flex;
  justify-content: flex-end;
}

/* 게임 콘텐츠 스타일 */
.game-content {
  flex: 1;
  display: flex;
  padding: 1.5rem;
  gap: 1.5rem;
  overflow: hidden;
}

.photo-section, .map-section {
  border-radius: 16px;
  background-color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-section {
  position: relative;
  flex: 2; /* 사진 영역을 더 넓게 */
}

.map-section {
  flex: 1; /* 지도 영역은 더 좁게 */
  min-width: 300px; /* 최소 너비 설정 */
}

/* 게임 하단 상태 바 스타일 */
.game-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.selected-region {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #1e293b;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1e293b;
}

.score-display i {
  color: #f59e0b;
}

/* 모달 스타일 */
.confirmation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirmation-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.confirmation-dialog {
  position: relative;
  width: 90%;
  max-width: 450px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 2rem;
  z-index: 10;
  animation: dialogPopup 0.3s ease-out;
}

.confirmation-dialog h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #1e293b;
}

.confirmation-dialog p {
  margin-bottom: 1.5rem;
  color: #475569;
  line-height: 1.6;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button, .confirm-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-button {
  background-color: #f1f5f9;
  color: #475569;
}

.cancel-button:hover {
  background-color: #e2e8f0;
}

.confirm-button {
  background-color: #ef4444;
  color: white;
}

.confirm-button:hover {
  background-color: #dc2626;
}

/* 로딩 화면 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  text-align: center;
}

.loading-spinner i {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 1rem;
}

.loading-spinner p {
  font-size: 1.1rem;
  color: #64748b;
  font-weight: 500;
}

/* 애니메이션 */
@keyframes dialogPopup {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .game-content {
    flex-direction: column;
  }
  
  .photo-section, .map-section {
    width: 100%;
  }
  
  .photo-section {
    flex: 1;
    height: 50vh;
  }
  
  .map-section {
    flex: 1;
    height: 40vh;
  }
}

@media (max-width: 768px) {
  .game-header {
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
  }
  
  .header-left {
    order: 1;
    margin-bottom: 0.5rem;
    width: 100%;
    justify-content: space-between;
  }
  
  .header-center {
    order: 3;
    width: 100%;
    max-width: none;
    margin-top: 0.5rem;
  }
  
  .header-right {
    order: 2;
    width: 100%;
    justify-content: center;
  }
  
  .game-content {
    padding: 1rem;
    gap: 1rem;
  }
  
  .game-footer {
    padding: 0.75rem 1rem;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .score-display {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .game-info h2 {
    font-size: 1.1rem;
  }
  
  .confirmation-dialog {
    padding: 1.5rem;
  }
  
  .confirmation-dialog h3 {
    font-size: 1.25rem;
  }
  
  .cancel-button, .confirm-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}
</style> 