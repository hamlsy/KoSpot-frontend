<template>
  <div class="alt-index-app">
    <!-- Simple Header -->
    <header class="alt-index-header">
      <div class="alt-container">
        <h1 class="alt-display">KoSpot Design Comparison</h1>
        <p class="alt-body-large">두 가지 디자인 시스템을 비교하고 선택하세요</p>
      </div>
    </header>

    <main class="alt-index-content">
      <div class="alt-container">
        <!-- Design Cards -->
        <div class="alt-design-cards">
          <!-- Original Design -->
          <div class="alt-design-card">
            <div class="alt-card-header">
              <h2 class="alt-h1">Simple & Natural</h2>
              <span class="alt-badge alt-badge-primary">현재 디자인</span>
            </div>
            <div class="alt-card-preview">
              <img src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&h=400&fit=crop" alt="Simple Design" />
            </div>
            <div class="alt-card-description">
              <h3 class="alt-h3">디자인 특징</h3>
              <ul class="alt-feature-list">
                <li><i class="fas fa-check-circle"></i> 심플하고 깔끔한 레이아웃</li>
                <li><i class="fas fa-check-circle"></i> 부드러운 그라데이션</li>
                <li><i class="fas fa-check-circle"></i> 자연스러운 흐름</li>
                <li><i class="fas fa-check-circle"></i> 최소한의 시각적 요소</li>
              </ul>
            </div>
            <div class="alt-card-pages">
              <h4 class="alt-h3">페이지 둘러보기</h4>
              <div class="alt-page-links">
                <router-link to="/main" class="alt-page-link">
                  <i class="fas fa-home"></i>
                  <span>메인</span>
                </router-link>
                <router-link to="/roadView/main" class="alt-page-link">
                  <i class="fas fa-street-view"></i>
                  <span>로드뷰</span>
                </router-link>
                <router-link to="/lobby" class="alt-page-link">
                  <i class="fas fa-users"></i>
                  <span>로비</span>
                </router-link>
                <router-link to="/myProfile" class="alt-page-link">
                  <i class="fas fa-user"></i>
                  <span>프로필</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Alternative Design -->
          <div class="alt-design-card alt-highlight">
            <div class="alt-card-header">
              <h2 class="alt-h1 alt-gradient-text">Playful & Bold</h2>
              <span class="alt-badge alt-badge-accent">대안 디자인</span>
            </div>
            <div class="alt-card-preview">
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop" alt="Bold Design" />
            </div>
            <div class="alt-card-description">
              <h3 class="alt-h3">디자인 특징</h3>
              <ul class="alt-feature-list">
                <li><i class="fas fa-star"></i> 대담하고 플레이풀한 스타일</li>
                <li><i class="fas fa-star"></i> 비대칭 레이아웃</li>
                <li><i class="fas fa-star"></i> 강렬한 타이포그래피</li>
                <li><i class="fas fa-star"></i> 한국 정체성 반영</li>
                <li><i class="fas fa-star"></i> 독특한 마이크로 인터랙션</li>
              </ul>
            </div>
            <div class="alt-card-pages">
              <h4 class="alt-h3">페이지 둘러보기</h4>
              <div class="alt-page-links">
                <router-link to="/alt/main" class="alt-page-link alt-highlight-link">
                  <i class="fas fa-home"></i>
                  <span>메인</span>
                </router-link>
                <router-link to="/alt/roadview" class="alt-page-link alt-highlight-link">
                  <i class="fas fa-street-view"></i>
                  <span>로드뷰</span>
                </router-link>
                <router-link to="/alt/lobby" class="alt-page-link alt-highlight-link">
                  <i class="fas fa-users"></i>
                  <span>로비</span>
                </router-link>
                <router-link to="/alt/profile" class="alt-page-link alt-highlight-link">
                  <i class="fas fa-user"></i>
                  <span>프로필</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <div class="alt-index-note">
          <i class="fas fa-info-circle"></i>
          <p>이 페이지는 두 가지 디자인 시스템을 비교하기 위한 개발자 전용 페이지입니다.</p>
          <p>각 디자인의 페이지를 방문하여 스타일과 UX를 비교해보세요.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
