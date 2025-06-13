<template>
  <div class="road-view-practice">
    <!-- 헤더 -->
    <div class="game-header">
      <button class="back-btn" @click="exitGame">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 v-if="!gameStarted">{{ selectedRegion.name }} 연습 모드</h2>
      <div v-else class="game-status">
        <!-- 랭크 모드 타이머 -->
        <div
          v-if="isRankMode"
          class="timer"
          :class="{ warning: timeRemaining <= 30 }"
        >
          <i class="fas fa-clock"></i>
          <span>{{ formatTime(timeRemaining) }}</span>
        </div>

        <!-- 연습 모드 힌트 -->
        <div v-else class="hints">
          <div
            v-for="n in 3"
            :key="`hint-${n}`"
            class="hint-indicator"
            :class="{ active: n <= hintsLeft }"
          >
            <i class="fas fa-lightbulb"></i>
          </div>
          <div v-if="!hintAvailable && hintsLeft > 0" class="hint-timer">
            {{ nextHintTime }}초
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 게임 영역 -->
    <div class="game-content">
      <!-- 로드뷰 화면 -->
      <div class="road-view-container">
        <RoadViewGame
          v-if="currentLocation"
          :initialPosition="currentLocation"
          :showControls="false"
          :showCompass="false"
          :preventInteraction="false"
          @load-complete="onRoadViewLoaded"
          @load-error="onRoadViewError"
        />

        <!-- 지도 버튼 -->
        <button class="map-toggle" @click="toggleMap">
          <i
            class="fas"
            :class="isMapOpen ? 'fa-street-view' : 'fa-map-marked-alt'"
          ></i>
          {{ isMapOpen ? "로드뷰로 돌아가기" : "지도 열기" }}
        </button>

        <!-- Spot 버튼 (지도 모드에서만 표시) -->
        <button
          v-if="isMapOpen && !showResult && false"
          class="spot-button"
          @click="checkSpotAnswer"
        >
          <i class="fas fa-crosshairs"></i> Spot!
        </button>
      </div>

      <!-- 휴대폰 프레임 -->
      <PhoneFrame
        :style="{ zIndex: isMapOpen ? 15 : -1 }"
        :centerLocation="centerLocation"
        :actualLocation="currentLocation"
        :showHintCircles="true"
        :disabled="showResult"
        :showDistance="false"
        :showActionButton="false"
        @close="toggleMap"
        @check-answer="checkAnswer"
        @spot-answer="checkSpotAnswer"
        @error="showToastMessage"
        ref="phoneFrame"
      >
        <template v-slot:buttons>
          <!-- 힌트 버튼 (휴대폰 프레임 내부) -->
          <button
            v-if="!showResult"
            class="phone-hint-button"
            @click="useHint"
            :disabled="!hintAvailable || hintCount <= 0"
          >
            <i class="fas fa-lightbulb"></i>
            <span v-if="hintCount > 0 && !hintAvailable"
              >{{ nextHintTime }}초 후 사용 가능</span
            >
            <span v-else>힌트 사용 ({{ hintCount }}/3)</span>
          </button>
        </template>
      </PhoneFrame>

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

      <!-- 결과 화면 -->
      <div v-if="showResult" class="result-overlay">
        <div class="result-content">
          <h2>결과</h2>

          <!-- 결과 정보 -->
          <div class="result-info">
            <div class="info-item">
              <div class="info-icon"><i class="fas fa-ruler"></i></div>
              <div class="info-value">{{ distance.toFixed(2) }} km</div>
              <div class="info-label">떨어진 거리</div>
            </div>

            <div class="info-item">
              <div class="info-icon"><i class="fas fa-star"></i></div>
              <div class="info-value">{{ score }}</div>
              <div class="info-label">점수</div>
            </div>

            <div class="info-item" v-if="isRankMode">
              <div class="info-icon"><i class="fas fa-clock"></i></div>
              <div class="info-value">
                {{ formatTime(180 - timeRemaining) }}
              </div>
              <div class="info-label">소요 시간</div>
            </div>
          </div>

          <!-- 결과 지도 -->
          <div class="result-map" ref="resultMapElement"></div>

          <!-- 랭크 점수 변화 (랭크 모드만) -->
          <div v-if="isRankMode" class="rank-change">
            <div class="rank-icon">
              <i
                class="fas"
                :class="rankPointChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"
              ></i>
            </div>
            <div
              class="rank-value"
              :class="rankPointChange >= 0 ? 'positive' : 'negative'"
            >
              {{ rankPointChange >= 0 ? "+" : "" }}{{ rankPointChange }} 포인트
            </div>
            <div class="rank-current">
              현재 랭크 포인트: {{ currentRankPoints }}
            </div>
          </div>

          <!-- 결과 버튼 -->
          <div class="result-buttons">
            <button class="restart-btn" @click="nextRound">다시하기</button>
            <button class="exit-btn" @click="exitGame">종료하기</button>
          </div>
        </div>
      </div>

      <!-- 종료 확인 모달 -->
      <div v-if="showExitConfirmation" class="modal-overlay">
        <div class="modal-content">
          <h3>게임 종료</h3>
          <p>정말 게임을 종료하시겠습니까?</p>
          <div class="modal-buttons">
            <button class="cancel-btn" @click="showExitConfirmation = false">
              취소
            </button>
            <button class="confirm-btn" @click="confirmExit">확인</button>
          </div>
        </div>
      </div>

      <!-- 로드뷰 토스트 메시지 -->
      <div class="toast-message" v-if="showToast">
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import RoadViewGame from "@/features/game/single/roadview/components/gameplay/RoadViewGame.vue";
import PhoneFrame from "@/components/game/phone/PhoneFrame.vue";
import CountdownOverlay from "@/features/game/shared/components/Common/CountdownOverlay.vue";
import IntroOverlay from "@/features/game/shared/components/Common/IntroOverlay.vue";

