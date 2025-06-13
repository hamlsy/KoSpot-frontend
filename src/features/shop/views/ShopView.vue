<template>
  <div class="shop-page">
    <NavigationBar />
    <div class="shop-content">
      <div class="shop-header">
        <h1 class="shop-title">KoSpot 상점</h1>
        <div class="user-currency">
          <div class="currency-item">
            <i class="fas fa-coins"></i>
            <span>{{ formatNumber(userCoins) }} 코인</span>
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
      
      <div class="shop-content-area">
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
            :class="{ 'owned': item.owned }"
          >
            <div class="item-image-container">
              <img :src="item.image" :alt="item.name" class="item-image" />
              <div class="item-rarity" :class="item.rarity.toLowerCase()">{{ item.rarity }}</div>
            </div>
            
            <div class="item-details">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-description">{{ item.description }}</div>
            </div>
            
            <div class="item-footer">
              <div class="item-price" v-if="!item.owned">
                <span class="price">{{ formatNumber(item.price) }}</span>
                <i class="fas fa-coins"></i>
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
  </div>
</template>

<script>

import PurchaseModal from 'src/components/user/shop/PurchaseModal.vue'
import NavigationBar from '@/core/components/NavigationBar.vue'

export default {
  name: 'ShopMain',
  
  components: {
    PurchaseModal,
    NavigationBar
  },
  
  data() {
    return {
      userCoins: 5000,
      currentCategory: 'markers',
      currentFilter: 'all',
      showPurchaseModal: false,
      selectedItem: null,
      categories: [
        { id: 'markers', name: '마커', icon: 'fas fa-map-marker-alt' },
        { id: 'nicknames', name: '닉네임 꾸미기', icon: 'fas fa-font' },
        { id: 'items', name: '아이템', icon: 'fas fa-gift' }
      ],
      filters: [
        { id: 'all', name: '전체' },
        { id: 'new', name: '신규' },
        { id: 'notOwned', name: '미보유' }
      ],
      shopItems: {
        markers: [
          {
            id: 'mk1',
            name: '기본 마커',
            description: '기본 제공되는 표준 마커입니다.',
            price: 0,
            currencyType: 'coin',
            rarity: '일반',
            image: '/assets/markers/basic.png',
            category: 'markers',
            isNew: false,
            owned: true
          },
          {
            id: 'mk2',
            name: '별 마커',
            description: '별 모양의 마커로 위치를 표시합니다.',
            price: 2000,
            currencyType: 'coin',
            rarity: '일반',
            image: '/assets/markers/star.png',
            category: 'markers',
            isNew: false,
            owned: false
          },
          {
            id: 'mk3',
            name: '하트 마커',
            description: '하트 모양의 마커로 위치를 표시합니다.',
            price: 2500,
            currencyType: 'coin',
            rarity: '레어',
            image: '/assets/markers/heart.png',
            category: 'markers',
            isNew: true,
            owned: false
          },
          {
            id: 'mk4',
            name: '왕관 마커',
            description: '왕관 모양의 마커로 위치를 표시합니다.',
            price: 3000,
            currencyType: 'coin',
            rarity: '레어',
            image: '/assets/markers/crown.png',
            category: 'markers',
            isNew: true,
            owned: false
          }
        ],
        nicknames: [
          {
            id: 'nc1',
            name: '레인보우 닉네임',
            description: '닉네임에 무지개 색상을 적용합니다.',
            price: 3000,
            currencyType: 'coin',
            rarity: '레어',
            image: '/assets/nicknames/rainbow.png',
            category: 'nicknames',
            isNew: false,
            owned: false
          },
          {
            id: 'nc2',
            name: '골드 닉네임',
            description: '닉네임에 금색 효과를 적용합니다.',
            price: 3500,
            currencyType: 'coin',
            rarity: '레어',
            image: '/assets/nicknames/gold.png',
            category: 'nicknames',
            isNew: true,
            owned: false
          },
          {
            id: 'nc3',
            name: '네온 닉네임',
            description: '닉네임에 네온 효과를 적용합니다.',
            price: 4000,
            currencyType: 'coin',
            rarity: '에픽',
            image: '/assets/nicknames/neon.png',
            category: 'nicknames',
            isNew: true,
            owned: false
          }
        ],
        items: [
          {
            id: 'it1',
            name: '닉네임 변경권',
            description: '닉네임을 한 번 변경할 수 있습니다.',
            price: 1500,
            currencyType: 'coin',
            rarity: '일반',
            image: '/assets/items/nickname_change.png',
            category: 'items',
            isNew: false,
            owned: false
          },
          {
            id: 'it2',
            name: '프로필 배경 변경권',
            description: '프로필 배경을 변경할 수 있습니다.',
            price: 2000,
            currencyType: 'coin',
            rarity: '일반',
            image: '/assets/items/profile_bg.png',
            category: 'items',
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
      return this.userCoins >= item.price;
    },
    
    buyItem(item) {
      if (item.owned) return;
      
      this.selectedItem = item;
      this.showPurchaseModal = true;
    },
    
    confirmPurchase() {
      if (!this.selectedItem) return;
      
      // 실제 구매 처리
      this.userCoins -= this.selectedItem.price;
      
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
.shop-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.shop-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f5f7fa;
  min-height: 100vh;
  padding-top: 80px; /* 네비게이션바 높이만큼 여백 추가 */
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

.shop-content-area {
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

.price {
  color: #333;
}

.item-price i {
  color: #ffc107;
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
  .shop-content {
    padding: 1rem;
    padding-top: 80px; /* 네비게이션바 높이만큼 여백 유지 */
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