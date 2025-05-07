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
    </div>
    
    <!-- 게임 메인 콘텐츠 -->
    <div class="game-content">
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
      <!-- 사진 영역 - 왼쪽에 배치 -->
      <div class="photo-section">
        <photo-mode-photo-grid 
          :photos="currentPhotos" 
          :show-incorrect-animation="showIncorrectAnimation"
          :show-correct-animation="showCorrectAnimation"
          :show-timeout-animation="showTimeoutAnimation"
          :correct-region="correctRegion"
          @photo-loaded="handlePhotoLoaded"
        />
        
        <photo-mode-hint-display 
          :visible="showHint || showHintNotification" 
          :hint="currentHint"
          :is-notification="showHintNotification"
        />
        
        <photo-mode-next-round-button 
          :visible="(showCorrectAnimation || showTimeoutAnimation || (isPracticeMode && roundCompleted)) && !showRoundResult" 
          :is-last-round="currentRound >= totalRounds"
          @next-round="nextRound"
        />
        
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
      </div>
      
      <!-- 지도 영역 - 오른쪽에 배치 -->
      <div class="map-section" :class="{ 'map-open': isMapOpen }">
        <region-map
          :disabled="mapDisabled"
          :show-region-names="!isRankMode"
          :correct-region="correctRegion"
          :wrong-region="wrongRegion"
          :selectedRegion.sync="selectedRegion"
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
    <game-result
      :visible="showGameResult"
      :total-score="score"
      :correct-count="correctCount"
      :wrong-count="wrongCount"
      :average-time="totalTimeTaken / (correctCount || 1)"
      :rounds="completedRounds"
      :show-rank="isRankMode"
      :rank="rank"
      :rank-percentile="rankPercentile"
      :rank-point-change="rankPointChange"
      @close="closeGameResult"
      @replay="restartGame"
      @go-to-main="goToMainMenu"
    />
    
    <!-- 사용자 확인 모달 -->
    <div v-if="showExitConfirmation" class="confirmation-modal">
      <div class="confirmation-backdrop" @click="cancelExit"></div>
      <div class="confirmation-dialog">
        <h3>게임 나가기</h3>
        <p>정말 게임을 종료하시겠습니까? 현재 진행 중인 게임은 저장되지 않습니다.</p>
        <div class="confirmation-actions">
          <button class="cancel-button" @click="cancelExit">취소</button>
          <button class="confirm-button" @click="exitGame">나가기</button>
        </div>
      </div>
    </div>
    
    <!-- 모바일에서 지도 토글 버튼 -->
    <button class="toggle-map-button" @click="toggleMap">
      <i class="fas" :class="isMapOpen ? 'fa-times' : 'fa-map-marker-alt'"></i>
      {{ isMapOpen ? '지도 닫기' : '지도 열기' }}
    </button>
  </div>
</template>

<script>
import ProgressTimer from '@/components/game/photoMode/timer/PhotoModeProgressTimer.vue';
import RegionMap from './PhotoModeRegionMap.vue';
import RoundResult from '@/components/game/photoMode/results/PhotoModeRoundResult.vue';
import GameResult from '@/components/game/photoMode/results/PhotoModeGameResult.vue';
import PhotoModePhotoGrid from './PhotoModePhotoGrid.vue';
import PhotoModeHintDisplay from './PhotoModeHintDisplay.vue';
import PhotoModeNextRoundButton from './PhotoModeNextRoundButton.vue';

