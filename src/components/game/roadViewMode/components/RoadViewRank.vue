<!-- 로드뷰 랭크 모드 컴포넌트 -->
<template>
  <div class="road-view-rank">
    <!-- 헤더 -->
    <div class="game-header">
      <button class="back-btn" @click="$refs.baseComponent.exitGame">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2 v-if="!gameStarted">{{ selectedRegion }} 랭크 모드</h2>
      <div v-else class="game-status">
        <!-- 랭크 모드 타이머 -->
        <div
          class="timer"
          :class="{ warning: timeRemaining <= 30 }"
        >
          <i class="fas fa-clock"></i>
          <span>{{ formatTime(timeRemaining) }}</span>
        </div>
      </div>
    </div>

    <!-- 기본 컴포넌트 -->
    <RoadViewBase 
      ref="baseComponent"
      :region="selectedRegion"
      @exit="$emit('exit')"
    >
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

          <!-- 랭크 점수 변화 -->
          <div class="rank-change">
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
            <div class="rank-badge">
              <img :src="getRankBadgeImage()" alt="랭크 배지" class="rank-badge-img">
              <div class="rank-name">{{ rankName }}</div>
            </div>
          </div>

          <!-- 결과 버튼 -->
          <div class="result-buttons">
            <button class="restart-btn" @click="nextRound">다시하기</button>
            <button class="exit-btn" @click="$refs.baseComponent.exitGame">종료하기</button>
          </div>
        </div>
      </template>
    </RoadViewBase>
  </div>
</template>

<script>
import RoadViewBase from "./RoadViewBase.vue";

export default {
  name: "RoadViewRank",
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
      
      // 랭크 모드 관련
      timeRemaining: 180, // 3분(초 단위)
      timerInterval: null,
      currentRankPoints: 1500, // 예시 값
      rankPointChange: 0,
      rankName: "골드",
      
      // 랭크 티어 정보
      rankTiers: [
        { name: "브론즈", minPoints: 0, maxPoints: 999, image: "/images/ranks/bronze.png" },
        { name: "실버", minPoints: 1000, maxPoints: 1499, image: "/images/ranks/silver.png" },
        { name: "골드", minPoints: 1500, maxPoints: 1999, image: "/images/ranks/gold.png" },
        { name: "플래티넘", minPoints: 2000, maxPoints: 2499, image: "/images/ranks/platinum.png" },
        { name: "다이아몬드", minPoints: 2500, maxPoints: 2999, image: "/images/ranks/diamond.png" },
        { name: "마스터", minPoints: 3000, maxPoints: Infinity, image: "/images/ranks/master.png" }
      ]
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
        this.startRankTimer();
      } else {
        this.stopRankTimer();
      }
    },
    // 결과 화면 감지
    '$refs.baseComponent.showResult'(newVal) {
      if (newVal) {
        this.stopRankTimer();
        this.calculateRankPoints();
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
    this.stopRankTimer();
  },
  methods: {
    // 랭크 타이머 시작
    startRankTimer() {
      this.timeRemaining = 180; // 3분 리셋
      
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      
      this.timerInterval = setInterval(() => {
        this.timeRemaining--;
        
        if (this.timeRemaining <= 0) {
          // 시간 종료, 자동으로 현재 위치에서 가장 멀리 떨어진 곳으로 추측 위치 설정
          this.timeExpired();
        }
      }, 1000);
    },
    
    // 랭크 타이머 정지
    stopRankTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },
    
    // 시간 만료 처리
    timeExpired() {
      this.stopRankTimer();
      
      // 기본 컴포넌트가 없으면 종료
      if (!this.$refs.baseComponent) return;
      
      // 현재 위치가 없으면 종료
      if (!this.$refs.baseComponent.currentLocation) return;
      
      // 현재 위치에서 가장 멀리 떨어진 위치 계산
      const currentLat = this.$refs.baseComponent.currentLocation.lat;
      const currentLng = this.$refs.baseComponent.currentLocation.lng;
      
      // 한반도 반대쪽 끝으로 설정 (예시)
      const farthestLocation = {
        lat: currentLat > 36 ? 33.5 : 38.5,
        lng: currentLng > 128 ? 126.5 : 129.5
      };
      
      // 추측 위치 설정
      this.$refs.baseComponent.guessedLocation = farthestLocation;
      
      // 결과 계산 및 표시
      if (this.$refs.baseComponent.checkSpotAnswer) {
        this.$refs.baseComponent.checkSpotAnswer();
      }
    },
    
    // 랭크 포인트 계산
    calculateRankPoints() {
      // 거리와 점수에 따른 랭크 포인트 변화 계산 (예시 로직)
      if (this.distance === null || this.score === null) return;
      
      // 기본 점수 변화: 점수에 비례
      let pointChange = Math.floor(this.score / 100);
      
      // 거리에 따른 보정
      if (this.distance < 1) {
        // 1km 미만은 보너스
        pointChange += 20;
      } else if (this.distance > 50) {
        // 50km 초과는 패널티
        pointChange -= 10;
      }
      
      // 시간에 따른 보정
      if (this.elapsedTime < 60) {
        // 1분 미만은 보너스
        pointChange += 5;
      }
      
      // 최종 포인트 변화 (최소 -30, 최대 50)
      this.rankPointChange = Math.max(-30, Math.min(50, pointChange));
      
      // 현재 랭크 포인트 업데이트
      this.currentRankPoints += this.rankPointChange;
      this.currentRankPoints = Math.max(0, this.currentRankPoints); // 최소 0
      
      // 랭크 이름 업데이트
      this.updateRankName();
    },
    
    // 랭크 이름 업데이트
    updateRankName() {
      for (const tier of this.rankTiers) {
        if (this.currentRankPoints >= tier.minPoints && this.currentRankPoints <= tier.maxPoints) {
          this.rankName = tier.name;
          break;
        }
      }
    },
    
    // 랭크 배지 이미지 가져오기
    getRankBadgeImage() {
      const tier = this.rankTiers.find(tier => 
        this.currentRankPoints >= tier.minPoints && this.currentRankPoints <= tier.maxPoints
      );
      
      return tier ? tier.image : this.rankTiers[0].image;
    },
    
    // 다음 라운드
    nextRound() {
      if (this.$refs.baseComponent) {
        this.$refs.baseComponent.nextRound();
      }
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
.road-view-rank {
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
  background-color: #1e3a8a; /* 더 진한 파란색으로 랭크모드 구분 */
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

/* 타이머 */
.timer {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.1rem;
}

.timer i {
  margin-right: 8px;
}

.timer.warning {
  background-color: rgba(231, 76, 60, 0.8);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
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
  color: #1e3a8a; /* 랭크모드 색상 */
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
  color: #1e3a8a; /* 랭크모드 색상 */
}

.info-value {
  font-size: 1.7rem;
  font-weight: bold;
  color: #1e3a8a; /* 랭크모드 색상 */
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

/* 랭크 변화 표시 */
.rank-change {
  background-color: #f8fafc;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rank-icon {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.rank-value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.rank-value.positive {
  color: #2ecc71;
}

.rank-value.negative {
  color: #e74c3c;
}

.rank-current {
  font-size: 1.2rem;
  color: #34495e;
  margin-bottom: 15px;
}

.rank-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rank-badge-img {
  width: 80px;
  height: 80px;
  margin-bottom: 5px;
}

.rank-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #1e3a8a;
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
  background: linear-gradient(135deg, #1e3a8a, #1e40af); /* 랭크모드 색상 */
  color: white;
}

.restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(30, 58, 138, 0.4);
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
