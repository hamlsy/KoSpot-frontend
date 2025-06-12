<template>
  <div class="system-status bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="p-5 border-b border-gray-100">
      <h2 class="text-lg font-semibold text-gray-800">시스템 상태</h2>
    </div>
    <div class="status-grid p-4 grid grid-cols-4 gap-4">
      <div v-for="(status, index) in statusItems" 
           :key="index" 
           class="status-item p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100"
           :class="{'animate-pulse-subtle': status.isLoading}">
        <div class="flex items-center mb-3">
          <div class="status-icon w-10 h-10 rounded-lg mr-3 flex items-center justify-center" 
               :class="status.iconClass">
            <i class="fas" :class="status.icon"></i>
          </div>
          <div class="status-indicator w-2 h-2 rounded-full ml-auto" 
               :class="getStatusIndicatorClass(status.status)"></div>
        </div>
        <div class="status-content">
          <h3 class="text-sm font-medium text-gray-700">{{ status.title }}</h3>
          <p class="status-value text-lg font-semibold mt-1" 
             :class="getStatusTextClass(status.status)">
            {{ status.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Status items data
const statusItems = ref([
  {
    title: '서버 상태',
    value: '정상',
    status: 'online',
    icon: 'fa-server',
    iconClass: 'bg-blue-100 text-blue-600',
    isLoading: false
  },
  {
    title: '데이터베이스',
    value: '정상',
    status: 'online',
    icon: 'fa-database',
    iconClass: 'bg-purple-100 text-purple-600',
    isLoading: false
  },
  {
    title: '메모리 사용량',
    value: '64%',
    status: 'warning',
    icon: 'fa-memory',
    iconClass: 'bg-amber-100 text-amber-600',
    isLoading: false
  },
  {
    title: 'CPU 사용량',
    value: '23%',
    status: 'normal',
    icon: 'fa-microchip',
    iconClass: 'bg-green-100 text-green-600',
    isLoading: false
  }
]);

// Get status indicator class based on status
const getStatusIndicatorClass = (status) => {
  switch(status) {
    case 'online':
      return 'bg-green-500';
    case 'offline':
      return 'bg-red-500';
    case 'warning':
      return 'bg-amber-500';
    case 'normal':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

// Get status text class based on status
const getStatusTextClass = (status) => {
  switch(status) {
    case 'online':
      return 'text-green-600';
    case 'offline':
      return 'text-red-600';
    case 'warning':
      return 'text-amber-600';
    case 'normal':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};
</script>

<style scoped>
.system-status {
  position: relative;
  overflow: hidden;
}

.system-status::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, #60a5fa, #8b5cf6);
}

.status-item {
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.status-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.status-icon {
  transition: transform 0.3s ease;
}

.status-item:hover .status-icon {
  transform: scale(1.1);
}

@keyframes pulseSlow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse-subtle {
  animation: pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@media (max-width: 1024px) {
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
