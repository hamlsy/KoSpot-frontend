<template>
  <section v-if="!isClosed" class="alt-hero">
    <button class="alt-hero-close" @click="closeHero" title="닫기">
      <i class="fas fa-times"></i>
    </button>
    
    <!-- Background Pattern -->
    <div class="alt-hero-bg-pattern">
      <div class="alt-pattern-circle alt-pattern-1"></div>
      <div class="alt-pattern-circle alt-pattern-2"></div>
      <div class="alt-pattern-circle alt-pattern-3"></div>
    </div>
    
    <!-- Content - Asymmetric Layout -->
    <div class="alt-container">
      <div class="alt-hero-content">
        <!-- Left Side - Text -->
        <div class="alt-hero-text">
          <div class="alt-hero-badge">
            <i class="fas fa-map-marked-alt"></i>
            <span>한국 지리 탐험</span>
          </div>
          
          <h1 class="alt-hero-title">
            <span class="alt-title-main alt-gradient-text">코스팟</span>
            <span class="alt-title-sub">KoSpot</span>
            <span class="alt-title-description">로드뷰로 떠나는 한국 여행</span>
          </h1>
          
          <p class="alt-hero-description">
            실제 거리뷰로 위치를 맞추고<br />
            친구들과 함께 전국을 탐험하세요
          </p>
          
          <div class="alt-hero-actions">
            <button class="alt-btn alt-btn-large alt-btn-primary" @click="startRoadView">
              <i class="fas fa-play-circle"></i>
              <span>지금 시작하기</span>
            </button>
            <button class="alt-btn alt-btn-large alt-btn-accent" @click="openTutorial">
              <i class="fas fa-question-circle"></i>
              <span>게임 소개</span>
            </button>
          </div>
          
          <!-- Quick Stats -->
          <div class="alt-hero-stats">
            <div class="alt-hero-stat alt-stagger-item">
              <div class="alt-stat-icon">
                <i class="fas fa-map-pin"></i>
              </div>
              <div class="alt-stat-text">
                <span class="alt-stat-value">500+</span>
                <span class="alt-stat-label">관광지</span>
              </div>
            </div>
            <div class="alt-hero-stat alt-stagger-item">
              <div class="alt-stat-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="alt-stat-text">
                <span class="alt-stat-value">1,234</span>
                <span class="alt-stat-label">플레이어</span>
              </div>
            </div>
            <div class="alt-hero-stat alt-stagger-item">
              <div class="alt-stat-icon">
                <i class="fas fa-trophy"></i>
              </div>
              <div class="alt-stat-text">
                <span class="alt-stat-value">10k+</span>
                <span class="alt-stat-label">게임 플레이</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right Side - Visual Element (Korea Map Silhouette) -->
        <div class="alt-hero-visual">
          <div class="alt-map-container">
            <i class="fas fa-map-marked-alt alt-location-icon"></i>
            <!-- Decorative location pins -->
            <div class="alt-deco-pin alt-deco-pin-1">
              <i class="fas fa-map-pin"></i>
            </div>
            <div class="alt-deco-pin alt-deco-pin-2">
              <i class="fas fa-map-pin"></i>
            </div>
            <div class="alt-deco-pin alt-deco-pin-3">
              <i class="fas fa-map-pin"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Scroll Indicator -->
    <div class="alt-scroll-indicator">
      <i class="fas fa-chevron-down"></i>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const emit = defineEmits(['open-tutorial']);

const router = useRouter();
const isClosed = ref(false);

const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));

const startRoadView = () => {
  if (!isLoggedIn.value) {
    router.push('/loginPage');
    return;
  }
  router.push({ name: 'AltRoadViewMainView' });
};

const openTutorial = () => {
  emit('open-tutorial');
};

const closeHero = () => {
  isClosed.value = true;
};
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

/* ========================================
   ALTERNATIVE HERO SECTION - BOLD & ASYMMETRIC
   ======================================== */

.alt-hero {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  background: var(--alt-bg-hero);
  overflow: hidden;
  padding: var(--alt-space-2xl) 0;
  margin-bottom: var(--alt-space-xl);
}

.alt-hero-close {
  position: absolute;
  top: var(--alt-space-md);
  right: var(--alt-space-md);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(14, 165, 233, 0.3);
  border-radius: 50%;
  color: var(--alt-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all var(--alt-transition-base);
  z-index: 10;
}

.alt-hero-close:hover {
  background: var(--alt-primary);
  color: var(--alt-text-secondary);
  border-color: var(--alt-primary);
  transform: rotate(90deg) scale(1.1);
}

/* Background Pattern */
.alt-hero-bg-pattern {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.alt-pattern-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%);
  animation: alt-pulse 6s ease-in-out infinite;
}

.alt-pattern-1 {
  width: 600px;
  height: 600px;
  top: -200px;
  right: -100px;
  animation-delay: 0s;
}

.alt-pattern-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: 10%;
  animation-delay: 2s;
}

.alt-pattern-3 {
  width: 300px;
  height: 300px;
  top: 50%;
  left: -50px;
  animation-delay: 4s;
}

