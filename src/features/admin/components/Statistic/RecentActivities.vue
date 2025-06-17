<template>
  <div class="recent-activities bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="section-header p-5 flex justify-between items-center border-b border-gray-100">
      <h2 class="text-lg font-semibold text-gray-800">최근 활동</h2>
      <button class="view-all-btn text-sm text-blue-600 hover:text-blue-700 transition-colors px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">
        모두 보기
      </button>
    </div>
    <div class="activity-list p-4">
      <div v-for="(activity, index) in activities" 
           :key="index" 
           class="activity-item p-3 flex items-start rounded-lg mb-2 hover:bg-gray-50 transition-colors"
           :class="{'animate-fade-in': true}"
           :style="{ animationDelay: `${index * 50}ms` }">
        <div class="activity-icon mr-4 w-10 h-10 rounded-lg flex items-center justify-center" 
             :class="getActivityTypeClass(activity.type)">
          <i class="fas" :class="getActivityIcon(activity.type)"></i>
        </div>
        <div class="activity-content flex-1">
          <p class="activity-text text-gray-800 text-sm">{{ activity.text }}</p>
          <p class="activity-time text-gray-400 text-xs mt-1">{{ formatTime(activity.time) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  }
});

// Format time to relative time (e.g. "5 minutes ago")
const formatTime = (time) => {
  const now = new Date();
  const diff = Math.floor((now - new Date(time)) / 60000); // 분 단위로 계산
  
  if (diff < 1) return '방금 전';
  if (diff < 60) return `${diff}분 전`;
  
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}시간 전`;
  
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
};

// Get icon based on activity type
const getActivityIcon = (type) => {
  switch(type) {
    case 'user': return 'fa-user';
    case 'game': return 'fa-gamepad';
    case 'purchase': return 'fa-shopping-cart';
    case 'system': return 'fa-cog';
    case 'warning': return 'fa-exclamation-triangle';
    default: return 'fa-bell';
  }
};

// Get class based on activity type
const getActivityTypeClass = (type) => {
  switch(type) {
    case 'user': 
      return 'bg-blue-100 text-blue-600';
    case 'game': 
      return 'bg-purple-100 text-purple-600';
    case 'purchase': 
      return 'bg-green-100 text-green-600';
    case 'system': 
      return 'bg-gray-100 text-gray-600';
    case 'warning': 
      return 'bg-red-100 text-red-600';
    default: 
      return 'bg-blue-100 text-blue-600';
  }
};
</script>

<style scoped>
.recent-activities {
  position: relative;
  overflow: hidden;
}

.recent-activities::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, #60a5fa, #8b5cf6);
}

.activity-item {
  position: relative;
}

.activity-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(to right, rgba(96, 165, 250, 0.05), rgba(139, 92, 246, 0.05));
  transition: width 0.3s ease;
  z-index: 0;
  pointer-events: none;
}

.activity-item:hover::before {
  width: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
}
</style>
