<template>
  <section v-if="!isClosed" class="hero-section">
    <button class="hero-close" @click="closeHero" title="닫기">
      <i class="fas fa-times"></i>
    </button>
    
    <div class="hero-content">
      <h1 class="hero-title">KoSpot - 한국 지리 게임</h1>
      
      <p class="hero-description">
        실제 로드뷰로 위치를 맞추고, 친구들과 경쟁하세요
      </p>
      
      <div class="hero-actions">
        <button class="hero-button primary" @click="startRoadView">
          <i class="fas fa-play"></i>
          <span>시작하기</span>
        </button>
        <button class="hero-button secondary" @click="openTutorial">
          <i class="fas fa-question-circle"></i>
          <span>게임 소개</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const emit = defineEmits(['open-tutorial']);

const router = useRouter();

const isClosed = ref(false);

// 로그인 여부 확인
const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));

const startRoadView = () => {
  // 로그인하지 않은 경우 로그인 페이지로 이동
  if (!isLoggedIn.value) {
    router.push('/loginPage');
    return;
  }
  
  // 로그인한 경우 로드뷰 메인으로 이동
  router.push('/roadView/main');
};

const openTutorial = () => {
  emit('open-tutorial');
};

const closeHero = () => {
  isClosed.value = true;
};
</script>

<style scoped>
.hero-section {
  position: relative;
  padding: var(--spacing-2xl) var(--spacing-xl);
  margin: 0 0 var(--spacing-xl);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  opacity: 0.8;
}

.hero-section:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.hero-close {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 36px;
  height: 36px;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  z-index: 10;
}

.hero-close:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: rotate(90deg);
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-display);
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.hero-description {
  font-size: var(--font-size-h3);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.hero-button {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-body);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.hero-button.primary {
  background: var(--color-primary);
  color: white;
  border: none;
  box-shadow: var(--shadow-sm);
}

.hero-button.primary:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.hero-button.secondary {
  background: var(--color-surface);
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  box-shadow: none;
}

.hero-button.secondary:hover {
  background: var(--color-primary);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* 반응형 */
@media (max-width: 768px) {
  .hero-section {
    padding: var(--spacing-xl) var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .hero-title {
    font-size: var(--font-size-h1);
  }

  .hero-description {
    font-size: var(--font-size-body);
    margin-bottom: var(--spacing-lg);
  }

  .hero-actions {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .hero-button {
    justify-content: center;
    width: 100%;
  }
}
</style>

