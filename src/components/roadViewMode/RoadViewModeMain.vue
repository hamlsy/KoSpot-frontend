<template>
    <div class="road-view-container">
      <header class="header">
        <button @click="$router.go(-1)" class="back-button">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h1>로드뷰 모드</h1>
      </header>
  
      <div class="game-modes">
        <div 
          v-for="(mode, index) in gameModes" 
          :key="index" 
          class="game-mode-card"
          @click="openGameModePopup(mode)"
        >
          <div class="game-mode-icon">
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
  
      <transition name="popup-slide">
        <div 
          v-if="selectedGameMode" 
          class="game-mode-popup"
          @click.self="closeGameModePopup"
        >
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
  
            <!-- Practice Mode Specific Content -->
            <div v-if="selectedGameMode.id === 'practice'" class="practice-mode-options">
              <h3>지역 선택</h3>
              <div class="region-selector">
                <button 
                  v-for="region in regions" 
                  :key="region"
                  :class="{ 'selected': selectedRegion === region }"
                  @click="selectRegion(region)"
                >
                  {{ region }}
                </button>
              </div>
            </div>
  
            <!-- Normal Mode Specific Content -->
            <div v-if="selectedGameMode.id === 'normal'" class="normal-mode-options">
              <h3>난이도 선택</h3>
              <div class="level-selector">
                <div 
                  v-for="level in levels" 
                  :key="level.value"
                  :class="['level-card', { 'selected': selectedLevel === level.value }]"
                  @click="selectLevel(level.value)"
                >
                  <h4>{{ level.title }}</h4>
                  <p>{{ level.description }}</p>
                </div>
              </div>
            </div>
  
            <!-- Rank Mode Specific Content -->
            <div v-if="selectedGameMode.id === 'rank'" class="rank-mode-options">
              <h3>랭크 모드 세부사항</h3>
              <div class="rank-details">
                <div class="current-rank">
                  <p>현재 랭크: {{ userRank }}</p>
                  <button @click="showRankingDetails">랭킹 보기</button>
                </div>
              </div>
            </div>
  
            <button 
              class="start-game-button"
              @click="startGame"
              :disabled="!isGameStartReady"
            >
              게임 시작
            </button>
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  
  const gameModes = [
    {
      id: 'practice',
      title: '연습 게임',
      icon: 'fas fa-graduation-cap',
      shortDescription: '지역을 선택하고 쉽게 연습해보세요',
      fullDescription: '특정 지역을 선택하여 로드뷰 능력을 천천히 향상시킬 수 있는 모드입니다. 편안한 속도로 학습하세요.'
    },
    {
      id: 'normal',
      title: '일반 게임',
      icon: 'fas fa-play-circle',
      shortDescription: '다양한 난이도로 실력을 키워보세요',
      fullDescription: '점진적으로 난이도를 높여가며 한국 전역의 로드뷰 실력을 테스트할 수 있는 모드입니다.'
    },
    {
      id: 'rank',
      title: '랭크 게임',
      icon: 'fas fa-trophy',
      shortDescription: '전국 최고의 로드뷰 플레이어와 경쟁하세요',
      fullDescription: '실력을 겨루고 전국 랭킹에 도전하는 경쟁 모드입니다. 최고의 성적을 목표로 하세요.'
    }
  ]
  
  const regions = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충청', '전라', '경상', '제주']
  const levels = [
    { value: 1, title: 'Level 1', description: '쉬운 난이도, 기본 로드뷰' },
    { value: 2, title: 'Level 2', description: '중간 난이도, 도전적인 로드뷰' },
    { value: 3, title: 'Level 3', description: '어려운 난이도, 전문가 수준' }
  ]
  
  const selectedGameMode = ref(null)
  const selectedRegion = ref(null)
  const selectedLevel = ref(null)
  const userRank = ref('Gold III')
  
  const openGameModePopup = (mode) => {
    selectedGameMode.value = mode
    selectedRegion.value = null
    selectedLevel.value = null
  }
  
  const closeGameModePopup = () => {
    selectedGameMode.value = null
  }
  
  const selectRegion = (region) => {
    selectedRegion.value = region
  }
  
  const selectLevel = (level) => {
    selectedLevel.value = level
  }
  
  const isGameStartReady = computed(() => {
    if (selectedGameMode.value?.id === 'practice') return selectedRegion.value !== null
    if (selectedGameMode.value?.id === 'normal') return selectedLevel.value !== null
    if (selectedGameMode.value?.id === 'rank') return true
    return false
  })
  
  const startGame = () => {
    // Implement game start logic
    console.log('Game Starting', {
      mode: selectedGameMode.value.id,
      region: selectedRegion.value,
      level: selectedLevel.value
    })
  }
  
  const showRankingDetails = () => {
    // Implement ranking details view
    console.log('Showing Ranking Details')
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
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
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
  }
  
  .game-mode-card:hover {
    transform: translateY(-5px);
  }
  
  .game-mode-icon {
    background: #f0f2f5;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    font-size: 1.5rem;
    color: #4CD964;
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
    background: #4CD964;
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
  
  .region-selector, .level-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .region-selector button, .level-selector .level-card {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    background: #f0f2f5;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .region-selector button.selected, 
  .level-selector .level-card.selected {
    background: #4CD964;
    color: white;
  }
  
  .level-card {
    flex-grow: 1;
    text-align: center;
    padding: 1rem;
  }
  
  .popup-slide-enter-active, .popup-slide-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .popup-slide-enter-from, .popup-slide-leave-to {
    opacity: 0;
  }
  
  @media (max-width: 640px) {
    .popup-content {
      width: 95%;
    }
  
    .region-selector, .level-selector {
      flex-direction: column;
    }
  
    .region-selector button, .level-selector .level-card {
      width: 100%;
    }
  }
  </style>