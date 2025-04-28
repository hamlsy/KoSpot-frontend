<!-- 로드뷰 연습 모드 컴포넌트 -->
<template>
  <div class="road-view-practice">
    <!-- 헤더 -->
    <div class="game-header">
      <button class="back-btn" @click="$refs.baseComponent.exitGame">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 v-if="!gameStarted">{{ selectedRegion }} 연습 모드</h2>
      <div v-else class="game-status">
        <!-- 연습 모드 힌트 -->
        <div class="hints">
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

    <!-- 기본 컴포넌트 -->
    <RoadViewBase 
      ref="baseComponent"
      :region="selectedRegion"
      @exit="$emit('exit')"
    >
      <!-- 힌트 버튼 슬롯 -->
      <template v-slot:phone-buttons>
        <button v-if="!$refs.baseComponent || !$refs.baseComponent.showResult" 
          class="phone-hint-button"
          @click="useHint"
          :disabled="!hintAvailable || hintsLeft <= 0"
        >
          <i class="fas fa-lightbulb"></i> 
          <span v-if="hintsLeft > 0 && !hintAvailable">{{ nextHintTime }}초 후 사용 가능</span>
          <span v-else>힌트 사용 ({{ hintsLeft }}/3)</span>
        </button>
      </template>

      <!-- 결과 화면 슬롯 -->
      <template v-slot:result-content>
        <div class="result-content">
          <h2>결과</h2>

          <!-- 결과 정보 -->
          <div class="result-info">
            <div class="info-item">
              <div class="info-icon"><i class="fas fa-ruler"></i></div>
              <div class="info-value">{{ distance ? distance.toFixed(2) : '0.00' }} km</div>
              <div class="info-label"> 떨어진 거리</div>
            </div>

            <div class="info-item">
              <div class="info-icon"><i class="fas fa-star"></i></div>
              <div class="info-value">{{ score }}</div>
              <div class="info-label"> 점수</div>
            </div>

            <div class="info-item">
              <div class="info-icon"><i class="fas fa-clock"></i></div>
              <div class="info-value">{{ formatTime(elapsedTime) }}</div>
              <div class="info-label">소요 시간</div>
            </div>
          </div>

          <!-- 결과 지도 -->
          <div class="result-map" ref="resultMapElement"></div>

          <!-- 결과 버튼 -->
          <div class="result-buttons">
            <button class="restart-btn" @click="nextRound">다시하기</button>
            <button class="exit-btn" @click="$refs.baseComponent.exitGame">종료하기</button>
          </div>
        </div>
      </template>
    </RoadViewBase>

    <!-- 로드뷰 화면 위에 표시되는 힌트 버튼 -->
    <button
      v-if="
        !isRankMode &&
        gameStarted &&
        !($refs.baseComponent && $refs.baseComponent.showResult) &&
        !($refs.baseComponent && $refs.baseComponent.isMapOpen) &&
        hintAvailable &&
        hintsLeft > 0
      "
      class="hint-btn"
      @click="useHint"
    >
      <i class="fas fa-lightbulb"></i>
      힌트 사용 ({{ hintsLeft }}/3)
    </button>
  </div>
</template>

<script>
import RoadViewBase from "./RoadViewBase.vue";

