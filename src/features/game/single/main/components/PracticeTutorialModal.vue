<template>
  <div v-if="show" class="tutorial-overlay" @click.self="skipTutorial">
    <div class="tutorial-container">
      <!-- 헤더 -->
      <div class="tutorial-header">
        <button
          class="top-dismiss-button"
          type="button"
          @click="skipTutorial"
        >
          <i class="fas fa-times"></i>
          튜토리얼 닫기
        </button>
        <div class="progress-indicator">
          <span
            v-for="(slide, index) in slides"
            :key="index"
            class="progress-dot"
            :class="{ active: currentSlide === index }"
            @click="goToSlide(index)"
          ></span>
        </div>
      </div>

      <!-- 슬라이드 컨텐츠 -->
      <div class="slide-wrapper">
        <div class="slide-content" :key="currentSlide">
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
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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

// 이미지 사전 로딩
onMounted(() => {
  slides.forEach(slide => {
    const img = new Image();
    img.src = slide.image;
  });
});

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

const completeTutorial = () => {
  emit('complete');
  emit('close');
};
</script>

<style scoped>
/* 오버레이 */
.tutorial-overlay {
  /* position: absolute; */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 0;
  border-radius: 24px;
  overflow: hidden;
}

/* 튜토리얼 컨테이너 */
.tutorial-container {
  background: white;
  border-radius: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  padding-top: 0px;
  position: relative;
  box-shadow: none;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

/* 헤더 */
.tutorial-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 0;
  margin-bottom: 1.75rem;
  border-bottom: none;
  position: relative;
}

.top-dismiss-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.1rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  border: 1px solid #cbd5f5;
  color: #1e293b;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.top-dismiss-button i {
  font-size: 0.9rem;
}

.top-dismiss-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.35);
}

.top-dismiss-button:active {
  transform: translateY(0);
  box-shadow: none;
}

/* 진행 표시기 */
.progress-indicator {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex: 1;
}

.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 2px solid #cbd5f5;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.progress-dot.active {
  background: #3b82f6;
  border-color: #2563eb;
  transform: scale(1.15);
}

.progress-dot:hover {
  background: #bfdbfe;
}

/* 슬라이드 래퍼 */
.slide-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 슬라이드 컨텐츠 */
.slide-content {
  width: 100%;
  padding: 0;
  text-align: center;
}

/* 이미지 컨테이너 */
.slide-image-container {
  width: 100%;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  background: #f1f5f9;
}

.slide-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 설명 영역 */
.slide-description {
  padding: 0;
}

.slide-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.slide-text {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* 네비게이션 컨트롤 */
.navigation-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  margin-top: 1.5rem;
  border-top: none;
  gap: 10px;
  flex-wrap: nowrap;
}

.nav-button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-button:hover {
  opacity: 0.9;
}

.nav-button:active {
  opacity: 0.8;
}

.prev-button {
  background: #f1f5f9;
  color: #475569;
}

.next-button,
.complete-button {
  background: #3b82f6;
  color: white;
  margin-left: auto;
}

.complete-button {
  background: #10b981;
}

/* 반응형 */
@media (max-width: 768px) {
  .tutorial-container {
    max-width: 95%;
    border-radius: 12px;
  }

  .slide-content {
    padding: 20px;
  }

  .slide-image-container {
    height: 200px;
    margin-bottom: 16px;
  }

  .slide-title {
    font-size: 1.2rem;
  }

  .slide-text {
    font-size: 0.9rem;
  }

  .navigation-controls {
    padding: 12px 16px;
  }

  .nav-button {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .slide-image-container {
    height: 180px;
  }

  .slide-title {
    font-size: 1.1rem;
  }

  .slide-text {
    font-size: 0.85rem;
  }

  .navigation-controls {
    justify-content: center;
    gap: 8px;
  }

  .nav-button {
    min-width: 120px;
    justify-content: center;
  }

  .next-button,
  .complete-button {
    margin-left: 0;
  }
}
</style>
