<template>
  <div class="admin-page">
    <NavigationBar />
    <div class="admin-content">
      <AdminPanel>
        <div class="admin-dashboard">
          <h1 class="dashboard-title">관리자 대시보드</h1>
          
          <div class="stats-container">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-content">
                <h3>총 사용자</h3>
                <p class="stat-value">{{ formatNumber(stats.totalUsers) }}</p>
                <p class="stat-change" :class="stats.userChange >= 0 ? 'positive' : 'negative'">
                  <i class="fas" :class="stats.userChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i> 
                  {{ Math.abs(stats.userChange) }}%
                </p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-gamepad"></i>
              </div>
              <div class="stat-content">
                <h3>활성 게임</h3>
                <p class="stat-value">{{ formatNumber(stats.activeGames) }}</p>
                <p class="stat-change" :class="stats.gameChange >= 0 ? 'positive' : 'negative'">
                  <i class="fas" :class="stats.gameChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i> 
                  {{ Math.abs(stats.gameChange) }}%
                </p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-user-plus"></i>
              </div>
              <div class="stat-content">
                <h3>신규 가입</h3>
                <p class="stat-value">{{ formatNumber(stats.newUsers) }}</p>
                <p class="stat-change" :class="stats.newUserChange >= 0 ? 'positive' : 'negative'">
                  <i class="fas" :class="stats.newUserChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i> 
                  {{ Math.abs(stats.newUserChange) }}%
                </p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-coins"></i>
              </div>
              <div class="stat-content">
                <h3>총 수익</h3>
                <p class="stat-value">{{ formatNumber(stats.revenue) }}원</p>
                <p class="stat-change" :class="stats.revenueChange >= 0 ? 'positive' : 'negative'">
                  <i class="fas" :class="stats.revenueChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i> 
                  {{ Math.abs(stats.revenueChange) }}%
                </p>
              </div>
            </div>
          </div>
          
          <div class="admin-sections">
            <div class="recent-activities">
              <div class="section-header">
                <h2>최근 활동</h2>
                <button class="view-all-btn">모두 보기</button>
              </div>
              <div class="activity-list">
                <div v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
                  <div class="activity-icon" :class="activity.type">
                    <i class="fas" :class="getActivityIcon(activity.type)"></i>
                  </div>
                  <div class="activity-content">
                    <p class="activity-text">{{ activity.text }}</p>
                    <p class="activity-time">{{ formatTime(activity.time) }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="quick-actions">
              <h2>빠른 작업</h2>
              <div class="action-buttons">
                <router-link to="/admin/users" class="action-button">
                  <i class="fas fa-user-cog"></i>
                  <span>사용자 관리</span>
                </router-link>
                <button class="action-button">
                  <i class="fas fa-gamepad"></i>
                  <span>게임 관리</span>
                </button>
                <button class="action-button">
                  <i class="fas fa-shopping-cart"></i>
                  <span>상점 관리</span>
                </button>
                <button class="action-button">
                  <i class="fas fa-chart-line"></i>
                  <span>통계 보기</span>
                </button>
                <button class="action-button">
                  <i class="fas fa-cog"></i>
                  <span>설정</span>
                </button>
                <button class="action-button">
                  <i class="fas fa-database"></i>
                  <span>데이터 백업</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="system-status">
            <h2>시스템 상태</h2>
            <div class="status-grid">
              <div class="status-item">
                <div class="status-icon">
                  <i class="fas fa-server"></i>
                </div>
                <div class="status-content">
                  <h3>서버 상태</h3>
                  <p class="status-value online">정상</p>
                </div>
              </div>
              
              <div class="status-item">
                <div class="status-icon">
                  <i class="fas fa-database"></i>
                </div>
                <div class="status-content">
                  <h3>데이터베이스</h3>
                  <p class="status-value online">정상</p>
                </div>
              </div>
              
              <div class="status-item">
                <div class="status-icon">
                  <i class="fas fa-memory"></i>
                </div>
                <div class="status-content">
                  <h3>메모리 사용량</h3>
                  <p class="status-value">64%</p>
                </div>
              </div>
              
              <div class="status-item">
                <div class="status-icon">
                  <i class="fas fa-microchip"></i>
                </div>
                <div class="status-content">
                  <h3>CPU 사용량</h3>
                  <p class="status-value">23%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminPanel>
    </div>
  </div>
</template>

<script>
import AdminPanel from './AdminPanel.vue';
import NavigationBar from '../shared/NavigationBar.vue';

export default {
  name: 'AdminDashboard',
  components: {
    AdminPanel,
    NavigationBar
  },
  data() {
    return {
      stats: {
        totalUsers: 5243,
        userChange: 12,
        activeGames: 143,
        gameChange: -5,
        newUsers: 278,
        newUserChange: 23,
        revenue: 1458000,
        revenueChange: 8
      },
      recentActivities: [
        { 
          type: 'user', 
          text: '김민준님이 회원가입했습니다.', 
          time: new Date(new Date().getTime() - 5 * 60000) 
        },
        { 
          type: 'game', 
          text: '새로운 멀티플레이어 게임이 시작되었습니다.', 
          time: new Date(new Date().getTime() - 12 * 60000) 
        },
        { 
          type: 'purchase', 
          text: '이서연님이 프리미엄 아이템을 구매했습니다.', 
          time: new Date(new Date().getTime() - 45 * 60000) 
        },
        { 
          type: 'system', 
          text: '시스템 업데이트가 완료되었습니다.', 
          time: new Date(new Date().getTime() - 120 * 60000) 
        },
        { 
          type: 'warning', 
          text: '비정상적인 로그인 시도가 감지되었습니다.', 
          time: new Date(new Date().getTime() - 180 * 60000) 
        }
      ]
    }
  },
  methods: {
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    formatTime(time) {
      const now = new Date();
      const diff = Math.floor((now - time) / 60000); // 분 단위로 계산
      
      if (diff < 1) return '방금 전';
      if (diff < 60) return `${diff}분 전`;
      
      const hours = Math.floor(diff / 60);
      if (hours < 24) return `${hours}시간 전`;
      
      const days = Math.floor(hours / 24);
      return `${days}일 전`;
    },
    getActivityIcon(type) {
      switch(type) {
        case 'user': return 'fa-user';
        case 'game': return 'fa-gamepad';
        case 'purchase': return 'fa-shopping-cart';
        case 'system': return 'fa-cog';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-bell';
      }
    }
  }
}
</script>

<style scoped>
.admin-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.admin-content {
  padding-top: 80px; /* 네비게이션바 높이만큼 여백 */
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.admin-dashboard {
  padding: 0;
  margin: 0;
}

.dashboard-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background-color: #4a6cf7;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 5px;
}

.stat-change {
  font-size: 12px;
  margin: 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.admin-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.recent-activities, .quick-actions {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h2 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.view-all-btn {
  background: none;
  border: none;
  color: #4a6cf7;
  font-size: 14px;
  cursor: pointer;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding-bottom: 15px;
  border-bottom: 1px solid #f1f5f9;
}

.activity-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #64748b;
}

.activity-icon.user {
  background-color: #dbeafe;
  color: #3b82f6;
}

.activity-icon.game {
  background-color: #dcfce7;
  color: #22c55e;
}

.activity-icon.purchase {
  background-color: #fef3c7;
  color: #eab308;
}

.activity-icon.system {
  background-color: #e0e7ff;
  color: #6366f1;
}

.activity-icon.warning {
  background-color: #fee2e2;
  color: #ef4444;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  margin: 0 0 4px;
  color: #334155;
}

.activity-time {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.quick-actions h2 {
  font-size: 18px;
  margin: 0 0 15px;
  color: #333;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px 10px;
  text-decoration: none;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
}

.action-button i {
  font-size: 20px;
  margin-bottom: 8px;
  color: #4a6cf7;
}

.action-button span {
  font-size: 12px;
  text-align: center;
}

.system-status {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.system-status h2 {
  font-size: 18px;
  margin: 0 0 15px;
  color: #333;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background-color: #f8fafc;
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
  color: #64748b;
}

.status-content {
  flex: 1;
}

.status-content h3 {
  font-size: 14px;
  margin: 0 0 5px;
  color: #475569;
}

.status-value {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #334155;
}

.status-value.online {
  color: #10b981;
}

.status-value.offline {
  color: #ef4444;
}

.status-value.warning {
  color: #f59e0b;
}

@media (max-width: 768px) {
  .admin-sections {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    order: -1;
  }
}
</style> 