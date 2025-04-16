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
      
      <div class="map-container" 
        @wheel="handleWheel"
        @mousedown="startPan"
        @mousemove="pan"
        @mouseup="endPan"
        @mouseleave="endPan"
        @touchstart="startPanTouch"
        @touchmove="panTouch"
        @touchend="endPanTouch">
        <svg 
          viewBox="0 0 800 1000"
          class="region-map"
          :style="{ transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)` }"
        >
          <!-- 서울 -->
          <path 
            id="seoul" 
            d="M409,226 L428,226 L442,241 L442,262 L409,295 L376,262 L376,241 L390,226 Z" 
            @click="selectRegion('seoul')"
            @mouseover="hoverRegion('seoul')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'seoul',
              'region-correct': correctRegion === 'seoul',
              'region-wrong': wrongRegion === 'seoul',
              'region-hover': hoveredRegion === 'seoul'
            }"
          />
          
          <!-- 경기도 -->
          <path 
            id="gyeonggi" 
            d="M325,186 L478,186 L478,241 L442,241 L428,226 L409,226 L390,226 L376,241 L376,262 L409,295 L409,325 L360,380 L325,380 L280,335 L280,240 Z" 
            @click="selectRegion('gyeonggi')"
            @mouseover="hoverRegion('gyeonggi')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'gyeonggi',
              'region-correct': correctRegion === 'gyeonggi',
              'region-wrong': wrongRegion === 'gyeonggi',
              'region-hover': hoveredRegion === 'gyeonggi'
            }"
          />
          
          <!-- 인천 -->
          <path 
            id="incheon" 
            d="M280,240 L280,335 L260,335 L230,295 L230,240 Z" 
            @click="selectRegion('incheon')"
            @mouseover="hoverRegion('incheon')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'incheon',
              'region-correct': correctRegion === 'incheon',
              'region-wrong': wrongRegion === 'incheon',
              'region-hover': hoveredRegion === 'incheon'
            }"
          />
          
          <!-- 강원도 -->
          <path 
            id="gangwon" 
            d="M478,186 L600,186 L600,335 L535,390 L478,390 L478,350 L420,350 L409,325 L409,295 L442,262 L442,241 L478,241 Z" 
            @click="selectRegion('gangwon')"
            @mouseover="hoverRegion('gangwon')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'gangwon',
              'region-correct': correctRegion === 'gangwon',
              'region-wrong': wrongRegion === 'gangwon',
              'region-hover': hoveredRegion === 'gangwon'
            }"
          />
          
          <!-- 충청북도 -->
          <path 
            id="chungbuk" 
            d="M420,350 L478,350 L478,390 L535,390 L535,480 L478,535 L420,535 L420,480 L380,440 L360,440 L360,380 L409,325 Z" 
            @click="selectRegion('chungbuk')"
            @mouseover="hoverRegion('chungbuk')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'chungbuk',
              'region-correct': correctRegion === 'chungbuk',
              'region-wrong': wrongRegion === 'chungbuk',
              'region-hover': hoveredRegion === 'chungbuk'
            }"
          />
          
          <!-- 충청남도 -->
          <path 
            id="chungnam" 
            d="M260,335 L325,335 L325,380 L360,380 L360,440 L380,440 L420,480 L420,535 L360,535 L300,480 L300,400 L260,400 Z" 
            @click="selectRegion('chungnam')"
            @mouseover="hoverRegion('chungnam')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'chungnam',
              'region-correct': correctRegion === 'chungnam',
              'region-wrong': wrongRegion === 'chungnam',
              'region-hover': hoveredRegion === 'chungnam'
            }"
          />
          
          <!-- 대전 -->
          <path 
            id="daejeon" 
            d="M360,535 L420,535 L420,565 L360,565 Z" 
            @click="selectRegion('daejeon')"
            @mouseover="hoverRegion('daejeon')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'daejeon',
              'region-correct': correctRegion === 'daejeon',
              'region-wrong': wrongRegion === 'daejeon',
              'region-hover': hoveredRegion === 'daejeon'
            }"
          />
          
          <!-- 경상북도 -->
          <path 
            id="gyeongbuk" 
            d="M535,390 L600,335 L650,335 L650,480 L620,525 L570,525 L570,575 L535,600 L480,600 L480,535 L535,480 Z" 
            @click="selectRegion('gyeongbuk')"
            @mouseover="hoverRegion('gyeongbuk')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'gyeongbuk',
              'region-correct': correctRegion === 'gyeongbuk',
              'region-wrong': wrongRegion === 'gyeongbuk',
              'region-hover': hoveredRegion === 'gyeongbuk'
            }"
          />
          
          <!-- 대구 -->
          <path 
            id="daegu" 
            d="M480,600 L535,600 L535,640 L480,640 Z" 
            @click="selectRegion('daegu')"
            @mouseover="hoverRegion('daegu')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'daegu',
              'region-correct': correctRegion === 'daegu',
              'region-wrong': wrongRegion === 'daegu',
              'region-hover': hoveredRegion === 'daegu'
            }"
          />
          
          <!-- 전라북도 -->
          <path 
            id="jeonbuk" 
            d="M300,480 L360,535 L360,565 L420,565 L420,535 L480,535 L480,600 L420,655 L360,655 L300,600 L245,600 L245,550 L300,550 Z" 
            @click="selectRegion('jeonbuk')"
            @mouseover="hoverRegion('jeonbuk')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'jeonbuk',
              'region-correct': correctRegion === 'jeonbuk',
              'region-wrong': wrongRegion === 'jeonbuk',
              'region-hover': hoveredRegion === 'jeonbuk'
            }"
          />
          
          <!-- 광주 -->
          <path 
            id="gwangju" 
            d="M360,655 L400,655 L400,685 L360,685 Z" 
            @click="selectRegion('gwangju')"
            @mouseover="hoverRegion('gwangju')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'gwangju',
              'region-correct': correctRegion === 'gwangju',
              'region-wrong': wrongRegion === 'gwangju',
              'region-hover': hoveredRegion === 'gwangju'
            }"
          />
          
          <!-- 전라남도 -->
          <path 
            id="jeonnam" 
            d="M245,550 L245,600 L300,600 L360,655 L360,685 L400,685 L400,655 L420,655 L480,600 L480,640 L535,640 L535,700 L480,740 L360,740 L300,700 L270,740 L180,740 L180,600 Z" 
            @click="selectRegion('jeonnam')"
            @mouseover="hoverRegion('jeonnam')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'jeonnam',
              'region-correct': correctRegion === 'jeonnam',
              'region-wrong': wrongRegion === 'jeonnam',
              'region-hover': hoveredRegion === 'jeonnam'
            }"
          />
          
          <!-- 경상남도 -->
          <path 
            id="gyeongnam" 
            d="M535,600 L570,575 L570,525 L620,525 L650,525 L650,640 L598,685 L535,700 L535,640 L480,640 L480,600 Z" 
            @click="selectRegion('gyeongnam')"
            @mouseover="hoverRegion('gyeongnam')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'gyeongnam',
              'region-correct': correctRegion === 'gyeongnam',
              'region-wrong': wrongRegion === 'gyeongnam',
              'region-hover': hoveredRegion === 'gyeongnam'
            }"
          />
          
          <!-- 울산 -->
          <path 
            id="ulsan" 
            d="M650,525 L680,525 L680,600 L650,600 Z" 
            @click="selectRegion('ulsan')"
            @mouseover="hoverRegion('ulsan')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'ulsan',
              'region-correct': correctRegion === 'ulsan',
              'region-wrong': wrongRegion === 'ulsan',
              'region-hover': hoveredRegion === 'ulsan'
            }"
          />
          
          <!-- 부산 -->
          <path 
            id="busan" 
            d="M650,600 L680,600 L680,640 L650,640 Z" 
            @click="selectRegion('busan')"
            @mouseover="hoverRegion('busan')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'busan',
              'region-correct': correctRegion === 'busan',
              'region-wrong': wrongRegion === 'busan',
              'region-hover': hoveredRegion === 'busan'
            }"
          />
          
          <!-- 제주도 -->
          <path 
            id="jeju" 
            d="M300,800 L400,800 L400,850 L300,850 Z" 
            @click="selectRegion('jeju')"
            @mouseover="hoverRegion('jeju')"
            @mouseout="clearHover"
            :class="{
              'region': true,
              'region-selectable': !disabled,
              'region-selected': selectedRegion === 'jeju',
              'region-correct': correctRegion === 'jeju',
              'region-wrong': wrongRegion === 'jeju',
              'region-hover': hoveredRegion === 'jeju'
            }"
          />
          
          <!-- 지역명 텍스트 -->
          <g v-if="showRegionNames">
            <text x="409" y="250" class="region-name" text-anchor="middle">서울</text>
            <text x="380" y="260" class="region-name" text-anchor="middle">경기</text>
            <text x="255" y="265" class="region-name" text-anchor="middle">인천</text>
            <text x="520" y="250" class="region-name" text-anchor="middle">강원</text>
            <text x="450" y="450" class="region-name" text-anchor="middle">충북</text>
            <text x="330" y="450" class="region-name" text-anchor="middle">충남</text>
            <text x="390" y="550" class="region-name" text-anchor="middle">대전</text>
            <text x="580" y="470" class="region-name" text-anchor="middle">경북</text>
            <text x="507" y="620" class="region-name" text-anchor="middle">대구</text>
            <text x="580" y="620" class="region-name" text-anchor="middle">경남</text>
            <text x="350" y="600" class="region-name" text-anchor="middle">전북</text>
            <text x="380" y="670" class="region-name" text-anchor="middle">광주</text>
            <text x="350" y="720" class="region-name" text-anchor="middle">전남</text>
            <text x="665" y="570" class="region-name" text-anchor="middle">울산</text>
            <text x="665" y="620" class="region-name" text-anchor="middle">부산</text>
            <text x="350" y="825" class="region-name" text-anchor="middle">제주</text>
          </g>
        </svg>
      </div>
      
      <div v-if="selectedRegion && !disabled" class="spot-button-container">
        <button class="spot-button" @click="submitGuess">
          <i class="fas fa-location-arrow"></i> Spot!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
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
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      isPanning: false,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      isMapOpen: false,
      isMobile: false
    };
  },

  mounted() {
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.checkScreenSize);
  },
  
  methods: {
    selectRegion(region) {
      if (this.disabled) return;
      this.$emit('update:selectedRegion', region);
    },
    
    hoverRegion(region) {
      if (this.disabled) return;
      this.hoveredRegion = region;
    },
    
    clearHover() {
      this.hoveredRegion = null;
    },
    
    reset() {
      this.$emit('update:selectedRegion', null);
    },
    
    getRegionName(regionCode) {
      const regionNames = {
        'seoul': '서울',
        'gyeonggi': '경기도',
        'incheon': '인천',
        'gangwon': '강원도',
        'chungbuk': '충청북도',
        'chungnam': '충청남도',
        'daejeon': '대전',
        'jeonbuk': '전라북도',
        'gwangju': '광주',
        'jeonnam': '전라남도',
        'gyeongbuk': '경상북도',
        'daegu': '대구',
        'gyeongnam': '경상남도',
        'ulsan': '울산',
        'busan': '부산',
        'jeju': '제주도'
      };
      
      return regionNames[regionCode] || regionCode;
    },

    submitGuess() {
      if (!this.selectedRegion || this.disabled) return;
      this.$emit('submit-guess', this.selectedRegion);
    },

    // 줌 기능
    zoomIn() {
      if (this.zoomLevel < 2.5) {
        this.zoomLevel += 0.2;
      }
    },

    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel -= 0.2;
      }
    },

    resetZoom() {
      this.zoomLevel = 1;
      this.panX = 0;
      this.panY = 0;
    },

    // 휠로 줌 기능
    handleWheel(e) {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    },

    // 드래그로 팬 기능
    startPan(e) {
      this.isPanning = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.lastX = this.panX;
      this.lastY = this.panY;
    },

    pan(e) {
      if (!this.isPanning) return;
      const dx = (e.clientX - this.startX) / this.zoomLevel;
      const dy = (e.clientY - this.startY) / this.zoomLevel;
      this.panX = this.lastX + dx;
      this.panY = this.lastY + dy;
    },

    endPan() {
      this.isPanning = false;
    },

    // 터치로 팬 기능
    startPanTouch(e) {
      if (e.touches.length === 1) {
        this.isPanning = true;
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.lastX = this.panX;
        this.lastY = this.panY;
      }
    },

    panTouch(e) {
      if (!this.isPanning || e.touches.length !== 1) return;
      const dx = (e.touches[0].clientX - this.startX) / this.zoomLevel;
      const dy = (e.touches[0].clientY - this.startY) / this.zoomLevel;
      this.panX = this.lastX + dx;
      this.panY = this.lastY + dy;
      e.preventDefault(); // 스크롤 방지
    },

    endPanTouch() {
      this.isPanning = false;
    },

    // 모바일 옵션
    toggleMap() {
      this.isMapOpen = !this.isMapOpen;
    },

    checkScreenSize() {
      this.isMobile = window.innerWidth < 768;
      if (!this.isMobile) {
        this.isMapOpen = true;
      }
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
  touch-action: none; /* 모바일에서 브라우저 기본 동작 방지 */
}

