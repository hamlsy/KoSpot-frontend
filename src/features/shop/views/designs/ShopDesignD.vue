<template>
  <div class="shop-design-d">
    <!-- 헤더 -->
    <header class="gallery-header">
      <div class="header-inner">
        <div class="title-section">
          <h1>상점</h1>
          <div class="points-chip">
            <i class="fas fa-coins"></i>
            <span class="amount">{{ formatNumber(userCoins) }}</span>
          </div>
        </div>

        <!-- 카테고리 탭 -->
        <nav class="category-tabs">
          <button
            v-for="category in categories"
            :key="category.id"
            class="tab"
            :class="{ 
              active: currentCategory === category.id,
              disabled: category.disabled 
            }"
            @click="!category.disabled && setCategory(category.id)"
          >
            <i :class="category.icon"></i>
            <span>{{ category.name }}</span>
            <span v-if="category.disabled" class="soon">준비중</span>
          </button>
        </nav>

        <!-- 필터 -->
        <div class="filter-row">
          <button
            v-for="filter in filters"
            :key="filter.id"
            class="filter-btn"
            :class="{ active: currentFilter === filter.id }"
            @click="setFilter(filter.id)"
          >
            {{ filter.name }}
          </button>
        </div>
      </div>
    </header>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="pulse-loader"></div>
    </div>

    <!-- 갤러리 그리드 -->
    <div v-else-if="filteredItems.length > 0" class="gallery-grid">
      <article
        v-for="item in filteredItems"
        :key="item.itemId || item.id"
        class="gallery-card"
        :class="{ owned: item.owned, equipped: item.equipped }"
        @click="openDetail(item)"
      >
        <!-- 이미지 영역 -->
        <div class="card-visual">
          <img :src="item.image" :alt="item.name" @error="handleImageError" />
          
          <!-- 오버레이 -->
          <div class="card-overlay">
            <div class="overlay-content">
              <span class="rarity" :class="getRarityClass(item.rarity)">
                {{ item.rarity }}
              </span>
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>

          <!-- 뱃지 -->
          <div v-if="item.isNew" class="visual-badge new">NEW</div>
          <div v-if="item.equipped" class="visual-badge equipped">
            <i class="fas fa-check"></i>
          </div>
        </div>

        <!-- 하단 정보 -->
        <div class="card-bottom">
          <div class="bottom-left">
            <h4>{{ item.name }}</h4>
            <span v-if="item.owned" class="status owned">보유중</span>
          </div>
          <div class="bottom-right">
            <template v-if="!item.owned">
              <span class="price">
                <i class="fas fa-coins"></i>
                {{ formatNumber(item.price) }}
              </span>
            </template>
            <template v-else-if="isEquippableCategory">
              <span class="equipped-status" :class="{ active: item.equipped }">
                {{ item.equipped ? '장착중' : '미장착' }}
              </span>
            </template>
          </div>
        </div>
      </article>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-gallery">
      <div class="empty-visual">
        <i class="fas fa-image"></i>
      </div>
      <p>표시할 아이템이 없습니다</p>
    </div>

    <!-- 디테일 모달 -->
    <transition name="modal">
      <div v-if="showDetail" class="detail-modal" @click.self="closeDetail">
        <div class="detail-content">
          <button class="close-btn" @click="closeDetail">
            <i class="fas fa-times"></i>
          </button>

          <div class="detail-image">
            <img :src="detailItem.image" :alt="detailItem.name" />
          </div>

          <div class="detail-info">
            <span class="detail-rarity" :class="getRarityClass(detailItem.rarity)">
              {{ detailItem.rarity }}
            </span>
            <h2>{{ detailItem.name }}</h2>
            <p>{{ detailItem.description }}</p>

            <div class="detail-actions">
              <template v-if="!detailItem.owned">
                <div class="detail-price">
                  <i class="fas fa-coins"></i>
                  <span>{{ formatNumber(detailItem.price) }}</span>
                </div>
                <button
                  class="action-btn buy"
                  :disabled="!canAfford(detailItem) || loading"
                  @click="buyItem(detailItem)"
                >
                  <i class="fas fa-shopping-cart"></i>
                  구매하기
                </button>
              </template>
              <template v-else>
                <div class="owned-mark">
                  <i class="fas fa-check-circle"></i>
                  보유중
                </div>
                <button
                  v-if="isEquippableCategory"
                  class="action-btn equip"
                  :class="{ active: detailItem.equipped }"
                  :disabled="loading"
                  @click="equipItem(detailItem)"
                >
                  <i :class="detailItem.equipped ? 'fas fa-check' : 'fas fa-hand-pointer'"></i>
                  {{ detailItem.equipped ? '장착중' : '장착하기' }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </transition>

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
  name: 'ShopDesignD',
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
      ],
      showDetail: false,
      detailItem: null
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

    openDetail(item) {
      this.detailItem = item
      this.showDetail = true
      document.body.style.overflow = 'hidden'
    },

    closeDetail() {
      this.showDetail = false
      this.detailItem = null
      document.body.style.overflow = ''
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
          if (this.detailItem?.itemId === this.selectedItem.itemId) {
            this.detailItem.owned = true
            this.detailItem.memberItemId = response.result?.memberItemId
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
          if (this.detailItem) this.detailItem.equipped = true
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
.shop-design-d {
  min-height: 100vh;
  background: var(--color-background);
  padding-top: 70px;
}

/* Header */
.gallery-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 70px;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.title-section h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h1);
  color: var(--color-text-primary);
  margin: 0;
}

