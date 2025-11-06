<template>
  <div class="road-view-practice">
    <!-- 헤더 -->
    <div class="game-header">
      <button class="back-btn" @click="exitGame">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2>랭크 모드</h2>
      <div class="game-status">
        <!-- 공백 (레이아웃 유지용) -->
      </div>
    </div>

    <!-- 타이머 표시 -->
    <div v-if="isGameStarted && !showResult" class="timer-container">
      <div class="timer" :class="{ 'timer-warning': remainingTime <= 30 }">
        <i class="fas fa-clock"></i>
        <span>{{ formatTime(remainingTime) }}</span>
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
      </div>

      <!-- 휴대폰 프레임 -->
      <PhoneFrame
        :style="{ zIndex: isMapOpen ? 15 : -1 }"
        :centerLocation="centerLocation"
        :actualLocation="currentLocation"
        :showHintCircles="false"
        :disabled="showResult"
        :showDistance="false"
        :showActionButton="false"
        :gameMode="'single'"
        @close="toggleMap"
        @check-answer="checkAnswer"
        @spot-answer="checkSpotAnswer"
        @error="showToastMessage"
        ref="phoneFrame"
      />

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
      <ResultOverlay
        :show="showResult"
        :score="score"
        :distance="distance"
        :currentRankPoints="currentRankPoints"
        :rankPointChange="rankPointChange"
        :previousRatingScore="previousRatingScore"
        :currentRatingScore="currentRatingScore"
        :previousRankTier="previousRankTier"
        :previousRankLevel="previousRankLevel"
        :currentRankTier="currentRankTier"
        :currentRankLevel="currentRankLevel"
        :currentLocation="currentLocation"
        :guessedLocation="guessedLocation"
        :locationDescription="getLocationDescription()"
        :poiName="poiName"
        :markerImageUrl="markerImageUrl"
        :userNickname="'플레이어'"
        @restart="resetGame"
        @exit="exitGame"
      />

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
import RoadViewGame from 'src/features/game/single/roadview/components/gameplay/RoadViewGame.vue'
import PhoneFrame from 'src/features/game/shared/components/Phone/PhoneFrame.vue'
import CountdownOverlay from "@/features/game/shared/components/Common/CountdownOverlay.vue";
import IntroOverlay from "@/features/game/shared/components/Common/IntroOverlay.vue";
import ResultOverlay from 'src/features/game/single/roadview/components/Result/ResultOverlay.vue';
import { roadViewApiService } from 'src/features/game/single/roadview/services/roadViewApi.service.js';