// No complex logic needed for index page
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

.alt-index-app {
  min-height: 100vh;
  background: var(--alt-bg-pattern);
}

.alt-index-header {
  padding: var(--alt-space-2xl) 0;
  text-align: center;
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  color: var(--alt-text-secondary);
  margin-bottom: var(--alt-space-2xl);
}

.alt-index-header h1 {
  margin-bottom: var(--alt-space-md);
  color: var(--alt-text-secondary);
}

.alt-index-content {
  padding: 0 0 var(--alt-space-2xl);
}

.alt-design-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: var(--alt-space-xl);
  margin-bottom: var(--alt-space-2xl);
}

.alt-design-card {
  background: var(--alt-surface);
  border-radius: var(--alt-radius-xl);
  box-shadow: var(--alt-surface-shadow);
  overflow: hidden;
  transition: all var(--alt-transition-base);
}

.alt-design-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--alt-surface-shadow-hover);
}

.alt-design-card.alt-highlight {
  border: 3px solid var(--alt-primary);
}

.alt-card-header {
  padding: var(--alt-space-lg);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.alt-card-header h2 {
  margin: 0;
}

.alt-card-preview {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.alt-card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all var(--alt-transition-slow);
}

.alt-design-card:hover .alt-card-preview img {
  transform: scale(1.05);
}

.alt-card-description {
  padding: var(--alt-space-lg);
}

.alt-card-description h3 {
  margin-bottom: var(--alt-space-md);
}

.alt-feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--alt-space-sm);
}

.alt-feature-list li {
  display: flex;
  align-items: center;
  gap: var(--alt-space-sm);
  font-size: var(--alt-font-body);
  color: var(--alt-text-primary);
}

.alt-feature-list i {
  color: var(--alt-primary);
  font-size: 1.25rem;
}

.alt-highlight .alt-feature-list i {
  color: var(--alt-accent);
}

.alt-card-pages {
  padding: var(--alt-space-lg);
  background: rgba(14, 165, 233, 0.05);
}

.alt-card-pages h4 {
  margin-bottom: var(--alt-space-md);
}

.alt-page-links {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--alt-space-sm);
}

.alt-page-link {
  display: flex;
  align-items: center;
  gap: var(--alt-space-sm);
  padding: var(--alt-space-md);
  background: var(--alt-surface);
  border: 2px solid rgba(14, 165, 233, 0.2);
  border-radius: var(--alt-radius-md);
  color: var(--alt-text-primary);
  text-decoration: none;
  font-weight: 600;
  transition: all var(--alt-transition-fast);
}

.alt-page-link:hover {
  background: rgba(14, 165, 233, 0.1);
  border-color: var(--alt-primary);
  transform: translateX(4px);
}

.alt-page-link i {
  font-size: 1.25rem;
  color: var(--alt-primary);
}

.alt-highlight-link {
  border-color: rgba(255, 127, 80, 0.3);
}

.alt-highlight-link:hover {
  background: rgba(255, 127, 80, 0.1);
  border-color: var(--alt-accent);
}

.alt-highlight-link i {
  color: var(--alt-accent);
}

.alt-index-note {
  text-align: center;
  padding: var(--alt-space-xl);
  background: var(--alt-surface);
  border-radius: var(--alt-radius-lg);
  border: 2px solid rgba(14, 165, 233, 0.2);
}

.alt-index-note i {
  font-size: 2rem;
  color: var(--alt-primary);
  margin-bottom: var(--alt-space-md);
}

.alt-index-note p {
  margin: var(--alt-space-sm) 0;
  color: var(--alt-text-muted);
}

@media (max-width: 1024px) {
  .alt-design-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .alt-page-links {
    grid-template-columns: 1fr;
  }

  .alt-card-preview {
    height: 200px;
  }
}
</style>

