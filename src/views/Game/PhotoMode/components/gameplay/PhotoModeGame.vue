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
      <!-- 정답 지역 표시 -->
      <div
        v-if="
          (showCorrectAnimation || showTimeoutAnimation || roundCompleted) &&
          correctRegion
        "
        class="correct-region-display"
      >
        <span>정답 지역: {{ getRegionName(correctRegion) }}</span>
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
      <div
        class="photo-section"
        :class="{
          'correct-highlight': showCorrectAnimation,
          'incorrect-highlight': showIncorrectAnimation,
          'timeout-highlight': showTimeoutAnimation,
        }"
      >
        <photo-mode-photo-grid
          :photos="currentPhotos"
          :show-incorrect-animation="showIncorrectAnimation"
          :show-correct-animation="showCorrectAnimation"
          :show-timeout-animation="showTimeoutAnimation"
          :correct-region="correctRegion"
          @photo-loaded="handlePhotoLoaded"
        />

        <photo-mode-hint-display
          v-if="isPracticeMode"
          :visible="showHint || showHintNotification"
          :hint="currentHint"
          :is-notification="showHintNotification"
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
          :disabled="mapDisabled"
          :show-region-names="!isRankMode"
          :correct-region="correctRegion"
          :wrong-region="wrongRegion"
          :selectedRegion="selectedRegion"
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
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import ProgressTimer from 'src/views/Game/PhotoMode/components/gameplay/PhotoModeProgressTimer.vue'
import RegionMap from 'src/views/Game/PhotoMode/components/gameplay/PhotoModeRegionMap.vue'
import GameResult from "@/views/Game/PhotoMode/components/results/PhotoModeGameResult.vue";
import PhotoModePhotoGrid from "./PhotoModePhotoGrid.vue";
import PhotoModeHintDisplay from "./PhotoModeHintDisplay.vue";
import PhotoModeNextRoundButton from "./PhotoModeNextRoundButton.vue";
import IntroOverlay from "@/components/common/game/intro/IntroOverlay.vue";
import CountdownOverlay from "@/components/common/game/CountdownOverlay.vue";
import useGame from '@/composables/useGame';
import gameService from '@/api/services/game.service';

