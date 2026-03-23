<template>
  <section v-if="!isLoggedIn" class="hero-section">
    <div class="hero-content">
      <h1 class="hero-title">로드뷰로 대한민국을 탐험하세요</h1>
      <p class="hero-description">
        관광지 로드뷰를 보고 지도에 위치를 찍어 점수를 겨루는 게임
      </p>

      <!-- 3단계 게임 플로우 -->
      <div class="hero-flow">
        <div class="flow-step">
          <div class="flow-icon"><i class="fas fa-street-view"></i></div>
          <span class="flow-label">로드뷰 관찰</span>
        </div>
        <i class="fas fa-chevron-right flow-arrow"></i>
        <div class="flow-step">
          <div class="flow-icon"><i class="fas fa-map-marker-alt"></i></div>
          <span class="flow-label">위치 추리</span>
        </div>
        <i class="fas fa-chevron-right flow-arrow"></i>
        <div class="flow-step">
          <div class="flow-icon"><i class="fas fa-trophy"></i></div>
          <span class="flow-label">점수 획득</span>
        </div>
      </div>

      <!-- CTA 버튼 -->
      <div class="hero-actions">
        <button class="hero-button primary" @click="startRoadView">
          <i class="fas fa-play"></i>
          <span>지금 바로 체험하기</span>
        </button>
        <button class="hero-button secondary" @click="openTutorial">
          <i class="fas fa-question-circle"></i>
          <span>게임 소개 보기</span>
        </button>
      </div>

      <!-- 통계 배지 -->
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-number">5,000+</span>
          <span class="stat-label">관광지 문제</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">500+</span>
          <span class="stat-label">게임 플레이</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-number">17개</span>
          <span class="stat-label">전국 시도</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const emit = defineEmits(['open-tutorial']);

const router = useRouter();

const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));

const startRoadView = () => {
  router.push({ path: '/roadView/practice', query: { sido: 'SEOUL' } });
};

const openTutorial = () => {
  emit('open-tutorial');
};
</script>

<style scoped>
/* GRADIENTS.PRIMARY: #52DEE5 → #EEE5E9 (colors.js 기준) */
.hero-section {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: linear-gradient(135deg, #52DEE5 0%, #EEE5E9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 20px;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 240px;
  height: 240px;
  background: rgba(76, 201, 207, 0.2);
  /* BRAND.PRIMARY rgba */
  border-radius: 50%;
  pointer-events: none;
}

.hero-section::after {
  content: '';
  position: absolute;
  bottom: -40px;
  left: -40px;
  width: 180px;
  height: 180px;
  background: rgba(238, 229, 233, 0.5);
  /* BRAND.SECONDARY rgba */
  border-radius: 50%;
  pointer-events: none;
}


.hero-content {
  max-width: 680px;
  width: 100%;
  padding: 40px 24px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-primary);
  /* TEXT.PRIMARY #111827 */
  margin: 0 30px 12px;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.hero-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  /* TEXT.SECONDARY #6b7280 */
  margin: 0 0 14px;
  line-height: 1.6;
}

/* 3단계 플로우 */
.hero-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 28px;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.flow-icon {
  width: 52px;
  height: 52px;
  background: var(--color-primary);
  /* BRAND.PRIMARY #4cc9cf */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #ffffff;
  transition: transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(76, 201, 207, 0.35);
}

.flow-step:hover .flow-icon {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(76, 201, 207, 0.45);
}

.flow-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  /* TEXT.PRIMARY #111827 */
  white-space: nowrap;
}

.flow-arrow {
  color: var(--color-text-secondary);
  /* TEXT.SECONDARY #6b7280 */
  font-size: 13px;
  margin-bottom: 20px;
}

/* CTA 버튼 */
.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.hero-button {
  padding: 11px 26px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.hero-button.primary {
  background: var(--color-primary);
  /* BRAND.PRIMARY */
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(76, 201, 207, 0.4);
}

.hero-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(76, 201, 207, 0.5);
}

.hero-button.secondary {
  background: #ffffff;
  color: var(--color-text-primary);
  /* TEXT.PRIMARY */
  border: 2px solid var(--color-primary);
}

.hero-button.secondary:hover {
  background: var(--color-primary);
  color: #ffffff;
  transform: translateY(-2px);
}

/* 통계 배지 */
.hero-stats {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50px;
  padding: 10px 28px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 18px;
}

.stat-number {
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text-primary);
  /* TEXT.PRIMARY #111827 */
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  /* TEXT.SECONDARY #6b7280 */
  margin-top: 3px;
  white-space: nowrap;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: var(--color-border);
  /* BRAND.SECONDARY #EEE5E9 */
  flex-shrink: 0;
}

/* 모바일 */
@media (max-width: 640px) {
  .hero-title {
    font-size: 1.4rem;
  }

  .hero-description {
    font-size: 0.875rem;
    margin-bottom: 20px;
  }

  .hero-flow {
    flex-direction: column;
    gap: 6px;
    margin-bottom: 20px;
  }

  .flow-arrow {
    transform: rotate(90deg);
    margin-bottom: 0;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .hero-button {
    width: 100%;
    max-width: 260px;
    justify-content: center;
  }

  .hero-stats {
    padding: 8px 12px;
  }

  .stat-item {
    padding: 0 10px;
  }

  .stat-number {
    font-size: 15px;
  }
}
</style>
