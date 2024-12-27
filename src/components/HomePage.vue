<template>
    <div class="game-container">
      <!-- Animated Korea Map Section -->
    <div class="logo-section">
      <div class="map-animation">
        <img src="../../public/korea.png" alt="한반도 지도" class="korea-map" />
        <h1 class="main-title">KoSpot</h1>
      </div>
    </div>

    <!-- User Info Section (shown when logged in) -->
    <div v-if="isLoggedIn" class="user-info-section">
      <div class="user-profile">
        <img :src="userAvatar" alt="프로필 사진" class="profile-image" />
        <div class="user-details">
          <h2 class="username">{{ username }}</h2>
          <p class="user-level">Level {{ userLevel }}</p>
        </div>
      </div>
    </div>

    <!-- Game Controls Section -->
    <div class="game-controls">
      <router-link to="/mainPage" tag="button" class="start-button">
        <router-link to="/mainPage" tag="span" class="button-text">게임 시작</router-link>
        <div class="button-effect"></div>
    </router-link>
      <!-- Social Login Buttons (shown when not logged in) -->
      <div v-if="!isLoggedIn" class="social-login-section">
        <button @click="socialLogin('naver')" class="social-button naver">
          <img src="/placeholder.svg?height=24&width=24" alt="네이버" class="social-icon" />
          <span>네이버로 시작하기</span>
        </button>
        <button @click="socialLogin('kakao')" class="social-button kakao">
          <img src="/placeholder.svg?height=24&width=24" alt="카카오" class="social-icon" />
          <span>카카오로 시작하기</span>
        </button>
        <button @click="socialLogin('google')" class="social-button google">
          <img src="/placeholder.svg?height=24&width=24" alt="구글" class="social-icon" />
          <span>구글로 시작하기</span>
        </button>
      </div>
    </div>

  </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const isLoggedIn = ref(false)
  const username = ref('Player123')
  const userLevel = ref(15)
  const userAvatar = ref('/placeholder.svg?height=100&width=100')
  
  const socialLogin = (platform) => {
    console.log(`${platform} 로그인 시도`)
    // Implement social login logic
  }
  </script>
  
  <style scoped>
.game-container {
  min-height: 100vh;
  /* background: #ffffff; */
  background: linear-gradient(to bottom, #ffffff, #f3f3f3);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  position: relative;
  overflow-x: hidden;
}

.logo-section {
  margin-top: 4rem;
  margin-bottom: 2rem;
}

.map-animation {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 400px;
}

.korea-map {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.1;
  position: absolute;
  z-index: 0;
}

.main-title {
  font-size: 4rem;
  font-weight: 800;
  color: #1a1a1a;
  text-align: center;
  position: relative;
  z-index: 1;
  animation: fadeIn 1.5s ease-out;
}

.user-info-section {
  margin: 2rem 0;
  width: 100%;
  max-width: 320px;
}

.user-profile {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.profile-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.user-details {
  margin-left: 1rem;
}

.username {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.user-level {
  font-size: 0.9rem;
  color: #666;
  margin: 0.25rem 0 0 0;
}

.game-controls {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.start-button {
  width: 100%;
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

.social-login-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.social-button {
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.social-button:hover {
  transform: translateY(-1px);
}

.social-button.naver {
  background-color: #03C75A;
  color: white;
}

.social-button.kakao {
  background-color: #FEE500;
  color: #000000;
}

.social-button.google {
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #dadce0;
}

.social-icon {
  width: 24px;
  height: 24px;
}

.menu-button {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #4facfe;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.menu-button:hover {
  background: #00f2fe;
  transform: scale(1.1);
}

.menu-button i {
  color: white;
  font-size: 1.5rem;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 150;
}

.side-menu {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: white;
  padding: 2rem;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 200;
  transition: transform 0.5s ease;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.menu-profile-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.menu-username {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.menu-nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-item {
  padding: 0.75rem;
  color: #1a1a1a;
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.slide-menu-enter-active,
.slide-menu-leave-active {
  transition: all 0.5s ease;
}

.slide-menu-enter-from,
.slide-menu-leave-to {
  opacity: 0;
}

.slide-menu-enter-from .side-menu,
.slide-menu-leave-to .side-menu {
  transform: translateX(100%);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 2.5rem;
  }
  
  .game-container {
    padding: 1rem;
  }
  
  .logo-section {
    margin-top: 3rem;
  }

  .map-animation {
    width: 200px;
    height: 200px;
  }
}
</style>

  