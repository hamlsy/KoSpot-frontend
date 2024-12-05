<template>
  <div class="game-mode-container">
    <header class="header">
      <div class="dropdown-header">
        <h1>KoSpot</h1>
      </div>
    </header>

    <div class="main-content">
      <div class="banner-container">
        <div class="banner-wrapper" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
          <div v-for="(banner, index) in banners" :key="index" class="banner">
            <h2>{{ banner.title }}</h2>
            <p>{{ banner.description }}</p>
          </div>
        </div>
        <div class="banner-dots">
          <span 
            v-for="(banner, index) in banners" 
            :key="index" 
            :class="{ active: index === currentBanner }"
            @click="setCurrentBanner(index)"
          ></span>
        </div>
      </div>

      <div class="modes-grid">
        <router-link to="/roadViewModeMain" tag="div" class="mode-card large">
          <div class="card-content">
            <h3><i class="fas fa-street-view" style="color: #FF5722;"></i>로드뷰 모드</h3>
            <p>실제 거리를 둘러보며 위치를 맞춰보세요</p>
            <img src="/placeholder.svg?height=80&width=80" alt="로드뷰" class="mode-icon" />
          </div>
        </router-link>

        <router-link to="/mapModeMain" tag="div" class="mode-card">
          <div class="card-content">
            <h3><i class="fas fa-map" style="color: #4CAF50;"></i>
              지도 모드</h3>
            <p>지도에서 장소 찾기</p>
            <img src="/placeholder.svg?height=60&width=60" alt="지도" class="mode-icon" />
          </div>
        </router-link>

        <router-link to="/photoModeMain" tag="div" class="mode-card">
          <div class="card-content">
            <h3><i class="fas fa-camera" style="color: #2196F3;"></i>
              사진 모드</h3>
            <p>사진 속 장소 맞추기</p>
            <img src="/placeholder.svg?height=60&width=60" alt="사진" class="mode-icon" />
          </div>
        </router-link>

        <div class="mode-card">
          <div class="card-content">
            <h3><i class="fas fa-bullhorn"></i> 공지사항</h3>
            <p>최신 업데이트 및 이벤트 정보를 확인하세요</p>
          </div>
        </div>

        <div class="mode-card">
          <div class="card-content">
            <h3><i class="fas fa-trophy" style="color: yellow;"></i> 랭킹</h3>
            <p>상위 플레이어들의 점수를 확인해보세요</p>
          </div>
        </div>
      </div>
    </div>

    <nav class="bottom-nav">
      <button class="nav-item active">
        <i class="fas fa-home"></i>
      </button>
      <button class="nav-item">
        <i class="fas fa-history"></i>
        <span></span>
      </button>
      <button class="nav-item" @click="toggleProfileMenu">
        <i class="fas fa-user"></i>
      </button>
    </nav>

    <transition name="slide-menu">
      <div v-if="showProfileMenu" class="profile-menu">
        <div class="profile-menu-header">
          <h2>내 정보</h2>
          <button @click="toggleProfileMenu" class="close-menu">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <nav class="profile-menu-nav">
          <a href="#" class="menu-item">설정</a>
          <a href="#" class="menu-item">공지사항</a>
          <a href="#" class="menu-item">도움말</a>
          <a href="#" class="menu-item">로그아웃</a>
        </nav>
      </div>
    </transition>
    <div v-if="showProfileMenu" class="overlay" @click="toggleProfileMenu"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const banners = [
  { title: "신규 이벤트", description: "친구 초대하고 포인트 받으세요!" },
  { title: "업데이트 안내", description: "새로운 지역이 추가되었습니다." },
  { title: "주간 랭킹", description: "이번 주 최고 점수를 확인하세요." }
]

const currentBanner = ref(0)
let intervalId

const setCurrentBanner = (index) => {
  currentBanner.value = index
}

const nextBanner = () => {
  currentBanner.value = (currentBanner.value + 1) % banners.length
}

onMounted(() => {
  intervalId = setInterval(nextBanner, 8000)
})

onUnmounted(() => {
  clearInterval(intervalId)
})

const showProfileMenu = ref(false)

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}
</script>

<style scoped>
.game-mode-container {
  min-height: 100vh;
  background: #f0f2f5;
  padding-bottom: 70px;
}

.header {
  padding: 0.5rem 1rem;
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  width: 100%;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-header h1 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.main-content {
  padding: 0 1rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.banner-container {
  position: relative;
  overflow: hidden;
  margin-bottom: 1rem;
}

.banner-wrapper {
  display: flex;
  transition: transform 0.5s ease;
}

.banner {
  flex: 0 0 100%;
  background: #ffffff;
  padding: 1.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.banner h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.banner p {
  font-size: 0.9rem;
  color: #666;
}

.banner-dots {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}

.banner-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  cursor: pointer;
}

.banner-dots span.active {
  background: #4CD964;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.mode-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  height: 130px;
}

.mode-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.mode-card.large {
  grid-column: span 2;
  height: 180px;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-content p {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.mode-icon {
  margin-top: auto;
  align-self: flex-start;
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
  border-top: 1px solid #e0e0e0;
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
  font-size: 1rem; /* Updated font size */
}

.nav-item i {
  font-size: 1.5rem;
}

.nav-item.active {
  color: #4CD964;
}

.profile-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 80%;
  max-width: 300px;
  background: #ffffff;
  z-index: 1000;
  padding: 2rem 1rem;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

.profile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.profile-menu-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.close-menu {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.profile-menu-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-item {
  font-size: 1rem;
  color: #333;
  text-decoration: none;
  padding: 0.5rem 0;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.slide-menu-enter-active,
.slide-menu-leave-active {
  transition: transform 0.3s ease;
}

.slide-menu-enter-from,
.slide-menu-leave-to {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .main-content {
    padding: 0 0.5rem 0.75rem;
  }

  .mode-card {
    padding: 1.25rem;
    height: 160px;
  }

  .mode-card.large {
    height: 200px;
  }

  .banner {
    padding: 1.5rem 0.75rem;
  }
}
</style>

