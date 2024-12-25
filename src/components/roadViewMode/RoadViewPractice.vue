<template>
  <div class="practice-game-container">
    <header class="game-header">
      <button @click="showExitConfirmation = true" class="icon-button">
        <i class="fas fa-door-open"></i> 나가기
      </button>
      <h1>연습 게임 [{{ selectedRegion }}]</h1>
    </header>

    <!-- 시작 안내 메시지에 나가기 버튼 추가 -->
    <transition name="slide-fade">
      <div v-if="showIntro" class="intro-overlay">
        <button
          @click="showExitConfirmation = true"
          class="icon-button intro-exit"
        >
          <i class="fas fa-door-open"></i>
        </button>
        <div class="intro-content">
          <!-- 기존 내용 유지 -->
        </div>
      </div>
    </transition>

    <!-- 카운트다운 -->
    <transition name="fade">
      <div v-if="showCountdown" class="countdown-overlay">
        <div class="countdown">{{ countdown }}</div>
      </div>
    </transition>

    <!-- 시작 안내 메시지 -->
    <transition name="slide-fade">
      <div v-if="showIntro" class="intro-overlay">
        <div class="intro-content">
          <h2>[{{ selectedRegion }}] 연습 모드를 시작합니다!</h2>
          <p>랜덤한 위치에서 시작하여 현재 위치를 맞춰보세요.</p>
          <p>지도를 보고 위치를 선택한 후 Spot 버튼을 눌러주세요.</p>
          <button @click="startGame" class="start-button">시작하기</button>
        </div>
      </div>
    </transition>

    <!-- 게임 화면 -->
    <div class="map-container" v-show="gameStarted">
      <div id="roadview" ref="roadviewElement"></div>
      <transition name="slide-up">
        <div
          id="map"
          ref="mapElement"
          v-show="isMapView"
          class="map-view"
        ></div>
      </transition>
    </div>

    <!-- 컨트롤 버튼 -->
    <div class="controls" v-show="gameStarted">
      <button @click="toggleMap" class="map-toggle-button">
        <i :class="isMapView ? 'fas fa-street-view' : 'fas fa-map'"></i>
      </button>
    </div>

    <!-- Spot 버튼 -->
    <transition name="fade">
      <div v-if="showSpotButton && isMapView" class="spot-button-container">
        <button @click="checkAnswer" class="spot-button">
          <i class="fas fa-crosshairs"></i> Spot!
        </button>
      </div>
    </transition>

    <!-- 결과 모달 수정 -->
    <transition name="fade">
      <div v-if="showResult" class="modal-overlay" @click.stop>
        <div class="modal-content result-modal" @click.stop>
          <h2>결과 확인</h2>
          <div class="result-map" ref="resultMapElement"></div>
          <div class="result-details">
            <div class="score-section">
              <div class="score-circle">
                <span class="score-number">{{ score }}</span>
                <span class="score-label">점</span>
              </div>
            </div>
            <div class="distance-section">
              <i class="fas fa-road"></i>
              <span>실제 위치까지 {{ distance.toFixed(2) }}km</span>
            </div>
          </div>
          <div class="modal-buttons">
            <button @click="restartGame" class="modal-button restart">
              <i class="fas fa-redo"></i> 다시 시작
            </button>
            <button @click="exitGame" class="modal-button exit">
              <i class="fas fa-door-open"></i> 나가기
            </button>
          </div>
        </div>
      </div>
    </transition>
    <!-- 나가기 확인 모달 -->
    <transition name="fade">
      <div
        v-if="showExitConfirmation"
        class="modal-overlay"
        @click="showExitConfirmation = false"
      >
        <div class="modal-content" @click.stop>
          <h2>게임을 종료하시겠습니까?</h2>
          <p>진행 중인 게임이 저장되지 않습니다</p>
          <div class="modal-buttons">
            <button @click="exitGame" class="modal-button confirm">
              종료하기
            </button>
            <button
              @click="showExitConfirmation = false"
              class="modal-button cancel"
            >
              계속하기
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script type="text/javascript">
export default {
  name: "PracticeGame",
  data() {
    return {
      isMapView: false,
      showSpotButton: false,
      showExitConfirmation: false,
      showResult: false,
      showIntro: true,
      showCountdown: false,
      gameStarted: false,
      countdown: 3,
      selectedRegion: "서울", // This should be passed as a prop
      distance: 0,
      score: 0,
      map: null,
      roadview: null,
      marker: null,
      // Dummy data for testing
      currentLocation: {
        lat: 33.480401,
        lng: 126.574667,
      },
    };
  },
  computed: {
    distancePercentage() {
      const maxDistance = 50; // km
      return Math.min((this.distance / maxDistance) * 100, 100);
    },
  },
  mounted() {
    this.loadNaverMapsAPI();
  },
  methods: {
    loadNaverMapsAPI() {
      if (window.naver && window.naver.maps) {
        this.initializeNaverMap();
      } else {
        const clientId = "px4m850civ"; // naver client id
        const script = document.createElement("script");
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=panorama`;
        script.onload = () => {
          this.initializeNaverMap();
        };
        document.head.appendChild(script);
      }
    },
    initializeNaverRoadview() {
      /* global naver */
      const roadviewContainer = this.$refs.roadviewElement;
      this.roadview = new naver.maps.Panorama(roadviewContainer, {
        position: new naver.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        ),
        pov: {
          pan: 0,
          tilt: 0,
          zoom: 0,
        },
        // 도로명 숨기기 설정
        showRoadLayer: false,
        showMarker: false,
        flightSpot: false,
        addressControl: false, // 주소명 표시 비활성화
        arrows: false // 화살표 비활성화
      });

      // 파노라마 위치 변경 이벤트
      naver.maps.Event.addListener(this.roadview, "pano_changed", () => {
        const position = this.roadview.getPosition();
        this.currentLocation.lat = position.lat();
        this.currentLocation.lng = position.lng();
      });
    },
    initializeNaverMap() {
      const mapContainer = this.$refs.mapElement;
      this.map = new naver.maps.Map(mapContainer, {
        center: new naver.maps.LatLng(38.950701, 121.9558),
        zoom: 7,
        mapTypeControl: false,
      });

      // 클릭 이벤트 리스너
      naver.maps.Event.addListener(this.map, "click", (e) => {
        const latlng = e.coord;
        if (this.marker) {
          this.marker.setPosition(latlng);
        } else {
          this.marker = new naver.maps.Marker({
            position: latlng,
            map: this.map,
          });
        }
        this.showSpotButton = true;
      });
    },
    startGame() {
      this.showIntro = false;
      this.showCountdown = true;

      const countdownInterval = setInterval(() => {
        this.countdown--;
        if (this.countdown === 0) {
          clearInterval(countdownInterval);
          this.showCountdown = false;
          this.gameStarted = true;
          this.initializeNaverRoadview();
        }
      }, 1000);
    },
    toggleMap() {
      this.isMapView = !this.isMapView;
      if (this.isMapView) {
        this.$nextTick(() => {
          this.map.relayout();
        });
      }
    },
    checkAnswer() {
      if (this.marker) {
        const markerPosition = this.marker.getPosition();
        const correctPosition = new naver.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        );

        // 거리 계산
        this.distance = this.calculateDistance(
          markerPosition.lat(),
          markerPosition.lng(),
          this.currentLocation.lat,
          this.currentLocation.lng
        );
        this.score = Math.max(100 - Math.floor(this.distance * 2), 0);

        // 결과 지도 초기화
        this.$nextTick(() => {
          const resultMapContainer = this.$refs.resultMapElement;
          const resultMap = new naver.maps.Map(resultMapContainer, {
            center: markerPosition,
            zoom: 11,
          });

          // 사용자 마커
          new naver.maps.Marker({
            position: markerPosition,
            map: resultMap,
            icon: {
              content:
                '<div style="background-color: #1EC800; width: 15px; height: 15px; border-radius: 50%;"></div>',
              anchor: new naver.maps.Point(7, 7),
            },
          });

          // 실제 위치 마커
          new naver.maps.Marker({
            position: correctPosition,
            map: resultMap,
            icon: {
              content:
                '<div style="background-color: #FF4757; width: 15px; height: 15px; border-radius: 50%;"></div>',
              anchor: new naver.maps.Point(7, 7),
            },
          });

          // 두 지점을 연결하는 선
          new naver.maps.Polyline({
            path: [markerPosition, correctPosition],
            strokeColor: "#5B9DFF",
            strokeOpacity: 0.7,
            strokeWeight: 3,
            map: resultMap,
          });

          // 지도 범위 재설정
          const bounds = this.getBounds([markerPosition, correctPosition]);
          resultMap.fitBounds(bounds);
        });

        this.showResult = true;
      }
    },
    restartGame() {
      this.showResult = false;
      this.showSpotButton = false;
      this.isMapView = false;
      if (this.marker) {
        this.marker.setMap(null);
        this.marker = null;
      }
      this.countdown = 3;
      this.showIntro = true;
      this.gameStarted = false;
    },
    exitGame() {
      this.$router.push("/game-modes"); // Adjust this route as needed
    },
    closeResult() {
      this.showResult = false;
    },
  },
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  },
  getBounds(positions) {
    const bounds = new naver.maps.LatLngBounds();
    positions.forEach((position) => bounds.extend(position));
    return bounds;
  },
};
</script>

<style scoped>
/* count down */

.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 40;
}

.countdown {
  font-size: 8rem;
  color: white;
  animation: pulse 1s infinite;
}

.practice-game-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 20;
}

.game-header h1 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
}

/* intro  */

.intro-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
}

.intro-content {
  text-align: center;
  padding: 2rem;
  border-radius: 15px;
  background-color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.intro-content h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.intro-content p {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.intro-exit {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 31;
}

.exit-modal {
  text-align: center;
  padding: 2rem;
}

.warning-icon {
  font-size: 3rem;
  color: #ff6b6b;
  margin-bottom: 1rem;
}

.exit-button {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
}

.start-button {
  background-color: #4cd964;
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1.5rem;
}

.start-button:hover {
  background-color: #3cb853;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(76, 217, 100, 0.3);
}

.exit-button:hover {
  color: #ff4757;
}

.map-container {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
}

.map-view {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  z-index: 10;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

#map {
  width: 100%;
  height: 100%;
}

.result-details {
  margin: 1.5rem 0;
}

.result-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.result-item i {
  color: #4cd964;
}

/* Animations */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.controls {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  z-index: 10;
}

.map-toggle-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #4cd964;
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.map-toggle-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.spot-button-container {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.spot-button {
  padding: 0.75rem 2rem;
  font-size: 1.2rem;
  background-color: #4cd964;
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.spot-button:hover {
  background-color: #3cb853;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(76, 217, 100, 0.3);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.exit-confirm-button,
.exit-cancel-button,
.restart-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exit-confirm-button {
  background-color: #ff4757;
  color: white;
}

.exit-cancel-button,
.restart-button {
  background-color: #4cd964;
  color: white;
}

.result-modal {
  max-width: 400px;
}

.distance-animation {
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  margin: 1rem 0;
}

.distance-bar {
  height: 100%;
  background-color: #4cd964;
  transition: width 1s ease-out;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* 로드뷰 */
#roadview {
  width: 100%;
  height: 100%;
}

/* 아이콘  */
.icon-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0.5rem;
}

.icon-button:hover {
  color: #2c3e50;
}

.modal-button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-button.confirm {
  background-color: #ff6b6b;
  color: white;
}

.modal-button.cancel {
  background-color: #e9ecef;
  color: #495057;
}

.modal-button.restart {
  background-color: #4cd964;
  color: white;
}

.modal-button.exit {
  background-color: #e9ecef;
  color: #495057;
}

.result-map {
  width: 100%;
  height: 300px;
  border-radius: 12px;
  margin: 1rem 0;
}

.score-section {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #4cd964;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
}

.score-number {
  font-size: 2rem;
  font-weight: bold;
}

.score-label {
  font-size: 1rem;
}

.distance-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #495057;
  font-size: 1.1rem;
  margin: 1rem 0;
}
</style>
