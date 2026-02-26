<template>
  <div class="shop-page">
    <NavigationBar
      :is-logged-in="!!navUserInfo.name"
      :user-info="navUserInfo"
    />
    
    <div class="shop-layout">
      <!-- 페이지 헤더 -->
      <div class="shop-header">
        <div class="header-left">
          <h1 class="shop-title">상점</h1>
          <p class="shop-subtitle">포인트로 특별한 아이템을 획득하세요</p>
        </div>
        <div class="header-right">
          <div class="points-display">
            <i class="fas fa-coins points-icon"></i>
            <div class="points-text">
              <span class="points-label">보유 포인트</span>
              <span class="points-value">{{ formatNumber(userCoins) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 카테고리 탭 + 필터 -->
      <div class="shop-toolbar">
        <nav class="category-tabs">
          <button
            v-for="category in categories"
            :key="category.id"
            class="tab-btn"
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

        <div class="filter-group">
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

      <!-- 메인 콘텐츠 -->
      <main class="shop-content">
        <!-- 로딩 -->
        <div v-if="loading" class="state-container">
          <div class="loading-spinner"></div>
          <p class="state-text">아이템을 불러오는 중...</p>
        </div>

        <!-- 아이템 그리드 -->
        <div v-else-if="filteredItems.length > 0" class="items-grid">
          <div
            v-for="(item, index) in filteredItems"
            :key="item.itemId || item.id"
            class="item-card"
            :class="{ owned: item.owned, equipped: item.equipped }"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <!-- 이미지 영역 -->
            <div class="card-image">
              <img :src="item.image" :alt="item.name" @error="handleImageError" />
              <span v-if="item.isNew" class="card-badge new">NEW</span>
              <span v-if="item.equipped" class="card-badge equipped-badge">장착중</span>
              <div v-if="item.owned && !item.equipped" class="owned-overlay">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>

            <!-- 정보 영역 -->
            <div class="card-body">
              <div class="card-meta">
                <span class="rarity-chip" :class="getRarityClass(item.rarity)">
                  {{ item.rarity }}
                </span>
              </div>
              <h3 class="card-name">{{ item.name }}</h3>
              <p class="card-desc">{{ item.description }}</p>
            </div>

            <!-- 액션 영역 -->
            <div class="card-footer">
              <template v-if="!item.owned">
                <div class="price-display">
                  <i class="fas fa-coins"></i>
                  <span>{{ formatNumber(item.price) }}</span>
                </div>
                <button
                  class="action-btn buy-btn"
                  :class="{ 'cant-afford': !canAfford(item) }"
                  :disabled="!canAfford(item) || loading"
                  @click="buyItem(item)"
                >
                  <i class="fas fa-shopping-cart"></i>
                  {{ canAfford(item) ? '구매하기' : '포인트 부족' }}
                </button>
              </template>
              <template v-else>
                <div class="owned-label">
                  <i class="fas fa-check-circle"></i>
                  <span>보유중</span>
                </div>
                <button
                  v-if="isEquippableCategory"
                  class="action-btn equip-btn"
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
        <div v-else class="state-container">
          <div class="empty-icon">
            <i class="fas fa-box-open"></i>
          </div>
          <p class="state-title">아이템이 없습니다</p>
          <p class="state-text">
            {{ currentFilter === 'notOwned' ? '모든 아이템을 보유하고 있습니다!' : '현재 카테고리에 아이템이 없습니다.' }}
          </p>
        </div>
      </main>
    </div>

    <!-- 구매 확인 모달 -->
    <PurchaseModal
      v-if="showPurchaseModal"
      :item="selectedItem"
      :userCoins="userCoins"
      @confirm="confirmPurchase"
      @cancel="cancelPurchase"
    />

    <!-- 구매 완료 모달 -->
    <PurchaseCompleteModal
      v-if="showCompleteModal"
      :item="completedItem"
      :remainingCoins="userCoins"
      :canEquip="isEquippableCategory && completedItem && !completedItem.equipped"
      @close="closeCompleteModal"
      @equip="equipFromCompleteModal"
    />
  </div>
</template>

<script>
import PurchaseModal from '@/features/shop/components/PurchaseModal.vue'
import PurchaseCompleteModal from '@/features/shop/components/PurchaseCompleteModal.vue'
import NavigationBar from '@/core/components/NavigationBar.vue'
import { shopService } from '@/features/shop/services/shop.service.js'
import { userService } from '@/features/user/services/user.service.js'
import { mainService } from '@/features/main/services/main.service.js'

export default {
  name: 'ShopView',
  components: { 
    PurchaseModal,
    PurchaseCompleteModal,
    NavigationBar
  },

  data() {
    return {
      userCoins: 0,
      navUserInfo: {},
      currentCategory: 'markers',
      currentFilter: 'all',
      showPurchaseModal: false,
      showCompleteModal: false,
      selectedItem: null,
      completedItem: null,
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
      // 병렬 로드: 코인+내비바 정보, 아이템
      await Promise.all([
        this.loadUserCoins(),
        this.loadNavUserInfo()
      ])
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

    // NavigationBar 프로필 정보를 mainService를 통해 로드
    // (MainView, NoticeListView와 동일한 방식 - equippedMarkerImageUrl 포함)
    async loadNavUserInfo() {
      try {
        const response = await mainService.getMainPageData()
        if (response.isSuccess && response.result?.myInfo) {
          const myInfo = response.result.myInfo
          this.navUserInfo = {
            name: myInfo.nickname || '',
            email: myInfo.email || '',
            avatar: myInfo.equippedMarkerImageUrl || null,
            isAdmin: myInfo.isAdmin || false
          }
        }
      } catch (error) {
        console.error('내비바 사용자 정보 로드 실패:', error)
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
      if (!num && num !== 0) return '0'
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
          // alert() 대신 완료 모달 표시
          this.completedItem = { ...this.selectedItem, memberItemId: response.result?.memberItemId }
          this.showCompleteModal = true
        }
      } catch (error) {
        console.error('구매 실패:', error)
        // 에러는 추후 토스트로 대체 가능; 우선 콘솔 처리
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

    closeCompleteModal() {
      this.showCompleteModal = false
      this.completedItem = null
    },

    async equipFromCompleteModal() {
      if (!this.completedItem) return
      this.showCompleteModal = false
      await this.equipItem(this.completedItem)
      this.completedItem = null
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
        }
      } catch (error) {
        console.error('장착 실패:', error)
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
/* ===== 페이지 기반 ===== */
.shop-page {
  min-height: 100vh;
  background: var(--color-background);
}

.shop-layout {
  padding-top: 70px;
  max-width: 1280px;
  margin: 0 auto;
  padding-left: var(--spacing-xl);
  padding-right: var(--spacing-xl);
}

/* ===== 페이지 헤더 ===== */
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: var(--spacing-xl) 0 var(--spacing-lg);
  gap: var(--spacing-md);
}

.shop-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.shop-subtitle {
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
  margin: 0;
}

/* 포인트 디스플레이 */
.points-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  transition: box-shadow var(--transition-fast);
}

.points-display:hover {
  box-shadow: var(--shadow-md);
}

.points-icon {
  font-size: 1.25rem;
  color: var(--color-accent);
}

.points-text {
  display: flex;
  flex-direction: column;
}

.points-label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
}

.points-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

/* ===== 툴바 (탭 + 필터) ===== */
.shop-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

/* 카테고리 탭 */
.category-tabs {
  display: flex;
  gap: var(--spacing-xs);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  font-size: var(--font-size-small);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: 0;
}

.tab-btn i {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  transition: color var(--transition-fast);
}

.tab-btn:hover:not(.disabled) {
  color: var(--color-text-primary);
}

.tab-btn:hover:not(.disabled) i {
  color: var(--color-primary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.tab-btn.active i {
  color: var(--color-primary);
}

.tab-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.soon-tag {
  font-size: 0.6rem;
  background: var(--color-border);
  color: var(--color-text-tertiary);
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

/* 필터 버튼 */
.filter-group {
  display: flex;
  gap: var(--spacing-xs);
  padding-bottom: var(--spacing-sm);
}

.filter-btn {
  padding: 4px var(--spacing-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-tiny);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

/* ===== 상태 (로딩/빈 상태) ===== */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  text-align: center;
  gap: var(--spacing-sm);
}

.loading-spinner {
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

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-sm);
}

.empty-icon i {
  font-size: 1.75rem;
  color: var(--color-text-tertiary);
}

.state-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.state-text {
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
  margin: 0;
}

/* ===== 아이템 그리드 ===== */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-2xl);
}

/* ===== 아이템 카드 ===== */
.item-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow var(--transition-normal), border-color var(--transition-normal);
  animation: cardIn 0.35s ease both;
}

.item-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
}

.item-card.equipped {
  border-color: var(--color-success);
  box-shadow: 0 0 0 1px var(--color-success);
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 카드 이미지 */
.card-image {
  position: relative;
  height: 160px;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-image img {
  max-width: 65%;
  max-height: 65%;
  object-fit: contain;
  transition: transform var(--transition-normal);
}

.item-card:hover .card-image img {
  transform: scale(1.06);
}

.card-badge {
  position: absolute;
  top: var(--spacing-sm);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.card-badge.new {
  left: var(--spacing-sm);
  background: var(--color-error);
  color: white;
}

.card-badge.equipped-badge {
  right: var(--spacing-sm);
  background: var(--color-success);
  color: white;
}

.owned-overlay {
  position: absolute;
  inset: 0;
  background: rgba(16, 185, 129, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.owned-overlay i {
  font-size: 2rem;
  color: var(--color-success);
}

.item-card.owned:hover .owned-overlay {
  opacity: 1;
}

/* 카드 본문 */
.card-body {
  flex: 1;
  padding: var(--spacing-md);
}

.card-meta {
  margin-bottom: var(--spacing-xs);
}

.rarity-chip {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rarity-chip.common {
  background: var(--color-border);
  color: var(--color-text-secondary);
}

.rarity-chip.rare {
  background: var(--color-primary);
  color: white;
}

.rarity-chip.epic {
  background: #8b5cf6;
  color: white;
}

.rarity-chip.legendary {
  background: var(--color-accent);
  color: white;
}

.card-name {
  font-family: var(--font-heading);
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.card-desc {
  font-size: var(--font-size-tiny);
  color: var(--color-text-tertiary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: var(--line-height-normal);
}

/* 카드 푸터 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
  gap: var(--spacing-sm);
}

/* 가격 */
.price-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-small);
  font-weight: 700;
  color: var(--color-text-primary);
}

.price-display i {
  color: var(--color-accent);
  font-size: 0.875rem;
}

/* 보유중 라벨 */
.owned-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-tiny);
  font-weight: 600;
  color: var(--color-success);
}

/* 액션 버튼 */
.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-tiny);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.buy-btn {
  background: var(--color-primary);
  color: white;
}

.buy-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.buy-btn.cant-afford {
  background: var(--color-border);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.buy-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.equip-btn {
  background: var(--color-success);
  color: white;
}

.equip-btn:hover:not(:disabled) {
  filter: brightness(0.9);
}

.equip-btn.active {
  background: var(--color-text-tertiary);
}

.equip-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== 반응형 ===== */
@media (max-width: 768px) {
  .shop-layout {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }

  .shop-header {
    flex-direction: column;
    align-items: flex-start;
    padding-top: var(--spacing-lg);
    gap: var(--spacing-md);
  }

  .shop-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .filter-group {
    padding-bottom: var(--spacing-sm);
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .items-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  }

  .card-image {
    height: 120px;
  }
}
</style>