export default {
  name: "RoadViewPractice",
  components: {
    RoadViewGame,
    PhoneFrame,
    CountdownOverlay,
    IntroOverlay,
  },
  props: {
    isRankMode: {
      type: Boolean,
      default: false,
    },
    region: {
      type: String,
      default: "서울",
    },
  },
  data() {
    return {
      //인트로 관련
      gameTitle: "로드뷰 연습게임",
      gameContent: "현재 보이는 로드뷰의 위치를 지도에서 찾아보세요.",
      gameDescription: '지도를 열고 위치를 클릭한 후 "위치 선택" 버튼을 눌러 정답을 확인하세요.',

      // 게임 화면 관련
      isMapOpen: false,
      showExitConfirmation: false,
      showResult: false,
      showToast: false,
      toastMessage: "",
      toastTimeout: null,

      // 게임 상태 관련
      isFirstRun: true,
      isLoading: true,
      currentLocation: null,
      guessedLocation: null,
      errorCount: 0, // 로드뷰 로드 오류 카운트
      maxErrorRetry: 3, // 최대 재시도 횟수

      // 게임 점수 관련
      distance: null,
      score: 0,
      elapsedTime: 0,

      // 지도 관련
      centerLocation: {
        lat: 37.55,
        lng: 126.97,
      },

      // 지역 데이터
      regions: [
        { id: "seoul", name: "서울", centerLat: 37.5665, centerLng: 126.978 },
        { id: "busan", name: "부산", centerLat: 35.1796, centerLng: 129.0756 },
        { id: "jeju", name: "제주", centerLat: 33.4996, centerLng: 126.5312 },
        {
          id: "gangwon",
          name: "강원",
          centerLat: 37.8228,
          centerLng: 128.1555,
        },
        {
          id: "gyeonggi",
          name: "경기",
          centerLat: 37.4138,
          centerLng: 127.5183,
        },
      ],
      selectedRegion: {
        name: "서울",
        bounds: {
          sw: { lat: 37.41, lng: 126.79 },
          ne: { lat: 37.7, lng: 127.17 },
        },
      },

      // 로드뷰 게임 상태
      showIntro: true,
      showCountdown: false,
      gameStarted: false,

      // 힌트 관련
      hintsLeft: 3,
      hintCount: 3, // 힌트 사용 가능 횟수
      hintCircle: null, // 힌트 원 객체
      hintRadius: 120000, // 초기 힌트 원 반경 (미터)
      hintAvailable: false, // 힌트 사용 가능 여부
      nextHintTime: 30, // 다음 힌트까지 남은 시간 (초)
      hintTimer: null, // 힌트 타이머
    };
  },
  mounted() {
    // 지역 설정
    this.selectedRegion =
      this.regions.find((r) => r.id === this.region.toLowerCase()) ||
      this.regions[0];

    // 게임 위치 데이터 요청
    this.fetchGameLocationData();
  },
  beforeUnmount() {
    this.clearAllTimers();
  },
  methods: {
    // 게임 시작
    endIntro() {
      this.showIntro = false;
      this.showCountdown = true;
    },

    // 게임 상태 초기화
    resetGame() {
      // 타이머 정리
      this.clearTimer();

      // 상태 초기화
      this.showResult = false;
      this.isMapOpen = false;
      this.guessedLocation = null;
      this.distance = null;
      this.score = 0;
      this.elapsedTime = 0;

      // 힌트 상태 초기화
      this.hintCount = 3;
      this.hintRadius = 120000;
      this.hintAvailable = false;
      this.nextHintTime = 30;

      // 힌트 원 제거
      if (this.hintCircle) {
        this.hintCircle.setMap(null);
        this.hintCircle = null;
      }

      // 게임 위치 데이터 요청
      this.fetchGameLocationData();
    },

    // 모든 타이머 정리
    clearAllTimers() {
      // 타이머 정리
      this.clearTimer();
    },

    // 지도 토글
    toggleMap() {
      // 상태 변경 - 이것만으로 인라인 스타일에서 z-index가 변경됨
      this.isMapOpen = !this.isMapOpen;

      if (this.isMapOpen) {
        this.$nextTick(() => {
          // 지도 리사이즈
          const mapInstance = this.$refs.phoneFrame.getMapInstance();
          if (mapInstance) {
            mapInstance.relayout();
          }
          
          // 힌트 원 재표시
          if (this.hintCircle && mapInstance) {
            this.hintCircle.setMap(mapInstance);
          }
        });
      } else {
        // 지도를 닫을 때는 인라인 스타일에서 자동으로 z-index가 -1로 설정됨
        
        // hintCircle 객체는 그대로 유지, 다음에 지도가 열렸을 때 다시 표시
      }  
    },

    // 힌트 사용
    useHint() {
      if (!this.hintAvailable || this.hintCount <= 0 || !this.currentLocation)
        return;

      // 지도가 열려있지 않으면 먼저 지도를 열기
      if (!this.isMapOpen) {
        this.isMapOpen = true;

        // 지도가 초기화될 때까지 기다린 후 힌트 적용
        setTimeout(() => {
          this.applyHint();
        }, 500);
      } else {
        this.applyHint();
      }
    },

    // 힌트 적용 (지도에 원 표시)
    applyHint() {
      // 맵 컴포넌트가 없는 경우 중단
      if (!this.$refs.phoneFrame) {
        this.showToastMessage(
          "지도를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
        );
        return;
      }
      
      // PhoneFrame 컴포넌트의 getMapInstance() 메서드를 사용하여 맵 인스턴스를 가져옴
      const map = this.$refs.phoneFrame.getMapInstance();
      if (!map) {
        this.showToastMessage(
          "지도를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
        );
        return;
      }

      // 힌트 사용 횟수 감소
      this.hintCount--;
      this.hintsLeft = this.hintCount; // hintsLeft와 동기화

      // 기존 힌트 원 제거
      if (this.hintCircle) {
        this.hintCircle.setMap(null);
        this.hintCircle = null;
      }

      // kakao 객체가 정의되어 있는지 확인
      if (typeof kakao === 'undefined') {
        console.error('Kakao Maps SDK is not loaded');
        this.showToastMessage('지도를 불러오는 중 오류가 발생했습니다.');
        return;
      }
      
      // 정답 위치 좌표
      const actualPosition = new kakao.maps.LatLng(
        this.currentLocation.lat,
        this.currentLocation.lng
      );
      
      // 랜덤한 원 생성 (정답 위치를 포함하는)
      // 1. 랜덤한 각도 생성 (0-360도)
      const randomAngle = Math.random() * 360;
      
      // 2. 랜덤한 거리 생성 (0부터 힌트 반경의 70%까지)
      // 힌트 반경의 70%까지만 이동하여 정답이 항상 원 안에 포함되도록 함
      const maxDistance = this.hintRadius * 0.7;
      const randomDistance = Math.random() * maxDistance;
      
      // 3. 랜덤한 위치 계산 (정답으로부터 랜덤한 각도와 거리만큼 떨어진 지점)
      // 위도 1도 = 약 111km, 경도 1도 = 약 111km * cos(위도)
      const randomLat = this.currentLocation.lat + (randomDistance / 111000) * Math.cos(this.deg2rad(randomAngle));
      const randomLng = this.currentLocation.lng + (randomDistance / (111000 * Math.cos(this.deg2rad(this.currentLocation.lat)))) * Math.sin(this.deg2rad(randomAngle));
      
      // 랜덤한 원의 중심점
      const circleCenter = new kakao.maps.LatLng(randomLat, randomLng);
      
      // 힌트 원 생성 (랜덤한 위치에 중심을 둔 원)
      this.hintCircle = new kakao.maps.Circle({
        center: circleCenter,
        radius: this.hintRadius,
        strokeWeight: 2,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeStyle: "dashed",
        fillColor: "#FF0000",
        fillOpacity: 0.2,
        map: map,
      });

      // 힌트 원이 보이도록 지도 이동 (원의 중심으로)
      console.log("힌트 원 중심 위치:", circleCenter);
      console.log("실제 정답 위치:", actualPosition);
      // map.setCenter(circleCenter);

      // 힌트 반경 조정 (힌트를 사용할 때마다 원이 작아짐)
      if (this.hintCount === 2) {
        this.hintRadius = 80000; // 두 번째 힌트는 80km
      } else if (this.hintCount === 1) {
        this.hintRadius = 30000; // 세 번째 힌트는 30km
      }

      // 다음 힌트 사용 가능 시간 설정
      this.hintAvailable = false;
      this.nextHintTime = 3;

      // 힌트 타이머 재설정
      if (this.hintTimer) {
        clearInterval(this.hintTimer);
      }

      this.hintTimer = setInterval(() => {
        if (this.nextHintTime > 0) {
          this.nextHintTime--;
        } else {
          this.hintAvailable = true;
          clearInterval(this.hintTimer);
        }
      }, 1000);

      // 힌트 사용 메시지 표시
      this.showToastMessage(
        `힌트를 사용했습니다. (남은 힌트: ${this.hintCount}/3)`
      );
    },

    // 랭크 모드 타이머 시작
    startTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      this.timerInterval = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;

          // 시간이 다 되면 자동으로 결과 표시
          if (this.timeRemaining === 0) {
            this.timeUp();
          }
        }
      }, 1000);
    },

    // 시간 초과 처리
    timeUp() {
      // 타이머 중지
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      // 가장 먼 위치로 마커 자동 설정
      const farthestPosition = {
        lat: this.currentLocation.lat > 36 ? 33.5 : 38.0,
        lng: this.currentLocation.lng > 128 ? 126.0 : 131.0,
      };

      this.checkAnswer(farthestPosition);
    },

    // 시간 형식 변환 (초를 MM:SS 형식으로)
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    },

    // 게임 위치 데이터 가져오기 (백엔드 연동 부분)
    fetchGameLocationData() {
      // 실제 구현에서는 axios를 사용하여 백엔드에서 데이터 가져오기
      this.isLoading = true;

      // 선택된 지역의 센터 위치로 중앙 설정
      this.centerLocation = {
        lat: this.selectedRegion.centerLat,
        lng: this.selectedRegion.centerLng,
      };

      // 더미 데이터: 로드뷰가 있는 것으로 확인된 좌표들 (서울, 부산 등 주요 도시)
      const knownLocations = [
        { lat: 37.566826, lng: 126.978656 }, // 서울시청
        { lat: 37.551229, lng: 126.988205 }, // 남산타워
        { lat: 37.570975, lng: 126.976999 }, // 광화문
        { lat: 37.512809, lng: 127.058984 }, // 삼성역
        { lat: 35.179682, lng: 129.075087 }, // 부산 해운대
        { lat: 35.158831, lng: 129.160007 }, // 부산 광안리
        { lat: 35.10146, lng: 129.032364 }, // 부산 서면
        { lat: 37.456769, lng: 126.705528 }, // 인천 송도
        { lat: 33.249293, lng: 126.560693 }, // 제주 올레길
        { lat: 33.4507, lng: 126.570667 }, // 제주 시내
      ];

      // 지역에 맞는 위치 선택
      let filteredLocations = knownLocations;
      if (this.selectedRegion.id === "seoul") {
        filteredLocations = knownLocations.slice(0, 4);
      } else if (this.selectedRegion.id === "busan") {
        filteredLocations = knownLocations.slice(4, 7);
      } else if (this.selectedRegion.id === "jeju") {
        filteredLocations = knownLocations.slice(8, 10);
      }

      // 필터링된 위치에서 랜덤으로 선택
      const randomIndex = Math.floor(Math.random() * filteredLocations.length);
      this.currentLocation = filteredLocations[randomIndex];
      console.log("선택된 로드뷰 위치:", this.currentLocation);

      this.isLoading = false;
    },

    // 게임 결과 확인
    checkAnswer(position) {
      if (this.showResult) return;

      // 타이머 정리
      this.clearTimer();

      // 거리 계산
      const distance = this.calculateDistance(
        position.lat,
        position.lng,
        this.currentLocation.lat,
        this.currentLocation.lng
      );

      // 점수 계산 (최대 100점)
      const score = Math.max(0, Math.floor(100 - Math.sqrt(distance) * 10));

      // 게임 결과 저장
      this.distance = distance;
      this.score = score;
      this.guessedLocation = position;

      // 결과 화면 표시
      this.showResult = true;

      // 결과 지도 초기화
      this.$nextTick(() => {
        this.initResultMap(position);
      });
    },

    // 결과 지도 초기화
    initResultMap(guessPosition) {
      if (!window.kakao || !window.kakao.maps) return;

      const resultMapContainer = this.$refs.resultMapElement;
      if (!resultMapContainer) return;

      const resultMap = new kakao.maps.Map(resultMapContainer, {
        center: new kakao.maps.LatLng(
          (guessPosition.lat + this.currentLocation.lat) / 2,
          (guessPosition.lng + this.currentLocation.lng) / 2
        ),
        level: 8,
      });

      // 사용자 마커
      new kakao.maps.Marker({
        position: new kakao.maps.LatLng(guessPosition.lat, guessPosition.lng),
        map: resultMap,
        imageSrc: "@/assets/currentLocation.png",
      });

      // 실제 위치 마커
      const imageSrc =
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
      const imageSize = new kakao.maps.Size(24, 35);
      const imageOption = { offset: new kakao.maps.Point(12, 35) };
      const markerImage = new kakao.maps.MarkerImage(
        imageSrc,
        imageSize,
        imageOption
      );

      new kakao.maps.Marker({
        position: new kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        ),
        map: resultMap,
        image: markerImage,
      });

      // 선 그리기
      const polyline = new kakao.maps.Polyline({
        path: [
          new kakao.maps.LatLng(guessPosition.lat, guessPosition.lng),
          new kakao.maps.LatLng(
            this.currentLocation.lat,
            this.currentLocation.lng
          ),
        ],
        strokeWeight: 3,
        strokeColor: "#5B9DFF",
        strokeOpacity: 0.7,
        strokeStyle: "solid",
      });

      polyline.setMap(resultMap);

      // 지도 범위 재설정
      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(
        new kakao.maps.LatLng(guessPosition.lat, guessPosition.lng)
      );
      bounds.extend(
        new kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        )
      );
      resultMap.setBounds(bounds);
    },

    // Spot 버튼 클릭 시 마커 위치 확인
    checkSpotAnswer() {
      if (!this.$refs.phoneFrame) {
        alert("지도가 준비되지 않았습니다. 다시 시도해주세요.");
        return;
      }

      // 현재 마커 위치를 얻기 위해 KakaoMapGame에서 마커 위치 데이터 요청
      this.$refs.phoneFrame
        .getMarkerPosition()
        .then((markerPosition) => {
          if (markerPosition) {
            // 지도 닫기
            this.isMapOpen = false;

            // 결과 확인
            this.$nextTick(() => {
              this.checkAnswer(markerPosition);
            });
          } else {
            alert("위치를 선택해주세요!");
          }
        })
        .catch(() => {
          alert("위치를 선택해주세요!");
        });
    },

    // 랭크 모드 타이머 시작
    startGameTimer() {
      this.elapsedTime = 0;

      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }

      this.gameTimer = setInterval(() => {
        this.elapsedTime++;
      }, 1000);
    },

    // 타이머 정리
    clearTimer() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }

      if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }

      if (this.hintTimer) {
        clearInterval(this.hintTimer);
        this.hintTimer = null;
      }
    },

    // 다음 라운드 시작
    nextRound() {
      this.resetGame();
      this.showIntro = true; // 인트로 화면 다시 표시
      this.gameStarted = false; // 게임 상태 초기화
    },

    // 게임 종료
    exitGame() {
      // 타이머 정리
      this.clearTimer();
      this.$router.push("/roadViewModeView");
    },

    // 게임 종료 확인
    confirmExit() {
      this.$router.push("/roadViewModeView");
    },

    // 지역 선택 변경
    changeRegion(region) {
      this.selectedRegion = region;
      this.resetGame();
      this.fetchGameLocationData();
    },

    // 로드뷰 로드 완료 이벤트 핸들러
    onRoadViewLoaded(data) {
      console.log("로드뷰 로드 완료", data);
      this.errorCount = 0; // 에러 카운트 초기화
    },

    // 로드뷰 로드 오류 이벤트 핸들러
    onRoadViewError() {
      console.error("로드뷰 로드 오류, 새 위치 시도");
      this.errorCount++;
      if (this.errorCount > this.maxErrorRetry) {
        this.showToastMessage("로드뷰를 찾을 수 없어 지도 모드로 전환합니다.");
        this.isMapOpen = true;
      } else {
        this.showToastMessage(
          `로드뷰 로드 실패 (${this.errorCount}/${this.maxErrorRetry}), 새 위치를 시도합니다...`
        );
        this.fetchGameLocationData();
      }
    },

    // 토스트 메시지 표시
    showToastMessage(message) {
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }

      this.toastMessage = message;
      this.showToast = true;

      this.toastTimeout = setTimeout(() => {
        this.showToast = false;
      }, 3000);
    },

    // 거리 계산 (Haversine 공식)
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // 킬로미터 단위
    },

    // 각도를 라디안으로 변환
    deg2rad(deg) {
      return deg * (Math.PI / 180);
    },

    // 카운트다운 완료 이벤트 핸들러
    onCountdownComplete() {
      this.showCountdown = false;
      this.gameStarted = true;

      // 게임 타이머 시작
      this.startGameTimer();

      // 힌트 타이머 시작 (첫 힌트는 30초 후에 사용 가능)
      // this.nextHintTime = 30;
      this.nextHintTime = 3;
      this.hintAvailable = false;

      if (this.hintTimer) {
        clearInterval(this.hintTimer);
      }

      this.hintTimer = setInterval(() => {
        if (this.nextHintTime > 0) {
          this.nextHintTime--;
        } else {
          this.hintAvailable = true;
          clearInterval(this.hintTimer);
        }
      }, 1000);
    },
  },
};
</script>

