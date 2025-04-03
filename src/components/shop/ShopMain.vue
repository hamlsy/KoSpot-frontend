<template>
  <div class="shop-main">
    <div class="shop-header">
      <h1 class="shop-title">KoSpot 상점</h1>
      <div class="user-currency">
        <div class="currency-item">
          <i class="fas fa-coins"></i>
          <span>{{ formatNumber(userCoins) }} 코인</span>
        </div>
        <div class="currency-item">
          <i class="fas fa-gem"></i>
          <span>{{ formatNumber(userGems) }} 젬</span>
        </div>
      </div>
    </div>
    
    <div class="shop-nav">
      <div 
        v-for="category in categories" 
        :key="category.id"
        class="nav-item"
        :class="{ active: currentCategory === category.id }"
        @click="setCategory(category.id)"
      >
        <i :class="category.icon"></i>
        <span>{{ category.name }}</span>
      </div>
    </div>
    
    <div class="shop-content">
      <div class="category-header">
        <h2>{{ currentCategoryName }}</h2>
        <div class="filter-controls">
          <button 
            v-for="filter in filters" 
            :key="filter.id"
            :class="{ active: currentFilter === filter.id }"
            @click="setFilter(filter.id)"
          >
            {{ filter.name }}
          </button>
        </div>
      </div>
      
      <div class="items-grid">
        <div 
          v-for="item in filteredItems" 
          :key="item.id"
          class="shop-item"
          :class="{ 'owned': item.owned, 'sale': item.discountPercent > 0 }"
        >
          <div class="item-image-container">
            <img :src="item.image" :alt="item.name" class="item-image" />
            <div class="item-rarity" :class="item.rarity.toLowerCase()">{{ item.rarity }}</div>
            <div class="discount-badge" v-if="item.discountPercent > 0">-{{ item.discountPercent }}%</div>
          </div>
          
          <div class="item-details">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-description">{{ item.description }}</div>
          </div>
          
          <div class="item-footer">
            <div class="item-price" v-if="!item.owned">
              <template v-if="item.discountPercent > 0">
                <span class="original-price">{{ formatNumber(item.originalPrice) }}</span>
                <span class="price">{{ formatNumber(item.price) }}</span>
              </template>
              <template v-else>
                <span class="price">{{ formatNumber(item.price) }}</span>
              </template>
              <i :class="item.currencyType === 'coin' ? 'fas fa-coins' : 'fas fa-gem'"></i>
            </div>
            <div class="item-status" v-else>
              <span class="owned-label">보유 중</span>
            </div>
            
            <button 
              class="buy-button" 
              :disabled="item.owned || !canAfford(item)"
              @click="buyItem(item)"
            >
              {{ item.owned ? '보유 중' : '구매하기' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <purchase-modal 
      v-if="showPurchaseModal"
      :item="selectedItem"
      @confirm="confirmPurchase"
      @cancel="cancelPurchase"
    />
  </div>
</template>

<script>
import PurchaseModal from './PurchaseModal.vue';

export default {
  name: 'ShopMain',
  
  components: {
    PurchaseModal
  },
  
  data() {
    return {
      userCoins: 5000,
      userGems: 50,
      currentCategory: 'avatars',
      currentFilter: 'all',
      showPurchaseModal: false,
      selectedItem: null,
      categories: [
        { id: 'avatars', name: '아바타', icon: 'fas fa-user' },
        { id: 'badges', name: '배지', icon: 'fas fa-certificate' },
        { id: 'items', name: '아이템', icon: 'fas fa-gift' },
        { id: 'boosters', name: '부스터', icon: 'fas fa-rocket' }
      ],
      filters: [
        { id: 'all', name: '전체' },
        { id: 'new', name: '신규' },
        { id: 'sale', name: '할인' },
        { id: 'notOwned', name: '미보유' }
      ],
      shopItems: {
        avatars: [
          {
            id: 'av1',
            name: '탐험가 아바타',
            description: '한국의 명소를 탐험하는 모험가 아바타',
            price: 2000,
            originalPrice: 2000,
            discountPercent: 0,
            currencyType: 'coin',
            rarity: '일반',
            image: '/assets/avatars/explorer.png',
            category: 'avatars',
            isNew: true,
            owned: false
          },
          {
            id: 'av2',
            name: '한복 아바타',
            description: '전통 한복을 입은 우아한 아바타',
            price: 1500,
            originalPrice: 3000,
            discountPercent: 50,
            currencyType: 'coin',
            rarity: '레어',
            image: '/assets/avatars/hanbok.png',
            category: 'avatars',
            isNew: false,
            owned: true
          },
          {
            id: 'av3',
            name: '관광객 아바타',
            description: '카메라를 든 열정적인 관광객 아바타',
            price: 20,
            originalPrice: 20,
            discountPercent: 0,
            currencyType: 'gem',
            rarity: '에픽',
            image: '/assets/avatars/tourist.png',
            category: 'avatars',
            isNew: true,
            owned: false
          },
          {
            id: 'av4',
            name: '요리사 아바타',
            description: '한식 요리사 아바타',
            price: 2500,
            originalPrice: 2500,
            discountPercent: 0,
            currencyType: 'coin',
            rarity: '레어',
            image: '/assets/avatars/chef.png',
            category: 'avatars',
            isNew: false,
            owned: false
          }
        ],
        badges: [
          {
            id: 'b1',
            name: '서울 마스터',
            description: '서울 지역 마스터',
            price: 3000,
            originalPrice: 3000,
            discountPercent: 0,
            currencyType: 'coin',
            rarity: '레어',
            image: '/assets/badges/seoul.png',
            category: 'badges',
            isNew: false,
            owned: false
          },
          {
            id: 'b2',
            name: '제주 탐험가',
            description: '제주도 탐험의 달인',
            price: 15,
            originalPrice: 30,
            discountPercent: 50,
            currencyType: 'gem',
            rarity: '에픽',
            image: '/assets/badges/jeju.png',
            category: 'badges',
            isNew: true,
            owned: false
          }
        ],
        items: [
          {
            id: 'i1',
            name: '힌트 카드',
            description: '게임 중 힌트를 얻을 수 있는 아이템',
            price: 500,
            originalPrice: 500,
            discountPercent: 0,
            currencyType: 'coin',
            rarity: '일반',
            image: '/assets/items/hint.png',
            category: 'items',
            isNew: false,
            owned: false
          },
          {
            id: 'i2',
            name: '시간 추가 카드',
            description: '게임 시간을 30초 연장하는 아이템',
            price: 5,
            originalPrice: 5,
            discountPercent: 0,
            currencyType: 'gem',
            rarity: '레어',
            image: '/assets/items/time.png',
            category: 'items',
            isNew: false,
            owned: false
          }
        ],
        boosters: [
          {
            id: 'bo1',
            name: '점수 부스터',
            description: '1시간 동안 획득하는 점수가 2배로 증가',
            price: 10,
            originalPrice: 10,
            discountPercent: 0,
            currencyType: 'gem',
            rarity: '레어',
            image: '/assets/boosters/score.png',
            category: 'boosters',
            isNew: true,
            owned: false
          },
          {
            id: 'bo2',
            name: '경험치 부스터',
            description: '3시간 동안 획득하는 경험치가 2배로 증가',
            price: 25,
            originalPrice: 25,
            discountPercent: 0,
            currencyType: 'gem',
            rarity: '에픽',
            image: '/assets/boosters/xp.png',
            category: 'boosters',
            isNew: false,
            owned: false
          }
        ]
      }
    };
  },
  
  computed: {
    currentCategoryName() {
      const category = this.categories.find(cat => cat.id === this.currentCategory);
      return category ? category.name : '';
    },
    
    currentCategoryItems() {
      return this.shopItems[this.currentCategory] || [];
    },
    
    filteredItems() {
      if (this.currentFilter === 'all') {
        return this.currentCategoryItems;
      }
      
      if (this.currentFilter === 'new') {
        return this.currentCategoryItems.filter(item => item.isNew);
      }
      
      if (this.currentFilter === 'sale') {
        return this.currentCategoryItems.filter(item => item.discountPercent > 0);
      }
      
      if (this.currentFilter === 'notOwned') {
        return this.currentCategoryItems.filter(item => !item.owned);
      }
      
      return this.currentCategoryItems;
    }
  },
  
  methods: {
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    setCategory(categoryId) {
      this.currentCategory = categoryId;
    },
    
    setFilter(filterId) {
      this.currentFilter = filterId;
    },
    
    canAfford(item) {
      if (item.currencyType === 'coin') {
        return this.userCoins >= item.price;
      } else {
        return this.userGems >= item.price;
      }
    },
    
    buyItem(item) {
      if (item.owned) return;
      
      this.selectedItem = item;
      this.showPurchaseModal = true;
    },
    
    confirmPurchase() {
      if (!this.selectedItem) return;
      
      // 실제 구매 처리
      if (this.selectedItem.currencyType === 'coin') {
        this.userCoins -= this.selectedItem.price;
      } else {
        this.userGems -= this.selectedItem.price;
      }
      
      // 아이템 보유 상태 업데이트
      const category = this.shopItems[this.selectedItem.category];
      const itemIndex = category.findIndex(item => item.id === this.selectedItem.id);
      if (itemIndex !== -1) {
        category[itemIndex].owned = true;
      }
      
      this.showPurchaseModal = false;
      this.selectedItem = null;
      
      // 실제 구현에서는 API를 통해 서버에 아이템 구매 요청
    },
    
    cancelPurchase() {
      this.showPurchaseModal = false;
      this.selectedItem = null;
    }
  }
};
</script>

<style scoped>
.shop-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f5f7fa;
  min-height: 100vh;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.shop-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.user-currency {
  display: flex;
  gap: 1rem;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.6rem 1rem;
  border-radius: 50px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-weight: 600;
}

.currency-item i {
  color: #ffc107;
}

.currency-item:last-child i {
  color: #9c27b0;
}

.shop-nav {
  display: flex;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  overflow: hidden;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.2rem 0;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 0.5rem;
  color: #666;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #333;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.nav-item i {
  font-size: 1.2rem;
}

.shop-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.category-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
}

.filter-controls button {
  background: #f0f2f5;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.filter-controls button:hover {
  background: #e0e5ec;
}

.filter-controls button.active {
  background: #667eea;
  color: white;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.shop-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.shop-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.shop-item.owned {
  opacity: 0.8;
}

.item-image-container {
  position: relative;
  padding-top: 100%;
  background: #f8f9fa;
}

.item-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 1rem;
}

.item-rarity {
  position: absolute;
  top: 10px;
  left: 10px;
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

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f44336;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
}

.item-details {
  padding: 1rem;
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

.item-footer {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 600;
}

.original-price {
  text-decoration: line-through;
  color: #999;
  font-size: 0.9rem;
  margin-right: 0.3rem;
}

.price {
  color: #333;
}

.item-price i {
  color: #ffc107;
}

.item-price i.fa-gem {
  color: #9c27b0;
}

.item-status {
  font-weight: 600;
  color: #4caf50;
}

.buy-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.buy-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.buy-button:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .shop-main {
    padding: 1rem;
  }
  
  .shop-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .nav-item {
    padding: 1rem 0;
  }
  
  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
}
</style> 