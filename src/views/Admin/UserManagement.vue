<template>
  <AdminPanel>
    <div class="user-management">
      <div class="header">
        <h2>사용자 관리</h2>
        <div class="actions">
          <button class="btn btn-primary">
            <i class="fas fa-plus"></i> 새 사용자
          </button>
          <button class="btn btn-secondary">
            <i class="fas fa-download"></i> 내보내기
          </button>
        </div>
      </div>

      <div class="filters">
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="이름, 이메일 또는 ID로 검색" 
            class="search-input"
            @input="filterUsers"
          />
          <i class="fas fa-search search-icon"></i>
        </div>
        <div class="filter-options">
          <select v-model="statusFilter" @change="filterUsers">
            <option value="all">모든 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="banned">차단됨</option>
          </select>
          <select v-model="roleFilter" @change="filterUsers">
            <option value="all">모든 역할</option>
            <option value="admin">관리자</option>
            <option value="moderator">중재자</option>
            <option value="user">일반 사용자</option>
          </select>
        </div>
      </div>

      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
              </th>
              <th @click="sortBy('id')">ID <i class="fas fa-sort"></i></th>
              <th @click="sortBy('name')">이름 <i class="fas fa-sort"></i></th>
              <th @click="sortBy('email')">이메일 <i class="fas fa-sort"></i></th>
              <th @click="sortBy('role')">역할 <i class="fas fa-sort"></i></th>
              <th @click="sortBy('status')">상태 <i class="fas fa-sort"></i></th>
              <th @click="sortBy('lastLogin')">마지막 로그인 <i class="fas fa-sort"></i></th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in displayedUsers" :key="user.id" :class="{ 'selected': selectedUsers.includes(user.id) }">
              <td>
                <input 
                  type="checkbox" 
                  :value="user.id" 
                  v-model="selectedUsers"
                >
              </td>
              <td>{{ user.id }}</td>
              <td class="user-name-cell">
                <img :src="user.avatar" :alt="user.name" class="user-avatar">
                <span>{{ user.name }}</span>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="'role-badge ' + user.role">{{ user.role }}</span>
              </td>
              <td>
                <span :class="'status-badge ' + user.status">{{ user.status }}</span>
              </td>
              <td>{{ formatDate(user.lastLogin) }}</td>
              <td class="actions-cell">
                <button class="action-btn" @click="editUser(user)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" @click="deleteUser(user)">
                  <i class="fas fa-trash"></i>
                </button>
                <button class="action-btn" @click="toggleUserStatus(user)">
                  <i class="fas" :class="user.status === 'active' ? 'fa-ban' : 'fa-check'"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button 
          @click="currentPage > 1 ? currentPage-- : null"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="currentPage < totalPages ? currentPage++ : null"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div v-if="selectedUsers.length > 0" class="bulk-actions">
        <p>{{ selectedUsers.length }}명의 사용자가 선택됨</p>
        <button class="btn btn-warning" @click="bulkStatusChange('inactive')">비활성화</button>
        <button class="btn btn-danger" @click="bulkStatusChange('banned')">차단</button>
        <button class="btn btn-success" @click="bulkStatusChange('active')">활성화</button>
        <button class="btn btn-danger" @click="bulkDelete">삭제</button>
      </div>
    </div>
  </AdminPanel>
</template>

<script>
import AdminPanel from '@/components/admin/AdminPanel.vue';

