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
        
        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>아이템을 불러오는 중...</p>
          </div>
        </div>

        <div v-else class="items-grid">
          <div 
            v-for="item in filteredItems" 
            :key="useApiData ? item.itemId : item.id"
            class="shop-item"
            :class="{ 'owned': item.owned, 'equipped': item.equipped }"
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
                <span class="owned-label" :class="{ 'equipped': item.equipped }">
                  {{ item.equipped ? '장착 중' : '보유 중' }}
                </span>
              </div>
              
              <div class="item-actions">
                <button 
                  v-if="!item.owned"
                  class="buy-button" 
                  :disabled="!canAfford(item) || loading"
                  @click="buyItem(item)"
                >
                  구매하기
                </button>
                
                <button 
                  v-else-if="shopService.isEquippableCategory(currentCategory)"
                  class="equip-button"
                  :class="{ 'equipped': item.equipped }"
                  :disabled="loading"
                  @click="equipItem(item)"
                >
                  {{ item.equipped ? '장착 중' : '장착하기' }}
                </button>
                
                <div v-else class="owned-indicator">
                  <i class="fas fa-check"></i>
                  보유 중
                </div>
              </div>
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
import PurchaseModal from "@/features/shop/components/PurchaseModal.vue"
import NavigationBar from '@/core/components/NavigationBar.vue'
import { shopService } from '@/features/shop/services/shop.service.js'

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
      
      // API 관련 상태
      loading: false,
      useApiData: true, // API 사용 여부 (폴백으로 더미 데이터 사용)
      apiItems: {}, // API에서 받은 아이템들
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
      if (this.useApiData && this.apiItems[this.currentCategory]) {
        return this.apiItems[this.currentCategory];
      }
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
  
  async mounted() {
    await this.loadItems();
  },
  
  methods: {
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // shopService를 템플릿에서 접근할 수 있도록 하는 헬퍼
    get shopService() {
      return shopService;
    },
    
    async setCategory(categoryId) {
      this.currentCategory = categoryId;
      await this.loadItems();
    },

    // API에서 아이템 데이터 로드
    async loadItems() {
      try {
        this.loading = true;
        const itemTypeKey = shopService.getCategoryToItemTypeKey(this.currentCategory);
        const response = await shopService.getItemsByType(itemTypeKey);
        
        if (response.isSuccess) {
          // API 응답을 UI 형식으로 변환
          const apiItems = response.result.map(item => 
            shopService.convertApiToUiFormat(item, this.currentCategory)
          );
          
          // API 데이터를 카테고리별로 저장
          this.$set(this.apiItems, this.currentCategory, apiItems);
          
          console.log(`${this.currentCategory} 아이템 로드 완료:`, apiItems);
        } else {
          throw new Error(response.message || 'API 응답 실패');
        }
      } catch (error) {
        console.error('아이템 로드 실패:', error);
        // API 실패 시 더미 데이터 사용
        this.useApiData = false;
        console.warn('더미 데이터로 폴백');
      } finally {
        this.loading = false;
      }
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
    
    async confirmPurchase() {
      if (!this.selectedItem) return;
      
      try {
        this.loading = true;
        
        // API를 통한 아이템 구매
        const response = await shopService.purchaseItem(this.selectedItem.itemId);
        
        if (response.isSuccess) {
          // 구매 성공 시 UI 업데이트
          this.userCoins -= this.selectedItem.price;
          
          // 아이템 보유 상태 업데이트
          if (this.useApiData) {
            const items = this.apiItems[this.selectedItem.category];
            const itemIndex = items.findIndex(item => item.itemId === this.selectedItem.itemId);
            if (itemIndex !== -1) {
              items[itemIndex].owned = true;
              items[itemIndex].memberItemId = response.result?.memberItemId || Math.floor(Math.random() * 10000);
            }
          } else {
            // 더미 데이터 업데이트
            const category = this.shopItems[this.selectedItem.category];
            const itemIndex = category.findIndex(item => item.id === this.selectedItem.id);
            if (itemIndex !== -1) {
              category[itemIndex].owned = true;
            }
          }
          
          console.log('아이템 구매 완료:', this.selectedItem.name);
          alert(`${this.selectedItem.name}을(를) 구매했습니다!`);
        } else {
          throw new Error(response.message || '구매에 실패했습니다.');
        }
      } catch (error) {
        console.error('아이템 구매 실패:', error);
        alert(error.message || '구매에 실패했습니다. 다시 시도해주세요.');
      } finally {
        this.loading = false;
        this.showPurchaseModal = false;
        this.selectedItem = null;
      }
    },

    // 아이템 장착
    async equipItem(item) {
      if (!item.owned || !item.memberItemId) {
        alert('보유하지 않은 아이템입니다.');
        return;
      }

      try {
        this.loading = true;
        
        const response = await shopService.equipItem(item.memberItemId);
        
        if (response.isSuccess) {
          // 장착 성공 시 UI 업데이트
          if (this.useApiData) {
            const items = this.apiItems[this.currentCategory];
            
            // 해당 카테고리의 모든 아이템 장착 해제
            items.forEach(categoryItem => {
              if (categoryItem.memberItemId) {
                categoryItem.equipped = false;
              }
            });
            
            // 선택한 아이템만 장착
            const itemIndex = items.findIndex(categoryItem => categoryItem.memberItemId === item.memberItemId);
            if (itemIndex !== -1) {
              items[itemIndex].equipped = true;
            }
          }
          
          console.log('아이템 장착 완료:', item.name);
          alert(`${item.name}을(를) 장착했습니다!`);
        } else {
          throw new Error(response.message || '장착에 실패했습니다.');
        }
      } catch (error) {
        console.error('아이템 장착 실패:', error);
        alert(error.message || '장착에 실패했습니다. 다시 시도해주세요.');
      } finally {
        this.loading = false;
      }
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

.shop-item.equipped {
  border: 2px solid #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.shop-item.equipped::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  width: 20px;
  height: 20px;
  background: #10b981;
  border-radius: 50%;
  z-index: 2;
}

.shop-item.equipped::after {
  content: '✓';
  position: absolute;
  top: 12px;
  left: 15px;
  color: white;
  font-size: 12px;
  font-weight: bold;
  z-index: 3;
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

.owned-label.equipped {
  color: #10b981;
  font-weight: 700;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
}

.loading-spinner i {
  font-size: 2rem;
  color: #667eea;
}

.loading-spinner p {
  margin: 0;
  font-size: 1rem;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.equip-button {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.equip-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-2px);
}

.equip-button.equipped {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  cursor: default;
}

.equip-button.equipped:hover {
  transform: none;
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.equip-button:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.owned-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-weight: 600;
  font-size: 0.9rem;
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