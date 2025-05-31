<template>
  <div class="quick-actions bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="p-5 border-b border-gray-100">
      <h2 class="text-lg font-semibold text-gray-800">빠른 작업</h2>
    </div>
    <div class="action-buttons p-4 grid grid-cols-3 gap-3">
      <router-link 
        v-for="action in actions" 
        :key="action.id"
        :to="action.route" 
        class="action-button flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 hover:shadow-md"
        :class="{'bg-gradient-to-br': true, [action.gradientClass]: true}"
      >
        <div class="icon-wrapper w-12 h-12 rounded-lg bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center mb-3 shadow-sm">
          <i class="fas" :class="action.icon"></i>
        </div>
        <span class="text-sm font-medium">{{ action.label }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Quick actions data
const actions = ref([
  {
    id: 'users',
    label: '사용자 관리',
    icon: 'fa-user-cog',
    route: '/admin/users',
    gradientClass: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
  },
  {
    id: 'games',
    label: '게임 관리',
    icon: 'fa-gamepad',
    route: '/admin/games',
    gradientClass: 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200'
  },
  {
    id: 'shop',
    label: '상점 관리',
    icon: 'fa-shopping-cart',
    route: '/admin/shop',
    gradientClass: 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200'
  },
  {
    id: 'stats',
    label: '통계 보기',
    icon: 'fa-chart-line',
    route: '/admin/statistics',
    gradientClass: 'from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200'
  },
  {
    id: 'settings',
    label: '설정',
    icon: 'fa-cog',
    route: '/admin/settings',
    gradientClass: 'from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
  },
  {
    id: 'backup',
    label: '데이터 백업',
    icon: 'fa-database',
    route: '/admin/backup',
    gradientClass: 'from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200'
  }
]);
</script>

<style scoped>
.quick-actions {
  position: relative;
  overflow: hidden;
}

.quick-actions::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, #8b5cf6, #60a5fa);
}

.action-button {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 0;
  background: linear-gradient(to bottom, #60a5fa, #8b5cf6);
  transition: height 0.3s ease;
}

.action-button:hover::before {
  height: 100%;
}

.action-button i {
  transition: transform 0.3s ease;
  color: #4b5563;
}

.action-button:hover i {
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
