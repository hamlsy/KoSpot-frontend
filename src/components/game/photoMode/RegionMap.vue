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
      <div v-if="selectedRegion" class="selected-region-display">
        선택한 지역: <span>{{ selectedRegion }}</span>
      </div>
      <div id="kakao-map" class="map-container"></div>
      <div v-if="selectedRegion && !disabled" class="spot-button-container">
        <button class="spot-button" @click="submitGuess">
          <i class="fas fa-map-marker-alt"></i> Spot!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import sidoPolygons from '@/assets/map/sido_kakao.json';
import gyeonggiPolygons from '@/assets/map/gyeonggi.json';
import gangwonPolygons from '@/assets/map/gangwon.json';
import seoulPolygons from '@/assets/map/seoul.json';
import incheonPolygons from '@/assets/map/incheon.json';

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
      selectedMarker: null, // 선택한 지역 마커
      isMapOpen: false,
      isMobile: false,
      defaultCenter: { lat: 36.2, lng: 127.9 }, // 한국 중심 좌표
      defaultLevel: 13, // 기본 줌 레벨
      labelVisibleLevel: 10, // 이 레벨 이하(더 확대된 상태)에서만 라벨 표시
      mergedCities: {
        '고양시': ['고양시덕양구', '고양시일산동구', '고양시일산서구'],
        '수원시': ['수원시 권선구', '수원시 영통구', '수원시 장안구', '수원시 팔달구'],
        '성남시': ['성남시 분당구', '성남시 수정구', '성남시 중원구'],
        '안양시': ['안양시 동안구', '안양시 만안구'],
        '안산시': ['안산시 단원구', '안산시 상록구']
      },
      regionColors: {
        '경기도': { fill: '#e9f5e9', stroke: '#a8d8a8' },
        '강원도': { fill: '#e6f0ff', stroke: '#a3c2e3' },
        '서울특별시': { fill: '#ffe6e6', stroke: '#e3a3a3' },
        '인천광역시': { fill: '#fff5e6', stroke: '#e3c2a3' }
      }
    };
  },
  watch: {
    selectedRegion() {
      this.updatePolygonStyles();
      this.showMarkerAtRegion(this.selectedRegion);
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
    this.loadSeoulPolygons();
    this.loadIncheonPolygons();
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
    loadSeoulPolygons() {
      // 서울특별시 폴리곤 데이터 로드
      const seoulFeatures = seoulPolygons.features;
      
      // 서울특별시의 모든 구를 하나로 통합
      seoulFeatures.forEach(feature => {
        // 모든 구를 '서울특별시'라는 하나의 도시로 통합
        this.polygons.push({
          name: '서울특별시',
          originalName: feature.properties.SIG_KOR_NM,
          coordinates: feature.geometry.coordinates[0],
          properties: {
            ...feature.properties,
            SIG_KOR_NM: '서울특별시' // 이름 변경
          },
          cityGroup: '서울특별시', // 같은 그룹임을 표시
          region: '서울특별시' // 지역 구분을 위한 속성 추가
        });
      });
      
      console.log('서울특별시 지역 데이터 로드 완료:', seoulFeatures.length, '개 지역을 통합');
    },
    loadIncheonPolygons() {
      // 인천광역시 폴리곤 데이터 로드
      const incheonFeatures = incheonPolygons.features;
      
      // 인천광역시의 모든 구를 하나로 통합
      incheonFeatures.forEach(feature => {
        // 모든 구를 '인천광역시'라는 하나의 도시로 통합
        this.polygons.push({
          name: '인천광역시',
          originalName: feature.properties.SIG_KOR_NM,
          coordinates: feature.geometry.coordinates[0],
          properties: {
            ...feature.properties,
            SIG_KOR_NM: '인천광역시' // 이름 변경
          },
          cityGroup: '인천광역시', // 같은 그룹임을 표시
          region: '인천광역시' // 지역 구분을 위한 속성 추가
        });
      });
      
      console.log('인천광역시 지역 데이터 로드 완료:', incheonFeatures.length, '개 지역을 통합');
    },
    drawRegions() {
      if (!this.map || !this.polygons.length) return;
      
      // 기존 폴리곤 제거
      this.regionPolygons.forEach(p => p.polygon.setMap(null));
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
      
      // 라벨 위치 충돌 방지를 위한 배열
      const labelPositions = [];
      
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
          const adjustedPosition = this.getAdjustedLabelPosition(center, labelPositions, region.name);
          
          const customOverlay = new kakao.maps.CustomOverlay({
            position: adjustedPosition,
            content: `<div class="region-label">${region.name}</div>`,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 1
          });
          
          // 현재 지도 레벨이 labelVisibleLevel 이하일 때만 라벨 표시
          if (this.map.getLevel() <= this.labelVisibleLevel) {
            customOverlay.setMap(this.map);
          }
          
          // 라벨 위치 저장
          labelPositions.push({
            position: adjustedPosition,
            name: region.name
          });
          
          this.regionLabels.push(customOverlay);
        });
        
        // 2. 도시 그룹 라벨 생성
        Object.keys(cityGroupPoints).forEach(cityName => {
          const points = cityGroupPoints[cityName];
          if (points.length > 0) {
            // 도시 그룹의 모든 좌표의 중심점 계산
            const center = this.getPointsCenter(points);
            const adjustedPosition = this.getAdjustedLabelPosition(center, labelPositions, cityName);
            
            const customOverlay = new kakao.maps.CustomOverlay({
              position: adjustedPosition,
              content: `<div class="region-label city-group-label">${cityName}</div>`,
              xAnchor: 0.5,
              yAnchor: 0.5,
              zIndex: 2 // 일반 라벨보다 위에 표시
            });
            
            // 현재 지도 레벨이 labelVisibleLevel 이하일 때만 라벨 표시
            if (this.map.getLevel() <= this.labelVisibleLevel) {
              customOverlay.setMap(this.map);
            }
            
            // 라벨 위치 저장
            labelPositions.push({
              position: adjustedPosition,
              name: cityName
            });
            
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
      this.$emit('update:selectedRegion', regionName);
      
      // 선택한 지역의 중심점에 마커 표시
      this.showMarkerAtRegion(regionName);
    },
    
    showMarkerAtRegion(regionName) {
      // 기존 마커가 있으면 제거
      if (this.selectedMarker) {
        this.selectedMarker.setMap(null);
      }
      
      // 선택한 지역이 없으면 종료
      if (!regionName) return;
      
      // 선택한 지역의 폴리곤 찾기
      let center = null;
      let found = false;
      
      // 도시 그룹인 경우
      const cityGroupPoints = {};
      
      // 해당 지역의 모든 폴리곤 좌표 수집
      this.regionPolygons.forEach(region => {
        if ((region.cityGroup && region.cityGroup === regionName) || 
            (!region.cityGroup && region.name === regionName)) {
          
          // 폴리곤 경로 가져오기
          const path = region.polygon.getPath();
          
          if (!cityGroupPoints[regionName]) {
            cityGroupPoints[regionName] = [];
          }
          
          // 모든 좌표 수집
          for (let i = 0; i < path.length; i++) {
            cityGroupPoints[regionName].push(path[i]);
          }
          
          found = true;
        }
      });
      
      if (found && cityGroupPoints[regionName]) {
        // 수집된 모든 좌표의 중심점 계산
        center = this.getPointsCenter(cityGroupPoints[regionName]);
        
        // 마커 생성
        this.selectedMarker = new kakao.maps.Marker({
          position: center,
          map: this.map
        });
      }
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
    },
    getAdjustedLabelPosition(center, existingLabels, labelName) {
      // const minDistance = 0.015; // 최소 거리 (위도/경도 단위)
      const maxAttempts = 8; // 최대 시도 횟수
      const offsetStep = 0.01; // 조정 단계
      
      // 원래 위치가 충돌하지 않으면 그대로 반환
      if (!this.isLabelColliding(center, existingLabels)) {
        return center;
      }
      
      // 충돌이 발생하면 주변 8방향으로 위치 조정 시도
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const offset = offsetStep * attempt;
        
        // 8방향으로 조정 시도
        const directions = [
          { lat: offset, lng: 0 },        // 북
          { lat: offset, lng: offset },   // 북동
          { lat: 0, lng: offset },        // 동
          { lat: -offset, lng: offset },  // 남동
          { lat: -offset, lng: 0 },       // 남
          { lat: -offset, lng: -offset }, // 남서
          { lat: 0, lng: -offset },       // 서
          { lat: offset, lng: -offset }   // 북서
        ];
        
        for (const dir of directions) {
          const newPos = new kakao.maps.LatLng(
            center.getLat() + dir.lat,
            center.getLng() + dir.lng
          );
          
          if (!this.isLabelColliding(newPos, existingLabels)) {
            console.log(`라벨 '${labelName}' 위치 조정됨`);
            return newPos;
          }
        }
      }
      
      // 모든 시도 후에도 적절한 위치를 찾지 못하면 원래 위치 반환
      console.log(`라벨 '${labelName}' 위치 조정 실패`);
      return center;
    },
    isLabelColliding(position, existingLabels) {
      const minDistance = 0.015; // 최소 거리 (위도/경도 단위)
      
      for (const label of existingLabels) {
        const existingPos = label.position;
        const distance = Math.sqrt(
          Math.pow(position.getLat() - existingPos.getLat(), 2) +
          Math.pow(position.getLng() - existingPos.getLng(), 2)
        );
        
        if (distance < minDistance) {
          return true; // 충돌 발생
        }
      }
      
      return false; // 충돌 없음
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

.selected-region-display {
  padding: 10px;
  background-color: #f8fafc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.selected-region-display span {
  font-weight: 700;
  color: #3b82f6;
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