.points-chip {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: linear-gradient(135deg, var(--color-accent) 0%, #ff9a76 100%);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-full);
  color: white;
}

.points-chip i {
  font-size: 1rem;
}

.points-chip .amount {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: var(--font-size-body);
}

.category-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  overflow-x: auto;
  padding-bottom: var(--spacing-xs);
}

.tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-normal);
  white-space: nowrap;
}

.tab:hover:not(.disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.tab.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab .soon {
  font-size: 0.6rem;
  background: rgba(0,0,0,0.2);
  padding: 2px 4px;
  border-radius: 4px;
}

.filter-row {
  display: flex;
  gap: var(--spacing-xs);
}

.filter-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  color: var(--color-text-secondary);
}

.filter-btn.active {
  background: var(--color-text-primary);
  border-color: var(--color-text-primary);
  color: white;
}

/* Loading */
.loading-overlay {
  display: flex;
  justify-content: center;
  padding: var(--spacing-2xl);
}

.pulse-loader {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-primary);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1); opacity: 1; }
}

/* Gallery Grid */
.gallery-grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.gallery-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.gallery-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
}

.gallery-card.equipped {
  border-color: var(--color-success);
}

.card-visual {
  position: relative;
  aspect-ratio: 4/3;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-surface-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-visual img {
  max-width: 60%;
  max-height: 60%;
  object-fit: contain;
  transition: transform var(--transition-slow);
}

.gallery-card:hover .card-visual img {
  transform: scale(1.1);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);
  opacity: 0;
  transition: opacity var(--transition-normal);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--spacing-lg);
}

.gallery-card:hover .card-overlay {
  opacity: 1;
}

.overlay-content {
  color: white;
}

.overlay-content .rarity {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: var(--spacing-xs);
}

.rarity.common { background: rgba(255,255,255,0.3); }
.rarity.rare { background: var(--color-primary); }
.rarity.epic { background: #8b5cf6; }
.rarity.legendary { background: var(--color-accent); }

.overlay-content h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  margin: 0 0 var(--spacing-xs);
}

.overlay-content p {
  font-size: var(--font-size-small);
  opacity: 0.9;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.visual-badge {
  position: absolute;
  top: var(--spacing-md);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 700;
}

.visual-badge.new {
  left: var(--spacing-md);
  background: var(--color-error);
  color: white;
}

.visual-badge.equipped {
  right: var(--spacing-md);
  background: var(--color-success);
  color: white;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-surface);
}

.bottom-left h4 {
  font-family: var(--font-heading);
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.status.owned {
  font-size: var(--font-size-tiny);
  color: var(--color-success);
}

.price {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 700;
  color: var(--color-text-primary);
}

.price i {
  color: var(--color-accent);
}

.equipped-status {
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
}

.equipped-status.active {
  color: var(--color-success);
}

/* Empty */
.empty-gallery {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-tertiary);
}

.empty-visual i {
  font-size: 4rem;
  opacity: 0.3;
  margin-bottom: var(--spacing-md);
}

/* Detail Modal */
.detail-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.detail-content {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-background);
  border: none;
  color: var(--color-text-secondary);
  font-size: 1rem;
  cursor: pointer;
  z-index: 10;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.detail-image {
  aspect-ratio: 4/3;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image img {
  max-width: 60%;
  max-height: 60%;
  object-fit: contain;
}

.detail-info {
  padding: var(--spacing-xl);
}

.detail-rarity {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: var(--spacing-sm);
}

.detail-info h2 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h2);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm);
}

.detail-info p {
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0 0 var(--spacing-xl);
}

.detail-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.detail-price {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
}

.detail-price i {
  color: var(--color-accent);
}

.owned-mark {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-success);
  font-weight: 600;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-body);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.action-btn.buy {
  background: var(--color-primary);
  color: white;
}

.action-btn.buy:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
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

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .detail-content,
.modal-leave-active .detail-content {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .detail-content,
.modal-leave-to .detail-content {
  transform: scale(0.95);
}

/* Responsive */
@media (max-width: 900px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .category-tabs {
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }

  .detail-actions {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

