<template>
  <div class="game-mode-settings">
    <!-- 탭 네비게이션 -->
    <div class="tabs-container mb-4 border-b border-gray-200">
      <div class="flex overflow-x-auto">
        <button 
          @click="activeTab = 'roadview'" 
          class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
          :class="activeTab === 'roadview' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
        >
          <i class="fas fa-street-view mr-2"></i>
          <span>로드뷰 모드 설정</span>
          <div 
            v-if="activeTab === 'roadview'" 
            class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
          ></div>
        </button>
        <button 
          @click="activeTab = 'theme'" 
          class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
          :class="activeTab === 'theme' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
        >
          <i class="fas fa-map-marked-alt mr-2"></i>
          <span>테마 모드 설정</span>
          <div 
            v-if="activeTab === 'theme'" 
            class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
          ></div>
        </button>
        <button 
          @click="activeTab = 'photo'" 
          class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
          :class="activeTab === 'photo' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
        >
          <i class="fas fa-camera mr-2"></i>
          <span>포토 모드 설정</span>
          <div 
            v-if="activeTab === 'photo'" 
            class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
          ></div>
        </button>
      </div>
    </div>
    
    <!-- 설정 컴포넌트 -->
    <div class="settings-content">
      <RoadviewModeSettings 
        v-if="activeTab === 'roadview'" 
        :game-mode="activeTab"
        @settings-change="handleSettingsChange"
      />
      <ThemeModeSettings 
        v-else-if="activeTab === 'theme'" 
        :game-mode="activeTab"
        @settings-change="handleSettingsChange"
      />
      <PhotoModeSettings 
        v-else-if="activeTab === 'photo'" 
        :game-mode="activeTab"
        @settings-change="handleSettingsChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import RoadviewModeSettings from './game-settings/RoadviewModeSettings.vue';
import ThemeModeSettings from './game-settings/ThemeModeSettings.vue';
import PhotoModeSettings from './game-settings/PhotoModeSettings.vue';

// Props 정의
const props = defineProps({
  gameMode: {
    type: Object,
    required: true
  }
});

// Emits 정의
const emit = defineEmits(['settings-change']);

// 활성 탭 상태 관리
const activeTab = ref('roadview');

// 게임 모드 ID에 따라 초기 탭 설정
onMounted(() => {
  if (props.gameMode) {
    switch(props.gameMode.id) {
      case 'roadview':
        activeTab.value = 'roadview';
        break;
      case 'photo':
        activeTab.value = 'photo';
        break;
      case 'theme':
      case 'special':
        activeTab.value = 'theme';
        break;
      default:
        activeTab.value = 'roadview';
    }
  }
});

// 설정 변경 처리 함수
const handleSettingsChange = (mode, settings) => {
  console.log(`${mode} 모드 설정 변경:`, settings);
  // 상위 컴포넌트에 변경 사항 알림
  emit('settings-change', mode, settings);
};

</script>

<style scoped>
.game-mode-settings {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 24px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  overflow-x: auto;
}

.tab-button {
  padding: 12px 20px;
  margin-right: 4px;
  font-weight: 500;
  color: #64748b;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.tab-button:hover {
  color: #3b82f6;
}

.tab-button.active {
  color: #3b82f6;
  font-weight: 600;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #3b82f6;
}

.mode-settings-content {
  padding-top: 24px;
}
</style>
