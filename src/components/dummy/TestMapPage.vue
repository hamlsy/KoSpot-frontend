<template>
  <div class="practice-game-container">
    <header class="game-header">
      <button @click="showExitConfirmation = true" class="icon-button">
        <i class="fas fa-door-open"></i> 나가기
      </button>
      <h1>연습 게임 [{{ selectedRegion }}]</h1>
    </header>

    <!-- 게임 화면 -->
    <div class="map-container">
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

    <!-- 결과 모달 -->
    <transition name="fade">
      <div v-if="showResult" class="modal-overlay" @click.stop>
        <div class="modal-content result-modal" @click.stop>
          <div class="score-section">
            <div class="score-circle">
              <span class="score-number">{{ score }}</span>
              <span class="score-label">점</span>
            </div>
          </div>
          <div class="result-map" ref="resultMapElement"></div>
          <div class="result-details">
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
      gameStarted: true,
      countdown: 3,
      selectedRegion: "서울", // This should be passed as a prop
      distance: 0,
      score: 0,
      map: null,
      roadview: null,
      marker: null,
      isMapInitialized: false,
      isRoadviewInitialized: false,
      answerMarker: null,
      answerAddress: "",
      geocoder: null,
      // Dummy data for testing
      currentLocation: {
        lat: 33.480401,
        lng: 126.574667,
      },
      centerLocation: {
        lat: 36.480401,
        lng: 127.574667,
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
    if (window.kakao && window.kakao.maps) {
      this.initializeKakaoRoadview();
    } else {
      this.loadKakaoMapsAPI();
    }
  },
  methods: {
    initializeKakaoRoadview() {
      if (!this.isRoadviewInitialized) {
        console.log("Initializing Kakao Roadview...");
        var roadviewContainer = this.$refs.roadviewElement;
        this.roadview = new kakao.maps.Roadview(roadviewContainer);
        var roadviewClient = new kakao.maps.RoadviewClient();

        var position = new kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        );

        const findPanoId = (distance) => {
          roadviewClient.getNearestPanoId(position, distance, (panoId) => {
            if (panoId) {
              this.roadview.setPanoId(panoId, position);
              this.isRoadviewInitialized = true;
            } else {
              findPanoId(distance + 10);
            }
          });
        };
        // 초기 값
        findPanoId(30);
      }
      this.$refs.roadviewElement.style.display = "block";
      this.$refs.mapElement.style.display = "none";
    },
    loadKakaoMapsAPI() {
      console.log("Loading Kakao Maps API...");
      // const clientId = "px4m850civ"; // naver client id
      const appKey = "c66fbf360458039285570a638bad813a";
      const script = document.createElement("script");
      // script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=panorama`;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services,clusterer,drawing,geometry&autoload=false`;

      script.onload = () => {
        window.kakao.maps.load(() => {
          console.log("Kakao Maps API loaded.");
          this.initializeKakaoRoadview();
        });
      };

      script.onerror = () => {
        console.error("Failed to load Kakao Maps API.");
      };
      document.head.appendChild(script);
    },
    initializeKakaoMap() {
      if (!this.isMapInitialized) {
        var mapContainer = this.$refs.mapElement;
        var mapOption = {
          center: new kakao.maps.LatLng(
            this.centerLocation.lat,
            this.centerLocation.lng
          ),
          level: 13,
          maxLevel: 12, // 최대 축소 레벨 설정
        };
        this.map = new kakao.maps.Map(mapContainer, mapOption);
        // 지도가 로드된 후에 relayout 호출
        setTimeout(() => {
          this.map.relayout();
          this.map.setCenter(
            new kakao.maps.LatLng(
              this.centerLocation.lat,
              this.centerLocation.lng
            )
          );
        }, 0);

        kakao.maps.event.addListener(this.map, "click", (mouseEvent) => {
          const latlng = mouseEvent.latLng;
          if (this.marker) {
            this.marker.setPosition(latlng);
          } else {
            this.marker = new kakao.maps.Marker({
              position: latlng,
              map: this.map,
            });
          }
          this.showSpotButton = true;
        });

        this.isMapInitialized = true;
      }
      this.$refs.mapElement.style.display = "block";
      this.$refs.roadviewElement.style.display = "none";
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
          this.initializeKakaoRoadview();
        }
      }, 1000);
    },
    toggleMap() {
      this.isMapView = !this.isMapView;
      if (this.isMapView) {
        this.initializeKakaoMap();
      } else {
        this.initializeKakaoRoadview();
      }
    },
    async checkAnswer() {
      if (this.marker) {
        const markerPosition = this.marker.getPosition();
        const correctPosition = new kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        );
        this.showResult = true;
        // Polyline을 사용하여 두 좌표 간의 거리 계산
        const linePath = [markerPosition, correctPosition];
        const polyline = new kakao.maps.Polyline({
          path: linePath,
        });
        this.distance = polyline.getLength() / 1000; // 거리 계산 (미터 단위에서 킬로미터 단위로 변환)
        this.score = Math.max(100 - Math.floor(this.distance * 2), 0);

        // 결과 지도 초기화
        this.$nextTick(() => {
          const resultMapContainer = this.$refs.resultMapElement;
          if (!resultMapContainer) {
            alert("resultMapContainer is null");
          }
          console.log(resultMapContainer);
          const resultMap = new kakao.maps.Map(resultMapContainer, {
            center: markerPosition,
            level: 7,
          });
          // 사용자 마커
          new kakao.maps.Marker({
            position: markerPosition,
            map: resultMap,
            title: "선택한 위치",
          });
          // 실제 위치 마커
          new kakao.maps.Marker({
            position: correctPosition,
            map: resultMap,
            title: "실제 위치",
            image: new kakao.maps.MarkerImage(
              require("@/assets/correctLocation.png"),
              new kakao.maps.Size(33, 35)
            ),
          });
          // error line 1
          // 선 그리기
          const linePath = [markerPosition, correctPosition];
          const polyline = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 3,
            strokeColor: "#5B9DFF",
            strokeOpacity: 0.7,
            strokeStyle: "solid",
          });

          polyline.setMap(resultMap);

          // 지도 범위 재설정
          const bounds = new kakao.maps.LatLngBounds();
          bounds.extend(markerPosition);
          bounds.extend(correctPosition);
          resultMap.setBounds(bounds);
        });
      }
    },

    restartGame() {
      this.$router.go(0);
    },
    exitGame() {
      this.$router.push("/roadViewModeMain"); // Adjust this route as needed
    },
    closeResult() {
      this.showResult = false;
    },
  },
};
</script>

<style scoped>
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}
.practice-game-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.warning-icon {
  font-size: 3rem;
  color: #ff6b6b;
  margin-bottom: 1rem;
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
  right: 4rem;
  z-index: 10;
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
#roadview,
#map {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
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

.map-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* 반응형 */
@media (max-width: 768px) {
  .map-container {
    height: calc(100vh - 50px);
  }

  .result-modal {
    padding: 0.5rem;
    max-height: 80%;
  }

  .controls {
    bottom: 1rem;
    right: 3.5rem;
  }

  .map-toggle-button {
    width: 75px;
    height: 75px;
    font-size: 1.8rem;
  }

  .spot-button {
    padding: 0.5rem 1.5rem;
    font-size: 1rem;
  }

  .score-circle {
    width: 80px;
    height: 80px;
  }

  .score-number {
    font-size: 1.5rem;
  }
}
</style>
