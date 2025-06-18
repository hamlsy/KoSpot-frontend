<template>
  <div class="region-map-container" :class="{ 'disabled': disabled, 'map-open': isMapOpen }">
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
      <div class="selected-region-display">
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
// import sidoPolygons from '@/assets/map/sido_kakao.json';

//수도권
import seoulPolygons from '@/shared/assets/polygons/seoul.json';
import gyeonggiPolygons from '@/shared/assets/polygons/gyeonggi.json';
import incheonPolygons from '@/shared/assets/polygons/incheon.json';

//충청
import chungnamPolygons from '@/shared/assets/polygons/chungnam.json';
import chungbukPolygons from '@/shared/assets/polygons/chungbuk.json';
import daejeonPolygons from '@/shared/assets/polygons/daejeon.json';
import sejongPolygons from '@/shared/assets/polygons/sejong.json';

//전라
import jeonnamPolygons from '@/shared/assets/polygons/jeonnam.json';
import jeonbukPolygons from '@/shared/assets/polygons/jeonbuk.json';
import gwangjuPolygons from '@/shared/assets/polygons/gwangju.json';

//강원
import gangwonPolygons from '@/shared/assets/polygons/gangwon.json';

//경상
import daeguPolygons from '@/shared/assets/polygons/daegu.json';
import busanPolygons from '@/shared/assets/polygons/busan.json';
import ulsanPolygons from '@/shared/assets/polygons/ulsan.json';
import gyeongnamPolygons from '@/shared/assets/polygons/gyeongnam.json';
import gyeongbukPolygons from '@/shared/assets/polygons/gyeongbuk.json';

