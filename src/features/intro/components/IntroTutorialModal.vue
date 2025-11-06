<template>
  <div v-if="show" class="intro-modal-overlay" @click.self="skipTutorial">
    <div class="intro-modal-container">
      <!-- 진행 표시기 -->
      <div class="progress-dots">
        <span
          v-for="(slide, index) in slides"
          :key="index"
          class="dot"
          :class="{ active: currentSlide === index }"
          @click="goToSlide(index)"
        ></span>
      </div>

      <!-- 닫기 버튼 -->
      <button class="close-button" @click="skipTutorial" title="건너뛰기">
        <i class="fas fa-times"></i>
      </button>

      <!-- 슬라이드 컨텐츠 -->
      <div :key="currentSlide" class="slide-content">
        <!-- 슬라이드 1: 환영 -->
        <div v-if="currentSlide === 0" class="slide slide-welcome">
              <div class="slide-icon welcome-icon">
                <i class="fas fa-map-marked-alt"></i>
              </div>
              <h1 class="slide-title gradient-text">KoSpot에 오신 것을 환영합니다!</h1>
              <p class="slide-description">
                대한민국의 관광지 기반 좌표 추리 게임<br />
              </p>
              <div class="feature-cards">
                <div class="feature-card">
                  <i class="fas fa-street-view"></i>
                  <span>실제 로드뷰</span>
                </div>
                <div class="feature-card">
                  <i class="fas fa-trophy"></i>
                  <span>랭킹 시스템</span>
                </div>
                <div class="feature-card">
                  <i class="fas fa-users"></i>
                  <span>멀티플레이</span>
                </div>
              </div>
            </div>

            <!-- 슬라이드 2: 로드뷰 모드 소개 -->
            <div v-if="currentSlide === 1" class="slide slide-roadview">
              <div class="slide-icon">
                <i class="fas fa-street-view"></i>
              </div>
              <h2 class="slide-title">로드뷰 모드</h2>
              <p class="slide-description">
                실제 거리뷰 화면에서 현재 위치를 추리하고<br />
                지도에서 정확한 위치를 찾아보세요!
              </p>
              <div class="demo-image roadview-demo">
                <div class="demo-content">
                  <i class="fas fa-map-marker-alt demo-icon"></i>
                  <p>🏛️ 경복궁, 🌊 해운대, 🗻 한라산...</p>
                  <p class="demo-subtitle">전국의 유명 관광지와 숨은 명소를 탐험하세요</p>
                </div>
              </div>
              <div class="info-tags">
                <span class="info-tag">
                  <i class="fas fa-clock"></i> 제한 시간 3분
                </span>
                <span class="info-tag">
                  <i class="fas fa-star"></i> 거리 기반 점수
                </span>
              </div>
            </div>

            <!-- 슬라이드 3: 게임 플레이 방법 -->
            <div v-if="currentSlide === 2" class="slide slide-gameplay">
              <div class="slide-icon">
                <i class="fas fa-gamepad"></i>
              </div>
              <h2 class="slide-title">게임 플레이 방법</h2>
              <div class="gameplay-steps">
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h3>로드뷰 관찰</h3>
                    <p>주변 건물, 표지판, 풍경을 자세히 살펴보세요</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h3>지도 열기</h3>
                    <p>"지도 열기" 버튼을 눌러 한국 지도를 확인하세요</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h3>위치 찍기</h3>
                    <p>예상되는 위치에 마커를 놓고 "Spot!" 버튼 클릭</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h3>점수 획득</h3>
                    <p>실제 위치와 가까울수록 높은 점수를 받습니다!</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 슬라이드 4: 멀티플레이어 -->
            <div v-if="currentSlide === 3" class="slide slide-multiplayer">
              <div class="slide-icon">
                <i class="fas fa-users"></i>
              </div>
              <h2 class="slide-title">멀티플레이어 모드</h2>
              <p class="slide-description">
                친구들과 함께 실시간으로 대결하고<br />
                누가 더 빠르고 정확한지 겨뤄보세요!
              </p>
              <div class="multiplayer-features">
                <div class="mp-feature">
                  <i class="fas fa-door-open"></i>
                  <h3>방 만들기</h3>
                  <p>직접 게임방을 생성하고 친구들을 초대하세요</p>
                </div>
                <div class="mp-feature">
                  <i class="fas fa-comments"></i>
                  <h3>실시간 채팅</h3>
                  <p>게임 중 채팅으로 소통하며 더 즐겁게!</p>
                </div>
                <div class="mp-feature">
                  <i class="fas fa-medal"></i>
                  <h3>순위 경쟁</h3>
                  <p>가장 높은 점수를 받은 플레이어가 승리!</p>
                </div>
              </div>
            </div>

            <!-- 슬라이드 5: 시작하기 -->
            <div v-if="currentSlide === 4" class="slide slide-start">
              <div class="slide-icon start-icon">
                <i class="fas fa-flag-checkered"></i>
              </div>
              <h2 class="slide-title">준비되셨나요?</h2>
              <p class="slide-description">
                지금 바로 KoSpot과 함께<br />
                한국의 관광지를 탐험해보세요!
              </p>
              <div class="start-options">
                <!-- 로그인 중이 아닐 때는 로그인하러가기 버튼 표시 -->
                <template v-if="!isLoggedIn">
                  <button class="start-button primary" @click="goToLogin">
                    <i class="fas fa-sign-in-alt"></i>
                    <span>로그인하러 가기</span>
                  </button>
                </template>
                <!-- 로그인 중일 때는 게임 시작 버튼 표시 -->
                <template v-else>
                  <button class="start-button primary" @click="startGame('roadview')">
                    <i class="fas fa-street-view"></i>
                    <span>로드뷰 시작하기</span>
                  </button>
                  <button class="start-button secondary" @click="startGame('multiplayer')">
                    <i class="fas fa-users"></i>
                    <span>멀티플레이 시작하기</span>
                  </button>
                </template>
              </div>
              <button class="text-button" @click="closeTutorial">
                메인 화면으로 이동
              </button>
            </div>
      </div>

      <!-- 네비게이션 버튼 -->
      <div class="navigation-buttons">
        <button
          v-if="currentSlide > 0"
          class="nav-button prev"
          @click="prevSlide"
        >
          <i class="fas fa-chevron-left"></i>
          이전
        </button>
        <button
          v-if="currentSlide < slides.length - 1"
          class="nav-button next"
          @click="nextSlide"
        >
          다음
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'complete']);

