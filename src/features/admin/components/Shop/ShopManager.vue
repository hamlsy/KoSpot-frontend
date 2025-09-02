<template>
  <div class="shop-manager">
    <div class="header-section">
      <h2 class="section-title">🛒 상점 관리</h2>
      <p class="section-description">상점 아이템을 관리하고 등록/삭제할 수 있습니다.</p>
    </div>

    <!-- 상단 제어 패널 -->
    <div class="control-panel">
      <div class="item-type-tabs">
        <button
          v-for="itemType in itemTypes"
          :key="itemType.key"
          :class="{ active: currentItemType === itemType.key }"
          @click="changeItemType(itemType.key)"
          class="type-tab"
        >
          <i :class="itemType.icon"></i>
          {{ itemType.name }}
        </button>
      </div>
      
      <button @click="openCreateModal" class="create-btn">
        <i class="fas fa-plus"></i>
        새 아이템 추가
      </button>
    </div>

    <!-- 아이템 목록 -->
    <div class="items-section">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>아이템을 불러오는 중...</span>
        </div>
      </div>

      <div v-else-if="items.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-box-open"></i>
        </div>
        <h3>등록된 아이템이 없습니다</h3>
        <p>새 아이템을 추가해보세요.</p>
        <button @click="openCreateModal" class="empty-create-btn">
          <i class="fas fa-plus"></i>
          아이템 추가하기
        </button>
      </div>

      <div v-else class="items-grid">
        <div
          v-for="item in items"
          :key="item.itemId"
          class="item-card"
          :class="{ 'shop-hidden': !item.inShop }"
        >
          <div class="item-image-container">
            <img 
              :src="item.imageUrl || '/assets/default-item.png'" 
              :alt="item.name"
              class="item-image"
              @error="handleImageError"
            />
            <div class="item-status-badge" :class="item.inShop ? 'in-shop' : 'hidden'">
              {{ item.inShop ? '상점 등록' : '상점 숨김' }}
            </div>
          </div>

          <div class="item-details">
            <h4 class="item-name">{{ item.name }}</h4>
            <p class="item-description">{{ item.description }}</p>
            <div class="item-price">
              <span class="price">{{ formatPrice(item.price) }}</span>
              <i class="fas fa-coins"></i>
            </div>
            <div class="item-stock">
              재고: {{ item.stock || 0 }}개
            </div>
          </div>

          <div class="item-actions">
            <button @click="editItem(item)" class="action-btn edit-btn">
              <i class="fas fa-edit"></i>
              수정
            </button>
            
            <button
              v-if="item.inShop"
              @click="removeFromShop(item)"
              class="action-btn hide-btn"
            >
              <i class="fas fa-eye-slash"></i>
              상점 숨김
            </button>
            
            <button
              v-else
              @click="restoreToShop(item)"
              class="action-btn restore-btn"
            >
              <i class="fas fa-eye"></i>
              상점 등록
            </button>
            
            <button @click="deleteItem(item)" class="action-btn delete-btn">
              <i class="fas fa-trash"></i>
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 아이템 생성/수정 모달 -->
    <ItemFormModal
      v-if="showItemModal"
      :item="editingItem"
      :itemTypes="itemTypes"
      :isEdit="isEditMode"
      @save="saveItem"
      @cancel="closeItemModal"
    />

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      v-if="showDeleteModal"
      :title="deleteModalTitle"
      :message="deleteModalMessage"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />

    <!-- 상점 등록/삭제 확인 모달 -->
    <ConfirmModal
      v-if="showShopActionModal"
      :title="shopActionModalTitle"
      :message="shopActionModalMessage"
      @confirm="confirmShopAction"
      @cancel="closeShopActionModal"
    />

    <!-- 로딩 오버레이 -->
    <div v-if="actionLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>처리 중...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { shopAdminService } from '@/features/admin/services/shopAdmin.service.js'
import ItemFormModal from './ItemFormModal.vue'
import ConfirmModal from '@/features/admin/components/Common/ConfirmModal.vue'

// 반응형 상태
const loading = ref(false)
const actionLoading = ref(false)
const currentItemType = ref('MARKER')
const items = ref([])

// 모달 상태
const showItemModal = ref(false)
const showDeleteModal = ref(false)
const showShopActionModal = ref(false)
const editingItem = ref(null)
const isEditMode = ref(false)

// 삭제 관련 상태
const deletingItem = ref(null)
const deleteModalTitle = ref('')
const deleteModalMessage = ref('')

// 상점 액션 관련 상태
const shopActionItem = ref(null)
const shopActionType = ref('') // 'restore' or 'remove'
const shopActionModalTitle = ref('')
const shopActionModalMessage = ref('')

// 아이템 타입 목록
const itemTypes = computed(() => shopAdminService.getItemTypes())

// 컴포넌트 마운트 시 데이터 로드
onMounted(() => {
  loadItems()
})

// 메서드들
const loadItems = async () => {
  try {
    loading.value = true
    const response = await shopAdminService.getItemsByType(currentItemType.value)
    
    if (response.isSuccess) {
      // 백엔드 응답에 inShop 속성이 없을 경우 기본값 설정
      items.value = response.result.map(item => ({
        ...item,
        inShop: item.inShop !== undefined ? item.inShop : true // 기본값은 상점 등록 상태
      }))
    } else {
      console.error('아이템 로드 실패:', response.message)
      items.value = []
    }
  } catch (error) {
    console.error('아이템 로드 중 오류:', error)
    items.value = []
  } finally {
    loading.value = false
  }
}

