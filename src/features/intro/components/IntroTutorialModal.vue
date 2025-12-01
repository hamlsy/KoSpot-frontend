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
      <div class="slide-wrapper">
        <div :key="currentSlide" class="slide-content">
          <!-- 슬라이드 1: 환영 -->
          <div v-if="currentSlide === 0" class="slide slide-welcome">
            <div class="slide-icon">
              <i class="fas fa-map-marked-alt"></i>
            </div>
            <h1 class="slide-title">KoSpot에 오신 것을 환영합니다!</h1>
            <p class="slide-description">
              대한민국의 관광지 기반 좌표 추리 게임
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

          <!-- 슬라이드 2: 게임 방법 -->
          <div v-if="currentSlide === 1" class="slide slide-gameplay">
            <div class="slide-icon">
              <i class="fas fa-gamepad"></i>
            </div>
            <h2 class="slide-title">게임 방법</h2>
            <p class="slide-description">
              로드뷰를 보고 위치를 추리해서<br />
              지도에 마커를 찍어 점수를 획득하세요
            </p>
            <div class="gameplay-steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h3>로드뷰 관찰</h3>
                  <p>주변 건물, 표지판, 풍경을 살펴보세요</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h3>위치 찍기</h3>
                  <p>지도에서 예상 위치에 마커를 놓으세요</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h3>점수 획득</h3>
                  <p>실제 위치와 가까울수록 높은 점수!</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 슬라이드 3: 멀티플레이어 -->
          <div v-if="currentSlide === 2" class="slide slide-multiplayer">
            <div class="slide-icon">
              <i class="fas fa-users"></i>
            </div>
            <h2 class="slide-title">멀티플레이어 모드</h2>
            <p class="slide-description">
              친구들과 실시간으로 대결하고<br />
              누가 더 정확한지 겨뤄보세요!
            </p>
            <div class="multiplayer-features">
              <div class="mp-feature">
                <i class="fas fa-door-open"></i>
                <h3>방 만들기</h3>
                <p>게임방을 생성하고 친구들을 초대하세요</p>
              </div>
              <div class="mp-feature">
                <i class="fas fa-medal"></i>
                <h3>실시간 대결</h3>
                <p>채팅하며 순위를 겨루는 즐거운 경쟁!</p>
              </div>
            </div>
          </div>

          <!-- 슬라이드 4: 시작하기 -->
          <div v-if="currentSlide === 3" class="slide slide-start">
            <div class="slide-icon">
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
import { BRAND } from '@/core/constants/colors';
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
  { id: 'gameplay', title: '게임 방법' },
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
/* 오버레이 */
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

/* 모달 컨테이너 */
.intro-modal-container {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  min-height: 500px;
  max-height: 85vh;
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
  padding: 20px;
  flex-shrink: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dot.active {
  background: var(--color-primary);
  width: 32px;
  border-radius: 5px;
}

.dot:hover {
  background: #cbd5e1;
}

/* 닫기 버튼 */
.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: #6b7280;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #111827;
}

/* 슬라이드 래퍼 */
.slide-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

/* 슬라이드 컨텐츠 */
.slide-content {
  padding: 20px 50px 40px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 슬라이드 아이콘 */
.slide-icon {
  width: 70px;
  height: 70px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.slide-icon:hover {
  transform: scale(1.05);
}

.slide-icon i {
  display: block;
}

/* 타이틀 */
.slide-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
  line-height: 1.3;
}

.slide-welcome .slide-title {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 설명 */
.slide-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 28px;
}

/* 기능 카드 */
.feature-cards {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  flex-wrap: wrap;
  width: 100%;
}

.feature-card {
  flex: 1;
  min-width: 140px;
  max-width: 180px;
  padding: 20px 16px;
  background: #f3f4f6;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.feature-card i {
  font-size: 1.8rem;
  color: var(--color-primary);
  margin-bottom: 10px;
  display: block;
}

.feature-card span {
  font-weight: 600;
  color: #111827;
  font-size: 0.95rem;
}

/* 게임 플레이 단계 */
.gameplay-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
  width: 100%;
  max-width: 500px;
}

