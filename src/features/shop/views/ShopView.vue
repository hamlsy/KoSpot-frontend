<template>
  <div class="shop-page">
    <NavigationBar />
    <div class="shop-content">
      <!-- 헤더 섹션 -->
      <div class="shop-header">
        <div class="header-left">
          <h1 class="shop-title">상점</h1>
          <p class="shop-subtitle">게임에서 획득한 포인트로 아이템을 구매하세요</p>
        </div>
        <div class="user-currency">
          <div class="currency-item">
            <div class="currency-icon">
              <i class="fas fa-coins"></i>
            </div>
            <div class="currency-info">
              <span class="currency-label">보유 포인트</span>
              <span class="currency-value">{{ formatNumber(userCoins) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 카테고리 네비게이션 -->
      <div class="category-nav">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="nav-item"
          :class="{ 
            active: currentCategory === category.id,
            disabled: category.disabled
          }"
          @click="!category.disabled && setCategory(category.id)"
        >
          <i :class="category.icon"></i>
          <span>{{ category.name }}</span>
          <span v-if="category.disabled" class="coming-soon-badge">준비 중</span>
        </div>
      </div>
      
      <!-- 메인 컨텐츠 영역 -->
      <div class="shop-content-area">
        <div class="content-header">
          <h2 class="category-title">{{ currentCategoryName }}</h2>
          <div class="filter-controls">
            <button 
              v-for="filter in filters" 
              :key="filter.id"
              class="filter-button"
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
            <div class="spinner"></div>
            <p>아이템을 불러오는 중...</p>
          </div>
        </div>

        <!-- 아이템 그리드 -->
        <div v-else-if="filteredItems.length > 0" class="items-grid">
          <div 
            v-for="item in filteredItems" 
            :key="useApiData ? item.itemId : item.id"
            class="shop-item"
            :class="{ 
              'owned': item.owned, 
              'equipped': item.equipped,
              'disabled': isCategoryDisabled
            }"
          >
            <!-- 아이템 이미지 -->
            <div class="item-image-container">
              <img 
                :src="item.image" 
                :alt="item.name" 
                class="item-image"
                @error="handleImageError"
              />
              <div v-if="item.isNew" class="new-badge">NEW</div>
              <div v-if="item.owned && item.equipped" class="equipped-badge">
                <i class="fas fa-check-circle"></i>
                <span>장착 중</span>
              </div>
            </div>
            
            <!-- 아이템 정보 -->
            <div class="item-info">
              <div class="item-header">
                <h3 class="item-name">{{ item.name }}</h3>
                <div class="item-rarity" :class="getRarityClass(item.rarity)">
                  {{ item.rarity }}
                </div>
              </div>
              <p class="item-description">{{ item.description }}</p>
            </div>
            
            <!-- 아이템 푸터 -->
            <div class="item-footer">
              <div class="item-price-section" v-if="!item.owned">
                <div class="price-display">
                  <i class="fas fa-coins"></i>
                  <span class="price-value">{{ formatNumber(item.price) }}</span>
                </div>
              </div>
              <div class="item-status" v-else>
                <span class="owned-badge" :class="{ 'equipped': item.equipped }">
                  {{ item.equipped ? '장착 중' : '보유 중' }}
                </span>
              </div>
              
              <div class="item-actions">
                <button 
                  v-if="!item.owned && !isCategoryDisabled"
                  class="action-button buy-button" 
                  :disabled="!canAfford(item) || loading"
                  @click="buyItem(item)"
                >
                  <i class="fas fa-shopping-cart"></i>
                  <span>구매하기</span>
                </button>
                
                <button 
                  v-else-if="item.owned && shopService.isEquippableCategory(currentCategory) && !isCategoryDisabled"
                  class="action-button equip-button"
                  :class="{ 'equipped': item.equipped }"
                  :disabled="loading"
                  @click="equipItem(item)"
                >
                  <i :class="item.equipped ? 'fas fa-check' : 'fas fa-check-circle'"></i>
                  <span>{{ item.equipped ? '장착 중' : '장착하기' }}</span>
                </button>
                
                <div v-else-if="item.owned && !shopService.isEquippableCategory(currentCategory)" class="owned-indicator">
                  <i class="fas fa-check"></i>
                  <span>보유 중</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-box-open"></i>
          </div>
          <p class="empty-message">표시할 아이템이 없습니다</p>
        </div>
      </div>
      
      <!-- 구매 확인 모달 -->
      <purchase-modal 
        v-if="showPurchaseModal"
        :item="selectedItem"
        :userCoins="userCoins"
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
import { userService } from '@/features/user/services/user.service.js'
import { BRAND, TEXT, BACKGROUND, GRADIENTS } from '@/core/constants/colors.js'