const changeItemType = (itemTypeKey) => {
  currentItemType.value = itemTypeKey
  loadItems()
}

const openCreateModal = () => {
  editingItem.value = null
  isEditMode.value = false
  showItemModal.value = true
}

const editItem = (item) => {
  editingItem.value = { ...item }
  isEditMode.value = true
  showItemModal.value = true
}

const closeItemModal = () => {
  showItemModal.value = false
  editingItem.value = null
  isEditMode.value = false
}

const saveItem = async (itemData) => {
  try {
    actionLoading.value = true
    
    if (isEditMode.value) {
      // 수정
      const response = await shopAdminService.updateItem({
        itemId: editingItem.value.itemId,
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
        itemTypeKey: itemData.itemTypeKey,
        quantity: itemData.quantity || 0
      })
      
      if (response.isSuccess) {
        console.log('아이템 수정 완료')
      }
    } else {
      // 생성
      const response = await shopAdminService.createItem({
        title: itemData.name,
        content: itemData.description,
        images: itemData.images || []
      })
      
      if (response.isSuccess) {
        console.log('아이템 생성 완료')
      }
    }
    
    closeItemModal()
    await loadItems()
  } catch (error) {
    console.error('아이템 저장 실패:', error)
    alert('아이템 저장에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

const deleteItem = (item) => {
  deletingItem.value = item
  deleteModalTitle.value = '아이템 삭제'
  deleteModalMessage.value = `"${item.name}" 아이템을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  try {
    actionLoading.value = true
    
    const response = await shopAdminService.deleteItem(deletingItem.value.itemId)
    
    if (response.isSuccess) {
      console.log('아이템 삭제 완료')
      await loadItems()
    }
  } catch (error) {
    console.error('아이템 삭제 실패:', error)
    alert('아이템 삭제에 실패했습니다.')
  } finally {
    actionLoading.value = false
    closeDeleteModal()
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deletingItem.value = null
}

const removeFromShop = (item) => {
  shopActionItem.value = item
  shopActionType.value = 'remove'
  shopActionModalTitle.value = '상점에서 숨기기'
  shopActionModalMessage.value = `"${item.name}" 아이템을 상점에서 숨기시겠습니까?\n사용자들이 더 이상 구매할 수 없게 됩니다.`
  showShopActionModal.value = true
}

const restoreToShop = (item) => {
  shopActionItem.value = item
  shopActionType.value = 'restore'
  shopActionModalTitle.value = '상점에 등록'
  shopActionModalMessage.value = `"${item.name}" 아이템을 다시 상점에 등록하시겠습니까?\n사용자들이 구매할 수 있게 됩니다.`
  showShopActionModal.value = true
}

const confirmShopAction = async () => {
  try {
    actionLoading.value = true
    
    let response
    if (shopActionType.value === 'restore') {
      response = await shopAdminService.restoreItemToShop(shopActionItem.value.itemId)
    } else {
      response = await shopAdminService.removeItemFromShop(shopActionItem.value.itemId)
    }
    
    if (response.isSuccess) {
      console.log('상점 상태 변경 완료')
      await loadItems()
    }
  } catch (error) {
    console.error('상점 상태 변경 실패:', error)
    alert('상점 상태 변경에 실패했습니다.')
  } finally {
    actionLoading.value = false
    closeShopActionModal()
  }
}

const closeShopActionModal = () => {
  showShopActionModal.value = false
  shopActionItem.value = null
  shopActionType.value = ''
}

const formatPrice = (price) => {
  return shopAdminService.formatPrice(price)
}

const handleImageError = (event) => {
  event.target.src = '/assets/default-item.png'
}
</script>

<style scoped>
.shop-manager {
  position: relative;
}

.header-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #6b7280;
  font-size: 0.95rem;
}

.control-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.item-type-tabs {
  display: flex;
  background: white;
  border-radius: 8px;
  padding: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.type-tab {
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6b7280;
}

.type-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.type-tab.active {
  background: #667eea;
  color: white;
}

.create-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.items-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
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
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.empty-create-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.empty-create-btn:hover {
  transform: translateY(-2px);
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.item-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.item-card.shop-hidden {
  opacity: 0.7;
  border-color: #fbbf24;
  background: #fefce8;
}

.item-image-container {
  position: relative;
  height: 200px;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.item-status-badge.in-shop {
  background: #d1fae5;
  color: #065f46;
}

.item-status-badge.hidden {
  background: #fef3c7;
  color: #92400e;
}

.item-details {
  padding: 1rem;
}

.item-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.item-description {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.item-price i {
  color: #fbbf24;
}

.item-stock {
  font-size: 0.9rem;
  color: #6b7280;
}

.item-actions {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 80px;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.edit-btn:hover {
  background: #2563eb;
}

.hide-btn {
  background: #f59e0b;
  color: white;
}

.hide-btn:hover {
  background: #d97706;
}

.restore-btn {
  background: #10b981;
  color: white;
}

.restore-btn:hover {
  background: #059669;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .item-type-tabs {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .item-actions {
    flex-direction: column;
  }
  
  .action-btn {
    min-width: auto;
  }
}
</style>