const router = useRouter();

const currentSlide = ref(0);

// 로그인 여부 확인
const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));

const slides = [
  { id: 'welcome', title: '환영' },
  { id: 'roadview', title: '로드뷰 모드' },
  { id: 'gameplay', title: '플레이 방법' },
  { id: 'multiplayer', title: '멀티플레이' },
  { id: 'start', title: '시작하기' }
];

const nextSlide = () => {
  if (currentSlide.value < slides.length - 1) {
    currentSlide.value++;
  }
};

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--;
  }
};

const goToSlide = (index) => {
  currentSlide.value = index;
};

const skipTutorial = () => {
  emit('close');
};

const closeTutorial = () => {
  emit('complete');
  emit('close');
};

const startGame = (mode) => {
  emit('complete');
  emit('close');
  
  if (mode === 'roadview') {
    router.push('/roadView/main');
  } else if (mode === 'multiplayer') {
    router.push('/lobby');
  }
};

const goToLogin = () => {
  emit('complete');
  emit('close');
  router.push('/loginPage');
};
</script>

<style scoped>
.intro-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.intro-modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 800px;
  height: 90vh;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* 진행 표시기 */
.progress-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 24px 20px 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  width: 32px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

.dot:hover {
  background: #cbd5e1;
  transform: scale(1.2);
}

/* 닫기 버튼 */
.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: #64748b;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #334155;
  transform: rotate(90deg);
}

/* 슬라이드 컨텐츠 */
.slide-content {
  padding: 40px 60px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
}

.slide {
  text-align: center;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 0;
  box-sizing: border-box;
}

.slide-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
  will-change: transform;
  animation: float 4s ease-in-out infinite;
  position: relative;
  flex-shrink: 0;
}

.slide-icon::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  opacity: 0.3;
  will-change: transform, opacity;
  animation: pulse 3s ease-in-out infinite;
  z-index: -1;
}

.welcome-icon {
  width: 90px;
  height: 90px;
  font-size: 3rem;
}

.start-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
}

.slide-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 12px;
  line-height: 1.2;
}

.gradient-text {
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease infinite;
}

.slide-description {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 24px;
}

