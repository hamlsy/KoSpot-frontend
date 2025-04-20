<template>
  <div class="region-map-container" :class="{ 'disabled': disabled, 'map-open': isMapOpen }">
    <button v-if="isMobile" class="toggle-map-button" @click="toggleMap">
      <i class="fas" :class="isMapOpen ? 'fa-times' : 'fa-map-marker-alt'"></i>
      {{ isMapOpen ? '지도 닫기' : '지도 열기' }}
    </button>
    <div class="map-wrapper" :class="{ 'mobile-closed': isMobile && !isMapOpen }">
      <div class="map-controls">
        <button class="zoom-button" @click="zoomIn">
          <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-button" @click="zoomOut">
          <i class="fas fa-minus"></i>
        </button>
        <button class="zoom-button" @click="resetZoom">
          <i class="fas fa-undo"></i>
        </button>
      </div>
      <div id="kakao-map" class="map-container"></div>
      <div v-if="selectedRegion && !disabled" class="spot-button-container">
        <button class="spot-button" @click="submitGuess">
          <i class="fas fa-location-arrow"></i> Spot!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import sidoPolygons from '@/assets/map/sido_kakao.json';
import gyeonggiPolygons from '@/assets/map/gyeonggi.json';
import gangwonPolygons from '@/assets/map/gangwon.json';

