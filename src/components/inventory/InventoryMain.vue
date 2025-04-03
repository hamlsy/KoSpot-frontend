<template>
  <div class="inventory-main">
    <div class="inventory-header">
      <h1 class="inventory-title">내 인벤토리</h1>
      <div class="inventory-stats">
        <div class="stat-item">
          <i class="fas fa-box-open"></i>
          <span>총 {{ totalItems }}개 아이템</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-star"></i>
          <span>{{ totalRareItems }}개 레어 아이템</span>
        </div>
      </div>
    </div>
    
    <div class="inventory-nav">
      <div 
        v-for="category in categories" 
        :key="category.id"
        class="nav-item"
        :class="{ active: currentCategory === category.id }"
        @click="setCategory(category.id)"
      >
        <i :class="category.icon"></i>
        <span>{{ category.name }}</span>
        <div class="item-count">{{ getCategoryItemCount(category.id) }}</div>
      </div>
    </div>
    
    <div class="inventory-content">
      <div class="category-header">
        <h2>{{ currentCategoryName }}</h2>
        <div class="search-controls">
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="아이템 검색..." 
              @input="filterItems"
            >
            <button 
              v-if="searchQuery" 
              class="clear-search" 
              @click="clearSearch"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="sort-dropdown">
            <select v-model="sortOption" @change="sortItems">
              <option value="name">이름순</option>
              <option value="rarity">희귀도순</option>
              <option value="recent">최근 획득순</option>
            </select>
          </div>
        </div>
      </div>
      
      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-box-open"></i>
        </div>
        <h3>아이템이 없습니다</h3>
        <p>{{ searchQuery ? '검색 결과가 없습니다.' : '이 카테고리에 아이템이 없습니다.' }}</p>
        <button class="shop-button" @click="goToShop">상점으로 이동</button>
      </div>
      
      <div v-else class="items-grid">
        <div 
          v-for="item in filteredItems" 
          :key="item.id"
          class="inventory-item"
          :class="{ 'active': item.id === selectedItem?.id }"
          @click="selectItem(item)"
        >
          <div class="item-image-container">
            <img :src="item.image" :alt="item.name" class="item-image" />
            <div class="item-rarity" :class="item.rarity.toLowerCase()">{{ item.rarity }}</div>
            <div class="equipped-badge" v-if="item.equipped">장착중</div>
          </div>
          
          <div class="item-details">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-category">{{ item.categoryName }}</div>
          </div>
        </div>
      </div>
      
      <div class="item-details-panel" v-if="selectedItem">
        <div class="details-header">
          <h3>아이템 정보</h3>
          <button class="close-details" @click="closeDetails">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="details-content">
          <div class="selected-item-image">
            <img :src="selectedItem.image" :alt="selectedItem.name" />
            <div class="item-rarity" :class="selectedItem.rarity.toLowerCase()">
              {{ selectedItem.rarity }}
            </div>
          </div>
          
          <div class="selected-item-info">
            <h4>{{ selectedItem.name }}</h4>
            <p class="item-description">{{ selectedItem.description }}</p>
            
            <div class="item-stats">
              <div class="stat-row">
                <span class="stat-label">카테고리:</span>
                <span class="stat-value">{{ selectedItem.categoryName }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">획득일:</span>
                <span class="stat-value">{{ formatDate(selectedItem.acquiredDate) }}</span>
              </div>
              <div class="stat-row" v-if="selectedItem.expiryDate">
                <span class="stat-label">만료일:</span>
                <span class="stat-value">{{ formatDate(selectedItem.expiryDate) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="details-actions">
          <button 
            class="action-button equip-button" 
            v-if="!selectedItem.equipped"
            @click="equipItem(selectedItem)"
          >
            <i class="fas fa-check"></i>
            장착하기
          </button>
          <button 
            class="action-button unequip-button" 
            v-else
            @click="unequipItem(selectedItem)"
          >
            <i class="fas fa-times"></i>
            장착 해제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InventoryMain',
  
  data() {
    return {
      currentCategory: 'all',
      searchQuery: '',
      sortOption: 'recent',
      selectedItem: null,
      categories: [
        { id: 'all', name: '전체', icon: 'fas fa-th' },
        { id: 'avatars', name: '아바타', icon: 'fas fa-user' },
        { id: 'badges', name: '배지', icon: 'fas fa-certificate' },
        { id: 'items', name: '아이템', icon: 'fas fa-gift' },
        { id: 'boosters', name: '부스터', icon: 'fas fa-rocket' }
      ],
      inventoryItems: [
        {
          id: 'av1',
          name: '탐험가 아바타',
          description: '한국의 명소를 탐험하는 모험가 아바타',
          categoryId: 'avatars',
          categoryName: '아바타',
          rarity: '일반',
          image: '/assets/avatars/explorer.png',
          acquiredDate: new Date(2023, 3, 15),
          expiryDate: null,
          equipped: false
        },
        {
          id: 'av2',
          name: '한복 아바타',
          description: '전통 한복을 입은 우아한 아바타',
          categoryId: 'avatars',
          categoryName: '아바타',
          rarity: '레어',
          image: '/assets/avatars/hanbok.png',
          acquiredDate: new Date(2023, 5, 20),
          expiryDate: null,
          equipped: true
        },
        {
          id: 'b1',
          name: '서울 마스터',
          description: '서울 지역 마스터',
          categoryId: 'badges',
          categoryName: '배지',
          rarity: '레어',
          image: '/assets/badges/seoul.png',
          acquiredDate: new Date(2023, 6, 10),
          expiryDate: null,
          equipped: true
        },
        {
          id: 'i1',
          name: '힌트 카드',
          description: '게임 중 힌트를 얻을 수 있는 아이템',
          categoryId: 'items',
          categoryName: '아이템',
          rarity: '일반',
          image: '/assets/items/hint.png',
          acquiredDate: new Date(2023, 7, 5),
          expiryDate: null,
          equipped: false,
          quantity: 3
        },
        {
          id: 'bo1',
          name: '점수 부스터',
          description: '1시간 동안 획득하는 점수가 2배로 증가',
          categoryId: 'boosters',
          categoryName: '부스터',
          rarity: '레어',
          image: '/assets/boosters/score.png',
          acquiredDate: new Date(2023, 8, 1),
          expiryDate: new Date(2023, 8, 2),
          equipped: false
        }
      ],
      filteredItems: []
    };
  },
  
  computed: {
    currentCategoryName() {
      if (this.currentCategory === 'all') return '전체 아이템';
      const category = this.categories.find(cat => cat.id === this.currentCategory);
      return category ? category.name : '';
    },
    
    totalItems() {
      return this.inventoryItems.length;
    },
    
    totalRareItems() {
      return this.inventoryItems.filter(item => item.rarity !== '일반').length;
    }
  },
  
  mounted() {
    this.filterItems();
  },
  
  methods: {
    setCategory(categoryId) {
      this.currentCategory = categoryId;
      this.filterItems();
      this.selectedItem = null;
    },
    
    getCategoryItemCount(categoryId) {
      if (categoryId === 'all') return this.totalItems;
      return this.inventoryItems.filter(item => item.categoryId === categoryId).length;
    },
    
    filterItems() {
      let items = [...this.inventoryItems];
      
      // 카테고리 필터링
      if (this.currentCategory !== 'all') {
        items = items.filter(item => item.categoryId === this.currentCategory);
      }
      
      // 검색어 필터링
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(query) || 
          item.description.toLowerCase().includes(query)
        );
      }
      
      // 정렬
      this.sortItemsList(items);
      
      this.filteredItems = items;
    },
    
    sortItems() {
      this.sortItemsList(this.filteredItems);
    },
    
    sortItemsList(items) {
      switch (this.sortOption) {
        case 'name':
          items.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'rarity':
          const rarityOrder = { '에픽': 0, '레어': 1, '일반': 2 };
          items.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
          break;
        case 'recent':
          items.sort((a, b) => new Date(b.acquiredDate) - new Date(a.acquiredDate));
          break;
      }
    },
    
    clearSearch() {
      this.searchQuery = '';
      this.filterItems();
    },
    
    selectItem(item) {
      if (this.selectedItem && this.selectedItem.id === item.id) {
        this.selectedItem = null;
      } else {
        this.selectedItem = item;
      }
    },
    
    closeDetails() {
      this.selectedItem = null;
    },
    
    formatDate(date) {
      if (!date) return '무기한';
      
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    },
    
    equipItem(item) {
      // 같은 카테고리의 아이템 장착 해제
      this.inventoryItems.forEach(i => {
        if (i.categoryId === item.categoryId && i.equipped) {
          i.equipped = false;
        }
      });
      
      // 선택한 아이템 장착
      const itemIndex = this.inventoryItems.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        this.inventoryItems[itemIndex].equipped = true;
        this.selectedItem = { ...this.inventoryItems[itemIndex] };
      }
      
      // 필터링된 아이템 업데이트
      this.filterItems();
    },
    
    unequipItem(item) {
      const itemIndex = this.inventoryItems.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        this.inventoryItems[itemIndex].equipped = false;
        this.selectedItem = { ...this.inventoryItems[itemIndex] };
      }
      
      // 필터링된 아이템 업데이트
      this.filterItems();
    },
    
    goToShop() {
      this.$router.push('/shop');
    }
  }
};
</script>

