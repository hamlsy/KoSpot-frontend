<template>
  <div class="game-mode-management bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="p-5 border-b border-gray-100">
      <h2 class="text-lg font-semibold text-gray-800">게임 모드 관리</h2>
    </div>
    <div class="game-modes-list p-4 flex flex-col gap-4">
      <div v-for="mode in gameModes" 
           :key="mode.id" 
           class="game-mode-item p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 flex justify-between items-center"
           :class="{'border-l-4': true, [getBorderClass(mode.id)]: true}">
        <div class="mode-info flex items-center">
          <div class="mode-icon w-12 h-12 rounded-lg flex items-center justify-center mr-4" 
               :class="getIconClass(mode.id)">
            <i class="fas" :class="mode.icon"></i>
          </div>
          <div class="mode-details">
            <h3 class="text-base font-medium text-gray-800">{{ mode.name }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ mode.description }}</p>
          </div>
        </div>
        <div class="mode-actions flex items-center gap-4">
          <div class="mode-status text-sm font-medium px-3 py-1 rounded-full" 
               :class="mode.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
            {{ mode.isActive ? '활성화' : '비활성화' }}
          </div>
          <div class="mode-toggle">
            <label class="switch">
              <input 
                type="checkbox" 
                :checked="mode.isActive" 
                @change="toggleGameMode(mode)"
              >
              <span class="slider round"></span>
            </label>
          </div>
          <button class="settings-btn w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                  @click="openModeSettings(mode)">
            <i class="fas fa-cog text-gray-500"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Props
const props = defineProps({
  initialGameModes: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['update:gameModes', 'toggleMode', 'openSettings']);

// Game modes data
const gameModes = ref(props.initialGameModes.length > 0 ? [...props.initialGameModes] : [
  {
    id: 'roadview',
    name: '로드뷰 모드',
    description: '실제 거리를 둘러보며 위치를 맞추는 게임',
    icon: 'fa-street-view',
    color: 'roadview-color',
    isActive: true
  },
  {
    id: 'photo',
    name: '포토 모드',
    description: '관광지 사진으로 지역을 맞히는 게임',
    icon: 'fa-camera',
    color: 'photo-color',
    isActive: true
  },
  {
    id: 'multiplayer',
    name: '멀티플레이어 모드',
    description: '다른 플레이어들과 함께 즐기는 게임',
    icon: 'fa-users',
    color: 'multiplayer-color',
    isActive: true
  },
  {
    id: 'special',
    name: '특별 이벤트 모드',
    description: '시즌별 특별 이벤트 게임',
    icon: 'fa-star',
    color: 'special-color',
    isActive: false
  }
]);

// Toggle game mode
const toggleGameMode = (mode) => {
  mode.isActive = !mode.isActive;
  emit('toggleMode', mode);
  emit('update:gameModes', gameModes.value);
};

// Open mode settings
const openModeSettings = (mode) => {
  emit('openSettings', mode);
};

// Get border class based on mode id
const getBorderClass = (modeId) => {
  switch(modeId) {
    case 'roadview':
      return 'border-blue-400';
    case 'photo':
      return 'border-green-400';
    case 'multiplayer':
      return 'border-amber-400';
    case 'special':
      return 'border-purple-400';
    default:
      return 'border-gray-400';
  }
};

// Get icon class based on mode id
const getIconClass = (modeId) => {
  switch(modeId) {
    case 'roadview':
      return 'bg-blue-100 text-blue-600';
    case 'photo':
      return 'bg-green-100 text-green-600';
    case 'multiplayer':
      return 'bg-amber-100 text-amber-600';
    case 'special':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};
</script>

<style scoped>
.game-mode-management {
  position: relative;
  overflow: hidden;
}

.game-mode-management::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, #60a5fa, #8b5cf6);
}

.game-mode-item {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.game-mode-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.mode-icon {
  transition: transform 0.3s ease;
}

.game-mode-item:hover .mode-icon {
  transform: scale(1.1);
}

/* Toggle Switch 스타일 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #10b981;
}

input:focus + .slider {
  box-shadow: 0 0 1px #10b981;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

@media (max-width: 768px) {
  .game-mode-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .mode-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