export default {
  name: 'PhotoPlayGame',
  
  components: {
    ProgressTimer,
    RegionMap,
    RoundResult,
    GameResult,
    PhotoModePhotoGrid,
    PhotoModeHintDisplay,
    PhotoModeNextRoundButton
  },
  
  props: {
    mode: {
      type: String,
      default: 'practice',
      validator: value => ['practice', 'ranked', 'theme'].includes(value)
    },
    region: {
      type: String,
      default: 'all'
    },
    theme: {
      type: String,
      default: ''
    },
    difficulty: {
      type: String,
      default: 'normal',
      validator: value => ['easy', 'normal', 'hard'].includes(value)
    }
  },
  
  data() {
    return {
      // 게임 설정
      totalRounds: 5,
      currentRound: 0,
      roundTimeLimit: 30, // 기본 30초
      timerActive: false,
      
      // 게임 상태
      isGameStarted: false,
      roundStarted: false,
      roundCompleted: false,
      isLoading: true,
      mapDisabled: false,
      
      // 사진 관련 데이터
      allPhotos: [
        {
          id: 1,
          photoUrl: 'https://i.ibb.co/FxDnDfS/seoul-namsan.jpg',
          locationName: '서울 남산타워',
          locationDescription: '서울 중구에 위치한 남산서울타워는 대한민국을 대표하는 랜드마크입니다.',
          region: 'Seoul',
          fact: '남산서울타워는 1969년에 착공하여 1975년에 완공되었습니다.'
        },
        {
          id: 2,
          photoUrl: 'https://i.ibb.co/HdKgL3t/gyeongbokgung.jpg',
          locationName: '경복궁',
          locationDescription: '서울 종로구에 위치한 경복궁은 조선시대 정궁(正宮)입니다.',
          region: 'Seoul',
          fact: '경복궁은 1395년 태조 이성계에 의해 창건되었습니다.'
        },
        {
          id: 3,
          photoUrl: 'https://i.ibb.co/Jt8JQv5/haeundae.jpg',
          locationName: '해운대 해수욕장',
          locationDescription: '부산 해운대구에 위치한 해운대 해수욕장은 대한민국에서 가장 유명한 해변 중 하나입니다.',
          region: 'Busan',
          fact: '해운대 해수욕장의 모래는 화강암이 풍화되어 만들어진 것으로 알려져 있습니다.'
        },
        {
          id: 4,
          photoUrl: 'https://i.ibb.co/YTYdMVk/seongsan.jpg',
          locationName: '제주 성산일출봉',
          locationDescription: '제주도 동쪽 끝에 위치한 성산일출봉은 유네스코 세계자연유산으로 등재되었습니다.',
          region: 'Jeju',
          fact: '성산일출봉은 약 5,000년 전 수중 화산 폭발로 형성되었습니다.'
        },
        {
          id: 5,
          photoUrl: 'https://i.ibb.co/4Ym9Hnq/suwon.jpg',
          locationName: '수원화성',
          locationDescription: '경기도 수원시에 위치한 수원화성은 정조대왕이 건설한 계획도시의 성곽입니다.',
          region: 'Gyeonggi',
          fact: '수원화성은 1796년에 완공되었으며, 유네스코 세계문화유산으로 등재되었습니다.'
        },
        {
          id: 6,
          photoUrl: 'https://i.ibb.co/4KgmHyC/songdo.jpg',
          locationName: '인천 송도 센트럴파크',
          locationDescription: '인천 연수구 송도국제도시에 위치한 센트럴파크는 도심 속 자연공원입니다.',
          region: 'Incheon',
          fact: '송도 센트럴파크는 대한민국 최초의 해수공원으로, 바닷물을 끌어와 운하를 만들었습니다.'
        },
        {
          id: 7,
          photoUrl: 'https://i.ibb.co/Jj1Qy9S/gangneung.jpg',
          locationName: '강릉 경포대',
          locationDescription: '강원도 강릉시에 위치한 경포대는 아름다운 경포호수와 동해를 함께 볼 수 있는 명소입니다.',
          region: 'Gangwon',
          fact: '경포대는 신라시대부터 관동팔경 중 하나로 꼽혀왔습니다.'
        },
        {
          id: 8,
          photoUrl: 'https://i.ibb.co/xLwCpVf/andong.jpg',
          locationName: '안동 하회마을',
          locationDescription: '경상북도 안동시에 위치한 하회마을은 조선시대 양반 마을의 모습을 간직한 전통 마을입니다.',
          region: 'Gyeongbuk',
          fact: '하회마을은 1999년 영국 엘리자베스 2세 여왕이 방문하기도 했습니다.'
        },
        {
          id: 9,
          photoUrl: 'https://i.ibb.co/0MXVQ4L/jeonju.jpg',
          locationName: '전주 한옥마을',
          locationDescription: '전라북도 전주시에 위치한 한옥마을은 약 700여 채의 한옥이 밀집된 전통 마을입니다.',
          region: 'Jeonbuk',
          fact: '전주 한옥마을은 매년 1,000만 명 이상의 관광객이 방문하는 인기 관광지입니다.'
        },
        {
          id: 10,
          photoUrl: 'https://i.ibb.co/6wM8Jky/bulguksa.jpg',
          locationName: '경주 불국사',
          locationDescription: '경상북도 경주시에 위치한 불국사는 신라시대 창건된 사찰로 유네스코 세계문화유산입니다.',
          region: 'Gyeongbuk',
          fact: '불국사의 석가탑(다보탑)은 국보 제20호로 지정되어 있습니다.'
        }
      ],
      gamePhotos: [],
      currentPhotos: [],
      currentPhoto: null,
      photoLoadCount: 0,
      
      // 지역 선택 관련
      selectedRegion: null,
      correctRegion: null,
      wrongRegion: null,
      
      // 점수 관련
      score: 0,
      lastRoundScore: 0,
      correctCount: 0,
      wrongCount: 0,
      totalTimeTaken: 0,
      
      // 애니메이션 상태
      showIncorrectAnimation: false,
      showCorrectAnimation: false,
      showTimeoutAnimation: false,
      
      // 힌트 시스템
      showHint: false,
      showHintNotification: false,
      currentHint: "10초 뒤 힌트가 표시됩니다!",
      hintLevel: 0,
      hintTimeThresholds: [30, 15], // 남은 시간이 30초, 15초일 때 힌트 표시
      
      // 결과 표시
      showRoundResult: false,
      showGameResult: false,
      
      // 모달 상태
      showExitConfirmation: false,
      
      // 랭크 정보
      rank: null,
      rankPercentile: null,
      rankPointChange: null,
      
      // 완료된 라운드 정보 (게임 결과에 표시)
      completedRounds: [],
      
      // 지도 토글 버튼 관련
      isMapOpen: false,
      isMobile: false,
      
      // 힌트 타이머
      hintNotificationTimer: null,
      hintTimer: null,
      
      // 라운드당 사진 수
      photosPerRound: 1
    };
  },
  
  computed: {
    isRankMode() {
      return this.mode === 'ranked';
    },
    
    isPracticeMode() {
      return this.mode === 'practice';
    },
    
    gameMode() {
      const modeMap = {
        practice: '연습',
        ranked: '랭크',
        theme: '테마'
      };
      return modeMap[this.mode] || '연습';
    },
    
    regionLabel() {
      return this.region === 'all' ? '전국' : this.region;
    },
    
    isLastGuessCorrect() {
      return this.correctRegion !== null;
    },
    
    isLastRound() {
      return this.currentRound >= this.totalRounds;
    }
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        this.startCountdown();
      } else {
        this.stopCountdown();
      }
    }
  },
  
  created() {
    this.prepareGame();
    this.checkMobile();
  },
  
  methods: {
    // 게임 준비 및 초기화
    prepareGame() {
      // 게임 모드에 따른 설정
      if (this.isRankMode) {
        this.totalRounds = 10;
      } else if (this.isPracticeMode) {
        this.totalRounds = 5;
      } else {
        this.totalRounds = 5;
      }
      
      // 게임 데이터 초기화
      this.currentRound = 0;
      this.score = 0;
      this.correctCount = 0;
      this.wrongCount = 0;
      this.totalTimeTaken = 0;
      this.completedRounds = [];
      
      // 사진 데이터 셔플
      this.shufflePhotos();
      
      // 게임 시작
      this.startGame();
    },
    
    shufflePhotos() {
      // 사진 데이터 셔플 (Fisher-Yates 알고리즘)
      const shuffled = [...this.allPhotos];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      this.gamePhotos = shuffled;
    },
    
    startGame() {
      this.isGameStarted = true;
      this.roundStarted = false;
      this.roundCompleted = false;
      this.timerActive = false;
      
      // 첫 라운드 시작
      this.startNextRound();
    },
    
    startNextRound() {
      // 라운드 상태 초기화
      this.roundStarted = true;
      this.roundCompleted = false;
      this.mapDisabled = false;
      this.selectedRegion = null;
      this.correctRegion = null;
      this.wrongRegion = null;
      this.showHint = false;
      this.showHintNotification = false;
      this.photoLoadCount = 0;
      this.isLoading = true;
      
      // 애니메이션 상태 초기화
      this.showCorrectAnimation = false;
      this.showIncorrectAnimation = false;
      this.showTimeoutAnimation = false;
      
      // 현재 라운드 증가
      this.currentRound++;
      
      // 현재 라운드 사진 설정 (여러 장 가능)
      const startIndex = (this.currentRound - 1) * this.photosPerRound;
      const endIndex = startIndex + this.photosPerRound;
      const roundPhotos = this.gamePhotos.slice(startIndex, endIndex);
      
      // 현재 라운드의 사진들 설정
      this.currentPhotos = roundPhotos.map(photo => photo.photoUrl);
      
      // 현재 라운드의 주요 사진 (정답 판정에 사용)
      this.currentPhoto = roundPhotos[0];
      
      // 힌트 타이머 설정
      this.setupHintTimers();
      
      // 타이머 초기화 및 시작
      this.$nextTick(() => {
        if (this.$refs.timer) {
          this.$refs.timer.resetTimer();
          this.timerActive = true; // 타이머 즉시 시작
        }
      });
      
      // 지도 리셋
      if (this.$refs.regionMap) {
        this.$refs.regionMap.reset();
      }
      
      console.log(`라운드 ${this.currentRound} 시작`);
    },
    
    handlePhotoLoaded() {
      this.photoLoadCount++;
      
      // 모든 사진이 로드되면 로딩 상태 해제
      if (this.photoLoadCount >= this.currentPhotos.length) {
        this.isLoading = false;
      }
    },
    
    handleTimeUpdate(time) {
      this.remainingTime = time;
      
      // 힌트 표시 로직 (연습 모드에서만)
      if (this.mode === 'practice') {
        for (let i = 0; i < this.hintTimeThresholds.length; i++) {
          if (time === this.hintTimeThresholds[i] && this.hintLevel <= i) {
            this.showNextHint(i);
            break;
          }
        }
      }
    },
    
    showNextHint(level) {
      this.hintLevel = level + 1;
      this.showHint = true;
      
      // 힌트 레벨에 따라 다른 힌트 표시
      if (level === 0) {
        // 첫 번째 힌트: 지역 이니셜
        const regionName = this.currentPhoto.region;
        this.currentHint = `지역 힌트: ${regionName.charAt(0)}`;
      } else if (level === 1) {
        // 두 번째 힌트: 지역 이름
        this.currentHint = `지역 힌트: ${this.currentPhoto.region}`;
      }
    },
    
    submitGuess(region) {
      if (!this.roundStarted || this.mapDisabled) return;
      
      console.log(`제출한 지역: ${region}`);
      
      // 정답 확인 (대소문자 구분 없이 비교)
      const isCorrect = region.toLowerCase() === this.currentPhoto.region.toLowerCase();
      
      if (isCorrect) {
        // 정답인 경우
        // 타이머 중지
        this.timerActive = false;
        this.mapDisabled = true;
        this.roundCompleted = true;
        
        // 남은 시간 기록
        const timeSpent = this.roundTimeLimit - (this.$refs.timer ? this.$refs.timer.remainingTime : 0);
        this.totalTimeTaken += timeSpent;
        
        this.correctRegion = region;
        this.showCorrectAnimation = true;
        this.correctCount++;
        
        // 점수 계산 (남은 시간에 따라 보너스)
        const timeBonus = Math.floor(this.$refs.timer ? this.$refs.timer.remainingTime / 2 : 0);
        const roundScore = 100 + timeBonus;
        this.score += roundScore;
        this.lastRoundScore = roundScore;
        
        console.log(`정답! 점수: ${roundScore} (기본 100 + 시간 보너스 ${timeBonus})`);
        
        // 라운드 결과 저장
        this.saveRoundResult(true, roundScore);
      } else {
        // 오답인 경우 - 라운드가 끝나지 않음
        this.wrongRegion = region;
        this.showIncorrectAnimation = true;
        
        // 잠시 후 오답 표시 제거
        setTimeout(() => {
          this.showIncorrectAnimation = false;
          this.wrongRegion = null;
        }, 1000);
      }
    },
    
    handleTimeUp() {
      console.log('시간 초과!');
      
      // 시간 초과 처리
      this.timerActive = false;
      this.mapDisabled = true;
      this.roundCompleted = true;
      
      // 시간 초과 애니메이션 표시
      this.showTimeoutAnimation = true;
      
      // 정답 지역 표시
      this.correctRegion = this.currentPhoto.region;
      
      // 정답 지역에 마커 표시
      if (this.$refs.regionMap) {
        this.$refs.regionMap.showMarkerAtRegion(this.correctRegion);
      }
      
      // 라운드 결과 저장
      this.saveRoundResult(false, 0);
    },
    
    saveRoundResult(isCorrect, score) {
      this.completedRounds.push({
        round: this.currentRound,
        isCorrect,
        score,
        timeTaken: this.roundTimeLimit - (this.$refs.timer ? this.$refs.timer.remainingTime : 0),
        locationName: this.currentPhoto.locationName,
        region: this.currentPhoto.region,
        photoUrl: this.currentPhoto.photoUrl
      });
    },
    
    closeRoundResult() {
      this.showRoundResult = false;
      
      // 마지막 라운드였으면 게임 결과 표시
      if (this.currentRound >= this.totalRounds) {
        this.finishGame();
      } else {
        // 다음 라운드 시작
        this.startNextRound();
      }
    },
    
    nextRound() {
      // 연습 모드에서 정답 후 다음 라운드로 넘어가는 버튼 클릭 시
      this.showCorrectAnimation = false;
      
      // 마지막 라운드였으면 게임 결과 표시
      if (this.currentRound >= this.totalRounds) {
        this.finishGame();
      } else {
        // 다음 라운드 시작
        this.startNextRound();
      }
    },
    
    finishGame() {
      this.isGameStarted = false;
      this.timerActive = false;
      
      // 랭크 모드인 경우 랭크 정보 계산 (실제로는 서버에서 처리)
      if (this.isRankMode) {
        this.calculateRank();
      }
      
      // 게임 결과 표시
      this.showGameResult = true;
    },
    
    calculateRank() {
      // 실제로는 서버에서 계산하여 받아옴
      // 여기서는 임시로 랜덤 값 생성
      this.rank = Math.floor(Math.random() * 100) + 1;
      this.rankPercentile = Math.floor(Math.random() * 100) + 1;
      this.rankPointChange = Math.floor(Math.random() * 40) - 10;
    },
    
    closeGameResult() {
      this.showGameResult = false;
    },
    
    restartGame() {
      this.closeGameResult();
      this.prepareGame();
    },
    
    goToMainMenu() {
      this.$router.push('/');
    },
    
    confirmExit() {
      this.showExitConfirmation = true;
      this.timerActive = false;
    },
    
    cancelExit() {
      this.showExitConfirmation = false;
      if (this.roundStarted) {
        this.timerActive = true;
      }
    },
    
    exitGame() {
      this.$router.push('/');
    },
    
    getRegionName(regionCode) {
      const regionMap = {
        'Seoul': '서울특별시',
        'Busan': '부산광역시',
        'Daegu': '대구광역시',
        'Incheon': '인천광역시',
        'Gwangju': '광주광역시',
        'Daejeon': '대전광역시',
        'Ulsan': '울산광역시',
        'Sejong': '세종특별자치시',
        'Gyeonggi': '경기도',
        'Gangwon': '강원도',
        'Chungbuk': '충청북도',
        'Chungnam': '충청남도',
        'Jeonbuk': '전라북도',
        'Jeonnam': '전라남도',
        'Gyeongbuk': '경상북도',
        'Gyeongnam': '경상남도',
        'Jeju': '제주특별자치도'
      };
      
      return regionMap[regionCode] || regionCode;
    },
    
    checkMobile() {
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      
      if (mobileRegex.test(userAgent)) {
        this.isMobile = true;
      }
    },
    
    // 지도 토글 버튼 관련 메서드
    toggleMap() {
      this.isMapOpen = !this.isMapOpen;
      
      // 지도가 열릴 때 약간의 지연 후 리사이즈 적용
      if (this.isMapOpen && this.$refs.regionMap) {
        setTimeout(() => {
          this.$refs.regionMap.resizeMap();
        }, 300); // 트랜지션 완료 후 리사이즈
      }
    },
    
    setupHintTimers() {
      // 이전 타이머 정리
      if (this.hintNotificationTimer) {
        clearTimeout(this.hintNotificationTimer);
      }
      if (this.hintTimer) {
        clearTimeout(this.hintTimer);
      }
      
      // 힌트 표시 시간 설정 (난이도에 따라 다름)
      const hintDelay = this.roundTimeLimit * 0.3; // 30% 시점에 힌트 표시
      
      // 힌트 알림 표시 (힌트 표시 5초 전)
      // this.hintNotificationTimer = setTimeout(() => {
      //   this.showHintNotification = true;
      //   this.currentHint = `${Math.floor(hintDelay - 5)}초 후에 힌트가 표시됩니다!`;
      // }, (hintDelay - 5) * 1000);
      
      // 힌트 표시
      this.hintTimer = setTimeout(() => {
        this.showHintNotification = false;
        this.showHint = true;
        
        // 정답 지역의 한글 이름 가져오기
        const regionName = this.getRegionName(this.currentPhoto.region);
        this.currentHint = this.getInitialConsonants(regionName);
      }, hintDelay * 1000);
    },
    
    getInitialConsonants(text) {
      if (!text) return '';
      
      const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
      let result = '';
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = char.charCodeAt(0);
        
        // 한글 유니코드 범위 (0xAC00 ~ 0xD7A3)
        if (code >= 0xAC00 && code <= 0xD7A3) {
          // 초성 추출 ((글자 - 0xAC00) / 28 / 21)
          const consonantIndex = Math.floor((code - 0xAC00) / 28 / 21);
          result += consonants[consonantIndex];
        } else {
          // 한글이 아닌 경우 그대로 추가
          result += char;
        }
      }
      
      return `힌트: ${result}`;
    }
  },
  
  beforeDestroy() {
    // 타이머 정리
    if (this.hintNotificationTimer) {
      clearTimeout(this.hintNotificationTimer);
    }
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
    }
    
    // 이벤트 리스너 정리
    window.removeEventListener('resize', this.checkMobile);
  }
};
</script>

