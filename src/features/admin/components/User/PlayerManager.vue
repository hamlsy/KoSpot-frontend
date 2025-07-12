<template>
  <div class="player-manager">
    <div class="header-section">
      <h2 class="section-title">👥 플레이어 관리</h2>
      <p class="section-description">현재 접속 중이거나 플레이 중인 플레이어들을 확인할 수 있습니다.</p>
    </div>

    <!-- 실시간 통계 -->
    <div class="stats-grid">
      <div class="stat-card online">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <h3>{{ onlineStats.total }}</h3>
          <p>전체 접속자</p>
        </div>
      </div>
      <div class="stat-card playing">
        <div class="stat-icon">
          <i class="fas fa-gamepad"></i>
        </div>
        <div class="stat-info">
          <h3>{{ onlineStats.playing }}</h3>
          <p>게임 플레이 중</p>
        </div>
      </div>
      <div class="stat-card lobby">
        <div class="stat-icon">
          <i class="fas fa-home"></i>
        </div>
        <div class="stat-info">
          <h3>{{ onlineStats.lobby }}</h3>
          <p>로비 대기 중</p>
        </div>
      </div>
      <div class="stat-card waiting">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <h3>{{ onlineStats.waiting }}</h3>
          <p>매칭 대기 중</p>
        </div>
      </div>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <button 
        @click="activeTab = 'online'"
        :class="{ active: activeTab === 'online' }"
        class="tab-btn"
      >
        <i class="fas fa-circle" style="color: #10b981;"></i>
        접속 중 플레이어
      </button>
      <button 
        @click="activeTab = 'playing'"
        :class="{ active: activeTab === 'playing' }"
        class="tab-btn"
      >
        <i class="fas fa-gamepad"></i>
        플레이 중 플레이어
      </button>
      <button 
        @click="activeTab = 'rooms'"
        :class="{ active: activeTab === 'rooms' }"
        class="tab-btn"
      >
        <i class="fas fa-door-open"></i>
        활성 룸 목록
      </button>
    </div>

    <!-- 접속 중 플레이어 -->
    <div v-if="activeTab === 'online'" class="players-section">
      <div class="section-controls">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="플레이어 이름으로 검색..."
          class="search-input"
        />
        <button @click="refreshOnlinePlayers" class="refresh-btn">
          <i class="fas fa-sync-alt"></i>
          새로고침
        </button>
      </div>

      <div class="players-table">
        <div class="table-header">
          <div class="col-name">플레이어</div>
          <div class="col-status">상태</div>
          <div class="col-location">위치</div>
          <div class="col-time">접속 시간</div>
          <div class="col-actions">작업</div>
        </div>
        <div class="table-body">
          <div 
            v-for="player in filteredOnlinePlayers" 
            :key="player.id"
            class="table-row"
          >
            <div class="col-name">
              <div class="player-info">
                <div class="player-avatar">
                  <img :src="player.avatar || '/default-avatar.png'" :alt="player.nickname" />
                </div>
                <div class="player-details">
                  <span class="nickname">{{ player.nickname }}</span>
                  <span class="user-id">ID: {{ player.id }}</span>
                </div>
              </div>
            </div>
            <div class="col-status">
              <span class="status-badge" :class="player.status">
                {{ getStatusLabel(player.status) }}
              </span>
            </div>
            <div class="col-location">{{ player.currentLocation }}</div>
            <div class="col-time">{{ formatTime(player.connectedAt) }}</div>
            <div class="col-actions">
              <button @click="kickPlayer(player.id)" class="kick-btn">
                <i class="fas fa-sign-out-alt"></i>
                추방
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 플레이 중 플레이어 -->
    <div v-if="activeTab === 'playing'" class="games-section">
      <div class="games-grid">
        <div 
          v-for="game in activeGames" 
          :key="game.id"
          class="game-card"
        >
          <div class="game-header">
            <h3>{{ game.mode }} - {{ game.type }}</h3>
            <span class="game-status">진행 중</span>
          </div>
          <div class="game-info">
            <div class="game-detail">
              <span class="label">방 ID:</span>
              <span class="value">{{ game.roomId }}</span>
            </div>
            <div class="game-detail">
              <span class="label">라운드:</span>
              <span class="value">{{ game.currentRound }}/{{ game.totalRounds }}</span>
            </div>
            <div class="game-detail">
              <span class="label">시작 시간:</span>
              <span class="value">{{ formatTime(game.startedAt) }}</span>
            </div>
          </div>
          <div class="players-list">
            <h4>참여 플레이어 ({{ game.players.length }}명)</h4>
            <div class="player-chips">
              <span 
                v-for="player in game.players" 
                :key="player.id"
                class="player-chip"
              >
                {{ player.nickname }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 활성 룸 목록 -->
    <div v-if="activeTab === 'rooms'" class="rooms-section">
      <div class="rooms-table">
        <div class="table-header">
          <div class="col-room">룸 정보</div>
          <div class="col-mode">게임 모드</div>
          <div class="col-players">플레이어</div>
          <div class="col-status">상태</div>
          <div class="col-actions">작업</div>
        </div>
        <div class="table-body">
          <div 
            v-for="room in activeRooms" 
            :key="room.id"
            class="table-row"
          >
            <div class="col-room">
              <div class="room-info">
                <h4>{{ room.name }}</h4>
                <span class="room-id">ID: {{ room.id }}</span>
              </div>
            </div>
            <div class="col-mode">
              <span class="mode-badge" :class="room.mode">
                {{ getModeLabel(room.mode) }}
              </span>
            </div>
            <div class="col-players">
              {{ room.currentPlayers }}/{{ room.maxPlayers }}
            </div>
            <div class="col-status">
              <span class="room-status" :class="room.status">
                {{ getRoomStatusLabel(room.status) }}
              </span>
            </div>
            <div class="col-actions">
              <button @click="closeRoom(room.id)" class="close-room-btn">
                <i class="fas fa-times"></i>
                강제 종료
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>로딩 중...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import apiClient from '@/core/api/apiClient.js'

const activeTab = ref('online')
const loading = ref(false)
const searchQuery = ref('')

// 실시간 통계
const onlineStats = reactive({
  total: 0,
  playing: 0,
  lobby: 0,
  waiting: 0
})

// 플레이어 데이터
const onlinePlayers = ref([])
const activeGames = ref([])
const activeRooms = ref([])

// 필터링된 접속 플레이어
const filteredOnlinePlayers = computed(() => {
  if (!searchQuery.value) return onlinePlayers.value
  
  return onlinePlayers.value.filter(player => 
    player.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 상태 라벨 가져오기
const getStatusLabel = (status) => {
  const labels = {
    online: '온라인',
    playing: '게임 중',
    lobby: '로비',
    waiting: '대기 중'
  }
  return labels[status] || status
}

// 게임 모드 라벨 가져오기
const getModeLabel = (mode) => {
  const labels = {
    roadview: '로드뷰',
    photo: '포토',
    multiplayer: '멀티플레이어'
  }
  return labels[mode] || mode
}

// 룸 상태 라벨 가져오기
const getRoomStatusLabel = (status) => {
  const labels = {
    waiting: '대기 중',
    playing: '게임 중',
    finished: '종료'
  }
  return labels[status] || status
}

// 시간 포맷팅
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '방금 전'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
  
  return date.toLocaleDateString()
}

// 접속 플레이어 새로고침
const refreshOnlinePlayers = async () => {
  await loadOnlinePlayers()
}

// 플레이어 추방
const kickPlayer = async (playerId) => {
  if (!confirm('정말로 이 플레이어를 추방하시겠습니까?')) return

  try {
    loading.value = true
    
    const response = await apiClient.post(`/admin/players/${playerId}/kick`)
    
    if (response.data.isSuccess) {
      console.log('플레이어가 추방되었습니다.')
      await loadOnlinePlayers()
    }
  } catch (error) {
    console.error('플레이어 추방 실패:', error)
  } finally {
    loading.value = false
  }
}

// 룸 강제 종료
const closeRoom = async (roomId) => {
  if (!confirm('정말로 이 룸을 강제 종료하시겠습니까?')) return

  try {
    loading.value = true
    
    const response = await apiClient.post(`/admin/rooms/${roomId}/close`)
    
    if (response.data.isSuccess) {
      console.log('룸이 강제 종료되었습니다.')
      await loadActiveRooms()
    }
  } catch (error) {
    console.error('룸 강제 종료 실패:', error)
  } finally {
    loading.value = false
  }
}

// 데이터 로드 함수들
const loadOnlineStats = async () => {
  try {
    const response = await apiClient.get('/admin/players/stats')
    
    if (response.data.isSuccess) {
      Object.assign(onlineStats, response.data.result)
    }
  } catch (error) {
    console.error('온라인 통계 로드 실패:', error)
  }
}

const loadOnlinePlayers = async () => {
  try {
    const response = await apiClient.get('/admin/players/online')
    
    if (response.data.isSuccess) {
      onlinePlayers.value = response.data.result
    }
  } catch (error) {
    console.error('접속 플레이어 로드 실패:', error)
  }
}

const loadActiveGames = async () => {
  try {
    const response = await apiClient.get('/admin/games/active')
    
    if (response.data.isSuccess) {
      activeGames.value = response.data.result
    }
  } catch (error) {
    console.error('활성 게임 로드 실패:', error)
  }
}

const loadActiveRooms = async () => {
  try {
    const response = await apiClient.get('/admin/rooms/active')
    
    if (response.data.isSuccess) {
      activeRooms.value = response.data.result
    }
  } catch (error) {
    console.error('활성 룸 로드 실패:', error)
  }
}

// 실시간 업데이트를 위한 인터벌
let updateInterval = null

onMounted(() => {
  // 초기 데이터 로드
  loadOnlineStats()
  loadOnlinePlayers()
  loadActiveGames()
  loadActiveRooms()
  
  // 30초마다 데이터 업데이트
  updateInterval = setInterval(() => {
    loadOnlineStats()
    if (activeTab.value === 'online') loadOnlinePlayers()
    if (activeTab.value === 'playing') loadActiveGames()
    if (activeTab.value === 'rooms') loadActiveRooms()
  }, 30000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style scoped>
.player-manager {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.stat-card.online .stat-icon {
  background: #10b981;
}

.stat-card.playing .stat-icon {
  background: #3b82f6;
}

.stat-card.lobby .stat-icon {
  background: #f59e0b;
}

.stat-card.waiting .stat-icon {
  background: #6b7280;
}

.stat-info h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.stat-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

.tab-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6b7280;
}

.tab-btn:hover {
  color: #4f46e5;
}

.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.section-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.refresh-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.players-table,
.rooms-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.table-header,
.table-row {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
}

.players-table .table-header,
.players-table .table-row {
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
}

.rooms-table .table-header,
.rooms-table .table-row {
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
}

.table-header {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.table-row {
  border-bottom: 1px solid #f3f4f6;
}

.table-row:hover {
  background: #f8fafc;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  overflow: hidden;
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-details {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-weight: 600;
  color: #1f2937;
}

.user-id {
  font-size: 0.8rem;
  color: #6b7280;
}

.status-badge,
.mode-badge,
.room-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.online {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.playing {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.lobby {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.waiting {
  background: #f3f4f6;
  color: #6b7280;
}

.kick-btn,
.close-room-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.kick-btn:hover,
.close-room-btn:hover {
  background: #dc2626;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.game-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.game-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.game-status {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.game-info {
  margin-bottom: 1rem;
}

.game-detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.game-detail .label {
  color: #6b7280;
  font-size: 0.9rem;
}

.game-detail .value {
  color: #1f2937;
  font-weight: 500;
  font-size: 0.9rem;
}

.players-list h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.player-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.player-chip {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.room-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.room-id {
  font-size: 0.8rem;
  color: #6b7280;
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

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .section-controls {
    flex-direction: column;
  }
  
  .games-grid {
    grid-template-columns: 1fr;
  }
}
</style> 