//제주
import jejuPolygons from '@/shared/assets/polygons/jeju.json';

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
    selectedRegionEng: {
      type: String,
      default: null
    },
    selectedRegionCode: {
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
  emits: ['update:selectedRegion', 'submit-guess', 'update:selectedRegionEng'],
  data() {
    return {
      hoveredRegion: null,
      zoomLevel: 3,
      map: null,
      polygons: [], // 시도별 폴리곤 객체
      regionPolygons: [], // 카카오맵 폴리곤 객체
      selectedMarker: null, // 선택한 지역 마커
      isMapOpen: false,
      isMobile: false,
      defaultCenter: { lat: 36.2, lng: 127.9 }, // 한국 중심 좌표
      defaultLevel: 13, // 기본 줌 레벨
      labelVisibleLevel: 10, // 이 레벨 이하(더 확대된 상태)에서만 라벨 표시
      
      regionColors: {
        //수도권 (파란 계열)
        'Seoul': { fill: '#e6f0ff', stroke: '#a3c2e3' },
        'Incheon': { fill: '#d9e6ff', stroke: '#94b3d4' },
        'Gyeonggi': { fill: '#ccdcff', stroke: '#85a4c5' },

        //충청 (초록 계열)
        'Chungnam': { fill: '#e6ffea', stroke: '#a3e3b0' },
        'Chungbuk': { fill: '#d9ffde', stroke: '#94d4a1' },
        'Sejong': { fill: '#ccffcc', stroke: '#85c592' },
        'Daejeon': { fill: '#bfffbf', stroke: '#76b683' },

        //경상 (노랑 계열)
        'Gyeongnam': { fill: '#fffde6', stroke: '#e3e1a3' },
        'Gyeongbuk': { fill: '#fff9d9', stroke: '#d4d094' },
        'Ulsan': { fill: '#fff5cc', stroke: '#c5c185' },
        'Busan': { fill: '#fff1bf', stroke: '#b6b276' },
        'Daegu': { fill: '#ffedb2', stroke: '#a7a367' },

        //전라 (보라 계열)
        'Jeonbuk': { fill: '#f5e6ff', stroke: '#c2a3e3' },
        'Jeonnam': { fill: '#edd9ff', stroke: '#b394d4' },
        'Gwangju': { fill: '#e6ccff', stroke: '#a485c5' },

        //강원 (회색 계열)
        'Gangwon': { fill: '#f2f2f2', stroke: '#c9c9c9' },

        //제주 (주황 계열)
        'Jeju': { fill: '#fff0e6', stroke: '#e3c2a3' }
      },
      regionSettings: {
        'Seoul': { region: 'Seoul' },
        'Busan': { region: 'Busan' },
        'Daegu': { region: 'Daegu' },
        'Incheon': { region: 'Incheon' },
        'Gwangju': { region: 'Gwangju' },
        'Daejeon': { region: 'Daejeon' },
        'Ulsan': { region: 'Ulsan' },
        'Sejong': { region: 'Sejong' },
        'Gyeonggi': { region: 'Gyeonggi' },
        'Gangwon': { region: 'Gangwon' },
        'Chungbuk': { region: 'Chungbuk' },
        'Chungnam': { region: 'Chungnam' },
        'Jeonbuk': { region: 'Jeonbuk' },
        'Jeonnam': { region: 'Jeonnam' },
        'Gyeongbuk': { region: 'Gyeongbuk' },
        'Gyeongnam': { region: 'Gyeongnam' },
        'Jeju': { region: 'Jeju' }
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
    // this.loadPolygons();

    //수도권
    this.loadGyeonggiPolygons();
    this.loadSeoulPolygons();
    this.loadIncheonPolygons();

    //충청
    this.loadChungnamPolygons();
    this.loadChungbukPolygons();
    this.loadDaejeonPolygons();
    this.loadSejongPolygons();
    
    //전라
    this.loadJeonnamPolygons();
    this.loadJeonbukPolygons();
    this.loadGwangjuPolygons();
    
    //강원
    this.loadGangwonPolygons();
    
    //경상
    this.loadGyeongnamPolygons();
    this.loadGyeongbukPolygons();
    this.loadUlsanPolygons();
    this.loadDaeguPolygons();
    this.loadBusanPolygons();

    //제주
    this.loadJejuPolygons();
    this.isMobile = window.innerWidth <= 768;
  },
  mounted() {
    this.initMap();
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize);
  },
  beforeUnmount() {
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
    loadRegionPolygons(polygonData, regionName) {
      const features = polygonData.features;
      const regionSetting = this.regionSettings[regionName];
      
      if (!regionSetting) {
        console.error(`${regionName}에 대한 지역 설정이 없습니다.`);
        return;
      }
      
      // 모든 feature를 처리
      features.forEach(feature => {
        // 폴리곤 좌표가 없는 경우 건너뛰기
        if (!feature.geometry || !feature.geometry.coordinates || feature.geometry.coordinates.length === 0) {
          console.warn(`${regionName}의 일부 폴리곤에 좌표가 없습니다:`, feature.properties?.SIG_KOR_NM || '이름 없음');
          return;
        }
        
        const kor_name = feature.properties.SIG_KOR_NM;
        const eng_name = feature.properties.CTP_ENG_NM || feature.properties.SIG_ENG_NM; 
        const sig_cd = feature.properties.SIG_CD;
        
        // 다중 폴리곤 처리 (coordinates가 3차원 배열인 경우)
        if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(coordSet => {
            // 각 coordSet의 모든 폴리곤 처리
            coordSet.forEach(coords => {
              this.polygons.push({
                kor_name: kor_name,
                eng_name: eng_name,
                sig_cd: sig_cd,
                coordinates: coords,
                properties: feature.properties,
                region: regionSetting.region // 지역 구분을 위한 속성 추가
              });
            });
          });
        } else {
          // 일반 폴리곤 처리 - 모든 좌표 세트 처리
          feature.geometry.coordinates.forEach(coords => {
            this.polygons.push({
              kor_name: kor_name,
              eng_name: eng_name,
              coordinates: coords,
              properties: feature.properties,
              region: regionSetting.region // 지역 구분을 위한 속성 추가
            });
          });
        }
      });
    },
    
    loadGyeonggiPolygons() {
      this.loadRegionPolygons(gyeonggiPolygons, 'Gyeonggi');
    },
    
    loadGangwonPolygons() {
      this.loadRegionPolygons(gangwonPolygons, 'Gangwon');
    },
    
    loadSeoulPolygons() {
      this.loadRegionPolygons(seoulPolygons, 'Seoul');
    },
    
    loadIncheonPolygons() {
      this.loadRegionPolygons(incheonPolygons, 'Incheon');
    },
    
    loadChungnamPolygons() {
      this.loadRegionPolygons(chungnamPolygons, 'Chungnam');
    },
    
    loadChungbukPolygons() {
      this.loadRegionPolygons(chungbukPolygons, 'Chungbuk');
    },
    
    loadJeonnamPolygons() {
      this.loadRegionPolygons(jeonnamPolygons, 'Jeonnam');
    },
    
    loadJeonbukPolygons() {
      this.loadRegionPolygons(jeonbukPolygons, 'Jeonbuk');
    },
    
    loadDaeguPolygons() {
      this.loadRegionPolygons(daeguPolygons, 'Daegu');
    },
    loadBusanPolygons() {
      this.loadRegionPolygons(busanPolygons, 'Busan');
    },
    loadUlsanPolygons() {
      this.loadRegionPolygons(ulsanPolygons, 'Ulsan');
    },
    loadGyeongnamPolygons() {
      this.loadRegionPolygons(gyeongnamPolygons, 'Gyeongnam');
    },
    loadGyeongbukPolygons() {
      this.loadRegionPolygons(gyeongbukPolygons, 'Gyeongbuk');
    },
    loadJejuPolygons() {
      this.loadRegionPolygons(jejuPolygons, 'Jeju');
    },
    loadSejongPolygons() {
      this.loadRegionPolygons(sejongPolygons, 'Sejong');
    },
    loadDaejeonPolygons() {
      this.loadRegionPolygons(daejeonPolygons, 'Daejeon');
    },
    loadGwangjuPolygons() {
      this.loadRegionPolygons(gwangjuPolygons, 'Gwangju');
    },


    drawRegions() {
      if (!this.map || !this.polygons.length) return;
      
      // 기존 폴리곤 제거
      this.regionPolygons.forEach(p => p.polygon.setMap(null));
      this.regionPolygons = [];
      
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
            this.selectRegion(region);
          }
        });
        
        // 폴리곤 마우스오버 이벤트
        kakao.maps.event.addListener(polygon, 'mouseover', () => {
          const hoverName = region.kor_name;
          this.hoverRegion(hoverName);
        });
        
        // 폴리곤 마우스아웃 이벤트
        kakao.maps.event.addListener(polygon, 'mouseout', () => {
          this.clearHover();
        });
        
        // 폴리곤과 지역 이름 저장
        this.regionPolygons.push({
          polygon,
          kor_name: region.kor_name,
          eng_name: region.eng_name,
          region: region.region
        });
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
          const regionName = polygon.kor_name;
          const effectiveName = regionName; 
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
    selectRegion(region) {
      this.$emit('update:selectedRegion', region.kor_name);
      this.$emit('update:selectedRegionEng', region.eng_name);
      this.$emit('update:selectedRegionCode', region.sig_cd);
      
      // 선택한 지역의 중심점에 마커 표시
      this.showMarkerAtRegion(region.kor_name);
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
        if ((region.name === regionName)) {
          
          // 폴리곤 경로 가져오기
          const path = region.polygon.getPath();
          
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
    // selectedRegionEng을 인자로 전달
    this.$emit('submit-guess', this.selectedRegionEng);
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
  
  // 영문 지역 코드를 한글 지역명으로 변환하는 메서드
  getRegionDisplayName(region) {
    return region;
  },
    checkScreenSize() {
      this.isMobile = window.innerWidth <= 768;
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
    },
  }
};
</script>

<style scoped>
.region-map-container {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  width: 100%; 
} 

.map-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  width: 100%;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.05);
  background-color: white;
  z-index: 5;
}

.selected-region-display {
  padding: 10px;
  background-color: #f8fafc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  z-index: 5;
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
  position: absolute; /* 절대 위치로 변경 */
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10; /* 맵보다 위에 표시 */
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
  
  /* 모바일에서도 Spot 버튼이 항상 보이도록 */
  .spot-button-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1002; /* 모바일에서 더 높은 z-index */
  }
}
</style>