/* Feature Cards */
.feature-cards {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.feature-card {
  flex: 1;
  max-width: 180px;
  padding: 24px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.feature-card {
  will-change: transform;
}

.feature-card:hover {
  transform: translate3d(0, -5px, 0);
  border-color: #3b82f6;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.feature-card i {
  font-size: 2rem;
  color: #3b82f6;
  margin-bottom: 12px;
  display: block;
  transition: transform 0.2s ease-out;
  will-change: transform;
}

.feature-card:hover i {
  transform: scale3d(1.1, 1.1, 1);
}

.feature-card span {
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
}

/* Demo Image */
.demo-image {
  margin: 24px auto;
  padding: 30px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 16px;
  border: 2px solid #93c5fd;
  max-width: 100%;
}

.demo-content {
  text-align: center;
}

.demo-icon {
  font-size: 4rem;
  color: #2563eb;
  margin-bottom: 16px;
}

.demo-content p {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e40af;
  margin: 8px 0;
}

.demo-subtitle {
  font-size: 0.95rem !important;
  font-weight: 500 !important;
  color: #3b82f6 !important;
}

/* Info Tags */
.info-tags {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.info-tag {
  padding: 10px 20px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-tag i {
  color: #3b82f6;
}

/* Gameplay Steps */
.gameplay-steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 24px;
  max-width: 100%;
}

.step {
  display: flex;
  gap: 16px;
  text-align: left;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.step {
  will-change: transform;
}

.step:hover {
  border-color: #3b82f6;
  transform: translate3d(0, -3px, 0);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.step-content h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.step-content p {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
}

/* Multiplayer Features */
.multiplayer-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;
  max-width: 100%;
}

.mp-feature {
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.mp-feature {
  will-change: transform;
}

.mp-feature:hover {
  transform: translate3d(0, -5px, 0);
  border-color: #3b82f6;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.mp-feature i {
  font-size: 2.5rem;
  color: #3b82f6;
  margin-bottom: 16px;
  transition: transform 0.2s ease-out;
  will-change: transform;
}

.mp-feature:hover i {
  transform: scale3d(1.1, 1.1, 1);
}

.mp-feature h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.mp-feature p {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
}

/* Start Options */
.start-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

.start-button {
  padding: 18px 32px;
  border-radius: 16px;
  border: none;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  will-change: transform;
  position: relative;
  overflow: hidden;
}

.start-button.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  color: white;
}

.start-button.primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  will-change: transform;
  transition: transform 0.6s ease-out;
}

.start-button.primary:hover {
  transform: translate3d(0, -3px, 0);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
}

.start-button.primary:hover::before {
  transform: translateX(200%);
}

.start-button.secondary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.start-button.secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  will-change: transform;
  transition: transform 0.6s ease-out;
}

.start-button.secondary:hover {
  transform: translate3d(0, -3px, 0);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
}

.start-button.secondary:hover::before {
  transform: translateX(200%);
}

.text-button {
  margin-top: 16px;
  background: none;
  border: none;
  color: #64748b;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 8px 16px;
  transition: color 0.2s ease;
}

.text-button:hover {
  color: #334155;
  text-decoration: underline;
}

/* Navigation Buttons */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  padding: 20px 60px 40px;
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.nav-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  will-change: transform;
  transition: transform 0.6s ease-out;
}

.nav-button:hover {
  transform: translate3d(0, -2px, 0);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.nav-button:hover::before {
  transform: translateX(200%);
}

.nav-button.prev {
  margin-right: auto;
}

.nav-button.next {
  margin-left: auto;
}

/* GPU 가속 최적화 애니메이션 */
@keyframes float {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -8px, 0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale3d(1, 1, 1);
    opacity: 0.3;
  }
  50% {
    transform: scale3d(1.08, 1.08, 1);
    opacity: 0.5;
  }
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.slide-content {
  will-change: transform, opacity;
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate3d(15px, 0, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

/* 반응형 */
@media (max-width: 768px) {
  .intro-modal-container {
    max-width: 95%;
    border-radius: 16px;
    height: 85vh;
    max-height: 85vh;
  }

  .slide-content {
    padding: 20px 24px;
  }

  .slide {
    padding: 10px 0;
  }

  .slide-title {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }

  .slide-description {
    font-size: 0.9rem;
    margin-bottom: 16px;
  }

  .slide-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
    margin-bottom: 12px;
  }

  .welcome-icon {
    width: 70px;
    height: 70px;
    font-size: 2.5rem;
  }

  .feature-cards {
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }

  .feature-card {
    max-width: 100%;
    padding: 16px 12px;
  }

  .gameplay-steps {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .step {
    padding: 16px;
  }

  .multiplayer-features {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 16px;
  }

  .mp-feature {
    padding: 16px;
  }

  .start-options {
    margin-top: 16px;
    gap: 10px;
  }

  .start-button {
    padding: 14px 24px;
    font-size: 1rem;
  }

  .navigation-buttons {
    padding: 16px 24px 20px;
  }

  .nav-button {
    padding: 10px 20px;
    font-size: 0.9rem;
  }

  .demo-image {
    margin: 16px auto;
    padding: 20px;
  }

  .info-tags {
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }
}
</style>

