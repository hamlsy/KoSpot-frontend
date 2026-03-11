<template>
  <div class="purchase-modal">
    <div class="modal-overlay" @click="cancel"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3>구매 확인</h3>
        <button class="close-button" @click="cancel">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="item-preview">
          <div class="item-image-container">
            <img :src="item.image" :alt="item.name" class="item-image" />
            <span class="item-rarity-badge" :class="getRarityClass(item.rarity)">
              {{ item.rarity }}
            </span>
          </div>
          
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-description">{{ item.description }}</div>
          </div>
        </div>
        
        <div class="purchase-info">
          <div class="info-row">
            <span class="info-label">가격</span>
            <div class="info-value price">
              <i class="fas fa-coins"></i>
              <span>{{ formatNumber(item.price) }}</span>
            </div>
          </div>
          
          <div class="divider"></div>

          <div class="info-row">
            <span class="info-label">구매 후 잔액</span>
            <div class="info-value" :class="{ 'insufficient': balanceAfterPurchase < 0 }">
              <i class="fas fa-coins"></i>
              <span>{{ formatNumber(Math.max(0, balanceAfterPurchase)) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="cancel">취소</button>
        <button class="btn-confirm" @click="confirm">
          <i class="fas fa-shopping-cart"></i>
          구매하기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PurchaseModal',
  
  props: {
    item: {
      type: Object,
      required: true
    },
    userCoins: {
      type: Number,
      default: 0
    },
    userGems: {
      type: Number,
      default: 0
    }
  },
  
  computed: {
    balanceAfterPurchase() {
      if (this.item.currencyType === 'coin') {
        return this.userCoins - this.item.price;
      } else {
        return this.userGems - this.item.price;
      }
    }
  },
  
  methods: {
    formatNumber(num) {
      if (!num && num !== 0) return '0'
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    getRarityClass(rarity) {
      const map = { '일반': 'common', '레어': 'rare', '에픽': 'epic', '전설': 'legendary' }
      return map[rarity] || 'common'
    },
    
    confirm() {
      this.$emit('confirm');
    },
    
    cancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.purchase-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  animation: overlayIn 0.25s ease;
}

.modal-container {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  box-shadow: var(--shadow-xl), 0 0 0 1px var(--color-border);
  animation: containerIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.875rem;
}

.close-button:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

/* Content */
.modal-content {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.item-preview {
  display: flex;
  gap: var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.item-image-container {
  position: relative;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.item-image {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

.item-rarity-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.item-rarity-badge.common {
  background: var(--color-border);
  color: var(--color-text-secondary);
}

.item-rarity-badge.rare {
  background: var(--color-primary);
  color: white;
}

.item-rarity-badge.epic {
  background: #8b5cf6;
  color: white;
}

.item-rarity-badge.legendary {
  background: var(--color-accent);
  color: white;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--spacing-xs);
}

.item-name {
  font-weight: 700;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.item-description {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

/* Purchase Info */
.purchase-info {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
}

.divider {
  height: 1px;
  background: var(--color-border);
}

.info-label {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.info-value {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 700;
  font-size: var(--font-size-small);
  color: var(--color-text-primary);
}

.info-value i {
  color: var(--color-accent);
}

.info-value.price {
  color: var(--color-text-primary);
}

.info-value.insufficient {
  color: var(--color-error);
}

.info-value.insufficient i {
  color: var(--color-error);
}

/* Footer */
.modal-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.btn-cancel {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-cancel:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.btn-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  background: var(--color-primary);
  color: white;
}

.btn-confirm:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* Animations */
@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes containerIn {
  from { transform: scale(0.9) translateY(16px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
  .item-preview {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .item-image-container {
    width: 80px;
    height: 80px;
  }

  .item-info {
    align-items: center;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
}
</style>