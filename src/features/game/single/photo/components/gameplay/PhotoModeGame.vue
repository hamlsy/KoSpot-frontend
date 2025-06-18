<template>
  <div class="photo-play-game">
    <!-- 게임 헤더 -->
    <div class="game-header">
      <div class="header-left">
        <button class="exit-button" @click="confirmExit">
          <i class="fas fa-door-open"></i>
          <span class="button-text">나가기</span>
        </button>
        <div class="game-info">
          <h2>{{ gameMode }} 게임</h2>
          <div class="game-details">
            <span class="region-badge">
              <i class="fas fa-camera"></i>
              {{ regionLabel }}
            </span>
          </div>
        </div>
      </div>

      <div class="header-center">
        <div class="round-info">
          <span class="round-number"
            >라운드 {{ currentRound }}/{{ totalRounds }}</span
          >
          <div class="round-progress">
            <div
              class="progress-bar"
              :style="{ width: `${(currentRound / totalRounds) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <!-- 정답 지역 표시 -->
        <div
          v-if="
            (showCorrectAnimation || showTimeoutAnimation || roundCompleted) &&
            correctRegion
          "
          class="correct-region-display"
        >
          <span
            ><span class="region-label">정답 지역:</span>
            {{ getRegionName(correctRegion) }}</span
          >
        </div>
      </div>
    </div>

    <!-- 인트로 화면 -->
    <IntroOverlay
      :showIntro="showIntro"
      :gameTitle="gameTitle"
      :gameContent="gameContent"
      :gameDescription="gameDescription"
      @end-intro="endIntro"
    />

    <!-- 카운트다운 화면 -->
    <CountdownOverlay
      :show="showCountdown"
      :initial-count="3"
      @countdown-complete="onCountdownComplete"
    />

    <!-- 게임 메인 콘텐츠 -->
    <div class="game-content">
      <div class="timer-container">
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
      <div
        class="photo-section"
        :class="{
          'correct-highlight': showCorrectAnimation,
          'incorrect-highlight': showIncorrectAnimation,
          'timeout-highlight': showTimeoutAnimation,
        }"
      >
        <photo-grid
          :photos="currentPhotos"
          :show-incorrect-animation="showIncorrectAnimation"
          :show-correct-animation="showCorrectAnimation"
          :show-timeout-animation="showTimeoutAnimation"
          :correct-region="correctRegion"
          @photo-loaded="handlePhotoLoaded"
        />

        <photo-mode-hint-display
          v-if="isPracticeMode"
          :mode="mode"
          :round-time-limit="roundTimeLimit"
          :current-photo="currentPhoto"
          :remaining-time="remainingTime"
          :get-region-name="getRegionName"
          @hint-shown="handleHintShown"
        />

        <photo-mode-next-round-button
          :visible="
            showCorrectAnimation ||
            showTimeoutAnimation ||
            (isPracticeMode && roundCompleted)
          "
          :is-last-round="currentRound >= totalRounds"
          :isRankMode="isRankMode"
          @next-round="nextRound"
        />
      </div>

      <!-- 지도 영역 - 오른쪽에 배치 -->
      <div class="map-section" :class="{ 'map-open': isMapOpen }">
        <region-map
          :show-region-names="!isRankMode"
          :correct-region="correctRegion"
          :wrong-region="wrongRegion"
          v-model:selectedRegion="selectedRegion"
          v-model:selectedRegionEng="selectedRegionEng"
          v-model:selectedRegionCode="selectedRegionCode"
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
      :average-time="calculateAverageTime()"
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
        <p>
          정말 게임을 종료하시겠습니까? 현재 진행 중인 게임은 저장되지 않습니다.
        </p>
        <div class="confirmation-actions">
          <button class="cancel-button" @click="cancelExit">취소</button>
          <button class="confirm-button" @click="exitGame">나가기</button>
        </div>
      </div>
    </div>

    <!-- 모바일에서 지도 토글 버튼 -->
    <button v-if="isGameStarted" class="toggle-map-button" @click="toggleMap">
      <i class="fas" :class="isMapOpen ? 'fa-times' : 'fa-map-marker-alt'"></i>
      {{ isMapOpen ? "지도 닫기" : "지도 열기" }}
    </button>
  </div>
</template>