<style scoped>
.photo-play-game {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

/* 게임 헤더 스타일 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.exit-button {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin-right: 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.exit-button:hover {
  background-color: #d32f2f;
}

.exit-button i {
  margin-right: 8px;
}

.game-info {
  display: flex;
  flex-direction: column;
}

.game-info h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.game-details {
  display: flex;
  margin-top: 4px;
}

.region-badge {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 0.8rem;
}

.region-badge i {
  margin-right: 4px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.round-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.round-number {
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.round-progress {
  width: 200px;
  height: 6px;
  background-color: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease;
}

/* 게임 콘텐츠 스타일 */
.game-content {
  display: flex;
  flex: 1;
  padding: 20px;
  overflow: hidden;
  position: relative;
}

.photo-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-right: 20px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-section {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 게임 푸터 스타일 */
.game-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #ffffff;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.selected-region, .score-display {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: #333;
}

.selected-region i, .score-display i {
  margin-right: 8px;
  color: #1976d2;
}

.score-display i {
  color: #ffc107;
}

/* 확인 모달 스타일 */
.confirmation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirmation-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.confirmation-dialog {
  position: relative;
  width: 400px;
  padding: 24px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.confirmation-dialog h3 {
  margin-top: 0;
  color: #333;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-button, .confirm-button {
  padding: 8px 16px;
  margin-left: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.cancel-button {
  background-color: #e0e0e0;
  color: #333;
}

.cancel-button:hover {
  background-color: #d5d5d5;
}

.confirm-button {
  background-color: #f44336;
  color: white;
}

.confirm-button:hover {
  background-color: #d32f2f;
}

/* 지도 토글 버튼 */
.toggle-map-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 24px;
  border: none;
  background: #3b82f6;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 101;
  cursor: pointer;
  transition: all 0.2s ease;
  display: none; /* 기본적으로 숨김 */
}

.toggle-map-button:hover {
  transform: translateY(-2px);
  background: #2563eb;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

/* 반응형 스타일 */
@media (max-width: 1024px) {
  .game-content {
    flex-direction: column;
  }
  
  .photo-section {
    margin-right: 0;
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .header-center {
    display: none;
  }
  
  .game-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .score-display {
    margin-top: 8px;
  }
  
  /* 모바일에서 지도 토글 버튼 표시 */
  .toggle-map-button {
    display: flex;
  }
  
  /* 모바일에서 지도가 버튼으로 표시될 때 사진 영역 확장 */
  .game-content {
    position: relative;
    flex-direction: column;
    padding: 10px;
  }
  
  .photo-section {
    flex: 1;
    width: 100%;
    margin-right: 0;
    margin-bottom: 0;
    height: calc(100vh - 160px); /* 헤더와 푸터를 제외한 높이 */
  }
  
  .map-section {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 320px;
    z-index: 100;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .map-section.map-open {
    transform: translateX(0);
  }
}
</style>