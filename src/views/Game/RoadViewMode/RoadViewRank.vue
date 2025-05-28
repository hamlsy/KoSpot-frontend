<template>
  <div class="road-view-practice">
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
      <div v-if="showResult" class="result-overlay">
        <div class="result-container">
          <div class="result-header">
            <h2>라운드 결과</h2>
          </div>

          <div class="result-content">
            <div class="result-score-section">
              <div class="score-display">
                <div class="score-label">점수</div>
                <div class="score-value">{{ score }}</div>
              </div>

              <div class="distance-display">
                <div class="distance-label">거리</div>
                <div class="distance-value">{{ formatDistance(distance) }}</div>
              </div>

              <div class="rank-points-display">
                <div class="rank-points-label">랭크 포인트</div>
                <div
                  class="rank-points-value"
                  :class="{
                    'points-increase': rankPointChange > 0,
                    'points-decrease': rankPointChange < 0,
                  }"
                >
                  <span class="current-points">{{ currentRankPoints }}</span>
                  <span v-if="rankPointChange !== 0" class="points-change">
                    {{ rankPointChange > 0 ? "+" : "" }}{{ rankPointChange }}
                  </span>
                </div>
              </div>
            </div>

            <div class="result-map-section">
              <div class="result-map-container">
                <!-- 여기에 결과 지도 표시 -->
                <div class="result-map"></div>
              </div>

              <div class="location-info">
                <div class="actual-location">
                  <strong>실제 위치:</strong>
                  {{ currentLocation ? currentLocation.address : "알 수 없음" }}
                  <div class="coordinates">
                    <i class="fas fa-map-marker-alt"></i>
                    {{
                      currentLocation
                        ? `${currentLocation.lat.toFixed(
                            6
                          )}, ${currentLocation.lng.toFixed(6)}`
                        : ""
                    }}
                  </div>
                  <div class="location-description">
                    {{ getLocationDescription() }}
                  </div>
                </div>
                <div class="guessed-location">
                  <strong>선택한 위치:</strong>
                  {{
                    guessedLocation ? guessedLocation.address : "선택하지 않음"
                  }}
                  <div class="coordinates" v-if="guessedLocation">
                    <i class="fas fa-map-marker-alt"></i>
                    {{
                      guessedLocation
                        ? `${guessedLocation.lat.toFixed(
                            6
                          )}, ${guessedLocation.lng.toFixed(6)}`
                        : ""
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="result-actions">
            <button class="btn-restart" @click="resetGame">
              <i class="fas fa-redo"></i> 다시하기
            </button>
            <button class="btn-exit" @click="exitGame">
              <i class="fas fa-door-open"></i> 나가기
            </button>
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
import RoadViewGame from "./components/gameplay/RoadViewGame.vue";
import PhoneFrame from "@/components/common/game/PhoneFrame.vue";
import CountdownOverlay from "@/components/common/game/CountdownOverlay.vue";
import IntroOverlay from "@/components/common/game/intro/IntroOverlay.vue";

export default {
  name: "RoadViewRank",
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
  },
  data() {
    return {
      //인트로 관리
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

      // 게임 점수 관련
      distance: null,
      score: 0,
      elapsedTime: 0,

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

    // 기존 정리 코드
    this.cleanupGame();
  },
  methods: {
    // 인트로 끝 및 카운트다운 시작
    endIntro() {
      this.showIntro = false;
      this.showCountdown = true;
    },

    // 게임 상태 초기화
    resetGame() {
      // 타이머 정리
      this.clearAllTimers();

      // 상태 초기화
      this.showResult = false;
      this.isMapOpen = false;
      this.guessedLocation = null;
      this.distance = null;
      this.score = 0;
      this.elapsedTime = 0;

      // 게임 위치 데이터 요청
      this.fetchGameLocationData();
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

    // 게임 위치 데이터 가져오기 (백엔드 연동 부분)
    fetchGameLocationData() {
      // 실제 구현에서는 axios를 사용하여 백엔드에서 데이터 가져오기
      this.isLoading = true;

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

      // 필터링된 위치에서 랜덤으로 선택
      const randomIndex = Math.floor(Math.random() * filteredLocations.length);
      this.currentLocation = filteredLocations[randomIndex];
      console.log("선택된 로드뷰 위치:", this.currentLocation);

      this.isLoading = false;
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

    // 랭크 포인트 변화 계산 (더미 데이터)
    calculateRankPointChange() {
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

      // 현재 랭크 포인트 업데이트
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

    // 결과 지도 초기화
    initResultMap() {
      if (!this.currentLocation || !window.kakao || !window.kakao.maps) {
        console.error("지도 API가 로드되지 않았거나 위치 정보가 없습니다.");
        return;
      }

      // 결과 지도 요소 가져오기
      const mapElement = document.querySelector(".result-map");
      if (!mapElement) {
        console.error("결과 지도 요소를 찾을 수 없습니다.");
        return;
      }

      // 지도 생성
      const resultMap = new window.kakao.maps.Map(mapElement, {
        center: new window.kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        ),
        level: 5,
      });

      // 실제 위치 마커 (빨간색)
      new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        ),
        map: resultMap,
      });

      // 사용자가 선택한 위치 마커 (파란색)
      if (this.guessedLocation) {
        new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(
            this.guessedLocation.lat,
            this.guessedLocation.lng
          ),
          map: resultMap,
        });

        // 두 지점을 모두 포함하는 지도 영역 설정
        const bounds = new window.kakao.maps.LatLngBounds();
        bounds.extend(
          new window.kakao.maps.LatLng(
            this.currentLocation.lat,
            this.currentLocation.lng
          )
        );
        bounds.extend(
          new window.kakao.maps.LatLng(
            this.guessedLocation.lat,
            this.guessedLocation.lng
          )
        );
        resultMap.setBounds(bounds);

        // 두 지점을 연결하는 선 그리기
        const linePath = [
          new window.kakao.maps.LatLng(
            this.currentLocation.lat,
            this.currentLocation.lng
          ),
          new window.kakao.maps.LatLng(
            this.guessedLocation.lat,
            this.guessedLocation.lng
          ),
        ];

        const polyline = new window.kakao.maps.Polyline({
          path: linePath,
          strokeWeight: 3,
          strokeColor: "#FF0000",
          strokeOpacity: 0.7,
          strokeStyle: "solid",
        });

        polyline.setMap(resultMap);
      }
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
    checkAnswer(position) {
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

      // 점수 계산 (최대 100점)
      const score = Math.max(0, Math.floor(100 - Math.sqrt(distance) * 10));

      // 게임 결과 저장
      this.distance = distance;
      this.score = score;
      this.guessedLocation = position;

      // 결과 화면 표시
      this.showResultScreen(position);
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
      this.$router.push("/roadViewMode");
    },

    // 게임 종료 확인
    confirmExit() {
      this.$router.push("/roadViewModeMain");
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

/* 로딩 화면 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.load-error {
  background-color: white;
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.load-error button {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  margin-top: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-error button:hover {
  transform: translateY(-2px);
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

/* 지도 토글 컨테이너 */
.map-toggle-container {
  position: absolute;
  bottom: 30px;
  right: 30px;
  z-index: 10;
}

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

.result-container {
  background-color: white;
  border-radius: 20px;
  width: 90%;
  max-width: 550px;
  height: 100%;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
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

.result-header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 20px 20px 0 0;
  text-align: center;
}

.result-header h2 {
  margin: 0;
  font-size: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.close-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.result-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.result-score-section {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.score-display,
.distance-display,
.rank-points-display {
  flex: 1;
  min-width: 120px;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}


.score-label,
.distance-label,
.rank-points-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.score-value,
.distance-value,
.rank-points-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.points-increase {
  color: #27ae60;
}

.points-increase .points-change {
  display: inline-block;
  animation: bounceUp 1s ease;
}

.points-decrease {
  color: #e74c3c;
}

.points-decrease .points-change {
  display: inline-block;
  animation: bounceDown 1s ease;
}

.points-change {
  font-size: 1rem;
  font-weight: normal;
  margin-left: 5px;
}

.result-map-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-map-container {
  width: 100%;
  height: 180px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.result-map {
  width: 100%;
  height: 100%;
  background-color: #f1f1f1;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.actual-location,
.guessed-location {
  font-size: 0.9rem;
  color: #333;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-align: left;
}

.actual-location {
  background-color: rgba(46, 204, 113, 0.1);
  border-left: 4px solid #2ecc71;
}

.guessed-location {
  background-color: rgba(52, 152, 219, 0.1);
  border-left: 4px solid #3498db;
}

.coordinates {
  margin-top: 5px;
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
}

.location-description {
  margin-top: 8px;
  font-style: italic;
  color: #555;
  font-size: 0.85rem;
  line-height: 1.4;
}

.result-actions {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  gap: 15px;
  border-top: 1px solid #eee;
  background-color: #f8f9fa;
  border-radius: 0 0 20px 20px;
}

.btn-restart,
.btn-exit {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  border: none;
}

.btn-restart {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 6px rgba(52, 152, 219, 0.3);
}

.btn-restart:hover {
  background: linear-gradient(135deg, #2980b9, #2471a3);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(52, 152, 219, 0.4);
}

.btn-exit {
  background: linear-gradient(135deg, #f1f1f1, #e0e0e0);
  color: #333;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-exit:hover {
  background: linear-gradient(135deg, #e0e0e0, #d0d0d0);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 480px) {
  .result-score-section {
    flex-direction: column;
  }

  .result-container {
    width: 95%;
    height: auto;
    max-height: 85vh;
  }

  .result-map-container {
    height: 150px;
  }

  .result-content {
    padding: 25px;
  }

  .result-buttons {
    flex-direction: column;
    gap: 15px;
  }

  .map-toggle-container {
    bottom: 20px;
    right: 20px;
  }

  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    right: 20px;
  }

  .phone-spot-button {
    padding: 8px 16px;
    font-size: 0.85rem;
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
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.timer {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.timer-warning {
  background-color: rgba(231, 76, 60, 0.8);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* 결과 화면 스타일 */
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 30;
  display: flex;
  justify-content: center;
  align-items: center;
}

.result-container {
  background-color: white;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  height: auto;
  max-height: 120vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.result-header {
  padding: 15px 20px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 15px 15px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header h2 {
  margin: 0;
  font-size: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.close-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.4);
}

.result-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.result-score-section {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.score-display,
.distance-display,
.rank-points-display {
  flex: 1;
  min-width: 120px;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.score-label,
.distance-label,
.rank-points-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.score-value,
.distance-value,
.rank-points-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.points-increase {
  color: #27ae60;
}

.points-increase .points-change {
  display: inline-block;
  animation: bounceUp 1s ease;
}

.points-decrease {
  color: #e74c3c;
}

.points-decrease .points-change {
  display: inline-block;
  animation: bounceDown 1s ease;
}

.points-change {
  font-size: 1rem;
  font-weight: normal;
  margin-left: 5px;
}

.result-map-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.result-map-container {
  width: 100%;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.result-map {
  width: 100%;
  height: 100%;
  background-color: #f1f1f1;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.actual-location,
.guessed-location {
  font-size: 0.9rem;
  color: #333;
}

.result-actions {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  gap: 15px;
  border-top: 1px solid #eee;
}

.btn-next-round,
.btn-exit {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  border: none;
}

.btn-next-round {
  background-color: #3498db;
  color: white;
}

.btn-next-round:hover {
  background-color: #2980b9;
}

.btn-exit {
  background-color: #f1f1f1;
  color: #333;
}

.btn-exit:hover {
  background-color: #e0e0e0;
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
@media (max-width: 768px) {
  .countdown {
    font-size: 8rem;
  }

  .phone-frame {
    width: 340px;
    height: 640px;
  }

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

  .countdown {
    font-size: 5rem;
  }

  .phone-frame {
    width: 300px;
    height: 600px;
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

  .map-toggle-container {
    bottom: 20px;
    right: 20px;
  }

  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    right: 20px;
  }

  .phone-spot-button {
    padding: 8px 16px;
    font-size: 0.85rem;
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
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.timer {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.timer-warning {
  background-color: rgba(231, 76, 60, 0.8);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
