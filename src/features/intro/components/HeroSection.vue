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
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
  will-change: transform;
}

.hero-section:hover {
  transform: translate3d(0, -2px, 0);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.hero-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  color: #3b82f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.hero-close {
  will-change: transform;
}

.hero-close:hover {
  background: white;
  color: #2563eb;
  transform: scale3d(1.1, 1.1, 1) rotate(90deg);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  color: #111827;
}

.hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1rem;
  line-height: 1.6;
  color: #3b82f6;
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
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, background 0.2s ease-out;
  display: flex;
  align-items: center;
  gap: 8px;
  will-change: transform;
  position: relative;
  overflow: hidden;
}

.hero-button.primary {
  background: white;
  color: #111827;
  border: 2px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.hero-button.primary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translate3d(0, -1px, 0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.hero-button.secondary {
  background: white;
  color: #3b82f6;
  border: 2px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.hero-button.secondary:hover {
  background: #eff6ff;
  transform: translate3d(0, -2px, 0);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
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

