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
            <div class="item-rarity" :class="item.rarity.toLowerCase()">{{ item.rarity }}</div>
          </div>
          
          <div class="item-details">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-description">{{ item.description }}</div>
          </div>
        </div>
        
        <div class="purchase-info">
          <div class="price-info">
            <span>가격:</span>
            <div class="price">
              <span>{{ formatNumber(item.price) }}</span>
              <i :class="item.currencyType === 'coin' ? 'fas fa-coins' : 'fas fa-gem'"></i>
            </div>
          </div>
          
          <div class="balance-info">
            <span>구매 후 잔액:</span>
            <div class="balance">
              <span>{{ formatNumber(balanceAfterPurchase) }}</span>
              <i :class="item.currencyType === 'coin' ? 'fas fa-coins' : 'fas fa-gem'"></i>
            </div>
          </div>
        </div>
        
        <div class="confirmation-message">
          <p>정말로 이 아이템을 구매하시겠습니까?</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-button" @click="cancel">취소</button>
        <button class="confirm-button" @click="confirm">구매하기</button>
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
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: zoomIn 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #999;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-content {
  padding: 1.5rem;
}

.item-preview {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.item-image-container {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.item-rarity {
  position: absolute;
  top: -10px;
  left: -10px;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  border-radius: 4px;
  font-weight: 600;
}

.item-rarity.일반 {
  background: #e0e0e0;
  color: #333;
}

.item-rarity.레어 {
  background: #2196f3;
  color: white;
}

.item-rarity.에픽 {
  background: #9c27b0;
  color: white;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.item-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}

.purchase-info {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.price-info, .balance-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.balance-info {
  margin-bottom: 0;
  padding-top: 0.8rem;
  border-top: 1px solid #eee;
}

.price, .balance {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
}

.price i, .balance i {
  color: #ffc107;
}

.price i.fa-gem, .balance i.fa-gem {
  color: #9c27b0;
}

.confirmation-message {
  text-align: center;
  margin-bottom: 1rem;
}

.confirmation-message p {
  font-size: 1.1rem;
  color: #333;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
}

.cancel-button, .confirm-button {
  padding: 0.7rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-button {
  background: #f0f2f5;
  color: #333;
}

.cancel-button:hover {
  background: #e0e0e0;
}

.confirm-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.confirm-button:hover {
  background: linear-gradient(135deg, #5a71d6, #6a4394);
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .item-preview {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
  
  .item-image-container {
    width: 80px;
    height: 80px;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
  
  .cancel-button, .confirm-button {
    width: 100%;
  }
}
</style> 