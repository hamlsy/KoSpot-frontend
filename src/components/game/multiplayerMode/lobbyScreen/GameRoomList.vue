<template>
  <div class="game-rooms-panel">
    <div class="panel-header">
      <h2 class="panel-title">게임 방 목록</h2>
      <div class="room-actions">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="방 이름 또는 지역 검색" 
            @input="filterRooms"
          />
          <i class="fas fa-search"></i>
        </div>
        <button class="refresh-button" @click="refreshRooms">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>
    
    <div class="room-filters">
      <div class="filter-group">
        <button 
          v-for="filter in modeFilters" 
          :key="filter.value"
          :class="{ active: selectedModeFilter === filter.value }"
          @click="setModeFilter(filter.value)"
          type="button"
        >
          <i :class="filter.icon" v-if="filter.icon"></i>
          {{ filter.label }}
        </button>
      </div>
      <div class="filter-group">
        <button 
          v-for="filter in statusFilters" 
          :key="filter.value"
          :class="{ active: selectedStatusFilter === filter.value }"
          @click="setStatusFilter(filter.value)"
          type="button"
        >
          <i :class="filter.icon" v-if="filter.icon"></i>
          {{ filter.label }}
        </button>
      </div>
    </div>
    
    <div class="rooms-container" v-if="filteredRooms.length > 0">
      <div 
        v-for="room in filteredRooms" 
        :key="room.id"
        class="room-card"
        :class="{ 'playing': room.status === 'playing' }"
      >
        <div class="room-header">
          <div class="room-info">
            <h3 class="room-name">{{ room.name }}</h3>
            <span class="room-host">방장: {{ room.host }}</span>
          </div>
          <div class="room-badges">
            <span 
              class="mode-badge"
              :class="{ 
                'roadview-mode': room.mode === '로드뷰',
                'photo-mode': room.mode === '포토'
              }"
            >
              <i :class="room.mode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
              {{ room.mode }}
            </span>
            <span 
              class="status-badge"
              :class="{ 
                'waiting': room.status === 'waiting',
                'playing': room.status === 'playing'
              }"
            >
              {{ room.status === 'waiting' ? '대기중' : '게임중' }}
              <span v-if="room.status === 'playing' && room.currentRound" class="round-info">
                {{ room.currentRound }}/{{ room.totalRounds }}R
              </span>
            </span>
          </div>
        </div>
        
        <div class="room-details">
          <div class="detail-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ room.region }}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-users"></i>
            <span>{{ room.players }}/{{ room.maxPlayers }}명</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-clock"></i>
            <span>{{ formatTimeAgo(room.createdAt) }}</span>
          </div>
        </div>
        
        <div class="room-actions">
          <button 
            class="join-button"
            @click="joinRoom(room.id)"
            :disabled="room.players >= room.maxPlayers || room.status === 'playing'"
          >
            참가하기
          </button>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <i class="fas fa-gamepad"></i>
      <p>검색 조건에 맞는 방이 없습니다.</p>
      <button class="reset-filters" @click="resetFilters">필터 초기화</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "GameRoomList",
  
  props: {
    rooms: {
      type: Array,
      required: true
    }
  },
  
  data() {
    return {
      searchQuery: '',
      filteredRooms: [],
      selectedModeFilter: 'all',
      selectedStatusFilter: 'all',
      modeFilters: [
        { label: '전체', value: 'all', icon: 'fas fa-th-large' },
        { label: '로드뷰', value: '로드뷰', icon: 'fas fa-street-view' },
        { label: '포토', value: '포토', icon: 'fas fa-camera' }
      ],
      statusFilters: [
        { label: '전체', value: 'all', icon: 'fas fa-th-large' },
        { label: '대기중', value: 'waiting', icon: 'fas fa-hourglass-half' },
        { label: '게임중', value: 'playing', icon: 'fas fa-play-circle' }
      ]
    };
  },
  
  created() {
    this.filteredRooms = [...this.rooms];
  },
  
  watch: {
    rooms: {
      handler() {
        this.filterRooms();
      },
      deep: true
    }
  },
  
  methods: {
    filterRooms() {
      let filtered = [...this.rooms];
      
      // 검색어 필터링
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(room => 
          room.name.toLowerCase().includes(query) || 
          room.region.toLowerCase().includes(query) ||
          room.host.toLowerCase().includes(query)
        );
      }
      
      // 게임 모드 필터링
      if (this.selectedModeFilter !== 'all') {
        filtered = filtered.filter(room => room.mode === this.selectedModeFilter);
      }
      
      // 상태 필터링
      if (this.selectedStatusFilter !== 'all') {
        filtered = filtered.filter(room => room.status === this.selectedStatusFilter);
      }
      
      // 관전 제외 - 게임중인 방은 필터링에서만 보이고 참가는 못하게
      this.filteredRooms = filtered;
    },
    
    setModeFilter(value) {
      this.selectedModeFilter = value;
      this.filterRooms();
    },
    
    setStatusFilter(value) {
      this.selectedStatusFilter = value;
      this.filterRooms();
    },
    
    resetFilters() {
      this.searchQuery = '';
      this.selectedModeFilter = 'all';
      this.selectedStatusFilter = 'all';
      this.filterRooms();
    },
    
    refreshRooms() {
      this.$emit('refresh-rooms');
    },
    
    joinRoom(roomId) {
      this.$emit('join-room', roomId);
    },
    
    formatTimeAgo(timestamp) {
      const now = new Date();
      const roomDate = new Date(timestamp);
      const diffMs = now - roomDate;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}일 전`;
    }
  }
};
</script>

<style scoped>
.game-rooms-panel {
  flex: 1;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

.panel-header {
  padding: 1rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  background: linear-gradient(to right, #f8f9fa, #f1f3f9);
}

.panel-title {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
  position: relative;
  font-weight: 700;
}

.panel-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 30px;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.room-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 0.6rem 1rem 0.6rem 2.2rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.9rem;
  width: 200px;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.8);
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  width: 240px;
  background-color: white;
}

.search-box i {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.refresh-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.refresh-button:hover {
  background: #f0f2fa;
  transform: rotate(180deg);
}

.room-filters {
  padding: 0.8rem 1.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  border-bottom: 1px solid #eee;
  background-color: rgba(249, 250, 251, 0.7);
  position: relative;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-right: 0.5rem;
  position: relative;
}

.filter-group:first-child {
  margin-right: 1.5rem;
}

.filter-group:first-child::after {
  content: '';
  position: absolute;
  right: -0.8rem;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e2e8f0;
  height: 100%;
}

.filter-group button {
  background: #f0f2f5;
  border: none;
  border-radius: 16px;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  z-index: 1;
}

.filter-group button i {
  font-size: 0.8rem;
}

.filter-group button:hover {
  background: #e8e8e8;
  transform: translateY(-1px);
}

.filter-group button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.rooms-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  background-color: #f9fafc;
}

.room-card {
  background: white;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  border-left: 4px solid #667eea;
  position: relative;
  overflow: hidden;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.room-card.playing {
  border-left-color: #ff9800;
}

.room-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 30%;
  background: linear-gradient(to left, rgba(249, 250, 251, 0.5), transparent);
  z-index: 1;
  pointer-events: none;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem;
}

.room-info {
  flex: 1;
}

.room-name {
  margin: 0 0 0.2rem 0;
  font-size: 1.05rem;
  color: #333;
  font-weight: 600;
}

.room-host {
  font-size: 0.85rem;
  color: #666;
}

.room-badges {
  display: flex;
  gap: 0.5rem;
}

.mode-badge, .status-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.roadview-mode {
  background: #e8f5e9;
  color: #2e7d32;
}

.photo-mode {
  background: #e3f2fd;
  color: #1976d2;
}

.waiting {
  background: #e8eaf6;
  color: #3949ab;
}

.playing {
  background: #fff3e0;
  color: #e65100;
}

.round-info {
  margin-left: 0.3rem;
  font-weight: 700;
  border-left: 1px solid rgba(230, 81, 0, 0.3);
  padding-left: 0.3rem;
}

.room-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #666;
}

.detail-item i {
  color: #999;
}

.room-actions {
  display: flex;
  justify-content: flex-end;
}

.join-button {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(102, 126, 234, 0.2);
}

.join-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6edb 0%, #6a4496 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.join-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  box-shadow: none;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #999;
  background-color: #f9fafc;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
  color: #667eea;
}

.empty-state p {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.reset-filters {
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-filters:hover {
  background: #f0f0f0;
  color: #333;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .room-actions {
    width: 100%;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .search-box input:focus {
    width: 100%;
  }
  
  .room-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 