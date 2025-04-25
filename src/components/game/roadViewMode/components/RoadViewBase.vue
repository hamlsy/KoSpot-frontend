<!-- 로드뷰 게임의 기본 컴포넌트 - 연습모드와 랭크모드에서 공통으로 사용하는 기능 -->
<template>
  <div class="road-view-base">
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
        <button
          class="map-toggle"
          @click="toggleMap"
        >
          <i
            class="fas"
            :class="isMapOpen ? 'fa-street-view' : 'fa-map-marked-alt'"
          ></i>
          {{ isMapOpen ? "로드뷰로 돌아가기" : "지도 열기" }}
        </button>
      </div>

      <!-- 휴대폰 프레임 -->
      <div class="phone-frame" v-if="isMapOpen">
        <div class="phone-header">
          <div class="phone-notch"></div>
        </div>
        <div class="phone-content">
          <!-- 맵 게임 컴포넌트가 여기에 표시됨 -->
          <KakaoMapGame
            :isOpen="true"
            :centerLocation="centerLocation"
            :actualLocation="currentLocation"
            :showHintCircles="false"
            :disabled="showResult"
            :showDistance="false"
            :showActionButton="false"
            @close="toggleMap"
            @check-answer="checkAnswer"
            ref="phoneMapGame"
            class="phone-map"
          />
          
          <!-- Spot 버튼 (휴대폰 프레임 내부) -->
          <button v-if="!showResult" 
            class="phone-spot-button"
            @click="checkSpotAnswer"
          >
            <i class="fas fa-crosshairs"></i> Spot!
          </button>
          
          <slot name="phone-buttons"></slot>
        </div>
        <div class="phone-footer">
          <div class="home-button" @click="toggleMap"></div>
        </div>
      </div>

      <!-- 카운트다운 화면 -->
      <div v-if="showCountdown" class="countdown-overlay">
        <div class="countdown">{{ countdown }}</div>
      </div>

      <!-- 결과 화면 -->
      <div v-if="showResult" class="result-overlay">
        <slot name="result-content"></slot>
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
            <button class="confirm-btn" @click="confirmExit">
              종료
            </button>
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
import RoadViewGame from "@/components/game/common/roadview/RoadViewGame.vue";
import KakaoMapGame from "@/components/game/common/kakao/KakaoMapGame.vue";

export default {
  name: "RoadViewBase",
  components: {
    RoadViewGame,
    KakaoMapGame,
  },
  props: {
    region: {
      type: String,
      default: "서울",
    },
  },
  data() {
    return {
      // 게임 화면 관련
      isMapOpen: false,
      showExitConfirmation: false,
      showResult: false,
      showToast: false,
      toastMessage: '',
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
        lat: 37.55,
        lng: 126.97
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
        name: '서울',
        bounds: {
          sw: { lat: 37.41, lng: 126.79 },
          ne: { lat: 37.70, lng: 127.17 }
        }
      },

      // 로드뷰 게임 상태
      showIntro: true,
      showCountdown: false,
      gameStarted: false,
      countdown: 3,
      countdownTimer: null,
    };
  },
  mounted() {
    this.initRegion();
    this.startGame();
  },
  beforeDestroy() {
    this.clearAllTimers();
  },
  methods: {
    // 게임 시작
    startGame() {
      this.resetGame();
      this.showCountdown = true;
      this.countdown = 3;

      // 카운트다운 시작
      this.countdownTimer = setInterval(() => {
        this.countdown--;
        if (this.countdown <= 0) {
          clearInterval(this.countdownTimer);
          this.showCountdown = false;
          this.gameStarted = true;
          this.startGameTimer();
          
          // 랜덤 위치 생성
          this.generateRandomLocation();
        }
      }, 1000);
    },

    // 게임 상태 초기화
    resetGame() {
      this.isMapOpen = false;
      this.showResult = false;
      this.distance = null;
      this.score = 0;
      this.elapsedTime = 0;
      this.guessedLocation = null;
      this.clearAllTimers();
    },

    // 모든 타이머 정리
    clearAllTimers() {
      if (this.countdownTimer) clearInterval(this.countdownTimer);
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
    },

    // 지역 초기화
    initRegion() {
      // 선택된 지역 찾기
      const region = this.regions.find(r => r.name === this.region) || this.regions[0];
      
      // 선택된 지역 설정
      this.selectedRegion = {
        ...region,
        bounds: this.getRegionBounds(region.id)
      };
      
      // 중심 위치 설정
      this.centerLocation = {
        lat: region.centerLat,
        lng: region.centerLng
      };
    },

    // 지역별 경계 설정
    getRegionBounds(regionId) {
      const bounds = {
        seoul: {
          sw: { lat: 37.41, lng: 126.79 },
          ne: { lat: 37.70, lng: 127.17 }
        },
        busan: {
          sw: { lat: 34.97, lng: 128.76 },
          ne: { lat: 35.39, lng: 129.27 }
        },
        jeju: {
          sw: { lat: 33.06, lng: 126.08 },
          ne: { lat: 33.60, lng: 127.00 }
        },
        gangwon: {
          sw: { lat: 37.02, lng: 127.05 },
          ne: { lat: 38.61, lng: 129.37 }
        },
        gyeonggi: {
          sw: { lat: 36.89, lng: 126.39 },
          ne: { lat: 38.30, lng: 127.85 }
        }
      };
      
      return bounds[regionId] || bounds.seoul;
    },

    // 랜덤 위치 생성
    generateRandomLocation() {
      const bounds = this.selectedRegion.bounds;
      
      // 랜덤 위치 생성
      const randomLat = bounds.sw.lat + Math.random() * (bounds.ne.lat - bounds.sw.lat);
      const randomLng = bounds.sw.lng + Math.random() * (bounds.ne.lng - bounds.sw.lng);
      
      this.currentLocation = {
        lat: randomLat,
        lng: randomLng
      };
    },

    // 로드뷰 로드 완료
    onRoadViewLoaded() {
      this.isLoading = false;
      this.errorCount = 0;
    },

    // 로드뷰 로드 오류
    onRoadViewError() {
      this.errorCount++;
      
      if (this.errorCount < this.maxErrorRetry) {
        // 다른 위치 시도
        this.displayToast("로드뷰를 불러올 수 없습니다. 다른 위치를 시도합니다.");
        this.generateRandomLocation();
      } else {
        // 최대 재시도 횟수 초과
        this.displayToast("로드뷰를 불러올 수 없습니다. 게임을 다시 시작합니다.");
        setTimeout(() => {
          this.startGame();
        }, 2000);
      }
    },

    // 지도 토글
    toggleMap() {
      this.isMapOpen = !this.isMapOpen;
    },

    // 답변 확인
    checkAnswer(location) {
      this.guessedLocation = location;
    },

    // Spot 버튼 클릭
    checkSpotAnswer() {
      if (!this.guessedLocation) {
        this.displayToast("지도에서 위치를 선택해주세요!");
        return;
      }
      
      // 거리 계산
      this.calculateDistance();
      
      // 점수 계산
      this.calculateScore();
      
      // 결과 표시
      this.showResult = true;
    },

    // 거리 계산
    calculateDistance() {
      if (!this.currentLocation || !this.guessedLocation) return;
      
      // 하버사인 공식을 사용한 거리 계산
      const R = 6371; // 지구 반지름 (km)
      const dLat = this.toRad(this.guessedLocation.lat - this.currentLocation.lat);
      const dLon = this.toRad(this.guessedLocation.lng - this.currentLocation.lng);
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.toRad(this.currentLocation.lat)) * Math.cos(this.toRad(this.guessedLocation.lat)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      this.distance = R * c;
    },

    // 라디안 변환
    toRad(value) {
      return value * Math.PI / 180;
    },

    // 점수 계산
    calculateScore() {
      if (this.distance === null) return 0;
      
      // 거리에 따른 점수 계산 (최대 5000점)
      let score = 5000 - Math.round(this.distance * 1000);
      
      // 최소 점수는 0점
      this.score = Math.max(0, score);
    },

    // 다음 라운드
    nextRound() {
      this.startGame();
    },

    // 게임 종료
    exitGame() {
      this.showExitConfirmation = true;
    },

    // 게임 종료 확인
    confirmExit() {
      this.$emit('exit');
    },

    // 게임 타이머 시작
    startGameTimer() {
      const startTime = Date.now();
      
      // 1초마다 경과 시간 업데이트
      this.gameTimer = setInterval(() => {
        this.elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      }, 1000);
    },

    // 시간 포맷 변환 (초 -> MM:SS)
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // 토스트 메시지 표시
    displayToast(message) {
      this.toastMessage = message;
      this.showToast = true;
      
      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }
      
      this.toastTimeout = setTimeout(() => {
        this.showToast = false;
      }, 3000);
    }
  }
};
</script>

