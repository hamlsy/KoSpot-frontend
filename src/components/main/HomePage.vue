<template>
  <div class="game-container">
    <!-- Animated Korea Map Section -->
    <div class="logo-section">
      <div class="map-animation">
        <img src="@/assets/korea.png" alt="한반도 지도" class="korea-map" />
        <h1 class="main-title">KoSpot</h1>
      </div>
    </div>

    <!-- Game Controls Section -->
    <div class="game-controls">
      <router-link to="/mainPage" tag="button" class="start-button">
        <router-link to="/mainPage" tag="span" class="button-text"
          >게임 시작</router-link
        >
        <div class="button-effect"></div>
      </router-link>
      <!-- Social Login Buttons (shown when not logged in) -->
      <div v-if="!isLoggedIn" class="social-login-section">
        <button @click="socialLogin('naver')" class="social-button naver">
          <img
            src="/placeholder.svg?height=24&width=24"
            alt="네이버"
            class="social-icon"
          />
          <span>네이버로 시작하기</span>
        </button>
        <button @click="socialLogin('kakao')" class="social-button kakao">
          <img
            src="/placeholder.svg?height=24&width=24"
            alt="카카오"
            class="social-icon"
          />
          <span>카카오로 시작하기</span>
        </button>
        <button @click="socialLogin('google')" class="social-button google">
          <img
            src="/placeholder.svg?height=24&width=24"
            alt="구글"
            class="social-icon"
          />
          <span>구글로 시작하기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const isLoggedIn = ref(false);
const socialLogin = (platform) => {
  console.log(`${platform} 로그인 시도`);
  // Implement social login logic
};
</script>

<style scoped>
.game-container {
  min-height: 100vh;
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
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.2)
  );
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
  background-color: #03c75a;
  color: white;
}

.social-button.kakao {
  background-color: #fee500;
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
