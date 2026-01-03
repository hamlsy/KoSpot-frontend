<template>
  <div class="shop-preview">
    <NavigationBar />
    
    <!-- 디자인 선택 패널 -->
    <div class="design-selector">
      <div class="selector-inner">
        <h2>상점 디자인 미리보기</h2>
        <p class="selector-desc">4가지 디자인 중 원하시는 디자인을 선택해주세요</p>
        
        <div class="design-tabs">
          <button
            v-for="design in designs"
            :key="design.id"
            class="design-tab"
            :class="{ active: currentDesign === design.id }"
            @click="selectDesign(design.id)"
          >
            <span class="tab-letter">{{ design.letter }}</span>
            <span class="tab-name">{{ design.name }}</span>
          </button>
        </div>

        <div class="design-description">
          <div class="desc-icon">
            <i :class="currentDesignInfo.icon"></i>
          </div>
          <div class="desc-content">
            <h3>{{ currentDesignInfo.name }}</h3>
            <p>{{ currentDesignInfo.description }}</p>
            <ul class="feature-list">
              <li v-for="feature in currentDesignInfo.features" :key="feature">
                <i class="fas fa-check"></i>
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 디자인 미리보기 영역 -->
    <div class="preview-container">
      <transition name="fade" mode="out-in">
        <component :is="currentComponent" :key="currentDesign" />
      </transition>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'
import NavigationBar from '@/core/components/NavigationBar.vue'

export default {
  name: 'ShopPreview',
  
  components: {
    NavigationBar,
    ShopDesignA: defineAsyncComponent(() => import('./designs/ShopDesignA.vue')),
    ShopDesignB: defineAsyncComponent(() => import('./designs/ShopDesignB.vue')),
    ShopDesignC: defineAsyncComponent(() => import('./designs/ShopDesignC.vue')),
    ShopDesignD: defineAsyncComponent(() => import('./designs/ShopDesignD.vue'))
  },

  data() {
    return {
      currentDesign: 'A',
      designs: [
        {
          id: 'A',
          letter: 'A',
          name: '미니멀 카드',
          icon: 'fas fa-th-large',
          description: 'MainView의 게임 모드 카드 스타일을 계승한 깔끔한 디자인입니다.',
          features: [
            '충분한 여백과 깔끔한 레이아웃',
            '3~4열 반응형 그리드',
            '부드러운 호버 애니메이션',
            '아이템 이미지 중심 구성'
          ]
        },
        {
          id: 'B',
          letter: 'B',
          name: '사이드바 네비게이션',
          icon: 'fas fa-columns',
          description: '왼쪽 고정 카테고리 사이드바와 오른쪽 콘텐츠 영역으로 구성된 디자인입니다.',
          features: [
            '한눈에 카테고리 파악 가능',
            '넓은 콘텐츠 영역',
            'Sticky 사이드바',
            '하단 포인트 표시'
          ]
        },
        {
          id: 'C',
          letter: 'C',
          name: '컴팩트 리스트',
          icon: 'fas fa-list',
          description: '정보 밀도를 높인 리스트 형태의 효율적인 디자인입니다.',
          features: [
            '스크롤 효율성 극대화',
            '많은 아이템 빠르게 훑기',
            '드롭다운 카테고리 선택',
            '상단 고정 툴바'
          ]
        },
        {
          id: 'D',
          letter: 'D',
          name: '비주얼 갤러리',
          icon: 'fas fa-images',
          description: '아이템 이미지를 대담하게 강조하는 갤러리 스타일 디자인입니다.',
          features: [
            '시각적 임팩트 극대화',
            '2열 대형 카드 레이아웃',
            '호버 시 상세 정보 오버레이',
            '마커 아이템에 최적화'
          ]
        }
      ]
    }
  },

  computed: {
    currentComponent() {
      return `ShopDesign${this.currentDesign}`
    },
    currentDesignInfo() {
      return this.designs.find(d => d.id === this.currentDesign) || this.designs[0]
    }
  },

  methods: {
    selectDesign(designId) {
      this.currentDesign = designId
    }
  }
}
</script>

<style scoped>
.shop-preview {
  min-height: 100vh;
  background: var(--color-background);
}

/* Design Selector */
.design-selector {
  position: sticky;
  top: 70px;
  z-index: 200;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}

.selector-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.selector-inner h2 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.selector-desc {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  margin: 0 0 var(--spacing-lg);
}

.design-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.design-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-background);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.design-tab:hover {
  border-color: var(--color-primary-light);
}

.design-tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.tab-letter {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--font-size-small);
  color: var(--color-primary);
}

.design-tab.active .tab-letter {
  background: rgba(255,255,255,0.2);
  color: white;
}

.tab-name {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.design-tab.active .tab-name {
  color: white;
}

.design-description {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-background);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.desc-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  border-radius: var(--radius-lg);
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.desc-content h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.desc-content p {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-md);
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-lg);
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.feature-list li i {
  color: var(--color-success);
  font-size: 0.75rem;
}

/* Preview Container */
.preview-container {
  min-height: calc(100vh - 300px);
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .design-tabs {
    flex-wrap: wrap;
  }

  .design-tab {
    flex: 1;
    min-width: calc(50% - var(--spacing-sm) / 2);
    justify-content: center;
  }

  .design-description {
    flex-direction: column;
  }

  .desc-icon {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
  }

  .feature-list {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}
</style>

