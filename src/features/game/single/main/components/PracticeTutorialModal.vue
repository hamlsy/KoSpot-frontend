<template>
  <transition name="tutorial-modal-fade">
    <div v-if="show" class="tutorial-overlay" @click.self="skipTutorial">
      <div class="tutorial-container">
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

        <!-- 슬라이드 래퍼 -->
        <div class="slide-wrapper">
          <transition :name="slideTransitionName" mode="out-in">
            <div :key="currentSlide" class="slide-content">
              <!-- 슬라이드 이미지 -->
              <div class="slide-image-container">
                <img
                  :src="currentSlideImage"
                  :alt="slides[currentSlide].title"
                  class="slide-image"
                />
              </div>

              <!-- 슬라이드 설명 -->
              <div class="slide-description">
                <h3 class="slide-title">{{ slides[currentSlide].title }}</h3>
                <p class="slide-text">{{ slides[currentSlide].description }}</p>
              </div>
            </div>
          </transition>
        </div>

        <!-- 네비게이션 버튼 -->
        <div class="navigation-controls">
          <button
            v-if="currentSlide > 0"
            class="nav-button prev-button"
            @click="prevSlide"
          >
            <i class="fas fa-chevron-left"></i>
            <span>이전</span>
          </button>
          <button
            v-if="currentSlide < slides.length - 1"
            class="nav-button next-button"
            @click="nextSlide"
          >
            <span>다음</span>
            <i class="fas fa-chevron-right"></i>
          </button>
          <button
            v-if="currentSlide === slides.length - 1"
            class="nav-button complete-button"
            @click="completeTutorial"
          >
            <span>시작하기</span>
            <i class="fas fa-check"></i>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import Tutorial1 from '@/shared/assets/images/tutorial/practice/tutorial_1.png';
import Tutorial2 from '@/shared/assets/images/tutorial/practice/tutorial_2.png';
import Tutorial4 from '@/shared/assets/images/tutorial/practice/tutorial_4.png';
import Tutorial5 from '@/shared/assets/images/tutorial/practice/tutorial_5.png';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'complete']);

const currentSlide = ref(0);
const slideDirection = ref('next');

// 튜토리얼 슬라이드 데이터
const slides = [
  {
    title: '로드뷰 연습 게임',
    description: '현재 보이는 로드뷰 화면의 위치를 지도에서 찾아보세요. 주변 건물과 풍경을 자세히 관찰하면 힌트를 얻을 수 있습니다.',
    image: Tutorial1
  },
  {
    title: '지도 열기',
    description: '"지도 열기" 버튼을 눌러 한국 지도를 확인하세요. 지도에서 로드뷰 위치를 추측하여 마커를 놓을 수 있습니다.',
    image: Tutorial2
  },
  {
    title: '힌트 활용',
    description: '힌트 버튼을 사용하면 정답 위치 주변에 원형 힌트가 표시됩니다. 힌트는 총 3번 사용할 수 있으며, 각 힌트마다 더 정확한 위치를 알려줍니다.',
    image: Tutorial4
  },
  {
    title: '위치 선택',
    description: '지도에서 예상되는 위치를 클릭하여 마커를 놓고 "Spot!" 버튼을 눌러 정답을 확인하세요. 실제 위치와 가까울수록 높은 점수를 받습니다!',
    image: Tutorial5
  }
];

// 현재 슬라이드 이미지
const currentSlideImage = computed(() => {
  return slides[currentSlide.value]?.image || '';
});

const slideTransitionName = computed(() => {
  return slideDirection.value === 'prev' ? 'slide-swap-prev' : 'slide-swap-next';
});

// 이미지 사전 로딩
onMounted(() => {
  slides.forEach(slide => {
    const img = new Image();
    img.src = slide.image;
  });
});

const nextSlide = () => {
  if (currentSlide.value < slides.length - 1) {
    slideDirection.value = 'next';
    currentSlide.value++;
  }
};

const prevSlide = () => {
  if (currentSlide.value > 0) {
    slideDirection.value = 'prev';
    currentSlide.value--;
  }
};

const goToSlide = (index) => {
  if (index === currentSlide.value || index < 0 || index >= slides.length) {
    return;
  }
  slideDirection.value = index > currentSlide.value ? 'next' : 'prev';
  currentSlide.value = index;
};

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    currentSlide.value = 0;
    slideDirection.value = 'next';
  }
});

const skipTutorial = () => {
  emit('close');
};

const completeTutorial = () => {
  emit('complete');
  emit('close');
};
</script>

<style scoped>
/* 오버레이 */
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
  transform: translateZ(0);
  contain: paint;
}

/* 튜토리얼 컨테이너 */
.tutorial-container {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 95vh;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  contain: layout paint;
}

.tutorial-modal-fade-enter-active,
.tutorial-modal-fade-leave-active {
  transition: opacity 0.2s ease;
  will-change: opacity;
}

