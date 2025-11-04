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
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const emit = defineEmits(['open-tutorial']);

const router = useRouter();

const isClosed = ref(false);

const startRoadView = () => {
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
  padding: 30px 20px;
  margin: 0 0 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  overflow: hidden;
}

.hero-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.hero-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  color: white;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: white;
}

.hero-description {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 24px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.hero-button {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-button.primary {
  background: white;
  color: #667eea;
}

.hero-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.hero-button.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.hero-button.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 반응형 */
@media (max-width: 768px) {
  .hero-section {
    padding: 24px 16px;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-description {
    font-size: 0.9rem;
    margin-bottom: 20px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-button {
    justify-content: center;
  }
}
</style>

