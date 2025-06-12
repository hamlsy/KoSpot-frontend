<template>
  <div class="shop-management bg-white rounded-xl shadow-sm p-6">
    <div class="section-header flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-gray-800">상점 관리</h2>
      <div class="flex space-x-3">
        <div class="relative">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="상품 검색..." 
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
          />
          <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
        </div>
        <button 
          @click="openAddItemModal" 
          class="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <i class="fas fa-plus mr-2"></i>
          <span>상품 추가</span>
        </button>
      </div>
    </div>

    <!-- 필터 및 카테고리 -->
    <div class="filters-container flex flex-wrap gap-4 mb-6">
      <div class="filter-group">
        <label class="text-sm text-gray-600 mb-1 block">카테고리</label>
        <select 
          v-model="filters.category" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
        >
          <option value="all">모든 카테고리</option>
          <option value="avatar">아바타</option>
          <option value="booster">부스터</option>
          <option value="theme">테마</option>
          <option value="premium">프리미엄</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="text-sm text-gray-600 mb-1 block">가격대</label>
        <select 
          v-model="filters.priceRange" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
        >
          <option value="all">모든 가격대</option>
          <option value="free">무료</option>
          <option value="low">1,000원 이하</option>
          <option value="medium">1,000원 ~ 5,000원</option>
          <option value="high">5,000원 이상</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="text-sm text-gray-600 mb-1 block">정렬</label>
        <select 
          v-model="sortBy" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
        >
          <option value="newest">최신순</option>
          <option value="popular">인기순</option>
          <option value="priceAsc">가격 낮은순</option>
          <option value="priceDesc">가격 높은순</option>
        </select>
      </div>
    </div>

    <!-- 상품 그리드 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <div 
        v-for="item in paginatedItems" 
        :key="item.id" 
        class="shop-item bg-gray-50 rounded-lg overflow-hidden border border-gray-100 transition-all hover:shadow-md"
      >
        <div class="relative h-40 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
          <img 
            v-if="item.image" 
            :src="item.image" 
            :alt="item.name" 
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <i :class="['fas', getCategoryIcon(item.category), 'text-4xl text-indigo-300']"></i>
          </div>
          <div class="absolute top-2 right-2 flex space-x-1">
            <span 
              v-if="item.featured" 
              class="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full"
            >
              추천
            </span>
            <span 
              v-if="item.new" 
              class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
            >
              신규
            </span>
          </div>
        </div>
        
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-medium text-gray-800">{{ item.name }}</h3>
            <span 
              class="px-2 py-1 text-xs font-medium rounded-full" 
              :class="getCategoryBadgeClass(item.category)"
            >
              {{ getCategoryLabel(item.category) }}
            </span>
          </div>
          
          <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ item.description }}</p>
          
          <div class="flex justify-between items-center">
            <div class="text-indigo-600 font-medium">
              {{ item.price === 0 ? '무료' : `${formatNumber(item.price)}원` }}
            </div>
            <div class="text-sm text-gray-500">
              판매: {{ formatNumber(item.sales) }}
            </div>
          </div>
        </div>
        
        <div class="border-t border-gray-100 p-3 flex justify-between">
          <button 
            @click="editItem(item)" 
            class="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <i class="fas fa-edit mr-1"></i> 편집
          </button>
          <button 
            @click="toggleItemVisibility(item)" 
            class="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <i class="fas" :class="item.visible ? 'fa-eye' : 'fa-eye-slash'"></i>
            {{ item.visible ? '숨기기' : '표시' }}
          </button>
          <button 
            @click="confirmDeleteItem(item)" 
            class="text-red-500 hover:text-red-700 transition-colors"
          >
            <i class="fas fa-trash-alt mr-1"></i> 삭제
          </button>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination flex justify-between items-center">
      <div class="text-sm text-gray-600">
        {{ startIndex + 1 }}-{{ Math.min(endIndex, filteredItems.length) }} / {{ filteredItems.length }} 상품
      </div>
      <div class="flex space-x-2">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1" 
          class="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <button 
          v-for="page in totalPages" 
          :key="page" 
          @click="goToPage(page)" 
          class="px-3 py-1 rounded border" 
          :class="currentPage === page ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-300 hover:bg-gray-50'"
        >
          {{ page }}
        </button>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages" 
          class="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 상품 추가/편집 모달 -->
    <div v-if="showItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all">
        <h3 class="text-xl font-bold text-gray-800 mb-4">{{ editingItem ? '상품 편집' : '새 상품 추가' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">상품명</label>
            <input 
              v-model="itemForm.name" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea 
              v-model="itemForm.description" 
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select 
              v-model="itemForm.category" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            >
              <option value="avatar">아바타</option>
              <option value="booster">부스터</option>
              <option value="theme">테마</option>
              <option value="premium">프리미엄</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
            <input 
              v-model.number="itemForm.price" 
              type="number" 
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            />
          </div>
          
          <div class="flex space-x-4">
            <div class="flex items-center">
              <input 
                id="featured" 
                v-model="itemForm.featured" 
                type="checkbox" 
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="featured" class="ml-2 block text-sm text-gray-700">추천 상품</label>
            </div>
            <div class="flex items-center">
              <input 
                id="new" 
                v-model="itemForm.new" 
                type="checkbox" 
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="new" class="ml-2 block text-sm text-gray-700">신규 상품</label>
            </div>
            <div class="flex items-center">
              <input 
                id="visible" 
                v-model="itemForm.visible" 
                type="checkbox" 
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="visible" class="ml-2 block text-sm text-gray-700">표시</label>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="closeItemModal" 
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button 
            @click="saveItem" 
            class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
          >
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-2">상품 삭제</h3>
        <p class="text-gray-600 mb-6">정말 "{{ itemToDelete?.name }}" 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        
        <div class="flex justify-end space-x-3">
          <button 
            @click="showDeleteModal = false" 
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button 
            @click="deleteItem" 
            class="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// 상점 아이템 데이터 (실제로는 API에서 가져옴)
const items = ref([
  {
    id: 'ITEM001',
    name: '프리미엄 아바타 세트',
    description: '특별한 프리미엄 아바타 세트로 게임에서 독특한 모습을 연출하세요.',
    category: 'avatar',
    price: 5000,
    sales: 128,
    featured: true,
    new: false,
    visible: true,
    image: null
  },
  {
    id: 'ITEM002',
    name: '경험치 부스터',
    description: '1시간 동안 경험치를 2배로 획득할 수 있는 부스터입니다.',
    category: 'booster',
    price: 1500,
    sales: 345,
    featured: false,
    new: false,
    visible: true,
    image: null
  },
  {
    id: 'ITEM003',
    name: '다크 테마',
    description: '어두운 색상의 UI 테마로 게임의 분위기를 바꿔보세요.',
    category: 'theme',
    price: 2000,
    sales: 87,
    featured: false,
    new: true,
    visible: true,
    image: null
  },
  {
    id: 'ITEM004',
    name: '무지개 아바타',
    description: '다채로운 색상의 특별한 아바타입니다.',
    category: 'avatar',
    price: 3000,
    sales: 62,
    featured: false,
    new: false,
    visible: true,
    image: null
  },
  {
    id: 'ITEM005',
    name: '포인트 부스터',
    description: '1시간 동안 포인트를 2배로 획득할 수 있는 부스터입니다.',
    category: 'booster',
    price: 1500,
    sales: 211,
    featured: false,
    new: false,
    visible: true,
    image: null
  },
  {
    id: 'ITEM006',
    name: '프리미엄 멤버십',
    description: '한 달 동안 모든 프리미엄 기능을 이용할 수 있는 멤버십입니다.',
    category: 'premium',
    price: 9900,
    sales: 45,
    featured: true,
    new: false,
    visible: true,
    image: null
  },
  {
    id: 'ITEM007',
    name: '라이트 테마',
    description: '밝은 색상의 UI 테마로 게임의 분위기를 바꿔보세요.',
    category: 'theme',
    price: 2000,
    sales: 56,
    featured: false,
    new: false,
    visible: true,
    image: null
  },
  {
    id: 'ITEM008',
    name: '시즌 패스',
    description: '이번 시즌의 모든 콘텐츠를 이용할 수 있는 패스입니다.',
    category: 'premium',
    price: 15000,
    sales: 32,
    featured: true,
    new: true,
    visible: true,
    image: null
  },
  {
    id: 'ITEM009',
    name: '기본 아바타',
    description: '모든 사용자에게 제공되는 기본 아바타입니다.',
    category: 'avatar',
    price: 0,
    sales: 1024,
    featured: false,
    new: false,
    visible: true,
    image: null
  }
]);

// 필터 및 검색 상태
const searchQuery = ref('');
const filters = reactive({
  category: 'all',
  priceRange: 'all'
});
const sortBy = ref('newest');

// 페이지네이션 상태
const currentPage = ref(1);
const itemsPerPage = 6;

// 모달 상태
const showItemModal = ref(false);
const showDeleteModal = ref(false);
const editingItem = ref(null);
const itemToDelete = ref(null);
const itemForm = reactive({
  name: '',
  description: '',
  category: 'avatar',
  price: 0,
  featured: false,
  new: false,
  visible: true
});

// 필터링된 아이템 목록
const filteredItems = computed(() => {
  let result = [...items.value];
  
  // 검색어 필터링
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    );
  }
  
  // 카테고리 필터링
  if (filters.category !== 'all') {
    result = result.filter(item => item.category === filters.category);
  }
  
  // 가격대 필터링
  if (filters.priceRange !== 'all') {
    switch (filters.priceRange) {
      case 'free':
        result = result.filter(item => item.price === 0);
        break;
      case 'low':
        result = result.filter(item => item.price > 0 && item.price <= 1000);
        break;
      case 'medium':
        result = result.filter(item => item.price > 1000 && item.price <= 5000);
        break;
      case 'high':
        result = result.filter(item => item.price > 5000);
        break;
    }
  }
  
  // 정렬
  switch (sortBy.value) {
    case 'newest':
      // 여기서는 ID를 기준으로 정렬 (실제로는 생성 날짜 기준)
      result.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case 'popular':
      result.sort((a, b) => b.sales - a.sales);
      break;
    case 'priceAsc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'priceDesc':
      result.sort((a, b) => b.price - a.price);
      break;
  }
  
  return result;
});

