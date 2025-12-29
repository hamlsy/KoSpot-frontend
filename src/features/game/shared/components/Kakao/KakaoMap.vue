<template>
  <div class="kakao-map">
    <div id="map-container" ref="mapContainer"></div>
    
    <div class="map-overlay" v-if="isLoading">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>지도 로딩 중...</p>
      </div>
    </div>
    
    <div class="markers-container" v-if="showMarkerHint && !marker && !preventInteraction">
      <div class="marker-hint">
        <i class="fas fa-map-marker-alt"></i>
        <span>지도를 클릭하여 위치를 선택하세요</span>
      </div>
    </div>
  </div>
</template>

<script>
import colors from 'src/core/constants/colors.js'
import { getUserMarkerSize, getResultMarkerSize } from '@/core/constants/markerSizes.js';

export default {
  name: 'KakaoMap',
  
  props: {
    center: {
      type: Object,
      required: true,
      validator: prop => Object.prototype.hasOwnProperty.call(prop, 'lat') && Object.prototype.hasOwnProperty.call(prop, 'lng')
    },
    markerPosition: {
      type: Object,
      default: null
    },
    actualPosition: {
      type: Object,
      default: null
    },
    preventInteraction: {
      type: Boolean,
      default: false
    },
    showMarkerHint: {
      type: Boolean,
      default: true
    },
    zoomLevel: {
      type: Number,
      default: 7
    },
    playerGuesses: {
      type: Array,
      default: () => []
    },
    showDistanceLines: {
      type: Boolean,
      default: false
    },
    fitAllMarkers: {
      type: Boolean,
      default: false
    },
    topPlayer: {
      type: Object,
      default: null
    },
    isTeamMode: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      map: null,
      marker: null,
      actualMarker: null,
      actualOverlay: null, // 정답 위치 오버레이 추가
      polyline: null,
      isLoading: true,
      // prop 대신 내부 상태로 관리
      internalMarkerPosition: this.markerPosition,
      distance: null,
      playerMarkers: [],
      distanceLines: [],
      distanceOverlays: []
    };
  },
  
  watch: {
    center(newVal) {
      if (this.map && newVal) {
        const newCenter = new kakao.maps.LatLng(newVal.lat, newVal.lng);
        this.map.setCenter(newCenter);
      }
    },
    
    markerPosition: {
      handler(newVal) {
        // 내부 상태 업데이트
        this.internalMarkerPosition = newVal;
        
        if (newVal) {
          this.setMarker(newVal);
        } else if (this.marker) {
          this.marker.setMap(null);
          this.marker = null;
        }
      },
      immediate: true
    },
    
    actualPosition(newVal) {
      if (newVal) {
        this.showActualPosition(newVal);
        // 실제 위치가 설정되면 플레이어 마커도 함께 표시
        if (this.playerGuesses && this.playerGuesses.length > 0) {
          // this.showPlayerGuesses(this.playerGuesses);
        }
      } else if (this.actualMarker) {
        this.actualMarker.setMap(null);
        this.actualMarker = null;
      }
    },
    
    playerGuesses(newVal) {
      if (newVal && newVal.length > 0 && this.actualPosition) {
        this.showPlayerGuesses(newVal);
      }
    }
  },
  
  mounted() {
    this.initMap();
  },
  
  beforeUnmount() {
    // 리소스 정리
    // 실제 구현에서는 이벤트 리스너 정리 등의 작업 수행
  },
  
  methods: {
    // 사용자 마커 추가 함수
    addUserMarker(position) {
      if (!this.map) return;
      
      const markerPosition = new kakao.maps.LatLng(position.lat, position.lng);
      
      // 기존 마커가 있으면 제거
      if (this.marker) {
        this.marker.setMap(null);
      }
      
      // 새 마커 생성
      this.marker = new kakao.maps.Marker({
        position: markerPosition,
        map: this.map
      });
      
      // 마커 위치 업데이트 (내부 상태로 관리)
      this.internalMarkerPosition = position;
      // 위치 변경 이벤트 발생
      this.$emit('update:markerPosition', position);
      
      // 실제 위치가 있으면 거리 계산 및 선 그리기
      if (this.actualPosition) {
        this.calculateDistance();
        this.drawLine();
      }
    },
    
    // 마커 설정 함수 (이전 코드와의 호환성을 위해 유지)
    setMarker(position) {
      this.addUserMarker(position);
    },
    
    initMap() {
      if (window.kakao && window.kakao.maps) {
        const container = this.$refs.mapContainer;
        const options = {
          center: new kakao.maps.LatLng(this.center.lat, this.center.lng),
          level: this.zoomLevel
        };
        
        // 지도 객체 생성
        this.map = new kakao.maps.Map(container, options);
        
        // 지도 타일 로드 완료 시 로딩 상태 변경
        kakao.maps.event.addListener(this.map, 'tilesloaded', () => {
          this.isLoading = false;
        });
        
        // 지도 확대/축소 시 깜빡임 방지를 위한 처리
        kakao.maps.event.addListener(this.map, 'zoom_changed', () => {
          // 지도 타일이 완전히 로드된 후 relayout 호출
          setTimeout(() => {
            this.map.relayout();
          }, 100);
        });
        
        // 마커 위치가 이미 있으면 설정
        if (this.markerPosition) {
          this.setMarker(this.markerPosition);
        }
        // 실제 위치가 이미 있으면 표시
        if (this.actualPosition) {
          this.showActualPosition(this.actualPosition);
        }
        
        // 플레이어 추측 위치가 있으면 표시
        if (this.playerGuesses && this.playerGuesses.length > 0) {
          this.showPlayerGuesses(this.playerGuesses);
        }
        
        // 지도 클릭 이벤트
        if (!this.preventInteraction) {
          kakao.maps.event.addListener(this.map, 'click', (mouseEvent) => {
            const latlng = mouseEvent.latLng;
            const position = {
              lat: latlng.getLat(),
              lng: latlng.getLng()
            };
            
            // 결과 화면에서는 마커를 추가하지 않고 이벤트만 발생
            if (this.actualPosition) {
              // 결과 화면에서는 클릭 무시
              return;
            }
            
            // 게임 플레이 중에만 마커 추가
            this.addUserMarker(position);
            this.$emit('spot-answer', position);
          });
        }
        
        // 지도 컨트롤 추가
        const zoomControl = new kakao.maps.ZoomControl();
        this.map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
      } else {
        console.error('Kakao Maps SDK가 로드되지 않았습니다.');
        this.isLoading = false;
      }
    },
    
    showActualPosition(position) {
      if (!this.map || !position) return;
      
      // 실제 위치 마커 생성
      const markerPosition = new kakao.maps.LatLng(position.lat, position.lng);
      
      // 기존 오버레이 제거
      if (this.actualOverlay) {
        this.actualOverlay.setMap(null);
      }
      
      if (this.actualMarker) {
        // 기존 마커 위치 변경
        this.actualMarker.setPosition(markerPosition);
      } else {
        // 새 마커 생성 - 정답 마커는 location-flag.png 사용
        const markerImage = new kakao.maps.MarkerImage(
          require('@/shared/assets/images/marker/location-flag.png'),
          getResultMarkerSize(kakao)
        );
        
        this.actualMarker = new kakao.maps.Marker({
          position: markerPosition,
          map: this.map,
          image: markerImage,
          zIndex: 10
        });
      }
      
      const primaryColor = colors.BRAND.PRIMARY;

      // 정답 마커에 커스텀 오버레이 추가 (인포윈도우 대신)
      const overlayContent = `
        <div class="custom-player-overlay" style="background-color: ${primaryColor}">
          <div class="overlay-content">
            <span class="player-name">정답위치</span>
          </div>
          <div class="overlay-arrow" style="border-top-color:${primaryColor}"></div>
        </div>
      `;
    
      this.actualOverlay = new kakao.maps.CustomOverlay({
        position: markerPosition,
        content: overlayContent,
        yAnchor: 2.0, // 플레이어 마커와 동일한 값 사용
        zIndex: 10
      });

      // 오버레이 바로 표시 (클릭 없이)
      this.actualOverlay.setMap(this.map);
      
      // 정답 마커의 오버레이 상태 관리
      this.actualMarker.overlayVisible = true;
      
      // 정답 마커 클릭 시 오버레이 토글
      kakao.maps.event.addListener(this.actualMarker, 'click', () => {
        if (this.actualMarker.overlayVisible) {
          // 현재 보이는 상태면 숨기기
          this.actualOverlay.setMap(null);
          this.actualMarker.overlayVisible = false;
        } else {
          // 현재 숨겨진 상태면 보이기
          this.actualOverlay.setMap(this.map);
          this.actualMarker.overlayVisible = true;
        }
      });
      
      // 거리 계산 및 선 그리기
      this.calculateDistance();
      this.drawLine();
      
      // 플레이어 추측 위치가 있으면 거리 선 표시
      if (this.showDistanceLines && this.playerGuesses && this.playerGuesses.length > 0) {
        this.drawPlayerDistanceLines();
      }
    },
    
    calculateDistance() {
      if (!this.map || !this.internalMarkerPosition || !this.actualPosition) {
        this.distance = null;
        return;
      }
      
      const markerPosition = this.marker.getPosition();
      const actualPosition = this.actualMarker.getPosition();
      
      const lat1 = markerPosition.getLat();
      const lng1 = markerPosition.getLng();
      const lat2 = actualPosition.getLat();
      const lng2 = actualPosition.getLng();
      
      this.distance = this.calculateHaversineDistance(lat1, lng1, lat2, lng2);
    },
    
    // Haversine 공식을 사용한 거리 계산 (재사용 가능한 함수로 분리)
    calculateHaversineDistance(lat1, lng1, lat2, lng2) {
      // Haversine 공식을 사용한 거리 계산
      const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLng = this.deg2rad(lng2 - lng1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      return distance;
    },
    
    // 거리 계산 (Haversine 공식)
    deg2rad(deg) {
      return deg * (Math.PI / 180);
    },
    
    drawLine() {
      if (!this.map || !this.internalMarkerPosition || !this.actualPosition) {
        if (this.polyline) {
          this.polyline.setMap(null);
          this.polyline = null;
        }
        return;
      }
      
      // 기존 선이 있으면 제거
      if (this.polyline) {
        this.polyline.setMap(null);
      }
      
      // 새 선 그리기
      const path = [
        this.marker.getPosition(),
        this.actualMarker.getPosition()
      ];
      
      this.polyline = new kakao.maps.Polyline({
        path: path,
        strokeWeight: 3,
        strokeColor: '#db4040',
        strokeOpacity: 0.7,
        strokeStyle: 'solid'
      });
      
      this.polyline.setMap(this.map);
    },
    
    fitMapToMarkers() {
      if (!this.marker || !this.actualPosition) return;
      
      // 지도 범위 조정 로직
      // 실제 구현에서는 카카오맵 API의 LatLngBounds 사용
    },
    
    formatCoords(coords) {
      if (!coords) return '';
      return `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    },
    
    formatDistance(distance) {
      if (distance === null) return '';
      
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      } else {
        return `${distance.toFixed(2)}km`;
      }
    },
    
    showPlayerGuesses(guesses) {
      if (!this.map) {
        console.error('지도가 초기화되지 않았습니다.');
        return;
      }
      
      if (!guesses || guesses.length === 0) {
        console.warn('표시할 플레이어 추측이 없습니다.');
        return;
      }
      
      if (!this.actualPosition) {
        console.warn('실제 위치가 설정되지 않았습니다. 마커만 표시합니다.');
        // 실제 위치가 없어도 마커는 표시해야 함
      }
      
      console.log('플레이어 추측 표시 시작:', guesses.length, '개');
      
      // 기존 마커와 선 제거
      this.clearPlayerMarkers();
      
      // 각 플레이어의 추측 위치에 마커 표시
      guesses.forEach((guess, index) => {
        if (!guess.position || typeof guess.position.lat === 'undefined' || typeof guess.position.lng === 'undefined') {
          console.log('유효하지 않은 위치 정보:', guess);
          return; // 유효하지 않은 위치는 건너뛰기
        }
        
        console.log(`플레이어 ${index+1} 추측:`, guess.position);
        
        try {
          const position = new kakao.maps.LatLng(guess.position.lat, guess.position.lng);
          
          // 플레이어가 장착한 마커 이미지 사용 (없으면 기본 이미지)
          const markerImageUrl = guess.markerImageUrl || 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
          const markerImage = new kakao.maps.MarkerImage(
            markerImageUrl,
            getUserMarkerSize(kakao)
          );
          
          // 마커 생성
          const marker = new kakao.maps.Marker({
            position: position,
            map: this.map,
            title: guess.playerName || `플레이어 ${index+1}`,
            image: markerImage
          });
          
          // 실제 위치와의 거리 계산
          let distanceText = '';
          if (this.actualPosition) {
            const distance = this.calculateHaversineDistance(
              position.getLat(),
              position.getLng(),
              this.actualPosition.lat,
              this.actualPosition.lng
            );
            distanceText = this.formatDistance(distance);
          }
          
          // 색상 설정 (기본값: 파란색)
          const overlayColor = guess.color || '#3b82f6';
          
          // 커스텀 오버레이에 표출될 내용
          const content = `
            <div class="custom-player-overlay" style="background-color: ${overlayColor}">
              <div class="overlay-content">
                <span class="player-name">${guess.playerName || '플레이어 ' + (index+1)}</span>
                ${distanceText ? `<span class="distance-info">${distanceText}</span>` : ''}
              </div>
              <div class="overlay-arrow" style="border-top-color: ${overlayColor}"></div>
            </div>
          `;
          
          // 커스텀 오버레이 생성
          const customOverlay = new kakao.maps.CustomOverlay({
            map: this.map, // 처음부터 지도에 모든 오버레이 표시
            position: position,
            content: content,
            yAnchor: 2.0, // 마커 위에 충분한 공간을 두고 오버레이 배치
            zIndex: 2
          });
          
          // 해당 마커의 오버레이 상태 관리
          marker.overlayVisible = true;
          
          // 마커 클릭 시 해당 오버레이만 토글
          kakao.maps.event.addListener(marker, 'click', () => {
            if (marker.overlayVisible) {
              // 현재 보이는 상태면 숨기기
              customOverlay.setMap(null);
              marker.overlayVisible = false;
            } else {
              // 현재 숨겨진 상태면 보이기
              customOverlay.setMap(this.map);
              marker.overlayVisible = true;
            }
          });
          
          // 마커 저장
          this.playerMarkers.push({
            marker: marker,
            color: guess.color || this.getRandomColor(index),
            position: position,
            playerName: guess.playerName || '플레이어 ' + (index+1)
          });
          
          console.log(`플레이어 ${index+1} 마커 추가 성공`);
        } catch (error) {
          console.error(`플레이어 ${index+1} 마커 추가 실패:`, error);
        }
      });
      
      console.log('플레이어 마커 추가 완료:', this.playerMarkers.length, '개');
      
      // 거리 선 표시
      if (this.showDistanceLines && this.actualPosition) {
        setTimeout(() => {
          this.drawPlayerDistanceLines();
        }, 100);
      }
      
      // 모든 마커가 보이도록 지도 범위 조정
      if (this.fitAllMarkers) {
        setTimeout(() => {
          this.fitMapToAllMarkers();
        }, 200);
      }
    },
    
    // 랜덤 색상 생성 함수
    getRandomColor(index) {
      const colors = [
        '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE',
        '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE',
        '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40'
      ];
      return colors[index % colors.length];
    },
    
    drawPlayerDistanceLines() {
      if (!this.map || !this.actualMarker || this.playerMarkers.length === 0) return;
      
      // 기존 거리 선 제거
      this.clearDistanceLines();
      
      // 실제 위치
      const actualPosition = this.actualMarker.getPosition();
      
      // 각 플레이어 마커에서 실제 위치까지 선 그리기
      this.playerMarkers.forEach(item => {
        const playerPosition = item.marker.getPosition();
        const path = [
          playerPosition,
          actualPosition
        ];
        
        // 선 그리기
        const line = new kakao.maps.Polyline({
          path: path,
          strokeWeight: 3,
          strokeColor: item.color,
          strokeOpacity: 0.7,
          strokeStyle: 'solid'
        });
        
        line.setMap(this.map);
        this.distanceLines.push(line);
        
        // 선 중간에 거리 표시는 삭제 (요구사항 1)
      });
    },
    
    clearPlayerMarkers() {
      // 기존 플레이어 마커 제거
      this.playerMarkers.forEach(item => {
        item.marker.setMap(null);
        item.infoWindow.close();
      });
      
      this.playerMarkers = [];
      this.clearDistanceLines();
    },
    
    clearDistanceLines() {
      // 기존 거리 선 및 오버레이 제거
      this.distanceLines.forEach(item => {
        item.setMap(null);
      });
      
      this.distanceLines = [];
    },
    
    fitMapToAllMarkers() {
      if (!this.map || (!this.marker && this.playerMarkers.length === 0 && !this.actualMarker)) return;
      
      // 모든 마커의 위치를 포함하는 경계 생성
      const bounds = new kakao.maps.LatLngBounds();
      
      // 사용자 마커 추가
      if (this.marker) {
        bounds.extend(this.marker.getPosition());
      }
      
      // 실제 위치 마커 추가
      if (this.actualMarker) {
        bounds.extend(this.actualMarker.getPosition());
      }
      
      // 플레이어 마커 추가
      this.playerMarkers.forEach(item => {
        bounds.extend(item.marker.getPosition());
      });
      
      // 지도 범위 설정 - 약간의 패딩 추가
      this.map.setBounds(bounds, 100); // 100픽셀의 패딩 추가
      
      // 지도 레벨 조정 (너무 가깝게 확대되지 않도록)
      const currentLevel = this.map.getLevel();
      if (currentLevel < 3) {
        this.map.setLevel(3);
      }
      
      // 지도 타일이 완전히 로드된 후 한 번 더 범위 조정 (깜빡임 방지)
      setTimeout(() => {
        this.map.relayout();
        this.map.setBounds(bounds, 100);
        
        // 한 번 더 지도 레벨 확인
        const newLevel = this.map.getLevel();
        if (newLevel < 3) {
          this.map.setLevel(3);
        }
      }, 300);
    }
  }
};
</script>

<style scoped>
/* 커스텀 오버레이 스타일 */
:deep(.custom-player-overlay) {
  position: relative;
  padding: 5px 10px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  color: white;
  font-weight: bold;
  font-size: 13px;
  white-space: nowrap;
  text-align: center;
  transform: translateY(-10px); /* 마커를 가리지 않도록 위치 조정 */
}

:deep(.custom-actual-overlay) {
  position: relative;
  padding: 5px 10px;
  border-radius: 6px;
  background-color: #ff3b30; /* 빨간색 배경 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  color: white;
  font-weight: bold;
  font-size: 13px;
  white-space: nowrap;
  text-align: center;
  transform: translateY(-15px); /* 마커와 적절한 간격 유지 */
}

:deep(.overlay-content) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

:deep(.distance-info) {
  background-color: white; /* 흰색 배경 (요구사항 2) */
  color: black; /* 검정 글자 (요구사항 2) */
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: normal;
  border: 1px solid #ddd;
  margin-left: 4px;
}

:deep(.overlay-arrow) {
  position: absolute;
  bottom: -8px;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #ffffff; /* 기본 색상, 인라인 스타일로 재정의됨 */
  transform: translateX(-50%);
}

.kakao-map {
  width: 100%;
  height: 100%;
  position: relative; 
  overflow: hidden;
  background: #e6e8eb;
}

#map-container {
  width: 100%;
  height: 100%;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading-spinner i {
  font-size: 2rem;
  color: #3396FF;
}

.loading-spinner p {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.coords {
  font-family: monospace;
  margin: 5px 0;
  color: #666;
}

.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: white;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
}

.markers-container {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.marker-hint {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.9rem;
  padding: 8px 15px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .control-btn {
    width: 32px;
    height: 32px;
  }
  
  .marker-hint {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
}
</style> 