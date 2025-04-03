<template>
  <div class="road-view-rank">
    <div class="rank-header">
      <div class="rank-info">
        <h2>랭크 모드</h2>
        <div class="region-badge">{{ region }}</div>
      </div>
      
      <div class="timer" :class="{'warning': timeRemaining <= 30}">
        {{ formatTime(timeRemaining) }}
      </div>
    </div>
    
    <!-- 로드뷰 게임 컴포넌트 -->
    <div class="game-view">
      <RoadViewGame
        :initialPosition="currentLocation"
        :showControls="true"
        :showCompass="true"
        @load-complete="onRoadViewLoaded"
        @load-error="retryLoading"
      />
      
      <div class="map-toggle-container">
        <button 
          class="map-toggle" 
          @click="toggleMap"
        >
          <i class="fas" :class="isMapOpen ? 'fa-street-view' : 'fa-map-marked-alt'"></i>
          {{ isMapOpen ? '로드뷰로 돌아가기' : '지도 열기' }}
        </button>
      </div>
    </div>
    
    <!-- 카운트다운 화면 -->
    <div class="countdown-overlay" v-if="showCountdown">
      <div class="countdown">{{ countdown }}</div>
    </div>
    
    <!-- 인트로 화면 -->
    <div class="intro-overlay" v-if="showIntro">
      <div class="intro-content">
        <h2>로드뷰 랭크 모드</h2>
        <div class="region-info">
          <div class="region-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <div class="region-name">{{ region }}</div>
        </div>
        
        <div class="intro-description">
          <p>랭크 모드에서는 제한 시간 내에 당신의 위치를 맞혀야 합니다.</p>
          <p>정확도와 속도에 따라 랭크 포인트를 획득할 수 있습니다.</p>
          <ul class="game-rules">
            <li><i class="fas fa-clock"></i> 제한시간: 3분</li>
            <li><i class="fas fa-ban"></i> 힌트 없음</li>
            <li><i class="fas fa-trophy"></i> 정확도와 속도에 따른 점수</li>
          </ul>
        </div>
        
        <button class="start-btn" @click="startGame">
          <i class="fas fa-play"></i> 게임 시작
        </button>
      </div>
    </div>
    
    <!-- 결과 화면 -->
    <div class="result-overlay" v-if="showResult">
      <div class="result-content">
        <h2>라운드 결과</h2>
        
        <div class="result-stats">
          <div class="result-stat">
            <div class="stat-icon">
              <i class="fas fa-ruler"></i>
            </div>
            <div class="stat-value">{{ distance.toFixed(2) }} km</div>
            <div class="stat-label">떨어진 거리</div>
          </div>
          
          <div class="result-stat">
            <div class="stat-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="stat-value">{{ score }}</div>
            <div class="stat-label">점수</div>
          </div>
          
          <div class="result-stat">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-value">{{ formatTime(180 - timeRemaining) }}</div>
            <div class="stat-label">소요 시간</div>
          </div>
        </div>
        
        <div class="result-map" ref="resultMapElement"></div>
        
        <div class="rank-change">
          <div class="rank-icon">
            <i class="fas" :class="rankPointChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
          </div>
          <div class="rank-value" :class="rankPointChange >= 0 ? 'positive' : 'negative'">
            {{ rankPointChange >= 0 ? '+' : '' }}{{ rankPointChange }} 포인트
          </div>
        </div>
        
        <div class="rank-total">
          <div class="rank-label">현재 랭크 포인트:</div>
          <div class="rank-current">{{ currentRankPoints }}</div>
        </div>
        
        <div class="result-buttons">
          <button class="play-again" @click="restartGame">
            <i class="fas fa-redo"></i> 다시 플레이
          </button>
          <button class="exit-game" @click="exitGame">
            <i class="fas fa-sign-out-alt"></i> 종료
          </button>
        </div>
      </div>
    </div>
    
    <!-- 맵 컴포넌트 -->
    <KakaoMapGame
      :isOpen="isMapOpen"
      :centerLocation="centerLocation"
      :actualLocation="currentLocation"
      :disabled="timeRemaining <= 0"
      :actionButtonText="'위치 선택'"
      @close="toggleMap"
      @check-answer="checkAnswer"
    />
  </div>
</template>

<script>
import RoadViewGame from '@/components/shared/RoadViewGame.vue';
import KakaoMapGame from '@/components/shared/KakaoMapGame.vue';

