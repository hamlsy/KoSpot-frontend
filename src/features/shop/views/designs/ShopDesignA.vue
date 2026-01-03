<template>
  <div class="shop-design-a">
    <!-- 헤더 -->
    <header class="shop-header">
      <div class="header-content">
        <div class="title-area">
          <h1>상점</h1>
          <p class="subtitle">게임에서 획득한 포인트로 아이템을 구매하세요</p>
        </div>
        <div class="points-display">
          <i class="fas fa-coins"></i>
          <span class="points-value">{{ formatNumber(userCoins) }}</span>
          <span class="points-label">포인트</span>
        </div>
      </div>
    </header>

    <!-- 카테고리 탭 -->
    <nav class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        class="tab-item"
        :class="{ 
          active: currentCategory === category.id,
          disabled: category.disabled 
        }"
        @click="!category.disabled && setCategory(category.id)"
      >
        <i :class="category.icon"></i>
        <span>{{ category.name }}</span>
        <span v-if="category.disabled" class="soon-tag">준비중</span>
      </button>
    </nav>

    <!-- 필터 -->
    <div class="filter-bar">
      <div class="filter-group">
        <button
          v-for="filter in filters"
          :key="filter.id"
          class="filter-chip"
          :class="{ active: currentFilter === filter.id }"
          @click="setFilter(filter.id)"
        >
          {{ filter.name }}
        </button>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>아이템을 불러오는 중...</p>
    </div>

    <!-- 아이템 그리드 -->
    <div v-else-if="filteredItems.length > 0" class="items-grid">
      <article
        v-for="item in filteredItems"
        :key="item.itemId || item.id"
        class="item-card"
        :class="{ 
          owned: item.owned, 
          equipped: item.equipped 
        }"
      >
        <div class="card-image">
          <img :src="item.image" :alt="item.name" @error="handleImageError" />
          <span v-if="item.isNew" class="badge new">NEW</span>
          <span v-if="item.equipped" class="badge equipped">
            <i class="fas fa-check"></i> 장착중
          </span>
        </div>
        
        <div class="card-body">
          <div class="item-meta">
            <span class="rarity" :class="getRarityClass(item.rarity)">
              {{ item.rarity }}
            </span>
          </div>
          <h3 class="item-name">{{ item.name }}</h3>
          <p class="item-desc">{{ item.description }}</p>
        </div>

        <div class="card-footer">
          <template v-if="!item.owned">
            <div class="price">
              <i class="fas fa-coins"></i>
              <span>{{ formatNumber(item.price) }}</span>
            </div>
            <button 
              class="btn-buy"
              :disabled="!canAfford(item) || loading"
              @click="buyItem(item)"
            >
              구매
            </button>
          </template>
          <template v-else>
            <div class="owned-status">보유중</div>
            <button
              v-if="isEquippableCategory"
              class="btn-equip"
              :class="{ equipped: item.equipped }"
              :disabled="loading"
              @click="equipItem(item)"
            >
              {{ item.equipped ? '장착중' : '장착' }}
            </button>
          </template>
        </div>
      </article>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-state">
      <i class="fas fa-box-open"></i>
      <p>표시할 아이템이 없습니다</p>
    </div>

    <!-- 구매 모달 -->
    <PurchaseModal
      v-if="showPurchaseModal"
      :item="selectedItem"
      :userCoins="userCoins"
      @confirm="confirmPurchase"
      @cancel="cancelPurchase"
    />
  </div>
</template>

<script>
import PurchaseModal from '@/features/shop/components/PurchaseModal.vue'
import { shopService } from '@/features/shop/services/shop.service.js'
import { userService } from '@/features/user/services/user.service.js'