export default {
  name: "PhotoModeGame",
  components: {
    ProgressTimer,
    RegionMap,
    GameResult,
    PhotoModePhotoGrid,
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
        return ["practice", "rank", "theme"].includes(value);
      },
    },
    region: {
      type: String,
      default: "all",
    },
    theme: {
      type: String,
      default: "",
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
          photoUrl: require("@/assets/photo/seoul/seoul_63building.jpg"),
          locationName: "서울 63빌딩",
          locationDescription:
            "서울 영등포구에 위치한 63빌딩은 한때 대한민국에서 가장 높은 건물이었습니다.",
          region: "Seoul",
          fact: "63빌딩은 63개 층으로 이루어져 있으며, 1985년에 완공되었습니다.",
        },
        {
          id: 2,
          photoUrl: require("@/assets/photo/seoul/seoul_cheonggyecheon.jpg"),
          locationName: "청계천",
          locationDescription:
            "서울 중구와 종로구를 흐르는 청계천은 도심 속 생태하천으로 복원되었습니다.",
          region: "Seoul",
          fact: "청계천은 2003년부터 2005년까지 복원 공사가 진행되었으며, 현재는 서울의 대표적인 관광지입니다.",
        },
        {
          id: 3,
          photoUrl: require("@/assets/photo/seoul/seoul_cheonggyecheon1.jpg"),
          locationName: "청계천 광장",
          locationDescription:
            "서울 중구에 위치한 청계광장은 청계천의 시작점으로 다양한 문화행사가 열리는 공간입니다.",
          region: "Seoul",
          fact: "청계광장에는 높이 4.3m의 분수대인 스프링이 설치되어 있습니다.",
        },
        {
          id: 4,
          photoUrl: require("@/assets/photo/seoul/seoul_olympicPark.jpg"),
          locationName: "올림픽 공원",
          locationDescription:
            "서울 송파구에 위치한 올림픽공원은 1988년 서울올림픽을 위해 조성된 대규모 공원입니다.",
          region: "Seoul",
          fact: "올림픽공원 내에는 몽촌토성이라는 백제시대 유적이 있습니다.",
        },
        {
          id: 5,
          photoUrl: require("@/assets/photo/seoul/seoul_seoulCityHall.jpg"),
          locationName: "서울시청",
          locationDescription:
            "서울 중구에 위치한 서울시청은 독특한 곡선형 건축물로 유명합니다.",
          region: "Seoul",
          fact: "현재의 서울시청 신청사는 2012년에 완공되었으며, 옛 청사는 서울도서관으로 활용되고 있습니다.",
        },
        {
          id: 6,
          photoUrl: require("@/assets/photo/seoul/seoul_yeouidoPark.jpg"),
          locationName: "여의도 공원",
          locationDescription:
            "서울 영등포구 여의도에 위치한 여의도공원은 도심 속 녹지공간입니다.",
          region: "Seoul",
          fact: "여의도공원은 과거 비행장으로 사용되었던 부지를 공원으로 조성한 것입니다.",
        },
        {
          id: 7,
          photoUrl: require("@/assets/photo/seoul/seoul_yeouidoPark1.jpg"),
          locationName: "여의도 한강공원",
          locationDescription:
            "서울 영등포구 여의도에 위치한 한강공원은 시민들의 휴식공간입니다.",
          region: "Seoul",
          fact: "여의도 한강공원은 서울의 한강공원 중 가장 인기 있는 곳 중 하나입니다.",
        },
        {
          id: 8,
          photoUrl: require("@/assets/banner/Seoul-Dongdaemun-Gate.jpg"),
          locationName: "동대문",
          locationDescription:
            "서울 중구와 종로구 경계에 위치한 동대문은 조선시대 한양도성의 동쪽 성문입니다.",
          region: "Seoul",
          fact: "동대문의 정식 명칭은 흥인지문으로, 국보 제1호입니다.",
        },
        // 여기에 더 많은 사진 데이터 추가 가능
      ],
      
      // 지도 상태
      isMapOpen: true,

      // 결과 화면
      showGameResult: false,
      finalScore: 0,
      accuracy: 0,
      averageTime: 0,
      bestRound: null,
      worstRound: null,
      rank: "",
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
      regionMap: null
    };
  },
  
  computed: {
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
    },
  },

  created() {
    this.prepareGame();
    this.checkMobile();
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
      // 1라운드: 4개, 2라운드: 3개, 3라운드: 3개, 4라운드: 2개, 5라운드: 1개
      const maxPhotos = 4;
      const totalRounds = this.totalRounds;

      // 라운드 진행에 따라 사진 개수 감소 계산
      const photosCount = Math.max(
        1,
        Math.ceil(
          maxPhotos - ((roundNumber - 1) / (totalRounds - 1)) * (maxPhotos - 1)
        )
      );

      console.log(`라운드 ${roundNumber}: 사진 ${photosCount}개 표시`);
      return photosCount;
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
      if (this.mode === "practice") {
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

      // 랭크 모드에서는 정답 후 자동으로 다음 라운드 결과 표시
      if (this.isRankMode) {
        setTimeout(() => {
        }, 2000);
      }
    },

    submitGuess(region) {
      if (!this.roundStarted || this.mapDisabled) return;

      // 지역이 정의되지 않은 경우 선택된 지역 사용
      if (!region && this.selectedRegion) {
        region = this.selectedRegion;
      }

      // 여전히 지역이 없는 경우 실행 취소
      if (!region) {
        console.log("선택된 지역이 없습니다.");
        return;
      }

      console.log(`제출한 지역: ${region}`);

      // 정답 확인 (대소문자 구분 없이 비교)
      console.log(region.toLowerCase(), this.currentPhoto.region.toLowerCase());
      const isCorrect =
        region.toLowerCase() === this.currentPhoto.region.toLowerCase();

      if (isCorrect) {
        this.handleCorrectGuess(region);
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

      // 랭크 모드에서는 시간이 지나면 자동으로 다음 라운드 결과 표시
      if (this.isRankMode) {
        setTimeout(() => {
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

    checkMobile() {
      const userAgent = navigator.userAgent;
      const mobileRegex =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

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

    // 이벤트 리스너 정리
    window.removeEventListener("resize", this.checkMobile);
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
}

.correct-region-display {
  transform: translateX(-50%);
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  padding: 10px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  z-index: 10;
  animation: fadeIn 0.3s ease-out;
  border-left: 4px solid #4caf50;
  min-width: 200px;
  text-align: center;
}

.correct-region-display span {
  font-weight: 600;
  color: #000;
  font-size: 1rem;
  letter-spacing: 0.5px;
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
  top: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  font-weight: bold;
  text-align: center;
  z-index: 1;
  font-size: 15px;
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
  }

  .photo-section {
    margin-right: 0;
    margin-bottom: 20px;
  }

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