// 현재 페이지에 표시할 아이템
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredItems.value.slice(start, end);
});

// 페이지네이션 계산
const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => startIndex.value + itemsPerPage);

// 페이지 이동 함수
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPage = (page) => {
  currentPage.value = page;
};

// 상품 관리 함수
const openAddItemModal = () => {
  editingItem.value = null;
  itemForm.name = '';
  itemForm.description = '';
  itemForm.category = 'avatar';
  itemForm.price = 0;
  itemForm.featured = false;
  itemForm.new = false;
  itemForm.visible = true;
  showItemModal.value = true;
};

const editItem = (item) => {
  editingItem.value = item;
  itemForm.name = item.name;
  itemForm.description = item.description;
  itemForm.category = item.category;
  itemForm.price = item.price;
  itemForm.featured = item.featured;
  itemForm.new = item.new;
  itemForm.visible = item.visible;
  showItemModal.value = true;
};

const closeItemModal = () => {
  showItemModal.value = false;
};

const saveItem = () => {
  if (editingItem.value) {
    // 기존 상품 업데이트
    const index = items.value.findIndex(i => i.id === editingItem.value.id);
    if (index !== -1) {
      items.value[index] = {
        ...items.value[index],
        name: itemForm.name,
        description: itemForm.description,
        category: itemForm.category,
        price: itemForm.price,
        featured: itemForm.featured,
        new: itemForm.new,
        visible: itemForm.visible
      };
    }
  } else {
    // 새 상품 추가
    const newItem = {
      id: `ITEM${String(items.value.length + 1).padStart(3, '0')}`,
      name: itemForm.name,
      description: itemForm.description,
      category: itemForm.category,
      price: itemForm.price,
      sales: 0,
      featured: itemForm.featured,
      new: itemForm.new,
      visible: itemForm.visible,
      image: null
    };
    items.value.push(newItem);
  }
  
  showItemModal.value = false;
};

