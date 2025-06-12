<template>
  <div class="result-map-section">
    <div class="result-map-container">
      <div class="result-map" ref="resultMapElement"></div>
    </div>

    <div class="location-info">
      <div class="location-cards">
        <div class="actual-location">
          <div class="location-header">
            <i class="fas fa-map-marker-alt location-icon"></i>
            <h3>실제 위치</h3>
          </div>
          <div class="location-content">
            <p class="address">{{ currentLocation ? currentLocation.address : "알 수 없음" }}</p>
            <div class="coordinates">
              <i class="fas fa-crosshairs"></i>
              {{
                currentLocation
                  ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`
                  : ""
              }}
            </div>
            <div class="location-description">
              {{ locationDescription }}
            </div>
          </div>
        </div>

        <div class="guessed-location">
          <div class="location-header">
            <i class="fas fa-map-pin location-icon"></i>
            <h3>선택한 위치</h3>
          </div>
          <div class="location-content">
            <p class="address">{{ guessedLocation ? guessedLocation.address : "선택하지 않음" }}</p>
            <div class="coordinates" v-if="guessedLocation">
              <i class="fas fa-crosshairs"></i>
              {{
                guessedLocation
                  ? `${guessedLocation.lat.toFixed(6)}, ${guessedLocation.lng.toFixed(6)}`
                  : ""
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ResultMapSection",
  props: {
    currentLocation: {
      type: Object,
      default: null,
    },
    guessedLocation: {
      type: Object,
      default: null,
    },
    locationDescription: {
      type: String,
      default: "",
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initResultMap();
    });
  },
  methods: {
    // 결과 지도 초기화
    initResultMap() {
      if (!this.currentLocation || !window.kakao || !window.kakao.maps) {
        console.error("지도 API가 로드되지 않았거나 위치 정보가 없습니다.");
        return;
      }

      // 결과 지도 요소 가져오기
      const mapElement = this.$refs.resultMapElement;
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

      // 실제 위치 마커 (별 모양 아이콘)
      const realLocationImage = new window.kakao.maps.MarkerImage(
        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
        new window.kakao.maps.Size(24, 35)
      );
      
      new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        ),
        map: resultMap,
        image: realLocationImage,
        title: "실제 위치"
      });

      // 사용자가 선택한 위치 마커 (기본 마커)
      if (this.guessedLocation) {
        new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(
            this.guessedLocation.lat,
            this.guessedLocation.lng
          ),
          map: resultMap,
          title: "선택한 위치"
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
          strokeColor: "#5B9DFF",
          strokeOpacity: 0.8,
          strokeStyle: "solid",
        });

        polyline.setMap(resultMap);
      }
    },
  },
};
</script>

<style scoped>
.result-map-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 애니메이션 제거 */

.result-map-container {
  width: 100%;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  position: relative;
}

/* 호버 효과 제거 */

.result-map {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.location-cards {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

@media (min-width: 768px) {
  .location-cards {
    flex-direction: row;
  }
  
  .actual-location,
  .guessed-location {
    flex: 1;
  }
}

.actual-location,
.guessed-location {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 호버 효과 제거 */

.location-header {
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.actual-location .location-header {
  background: #43cea2;
  color: white;
}

.guessed-location .location-header {
  background: #3949AB;
  color: white;
}

.location-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.location-icon {
  font-size: 1.2rem;
}

.location-content {
  padding: 15px;
  background-color: white;
}

.address {
  font-size: 0.95rem;
  margin: 0 0 8px 0;
  color: #333;
  font-weight: 500;
}

.coordinates {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 8px;
}

.location-description {
  margin-top: 10px;
  font-style: italic;
  color: #555;
  font-size: 0.85rem;
  line-height: 1.5;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}

@media (max-width: 480px) {
  .result-map-container {
    height: 180px;
  }
}
</style>
