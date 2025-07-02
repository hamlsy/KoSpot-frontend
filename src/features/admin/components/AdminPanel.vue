<template>
  <div class="admin-panel">
    <div class="content-area">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPanel',
  methods: {
    closeAdminPanel() {
      this.$router.push('/main');
    }
  }
}
</script>

<style scoped>
.admin-panel {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
  padding-top: 60px; /* 네비게이션바 높이만큼 패딩 추가 */
}

.close-button {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 18px;
}

.close-button:hover {
  color: #f8fafc;
}

.admin-user-info {
  padding: 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #334155;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.admin-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-info {
  flex: 1;
}

.admin-name {
  margin: 0 0 2px;
  font-weight: 600;
  font-size: 14px;
  color: #f8fafc;
}

.admin-role {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.sidebar-menu {
  flex: 1;
  padding: 20px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #cbd5e1;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: #334155;
  color: #f8fafc;
}

.menu-item.active {
  background-color: #3b82f6;
  color: #ffffff;
}

.menu-item i {
  width: 20px;
  margin-right: 12px;
  font-size: 16px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #334155;
}

.version-info {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 10px;
}

.logout-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px;
  background-color: #475569;
  border: none;
  border-radius: 6px;
  color: #f8fafc;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background-color: #64748b;
}

.logout-button i {
  margin-right: 8px;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-panel {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
    top: 0;
  }
  
  .content-area {
    padding: 15px;
    margin-left: 0;
  }
}
</style> 