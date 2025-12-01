<template>
  <div class="alt-profile-app">
    <AltNavigationBar 
      :is-logged-in="isLoggedIn"
      :user-info="userProfile"
      @logout="handleLogout"
    />

    <main class="alt-profile-content">
      <div class="alt-container-narrow">
        <!-- Profile Header -->
        <div class="alt-profile-header">
          <div class="alt-profile-avatar-large">
            <img :src="userProfile.avatar" :alt="userProfile.name" />
            <button class="alt-edit-avatar-btn">
              <i class="fas fa-camera"></i>
            </button>
          </div>
          <h1 class="alt-h1 alt-gradient-text">{{ userProfile.name }}</h1>
          <p class="alt-body-large">{{ userProfile.email }}</p>
          <div class="alt-profile-stats-quick">
            <div class="alt-stat-quick">
              <span class="alt-stat-value">1,234</span>
              <span class="alt-stat-label">플레이</span>
            </div>
            <div class="alt-stat-quick">
              <span class="alt-stat-value">8,520</span>
              <span class="alt-stat-label">포인트</span>
            </div>
            <div class="alt-stat-quick">
              <span class="alt-stat-value">Gold III</span>
              <span class="alt-stat-label">랭크</span>
            </div>
          </div>
        </div>

        <!-- Profile Sections -->
        <div class="alt-profile-sections">
          <button 
            v-for="section in sections" 
            :key="section.id"
            class="alt-section-card"
            @click="navigateTo(section.route)"
          >
            <div class="alt-section-icon">
              <i :class="section.icon"></i>
            </div>
            <div class="alt-section-content">
              <h3 class="alt-h3">{{ section.title }}</h3>
              <p class="alt-body">{{ section.description }}</p>
            </div>
            <i class="fas fa-chevron-right alt-section-arrow"></i>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/core/composables/useAuth.js';
import AltNavigationBar from '@/features/alternative/components/AltNavigationBar.vue';

const router = useRouter();
const { logout: logoutAuth } = useAuth();

const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));

const userProfile = ref({
  name: "김코스팟",
  email: "user@kospot.com",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
});

const sections = [
  {
    id: 'account',
    title: '계정 설정',
    description: '프로필 정보 및 비밀번호 변경',
    icon: 'fas fa-user-cog',
    route: '/account-settings'
  },
  {
    id: 'inventory',
    title: '인벤토리',
    description: '보유 아이템 및 스킨',
    icon: 'fas fa-box',
    route: '/inventory'
  },
  {
    id: 'friends',
    title: '친구 목록',
    description: '친구 관리 및 초대',
    icon: 'fas fa-user-friends',
    route: '/friends'
  },
  {
    id: 'stats',
    title: '통계',
    description: '상세한 게임 통계 및 기록',
    icon: 'fas fa-chart-line',
    route: '/stats'
  },
];

function navigateTo(route) {
  router.push(route);
}

function handleLogout() {
  logoutAuth();
  router.push({ name: 'AltMainView' });
}
</script>

<style scoped>
@import '@/features/alternative/styles/alternative.css';

.alt-profile-app {
  min-height: 100vh;
  background: var(--alt-bg-base);
}

.alt-profile-content {
  padding: var(--alt-space-xl) 0 var(--alt-space-2xl);
}

.alt-profile-header {
  text-align: center;
  padding: var(--alt-space-2xl) 0;
  margin-bottom: var(--alt-space-xl);
  animation: alt-fade-in-up 0.6s ease-out;
}

.alt-profile-avatar-large {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto var(--alt-space-lg);
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--alt-primary);
  box-shadow: 0 8px 32px rgba(14, 165, 233, 0.3);
}

.alt-profile-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alt-edit-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 48px;
  height: 48px;
  background: var(--alt-primary);
  border: none;
  border-radius: 50%;
  color: var(--alt-text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all var(--alt-transition-base);
}

.alt-edit-avatar-btn:hover {
  background: var(--alt-primary-dark);
  transform: scale(1.1);
}

.alt-profile-header h1 {
  margin-bottom: var(--alt-space-xs);
}

.alt-profile-header p {
  color: var(--alt-text-muted);
  margin-bottom: var(--alt-space-lg);
}

.alt-profile-stats-quick {
  display: flex;
  justify-content: center;
  gap: var(--alt-space-xl);
}

.alt-stat-quick {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.alt-stat-quick .alt-stat-value {
  font-family: var(--alt-font-heading-en);
  font-size: var(--alt-font-h2);
  font-weight: 700;
  color: var(--alt-text-primary);
}

.alt-stat-quick .alt-stat-label {
  font-size: var(--alt-font-small);
  color: var(--alt-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.alt-profile-sections {
  display: flex;
  flex-direction: column;
  gap: var(--alt-space-md);
}

.alt-section-card {
  display: flex;
  align-items: center;
  gap: var(--alt-space-md);
  padding: var(--alt-space-lg);
  background: var(--alt-surface);
  border: none;
  border-radius: var(--alt-radius-lg);
  box-shadow: var(--alt-surface-shadow);
  cursor: pointer;
  transition: all var(--alt-transition-base);
  text-align: left;
}

.alt-section-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--alt-surface-shadow-hover);
}

.alt-section-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--alt-primary) 0%, var(--alt-secondary) 100%);
  border-radius: var(--alt-radius-md);
  color: var(--alt-text-secondary);
  font-size: 1.75rem;
}

.alt-section-content {
  flex: 1;
}

.alt-section-content h3 {
  margin: 0 0 0.5rem 0;
  color: var(--alt-text-primary);
}

.alt-section-content p {
  margin: 0;
  color: var(--alt-text-muted);
}

.alt-section-arrow {
  font-size: 1.25rem;
  color: var(--alt-text-muted);
  transition: all var(--alt-transition-fast);
}

.alt-section-card:hover .alt-section-arrow {
  transform: translateX(4px);
  color: var(--alt-primary);
}

@media (max-width: 768px) {
  .alt-profile-stats-quick {
    flex-direction: column;
    gap: var(--alt-space-md);
  }

  .alt-section-icon {
    width: 56px;
    height: 56px;
    font-size: 1.5rem;
  }
}
</style>

