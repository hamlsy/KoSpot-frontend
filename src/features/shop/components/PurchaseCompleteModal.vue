<template>
  <div class="complete-modal" @click.self="close">
    <div class="complete-overlay" @click="close"></div>
    <div class="complete-container" :class="{ 'fade-in': visible }">
      <!-- 성공 아이콘 -->
      <div class="success-icon-wrap">
        <div class="success-ring"></div>
        <div class="success-check">
          <i class="fas fa-check"></i>
        </div>
      </div>

      <!-- 메시지 -->
      <div class="complete-body">
        <h3 class="complete-title">구매 완료!</h3>
        <p class="complete-item-name">{{ item?.name }}</p>
        <p class="complete-desc">아이템을 성공적으로 구매했습니다</p>

        <div class="balance-row">
          <i class="fas fa-coins balance-icon"></i>
          <span class="balance-label">잔여 포인트</span>
          <span class="balance-value">{{ formatNumber(remainingCoins) }}</span>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="complete-actions">
        <button
          v-if="canEquip"
          class="btn-equip"
          @click="$emit('equip')"
        >
          <i class="fas fa-hand-pointer"></i>
          바로 장착하기
        </button>
        <button class="btn-close" @click="close">
          확인
        </button>
      </div>

      <!-- 자동 닫힘 프로그레스바 -->
      <div class="auto-close-bar">
        <div class="auto-close-progress" :style="{ width: progressWidth + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PurchaseCompleteModal',

  props: {
    item: {
      type: Object,
      default: null
    },
    remainingCoins: {
      type: Number,
      default: 0
    },
    canEquip: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'equip'],

  data() {
    return {
      visible: false,
      progressWidth: 100,
      timer: null,
      progressTimer: null,
      AUTO_CLOSE_MS: 3000
    }
  },

  mounted() {
    // 마운트 후 페이드인
    this.$nextTick(() => {
      this.visible = true
    })
    this.startAutoClose()
  },

  beforeUnmount() {
    this.clearTimers()
  },

  methods: {
    formatNumber(num) {
      if (!num && num !== 0) return '0'
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },

    startAutoClose() {
      const interval = 30 // ms
      const steps = this.AUTO_CLOSE_MS / interval
      let step = 0

      this.progressTimer = setInterval(() => {
        step++
        this.progressWidth = Math.max(0, 100 - (step / steps) * 100)
        if (step >= steps) {
          clearInterval(this.progressTimer)
        }
      }, interval)

      this.timer = setTimeout(() => {
        this.close()
      }, this.AUTO_CLOSE_MS)
    },

    clearTimers() {
      if (this.timer) clearTimeout(this.timer)
      if (this.progressTimer) clearInterval(this.progressTimer)
    },

    close() {
      this.clearTimers()
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.complete-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.complete-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  animation: overlayIn 0.25s ease;
}

.complete-container {
  position: relative;
  z-index: 1;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 380px;
  overflow: hidden;
  box-shadow: var(--shadow-xl), 0 0 0 1px var(--color-border);
  opacity: 0;
  transform: scale(0.9) translateY(16px);
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.complete-container.fade-in {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 성공 아이콘 */
.success-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0 var(--spacing-md);
  position: relative;
}

.success-ring {
  position: absolute;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 3px solid var(--color-success);
  opacity: 0.25;
  animation: ringPulse 1.5s ease infinite;
}

.success-check {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-success), #34d399);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: checkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

.success-check i {
  font-size: 1.75rem;
  color: white;
}

/* 본문 */
.complete-body {
  padding: 0 var(--spacing-xl) var(--spacing-lg);
  text-align: center;
}

.complete-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.complete-item-name {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-xs);
}

.complete-desc {
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
  margin: 0 0 var(--spacing-lg);
}

.balance-row {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: var(--spacing-xs) var(--spacing-md);
}

.balance-icon {
  color: var(--color-accent);
  font-size: 0.875rem;
}

.balance-label {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.balance-value {
  font-size: var(--font-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
}

/* 버튼 */
.complete-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-xl) var(--spacing-lg);
}

.btn-equip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-equip:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-close {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

/* 자동 닫힘 프로그레스바 */
.auto-close-bar {
  height: 3px;
  background: var(--color-border);
}

.auto-close-progress {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.03s linear;
}

/* 애니메이션 */
@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.25; }
  50% { transform: scale(1.15); opacity: 0.1; }
}

@keyframes checkBounce {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