export default {
  name: 'UserManagement',
  components: {
    AdminPanel
  },
  data() {
    return {
      users: [
        { 
          id: 1, 
          name: '김민준', 
          email: 'minjun.kim@example.com',
          role: 'admin',
          status: 'active',
          lastLogin: new Date(2023, 5, 15, 9, 30),
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
        },
        { 
          id: 2, 
          name: '이서연', 
          email: 'seoyeon.lee@example.com',
          role: 'moderator',
          status: 'active',
          lastLogin: new Date(2023, 5, 12, 14, 15),
          avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
        },
        { 
          id: 3, 
          name: '박지훈', 
          email: 'jihun.park@example.com',
          role: 'user',
          status: 'inactive',
          lastLogin: new Date(2023, 4, 30, 11, 45),
          avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
        },
        { 
          id: 4, 
          name: '최수아', 
          email: 'sua.choi@example.com',
          role: 'user',
          status: 'banned',
          lastLogin: new Date(2023, 3, 25, 16, 20),
          avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
        },
        { 
          id: 5, 
          name: '정도윤', 
          email: 'doyun.jung@example.com',
          role: 'user',
          status: 'active',
          lastLogin: new Date(2023, 5, 14, 8, 10),
          avatar: 'https://randomuser.me/api/portraits/men/5.jpg'
        },
      ],
      filteredUsers: [],
      searchTerm: '',
      statusFilter: 'all',
      roleFilter: 'all',
      sortColumn: 'id',
      sortDirection: 'asc',
      selectedUsers: [],
      selectAll: false,
      currentPage: 1,
      usersPerPage: 10
    };
  },
  computed: {
    displayedUsers() {
      const start = (this.currentPage - 1) * this.usersPerPage;
      const end = start + this.usersPerPage;
      return this.filteredUsers.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredUsers.length / this.usersPerPage);
    }
  },
  created() {
    this.filterUsers();
  },
  methods: {
    filterUsers() {
      let result = this.users;
      
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        result = result.filter(user => 
          user.name.toLowerCase().includes(searchLower) || 
          user.email.toLowerCase().includes(searchLower) ||
          user.id.toString().includes(searchLower)
        );
      }
      
      if (this.statusFilter !== 'all') {
        result = result.filter(user => user.status === this.statusFilter);
      }
      
      if (this.roleFilter !== 'all') {
        result = result.filter(user => user.role === this.roleFilter);
      }
      
      // 정렬
      result.sort((a, b) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      this.filteredUsers = result;
      
      // 페이지 재설정
      if (this.currentPage > this.totalPages) {
        this.currentPage = Math.max(1, this.totalPages);
      }
    },
    sortBy(column) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
      
      this.filterUsers();
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedUsers = this.displayedUsers.map(user => user.id);
      } else {
        this.selectedUsers = [];
      }
    },
    editUser(user) {
      alert(`사용자 편집: ${user.name}`);
      // 사용자 편집 모달 또는 페이지로 이동
    },
    deleteUser(user) {
      if (confirm(`정말로 ${user.name} 사용자를 삭제하시겠습니까?`)) {
        this.users = this.users.filter(u => u.id !== user.id);
        this.filterUsers();
      }
    },
    toggleUserStatus(user) {
      if (user.status === 'active') {
        user.status = 'inactive';
      } else {
        user.status = 'active';
      }
      this.filterUsers();
    },
    bulkStatusChange(status) {
      if (confirm(`선택한 ${this.selectedUsers.length}명의 사용자 상태를 '${status}'로 변경하시겠습니까?`)) {
        this.users.forEach(user => {
          if (this.selectedUsers.includes(user.id)) {
            user.status = status;
          }
        });
        this.filterUsers();
        this.selectedUsers = [];
        this.selectAll = false;
      }
    },
    bulkDelete() {
      if (confirm(`선택한 ${this.selectedUsers.length}명의 사용자를 삭제하시겠습니까?`)) {
        this.users = this.users.filter(user => !this.selectedUsers.includes(user.id));
        this.filterUsers();
        this.selectedUsers = [];
        this.selectAll = false;
      }
    }
  }
};
</script>

<style scoped>
.user-management {
  background-color: transparent;
  padding: 0;
  max-width: 100%;
  overflow-x: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-primary {
  background-color: #4a6cf7;
  color: white;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
}

.btn-warning {
  background-color: #f6ad55;
  color: white;
}

.btn-danger {
  background-color: #e53e3e;
  color: white;
}

.btn-success {
  background-color: #38a169;
  color: white;
}

.filters {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 8px 36px 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 0.9rem;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.filter-options {
  display: flex;
  gap: 10px;
}

.filter-options select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 0.9rem;
}

.users-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.users-table th, .users-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.users-table th i {
  margin-left: 5px;
  font-size: 0.8rem;
}

.users-table tr:hover {
  background-color: #f5f7fb;
}

.users-table tr.selected {
  background-color: #ebf4ff;
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.role-badge, .status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-badge.admin {
  background-color: #805ad5;
  color: white;
}

.role-badge.moderator {
  background-color: #3182ce;
  color: white;
}

.role-badge.user {
  background-color: #a0aec0;
  color: white;
}

.status-badge.active {
  background-color: #c6f6d5;
  color: #2f855a;
}

.status-badge.inactive {
  background-color: #fed7d7;
  color: #c53030;
}

.status-badge.banned {
  background-color: #feb2b2;
  color: #9b2c2c;
}

.actions-cell {
  display: flex;
  gap: 5px;
}

.action-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: #718096;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: #edf2f7;
  color: #4a6cf7;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.page-btn {
  border: none;
  background-color: #f7fafc;
  color: #4a5568;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:disabled {
  color: #cbd5e0;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #4a5568;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.bulk-actions p {
  margin: 0;
  margin-right: 15px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  
  .filter-options {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-options select {
    flex: 1;
  }
  
  .bulk-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .bulk-actions p {
    width: 100%;
    text-align: center;
    margin-bottom: 10px;
  }
}
</style> 