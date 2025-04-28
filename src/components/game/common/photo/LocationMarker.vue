<template>
  <div class="location-marker">
    <div class="marker-container">
      <div class="marker-pin" :style="{ backgroundColor: color || '#7f5af0' }"></div>
      <div class="marker-pulse" :style="{ 
        backgroundColor: color || '#7f5af0', 
        boxShadow: `0 0 0 rgba(${rgbaColor}, 0.4)` 
      }"></div>
    </div>
    
    <div v-if="showLabel" class="marker-label" :style="labelStyle">
      {{ label }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'LocationMarker',
  
  props: {
    // 마커 색상 (팀 색상 등)
    color: {
      type: String,
      default: '#7f5af0'
    },
    
    // 마커 라벨 (유저 이름이나 팀 이름 등)
    label: {
      type: String,
      default: ''
    },
    
    // 라벨 표시 여부
    showLabel: {
      type: Boolean,
      default: true
    },
    
    // 라벨 위치 (top, right, bottom, left)
    labelPosition: {
      type: String,
      default: 'bottom',
      validator: value => ['top', 'right', 'bottom', 'left'].includes(value)
    }
  },
  
  computed: {
    // 색상을 RGBA 형식으로 변환
    rgbaColor() {
      // 16진수 색상을 RGB로 변환
      if (this.color.startsWith('#')) {
        const hex = this.color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      }
      
      // RGB 또는 RGBA 형식이면 그대로 사용
      if (this.color.startsWith('rgb')) {
        const match = this.color.match(/\d+/g);
        if (match && match.length >= 3) {
          return `${match[0]}, ${match[1]}, ${match[2]}`;
        }
      }
      
      // 기본값 반환
      return '127, 90, 240';
    },
    
    // 라벨 위치에 따른 스타일
    labelStyle() {
      const style = {};
      
      switch (this.labelPosition) {
        case 'top':
          style.bottom = '100%';
          style.left = '50%';
          style.transform = 'translateX(-50%)';
          style.marginBottom = '5px';
          break;
        case 'right':
          style.left = '100%';
          style.top = '50%';
          style.transform = 'translateY(-50%)';
          style.marginLeft = '5px';
          break;
        case 'bottom':
          style.top = '100%';
          style.left = '50%';
          style.transform = 'translateX(-50%)';
          style.marginTop = '5px';
          break;
        case 'left':
          style.right = '100%';
          style.top = '50%';
          style.transform = 'translateY(-50%)';
          style.marginRight = '5px';
          break;
      }
      
      return style;
    }
  }
};
</script>

<style scoped>
.location-marker {
  position: relative;
  display: inline-block;
}

.marker-container {
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-pin {
  width: 20px;
  height: 20px;
  border-radius: 50% 50% 50% 0;
  background-color: v-bind('color');
  position: absolute;
  transform: rotate(-45deg);
  left: 50%;
  top: 50%;
  margin: -15px 0 0 -15px;
  animation-name: bounce;
  animation-duration: 1s;
  animation-fill-mode: both;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

.marker-pin:after {
  content: '';
  width: 10px;
  height: 10px;
  margin: 5px 0 0 5px;
  background-color: #1f1f33;
  position: absolute;
  border-radius: 50%;
}

.marker-pulse {
  background-color: v-bind('color');
  border-radius: 50%;
  height: 14px;
  width: 14px;
  position: absolute;
  left: 50%;
  top: 50%;
  margin: -7px 0 0 -7px;
  transform: rotateX(55deg);
  z-index: -2;
  animation: pulse 2s ease-out infinite;
}

.marker-label {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

@keyframes bounce {
  0% {
    transform: rotate(-45deg) translate(0, 0);
  }
  50% {
    transform: rotate(-45deg) translate(0, -5px);
  }
  100% {
    transform: rotate(-45deg) translate(0, 0);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: rotateX(55deg) scale(1);
    box-shadow: 0 0 0 0 rgba(v-bind('rgbaColor'), 0.7);
  }
  70% {
    opacity: 0.5;
    box-shadow: 0 0 0 10px rgba(v-bind('rgbaColor'), 0);
  }
  100% {
    opacity: 0;
    transform: rotateX(55deg) scale(1.5);
    box-shadow: 0 0 0 0 rgba(v-bind('rgbaColor'), 0);
  }
}
</style> 