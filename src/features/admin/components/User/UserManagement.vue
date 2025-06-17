<template>
  <div class="user-management bg-white rounded-xl shadow-sm p-6">
    <div class="section-header flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-gray-800">사용자 관리</h2>
      <div class="flex space-x-3">
        <div class="relative">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="사용자 검색..." 
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
          />
          <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
        </div>
        <button 
          @click="openAddUserModal" 
          class="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <i class="fas fa-user-plus mr-2"></i>
          <span>사용자 추가</span>
        </button>
      </div>
    </div>

    <!-- 필터 및 정렬 옵션 -->
    <div class="filters-container flex flex-wrap gap-4 mb-6">
      <div class="filter-group">
        <label class="text-sm text-gray-600 mb-1 block">상태</label>
        <select 
          v-model="filters.status" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
        >
          <option value="all">모든 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="pending">대기중</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="text-sm text-gray-600 mb-1 block">역할</label>
        <select 
          v-model="filters.role" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
        >
          <option value="all">모든 역할</option>
          <option value="admin">관리자</option>
          <option value="moderator">운영자</option>
          <option value="user">일반 사용자</option>
          <option value="premium">프리미엄 사용자</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="text-sm text-gray-600 mb-1 block">정렬</label>
        <select 
          v-model="sortBy" 
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
        >
          <option value="newest">최신 가입순</option>
          <option value="oldest">오래된 가입순</option>
          <option value="name">이름순</option>
          <option value="activity">활동순</option>
        </select>
      </div>
    </div>

    <!-- 사용자 목록 테이블 -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50 text-left">
            <th class="px-4 py-3 text-sm font-medium text-gray-600 rounded-tl-lg">사용자</th>
            <th class="px-4 py-3 text-sm font-medium text-gray-600">이메일</th>
            <th class="px-4 py-3 text-sm font-medium text-gray-600">역할</th>
            <th class="px-4 py-3 text-sm font-medium text-gray-600">상태</th>
            <th class="px-4 py-3 text-sm font-medium text-gray-600">가입일</th>
            <th class="px-4 py-3 text-sm font-medium text-gray-600">최근 활동</th>
            <th class="px-4 py-3 text-sm font-medium text-gray-600 rounded-tr-lg">작업</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="user in filteredUsers" 
            :key="user.id" 
            class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mr-3">
                  <img 
                    v-if="user.avatar" 
                    :src="user.avatar" 
                    :alt="user.name" 
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-indigo-500 font-medium">{{ getInitials(user.name) }}</span>
                </div>
                <div>
                  <div class="font-medium text-gray-800">{{ user.name }}</div>
                  <div class="text-xs text-gray-500">ID: {{ user.id }}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span 
                class="px-2.5 py-1 text-xs font-medium rounded-full" 
                :class="getRoleBadgeClass(user.role)"
              >
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span 
                class="px-2.5 py-1 text-xs font-medium rounded-full" 
                :class="getStatusBadgeClass(user.status)"
              >
                {{ getStatusLabel(user.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600 text-sm">{{ formatDate(user.joinDate) }}</td>
            <td class="px-4 py-3 text-gray-600 text-sm">{{ formatRelativeTime(user.lastActive) }}</td>
            <td class="px-4 py-3">
              <div class="flex space-x-2">
                <button 
                  @click="editUser(user)" 
                  class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="사용자 편집"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  @click="toggleUserStatus(user)" 
                  class="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  :class="user.status === 'active' ? 'text-amber-500' : 'text-green-500'"
                  :title="user.status === 'active' ? '사용자 비활성화' : '사용자 활성화'"
                >
                  <i class="fas" :class="user.status === 'active' ? 'fa-ban' : 'fa-check'"></i>
                </button>
                <button 
                  @click="confirmDeleteUser(user)" 
                  class="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="사용자 삭제"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div class="pagination flex justify-between items-center mt-6">
      <div class="text-sm text-gray-600">
        {{ startIndex + 1 }}-{{ Math.min(endIndex, filteredUsers.length) }} / {{ filteredUsers.length }} 사용자
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

    <!-- 사용자 추가/편집 모달 -->
    <div v-if="showUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all">
        <h3 class="text-xl font-bold text-gray-800 mb-4">{{ editingUser ? '사용자 편집' : '새 사용자 추가' }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input 
              v-model="userForm.name" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input 
              v-model="userForm.email" 
              type="email" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select 
              v-model="userForm.role" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            >
              <option value="admin">관리자</option>
              <option value="moderator">운영자</option>
              <option value="user">일반 사용자</option>
              <option value="premium">프리미엄 사용자</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select 
              v-model="userForm.status" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="pending">대기중</option>
            </select>
          </div>
          
          <div v-if="!editingUser">
            <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input 
              v-model="userForm.password" 
              type="password" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="closeUserModal" 
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button 
            @click="saveUser" 
            class="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            저장
          </button>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-2">사용자 삭제</h3>
        <p class="text-gray-600 mb-6">정말 {{ userToDelete?.name }} 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        
        <div class="flex justify-end space-x-3">
          <button 
            @click="showDeleteModal = false" 
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button 
            @click="deleteUser" 
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

// 사용자 목록 데이터 (실제로는 API에서 가져옴)
const users = ref([
  {
    id: 'USR001',
    name: '김민준',
    email: 'minjun.kim@example.com',
    role: 'admin',
    status: 'active',
    joinDate: new Date(2023, 1, 15),
    lastActive: new Date(new Date().getTime() - 30 * 60000),
    avatar: null
  },
  {
    id: 'USR002',
    name: '이서연',
    email: 'seoyeon.lee@example.com',
    role: 'premium',
    status: 'active',
    joinDate: new Date(2023, 2, 10),
    lastActive: new Date(new Date().getTime() - 2 * 60 * 60000),
    avatar: null
  },
  {
    id: 'USR003',
    name: '박지훈',
    email: 'jihoon.park@example.com',
    role: 'user',
    status: 'inactive',
    joinDate: new Date(2023, 3, 5),
    lastActive: new Date(new Date().getTime() - 7 * 24 * 60 * 60000),
    avatar: null
  },
  {
    id: 'USR004',
    name: '최수아',
    email: 'sua.choi@example.com',
    role: 'moderator',
    status: 'active',
    joinDate: new Date(2023, 4, 20),
    lastActive: new Date(new Date().getTime() - 45 * 60000),
    avatar: null
  },
  {
    id: 'USR005',
    name: '정도윤',
    email: 'doyoon.jung@example.com',
    role: 'user',
    status: 'pending',
    joinDate: new Date(2023, 5, 8),
    lastActive: new Date(new Date().getTime() - 1 * 24 * 60 * 60000),
    avatar: null
  },
  {
    id: 'USR006',
    name: '한지민',
    email: 'jimin.han@example.com',
    role: 'premium',
    status: 'active',
    joinDate: new Date(2023, 6, 12),
    lastActive: new Date(new Date().getTime() - 15 * 60000),
    avatar: null
  },
  {
    id: 'USR007',
    name: '송하은',
    email: 'haeun.song@example.com',
    role: 'user',
    status: 'active',
    joinDate: new Date(2023, 7, 3),
    lastActive: new Date(new Date().getTime() - 3 * 24 * 60 * 60000),
    avatar: null
  },
  {
    id: 'USR008',
    name: '윤준호',
    email: 'junho.yoon@example.com',
    role: 'user',
    status: 'active',
    joinDate: new Date(2023, 8, 22),
    lastActive: new Date(new Date().getTime() - 5 * 60000),
    avatar: null
  },
  {
    id: 'USR009',
    name: '강서현',
    email: 'seohyun.kang@example.com',
    role: 'premium',
    status: 'active',
    joinDate: new Date(2023, 9, 17),
    lastActive: new Date(new Date().getTime() - 60 * 60000),
    avatar: null
  },
  {
    id: 'USR010',
    name: '임태민',
    email: 'taemin.lim@example.com',
    role: 'user',
    status: 'inactive',
    joinDate: new Date(2023, 10, 9),
    lastActive: new Date(new Date().getTime() - 14 * 24 * 60 * 60000),
    avatar: null
  }
]);

// 필터 및 검색 상태
const searchQuery = ref('');
const filters = reactive({
  status: 'all',
  role: 'all'
});
const sortBy = ref('newest');

// 페이지네이션 상태
const currentPage = ref(1);
const itemsPerPage = 5;

// 모달 상태
const showUserModal = ref(false);
const showDeleteModal = ref(false);
const editingUser = ref(null);
const userToDelete = ref(null);
const userForm = reactive({
  name: '',
  email: '',
  role: 'user',
  status: 'active',
  password: ''
});

// 필터링된 사용자 목록
const filteredUsers = computed(() => {
  let result = [...users.value];
  
  // 검색어 필터링
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    );
  }
  
  // 상태 필터링
  if (filters.status !== 'all') {
    result = result.filter(user => user.status === filters.status);
  }
  
  // 역할 필터링
  if (filters.role !== 'all') {
    result = result.filter(user => user.role === filters.role);
  }
  
  // 정렬
  switch (sortBy.value) {
    case 'newest':
      result.sort((a, b) => b.joinDate - a.joinDate);
      break;
    case 'oldest':
      result.sort((a, b) => a.joinDate - b.joinDate);
      break;
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'activity':
      result.sort((a, b) => b.lastActive - a.lastActive);
      break;
  }
  
  return result;
});

// 현재 페이지에 표시할 사용자
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredUsers.value.slice(start, end);
});