<script>
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
  defineComponent,
} from "vue";
import { useRouter } from "vue-router";
import ProgressTimer from 'src/features/game/single/photo/components/Common/ProgressTimer.vue'
import RegionMap from 'src/features/game/shared/components/Region/RegionMap.vue'
import GameResult from "@/features/game/single/photo/components/Result/GameResult.vue";
import PhotoGrid from 'src/features/game/single/photo/components/Photo/PhotoGrid.vue'
import PhotoModeHintDisplay from "../Hint/HintDisplay.vue";
import PhotoModeNextRoundButton from 'src/features/game/single/photo/components/Common/NextRoundButton.vue'
import IntroOverlay from "@/features/game/shared/components/Common/IntroOverlay.vue";
import CountdownOverlay from "@/features/game/shared/components/Common/CountdownOverlay.vue";

export default {
  name: "PhotoModeGame",
  components: {
    ProgressTimer,
    RegionMap,
    GameResult,
    PhotoGrid,
    PhotoModeHintDisplay,
    PhotoModeNextRoundButton,
    IntroOverlay,
    CountdownOverlay,
  },

  props: {
    mode: {
      type: String,
      default: "practice",
      validator(value) {
        return ["practice", "rank"].includes(value);
      },
    },
    region: {
      type: String,
      default: "all",
    },
  },

  data() {
    return {
      // 인트로 설정
      gameTitle: "포토 연습 모드",
      gameContent: "사진들이 가리키는 지역을 지도에서 찾아보세요.",
      gameDescription:
        '지도를 열고 위치를 클릭한 후 "Spot!" 버튼을 눌러 정답을 확인하세요.',

      // 카운트다운 설정
      showCountdown: false,
      gameStarted: false,

      // 게임 설정
      totalRounds: 5,
      currentRound: 0,
      roundTimeLimit: 30, // 기본 30초
      timerActive: false,
      photosPerRound: 4, // 기본값, 실제로는 getPhotosForRound 메서드에서 동적으로 계산됨

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
          photoUrl: require("@/shared/assets/images/photo/seoul/seoul_63building.jpg"),
          locationName: "서울 63빌딩",
          region: "Seoul",
          sigCode: "11000",
          fact: "63빌딩은 63개 층으로 이루어져 있으며, 1985년에 완공되었습니다.",
        },
        {
          id: 2,
          photoUrl: require("@/shared/assets/images/photo/seoul/seoul_cheonggyecheon.jpg"),
          locationName: "청계천",
          region: "Seoul",
          sigCode: "11000",
          fact: "청계천은 2003년부터 2005년까지 복원 공사가 진행되었으며, 현재는 서울의 대표적인 관광지입니다.",
        },
        {
          id: 3,
          photoUrl: require("@/shared/assets//images/photo/seoul/seoul_cheonggyecheon1.jpg"),
          locationName: "계천 광장",
          sigCode: "11000",
          region: "Seoul",
        },
        {
          id: 4,
          photoUrl: require("@/shared/assets/images/photo/seoul/seoul_olympicPark.jpg"),
          locationName: "올림픽 공원",
          region: "Seoul",
          sigCode: "11000",
        },
        {
          id: 5,
          photoUrl: require("@/shared/assets/images/photo/seoul/seoul_seoulCityHall.jpg"),
          locationName: "서울시청",
          region: "Seoul",
          sigCode: "11000",
        },
        {
          id: 6,
          photoUrl: require("@/shared/assets/images/photo/seoul/seoul_yeouidoPark.jpg"),
          locationName: "여의도 공원",
          region: "Seoul",
          sigCode: "11000",
        },
        {
          id: 7,
          photoUrl: require("@/shared/assets/images/photo/seoul/seoul_yeouidoPark1.jpg"),
          locationName: "여의도 한강공원",
          region: "Seoul",
          sigCode: "11000",
        },
        {
          id: 8,
          photoUrl: require("@/shared/assets/images/banner/Seoul-Dongdaemun-Gate.jpg"),
          locationName: "동대문",
          region: "Seoul",
          sigCode: "11000",
        },
        // 여기에 더 많은 사진 데이터 추가 가능
      ],

      // 지도 상태
      isMapOpen: false,

      // 결과 화면
      showGameResult: false,
      finalScore: 0,
      accuracy: 0,
      averageTime: 0,
      bestRound: null,
      worstRound: null,
      rank: 0,
      rankPercentile: 0,
      rankPointChange: 0,

      // 모달
      showExitConfirmation: false,

      // 사진 로딩 상태
      photosLoaded: 0,
      totalPhotosToLoad: 0,
      allPhotosLoaded: false,

      // 지역 이름 매핑
      regionNames: {
        seoul: "서울",
        gyeonggi: "경기도",
        incheon: "인천",
        gangwon: "강원도",
        chungbuk: "충청북도",
        chungnam: "충청남도",
        daejeon: "대전",
        sejong: "세종",
        gyeongbuk: "경상북도",
        gyeongnam: "경상남도",
        daegu: "대구",
        busan: "부산",
        ulsan: "울산",
        jeonbuk: "전라북도",
        jeonnam: "전라남도",
        gwangju: "광주",
        jeju: "제주도",
      },

      // 타이머 및 지도 참조
      timer: null,
      regionMap: null,

      // 게임 상태 변수
      gameMode: "연습 모드",
      regionLabel: "전체 지역",
      showCorrectAnimation: false,
      showIncorrectAnimation: false,
      showTimeoutAnimation: false,
      showIntro: true,
      currentPhotos: [],
      correctRegion: null,
      wrongRegion: null,
      selectedRegion: null,
      selectedRegionEng: null,
      currentPhoto: null,
      gamePhotos: [],
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      totalTimeTaken: 0,
      completedRounds: [],
      remainingTime: 0,
    };
  },

  computed: {
    isLastGuessCorrect() {
      return this.correctRegion !== null;
    },

    isLastRound() {
      return this.currentRound >= this.totalRounds;
    },

    // 현재 점수 계산
    currentScore() {
      return this.score;
    },

    // 연습 모드인지 확인
    isPracticeMode() {
      return this.mode === "practice";
    },

    // 랭크 모드인지 확인
    isRankMode() {
      return this.mode === "rank";
    },
  },

  watch: {
    visible(newVal) {
      if (newVal) {
        this.startCountdown();
      } else {
        this.stopCountdown();
      }
    },
  },

  created() {
    this.prepareGame();
  },

  methods: {
    calculateAverageTime() {
      return this.totalTimeTaken / (this.correctCount || 1);
    },

    startGame() {
      this.isGameStarted = true;
      this.roundStarted = false;
      this.roundCompleted = false;
      this.timerActive = false;

      // 첫 라운드 시작
      this.startNextRound();
    },

    // 인트로 끝
    endIntro() {
      this.showIntro = false;
      this.showCountdown = true;
    },

    onCountdownComplete() {
      this.showCountdown = false;
      this.startGame();
    },

    // 게임 준비 및 초기화
    prepareGame() {
      // 게임 모드에 따른 설정
      if (this.isRankMode) {
        this.totalRounds = 10;
        this.gameTitle = "랭크 게임";
        this.gameContent = "포토 모드";
        this.gameDescription =
          "사진을 보고 해당 지역을 맞춰보세요. 랭크 모드에서는 점수가 기록되며 랭킹에 반영됩니다.";
      } else if (this.isPracticeMode) {
        this.totalRounds = 5;
        this.gameTitle = "연습 게임";
        this.gameContent = "포토 모드";
        this.gameDescription =
          "사진을 보고 해당 지역을 맞춰보세요. 연습 모드에서는 힌트를 사용할 수 있습니다.";
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

    // 라운드별 사진 개수 계산 메서드
    getPhotosForRound(roundNumber) {
      // 라운드가 진행될수록 사진 개수 감소 (최대 4개, 최소 1개)
      // 1라운드: 4개, 2-3라운드: 2개, 4-5라운드: 1개
      const totalRounds = this.totalRounds;

      // 라운드에 따라 사진 개수 결정 (4, 2, 1)
      if (roundNumber === 1) {
        return 4;
      } else if (roundNumber <= 3) {
        return 2;
      } else {
        return 1;
      }
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

      // 현재 라운드에 표시할 사진 개수 계산
      const photosCount = this.getPhotosForRound(this.currentRound);

      // 현재 라운드 사진 설정 (라운드별 다른 개수)
      const availablePhotos = [...this.gamePhotos]; // 복사본 생성
      const roundPhotos = [];

      // 랜덤하게 사진 선택
      for (let i = 0; i < photosCount && availablePhotos.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availablePhotos.length);
        roundPhotos.push(availablePhotos.splice(randomIndex, 1)[0]);
      }

      // 현재 라운드의 사진들 설정
      this.currentPhotos = roundPhotos.map((photo) => photo.photoUrl);

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

      console.log(
        `라운드 ${this.currentRound} 시작: ${photosCount}개 사진 표시`
      );
    },

    // setupHintTimers 메서드는 PhotoModeHintDisplay 컴포넌트로 이동함

    handlePhotoLoaded() {
      this.photoLoadCount++;

      // 모든 사진이 로드되면 로딩 상태 해제
      if (this.photoLoadCount >= this.currentPhotos.length) {
        this.isLoading = false;
      }
    },

    handleTimeUpdate(time) {
      this.remainingTime = time;
      // 힌트 관련 로직은 PhotoModeHintDisplay 컴포넌트로 이동함
    },

    // 힌트가 표시되었을 때 호출되는 메서드
    handleHintShown(level) {},
    handleCorrectGuess(region) {
      // 타이머 중지
      this.timerActive = false;
      this.mapDisabled = true;
      this.roundCompleted = true;

      // 남은 시간 기록
      const timeSpent =
        this.roundTimeLimit -
        (this.$refs.timer ? this.$refs.timer.remainingTime : 0);
      this.totalTimeTaken += timeSpent;

      this.correctRegion = region;
      this.showCorrectAnimation = true;
      this.correctCount++;

      // 점수 계산 (남은 시간에 따라 보너스)
      const timeBonus = Math.floor(
        this.$refs.timer ? this.$refs.timer.remainingTime / 2 : 0
      );
      const roundScore = 100 + timeBonus;
      this.score += roundScore;
      this.lastRoundScore = roundScore;

      console.log(
        `정답! 점수: ${roundScore} (기본 100 + 시간 보너스 ${timeBonus})`
      );

      // 라운드 결과 저장
      this.saveRoundResult(true, roundScore);

      // 랭크 모드에서만 정답 후 자동으로 다음 라운드 결과 표시
      if (this.isRankMode && !this.isPracticeMode) {
        setTimeout(() => {
          this.nextRound();
        }, 2000);
      }
    },

    submitGuess(regionCode) {
      if (!this.roundStarted) return;

      // 지역이 정의되지 않은 경우 선택된 지역 사용
      if (!regionCode && this.selectedRegionCode) {
        console.log(
          "전달받은 regionCode가 없어서 this.selectedRegionCode 사용:",
          this.selectedRegionCode
        );
        regionCode = this.selectedRegionCode;
      }

      // 여전히 지역이 없는 경우 실행 취소
      if (!regionCode) {
        console.log("선택된 지역이 없습니다.");
        return;
      }

      const isCorrect = regionCode === this.currentPhoto.sigCode;

      if (isCorrect) {
        this.handleCorrectGuess(regionCode);
      } else {
        // 오답인 경우 - 라운드가 끝나지 않음
        this.wrongRegion = regionCode;
        this.showIncorrectAnimation = true;

        // 잠시 후 오답 표시 제거
        setTimeout(() => {
          this.showIncorrectAnimation = false;
          this.wrongRegion = null;
        }, 1000);
      }
    },

    handleTimeUp() {
      console.log("시간 초과!");

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

      // 랭크 모드에서만 시간이 지나면 자동으로 다음 라운드 결과 표시
      if (this.isRankMode && !this.isPracticeMode) {
        setTimeout(() => {
          this.nextRound();
        }, 2000);
      }
    },

    saveRoundResult(isCorrect, score) {
      this.completedRounds.push({
        round: this.currentRound,
        isCorrect,
        score,
        timeTaken:
          this.roundTimeLimit -
          (this.$refs.timer ? this.$refs.timer.remainingTime : 0),
        locationName: this.currentPhoto.locationName,
        region: this.currentPhoto.region,
        photoUrl: this.currentPhoto.photoUrl,
      });
    },

    closeRoundResult() {
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
      this.$router.push("/");
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
      this.$router.push("/");
    },
    getRegionName(regionCode) {
      const regionMap = {
        Seoul: "서울특별시",
        Busan: "부산광역시",
        Daegu: "대구광역시",
        Incheon: "인천광역시",
        Gwangju: "광주광역시",
        Daejeon: "대전광역시",
        Ulsan: "울산광역시",
        Sejong: "세종특별자치시",
        Gyeonggi: "경기도",
        Gangwon: "강원도",
        Chungbuk: "충청북도",
        Chungnam: "충청남도",
        Jeonbuk: "전라북도",
        Jeonnam: "전라남도",
        Gyeongbuk: "경상북도",
        Gyeongnam: "경상남도",
        Jeju: "제주특별자치도",
      };

      return regionMap[regionCode] || regionCode;
    },

    // 지도 토글 버튼 관련 메서드
    toggleMap() {
      this.isMapOpen = !this.isMapOpen;

      // 지도가 열릴 때 약간의 지연 후 리사이즈 적용
      if (this.isMapOpen && this.$refs.regionMap) {
        setTimeout(() => {
          // Check if resizeMap method exists before calling it
          if (
            this.$refs.regionMap &&
            typeof this.$refs.regionMap.resizeMap === "function"
          ) {
            this.$refs.regionMap.resizeMap();
          }
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
    },

    getInitialConsonants(text) {
      if (!text) return "";

      const consonants = [
        "ㄱ",
        "ㄲ",
        "ㄴ",
        "ㄷ",
        "ㄸ",
        "ㄹ",
        "ㅁ",
        "ㅂ",
        "ㅃ",
        "ㅅ",
        "ㅆ",
        "ㅇ",
        "ㅈ",
        "ㅉ",
        "ㅊ",
        "ㅋ",
        "ㅌ",
        "ㅍ",
        "ㅎ",
      ];
      let result = "";

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const code = char.charCodeAt(0);

        // 한글 유니코드 범위 (0xAC00 ~ 0xD7A3)
        if (code >= 0xac00 && code <= 0xd7a3) {
          // 초성 추출 ((글자 - 0xAC00) / 28 / 21)
          const consonantIndex = Math.floor((code - 0xac00) / 28 / 21);
          result += consonants[consonantIndex];
        } else {
          // 한글이 아닌 경우 그대로 추가
          result += char;
        }
      }

      return `힌트: ${result}`;
    },
  },

  beforeUnmount() {
    // 타이머 정리
    if (this.hintNotificationTimer) {
      clearTimeout(this.hintNotificationTimer);
    }
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
    }
  },
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
  position: relative;
  flex-wrap: wrap;
  row-gap: 5px;
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
  transition: all 0.3s ease;
}

.photo-section.correct-highlight {
  background-color: rgba(220, 242, 220, 0.8);
}

.photo-section.incorrect-highlight {
  background-color: rgba(255, 235, 235, 0.8);
}

.photo-section.timeout-highlight {
  background-color: rgba(255, 243, 224, 0.8);
}

.correct-region-display {
  padding: 10px;
  background-color: #10b981;
  color: white;
  padding: 2px;
  font-weight: bold;
  text-align: center;
  z-index: 1;
  font-size: 15px;
  border-radius: 4px;
  margin-left: 10px;
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

.selected-region,
.score-display {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: #333;
}

.selected-region i,
.score-display i {
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

.cancel-button,
.confirm-button {
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
    position: relative;
    padding: 10px;
  }

  .photo-section {
    flex: 1;
    width: 100%;
    margin-right: 0;
    margin-bottom: 0;
    padding-bottom: 60px; /* 다음 라운드 버튼을 위한 공간 확보 */
    height: calc(100vh - 160px); /* 헤더와 푸터를 제외한 높이 */
    overflow-y: auto; /* 스크롤 가능하게 */
  }

  /* 헤더 간소화 */
  .header-center {
    display: none;
  }

  .button-text {
    display: none; /* 모바일에서 버튼 텍스트 숨김 */
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

  /* 힌트 표시 영역 조정 */
  .photo-mode-hint-display {
    position: relative;
    z-index: 5;
  }

  /* 다음 라운드 버튼 위치 조정 */
  .photo-mode-next-round-button {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    z-index: 10;
  }

  /* 정답 지역 표시 조정 */
  .correct-region-display {
    padding: 5px;
    font-size: 13px;
    margin: 5px 0;
    width: auto;
    flex-basis: 100%;
    order: 2;
  }

  .region-label {
    display: none; /* 모바일에서 '정답 지역:' 레이블 숨김 */
  }
  
  .header-right {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
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