.tutorial-modal-fade-enter-from,
.tutorial-modal-fade-leave-to {
  opacity: 0;
}

.tutorial-modal-fade-enter-active .tutorial-container,
.tutorial-modal-fade-leave-active .tutorial-container {
  transition: transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.2s ease;
  will-change: transform, opacity;
}

.tutorial-modal-fade-enter-from .tutorial-container,
.tutorial-modal-fade-leave-to .tutorial-container {
  transform: translate3d(0, 12px, 0) scale(0.97);
  opacity: 0;
}

.tutorial-modal-fade-enter-to .tutorial-container,
.tutorial-modal-fade-leave-from .tutorial-container {
  transform: translate3d(0, 0, 0) scale(1);
  opacity: 1;
}

/* 진행 표시기 */
.progress-dots {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  flex-shrink: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  transition: background-color 0.18s ease, width 0.18s ease;
}

.dot.active {
  background: #2563eb;
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
  transition: background-color 0.2s, color 0.2s;
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
  overflow: hidden;
  min-height: 0;
  position: relative;
}

/* 슬라이드 컨텐츠 */
.slide-content {
  padding: 0 16px 12px;
  text-align: center;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.slide-swap-next-enter-active,
.slide-swap-next-leave-active,
.slide-swap-prev-enter-active,
.slide-swap-prev-leave-active {
  transition: transform 0.2s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.18s ease;
  will-change: transform, opacity;
}

.slide-swap-next-enter-from {
  transform: translate3d(20px, 0, 0);
  opacity: 0;
}

.slide-swap-next-leave-to {
  transform: translate3d(-14px, 0, 0);
  opacity: 0;
}

.slide-swap-prev-enter-from {
  transform: translate3d(-20px, 0, 0);
  opacity: 0;
}

.slide-swap-prev-leave-to {
  transform: translate3d(14px, 0, 0);
  opacity: 0;
}

.slide-swap-next-enter-to,
.slide-swap-next-leave-from,
.slide-swap-prev-enter-to,
.slide-swap-prev-leave-from {
  transform: translate3d(0, 0, 0);
  opacity: 1;
}

/* 이미지 컨테이너 */
.slide-image-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto 24px;
  border-radius: 16px;
  overflow: hidden;
  background: #f3f4f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.slide-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

/* 설명 영역 */
.slide-description {
  padding: 0;
}

.slide-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.slide-text {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* 네비게이션 컨트롤 */
.navigation-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 24px;
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  gap: 10px;
}

.nav-button {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-button:hover {
  transform: translateY(-2px);
}

.prev-button {
  background: #f3f4f6;
  color: #6b7280;
  margin-right: auto;
}

.prev-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.next-button,
.complete-button {
  margin-left: auto;
}

.next-button {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.next-button:hover {
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.complete-button {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.complete-button:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .tutorial-modal-fade-enter-active,
  .tutorial-modal-fade-leave-active,
  .tutorial-modal-fade-enter-active .tutorial-container,
  .tutorial-modal-fade-leave-active .tutorial-container,
  .slide-swap-next-enter-active,
  .slide-swap-next-leave-active,
  .slide-swap-prev-enter-active,
  .slide-swap-prev-leave-active {
    transition-duration: 0.01ms;
  }
}

/* 반응형 - 태블릿 */
@media (max-width: 768px) {
  .tutorial-overlay {
    padding: 15px;
  }

  .tutorial-container {
    max-width: 90%;
    border-radius: 20px;
    max-height: 90vh;
    padding: 0.75rem;
  }

  .progress-dots {
    padding: 16px;
  }

  .slide-content {
    padding: 0 16px 16px;
  }

  .slide-title {
    font-size: 1.3rem;
  }

  .slide-text {
    font-size: 0.95rem;
  }

  .slide-image-container {
    margin-bottom: 20px;
  }

  .navigation-controls {
    padding: 14px 16px 20px;
  }

  .nav-button {
    padding: 9px 18px;
    font-size: 0.9rem;
  }
}

/* 반응형 - 모바일 */
@media (max-width: 480px) {
  .tutorial-overlay {
    padding: 12px;
  }

  .tutorial-container {
    max-width: 100%;
    border-radius: 16px;
    max-height: 92vh;
    padding: 0.5rem;
  }

  .progress-dots {
    padding: 12px;
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
    padding: 0 12px 12px;
  }

  .slide-title {
    font-size: 1.2rem;
    margin-bottom: 10px;
  }

  .slide-text {
    font-size: 0.9rem;
  }

  .slide-image-container {
    margin-bottom: 16px;
    border-radius: 12px;
  }

  .navigation-controls {
    padding: 12px 12px 16px;
    gap: 8px;
  }

  .nav-button {
    padding: 8px 16px;
    font-size: 0.85rem;
    min-width: 100px;
    justify-content: center;
  }

  .prev-button {
    margin-right: 0;
  }

  .next-button,
  .complete-button {
    margin-left: 0;
  }
}
</style>