export default {
  name: "RoadViewPractice",
  components: {
    RoadViewBase
  },
  props: {
    region: {
      type: String,
      default: "서울",
    }
  },
  data() {
    return {
      // 게임 상태
      gameStarted: false,
      
      // 힌트 관련
      hintsLeft: 3,
      hintAvailable: true,
      nextHintTime: 30,
      hintTimer: null,
      hintCircle: null,
      hintRadius: 120000, // 초기 힌트 원 반경 (미터)
    };
  },
  computed: {
    selectedRegion() {
      return this.region;
    },
    // 기본 컴포넌트 데이터에 접근하기 위한 계산된 속성들
    distance() {
      return this.$refs.baseComponent ? this.$refs.baseComponent.distance : 0;
    },
    score() {
      return this.$refs.baseComponent ? this.$refs.baseComponent.score : 0;
    },
    elapsedTime() {
      return this.$refs.baseComponent ? this.$refs.baseComponent.elapsedTime : 0;
    }
  },
  watch: {
    // 게임 시작 감지
    '$refs.baseComponent.gameStarted'(newVal) {
      this.gameStarted = newVal;
      if (newVal) {
        this.resetHints();
      }
    }
  },
  mounted() {
    // 결과 지도 초기화
    this.$nextTick(() => {
      this.initResultMap();
    });
  },
  beforeDestroy() {
    if (this.hintTimer) {
      clearInterval(this.hintTimer);
    }
  },
  methods: {
    // 힌트 초기화
    resetHints() {
      this.hintsLeft = 3;
      this.hintAvailable = true;
      
      if (this.hintTimer) {
        clearInterval(this.hintTimer);
      }
    },
    
    // 힌트 사용
    useHint() {
      if (!this.hintAvailable || this.hintsLeft <= 0) return;
      
      this.hintsLeft--;
      this.hintAvailable = false;
      this.nextHintTime = 30;
      
      // 힌트 타이머 시작
      if (this.hintTimer) {
        clearInterval(this.hintTimer);
      }
      
      this.hintTimer = setInterval(() => {
        this.nextHintTime--;
        
        if (this.nextHintTime <= 0) {
          clearInterval(this.hintTimer);
          this.hintAvailable = true;
        }
      }, 1000);
      
      // 힌트 표시 (맵이 열려있는 경우)
      if (this.$refs.baseComponent && this.$refs.baseComponent.isMapOpen) {
        this.showHintOnMap();
      } else {
        // 맵이 닫혀있는 경우 맵 열기
        if (this.$refs.baseComponent) {
          this.$refs.baseComponent.isMapOpen = true;
          
          // 맵이 로드된 후 힌트 표시
          this.$nextTick(() => {
            setTimeout(() => {
              this.showHintOnMap();
            }, 500);
          });
        }
      }
    },
    
    // 맵에 힌트 표시
    showHintOnMap() {
      if (!this.$refs.baseComponent || !this.$refs.baseComponent.currentLocation) return;
      
      const mapInstance = this.$refs.baseComponent.$refs.phoneMapGame;
      if (!mapInstance || !mapInstance.map) return;
      
      // 기존 힌트 원 제거
      if (this.hintCircle) {
        this.hintCircle.setMap(null);
      }
      
      // 힌트 원 생성
      const currentLocation = this.$refs.baseComponent.currentLocation;
      const center = new kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);
      
      this.hintCircle = new kakao.maps.Circle({
        center: center,
        radius: this.hintRadius, // 반경 (미터)
        strokeWeight: 3,
        strokeColor: '#FFD700',
        strokeOpacity: 0.7,
        strokeStyle: 'dashed',
        fillColor: '#FFD700',
        fillOpacity: 0.3
      });
      
      // 힌트 원 지도에 표시
      this.hintCircle.setMap(mapInstance.map);
      
      // 힌트 원 중심으로 지도 이동
      mapInstance.map.setCenter(center);
      
      // 힌트 사용할 때마다 원 반경 감소
      this.hintRadius = Math.max(30000, this.hintRadius - 30000);
    },
    
    // 다음 라운드
    nextRound() {
      if (this.$refs.baseComponent) {
        this.$refs.baseComponent.nextRound();
      }
      this.resetHints();
    },
    
    // 결과 지도 초기화
    initResultMap() {
      // 결과 지도는 결과가 표시될 때 초기화
      this.$watch('$refs.baseComponent.showResult', (showResult) => {
        if (showResult && this.$refs.resultMapElement) {
          this.$nextTick(() => {
            this.showResultMap();
          });
        }
      });
    },
    
    // 결과 지도 표시
    showResultMap() {
      if (!this.$refs.baseComponent) return;
      
      const actualLocation = this.$refs.baseComponent.currentLocation;
      const guessedLocation = this.$refs.baseComponent.guessedLocation;
      
      if (!actualLocation || !guessedLocation || !this.$refs.resultMapElement) return;
      
      // 지도 생성
      const mapContainer = this.$refs.resultMapElement;
      const mapOption = {
        center: new kakao.maps.LatLng(
          (actualLocation.lat + guessedLocation.lat) / 2,
          (actualLocation.lng + guessedLocation.lng) / 2
        ),
        level: 7,
        draggable: false,
        zoomable: false
      };
      
      const map = new kakao.maps.Map(mapContainer, mapOption);
      
      // 실제 위치 마커
      const actualMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(actualLocation.lat, actualLocation.lng),
        map: map
      });
      
      // 실제 위치 인포윈도우
      const actualInfo = new kakao.maps.InfoWindow({
        content: '<div style="padding:5px;font-size:12px;color:#3498db;">실제 위치</div>',
        position: new kakao.maps.LatLng(actualLocation.lat, actualLocation.lng)
      });
      
      actualInfo.open(map, actualMarker);
      
      // 추측 위치 마커
      const guessedMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(guessedLocation.lat, guessedLocation.lng),
        map: map
      });
      
      // 추측 위치 인포윈도우
      const guessedInfo = new kakao.maps.InfoWindow({
        content: '<div style="padding:5px;font-size:12px;color:#e74c3c;">추측 위치</div>',
        position: new kakao.maps.LatLng(guessedLocation.lat, guessedLocation.lng)
      });
      
      guessedInfo.open(map, guessedMarker);
      
      // 두 위치를 연결하는 선
      const linePath = [
        new kakao.maps.LatLng(actualLocation.lat, actualLocation.lng),
        new kakao.maps.LatLng(guessedLocation.lat, guessedLocation.lng)
      ];
      
      const polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 3,
        strokeColor: '#e74c3c',
        strokeOpacity: 0.7,
        strokeStyle: 'dashed'
      });
      
      polyline.setMap(map);
      
      // 지도 범위 설정
      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(new kakao.maps.LatLng(actualLocation.lat, actualLocation.lng));
      bounds.extend(new kakao.maps.LatLng(guessedLocation.lat, guessedLocation.lng));
      
      map.setBounds(bounds);
    },
    
    // 시간 포맷 변환 (초 -> MM:SS)
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.road-view-practice {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
}