export default {
  name: 'RoadViewRank',
  components: {
    RoadViewGame,
    KakaoMapGame
  },
  props: {
    region: {
      type: String,
      default: '서울'
    }
  },
  data() {
    return {
      // 게임 상태 관련
      isMapOpen: false,
      showExitConfirmation: false,
      showResult: false,
      showIntro: true,
      showCountdown: false,
      gameStarted: false,
      countdown: 3,
      isLoading: true,
      
      // 위치 정보
      currentLocation: null,
      centerLocation: {
        lat: 36.480401,
        lng: 127.574667, // 한국 중심점
      },
      
      // 게임 결과 관련
      distance: 0,
      score: 0,
      
      // 랭크 모드 관련
      timeRemaining: 180, // 3분(초 단위)
      timerInterval: null,
      currentRankPoints: 1000, // 예시 값
      rankPointChange: 0,
    };
  },
  mounted() {
    // 첫 게임 위치 데이터 요청
    this.fetchGameLocationData();
  },
  beforeDestroy() {
    // 타이머 정리
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },
  methods: {
    // 게임 위치 데이터 가져오기 (백엔드 연동 부분)
    fetchGameLocationData() {
      // 실제 구현에서는 axios를 사용하여 백엔드에서 데이터 가져오기
      // 데모용: 랜덤 위치 생성
      this.currentLocation = this.getRandomCoordinate();
      this.isLoading = false;
    },
    
    // 랜덤 좌표 생성 (데모용)
    getRandomCoordinate() {
      // 대한민국 영역 제한
      const KOREA_BOUNDS = {
        MIN_LAT: 33.0, // 제주도 남단
        MAX_LAT: 38.0, // 강원도 북단
        MIN_LNG: 125.0, // 서해 서단
        MAX_LNG: 132.0, // 독도 동단
      };

      // 랜덤 좌표 생성
      const randomLat =
        Math.random() * (KOREA_BOUNDS.MAX_LAT - KOREA_BOUNDS.MIN_LAT) +
        KOREA_BOUNDS.MIN_LAT;
      const randomLng =
        Math.random() * (KOREA_BOUNDS.MAX_LNG - KOREA_BOUNDS.MIN_LNG) +
        KOREA_BOUNDS.MIN_LNG;

      return {
        lat: parseFloat(randomLat.toFixed(6)),
        lng: parseFloat(randomLng.toFixed(6)),
      };
    },
    
    // 게임 시작
    startGame() {
      this.showIntro = false;
      this.showCountdown = true;

      const countdownInterval = setInterval(() => {
        this.countdown--;
        if (this.countdown === 0) {
          clearInterval(countdownInterval);
          this.showCountdown = false;
          this.gameStarted = true;
          this.startTimer();
        }
      }, 1000);
    },
    
    // 타이머 시작
    startTimer() {
      this.timerInterval = setInterval(() => {
        if (this.timeRemaining > 0) {
          this.timeRemaining--;
          
          // 시간이 다 되면 자동으로 결과 화면 표시
          if (this.timeRemaining === 0) {
            this.timeUp();
          }
        }
      }, 1000);
    },
    
    // 시간 초과 처리
    timeUp() {
      clearInterval(this.timerInterval);
      
      // 자동으로 랜덤 위치에 마커 배치 (가장 먼 곳에 배치)
      const farthestPosition = {
        lat: this.currentLocation.lat > 35.5 ? 33.5 : 38.0,
        lng: this.currentLocation.lng > 128.5 ? 126.0 : 131.0
      };
      
      this.checkAnswer(farthestPosition);
    },
    
    // 지도 토글
    toggleMap() {
      this.isMapOpen = !this.isMapOpen;
    },
    
    // 로드뷰 로드 이벤트 핸들러
    onRoadViewLoaded(data) {
      console.log("로드뷰 로드 완료", data);
    },
    
    // 재시도
    retryLoading() {
      this.fetchGameLocationData();
    },
    
    // 결과 확인
    checkAnswer(markerPosition) {
      if (!markerPosition) return;
      
      const correctPosition = {
        lat: this.currentLocation.lat,
        lng: this.currentLocation.lng
      };

      // 게임 결과 표시
      this.showResult = true;
      
      // 거리 계산 (Haversine 공식)
      this.distance = this.calculateDistance(
        markerPosition.lat, markerPosition.lng,
        correctPosition.lat, correctPosition.lng
      );
      
      // 점수 계산
      this.score = Math.max(100 - Math.floor(this.distance * 2), 0);
      
      // 점수와 남은 시간에 따라 랭크 포인트 변화 계산
      this.rankPointChange = Math.floor(this.score / 10) + Math.floor(this.timeRemaining / 10) - 5;
      this.currentRankPoints += this.rankPointChange;
      
      // 타이머 중지
      clearInterval(this.timerInterval);
      
      // 결과 지도 초기화
      this.$nextTick(() => {
        this.initResultMap(markerPosition, correctPosition);
      });
    },
    
    // 결과 지도 초기화
    initResultMap(guessPosition, actualPosition) {
      const resultMapContainer = this.$refs.resultMapElement;
      if (!resultMapContainer || !window.kakao || !window.kakao.maps) return;
      
      const map = new kakao.maps.Map(resultMapContainer, {
        center: new kakao.maps.LatLng(
          (guessPosition.lat + actualPosition.lat) / 2,
          (guessPosition.lng + actualPosition.lng) / 2
        ),
        level: 13
      });
      
      // 사용자 마커
      new kakao.maps.Marker({
        position: new kakao.maps.LatLng(guessPosition.lat, guessPosition.lng),
        map: map
      });
      
      // 실제 위치 마커
      const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
      const imageSize = new kakao.maps.Size(24, 35);
      const imageOption = {offset: new kakao.maps.Point(12, 35)};
      const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
      
      new kakao.maps.Marker({
        position: new kakao.maps.LatLng(actualPosition.lat, actualPosition.lng),
        map: map,
        image: markerImage
      });
      
      // 선 그리기
      const polyline = new kakao.maps.Polyline({
        path: [
          new kakao.maps.LatLng(guessPosition.lat, guessPosition.lng),
          new kakao.maps.LatLng(actualPosition.lat, actualPosition.lng)
        ],
        strokeWeight: 3,
        strokeColor: "#5B9DFF",
        strokeOpacity: 0.7,
        strokeStyle: "solid"
      });
      
      polyline.setMap(map);
      
      // 지도 범위 재설정
      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(new kakao.maps.LatLng(guessPosition.lat, guessPosition.lng));
      bounds.extend(new kakao.maps.LatLng(actualPosition.lat, actualPosition.lng));
      map.setBounds(bounds);
    },
    
    // 거리 계산 (Haversine 공식)
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // 킬로미터 단위
    },
    
    // 각도를 라디안으로 변환
    deg2rad(deg) {
      return deg * (Math.PI / 180);
    },
    
    // 시간 형식 변환 (초를 MM:SS 형식으로)
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // 게임 재시작
    restartGame() {
      // 기본 상태 초기화
      this.isMapOpen = false;
      this.showResult = false;
      this.showIntro = true;
      this.countdown = 3;
      this.gameStarted = false;
      this.isLoading = true;
      this.timeRemaining = 180;
      
      // 새 게임 위치 데이터 요청
      this.fetchGameLocationData();
    },
    
    // 게임 종료
    exitGame() {
      this.$router.push("/roadViewModeMain");
    }
  }
};
</script>