/* Content */
.alt-hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: var(--alt-space-xl);
  align-items: center;
}

/* Left Side - Text */
.alt-hero-text {
  animation: alt-fade-in-up 1s ease-out;
}

.alt-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--alt-space-xs);
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(6, 182, 212, 0.2));
  border: 2px solid var(--alt-primary);
  border-radius: var(--alt-radius-full);
  color: var(--alt-primary);
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-body);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--alt-space-md);
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.2);
  animation: alt-bounce-in 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.alt-hero-title {
  display: flex;
  flex-direction: column;
  gap: var(--alt-space-sm);
  margin-bottom: var(--alt-space-md);
}

.alt-title-main {
  font-family: var(--alt-font-heading-ko);
  font-size: var(--alt-font-display);
  line-height: 1;
  letter-spacing: -0.02em;
}

.alt-title-sub {
  font-family: var(--alt-font-heading-en);
  font-size: calc(var(--alt-font-display) * 0.4);
  color: var(--alt-text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.alt-title-description {
  font-family: var(--alt-font-body);
  font-size: var(--alt-font-h3);
  color: var(--alt-primary);
  font-weight: 600;
  margin-top: var(--alt-space-xs);
}

.alt-hero-description {
  font-size: var(--alt-font-body-large);
  line-height: 1.8;
  color: var(--alt-text-muted);
  margin-bottom: var(--alt-space-lg);
  max-width: 500px;
}

.alt-hero-actions {
  display: flex;
  gap: var(--alt-space-md);
  margin-bottom: var(--alt-space-xl);
}

/* Quick Stats */
.alt-hero-stats {
  display: flex;
  gap: var(--alt-space-lg);
  margin-top: var(--alt-space-xl);
}

.alt-hero-stat {
  display: flex;
  align-items: center;
  gap: var(--alt-space-sm);
}

.alt-stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  border-radius: var(--alt-radius-md);
  color: var(--alt-text-secondary);
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.alt-stat-text {
  display: flex;
  flex-direction: column;
}

.alt-stat-value {
  font-family: var(--alt-font-heading-en);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--alt-text-primary);
  line-height: 1;
}

.alt-stat-label {
  font-size: var(--alt-font-small);
  color: var(--alt-text-muted);
  margin-top: 0.25rem;
}

/* Right Side - Visual */
.alt-hero-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: alt-slide-in-right 1s ease-out;
}

.alt-map-container {
  position: relative;
  width: 400px;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
  border-radius: 50%;
  border: 4px solid rgba(14, 165, 233, 0.3);
  box-shadow: 0 20px 60px rgba(14, 165, 233, 0.2);
}

.alt-map-container .alt-location-icon {
  font-size: 12rem;
  opacity: 0.3;
  animation: alt-pulse 3s ease-in-out infinite;
}

/* Decorative Pins */
.alt-deco-pin {
  position: absolute;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--alt-accent);
  border-radius: 50%;
  color: var(--alt-text-secondary);
  font-size: 1.25rem;
  box-shadow: 0 4px 16px rgba(255, 127, 80, 0.4);
  animation: alt-bounce-in 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.alt-deco-pin-1 {
  top: 10%;
  right: 15%;
  animation-delay: 0.2s;
}

.alt-deco-pin-2 {
  bottom: 20%;
  left: 10%;
  animation-delay: 0.4s;
}

.alt-deco-pin-3 {
  top: 50%;
  right: 5%;
  animation-delay: 0.6s;
}

/* Scroll Indicator */
.alt-scroll-indicator {
  position: absolute;
  bottom: var(--alt-space-lg);
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  color: var(--alt-primary);
  animation: alt-pulse 2s ease-in-out infinite;
  z-index: 1;
}

/* Responsive */
@media (max-width: 1024px) {
  .alt-hero {
    min-height: 80vh;
    padding: var(--alt-space-xl) 0;
  }

  .alt-hero-content {
    grid-template-columns: 1fr;
    gap: var(--alt-space-lg);
  }

  .alt-hero-visual {
    order: -1;
  }

  .alt-map-container {
    width: 300px;
    height: 300px;
  }

  .alt-map-container .alt-location-icon {
    font-size: 8rem;
  }
}

@media (max-width: 768px) {
  .alt-hero {
    min-height: auto;
    padding: var(--alt-space-lg) 0;
  }

  .alt-hero-actions {
    flex-direction: column;
    gap: var(--alt-space-sm);
  }

  .alt-hero-actions .alt-btn {
    width: 100%;
  }

  .alt-hero-stats {
    flex-direction: column;
    gap: var(--alt-space-md);
  }

  .alt-map-container {
    width: 250px;
    height: 250px;
  }

  .alt-map-container .alt-location-icon {
    font-size: 6rem;
  }

  .alt-deco-pin {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .alt-hero-stats {
    gap: var(--alt-space-sm);
  }

  .alt-stat-icon {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }

  .alt-stat-value {
    font-size: 1.5rem;
  }

  .alt-stat-label {
    font-size: 0.75rem;
  }
}
</style>

