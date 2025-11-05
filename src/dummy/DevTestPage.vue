<template>
  <div class="dev-test-page">
    <NavigationBar />
    
    <main class="dev-test-content">
      <div class="dev-test-container">
        <h1 class="page-title">🧪 개발자 테스트 페이지</h1>
        <p class="page-description">
          API 연결이 안 될 때 컴포넌트 디자인을 테스트할 수 있는 페이지입니다.
        </p>

        <!-- 컴포넌트 테스트 섹션 -->
        <div class="test-sections">
          <!-- 닉네임 설정 모달 테스트 -->
          <section class="test-section">
            <h2 class="section-title">닉네임 설정 모달</h2>
            <p class="section-description">NicknameSetupModal 컴포넌트 테스트</p>
            <button @click="showNicknameModal = true" class="test-button">
              닉네임 설정 모달 열기
            </button>
          </section>

          <!-- 튜토리얼 모달 테스트 -->
          <section class="test-section">
            <h2 class="section-title">튜토리얼 모달</h2>
            <p class="section-description">IntroTutorialModal 컴포넌트 테스트</p>
            <button @click="showTutorialModal = true" class="test-button">
              튜토리얼 모달 열기
            </button>
          </section>

          <!-- 기타 컴포넌트 테스트 -->
          <section class="test-section">
            <h2 class="section-title">기타 컴포넌트</h2>
            <p class="section-description">추가 컴포넌트 테스트 영역</p>
            <div class="component-grid">
              <button @click="testComponent('button')" class="test-button">
                버튼 테스트
              </button>
              <button @click="testComponent('input')" class="test-button">
                입력 필드 테스트
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- 닉네임 설정 모달 -->
    <NicknameSetupModal 
      :show="showNicknameModal"
      @close="showNicknameModal = false"
      @complete="handleNicknameComplete"
    />

    <!-- 튜토리얼 모달 -->
    <IntroTutorialModal 
      :show="showTutorialModal"
      @close="showTutorialModal = false"
      @complete="handleTutorialComplete"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NavigationBar from '@/core/components/NavigationBar.vue';
import NicknameSetupModal from '@/features/intro/components/NicknameSetupModal.vue';
import IntroTutorialModal from '@/features/intro/components/IntroTutorialModal.vue';

const showNicknameModal = ref(false);
const showTutorialModal = ref(false);

const handleNicknameComplete = (nickname) => {
  console.log('닉네임 설정 완료:', nickname);
  alert(`닉네임이 "${nickname}"으로 설정되었습니다! (테스트 모드)`);
};

const handleTutorialComplete = () => {
  console.log('튜토리얼 완료!');
};

const testComponent = (type) => {
  console.log(`${type} 컴포넌트 테스트`);
  alert(`${type} 컴포넌트 테스트 기능은 준비 중입니다.`);
};
</script>

<style scoped>
.dev-test-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.dev-test-content {
  padding-top: 80px;
  min-height: calc(100vh - 80px);
}

.dev-test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.page-description {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.test-sections {
  display: grid;
  gap: 2rem;
}

.test-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.section-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.test-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-out;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  will-change: transform;
}

.test-button:hover {
  transform: translate3d(0, -2px, 0);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .dev-test-container {
    padding: 1.5rem 1rem;
  }

  .test-section {
    padding: 1.5rem;
  }

  .component-grid {
    grid-template-columns: 1fr;
  }
}
</style>