<style scoped>
.road-view-rank {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #f5f7fa;
  overflow: hidden;
}

.rank-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rank-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank-info h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.region-badge {
  background: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.timer {
  font-weight: 700;
  font-size: 1.5rem;
  color: #333;
  background: white;
  padding: 5px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timer.warning {
  color: white;
  background: #e74c3c;
  animation: pulse 1s infinite;
}

.game-view {
  width: 100%;
  height: 100%;
}

.map-toggle-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 5;
}

.map-toggle {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.map-toggle:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
}

.map-toggle:active {
  transform: translateY(-1px);
}

/* 카운트다운 화면 */
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.countdown {
  font-size: 10rem;
  font-weight: 900;
  color: white;
  animation: countdownAnim 1s infinite;
}

/* 인트로 화면 */
.intro-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #3a7bd5, #3a6073);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.intro-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
}

.intro-content h2 {
  margin: 0 0 20px 0;
  font-size: 2rem;
  color: #333;
}

.region-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.region-icon {
  width: 40px;
  height: 40px;
  background: #3498db;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.region-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.intro-description {
  margin-bottom: 25px;
  color: #555;
}

.intro-description p {
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.game-rules {
  text-align: left;
  width: fit-content;
  margin: 20px auto;
  padding-left: 10px;
}

.game-rules li {
  margin-bottom: 10px;
  list-style-type: none;
  display: flex;
  align-items: center;
  gap: 10px;
}

.game-rules li i {
  color: #3498db;
  width: 20px;
  text-align: center;
}

.start-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.start-btn:active {
  transform: translateY(-1px);
}

/* 결과 화면 */
.result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.result-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  max-height: 90vh;
}

.result-content h2 {
  margin: 0 0 20px 0;
  font-size: 1.8rem;
  color: #333;
  text-align: center;
}

.result-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  justify-content: center;
}

.result-stat {
  flex: 1;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  font-size: 1.5rem;
  color: #3498db;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.result-map {
  width: 100%;
  height: 250px;
  margin-bottom: 25px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rank-change {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
}

.rank-icon {
  font-size: 1.5rem;
}

.rank-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.rank-value.positive {
  color: #2ecc71;
}

.rank-value.negative {
  color: #e74c3c;
}

.rank-total {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
}

.rank-label {
  font-size: 1.1rem;
  color: #666;
}

.rank-current {
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
}

.result-buttons {
  display: flex;
  gap: 15px;
}

.play-again, .exit-game {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
}

.play-again {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.exit-game {
  background: #f1f2f6;
  color: #333;
}

.play-again:hover, .exit-game:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

@keyframes countdownAnim {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .result-content {
    padding: 20px;
  }
  
  .result-stats {
    flex-direction: column;
  }
  
  .countdown {
    font-size: 6rem;
  }
  
  .intro-content {
    padding: 20px;
  }
  
  .start-btn {
    padding: 12px 25px;
  }
  
  .rank-header {
    padding: 10px 15px;
  }
  
  .timer {
    font-size: 1.2rem;
  }
  
  .map-toggle-container {
    bottom: 15px;
    right: 15px;
  }
  
  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
  }
}
</style> 