<style scoped>
.road-view-base {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
}

.game-content {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.road-view-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 10;
  cursor: pointer;
  transition: all 0.2s ease;
}

.map-toggle:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #2980b9, #1a5276);
}

.map-toggle i {
  font-size: 1rem;
}

/* 카운트다운 */
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.countdown {
  font-size: 8rem;
  font-weight: bold;
  color: white;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 결과 화면 */
.result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
}

.modal-content {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  width: 300px;
  text-align: center;
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.modal-buttons button {
  padding: 8px 16px;
  border-radius: 5px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

.cancel-btn {
  background-color: #e0e0e0;
  color: #333;
}

.confirm-btn {
  background-color: #e74c3c;
  color: white;
}

/* 토스트 메시지 */
.toast-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 25;
  animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: translate(-50%, 0); }
  to { opacity: 0; transform: translate(-50%, 20px); }
}

/* 휴대폰 프레임 스타일 */
.phone-frame {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  height: 720px;
  background-color: #111;
  border-radius: 40px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 
              inset 0 0 10px rgba(255, 255, 255, 0.1),
              0 0 0 8px #333;
  z-index: 15;
}

.phone-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #000;
  z-index: 16;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.phone-notch {
  position: relative;
  top: 0;
  width: 150px;
  height: 30px;
  background-color: #000;
  border-radius: 0 0 15px 15px;
  z-index: 17;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-notch:before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #444;
  border-radius: 50%;
  left: 40px;
  top: 10px;
}

.phone-notch:after {
  content: '';
  position: absolute;
  width: 50px;
  height: 6px;
  background-color: #444;
  border-radius: 3px;
  right: 40px;
  top: 11px;
}

.phone-content {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 50px;
  z-index: 15;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.phone-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #000;
  z-index: 16;
  display: flex;
  justify-content: center;
  align-items: center;
}

.home-button {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #333, #222);
  border-radius: 50%;
  border: 2px solid #444;
  cursor: pointer;
  position: relative;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.home-button:before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 15px;
  height: 15px;
  border: 2px solid #666;
  border-radius: 3px;
}

.home-button:active {
  transform: scale(0.95);
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.8);
}

.phone-map {
  width: 100%;
  height: 100%;
  z-index: 15;
}

/* 휴대폰 내부 Spot 버튼 */
.phone-spot-button {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.4);
  transition: all 0.3s ease;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-spot-button:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 12px rgba(46, 204, 113, 0.6);
}

.phone-spot-button:active {
  transform: translateX(-50%) translateY(-1px);
}

.phone-spot-button i {
  font-size: 0.9rem;
}
</style>
