<template>
  <div class="result-map-section" :class="{ 'is-expanded': isExpanded }">
    <div class="result-map-container">
      <div class="result-map" ref="resultMapElement"></div>
      
      <!-- 확대/축소 토글 버튼 -->
      <button 
        class="map-expand-btn" 
        @click.stop="$emit('toggle-expand')"
        title="지도 크게 보기"
      >
        <i :class="isExpanded ? 'fas fa-compress-arrows-alt' : 'fas fa-expand-arrows-alt'"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { getUserMarkerSize, getResultMarkerSize } from '@/core/constants/markerSizes.js';

export default {
  name: "ResultMapSection",
  emits: ["toggle-expand"],
  data() {
    return {
      mapInstance: null,
      bounds: null,
    };
  },
  props: {
    isExpanded: {
      type: Boolean,
      default: false,
    },
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
    markerImageUrl: {
      type: String,
      default: null,
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initResultMap();
    });
  },
  watch: {
    isExpanded(newVal) {
      this.$nextTick(() => {
        if (this.mapInstance) {
          // 컨테이너 크기 변경 후 카카오맵 relayout 호출
          this.mapInstance.relayout();
          
          // 축척 및 중심점 재설정
          if (this.bounds) {
            // expanded 상태일 때 타이머를 약간 줘서 CSS 트랜지션 완료 후 다시 맞추기 (옵션)
            setTimeout(() => {
              this.mapInstance.relayout();
              this.mapInstance.setBounds(this.bounds);
            }, 300); // 300ms is typical CSS transition duration
          } else {
            this.mapInstance.setCenter(
              new window.kakao.maps.LatLng(
                this.currentLocation.lat,
                this.currentLocation.lng
              )
            );
          }
        }
      });
    }
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
      this.mapInstance = new window.kakao.maps.Map(mapElement, {
        center: new window.kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        ),
        level: 5,
      });

      const resultMap = this.mapInstance;

      // 실제 위치 마커 (location-flag.png 사용)
      const realLocationImage = new window.kakao.maps.MarkerImage(
        require('@/shared/assets/images/marker/location-flag.png'),
        getResultMarkerSize(window.kakao)
      );
      
      const actualMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        ),
        map: resultMap,
        image: realLocationImage,
        title: "실제 위치",
        zIndex: 10
      });

      // 실제 위치 커스텀 오버레이 생성
      const actualOverlayContent = `
        <div class="custom-player-overlay" style="background: linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%); border: 2px solid #86efac; padding: 6px 10px; border-radius: 8px; min-width: 120px; max-width: 180px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);">
          <div class="overlay-content" style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 0.75rem; padding-bottom: 4px; border-bottom: 1px solid #86efac; color: #065f46;">
              <i class="fas fa-map-marker-alt" style="font-size: 0.8rem; color: #059669;"></i>
              <span>실제 위치</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 3px;">
              <div style="font-size: 0.65rem; color: #64748b; font-family: 'Courier New', monospace;">${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lng.toFixed(4)}</div>
              ${this.locationDescription ? `<div style="font-size: 0.65rem; color: #64748b; font-style: italic; line-height: 1.3; margin-top: 1px;">${this.locationDescription}</div>` : ''}
            </div>
          </div>
          <div class="overlay-arrow" style="border-top-color: #d1fae5; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #d1fae5; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));"></div>
        </div>
      `;

      const actualOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(
          this.currentLocation.lat,
          this.currentLocation.lng
        ),
        content: actualOverlayContent,
        yAnchor: 1.6,
        zIndex: 10
      });

      actualOverlay.setMap(resultMap);

      // 사용자가 선택한 위치 마커 (장착한 마커 이미지 사용)
      if (this.guessedLocation) {
        let guessedMarker;
        
        if (this.markerImageUrl) {
          // 사용자가 장착한 마커 이미지가 있는 경우
          const userMarkerImage = new window.kakao.maps.MarkerImage(
            this.markerImageUrl,
            getUserMarkerSize(window.kakao)
          );
          guessedMarker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(
              this.guessedLocation.lat,
              this.guessedLocation.lng
            ),
            map: resultMap,
            image: userMarkerImage,
            title: "선택한 위치",
            zIndex: 5
          });
        } else {
          // 기본 마커 사용
          guessedMarker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(
              this.guessedLocation.lat,
              this.guessedLocation.lng
            ),
            map: resultMap,
            title: "선택한 위치",
            zIndex: 5
          });
        }

        // 선택한 위치 커스텀 오버레이 생성
        const guessedOverlayContent = `
          <div class="custom-player-overlay" style="background: linear-gradient(135deg, #fecaca 0%, #fee2e2 100%); border: 2px solid #fca5a5; padding: 6px 10px; border-radius: 8px; min-width: 120px; max-width: 180px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);">
            <div class="overlay-content" style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 0.75rem; padding-bottom: 4px; border-bottom: 1px solid #fca5a5; color: #991b1b;">
                <i class="fas fa-map-pin" style="font-size: 0.8rem; color: #dc2626;"></i>
                <span>선택한 위치</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <div style="font-size: 0.65rem; color: #64748b; font-family: 'Courier New', monospace;">${this.guessedLocation.lat.toFixed(4)}, ${this.guessedLocation.lng.toFixed(4)}</div>
              </div>
            </div>
            <div class="overlay-arrow" style="border-top-color: #fecaca; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #fecaca; filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));"></div>
          </div>
        `;

        const guessedOverlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(
            this.guessedLocation.lat,
            this.guessedLocation.lng
          ),
          content: guessedOverlayContent,
          yAnchor: 1.6,
          zIndex: 5
        });

        guessedOverlay.setMap(resultMap);

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
        this.bounds = bounds;
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
  gap: 15px;
}

.result-map-container {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  position: relative;
  transition: height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.result-map {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
}

/* ═══════════════════════════════════════
   확대/축소 버튼
═══════════════════════════════════════ */
.map-expand-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  color: #374151;
  font-size: 1rem;
}

.map-expand-btn:hover {
  background: #ffffff;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: #111827;
}

.map-expand-btn:active {
  transform: scale(0.95);
}

/* ═══════════════════════════════════════
   Expanded State (부모에서 주입됨)
═══════════════════════════════════════ */
.is-expanded .result-map-container {
  height: 100%;
  border-radius: 16px;
}

@media (max-width: 480px) {
  .result-map-container {
    height: 180px;
  }
}
</style>
