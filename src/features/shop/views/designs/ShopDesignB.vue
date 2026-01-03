<template>
  <div class="shop-design-b">
    <!-- 사이드바 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>상점</h2>
      </div>

      <nav class="category-list">
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-item"
          :class="{ 
            active: currentCategory === category.id,
            disabled: category.disabled 
          }"
          @click="!category.disabled && setCategory(category.id)"
        >
          <i :class="category.icon"></i>
          <span class="category-name">{{ category.name }}</span>
          <span v-if="category.disabled" class="soon-badge">준비중</span>
          <i v-else class="fas fa-chevron-right arrow"></i>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="points-card">
          <div class="points-icon">
            <i class="fas fa-coins"></i>
          </div>
          <div class="points-info">
            <span class="points-label">보유 포인트</span>
            <span class="points-value">{{ formatNumber(userCoins) }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <main class="main-content">
      <header class="content-header">
        <div class="header-title">
          <h1>{{ currentCategoryName }}</h1>
          <span class="item-count">{{ filteredItems.length }}개 아이템</span>
        </div>
        <div class="header-actions">
          <div class="filter-pills">
            <button
              v-for="filter in filters"
              :key="filter.id"
              class="pill"
              :class="{ active: currentFilter === filter.id }"
              @click="setFilter(filter.id)"
            >
              {{ filter.name }}
            </button>
          </div>
        </div>
      </header>

      <!-- 로딩 -->
      <div v-if="loading" class="loading-container">
        <div class="loader"></div>
        <p>로딩 중...</p>
      </div>

      <!-- 아이템 그리드 -->
      <div v-else-if="filteredItems.length > 0" class="items-container">
        <div
          v-for="item in filteredItems"
          :key="item.itemId || item.id"
          class="item-card"
          :class="{ owned: item.owned, equipped: item.equipped }"
        >
          <div class="item-image">
            <img :src="item.image" :alt="item.name" @error="handleImageError" />
            <div v-if="item.isNew" class="tag new">NEW</div>
            <div v-if="item.equipped" class="tag equipped">장착중</div>
          </div>

          <div class="item-details">
            <div class="item-top">
              <span class="rarity-badge" :class="getRarityClass(item.rarity)">
                {{ item.rarity }}
              </span>
              <h3>{{ item.name }}</h3>
            </div>
            <p class="description">{{ item.description }}</p>
          </div>

          <div class="item-actions">
            <template v-if="!item.owned">
              <div class="price-tag">
                <i class="fas fa-coins"></i>
                {{ formatNumber(item.price) }}
              </div>
              <button
                class="action-btn buy"
                :disabled="!canAfford(item) || loading"
                @click="buyItem(item)"
              >
                <i class="fas fa-shopping-cart"></i>
                구매하기
              </button>
            </template>
            <template v-else>
              <div class="owned-label">
                <i class="fas fa-check-circle"></i>
                보유중
              </div>
              <button
                v-if="isEquippableCategory"
                class="action-btn equip"
                :class="{ active: item.equipped }"
                :disabled="loading"
                @click="equipItem(item)"
              >
                <i :class="item.equipped ? 'fas fa-check' : 'fas fa-hand-pointer'"></i>
                {{ item.equipped ? '장착중' : '장착하기' }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-else class="empty-container">
        <div class="empty-icon">
          <i class="fas fa-store-slash"></i>
        </div>
        <p>아이템이 없습니다</p>
      </div>
    </main>

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
  name: 'ShopDesignB',
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
    currentCategoryName() {
      const cat = this.categories.find(c => c.id === this.currentCategory)
      return cat?.name || '상점'
    },
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
.shop-design-b {
  display: flex;
  min-height: 100vh;
  padding-top: 70px;
  background: var(--color-background);
}

/* Sidebar */
.sidebar {
  width: 280px;
  min-height: calc(100vh - 70px);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 70px;
  height: calc(100vh - 70px);
}

.sidebar-header {
  padding: var(--spacing-xl) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-header h2 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  color: var(--color-text-primary);
  margin: 0;
}

.category-list {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
}

.category-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
  margin-bottom: var(--spacing-xs);
}

.category-item i:first-child {
  width: 20px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 1rem;
}

.category-name {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.category-item .arrow {
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.category-item:hover:not(.disabled) {
  background: var(--color-surface-hover);
}

.category-item:hover:not(.disabled) .arrow {
  opacity: 1;
}

.category-item.active {
  background: var(--color-primary);
}

.category-item.active i:first-child,
.category-item.active .category-name,
.category-item.active .arrow {
  color: white;
}

.category-item.active .arrow {
  opacity: 1;
}

.category-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.soon-badge {
  font-size: 0.65rem;
  background: var(--color-border);
  color: var(--color-text-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
}

.sidebar-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.points-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-accent) 0%, #ff9a76 100%);
  border-radius: var(--radius-lg);
}

.points-icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.points-icon i {
  color: white;
  font-size: 1.25rem;
}

.points-info {
  display: flex;
  flex-direction: column;
}

.points-label {
  font-size: var(--font-size-tiny);
  color: rgba(255,255,255,0.8);
}

.points-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: white;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-title h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  color: var(--color-text-primary);
  margin: 0;
}

.item-count {
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
}

.filter-pills {
  display: flex;
  gap: var(--spacing-xs);
}

.pill {
  padding: var(--spacing-xs) var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pill:hover {
  border-color: var(--color-primary);
}

.pill.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-container p {
  margin-top: var(--spacing-md);
  color: var(--color-text-secondary);
}

/* Items Container */
.items-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
}

.item-card.equipped {
  border-color: var(--color-success);
  box-shadow: 0 0 0 1px var(--color-success);
}

.item-image {
  position: relative;
  height: 180px;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image img {
  max-width: 70%;
  max-height: 70%;
  object-fit: contain;
}

.tag {
  position: absolute;
  top: var(--spacing-sm);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
}

.tag.new {
  left: var(--spacing-sm);
  background: var(--color-error);
  color: white;
}

.tag.equipped {
  right: var(--spacing-sm);
  background: var(--color-success);
  color: white;
}

.item-details {
  padding: var(--spacing-md);
}

.item-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.rarity-badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.rarity-badge.common { background: var(--color-border); color: var(--color-text-secondary); }
.rarity-badge.rare { background: var(--color-primary); color: white; }
.rarity-badge.epic { background: #8b5cf6; color: white; }
.rarity-badge.legendary { background: var(--color-accent); color: white; }

.item-details h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.description {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
}

.price-tag {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  color: var(--color-text-primary);
}

.price-tag i {
  color: var(--color-accent);
}

.owned-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-small);
  color: var(--color-success);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn.buy {
  background: var(--color-primary);
  color: white;
}

.action-btn.buy:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.action-btn.buy:disabled {
  background: var(--color-border);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.action-btn.equip {
  background: var(--color-success);
  color: white;
}

.action-btn.equip.active {
  background: var(--color-text-tertiary);
}

/* Empty */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-tertiary);
}

.empty-icon i {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .shop-design-b {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: relative;
    top: 0;
    height: auto;
    min-height: auto;
  }

  .category-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
  }

  .category-item {
    flex: 0 0 auto;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
  }

  .category-item .arrow {
    display: none;
  }

  .sidebar-footer {
    display: none;
  }

  .items-container {
    grid-template-columns: 1fr;
  }
}
</style>

