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

    <!-- 일괄 제어 -->
    <div class="bulk-controls">
      <h3>일괄 제어</h3>
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
import { ref, reactive } from 'vue'
import apiClient from '@/core/api/apiClient.js'

const emit = defineEmits(['toggle-mode'])

const loading = ref(false)

// 게임 모드 데이터
const gameModes = reactive([
  {
    id: 'roadview',
    name: '로드뷰 모드',
    description: '실제 거리를 둘러보며 위치를 맞추는 게임',
    icon: 'fa-street-view',
    isActive: true,
    stats: {
      dailyPlayers: 1247,
      averageScore: 752
    }
  },
  {
    id: 'photo',
    name: '포토 모드',
    description: '관광지 사진으로 지역을 맞히는 게임',
    icon: 'fa-camera',
    isActive: true,
    stats: {
      dailyPlayers: 892,
      averageScore: 845
    }
  },
  {
    id: 'multiplayer',
    name: '멀티플레이어 모드',
    description: '다른 플레이어들과 함께 즐기는 게임',
    icon: 'fa-users',
    isActive: true,
    stats: {
      dailyPlayers: 634,
      averageScore: 698
    }
  }
])

// 모드 토글
const toggleMode = async (mode) => {
  try {
    loading.value = true
    
    // API 호출
    const response = await apiClient.post('/admin/game-modes/toggle', {
      modeId: mode.id,
      isActive: !mode.isActive
    })

    if (response.data.isSuccess) {
      mode.isActive = !mode.isActive
      emit('toggle-mode', mode)
      
      // 성공 알림
      console.log(`${mode.name}이(가) ${mode.isActive ? '활성화' : '비활성화'}되었습니다.`)
    }
  } catch (error) {
    console.error('모드 토글 실패:', error)
    // 에러 처리
  } finally {
    loading.value = false
  }
}

// 모든 모드 활성화
const enableAllModes = async () => {
  try {
    loading.value = true
    
    const response = await apiClient.post('/admin/game-modes/bulk-enable')
    
    if (response.data.isSuccess) {
      gameModes.forEach(mode => {
        mode.isActive = true
      })
      console.log('모든 게임 모드가 활성화되었습니다.')
    }
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
    
    const response = await apiClient.post('/admin/game-modes/bulk-disable')
    
    if (response.data.isSuccess) {
      gameModes.forEach(mode => {
        mode.isActive = false
      })
      console.log('모든 게임 모드가 비활성화되었습니다.')
    }
  } catch (error) {
    console.error('일괄 비활성화 실패:', error)
  } finally {
    loading.value = false
  }
}

// 아이콘 클래스 가져오기
const getIconClass = (modeId) => {
  const classes = {
    roadview: 'bg-blue-100 text-blue-600',
    photo: 'bg-green-100 text-green-600',
    multiplayer: 'bg-amber-100 text-amber-600'
  }
  return classes[modeId] || 'bg-gray-100 text-gray-600'
}
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