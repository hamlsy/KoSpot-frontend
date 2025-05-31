<template>
  <div class="game-mode-settings">
    <h2 class="text-2xl font-bold mb-6">게임 모드 설정</h2>
    
    <!-- 탭 네비게이션 -->
    <div class="tabs mb-6">
      <button 
        @click="activeTab = 'roadview'" 
        class="tab-button" 
        :class="{ 'active': activeTab === 'roadview' }"
      >
        로드뷰 모드 설정
      </button>
      <button 
        @click="activeTab = 'theme'" 
        class="tab-button" 
        :class="{ 'active': activeTab === 'theme' }"
      >
        테마 모드 설정
      </button>
      <button 
        @click="activeTab = 'photo'" 
        class="tab-button" 
        :class="{ 'active': activeTab === 'photo' }"
      >
        포토 모드 설정
      </button>
    </div>
    
    <!-- 로드뷰 모드 설정 -->
    <div v-if="activeTab === 'roadview'" class="mode-settings-content">
      <RoadviewModeSettings />
    </div>
    
    <!-- 테마 모드 설정 -->
    <div v-if="activeTab === 'theme'" class="mode-settings-content">
      <ThemeModeSettings />
    </div>
    
    <!-- 포토 모드 설정 -->
    <div v-if="activeTab === 'photo'" class="mode-settings-content">
      <PhotoModeSettings />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import RoadviewModeSettings from './game-settings/RoadviewModeSettings.vue';
import ThemeModeSettings from './game-settings/ThemeModeSettings.vue';
import PhotoModeSettings from './game-settings/PhotoModeSettings.vue';

export default {
  name: 'GameModeSettings',
  components: {
    RoadviewModeSettings,
    ThemeModeSettings,
    PhotoModeSettings
  },
  setup() {
    const activeTab = ref('roadview');
    
    return {
      activeTab
    };
  }
}
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