export default {
  name: 'ShopDesignA',
  components: { PurchaseModal },
  
  data() {
    return {
      userCoins: 0,
      currentCategory: 'markers',
      currentFilter: 'all',
      showPurchaseModal: false,
      selectedItem: null,
      loading: false,
      apiItems: {},
      categories: [],
      filters: [
        { id: 'all', name: '전체' },
        { id: 'notOwned', name: '미보유' }
      ]
    }
  },

  computed: {
    currentCategoryItems() {
      const category = this.categories.find(c => c.id === this.currentCategory)
      if (category?.disabled) return []
      return this.apiItems[this.currentCategory] || []
    },
    filteredItems() {
      if (this.currentFilter === 'notOwned') {
        return this.currentCategoryItems.filter(item => !item.owned)
      }
      return this.currentCategoryItems
    },
    isEquippableCategory() {
      return shopService.isEquippableCategory(this.currentCategory)
    }
  },

  async mounted() {
    await this.initializeShop()
  },

  methods: {
    async initializeShop() {
      this.categories = shopService.getItemTypes().map(type => ({
        id: type.categoryId,
        name: type.name,
        icon: type.icon,
        disabled: type.disabled
      }))
      await this.loadUserCoins()
      await this.loadItems()
    },

    async loadUserCoins() {
      try {
        const response = await userService.getProfile()
        if (response.isSuccess && response.result) {
          this.userCoins = response.result.currentPoint || 0
        }
      } catch (error) {
        console.error('코인 정보 로드 실패:', error)
        this.userCoins = 0
      }
    },

    async loadItems() {
      const category = this.categories.find(c => c.id === this.currentCategory)
      if (category?.disabled) return

      try {
        this.loading = true
        const itemTypeKey = shopService.getCategoryToItemTypeKey(this.currentCategory)
        const response = await shopService.getItemsByType(itemTypeKey)
        
        if (response.isSuccess) {
          const items = response.result.map(item =>
            shopService.convertApiToUiFormat(item, this.currentCategory)
          )
          this.apiItems = { ...this.apiItems, [this.currentCategory]: items }
        }
      } catch (error) {
        console.error('아이템 로드 실패:', error)
      } finally {
        this.loading = false
      }
    },

    async setCategory(categoryId) {
      this.currentCategory = categoryId
      this.currentFilter = 'all'
      await this.loadItems()
    },

    setFilter(filterId) {
      this.currentFilter = filterId
    },

    formatNumber(num) {
      if (!num) return '0'
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },

    canAfford(item) {
      return this.userCoins >= item.price
    },

    buyItem(item) {
      this.selectedItem = item
      this.showPurchaseModal = true
    },

    async confirmPurchase() {
      if (!this.selectedItem) return
      try {
        this.loading = true
        const response = await shopService.purchaseItem(this.selectedItem.itemId)
        if (response.isSuccess) {
          this.userCoins -= this.selectedItem.price
          const items = this.apiItems[this.currentCategory]
          const idx = items.findIndex(i => i.itemId === this.selectedItem.itemId)
          if (idx !== -1) {
            items[idx].owned = true
            items[idx].memberItemId = response.result?.memberItemId
          }
          alert(`${this.selectedItem.name}을(를) 구매했습니다!`)
        }
      } catch (error) {
        alert(error.message || '구매에 실패했습니다.')
      } finally {
        this.loading = false
        this.showPurchaseModal = false
        this.selectedItem = null
      }
    },

    cancelPurchase() {
      this.showPurchaseModal = false
      this.selectedItem = null
    },

    async equipItem(item) {
      if (!item.owned || !item.memberItemId) return
      try {
        this.loading = true
        const response = await shopService.equipItem(item.memberItemId)
        if (response.isSuccess) {
          const items = this.apiItems[this.currentCategory]
          items.forEach(i => { if (i.memberItemId) i.equipped = false })
          const idx = items.findIndex(i => i.memberItemId === item.memberItemId)
          if (idx !== -1) items[idx].equipped = true
          alert(`${item.name}을(를) 장착했습니다!`)
        }
      } catch (error) {
        alert(error.message || '장착에 실패했습니다.')
      } finally {
        this.loading = false
      }
    },

    getRarityClass(rarity) {
      const map = { '일반': 'common', '레어': 'rare', '에픽': 'epic', '전설': 'legendary' }
      return map[rarity] || 'common'
    },

    handleImageError(e) {
      e.target.src = '/images/placeholder-item.png'
    }
  }
}
</script>

<style scoped>
.shop-design-a {
  min-height: 100vh;
  background: var(--color-background);
  padding-top: 80px;
}

/* Header */
.shop-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-xl) 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-area h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h1);
  color: var(--color-text-primary);
  margin: 0;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  margin: var(--spacing-xs) 0 0;
}

.points-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-lg);
}

.points-display i {
  color: var(--color-accent);
  font-size: 1.25rem;
}

.points-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
}

.points-label {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-small);
}

/* Category Tabs */
.category-tabs {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  display: flex;
  gap: var(--spacing-sm);
}

.tab-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
}

.tab-item:hover:not(.disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab-item.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.tab-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.soon-tag {
  font-size: 0.65rem;
  background: var(--color-text-tertiary);
  color: white;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  margin-left: var(--spacing-xs);
}

.tab-item.active .soon-tag {
  background: rgba(255,255,255,0.3);
}

/* Filter Bar */
.filter-bar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.filter-group {
  display: flex;
  gap: var(--spacing-xs);
}

.filter-chip {
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-chip:hover {
  background: var(--color-surface-hover);
}

.filter-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* Items Grid */
.items-grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg) var(--spacing-2xl);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
}

.item-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
}

.item-card.equipped {
  border-color: var(--color-success);
}

.card-image {
  position: relative;
  aspect-ratio: 1;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.card-image img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

.badge {
  position: absolute;
  top: var(--spacing-sm);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
}

.badge.new {
  left: var(--spacing-sm);
  background: var(--color-error);
  color: white;
}

.badge.equipped {
  right: var(--spacing-sm);
  background: var(--color-success);
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-body {
  padding: var(--spacing-md);
}

.item-meta {
  margin-bottom: var(--spacing-xs);
}

.rarity {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.rarity.common { background: var(--color-border); color: var(--color-text-secondary); }
.rarity.rare { background: var(--color-primary); color: white; }
.rarity.epic { background: #8b5cf6; color: white; }
.rarity.legendary { background: var(--color-accent); color: white; }

.item-name {
  font-family: var(--font-heading);
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: var(--spacing-xs) 0;
}

.item-desc {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}

.price {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  color: var(--color-text-primary);
}

.price i {
  color: var(--color-accent);
}

.owned-status {
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
}

.btn-buy,
.btn-equip {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-buy {
  background: var(--color-primary);
  color: white;
  border: none;
}

.btn-buy:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-buy:disabled {
  background: var(--color-border);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.btn-equip {
  background: var(--color-success);
  color: white;
  border: none;
}

.btn-equip.equipped {
  background: var(--color-text-tertiary);
}

.btn-equip:hover:not(:disabled):not(.equipped) {
  background: #059669;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-tertiary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.empty-state p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }

  .category-tabs {
    flex-wrap: wrap;
    justify-content: center;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--spacing-md);
  }
}
</style>

