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
          
          <!-- 게임 모드 관리 섹션 추가 -->
          <div class="game-mode-management">
            <h2>게임 모드 관리</h2>
            <div class="game-modes-list">
              <div v-for="mode in gameModes" :key="mode.id" class="game-mode-item">
                <div class="mode-info">
                  <div class="mode-icon" :class="mode.color">
                    <i class="fas" :class="mode.icon"></i>
                  </div>
                  <div class="mode-details">
                    <h3>{{ mode.name }}</h3>
                    <p>{{ mode.description }}</p>
                  </div>
                </div>
                <div class="mode-actions">
                  <div class="mode-status" :class="{ 'active': mode.isActive }">
                    {{ mode.isActive ? '활성화' : '비활성화' }}
                  </div>
                  <div class="mode-toggle">
                    <label class="switch">
                      <input 
                        type="checkbox" 
                        :checked="mode.isActive" 
                        @change="toggleGameMode(mode)"
                      >
                      <span class="slider round"></span>
                    </label>
                  </div>
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
import AdminPanel from '@/components/admin/AdminPanel.vue';
import NavigationBar from '@/components/common/NavigationBar.vue';

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
      gameModes: [
        {
          id: 'roadview',
          name: '로드뷰 모드',
          description: '실제 거리를 둘러보며 위치를 맞추는 게임',
          icon: 'fa-street-view',
          color: 'roadview-color',
          isActive: true
        },
        {
          id: 'photo',
          name: '포토 모드',
          description: '관광지 사진으로 지역을 맞히는 게임',
          icon: 'fa-camera',
          color: 'photo-color',
          isActive: true
        },
        {
          id: 'multiplayer',
          name: '멀티플레이어 모드',
          description: '다른 플레이어들과 함께 즐기는 게임',
          icon: 'fa-users',
          color: 'multiplayer-color',
          isActive: true
        },
        {
          id: 'special',
          name: '특별 이벤트 모드',
          description: '시즌별 특별 이벤트 게임',
          icon: 'fa-star',
          color: 'special-color',
          isActive: false
        }
      ],
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
    },
    
    toggleGameMode(mode) {
      // API에서 게임 모드 상태 변경 (실제 환경에서는 서버 API 호출)
      mode.isActive = !mode.isActive;
      
      // 토스트 메시지로 상태 변경 알림
      this.$toast.success(`${mode.name}이(가) ${mode.isActive ? '활성화' : '비활성화'}되었습니다.`);
      
      // 활동 기록 추가
      this.recentActivities.unshift({
        type: 'system',
        text: `${mode.name}이(가) ${mode.isActive ? '활성화' : '비활성화'}되었습니다.`,
        time: new Date()
      });
      
      // 실제 환경에서는 최대 활동 기록 개수를 제한할 수 있습니다.
      if (this.recentActivities.length > 10) {
        this.recentActivities.pop();
      }
    }
  }
}
</script>

<style scoped>
/* 게임 모드 관리 스타일 */
.game-mode-management {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.game-modes-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.game-mode-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.mode-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.roadview-color {
  background: #dbeafe;
  color: #2563eb;
}

.photo-color {
  background: #dcfce7;
  color: #16a34a;
}

.multiplayer-color {
  background: #fef3c7;
  color: #d97706;
}

.special-color {
  background: #f5d0fe;
  color: #c026d3;
}

.mode-details h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}

.mode-details p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #64748b;
}

.mode-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mode-status {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.mode-status.active {
  color: #10b981;
}

/* Toggle Switch 스타일 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #10b981;
}

input:focus + .slider {
  box-shadow: 0 0 1px #10b981;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

@media (max-width: 768px) {
  .game-mode-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .mode-actions {
    width: 100%;
    justify-content: space-between;
  }
}

/* 기존 스타일 유지 */
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

/* 나머지 기존 스타일 유지 */
</style>