const confirmDeleteItem = (item) => {
  itemToDelete.value = item;
  showDeleteModal.value = true;
};

const deleteItem = () => {
  if (itemToDelete.value) {
    const index = items.value.findIndex(i => i.id === itemToDelete.value.id);
    if (index !== -1) {
      items.value.splice(index, 1);
    }
  }
  showDeleteModal.value = false;
};

const toggleItemVisibility = (item) => {
  const index = items.value.findIndex(i => i.id === item.id);
  if (index !== -1) {
    items.value[index].visible = !items.value[index].visible;
  }
};

// 유틸리티 함수
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'avatar':
      return 'fa-user-circle';
    case 'booster':
      return 'fa-rocket';
    case 'theme':
      return 'fa-paint-brush';
    case 'premium':
      return 'fa-crown';
    default:
      return 'fa-box';
  }
};

const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'avatar':
      return 'bg-blue-100 text-blue-800';
    case 'booster':
      return 'bg-green-100 text-green-800';
    case 'theme':
      return 'bg-purple-100 text-purple-800';
    case 'premium':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getCategoryLabel = (category) => {
  switch (category) {
    case 'avatar':
      return '아바타';
    case 'booster':
      return '부스터';
    case 'theme':
      return '테마';
    case 'premium':
      return '프리미엄';
    default:
      return '기타';
  }
};
</script>
