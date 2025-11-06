<template>
  <div class="game-mode-toggle-manager">
    <div class="header-section">
      <h2 class="section-title">🎮 게임 모드 관리</h2>
      <p class="section-description">각 게임 모드를 활성화하거나 비활성화할 수 있습니다.</p>
    </div>

    <div class="modes-grid">
      <div 
        v-for="mode in gameModes" 
        :key="mode.id"
        class="mode-card"
        :class="{ 'active': mode.isActive }"
      >
        <div class="mode-header">
          <div class="mode-icon" :class="getIconClass(mode.id)">
            <i class="fas" :class="mode.icon"></i>
          </div>
          <div class="mode-info">
            <h3>{{ mode.name }}</h3>
            <p>{{ mode.description }}</p>
          </div>
        </div>

        <div class="mode-controls">
          <div class="status-badge" :class="mode.isActive ? 'active' : 'inactive'">
            {{ mode.isActive ? '활성화' : '비활성화' }}
          </div>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              :checked="mode.isActive"
              @change="toggleMode(mode)"
              :disabled="loading"
            >
            <span class="slider"></span>
          </label>
        </div>

        <div class="mode-stats">
          <div class="stat-item">
            <span class="stat-label">일일 플레이어</span>
            <span class="stat-value">{{ mode.stats.dailyPlayers }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">평균 점수</span>
            <span class="stat-value">{{ mode.stats.averageScore }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 모드별 일괄 제어 -->
    <div class="mode-group-controls">
      <h3>모드별 일괄 제어</h3>
      <div class="mode-groups-grid">
        <!-- 로드뷰 제어 -->
        <div class="mode-group-card">
          <div class="mode-group-header">
            <i class="fas fa-street-view"></i>
            <h4>로드뷰</h4>
          </div>
          <div class="mode-group-buttons">
            <button 
              @click="toggleModeGroup('ROADVIEW', true)" 
              :disabled="loading || isAllRoadviewActive"
              class="group-btn enable-btn"
            >
              <i class="fas fa-check"></i>
              활성화
            </button>
            <button 
              @click="toggleModeGroup('ROADVIEW', false)" 
              :disabled="loading || isAllRoadviewInactive"
              class="group-btn disable-btn"
            >
              <i class="fas fa-times"></i>
              비활성화
            </button>
          </div>
        </div>

        <!-- 포토 제어 -->
        <div class="mode-group-card">
          <div class="mode-group-header">
            <i class="fas fa-camera"></i>
            <h4>포토</h4>
          </div>
          <div class="mode-group-buttons">
            <button 
              @click="toggleModeGroup('PHOTO', true)" 
              :disabled="loading || isAllPhotoActive"
              class="group-btn enable-btn"
            >
              <i class="fas fa-check"></i>
              활성화
            </button>
            <button 
              @click="toggleModeGroup('PHOTO', false)" 
              :disabled="loading || isAllPhotoInactive"
              class="group-btn disable-btn"
            >
              <i class="fas fa-times"></i>
              비활성화
            </button>
          </div>
        </div>

        <!-- 멀티플레이어 제어 -->
        <div class="mode-group-card">
          <div class="mode-group-header">
            <i class="fas fa-users"></i>
            <h4>멀티플레이어</h4>
          </div>
          <div class="mode-group-buttons">
            <button 
              @click="toggleModeGroup('MULTIPLAYER', true)" 
              :disabled="loading || isAllMultiplayerActive"
              class="group-btn enable-btn"
            >
              <i class="fas fa-check"></i>
              활성화
            </button>
            <button 
              @click="toggleModeGroup('MULTIPLAYER', false)" 
              :disabled="loading || isAllMultiplayerInactive"
              class="group-btn disable-btn"
            >
              <i class="fas fa-times"></i>
              비활성화
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 전체 일괄 제어 -->
    <div class="bulk-controls">
      <h3>전체 일괄 제어</h3>
      <div class="bulk-buttons">
        <button 
          @click="enableAllModes" 
          :disabled="loading"
          class="bulk-btn enable-all"
        >
          <i class="fas fa-check-circle"></i>
          모든 모드 활성화
        </button>
        <button 
          @click="disableAllModes" 
          :disabled="loading"
          class="bulk-btn disable-all"
        >
          <i class="fas fa-ban"></i>
          모든 모드 비활성화
        </button>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>처리 중...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { gameConfigAdminService } from '@/features/admin/services/gameConfigAdmin.service.js'

const emit = defineEmits(['toggle-mode'])

const loading = ref(false)

// 게임 모드 데이터
const gameModes = ref([])

// 게임 설정 목록 로드
const loadGameConfigs = async () => {
  try {
    const configs = await gameConfigAdminService.getConfigs()
    
    // 백엔드 데이터를 프론트엔드 형식으로 변환
    gameModes.value = configs.map(config => ({
      id: config.id,
      name: getModeDisplayName(config),
      description: config.description || getModeDescription(config),
      icon: getModeIcon(config.gameMode),
      isActive: config.isActive,
      gameMode: config.gameMode,
      stats: {
        dailyPlayers: 0,
        averageScore: 0
      }
    }))
  } catch (error) {
    console.error('게임 설정 로드 실패:', error)
  }
}

// 모드 표시 이름 생성
const getModeDisplayName = (config) => {
  const modeNames = {
    ROADVIEW: '로드뷰',
    PHOTO: '포토'
  }
  const modeName = modeNames[config.gameMode] || config.gameMode
  
  if (config.isSingleMode) {
    return `싱글 ${modeName}`
  } else {
    const matchType = config.playerMatchType === 'SOLO' ? '개인전' : '팀전'
    return `멀티 ${modeName} - ${matchType}`
  }
}

// 모드 설명 생성
const getModeDescription = (config) => {
  const desc = {
    ROADVIEW: '실제 거리를 둘러보며 위치를 맞추는 게임',
    PHOTO: '관광지 사진으로 지역을 맞히는 게임'
  }
  return desc[config.gameMode] || ''
}

// 모드 아이콘 가져오기
const getModeIcon = (gameMode) => {
  const icons = {
    ROADVIEW: 'fa-street-view',
    PHOTO: 'fa-camera'
  }
  return icons[gameMode] || 'fa-gamepad'
}

// 모드 토글
const toggleMode = async (mode) => {
  try {
    loading.value = true
    
    if (mode.isActive) {
      await gameConfigAdminService.deactivateConfig(mode.id)
    } else {
      await gameConfigAdminService.activateConfig(mode.id)
    }
    
    mode.isActive = !mode.isActive
    emit('toggle-mode', mode)
    
    console.log(`${mode.name}이(가) ${mode.isActive ? '활성화' : '비활성화'}되었습니다.`)
  } catch (error) {
    console.error('모드 토글 실패:', error)
  } finally {
    loading.value = false
  }
}

// 모든 모드 활성화
const enableAllModes = async () => {
  try {
    loading.value = true
    
    for (const mode of gameModes.value) {
      if (!mode.isActive) {
        await gameConfigAdminService.activateConfig(mode.id)
        mode.isActive = true
      }
    }
    
    console.log('모든 게임 모드가 활성화되었습니다.')
  } catch (error) {
    console.error('일괄 활성화 실패:', error)
  } finally {
    loading.value = false
  }
}

// 모든 모드 비활성화
const disableAllModes = async () => {
  try {
    loading.value = true
    
    for (const mode of gameModes.value) {
      if (mode.isActive) {
        await gameConfigAdminService.deactivateConfig(mode.id)
        mode.isActive = false
      }
    }
    
    console.log('모든 게임 모드가 비활성화되었습니다.')
  } catch (error) {
    console.error('일괄 비활성화 실패:', error)
  } finally {
    loading.value = false
  }
}

// 모드 그룹별 활성화/비활성화
const toggleModeGroup = async (groupType, activate) => {
  try {
    loading.value = true
    
    let targetModes = []
    
    if (groupType === 'ROADVIEW') {
      // 로드뷰 모드 (싱글 + 멀티 모두)
      targetModes = gameModes.value.filter(m => m.gameMode === 'ROADVIEW')
    } else if (groupType === 'PHOTO') {
      // 포토 모드 (싱글 + 멀티 모두)
      targetModes = gameModes.value.filter(m => m.gameMode === 'PHOTO')
    } else if (groupType === 'MULTIPLAYER') {
      // 멀티플레이어 모드 (모든 멀티 모드)
      targetModes = gameModes.value.filter(m => !m.isSingleMode)
    }
    
    for (const mode of targetModes) {
      if (activate && !mode.isActive) {
        await gameConfigAdminService.activateConfig(mode.id)
        mode.isActive = true
      } else if (!activate && mode.isActive) {
        await gameConfigAdminService.deactivateConfig(mode.id)
        mode.isActive = false
      }
    }
    
    const groupName = groupType === 'ROADVIEW' ? '로드뷰' : groupType === 'PHOTO' ? '포토' : '멀티플레이어'
    console.log(`${groupName} 모드가 ${activate ? '활성화' : '비활성화'}되었습니다.`)
  } catch (error) {
    console.error('모드 그룹 토글 실패:', error)
  } finally {
    loading.value = false
  }
}

// Computed: 로드뷰 모드 상태
const isAllRoadviewActive = computed(() => {
  const roadviewModes = gameModes.value.filter(m => m.gameMode === 'ROADVIEW')
  return roadviewModes.length > 0 && roadviewModes.every(m => m.isActive)
})

const isAllRoadviewInactive = computed(() => {
  const roadviewModes = gameModes.value.filter(m => m.gameMode === 'ROADVIEW')
  return roadviewModes.length > 0 && roadviewModes.every(m => !m.isActive)
})

// Computed: 포토 모드 상태
const isAllPhotoActive = computed(() => {
  const photoModes = gameModes.value.filter(m => m.gameMode === 'PHOTO')
  return photoModes.length > 0 && photoModes.every(m => m.isActive)
})

const isAllPhotoInactive = computed(() => {
  const photoModes = gameModes.value.filter(m => m.gameMode === 'PHOTO')
  return photoModes.length > 0 && photoModes.every(m => !m.isActive)
})

// Computed: 멀티플레이어 모드 상태
const isAllMultiplayerActive = computed(() => {
  const multiplayerModes = gameModes.value.filter(m => !m.isSingleMode)
  return multiplayerModes.length > 0 && multiplayerModes.every(m => m.isActive)
})

const isAllMultiplayerInactive = computed(() => {
  const multiplayerModes = gameModes.value.filter(m => !m.isSingleMode)
  return multiplayerModes.length > 0 && multiplayerModes.every(m => !m.isActive)
})

// 아이콘 클래스 가져오기
const getIconClass = (modeId) => {
  const mode = gameModes.value.find(m => m.id === modeId)
  if (!mode) return 'bg-gray-100 text-gray-600'
  
  const classes = {
    ROADVIEW: 'bg-blue-100 text-blue-600',
    PHOTO: 'bg-green-100 text-green-600'
  }
  return classes[mode.gameMode] || 'bg-gray-100 text-gray-600'
}

onMounted(() => {
  loadGameConfigs()
})
</script>

<style scoped>
.game-mode-toggle-manager {
  position: relative;
}

.header-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #6b7280;
  font-size: 0.95rem;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.mode-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.mode-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.mode-card.active {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.mode-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.mode-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.mode-info p {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
}

.mode-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
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
  transition: 0.4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.mode-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.mode-group-controls {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}

.mode-group-controls h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.mode-groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.mode-group-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.mode-group-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.mode-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mode-group-header i {
  font-size: 1.2rem;
  color: #667eea;
}

.mode-group-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.mode-group-buttons {
  display: flex;
  gap: 0.5rem;
}

.group-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.group-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.enable-btn {
  background: #10b981;
  color: white;
}

.enable-btn:hover:not(:disabled) {
  background: #059669;
}

.disable-btn {
  background: #f87171;
  color: white;
}

.disable-btn:hover:not(:disabled) {
  background: #ef4444;
}

.group-btn i {
  font-size: 0.75rem;
}

.bulk-controls {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.bulk-controls h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.bulk-buttons {
  display: flex;
  gap: 1rem;
}

.bulk-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.bulk-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.enable-all {
  background: #10b981;
  color: white;
}

.enable-all:hover:not(:disabled) {
  background: #059669;
}

.disable-all {
  background: #f87171;
  color: white;
}

.disable-all:hover:not(:disabled) {
  background: #ef4444;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.loading-spinner i {
  font-size: 2rem;
}

@media (max-width: 768px) {
  .modes-grid {
    grid-template-columns: 1fr;
  }
  
  .bulk-buttons {
    flex-direction: column;
  }
}
</style> 