<style scoped>
.inventory-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.inventory-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.inventory-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.6rem 1rem;
  border-radius: 50px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-weight: 600;
}

.stat-item i {
  color: #4285F4;
}

.stat-item:last-child i {
  color: #FBBC05;
}

.inventory-nav {
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
  position: relative;
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

.item-count {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f0f2f5;
  color: #666;
  font-size: 0.8rem;
  font-weight: 600;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-item.active .item-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.inventory-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.category-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-bar {
  position: relative;
  width: 250px;
}

.search-bar i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-bar input {
  width: 100%;
  padding: 0.6rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 50px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-bar input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 0.9rem;
}

.sort-dropdown select {
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  background: white;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #ddd;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  color: #666;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  color: #999;
}

.shop-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shop-button:hover {
  transform: translateY(-2px);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  flex: 1;
}

.inventory-item {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.inventory-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.inventory-item.active {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
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

.equipped-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #4CAF50;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
}

.item-details {
  padding: 1rem;
}

.item-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.3rem;
  color: #333;
}

.item-category {
  font-size: 0.85rem;
  color: #999;
}

.item-details-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 350px;
  background: white;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.details-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.close-details {
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

.close-details:hover {
  background: #f5f5f5;
  color: #333;
}

.details-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.selected-item-image {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 1.5rem auto;
}

.selected-item-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.selected-item-image .item-rarity {
  left: 50%;
  transform: translateX(-50%);
}

.selected-item-info h4 {
  margin: 0 0 0.8rem 0;
  font-size: 1.2rem;
  color: #333;
  text-align: center;
}

.item-description {
  color: #666;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  text-align: center;
}

.item-stats {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-weight: 600;
  color: #666;
}

.stat-value {
  color: #333;
}

.details-actions {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
}

.action-button {
  padding: 0.7rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  width: 100%;
  justify-content: center;
}

.equip-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.equip-button:hover {
  transform: translateY(-2px);
}

.unequip-button {
  background: #f44336;
  color: white;
}

.unequip-button:hover {
  transform: translateY(-2px);
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@media (max-width: 768px) {
  .inventory-main {
    padding: 1rem;
  }
  
  .inventory-header {
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
  }
  
  .search-controls {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    width: 100%;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .item-details-panel {
    width: 100%;
  }
}
</style> 