// 페이지네이션 계산
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage));
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

// 사용자 관리 함수
const openAddUserModal = () => {
  editingUser.value = null;
  userForm.name = '';
  userForm.email = '';
  userForm.role = 'user';
  userForm.status = 'active';
  userForm.password = '';
  showUserModal.value = true;
};

const editUser = (user) => {
  editingUser.value = user;
  userForm.name = user.name;
  userForm.email = user.email;
  userForm.role = user.role;
  userForm.status = user.status;
  userForm.password = '';
  showUserModal.value = true;
};

const closeUserModal = () => {
  showUserModal.value = false;
};

const saveUser = () => {
  if (editingUser.value) {
    // 기존 사용자 업데이트
    const index = users.value.findIndex(u => u.id === editingUser.value.id);
    if (index !== -1) {
      users.value[index] = {
        ...users.value[index],
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        status: userForm.status
      };
    }
  } else {
    // 새 사용자 추가
    const newUser = {
      id: `USR${String(users.value.length + 1).padStart(3, '0')}`,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      status: userForm.status,
      joinDate: new Date(),
      lastActive: new Date(),
      avatar: null
    };
    users.value.push(newUser);
  }
  
  showUserModal.value = false;
};

const confirmDeleteUser = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

const deleteUser = () => {
  if (userToDelete.value) {
    const index = users.value.findIndex(u => u.id === userToDelete.value.id);
    if (index !== -1) {
      users.value.splice(index, 1);
    }
  }
  showDeleteModal.value = false;
};

const toggleUserStatus = (user) => {
  const index = users.value.findIndex(u => u.id === user.id);
  if (index !== -1) {
    if (user.status === 'active') {
      users.value[index].status = 'inactive';
    } else {
      users.value[index].status = 'active';
    }
  }
};

// 유틸리티 함수
const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('');
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = Math.floor((now - date) / 60000); // 분 단위로 계산
  
  if (diff < 1) return '방금 전';
  if (diff < 60) return `${diff}분 전`;
  
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}시간 전`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
};

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'moderator':
      return 'bg-blue-100 text-blue-800';
    case 'premium':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case 'admin':
      return '관리자';
    case 'moderator':
      return '운영자';
    case 'premium':
      return '프리미엄';
    default:
      return '일반';
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'active':
      return '활성';
    case 'inactive':
      return '비활성';
    case 'pending':
      return '대기중';
    default:
      return '알 수 없음';
  }
};
</script>