.game-header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #2c3e50;
  color: white;
  position: relative;
  z-index: 10;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  margin-right: 15px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.game-header h2 {
  margin: 0;
  font-size: 1.5rem;
  flex: 1;
}

.game-status {
  display: flex;
  align-items: center;
  margin-left: auto;
}

/* 힌트 표시 */
.hints {
  display: flex;
  align-items: center;
  position: relative;
}

.hint-indicator {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: rgba(255, 255, 255, 0.5);
}

.hint-indicator.active {
  background-color: #f39c12;
  color: white;
}

.hint-timer {
  margin-left: 10px;
  font-size: 0.9rem;
  color: #f39c12;
  font-weight: bold;
}

/* 힌트 버튼 */
.hint-btn {
  position: absolute;
  bottom: 80px;
  right: 20px;
  background: linear-gradient(135deg, #f39c12, #e67e22);
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

.hint-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #e67e22, #d35400);
}

.hint-btn i {
  font-size: 1rem;
}

/* 휴대폰 내부 힌트 버튼 */
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

/* 결과 화면 */
.result-content {
  background-color: white;
  border-radius: 15px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.result-content h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 2rem;
}

.result-info {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.info-icon {
  font-size: 1.5rem;
  color: #3498db;
}

.info-value {
  font-size: 1.7rem;
  font-weight: bold;
  color: #2ecc71;
}

.info-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: 5px;
}

.result-map {
  width: 100%;
  height: 300px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.result-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.result-buttons button {
  padding: 12px 24px;
  border-radius: 30px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.restart-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.4);
}

.exit-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.exit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(231, 76, 60, 0.4);
}
</style>
