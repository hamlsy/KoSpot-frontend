<template>
  <div class="road-view-container">
    <header class="header">
      <button class="back-button" @click="$router.push('/mainPage')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2>로드뷰 모드</h2>
    </header>

    <main class="main-content">
      <!-- Game Modes Section -->
      <section class="game-modes">
        <div class="game-mode-list">
          <div
            v-for="mode in gameModes"
            :key="mode.id"
            class="game-mode-card"
            @click="openGameModePopup(mode)"
          >
            <div class="game-mode-icon" :class="mode.color">
              <i :class="mode.icon"></i>
            </div>
            <div class="game-mode-details">
              <h3>{{ mode.title }}</h3>
              <p>{{ mode.shortDescription }}</p>
            </div>
            <div class="game-mode-arrow">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section (New) -->
      <section class="stats-section">
        <h2 class="section-title">나의 통계</h2>
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="stat-header">
              <i :class="stat.icon"></i>
              <span>{{ stat.label }}</span>
            </div>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
        </div>
      </section>

      <!-- Recent Records Section (New) -->
      <section class="records-section">
        <h2 class="section-title">최근 기록</h2>
        <div class="records-list">
          <div
            v-for="(record, index) in recentRecords"
            :key="record.id"
            class="record-item"
            :class="{ 'with-border': index !== recentRecords.length - 1 }"
          >
            <div class="record-info">
              <div class="record-mode-badge" :class="{ 
                'rank-mode': record.mode === '랭크',
                'practice-mode': record.mode === '연습'
              }">
                {{ record.mode }}
              </div>
              <span class="record-region">{{ record.region }}</span>
              <p class="record-score">{{ formatNumber(record.score) }}점</p>
            </div>
            <span class="record-date">{{ record.date }}</span>
          </div>
        </div>
      </section>
    </main>

    <!-- Game Mode Popup -->
    <transition name="popup-slide">
      <div v-if="selectedGameMode" class="game-mode-popup" @click.self="closeGameModePopup">
        <div class="popup-content">
          <div class="popup-header">
            <h2>{{ selectedGameMode.title }}</h2>
            <button @click="closeGameModePopup" class="close-button">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="popup-description">
            <p>{{ selectedGameMode.fullDescription }}</p>
          </div>

          <div v-if="selectedGameMode.id === 'practice'" class="practice-mode-options">
            <h3>지역 선택</h3>
            <div class="region-selector">
              <button
                v-for="region in regions"
                :key="region"
                :class="{ selected: selectedRegion === region }"
                @click="selectRegion(region)"
              >
                {{ region }}
              </button>
            </div>
          </div>

          <div v-if="selectedGameMode.id === 'rank'" class="rank-mode-options">
            <div class="rank-details">
              <div class="current-rank">
                <p>현재 랭크: {{ userRank }}</p>
              </div>
            </div>
          </div>

          <button
            class="start-game-button"
            @click="startGame"
            :disabled="!isGameStartReady"
            :class="selectedGameMode.color"
          >
            게임 시작
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'RoadViewGame',
  
  data() {
    return {
      selectedGameMode: null,
      selectedRegion: null,
      userRank: 'Gold III',
      
      gameModes: [
        {
          id: 'practice',
          title: '연습 게임',
          icon: 'fas fa-graduation-cap',
          shortDescription: '지역을 선택하고 쉽게 연습해보세요',
          fullDescription: '특정 지역을 선택하여 로드뷰 능력을 천천히 향상시킬 수 있는 모드입니다. 편안한 속도로 학습하세요.',
          color: 'practice-color'
        },
        {
          id: 'rank',
          title: '랭크 게임',
          icon: 'fas fa-trophy',
          shortDescription: '랜덤 맵으로 다른 플레이어와 경쟁하세요',
          fullDescription: '전국 랭킹에 도전하는 경쟁 모드입니다. 최고의 성적을 목표로 하세요.',
          color: 'rank-color'
        }
      ],
      
      regions: [
        '서울', '경기', '인천', '부산', '대구', '대전',
        '광주', '울산', '강원', '충청', '전라', '경상', '제주'
      ],
      
      stats: [
        { icon: 'fas fa-medal', label: '최고 점수', value: '4,850점' },
        { icon: 'fas fa-map', label: '플레이한 지역', value: '8개' },
        { icon: 'fas fa-clock', label: '총 플레이 시간', value: '5시간' },
        { icon: 'fas fa-users', label: '전체 랭킹', value: '상위 15%' }
      ],
      
      recentRecords: [
        { id: 1, mode: '랭크', score: 4850, date: '2024.12.29', region: '서울' },
        { id: 2, mode: '연습', score: 4200, date: '2024.12.29', region: '부산' },
        { id: 3, mode: '랭크', score: 4600, date: '2024.12.28', region: '경기' }
      ]
    }
  },

  computed: {
    isGameStartReady() {
      if (this.selectedGameMode?.id === 'practice') return this.selectedRegion !== null
      if (this.selectedGameMode?.id === 'rank') return true
      return false
    }
  },

  methods: {
    openGameModePopup(mode) {
      this.selectedGameMode = mode
      this.selectedRegion = null
    },

    closeGameModePopup() {
      this.selectedGameMode = null
      this.selectedRegion = null
    },

    selectRegion(region) {
      this.selectedRegion = region
    },

    startGame() {
      if (!this.isGameStartReady) return

      const gameData = {
        mode: this.selectedGameMode.id,
        region: this.selectedRegion,
      }

      console.log('Starting game with:', gameData)
      // 게임 시작 로직 구현
    },

    formatNumber(number) {
      return number.toLocaleString()
    }
  }
}
</script>


