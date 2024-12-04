<template>
  <div class="game-mode-container">
    <header class="header">
      <h1 class="app-title">KX Team</h1>
      <div class="header-icons">
        <button class="icon-button">
          <i class="fas fa-bell"></i>
        </button>
        <button class="icon-button">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    </header>

    <div class="modes-grid">
      <div 
        v-for="(mode, index) in gameModes" 
        :key="index"
        class="mode-card"
        :class="mode.colorClass"
        @click="selectMode(index)"
      >
        <div class="card-content">
          <h2>{{ mode.name }}</h2>
          <p>{{ mode.description }}</p>
          <img :src="mode.image" :alt="mode.name" class="mode-illustration" />
          <div class="mode-stats">
            <p>최고 점수: {{ mode.highScore }}</p>
            <p>플레이 횟수: {{ mode.playCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <nav class="bottom-nav">
      <button class="nav-item active">
        <i class="fas fa-gamepad"></i>
        <span>게임</span>
      </button>
      <button class="nav-item">
        <i class="fas fa-trophy"></i>
        <span>순위</span>
      </button>
      <button class="nav-item">
        <i class="fas fa-user"></i>
        <span>프로필</span>
      </button>
    </nav>
  </div>
</template>

<script setup>


const gameModes = [
  {
    name: "퀴즈 모드",
    description: "다양한 지리 퀴즈를 풀어보세요!",
    image: "/placeholder.svg?height=100&width=100",
    highScore: 1000,
    playCount: 15,
    colorClass: 'purple-card'
  },
  {
    name: "탐험 모드",
    description: "가상의 세계를 탐험하며 지리를 배워보세요!",
    image: "/placeholder.svg?height=100&width=100",
    highScore: 750,
    playCount: 8,
    colorClass: 'mint-card'
  },
  {
    name: "멀티플레이어 모드",
    description: "친구들과 함께 지리 지식을 겨뤄보세요!",
    image: "/placeholder.svg?height=100&width=100",
    highScore: 1200,
    playCount: 20,
    colorClass: 'yellow-card'
  }
]

const selectMode = (index) => {
  console.log(`Selected mode: ${gameModes[index].name}`)
  // Implement mode selection logic
}
</script>

<style scoped>
.game-mode-container {
  min-height: 100vh;
  background: #ffffff;
  position: relative;
  padding-bottom: 70px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #ffffff;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.header-icons {
  display: flex;
  gap: 1rem;
}

.icon-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #333;
  cursor: pointer;
  padding: 0.5rem;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1rem;
  max-width: 768px;
  margin: 0 auto;
}

.mode-card {
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  min-height: 200px;
}

.mode-card:hover {
  transform: translateY(-2px);
}

.mode-card:nth-child(3n+1) {
  grid-column: span 2;
}

.purple-card {
  background: rgba(233, 230, 255, 0.7);
}

.mint-card {
  background: rgba(230, 255, 243, 0.7);
}

.yellow-card {
  background: rgba(255, 249, 230, 0.7);
}

.card-content {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-content h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.card-content p {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.mode-illustration {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin: 0.5rem 0;
}

.mode-stats {
  margin-top: auto;
  font-size: 0.8rem;
  color: #666;
}

.mode-stats p {
  margin: 0.2rem 0;
  font-size: 0.8rem;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  display: flex;
  justify-content: space-around;
  padding: 0.8rem;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.8rem;
}

.nav-item i {
  font-size: 1.2rem;
}

.nav-item.active {
  color: #333;
}

@media (max-width: 640px) {
  .modes-grid {
    grid-template-columns: 1fr;
  }

  .mode-card:nth-child(3n+1) {
    grid-column: span 1;
  }

  .header {
    padding: 1rem;
  }

  .app-title {
    font-size: 1.3rem;
  }
}
</style>

