<template>
  <div class="shop-design-c">
    <!-- 상단 툴바 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1>상점</h1>
        <div class="category-dropdown">
          <select v-model="currentCategory" @change="handleCategoryChange">
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
              :disabled="category.disabled"
            >
              {{ category.name }}{{ category.disabled ? ' (준비중)' : '' }}
            </option>
          </select>
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="filter-toggle">
          <button
            v-for="filter in filters"
            :key="filter.id"
            class="toggle-btn"
            :class="{ active: currentFilter === filter.id }"
            @click="setFilter(filter.id)"
          >
            {{ filter.name }}
          </button>
        </div>
        <div class="points-badge">
          <i class="fas fa-coins"></i>
          <span>{{ formatNumber(userCoins) }}</span>
        </div>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-wrap">
      <div class="loading-bar"></div>
    </div>

    <!-- 아이템 리스트 -->
    <div v-else class="items-list">
      <div
        v-for="item in filteredItems"
        :key="item.itemId || item.id"
        class="list-item"
        :class="{ owned: item.owned, equipped: item.equipped }"
      >
        <!-- 이미지 -->
        <div class="item-thumb">
          <img :src="item.image" :alt="item.name" @error="handleImageError" />
          <span v-if="item.isNew" class="new-dot"></span>
        </div>

        <!-- 정보 -->
        <div class="item-info">
          <div class="info-top">
            <span class="rarity-tag" :class="getRarityClass(item.rarity)">
              {{ item.rarity }}
            </span>
            <h3>{{ item.name }}</h3>
            <span v-if="item.equipped" class="equipped-label">
              <i class="fas fa-check"></i> 장착중
            </span>
          </div>
          <p class="desc">{{ item.description }}</p>
        </div>

        <!-- 액션 -->
        <div class="item-action">
          <template v-if="!item.owned">
            <div class="price">
              <i class="fas fa-coins"></i>
              {{ formatNumber(item.price) }}
            </div>
            <button
              class="btn primary"
              :disabled="!canAfford(item) || loading"
              @click="buyItem(item)"
            >
              구매
            </button>
          </template>
          <template v-else>
            <div class="owned-tag">보유</div>
            <button
              v-if="isEquippableCategory"
              class="btn secondary"
              :class="{ active: item.equipped }"
              :disabled="loading"
              @click="equipItem(item)"
            >
              {{ item.equipped ? '장착중' : '장착' }}
            </button>
          </template>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="!loading && filteredItems.length === 0" class="empty-list">
        <i class="fas fa-inbox"></i>
        <p>표시할 아이템이 없습니다</p>
      </div>
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
  name: 'ShopDesignC',
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

    handleCategoryChange() {
      this.currentFilter = 'all'
      this.loadItems()
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
.shop-design-c {
  min-height: 100vh;
  background: var(--color-background);
  padding-top: 70px;
}

/* Toolbar */
.toolbar {
  position: sticky;
  top: 70px;
  z-index: 100;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.toolbar-left h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  color: var(--color-text-primary);
  margin: 0;
}

.category-dropdown {
  position: relative;
}

.category-dropdown select {
  appearance: none;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-xl) var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  cursor: pointer;
  min-width: 140px;
}

.category-dropdown select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.category-dropdown i {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
  font-size: 0.75rem;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.filter-toggle {
  display: flex;
  background: var(--color-background);
  border-radius: var(--radius-md);
  padding: 2px;
  border: 1px solid var(--color-border);
}

.toggle-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
}

.points-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, var(--color-accent) 0%, #ff9a76 100%);
  border-radius: var(--radius-full);
  color: white;
  font-weight: 600;
  font-size: var(--font-size-small);
}

.points-badge i {
  font-size: 1rem;
}

/* Loading */
.loading-wrap {
  height: 3px;
  background: var(--color-border);
  overflow: hidden;
}

.loading-bar {
  height: 100%;
  width: 30%;
  background: var(--color-primary);
  animation: loading 1s ease-in-out infinite;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* Items List */
.items-list {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.list-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-md);
  transition: all var(--transition-normal);
}

.list-item:hover {
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-md);
}

.list-item.equipped {
  border-color: var(--color-success);
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, var(--color-surface) 100%);
}

.item-thumb {
  position: relative;
  width: 72px;
  height: 72px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-thumb img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

.new-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: var(--color-error);
  border-radius: 50%;
  border: 2px solid var(--color-surface);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.info-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.rarity-tag {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.rarity-tag.common { background: var(--color-border); color: var(--color-text-secondary); }
.rarity-tag.rare { background: var(--color-primary); color: white; }
.rarity-tag.epic { background: #8b5cf6; color: white; }
.rarity-tag.legendary { background: var(--color-accent); color: white; }

.item-info h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.equipped-label {
  font-size: 0.7rem;
  color: var(--color-success);
  display: flex;
  align-items: center;
  gap: 4px;
}

.desc {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-action {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.price {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: var(--font-size-body);
}

.price i {
  color: var(--color-accent);
}

.owned-tag {
  font-size: var(--font-size-small);
  color: var(--color-success);
  font-weight: 500;
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn.primary {
  background: var(--color-primary);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn.primary:disabled {
  background: var(--color-border);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.btn.secondary {
  background: var(--color-success);
  color: white;
}

.btn.secondary.active {
  background: var(--color-text-tertiary);
}

/* Empty */
.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-tertiary);
}

.empty-list i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-list p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .toolbar {
    padding: var(--spacing-md);
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: space-between;
  }

  .list-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .item-thumb {
    width: 100%;
    height: 120px;
  }

  .item-action {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