<style scoped>
.road-view-container {
  min-height: 100vh;
  background: #f0f2f5;
  padding-bottom: 20px;
  
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.back-button {
  background: none;
  border: none;
  margin-right: 1rem;
  font-size: 1.2rem;
  cursor: pointer;
}

.game-modes {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  padding: 1rem;
  justify-content: center;
}

.game-mode-list {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
  justify-content: center;
}

.game-mode-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s ease;
  height: 8rem;
}

.game-mode-card:hover {
  transform: translateY(-5px);
}

.game-mode-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #4cd964 0%, #34c759 100%);
  box-shadow: 0 4px 12px rgba(76, 217, 100, 0.2);
  color: white;
  font-size: 1.8rem;
}

.game-mode-details {
  flex-grow: 1;
}

.game-mode-details h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.game-mode-details p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.game-mode-arrow {
  color: #999;
  font-size: 1.2rem;
}

.game-mode-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.popup-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
}

.start-game-button {
  width: 100%;
  padding: 1rem;
  background: #4cd964;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  margin-top: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.start-game-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.region-selector,
.level-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.region-selector button,
.level-selector .level-card {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: #f0f2f5;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.region-selector button.selected,
.level-selector .level-card.selected {
  background: #4cd964;
  color: white;
}

.level-card {
  flex-grow: 1;
  text-align: center;
  padding: 1rem;
}

.popup-slide-enter-active,
.popup-slide-leave-active {
  transition: opacity 0.3s ease;
}

.popup-slide-enter-from,
.popup-slide-leave-to {
  opacity: 0;
}

.main-content {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
}

.records-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.record-item {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-item.with-border {
  border-bottom: 1px solid #eee;
}

.record-mode-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-right: 0.5rem;
}

.rank-mode {
  background: #e3f2fd;
  color: #1976d2;
}

.practice-mode {
  background: #e8f5e9;
  color: #2e7d32;
}

.practice-color {
  background: #4cd964;
}

.rank-color {
  background: #1976d2;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Existing transitions */
.popup-slide-enter-active,
.popup-slide-leave-active {
  transition: opacity 0.3s ease;
}

.popup-slide-enter-from,
.popup-slide-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .popup-content {
    width: 95%;
  }

  .region-selector,
  .level-selector {
    flex-direction: column;
  }

  .region-selector button,
  .level-selector .level-card {
    width: 100%;
  }
  .game-modes {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  
  }
  .game-mode-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    justify-content: center;
  }
}
</style>