<style scoped>
.road-view-practice {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
  overflow: hidden;
}

/* 헤더 스타일 */
.game-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  backdrop-filter: blur(5px);
}

.back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.game-status {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 타이머 스타일 */
.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 6px 12px;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  transition: background-color 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.timer-warning {
  background-color: rgba(255, 50, 50, 0.8);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* 힌트 스타일 */
.hints {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hint-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hint-indicator.active {
  background-color: #2ecc71;
}

.hint-timer {
  font-size: 0.85rem;
  opacity: 0.9;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 10px;
}

.hint-btn {
  position: fixed;
  bottom: 30px;
  left: 30px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.hint-btn:active {
  transform: translateY(-1px);
}

.hint-btn i {
  font-size: 1.1rem;
}

/* IntroOverlay 컴포넌트에서 관리하므로 제거 */

/* 로딩 관련 스타일 - 사용하지 않는 부분 제거 */

/* 게임 컨테이너 */
.game-content {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 로드뷰 컨테이너 */
.road-view-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* Spot 버튼 스타일 */
.spot-button {
  position: fixed;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 30px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.4);
  transition: all 0.3s ease;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
}

.spot-button:hover {
  transform: translateX(-50%) translateY(-3px);
  box-shadow: 0 6px 15px rgba(46, 204, 113, 0.6);
}

.spot-button:active {
  transform: translateX(-50%) translateY(-1px);
}

.spot-button i {
  font-size: 1.1rem;
}

/* 지도 토글 버튼 스타일 */

.map-toggle {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 10;
}

.map-toggle:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
}

.map-toggle:active {
  transform: translateY(-1px);
}

.map-toggle i {
  font-size: 1.1rem;
}

/* 결과 화면 */
.result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 25;
  backdrop-filter: blur(5px);
}

.result-content {
  background-color: white;
  padding: 35px;
  border-radius: 20px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: popIn 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

@keyframes popIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.result-content h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.8rem;
}

.result-info {
  margin: 25px 0;
}

.info-item {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.info-icon {
  font-size: 1.2rem;
  margin-bottom: 5px;
}

.info-value {
  font-size: 1.7rem;
  font-weight: bold;
  color: #2ecc71;
}

.info-label {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.result-map {
  width: 100%;
  height: 300px;
  margin: 25px 0;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.rank-change {
  margin: 20px 0;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.rank-icon {
  font-size: 1.2rem;
  margin-bottom: 5px;
}

.rank-value {
  font-size: 1.3rem;
  font-weight: bold;
}

.rank-value.positive {
  color: #2ecc71;
}

.rank-value.negative {
  color: #e74c3c;
}

.rank-current {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.result-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 25px;
}

.restart-btn,
.exit-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.restart-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.restart-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.4);
}

.result-buttons .exit-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.result-buttons .exit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.4);
}

/* 모달 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  animation: popIn 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 25px;
}

.modal-buttons button {
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.modal-buttons button:first-child {
  background-color: #ecf0f1;
  color: #333;
}

.modal-buttons button:first-child:hover {
  background-color: #bdc3c7;
}

.modal-buttons button:last-child {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.modal-buttons button:last-child:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.4);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .result-map {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .game-header {
    padding: 10px;
  }

  .game-status {
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
  }

  .result-map {
    height: 200px;
  }

  .result-content {
    padding: 25px;
  }

  .result-buttons {
    flex-direction: column;
    gap: 15px;
  }

  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    right: 20px;
  }

  .hint-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
    bottom: 20px;
    left: 20px;
  }
}

/* 로드뷰 토스트 메시지 */
.toast-message {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  z-index: 35;
  max-width: 80%;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* 휴대폰 프레임 스타일은 PhoneFrame 컴포넌트에서 관리하므로 제거 */

/* PhoneFrame 컴포넌트에서 관리하므로 제거 */

.phone-hint-button {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.4);
  transition: all 0.3s ease;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 180px;
  text-align: center;
  justify-content: center;
}

.phone-hint-button:hover:not(:disabled) {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 12px rgba(255, 152, 0, 0.6);
}

.phone-hint-button:active:not(:disabled) {
  transform: translateX(-50%) translateY(-1px);
}

.phone-hint-button:disabled {
  background: linear-gradient(135deg, #ccc, #999);
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.8;
}

.phone-hint-button i {
  font-size: 0.9rem;
}
</style>
