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
        <!-- Kakao Login Button -->
        <button @click="socialLogin('kakao')" class="social-button kakao">
          <div class="social-icon-wrapper kakao">
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M9 0C4.0294 0 0 3.09942 0 6.92154C0 9.39376 1.55882 11.5561 3.93382 12.7458L2.93382 16.5171C2.88235 16.6777 3.05147 16.8128 3.19118 16.7259L7.5 13.9056C8.00147 13.9623 8.49853 14 9 14C13.9706 14 18 10.9006 18 7.07846C18 3.25635 13.9706 0 9 0Z" fill="black"/>
            </svg>
          </div>
          <span class="social-text kakao">카카오 로그인</span>
        </button>
        
        <!-- Naver Login Button -->
        <button @click="socialLogin('naver')" class="social-button naver">
          <div class="social-icon-wrapper naver">
            <span class="naver-icon">N</span>
          </div>
          <span class="social-text naver">네이버 로그인</span>
        </button>
        
        <!-- Google Login Button -->
        <button @click="handleGoogleSignIn" class="google-btn">
          <div class="google-icon-wrapper">
            <svg class="google-icon" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
          </div>
          <span class="google-btn-text">Google로 로그인</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const isLoggedIn = ref(false);
const socialLogin = (platform) => {
  console.log(`${platform} 로그인 시도`);
  // Implement social login logic
};

// Google Sign-In handling
const handleGoogleSignIn = () => {
  console.log('Google 로그인 시도');
  socialLogin('google');
};

onMounted(() => {
  // Add Roboto font for Google button
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css?family=Roboto:500';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  document.head.appendChild(link);
});
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
  margin-bottom: 1rem;
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
  align-items: center;
}

.social-button {
  width: 100%;
  height: 45px;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
}

.social-button:hover {
  transform: translateY(-1px);
}

.social-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  width: 24px;
  height: 24px;
}

.social-text {
  flex: 1;
  text-align: center;
}

/* Kakao Button Styling */
.social-button.kakao {
  background-color: #FEE500;
}

.social-text.kakao {
  color: rgba(0, 0, 0, 0.85);
}

/* Naver Button Styling */
.social-button.naver {
  background-color: #03C75A;
}

.social-text.naver {
  color: white;
}

.naver-icon {
  color: white;
  font-weight: bold;
  font-size: 18px;
}

/* Google Sign-In Button */
.google-btn {
  width: 100%;
  height: 45px;
  background-color: #FFFFFF;
  border-radius: 24px;
  border: 1px solid #747775;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  display: flex;
  align-items: center;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.google-btn:hover {
  background-color: #f8f8f8;
  box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
}

.google-btn:active {
  background-color: #eaeaea;
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3);
}

.google-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: 12px;
  padding-right: 10px;
  height: 100%;
}

.google-icon {
  width: 18px;
  height: 18px;
}

.google-btn-text {
  flex: 1;
  padding-right: 12px;
  color: #1F1F1F;
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}

/* Remove the old Google button styles */
#gSignInWrapper, #customBtn, .icon, .buttonText {
  display: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
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
    margin-bottom: 4rem;
  }

  .map-animation {
    width: 200px;
    height: 200px;
  }
}
</style>