export default {
  name: "RoadViewRank",
  components: {
    RoadViewGame,
    PhoneFrame,
    CountdownOverlay,
    IntroOverlay,
    ResultOverlay,
  },
  props: {
    isRankMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 인트로 관리
      gameTitle: "랭크 모드",
      gameContent: "현재 보이는 로드뷰의 위치를 지도에서 찾아보세요.",
      gameDescription:
        '지도를 열고 위치를 클릭한 후 "Spot!" 버튼을 눌러 정답을 확인하세요.',

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
      
      // API 관련
      gameId: null, // 백엔드에서 받은 게임 ID (Number)
      markerImageUrl: null, // 마커 이미지 URL
      gameStartTime: null, // 게임 시작 시간 (타임스탬프)
      poiName: null, // 정답 위치의 POI 이름 (백엔드에서 받음)

      // 게임 점수 관련
      distance: null,
      score: 0,
      elapsedTime: 0, // 게임 경과 시간 (초)

      // 지도 관련
      mapInitialized: false,
      centerLocation: {
        lat: 37.5665,
        lng: 126.978,
      },

      // 인트로 및 카운트다운 관련
      showIntro: true,
      showCountdown: false,
      gameStarted: false,

      // 힌트 관련
      showHints: false,

      // 게임 타이머 관련
      gameTimer: null,
      gameTime: 0,

      // 랭크 관련
      timerInterval: null,
      currentRankPoints: 1000, // 예시 값
      rankPointChange: 0,
      
      // 랭크 티어/레벨 관련 (API 응답)
      previousRatingScore: 0,
      currentRatingScore: 0,
      previousRankTier: null,
      previousRankLevel: null,
      currentRankTier: null,
      currentRankLevel: null,

      // 타이머 관련
      isGameStarted: false,
      remainingTime: 180, // 3분 (초 단위)
      
      locationDescriptions: {
        서울: "대한민국의 수도이자 최대 도시로, 현대적인 건물과 고궁이 공존하는 곳입니다.",
        부산: "대한민국 제2의 도시이자 최대 항구도시로, 해운대와 광안리 해변으로 유명합니다.",
        제주: "한국의 대표적인 관광지로, 아름다운 자연경관과 독특한 문화를 가진 섬입니다.",
        강원: "산과 바다가 어우러진 지역으로, 스키장과 해변 등 사계절 관광지로 유명합니다.",
        경기: "서울을 둘러싸고 있는 지역으로, 수원화성과 같은 역사적 명소가 많습니다.",
        인천: "대한민국의 주요 항구도시이자 국제공항이 위치한 곳으로, 송도 국제도시가 있습니다.",
        대전: "대한민국의 중앙에 위치한 과학도시로, 대덕연구단지가 유명합니다.",
        광주: "호남지역의 중심도시로, 예술과 민주화 운동의 역사가 깊은 곳입니다.",
        대구: "경북의 중심도시로, 섬유산업과 약령시장으로 유명합니다.",
        울산: "대한민국의 공업도시로, 현대자동차와 조선소가 위치해 있습니다.",
      },
    };
  },
  mounted() {
    // 게임 위치 데이터 요청
    this.fetchGameLocationData();
  },
  beforeUnmount() {
    // 컴포넌트 소멸 시 타이머 정리
    this.clearAllTimers();
  },
  methods: {
    // 인트로 끝 및 카운트다운 시작
    endIntro() {
      this.showIntro = false;
      this.showCountdown = true;
    },

    // 게임 상태 초기화
    resetGame() {
      // 페이지 새로고침으로 게임을 완전히 초기화
      window.location.reload();
    },

    // 모든 타이머 정리
    clearAllTimers() {
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    // 지도 토글
    toggleMap() {
      // 상태 변경
      this.isMapOpen = !this.isMapOpen;
    },

    // 랭크 모드 타이머 시작
    startTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      this.timerInterval = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;

          // 시간이 다 되면 자동으로 결과 표시
          if (this.remainingTime === 0) {
            this.timeUp();
          }
        }
      }, 1000);
    },

    // 시간 초과 처리
    timeUp() {
      if (this.showResult) return; // 이미 결과 화면이 표시된 경우 중복 실행 방지

      if (this.isMapOpen) {
        // 지도가 열려있는 경우 현재 마커 위치로 제출
        this.checkSpotAnswer();
      } else {
        // 지도가 닫혀있는 경우 결과 화면 표시
        this.showToastMessage("시간이 종료되었습니다!");
        this.showResultScreen(null);
      }
    },

    // 시간 형식 변환 (초를 MM:SS 형식으로)
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    },

    // 거리 포맷팅 (km 또는 m)
    formatDistance(distance) {
      if (distance === null || distance === undefined) return "알 수 없음";

      if (distance < 1) {
        // 1km 미만은 m 단위로 표시
        return `${Math.round(distance * 1000)} m`;
      } else {
        // 1km 이상은 소수점 두 자리까지 표시
        return `${distance.toFixed(2)} km`;
      }
    },

    // 게임 위치 데이터 가져오기 (백엔드 API 연동)
    async fetchGameLocationData() {
      this.isLoading = true;

      try {
        // 백엔드 API 호출하여 랭크 게임 시작
        const response = await roadViewApiService.startRankGame();
        
        if (response.isSuccess && response.result) {
          const { gameId, targetLat, targetLng, markerImageUrl, poiName } = response.result;
          
          // API 응답 데이터를 컴포넌트 상태에 저장
          // gameId를 숫자로 변환하여 저장 (백엔드 Long 타입)
          this.gameId = roadViewApiService.convertGameIdToNumber(gameId);
          this.markerImageUrl = markerImageUrl;
          this.poiName = poiName || null; // POI 이름 저장
          
          // 암호화된 좌표를 복호화
          this.currentLocation = {
            lat: roadViewApiService.decryptCoordinate(targetLat),
            lng: roadViewApiService.decryptCoordinate(targetLng)
          };
          
          console.log("백엔드에서 받은 랭크 게임 데이터:", {
            gameId: this.gameId,
            location: this.currentLocation,
            markerImageUrl,
            poiName: this.poiName
          });
        } else {
          throw new Error(response.message || '게임 시작에 실패했습니다.');
        }
      } catch (error) {
        console.error("게임 시작 API 호출 실패:", error);
        this.showToastMessage("게임을 시작할 수 없습니다. 다시 시도해주세요.");
        
        // API 실패 시 더미 데이터로 폴백
        this.fallbackToDummyData();
      } finally {
        this.isLoading = false;
      }
    },

    // API 실패 시 더미 데이터로 폴백
    fallbackToDummyData() {
      console.warn("더미 데이터로 폴백");
      
      // 더미 데이터: 로드뷰가 있는 것으로 확인된 좌표들
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

      const randomIndex = Math.floor(Math.random() * knownLocations.length);
      this.currentLocation = knownLocations[randomIndex];
      
      // 더미 게임 ID 생성 (Number 타입)
      this.gameId = Date.now();
      this.markerImageUrl = null;
      
      console.log("더미 데이터로 선택된 위치:", this.currentLocation);
    },

    // 결과 화면 표시 메서드
    showResultScreen(guessedLocation) {
      // 타이머 정지
      this.clearAllTimers();

      this.guessedLocation = guessedLocation;
      this.showResult = true;

      // 랭크 포인트 변화 계산 (더미 데이터)
      this.calculateRankPointChange();

      // 결과 화면이 표시된 후 결과 지도 초기화
      this.$nextTick(() => {
        this.initResultMap();
      });
    },

    // 랭크 포인트 변화 계산
    calculateRankPointChange() {
      // API 호출로 이미 랭크 포인트가 설정된 경우 그대로 사용
      if (this.rankPointChange !== 0) {
        console.log("백엔드에서 계산된 랭크 포인트 변화 사용:", this.rankPointChange);
        return;
      }

      // API 실패 시 더미 데이터로 폴백
      console.warn("더미 랭크 포인트 계산 사용");
      
      // 점수에 따라 랭크 포인트 변화 계산
      if (this.score >= 90) {
        this.rankPointChange = 25;
      } else if (this.score >= 70) {
        this.rankPointChange = 15;
      } else if (this.score >= 50) {
        this.rankPointChange = 5;
      } else if (this.score >= 30) {
        this.rankPointChange = -5;
      } else if (this.score >= 10) {
        this.rankPointChange = -15;
      } else {
        this.rankPointChange = -25;
      }

      // 현재 랭크 포인트 업데이트 (더미 데이터인 경우에만)
      this.currentRankPoints += this.rankPointChange;

      // 최소값 보정
      if (this.currentRankPoints < 0) {
        this.currentRankPoints = 0;
      }
    },

    // 위치 설명 가져오기 (더미 데이터)
    getLocationDescription() {
      if (!this.currentLocation || !this.currentLocation.address)
        return "정보가 없습니다.";

      // 주소에서 지역명 추출 (예: '서울특별시' -> '서울')
      const addressParts = this.currentLocation.address.split(" ");
      let region = "";

      if (addressParts.length > 0) {
        const firstPart = addressParts[0];
        if (firstPart.includes("서울")) region = "서울";
        else if (firstPart.includes("부산")) region = "부산";
        else if (firstPart.includes("제주")) region = "제주";
        else if (firstPart.includes("강원")) region = "강원";
        else if (firstPart.includes("경기")) region = "경기";
        else if (firstPart.includes("인천")) region = "인천";
        else if (firstPart.includes("대전")) region = "대전";
        else if (firstPart.includes("광주")) region = "광주";
        else if (firstPart.includes("대구")) region = "대구";
        else if (firstPart.includes("울산")) region = "울산";
      }

      return this.locationDescriptions[region] || "한국의 아름다운 지역입니다.";
    },

    // 결과 지도 초기화 - ResultMapSection 컴포넌트로 이동됨
    initResultMap() {
      // 이제 ResultMapSection 컴포넌트에서 처리함
      console.log("지도 초기화는 ResultMapSection 컴포넌트에서 처리합니다.");
    },

    // 결과 화면 닫기
    closeResult() {
      this.showResult = false;
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

    // 게임 결과 확인
    async checkAnswer(position) {
      if (this.showResult) return;

      // 타이머 정리
      this.clearAllTimers();

      // 거리 계산
      const distance = this.calculateDistance(
        position.lat,
        position.lng,
        this.currentLocation.lat,
        this.currentLocation.lng
      );

      // 로컬 점수 계산 (임시, 백엔드에서 최종 점수 계산)
      const localScore = Math.max(0, Math.floor(100 - Math.sqrt(distance) * 10));

      // 게임 결과 저장 (백엔드 API 호출 전 임시 저장)
      this.distance = distance;
      this.guessedLocation = position;

      try {
        // 백엔드 API 호출하여 게임 종료
        await this.endGameWithApi(position);
      } catch (error) {
        console.error("게임 종료 API 호출 실패:", error);
        // API 실패 시 로컬 계산 결과 사용
        this.score = localScore;
        this.showToastMessage("결과 전송에 실패했지만 게임을 계속합니다.");
      }

      // 결과 화면 표시
      this.showResultScreen(position);
    },

    // 백엔드 API로 게임 종료
    async endGameWithApi(position) {
      if (!this.gameId) {
        console.warn("게임 ID가 없어 API 호출을 건너뜁니다.");
        return;
      }

      try {
        // 답변 소요 시간 계산 (초 단위)
        const answerTime = this.gameStartTime 
          ? (Date.now() - this.gameStartTime) / 1000 
          : this.elapsedTime;

        const endData = {
          gameId: this.gameId, // Number 타입
          submittedLat: position.lat, // Number 타입
          submittedLng: position.lng, // Number 타입
          answerTime: answerTime // Number 타입 (초)
        };

        console.log("게임 종료 요청 데이터:", endData);

        const response = await roadViewApiService.endRankGame(endData);
        
        if (response.isSuccess && response.result) {
          const { 
            score,
            previousRatingScore,
            currentRatingScore,
            ratingScoreChange,
            previousRankTier,
            previousRankLevel,
            currentRankTier,
            currentRankLevel
          } = response.result;
          
          // 백엔드에서 계산된 점수와 랭킹 정보로 업데이트
          this.score = score;
          this.previousRatingScore = previousRatingScore;
          this.currentRatingScore = currentRatingScore;
          this.rankPointChange = ratingScoreChange;
          this.currentRankPoints = currentRatingScore; // 현재 레이팅 점수 표시
          
          // 티어/레벨 정보 저장
          this.previousRankTier = previousRankTier;
          this.previousRankLevel = previousRankLevel;
          this.currentRankTier = currentRankTier;
          this.currentRankLevel = currentRankLevel;
          
          console.log("백엔드에서 받은 랭크 게임 결과:", {
            score,
            previousRatingScore,
            currentRatingScore,
            ratingScoreChange,
            previousRank: `${previousRankTier} ${previousRankLevel}`,
            currentRank: `${currentRankTier} ${currentRankLevel}`,
            answerTime
          });
        } else {
          throw new Error(response.message || '게임 결과 처리에 실패했습니다.');
        }
      } catch (error) {
        console.error("게임 종료 API 호출 중 오류:", error);
        throw error; // 상위에서 처리
      }
    },

    // 다음 라운드 시작
    nextRound() {
      this.resetGame();
      this.showIntro = true; // 인트로 화면 다시 표시
      this.gameStarted = false; // 게임 상태 초기화
      this.isGameStarted = false;
      this.remainingTime = 180;
    },

    // 게임 종료
    exitGame() {
      // 타이머 정리
      this.clearAllTimers();
      this.$router.push("/roadView/main");
    },

    // 게임 종료 확인
    confirmExit() {
      this.$router.push("/roadView/main");
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
      this.isGameStarted = true;
      this.remainingTime = 180; // 3분
      
      // 게임 시작 시간 기록 (답변 시간 계산용)
      this.gameStartTime = Date.now();
      
      this.startTimer();
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
  color: white;
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

/* 반응형 디자인 */
@media (max-width: 480px) {
  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    right: 20px;
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

.timer-container {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
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
  transition: all 0.2s ease;
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
@media (max-width: 480px) {
  .game-header {
    padding: 10px;
  }

  .game-status {
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
  }

  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    right: 20px;
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
</style>