.region-map {
  width: 100%;
  height: 100%;
  max-height: 80vh;
  transform-origin: center;
  transition: transform 0.1s ease;
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

.region {
  fill: #e2e8f0;
  stroke: #cbd5e1;
  stroke-width: 2;
  transition: all 0.2s ease;
  opacity: 0.9;
}

.region-selectable {
  cursor: pointer;
}

.region-selectable:hover {
  fill: #93c5fd;
  opacity: 1;
}

.region-selected {
  fill: #3b82f6;
  stroke: #1d4ed8;
  stroke-width: 3;
  opacity: 1;
}

.region-hover {
  fill: #93c5fd;
  stroke: #60a5fa;
  stroke-width: 2.5;
  opacity: 1;
}

.region-correct {
  fill: #10b981;
  stroke: #059669;
  stroke-width: 3;
  opacity: 1;
  transform: translateZ(5px);
  transform-style: preserve-3d;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.region-wrong {
  fill: #ef4444;
  stroke: #b91c1c;
  stroke-width: 3;
  opacity: 1;
  transform: translateZ(5px);
  transform-style: preserve-3d;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.region-name {
  font-size: 14px;
  font-weight: 600;
  fill: #475569;
  pointer-events: none;
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

@keyframes pulse {
  0% {
    filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.8));
  }
  100% {
    filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.5));
  }
}

@keyframes shake {
  0%, 100% { transform: translateZ(5px); }
  25% { transform: translateZ(5px) translateX(-5px); }
  50% { transform: translateZ(5px) translateX(5px); }
  75% { transform: translateZ(5px) translateX(-5px); }
}
</style> 