export default {
  name: 'RegionMap',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    showRegionNames: {
      type: Boolean,
      default: true
    },
    selectedRegion: {
      type: String,
      default: null
    },
    correctRegion: {
      type: String,
      default: null
    },
    wrongRegion: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      hoveredRegion: null,
      zoomLevel: 3,
      map: null,
      polygons: [], // 시도별 폴리곤 객체
      regionPolygons: [], // 카카오맵 폴리곤 객체
      regionLabels: [], // 지역 이름 라벨
      isMapOpen: false,
      isMobile: false,
      defaultCenter: { lat: 36.2, lng: 127.9 }, // 한국 중심 좌표
      defaultLevel: 13, // 기본 줌 레벨
      labelVisibleLevel: 10, // 이 레벨 이하(더 확대된 상태)에서만 라벨 표시
      mergedCities: {
        '고양시': ['고양시덕양구', '고양시일산동구', '고양시일산서구'],
        '수원시': ['수원시 권선구', '수원시 영통구', '수원시 장안구', '수원시 팔달구']
      },
      regionColors: {
        '경기도': { fill: '#e9f5e9', stroke: '#a8d8a8' },
        '강원도': { fill: '#e6f0ff', stroke: '#a3c2e3' }
      }
    };
  },
  watch: {
    selectedRegion() {
      this.updatePolygonStyles();
    },
    correctRegion() {
      this.updatePolygonStyles();
    },
    wrongRegion() {
      this.updatePolygonStyles();
    }
  },
  created() {
    this.loadPolygons();
    this.loadGyeonggiPolygons();
    this.loadGangwonPolygons();
    this.isMobile = window.innerWidth <= 768;
  },
  mounted() {
    this.initMap();
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkScreenSize);
  },
  methods: {
    initMap() {
      if (window.kakao && window.kakao.maps) {
        const container = document.getElementById('kakao-map');
        const options = {
          center: new kakao.maps.LatLng(this.defaultCenter.lat, this.defaultCenter.lng),
          level: this.defaultLevel,
          draggable: true,
          scrollwheel: true
        };

        this.map = new kakao.maps.Map(container, options);
        
        // 행정구역 폴리곤 그리기
        this.drawRegions();
      } else {
        // Kakao Maps API가 로드되지 않은 경우 1초 후 재시도
        setTimeout(() => {
          this.initMap();
        }, 1000);
      }
    },
    loadPolygons() {
      // GeoJSON 데이터 로드
      this.polygons = sidoPolygons.features.map(f => {
        const name = f.properties.SIG_KOR_NM || f.properties.CTP_KOR_NM || f.properties.CTP_ENG_NM || '지역';
        return {
          name,
          coordinates: f.geometry.coordinates[0], // 단일 폴리곤만 사용
          properties: f.properties,
        };
      });
    },
    loadGyeonggiPolygons() {
      // 경기도 폴리곤 데이터 로드
      const gyeonggiFeatures = gyeonggiPolygons.features;
      
      // 통합할 도시별로 Feature 그룹화
      const cityGroups = {};
      const standaloneFeatures = [];
      
      // 각 Feature를 도시별로 분류
      gyeonggiFeatures.forEach(feature => {
        const name = feature.properties.SIG_KOR_NM;
        let shouldMerge = false;
        let mergedCityName = '';
        
        // 통합 대상 도시인지 확인
        Object.keys(this.mergedCities).forEach(cityName => {
          if (this.mergedCities[cityName].includes(name)) {
            shouldMerge = true;
            mergedCityName = cityName;
          }
        });
        
        if (shouldMerge) {
          // 통합 대상이면 해당 도시 그룹에 추가
          if (!cityGroups[mergedCityName]) {
            cityGroups[mergedCityName] = [];
          }
          cityGroups[mergedCityName].push(feature);
        } else {
          // 통합 대상이 아니면 그대로 추가
          standaloneFeatures.push(feature);
        }
      });
      
      // 통합 도시 Feature 생성 및 추가
      Object.keys(cityGroups).forEach(cityName => {
        const features = cityGroups[cityName];
        if (features.length > 0) {
          features.forEach(feature => {
            // 각 구역을 개별 Feature로 변환하되 이름은 통합 도시명으로 설정
            this.polygons.push({
              name: cityName,
              originalName: feature.properties.SIG_KOR_NM,
              coordinates: feature.geometry.coordinates[0],
              properties: {
                ...feature.properties,
                SIG_KOR_NM: cityName // 이름 변경
              },
              cityGroup: cityName, // 같은 그룹임을 표시
              region: '경기도' // 지역 구분을 위한 속성 추가
            });
          });
        }
      });
      
      // 독립 Feature 추가
      standaloneFeatures.forEach(feature => {
        const name = feature.properties.SIG_KOR_NM;
        this.polygons.push({
          name: name,
          coordinates: feature.geometry.coordinates[0],
          properties: feature.properties,
          region: '경기도' // 지역 구분을 위한 속성 추가
        });
      });
      
      console.log('경기도 지역 데이터 로드 완료:', gyeonggiFeatures.length, '개 지역');
    },
    loadGangwonPolygons() {
      // 강원도 폴리곤 데이터 로드
      const gangwonFeatures = gangwonPolygons.features;
      
      // 강원도는 이미 시/군 단위로 구분되어 있음
      gangwonFeatures.forEach(feature => {
        const name = feature.properties.SIG_KOR_NM;
        
        // 시/군 단위 지역 추가
        this.polygons.push({
          name: name,
          coordinates: feature.geometry.coordinates[0],
          properties: feature.properties,
          region: '강원도' // 지역 구분을 위한 속성 추가
        });
      });
      
      console.log('강원도 지역 데이터 로드 완료:', gangwonFeatures.length, '개 지역');
    },
    drawRegions() {
      if (!this.map || !this.polygons.length) return;
      
      // 기존 폴리곤 제거
      this.regionPolygons.forEach(p => p.setMap(null));
      this.regionPolygons = [];
      
      // 기존 라벨 제거
      this.regionLabels.forEach(label => label.setMap(null));
      this.regionLabels = [];
      
      // 도시 그룹별 중심점 계산을 위한 객체
      const cityGroupPoints = {};
      
      // 각 지역별 폴리곤 생성
      this.polygons.forEach(region => {
        const path = region.coordinates.map(coord => 
          new kakao.maps.LatLng(coord[1], coord[0]) // 좌표 순서 변경 (경도, 위도) -> (위도, 경도)
        );
        
        // 지역별 기본 색상 설정
        const regionName = region.region || '기본';
        const regionColor = this.regionColors[regionName] || { fill: '#f1f5f9', stroke: '#cbd5e1' };
        
        const polygon = new kakao.maps.Polygon({
          map: this.map,
          path: path,
          strokeWeight: 2,
          strokeColor: regionColor.stroke,
          strokeOpacity: 0.8,
          fillColor: regionColor.fill,
          fillOpacity: 0.7
        });
        
        // 폴리곤 클릭 이벤트
        kakao.maps.event.addListener(polygon, 'click', () => {
          if (!this.disabled) {
            // 도시 그룹이 있으면 그룹명으로, 없으면 지역 이름으로 선택
            const selectName = region.cityGroup || region.name;
            this.selectRegion(selectName);
          }
        });
        
        // 폴리곤 마우스오버 이벤트
        kakao.maps.event.addListener(polygon, 'mouseover', () => {
          // 도시 그룹이 있으면 그룹명으로, 없으면 지역 이름으로 호버
          const hoverName = region.cityGroup || region.name;
          this.hoverRegion(hoverName);
        });
        
        // 폴리곤 마우스아웃 이벤트
        kakao.maps.event.addListener(polygon, 'mouseout', () => {
          this.clearHover();
        });
        
        // 폴리곤과 지역 이름 저장
        this.regionPolygons.push({
          polygon,
          name: region.name,
          cityGroup: region.cityGroup,
          region: region.region
        });
        
        // 도시 그룹별 좌표 수집 (라벨 중심점 계산용)
        if (region.cityGroup) {
          if (!cityGroupPoints[region.cityGroup]) {
            cityGroupPoints[region.cityGroup] = [];
          }
          // 폴리곤의 모든 좌표를 해당 도시 그룹에 추가
          path.forEach(point => {
            cityGroupPoints[region.cityGroup].push(point);
          });
        }
      });
      
      // 지역 이름 라벨 생성
      if (this.showRegionNames) {
        // 1. 일반 지역 라벨 생성
        this.polygons.forEach(region => {
          // 도시 그룹에 속한 지역은 개별 라벨을 생성하지 않음
          if (region.cityGroup) return;
          
          const path = region.coordinates.map(coord => 
            new kakao.maps.LatLng(coord[1], coord[0])
          );
          
          const center = this.getPolygonCenter(path);
          
          const customOverlay = new kakao.maps.CustomOverlay({
            position: center,
            content: `<div class="region-label">${region.name}</div>`,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 1
          });
          
          // 현재 지도 레벨이 labelVisibleLevel 이하일 때만 라벨 표시
          if (this.map.getLevel() <= this.labelVisibleLevel) {
            customOverlay.setMap(this.map);
          }
          
          this.regionLabels.push(customOverlay);
        });
        
        // 2. 도시 그룹 라벨 생성
        Object.keys(cityGroupPoints).forEach(cityName => {
          const points = cityGroupPoints[cityName];
          if (points.length > 0) {
            // 도시 그룹의 모든 좌표의 중심점 계산
            const center = this.getPointsCenter(points);
            
            const customOverlay = new kakao.maps.CustomOverlay({
              position: center,
              content: `<div class="region-label city-group-label">${cityName}</div>`,
              xAnchor: 0.5,
              yAnchor: 0.5,
              zIndex: 2 // 일반 라벨보다 위에 표시
            });
            
            // 현재 지도 레벨이 labelVisibleLevel 이하일 때만 라벨 표시
            if (this.map.getLevel() <= this.labelVisibleLevel) {
              customOverlay.setMap(this.map);
            }
            
            this.regionLabels.push(customOverlay);
          }
        });
      }
      
      // 지도 줌 레벨 변경 이벤트 리스너 추가
      kakao.maps.event.addListener(this.map, 'zoom_changed', () => {
        this.updateLabelsVisibility();
      });
      
      this.updatePolygonStyles();
    },
    
    // 여러 좌표의 중심점 계산
    getPointsCenter(points) {
      let lat = 0, lng = 0;
      points.forEach(point => {
        lat += point.getLat();
        lng += point.getLng();
      });
      return new kakao.maps.LatLng(lat / points.length, lng / points.length);
    },
    
    getPolygonCenter(path) {
      // 폴리곤의 중심점 계산
      let lat = 0, lng = 0;
      path.forEach(point => {
        lat += point.getLat();
        lng += point.getLng();
      });
      return new kakao.maps.LatLng(lat / path.length, lng / path.length);
    },
    updatePolygonStyles() {
      this.regionPolygons.forEach(polygon => {
        if (polygon.polygon instanceof kakao.maps.Polygon) {
          const regionName = polygon.name;
          const cityGroup = polygon.cityGroup;
          const effectiveName = cityGroup || regionName; // 도시 그룹이 있으면 그룹명 사용
          const region = polygon.region || '기본';
          
          // 지역별 기본 색상 가져오기
          const regionColor = this.regionColors[region] || { fill: '#f1f5f9', stroke: '#cbd5e1' };
          
          // 기본 스타일
          let strokeColor = regionColor.stroke;
          let strokeWeight = 2;
          let fillColor = regionColor.fill;
          let fillOpacity = 0.7;
          
          // 선택된 지역
          if (this.selectedRegion === effectiveName) {
            strokeColor = '#3b82f6';
            strokeWeight = 3;
            fillColor = '#60a5fa';
            fillOpacity = 0.7;
          }
          
          // 정답 지역
          if (this.correctRegion === effectiveName) {
            strokeColor = '#10b981';
            strokeWeight = 3;
            fillColor = '#34d399';
            fillOpacity = 0.7;
          }
          
          // 오답 지역
          if (this.wrongRegion === effectiveName) {
            strokeColor = '#ef4444';
            strokeWeight = 3;
            fillColor = '#f87171';
            fillOpacity = 0.7;
          }
          
          // 호버된 지역
          if (this.hoveredRegion === effectiveName && !this.selectedRegion && !this.disabled) {
            strokeColor = '#3b82f6';
            strokeWeight = 3;
            fillColor = regionColor.fill; // 지역 색상 유지하면서 약간 밝게
            fillOpacity = 0.9;
          }
          
          // 비활성화된 경우
          if (this.disabled) {
            fillOpacity = 0.5;
          }
          
          // 스타일 적용
          polygon.polygon.setOptions({
            strokeColor: strokeColor,
            strokeWeight: strokeWeight,
            fillColor: fillColor,
            fillOpacity: fillOpacity
          });
        }
      });
    },
    selectRegion(regionName) {
      if (this.disabled) return;
      this.$emit('update:selectedRegion', regionName);
    },
    hoverRegion(regionName) {
      this.hoveredRegion = regionName;
      this.updatePolygonStyles();
    },
    clearHover() {
      this.hoveredRegion = null;
      this.updatePolygonStyles();
    },
    reset() {
      this.$emit('update:selectedRegion', null);
    },
    submitGuess() {
      this.$emit('submit-guess');
    },
    zoomIn() {
      if (this.map) {
        const level = this.map.getLevel();
        if (level > 1) {
          this.map.setLevel(level - 1);
        }
      }
    },
    zoomOut() {
      if (this.map) {
        const level = this.map.getLevel();
        if (level < 14) {
          this.map.setLevel(level + 1);
        }
      }
    },
    resetZoom() {
      if (this.map) {
        this.map.setLevel(this.defaultLevel);
        this.map.setCenter(new kakao.maps.LatLng(this.defaultCenter.lat, this.defaultCenter.lng));
      }
    },
    toggleMap() {
      this.isMapOpen = !this.isMapOpen;
    },
    checkScreenSize() {
      this.isMobile = window.innerWidth <= 768;
    },
    updateLabelsVisibility() {
      const currentLevel = this.map.getLevel();
      this.regionLabels.forEach(label => {
        if (currentLevel <= this.labelVisibleLevel) {
          label.setMap(this.map);
        } else {
          label.setMap(null);
        }
      });
    }
  }
};
</script>

<style scoped>
.region-map-container {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: flex-end;
}

.map-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  width: 300px;
  max-width: 100%;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.05);
  background-color: white;
}

.map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.map-controls {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.zoom-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.zoom-button:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.spot-button-container {
  padding: 12px;
  display: flex;
  justify-content: center;
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  bottom: 0;
}

.spot-button {
  padding: 10px 24px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(45deg, #3b82f6, #60a5fa);
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
}

.spot-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
}

.toggle-map-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 24px;
  border: none;
  background: #3b82f6;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 100;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-map-button:hover {
  transform: translateY(-2px);
  background: #2563eb;
}

.region-label {
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 5px;
  border-radius: 3px;
  pointer-events: none;
  white-space: nowrap;
}

.city-group-label {
  font-size: 14px;
  font-weight: bold;
}

.mobile-closed {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

.map-open .mobile-closed {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

@media (max-width: 768px) {
  .map-wrapper {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 100%;
    max-width: 320px;
    z-index: 1000;
  }
  
  .toggle-map-button {
    z-index: 1001;
  }
}
</style>