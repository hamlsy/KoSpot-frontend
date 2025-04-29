<template>
  <div class="hint-container">
    <div class="hint-badge">
      <i class="fas fa-lightbulb"></i> {{ isNotification ? '알림' : '힌트' }}
    </div>
    <div class="hint-content">
      {{ hint }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhotoModeHintDisplay',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    hint: {
      type: String,
      default: ''
    },
    isNotification: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.hint-container {
  padding: 0.75rem 1rem;
  background-color: #fffbeb;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #f59e0b;
  animation: fadeIn 0.3s ease-out;
  margin-bottom: 1rem;
}

.hint-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #b45309;
  margin-bottom: 0.5rem;
}

.hint-badge i {
  color: #f59e0b;
}

.hint-content {
  font-size: 1rem;
  color: #78350f;
  line-height: 1.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