.step {
  display: flex;
  gap: 16px;
  text-align: left;
  padding: 18px;
  background: #f3f4f6;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.step:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

.step-number {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.step-content p {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
}

/* 멀티플레이어 기능 */
.multiplayer-features {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  width: 100%;
  max-width: 500px;
}

.mp-feature {
  flex: 1;
  padding: 24px 20px;
  background: #f3f4f6;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.mp-feature:hover {
  transform: translateY(-3px);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.mp-feature i {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 12px;
}

.mp-feature h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.mp-feature p {
  font-size: 0.88rem;
  color: #6b7280;
  line-height: 1.5;
}

/* 시작 옵션 */
.start-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  max-width: 400px;
  width: 100%;
}

.start-button {
  padding: 16px 32px;
  border-radius: 14px;
  border: none;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.start-button.primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary) 100%);
  color: white;
}

.start-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.start-button.secondary {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.start-button.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.text-button {
  margin-top: 12px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 8px 16px;
  transition: color 0.2s ease;
}

.text-button:hover {
  color: #111827;
  text-decoration: underline;
}

/* 네비게이션 버튼 */
.navigation-buttons {
  display: flex;
  justify-content: space-between;
  padding: 16px 50px 24px;
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.nav-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.nav-button.prev {
  margin-right: auto;
}

.nav-button.next {
  margin-left: auto;
}

/* 반응형 - 태블릿 */
@media (max-width: 768px) {
  .intro-modal-container {
    max-width: 90%;
    border-radius: 20px;
    max-height: 90vh;
  }

  .slide-content {
    padding: 16px 32px 32px;
  }

  .slide-title {
    font-size: 1.5rem;
  }

  .slide-description {
    font-size: 0.95rem;
    margin-bottom: 20px;
  }

  .slide-icon {
    width: 60px;
    height: 60px;
    font-size: 1.8rem;
    margin-bottom: 16px;
  }

  .feature-cards {
    gap: 12px;
  }

  .feature-card {
    min-width: 120px;
    padding: 16px 12px;
  }

  .gameplay-steps {
    gap: 12px;
  }

  .step {
    padding: 14px;
  }

  .multiplayer-features {
    flex-direction: column;
    max-width: 100%;
  }

  .mp-feature {
    padding: 20px 16px;
  }

  .navigation-buttons {
    padding: 14px 32px 20px;
  }

  .nav-button {
    padding: 9px 18px;
    font-size: 0.9rem;
  }
}

/* 반응형 - 모바일 */
@media (max-width: 480px) {
  .intro-modal-overlay {
    padding: 12px;
  }

  .intro-modal-container {
    max-width: 100%;
    border-radius: 16px;
    max-height: 92vh;
  }

  .progress-dots {
    padding: 16px;
    gap: 10px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }

  .dot.active {
    width: 28px;
  }

  .close-button {
    width: 32px;
    height: 32px;
    top: 12px;
    right: 12px;
    font-size: 1rem;
  }

  .slide-content {
    padding: 12px 24px 24px;
  }

  .slide-title {
    font-size: 1.3rem;
    margin-bottom: 10px;
  }

  .slide-description {
    font-size: 0.9rem;
    margin-bottom: 16px;
  }

  .slide-icon {
    width: 56px;
    height: 56px;
    font-size: 1.6rem;
    margin-bottom: 14px;
  }

  .feature-cards {
    flex-direction: column;
    gap: 10px;
    max-width: 100%;
  }

  .feature-card {
    max-width: 100%;
    padding: 14px;
  }

  .gameplay-steps {
    gap: 10px;
    max-width: 100%;
  }

  .step {
    padding: 12px;
  }

  .step-number {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .step-content h3 {
    font-size: 0.95rem;
  }

  .step-content p {
    font-size: 0.85rem;
  }

  .multiplayer-features {
    gap: 10px;
  }

  .mp-feature {
    padding: 18px 14px;
  }

  .mp-feature i {
    font-size: 1.8rem;
  }

  .mp-feature h3 {
    font-size: 0.95rem;
  }

  .mp-feature p {
    font-size: 0.85rem;
  }

  .start-options {
    margin-top: 20px;
    gap: 10px;
    max-width: 100%;
  }

  .start-button {
    padding: 14px 24px;
    font-size: 0.95rem;
  }

  .navigation-buttons {
    padding: 12px 24px 16px;
  }

  .nav-button {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}
</style>
