<template>
    <div class="game-mode-container">
      <h1 class="main-title">게임 모드 선택</h1>
      <div class="carousel-container" @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd">
        <div class="click-area left" @click="prevMode"></div>
        <div class="click-area right" @click="nextMode"></div>
        <div class="carousel-wrapper" ref="carouselWrapper">
          <div
            v-for="(mode, index) in gameModes"
            :key="index"
            class="game-mode-card"
            :class="{ 'active': index === currentMode }"
            :style="{ transform: `rotateY(${(index - currentMode) * 60}deg) translateZ(300px) translateX(${(index - currentMode) * 30}px)` }"
            @click="selectMode(index)"
          >
            <div class="card-content">
              <h2>{{ mode.name }}</h2>
              <p>{{ mode.description }}</p>
              <img :src="mode.image" :alt="mode.name" class="mode-image" />
              <div class="mode-stats">
                <p>최고 점수: {{ mode.highScore }}</p>
                <p>플레이 횟수: {{ mode.playCount }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="carousel-controls">
        <button @click="prevMode" class="carousel-button" :disabled="currentMode === 0">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button @click="nextMode" class="carousel-button" :disabled="currentMode === gameModes.length - 1">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <button @click="startGame" class="start-button">
        <span class="button-text">게임 시작</span>
        <div class="button-effect"></div>
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const gameModes = [
    {
      name: "퀴즈 모드",
      description: "다양한 지리 퀴즈를 풀어보세요!",
      image: "/placeholder.svg?height=300&width=300",
      highScore: 1000,
      playCount: 15
    },
    {
      name: "탐험 모드",
      description: "가상의 세계를 탐험하며 지리를 배워보세요!",
      image: "/placeholder.svg?height=300&width=300",
      highScore: 750,
      playCount: 8
    },
    {
      name: "멀티플레이어 모드",
      description: "친구들과 함께 지리 지식을 겨뤄보세요!",
      image: "/placeholder.svg?height=300&width=300",
      highScore: 1200,
      playCount: 20
    }
  ]
  
  const currentMode = ref(0)
  const carouselWrapper = ref(null)
  let touchStartX = 0
  let touchEndX = 0
  
  const prevMode = () => {
    if (currentMode.value > 0) {
      currentMode.value--
    }
  }
  
  const nextMode = () => {
    if (currentMode.value < gameModes.length - 1) {
      currentMode.value++
    }
  }
  
  const selectMode = (index) => {
    currentMode.value = index
    startGame()
  }
  
  const touchStart = (e) => {
    touchStartX = e.touches[0].clientX
  }
  
  const touchMove = (e) => {
    touchEndX = e.touches[0].clientX
  }
  
  const touchEnd = () => {
    if (touchStartX - touchEndX > 50) {
      nextMode()
    } else if (touchEndX - touchStartX > 50) {
      prevMode()
    }
  }
  
  const startGame = () => {
    console.log(`Starting game in ${gameModes[currentMode.value].name} mode`)
    // Implement game start logic here
  }
  </script>
  
  <style scoped>
  .game-mode-container {
    min-height: 100vh;
    background: #f0f4f8;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }
  
  .main-title {
    font-size: 3rem;
    font-weight: 800;
    color: #1a1a1a;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .carousel-container {
    width: 100%;
    height: 400px;
    position: relative;
    perspective: 1000px;
    overflow: visible;
  }
  
  .carousel-wrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    transform-style: preserve-3d;
    transition: transform 0.5s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .game-mode-card {
    position: absolute;
    width: 300px;
    height: 300px;
    transition: all 0.5s ease;
  }
  
  .card-content {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
    padding: 1.5rem;
    height: 100%;
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    backface-visibility: hidden;
    transform: translateZ(20px);
    transition: transform 0.3s ease;
  }
  
  .card-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }
  
  .card-content p {
    font-size: 0.9rem;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .mode-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 10px;
  }
  
  .carousel-controls {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }
  
  .carousel-button {
    background: #ffffff;
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: #1a1a1a;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 5px 5px 15px #d9d9d9, -5px -5px 15px #ffffff;
    margin: 0 0.5rem;
  }
  
  .carousel-button:hover {
    background: #f0f4f8;
  }
  
  .carousel-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .start-button {
    width: 200px;
    padding: 1rem;
    border-radius: 12px;
    border: none;
    background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    font-size: 1.25rem;
    font-weight: 600;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease;
    margin-top: 2rem;
  }
  
  .start-button:hover {
    transform: translateY(-2px);
  }
  
  .button-effect {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2));
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  .start-button:hover .button-effect {
    transform: translateX(100%);
  }
  
  .click-area {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50px;
    z-index: 10;
    cursor: pointer;
  }
  
  .click-area.left {
    left: 0;
  }
  
  .click-area.right {
    right: 0;
  }
  
  .mode-stats {
    margin-top: 1rem;
    font-size: 0.8rem;
    color: #555;
  }
  
  .mode-stats p {
    margin: 0.2rem 0;
  }
  
  @media (max-width: 768px) {
    .main-title {
      font-size: 2rem;
    }
  
    .carousel-container {
      height: 350px;
    }
  
    .game-mode-card {
      width: 250px;
      height: 250px;
    }
  
    .card-content {
      padding: 1rem;
    }
  
    .card-content h2 {
      font-size: 1.3rem;
    }
  
    .card-content p {
      font-size: 0.8rem;
    }
  
    .mode-image {
      height: 120px;
    }
  
    .carousel-button {
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
    }
  
    .start-button {
      width: 180px;
      font-size: 1.1rem;
    }
  }
  </style>
  
  