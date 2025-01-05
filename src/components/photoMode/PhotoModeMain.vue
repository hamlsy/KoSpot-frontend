<template>
    <div class="photo-mode-container">
      <header class="header">
        <button @click="$router.go(-1)" class="back-button">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h1>사진 모드</h1>
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
              <div class="region-grid">
                <div 
                  v-for="region in regions" 
                  :key="region.name"
                  class="region-card"
                  :class="{ 'selected': selectedRegions.includes(region.name) }"
                  @click="toggleRegionSelection(region.name)"
                >
                  <img :src="region.thumbnail" :alt="region.name" />
                  <span>{{ region.name }}</span>
                </div>
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
                  <div class="level-details">
                    <span class="difficulty-indicator" :class="level.difficultyClass"></span>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Rank Mode Specific Content -->
            <div v-if="selectedGameMode.id === 'rank'" class="rank-mode-options">
              <h3>랭크 모드 세부사항</h3>
              <div class="rank-details">
                <div class="current-rank">
                  <p>현재 랭크: {{ userRank }}</p>
                  <div class="rank-stats">
                    <div class="stat">
                      <i class="fas fa-trophy"></i>
                      <span>최고 점수: {{ bestScore }}</span>
                    </div>
                    <div class="stat">
                      <i class="fas fa-globe"></i>
                      <span>도전 지역: 전국</span>
                    </div>
                  </div>
                  <button @click="showRankingDetails">랭킹 보기</button>
                </div>
              </div>
            </div>
  
            <!-- Photo Collection Mode -->
            <div v-if="selectedGameMode.id === 'collection'" class="collection-mode">
              <h3>내 사진 도감</h3>
              <div class="collection-stats">
                <div class="stat-card">
                  <i class="fas fa-images"></i>
                  <div>
                    <h4>총 발견 사진</h4>
                    <p>{{ collectionStats.totalPhotos }} / {{ collectionStats.maxPhotos }}</p>
                  </div>
                </div>
                <div class="stat-card">
                  <i class="fas fa-map-marked-alt"></i>
                  <div>
                    <h4>발견한 지역</h4>
                    <p>{{ collectionStats.discoveredRegions }} / {{ collectionStats.totalRegions }}</p>
                  </div>
                </div>
              </div>
              <div class="collection-grid">
                <div 
                  v-for="region in photoCollection" 
                  :key="region.name"
                  class="collection-region"
                >
                  <h4>{{ region.name }}</h4>
                  <div class="region-photos">
                    <div 
                      v-for="photo in region.photos" 
                      :key="photo.id"
                      class="photo-thumbnail"
                      :class="{ 'discovered': photo.discovered }"
                    >
                      <img 
                        :src="photo.discovered ? photo.url : '/locked-photo.svg'" 
                        :alt="region.name" 
                      />
                    </div>
                  </div>
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
      title: '연습 모드',
      icon: 'fas fa-graduation-cap',
      shortDescription: '시간 제한 없이 연습하세요.',
      fullDescription: '시간 제한 없이 원하는 지역의 사진을 맞추는 모드입니다.'
    },
    {
      id: 'normal',
      title: '일반 모드',
      icon: 'fas fa-play-circle',
      shortDescription: '난이도별 사진 맞추기',
      fullDescription: '난이도에 따라 다양한 지역과 유명 장소의 사진을 맞추는 모드입니다.'
    },
    {
      id: 'rank',
      title: '랭크 모드',
      icon: 'fas fa-trophy',
      shortDescription: '전국 랜덤 사진으로 실력 겨루기',
      fullDescription: '전국의 무작위 사진을 맞추며 랭킹에 도전하는 경쟁 모드입니다.'
    },
    {
      id: 'collection',
      title: '사진 도감',
      icon: 'fas fa-book',
      shortDescription: '내가 발견한 사진들 모아보기',
      fullDescription: '게임을 통해 발견한 모든 사진을 지역별로 확인할 수 있습니다.'
    }
  ]
  
  const regions = [
    { name: '서울', thumbnail: '/seoul-thumbnail.jpg' },
    { name: '부산', thumbnail: '/busan-thumbnail.jpg' },
    { name: '인천', thumbnail: '/incheon-thumbnail.jpg' },
    { name: '대구', thumbnail: '/daegu-thumbnail.jpg' },
    { name: '대전', thumbnail: '/daejeon-thumbnail.jpg' },
    { name: '광주', thumbnail: '/gwangju-thumbnail.jpg' },
    { name: '울산', thumbnail: '/ulsan-thumbnail.jpg' },
    { name: '경기', thumbnail: '/gyeonggi-thumbnail.jpg' },
    { name: '강원', thumbnail: '/gangwon-thumbnail.jpg' },
    { name: '충청', thumbnail: '/chungcheong-thumbnail.jpg' },
    { name: '전라', thumbnail: '/jeolla-thumbnail.jpg' },
    { name: '경상', thumbnail: '/gyeongsang-thumbnail.jpg' },
    { name: '제주', thumbnail: '/jeju-thumbnail.jpg' }
  ]
  
  const levels = [
    { 
      value: 1, 
      title: 'Level 1', 
      description: '대도시 및 유명 관광지 위주',
      difficultyClass: 'easy'
    },
    { 
      value: 2, 
      title: 'Level 2', 
      description: '중소도시 및 대표 명소',
      difficultyClass: 'medium'
    },
    { 
      value: 3, 
      title: 'Level 3', 
      description: '숨겨진 비밀 장소들',
      difficultyClass: 'hard'
    }
  ]
  
  const photoCollection = [
    {
      name: '서울',
      photos: [
        { id: 1, url: '/seoul-photo1.jpg', discovered: true },
        { id: 2, url: '/seoul-photo2.jpg', discovered: false },
        { id: 3, url: '/seoul-photo3.jpg', discovered: true }
      ]
    },
    // Add more regions and their photos
  ]
  
  const selectedGameMode = ref(null)
  const selectedRegions = ref([])
  const selectedLevel = ref(null)
  const userRank = ref('Gold III')
  const bestScore = ref(15420)
  
  const collectionStats = {
    totalPhotos: 25,
    maxPhotos: 150,
    discoveredRegions: 7,
    totalRegions: 13
  }
  
  const openGameModePopup = (mode) => {
    selectedGameMode.value = mode
    selectedRegions.value = []
    selectedLevel.value = null
  }
  
  const closeGameModePopup = () => {
    selectedGameMode.value = null
  }
  
  const toggleRegionSelection = (regionName) => {
    const index = selectedRegions.value.indexOf(regionName)
    if (index > -1) {
      selectedRegions.value.splice(index, 1)
    } else {
      selectedRegions.value.push(regionName)
    }
  }
  
  const selectLevel = (level) => {
    selectedLevel.value = level
  }
  
  const isGameStartReady = computed(() => {
    if (selectedGameMode.value?.id === 'practice') return selectedRegions.value.length > 0
    if (selectedGameMode.value?.id === 'normal') return selectedLevel.value !== null
    if (selectedGameMode.value?.id === 'rank' || selectedGameMode.value?.id === 'collection') return true
    return false
  })
  
  const startGame = () => {
    console.log('Game Starting', {
      mode: selectedGameMode.value.id,
      regions: selectedRegions.value,
      level: selectedLevel.value
    })
  }
  
  const showRankingDetails = () => {
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
  /* [Previous CSS remains the same, with these additional styles] */
  
  .region-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }
  
  .region-card {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.3s ease;
  }
  
  .region-card img {
    width: 100%;
    height: 100px;
    object-fit: cover;
  }
  
  .region-card span {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0,0,0,0.5);
    color: white;
    padding: 0.25rem;
    text-align: center;
  }
  
  .region-card.selected::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 3px solid #4CD964;
  }
  
  .level-card .difficulty-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-left: 0.5rem;
  }
  
  .difficulty-indicator.easy { background-color: #4CD964; }
  .difficulty-indicator.medium { background-color: #FFC107; }
  .difficulty-indicator.hard { background-color: #F44336; }
  
  .collection-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    background: #f0f2f5;
    padding: 1rem;
    border-radius: 10px;
    flex-grow: 1;
    margin: 0 0.5rem;
  }
  
  .stat-card i {
    font-size: 2rem;
    margin-right: 1rem;
    color: #4CD964;
  }
  
  .collection-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .collection-region h4 {
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 0.5rem;
  }
  
  .region-photos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.5rem;
  }
  
  .photo-thumbnail {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .photo-thumbnail img {
    width: 100%;
    height: 100px;
    object-fit: cover;
  }
  
  .photo-thumbnail:not(.discovered) img {
    filter: grayscale(100%) brightness(50%);
  }
  </style>