export default {
  name: 'ShopView',
  
  components: {
    PurchaseModal,
    NavigationBar
  },
  
  data() {
    return {
      userCoins: 0,
      currentCategory: 'markers',
      currentFilter: 'all',
      showPurchaseModal: false,
      selectedItem: null,
      
      loading: false,
      useApiData: true,
      apiItems: {},
      
      categories: [],
      filters: [
        { id: 'all', name: '전체' },
        { id: 'notOwned', name: '미보유' }
      ],
      
      shopItems: {
        markers: [],
        'marker-effects': [],
        items: []
      }
    };
  },
  
  computed: {
    shopService() {
      return shopService;
    },
    colors() {
      return {
        primary: BRAND.PRIMARY,
        secondary: BRAND.SECONDARY,
        success: BRAND.SUCCESS,
        danger: BRAND.DANGER,
        textPrimary: TEXT.PRIMARY,
        textSecondary: TEXT.SECONDARY,
        bgLight: BACKGROUND.LIGHT,
        bgGray: BACKGROUND.GRAY,
        gradientPrimary: GRADIENTS.PRIMARY,
        gradientSecondary: GRADIENTS.SECONDARY,
        gradientSuccess: GRADIENTS.SUCCESS,
        gradientDanger: GRADIENTS.DANGER
      };
    },
    currentCategoryName() {
      const category = this.categories.find(cat => cat.id === this.currentCategory);
      return category ? category.name : '';
    },
    isCategoryDisabled() {
      const category = this.categories.find(cat => cat.id === this.currentCategory);
      return category ? category.disabled : false;
    },
    currentCategoryItems() {
      if (this.isCategoryDisabled) {
        return [];
      }
      if (this.useApiData && this.apiItems[this.currentCategory]) {
        return this.apiItems[this.currentCategory];
      }
      return this.shopItems[this.currentCategory] || [];
    },
    filteredItems() {
      if (this.currentFilter === 'all') {
        return this.currentCategoryItems;
      }
      if (this.currentFilter === 'notOwned') {
        return this.currentCategoryItems.filter(item => !item.owned);
      }
      return this.currentCategoryItems;
    }
  },
  
  async mounted() {
    await this.initializeShop();
  },
  
  methods: {
    async initializeShop() {
      // 카테고리 초기화
      this.categories = shopService.getItemTypes().map(type => ({
        id: type.categoryId,
        name: type.name,
        icon: type.icon,
        disabled: type.disabled
      }));
      
      // 사용자 코인 정보 로드
      await this.loadUserCoins();
      
      // 아이템 로드
      await this.loadItems();
    },
    
    async loadUserCoins() {
      try {
        const response = await userService.getProfile();
        if (response.isSuccess && response.result) {
          this.userCoins = response.result.currentPoint || 0;
        }
      } catch (error) {
        console.error('코인 정보 로드 실패:', error);
        this.userCoins = 0;
      }
    },
    
    formatNumber(num) {
      if (num === null || num === undefined || isNaN(num)) {
        return '0';
      }
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    async setCategory(categoryId) {
      if (this.isCategoryDisabled) return;
      this.currentCategory = categoryId;
      this.currentFilter = 'all'; // 필터 리셋
      await this.loadItems();
    },

    async loadItems() {
      if (this.isCategoryDisabled) {
        return;
      }
      
      try {
        this.loading = true;
        const itemTypeKey = shopService.getCategoryToItemTypeKey(this.currentCategory);
        const response = await shopService.getItemsByType(itemTypeKey);
        
        if (response.isSuccess) {
          const apiItems = response.result.map(item => 
            shopService.convertApiToUiFormat(item, this.currentCategory)
          );
          
          // Vue 반응성을 위해 새 객체로 할당
          this.$set(this.apiItems, this.currentCategory, apiItems);
          console.log(`${this.currentCategory} 아이템 로드 완료:`, apiItems);
        } else {
          throw new Error(response.message || 'API 응답 실패');
        }
      } catch (error) {
        console.error('아이템 로드 실패:', error);
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
      if (item.owned || this.isCategoryDisabled) return;
      this.selectedItem = item;
      this.showPurchaseModal = true;
    },
    
    async confirmPurchase() {
      if (!this.selectedItem) return;
      
      try {
        this.loading = true;
        const response = await shopService.purchaseItem(this.selectedItem.itemId);
        
        if (response.isSuccess) {
          this.userCoins -= this.selectedItem.price;
          
          if (this.useApiData) {
            const items = this.apiItems[this.selectedItem.category];
            const itemIndex = items.findIndex(item => item.itemId === this.selectedItem.itemId);
            if (itemIndex !== -1) {
              items[itemIndex].owned = true;
              items[itemIndex].memberItemId = response.result?.memberItemId || Math.floor(Math.random() * 10000);
            }
          } else {
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

    async equipItem(item) {
      if (!item.owned || !item.memberItemId || this.isCategoryDisabled) {
        alert('보유하지 않은 아이템입니다.');
        return;
      }

      try {
        this.loading = true;
        const response = await shopService.equipItem(item.memberItemId);
        
        if (response.isSuccess) {
          if (this.useApiData) {
            const items = this.apiItems[this.currentCategory];
            items.forEach(categoryItem => {
              if (categoryItem.memberItemId) {
                categoryItem.equipped = false;
              }
            });
            
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
    },
    
    getRarityClass(rarity) {
      const rarityMap = {
        '일반': 'common',
        '레어': 'rare',
        '에픽': 'epic',
        '전설': 'legendary'
      };
      return rarityMap[rarity] || 'common';
    },
    
    handleImageError(event) {
      event.target.src = '/images/placeholder-item.png';
    }
  }
};
</script>

<style scoped>
.shop-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e2e8f0 100%);
}

.shop-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  padding-top: 100px;
}

/* 헤더 섹션 */
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
}

.header-left {
  flex: 1;
}

.shop-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.shop-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.user-currency {
  display: flex;
  gap: 1rem;
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.currency-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.currency-icon {
  width: 48px;
  height: 48px;
  background: v-bind('colors.gradientSecondary');
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.currency-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.currency-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.currency-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

/* 카테고리 네비게이션 */
.category-nav {
  display: flex;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  gap: 0;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 0.5rem;
  color: #6b7280;
  position: relative;
  border-right: 1px solid #e5e7eb;
}

.nav-item:last-child {
  border-right: none;
}

.nav-item:hover:not(.disabled) {
  background: #f9fafb;
  color: #111827;
}

.nav-item.active {
  background: v-bind('colors.gradientPrimary');
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.nav-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f3f4f6;
}

.nav-item i {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.nav-item span {
  font-size: 1rem;
  font-weight: 600;
}

.coming-soon-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #6b7280;
  color: white;
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-item.active .coming-soon-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* 메인 컨텐츠 영역 */
.shop-content-area {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  border: 2px solid #e5e7eb;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.category-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
}

.filter-button {
  background: #f3f4f6;
  border: 2px solid transparent;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
}

.filter-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.filter-button.active {
  background: v-bind('colors.gradientPrimary');
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6rem 2rem;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: v-bind('colors.primary');
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-spinner p {
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
}

/* 아이템 그리드 */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.shop-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: relative;
}

.shop-item:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: v-bind('colors.primary');
}

.shop-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.shop-item.equipped {
  border-color: v-bind('colors.success');
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

/* 아이템 이미지 */
.item-image-container {
  position: relative;
  width: 100%;
  padding-top: 100%;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  overflow: hidden;
}

.item-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.75rem;
}

.new-badge {
  position: absolute;
  top: 0.375rem;
  left: 0.375rem;
  background: v-bind('colors.gradientDanger');
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 1px 4px rgba(239, 68, 68, 0.3);
  z-index: 2;
}

.equipped-badge {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  background: v-bind('colors.gradientSuccess');
  color: white;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 1px 4px rgba(16, 185, 129, 0.3);
  z-index: 2;
}

.equipped-badge i {
  font-size: 0.8rem;
}

/* 아이템 정보 */
.item-info {
  padding: 0.625rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.375rem;
}

.item-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
  flex: 1;
  line-height: 1.3;
}

.item-rarity {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.item-rarity.common {
  background: #e5e7eb;
  color: #111827;
}

.item-rarity.rare {
  background: v-bind('colors.gradientPrimary');
  color: white;
}

.item-rarity.epic {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
}

.item-rarity.legendary {
  background: v-bind('colors.gradientSecondary');
  color: white;
}

.item-description {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 아이템 푸터 */
.item-footer {
  padding: 0.625rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-price-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #111827;
}

.price-display i {
  color: v-bind('colors.secondary');
  font-size: 0.9rem;
}

.price-value {
  font-size: 1rem;
  color: #111827;
}

.item-status {
  display: flex;
  align-items: center;
}

.owned-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  background: #e5e7eb;
  color: #6b7280;
}

.owned-badge.equipped {
  background: v-bind('colors.gradientSuccess');
  color: white;
}

.item-actions {
  width: 100%;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
  width: 100%;
}

.buy-button {
  background: v-bind('colors.gradientPrimary');
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.buy-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
}

.buy-button:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

.equip-button {
  background: v-bind('colors.gradientSuccess');
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.equip-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.equip-button.equipped {
  background: #6b7280;
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.25);
}

.equip-button.equipped:hover {
  background: #4b5563;
}

.equip-button:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  box-shadow: none;
}

.owned-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  color: v-bind('colors.success');
  font-weight: 600;
  font-size: 0.8rem;
  width: 100%;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #9ca3af;
  font-size: 2rem;
}

.empty-message {
  margin: 0;
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 500;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .shop-content {
    padding: 1rem;
    padding-top: 100px;
  }
  
  .shop-header {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .shop-title {
    font-size: 2rem;
  }
  
  .currency-item {
    width: 100%;
    justify-content: flex-start;
  }
  
  .category-nav {
    flex-direction: column;
  }
  
  .nav-item {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    padding: 1.25rem;
  }
  
  .nav-item:last-child {
    border-bottom: none;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .filter-controls {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  
  .shop-content-area {
    padding: 1.5rem;
  }
  
  .item-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .item-actions {
    margin-left: 0;
    width: 100%;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .shop-title {
    font-size: 1.75rem;
  }
  
  .shop-subtitle {
    font-size: 0.9rem;
  }
  
  .currency-item {
    padding: 0.875rem 1.25rem;
  }
  
  .currency-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
  
  .currency-value {
    font-size: 1.25rem;
  }
  
  .category-title {
    font-size: 1.5rem;
  }
  
  .items-grid {
    gap: 1rem;
  }
  
  .item-info {
    padding: 1rem;
  }
  
  .item-footer {
    padding: 1rem;
  }
}
</style>
