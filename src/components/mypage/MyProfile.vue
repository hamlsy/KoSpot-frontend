<template>
  <div class="my-profile-page">
    <NavigationBar />
    <div class="profile-content">
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-cover" :style="{ backgroundImage: `url(${coverImage})` }">
            <button class="edit-cover-btn">
              <i class="fas fa-camera"></i>
            </button>
          </div>
          
          <div class="profile-info">
            <div class="profile-avatar">
              <img :src="user.profileImage" alt="프로필 이미지">
              <button class="edit-avatar-btn">
                <i class="fas fa-camera"></i>
              </button>
            </div>
            
            <div class="profile-details">
              <h1 class="profile-name">{{ user.nickname }}</h1>
              <div class="profile-level">
                <span class="level-label">Lv. {{ user.level }}</span>
                <div class="level-progress">
                  <div class="progress-bar" :style="{ width: `${user.levelProgress}%` }"></div>
                </div>
                <span class="level-percentage">{{ user.levelProgress }}%</span>
              </div>
              
              <div class="profile-badges">
                <div class="badge" v-for="badge in displayedBadges" :key="badge.id">
                  <img :src="badge.image" :alt="badge.name" :title="badge.name">
                </div>
                <div class="more-badges" v-if="user.badges.length > 3">
                  +{{ user.badges.length - 3 }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="profile-body">
          <div class="stats-section">
            <h2>통계</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ formatNumber(user.totalGames) }}</div>
                <div class="stat-label">게임 횟수</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ formatNumber(user.totalScore) }}</div>
                <div class="stat-label">총 점수</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ user.winRate }}%</div>
                <div class="stat-label">승률</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ formatNumber(user.bestScore) }}</div>
                <div class="stat-label">최고 점수</div>
              </div>
            </div>
          </div>
          
          <div class="bio-section">
            <h2>자기소개</h2>
            <div class="bio-content" v-if="!editingBio">
              <p>{{ user.bio || '자기소개가 없습니다.' }}</p>
              <button class="edit-bio-btn" @click="startEditBio">
                <i class="fas fa-edit"></i> 수정
              </button>
            </div>
            <div class="bio-edit" v-else>
              <textarea v-model="editedBio" placeholder="자기소개를 입력하세요."></textarea>
              <div class="bio-actions">
                <button class="cancel-btn" @click="cancelEditBio">취소</button>
                <button class="save-btn" @click="saveBio">저장</button>
              </div>
            </div>
          </div>
          
          <div class="recent-activity">
            <h2>최근 활동</h2>
            <div class="activity-list">
              <div class="activity-item" v-for="(activity, index) in user.recentActivities" :key="index">
                <div class="activity-icon" :class="activity.type">
                  <i :class="getActivityIcon(activity.type)"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-text">{{ activity.text }}</div>
                  <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavigationBar from '../shared/NavigationBar.vue';

export default {
  name: 'MyProfile',
  components: {
    NavigationBar,
  },
  
  data() {
    return {
      coverImage: '/assets/images/default-cover.jpg',
      editingBio: false,
      editedBio: '',
      user: {
        id: '1',
        nickname: '코스팟마스터',
        level: 42,
        levelProgress: 75,
        profileImage: '/assets/avatars/default.png',
        bio: '안녕하세요! 한국의 구석구석을 탐험하는 것을 좋아하는 여행 마니아입니다. 특히 서울과 부산 지역에 관심이 많습니다.',
        totalGames: 248,
        totalScore: 157890,
        winRate: 64,
        bestScore: 9750,
        badges: [
          { id: 'b1', name: '서울 마스터', image: '/assets/badges/seoul.png' },
          { id: 'b2', name: '제주 탐험가', image: '/assets/badges/jeju.png' },
          { id: 'b3', name: '단골 플레이어', image: '/assets/badges/regular.png' },
          { id: 'b4', name: '포인트 수집가', image: '/assets/badges/collector.png' },
          { id: 'b5', name: '사진 감상가', image: '/assets/badges/photographer.png' }
        ],
        recentActivities: [
          { 
            type: 'game', 
            text: '지역 모드에서 새 개인 기록을 세웠습니다 - 9,750점', 
            timestamp: new Date(2023, 8, 25, 18, 30) 
          },
          { 
            type: 'badge', 
            text: '새 배지를 획득했습니다 - 서울 마스터', 
            timestamp: new Date(2023, 8, 23, 14, 15) 
          },
          { 
            type: 'level', 
            text: '레벨 42에 도달했습니다', 
            timestamp: new Date(2023, 8, 22, 10, 45) 
          },
          { 
            type: 'friend', 
            text: '여행마니아님과 친구가 되었습니다', 
            timestamp: new Date(2023, 8, 20, 9, 10) 
          }
        ]
      }
    };
  },
  
  computed: {
    displayedBadges() {
      return this.user.badges.slice(0, 3);
    }
  },
  
  methods: {
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    formatTime(timestamp) {
      const now = new Date();
      const diff = now - timestamp;
      
      // 1분 이내
      if (diff < 60 * 1000) {
        return '방금 전';
      }
      
      // 1시간 이내
      if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes}분 전`;
      }
      
      // 1일 이내
      if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours}시간 전`;
      }
      
      // 1주일 이내
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days}일 전`;
      }
      
      // 날짜 표시
      const date = timestamp;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    },
    
    getActivityIcon(type) {
      switch (type) {
        case 'game': return 'fas fa-gamepad';
        case 'badge': return 'fas fa-certificate';
        case 'level': return 'fas fa-chart-line';
        case 'friend': return 'fas fa-user-friends';
        default: return 'fas fa-star';
      }
    },
    
    startEditBio() {
      this.editedBio = this.user.bio;
      this.editingBio = true;
    },
    
    cancelEditBio() {
      this.editingBio = false;
    },
    
    saveBio() {
      this.user.bio = this.editedBio;
      this.editingBio = false;
    }
  }
};
</script>

<style scoped>
.my-profile-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.profile-content {
  padding-top: 80px; /* 네비게이션바 높이만큼 여백 */
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.profile-container {
  background: #f5f7fa;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.profile-header {
  position: relative;
}

.profile-cover {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.edit-cover-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-cover-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.profile-info {
  display: flex;
  padding: 20px;
  background: white;
  position: relative;
  margin-top: -60px;
}

.profile-avatar {
  position: relative;
  margin-right: 20px;
}

.profile-avatar img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  object-fit: cover;
  background: #f0f2f5;
}

.edit-avatar-btn {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.edit-avatar-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.profile-details {
  flex: 1;
  padding-top: 15px;
}

.profile-name {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
  color: #333;
}

.profile-level {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.level-label {
  font-weight: 600;
  color: #4285F4;
  margin-right: 10px;
}

.level-progress {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, #4285F4, #5C6BC0);
  border-radius: 4px;
}

.level-percentage {
  font-size: 0.85rem;
  color: #666;
}

.profile-badges {
  display: flex;
  align-items: center;
}

.badge {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.badge img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.more-badges {
  width: 40px;
  height: 40px;
  background: #f0f2f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
}

.profile-body {
  padding: 20px;
  background: white;
}

.stats-section, .bio-section, .recent-activity {
  margin-bottom: 30px;
}

.stats-section h2, .bio-section h2, .recent-activity h2 {
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.stat-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.bio-content {
  position: relative;
}

.bio-content p {
  color: #333;
  line-height: 1.6;
  margin: 0;
  padding-right: 40px;
}

.edit-bio-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  color: #4285F4;
  cursor: pointer;
  font-size: 0.9rem;
}

.bio-edit textarea {
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 1rem;
  margin-bottom: 10px;
}

.bio-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn, .save-btn {
  padding: 8px 15px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #f0f2f5;
  color: #333;
  border: none;
}

.save-btn {
  background: #4285F4;
  color: white;
  border: none;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.activity-icon.game {
  background: #E8F5E9;
  color: #4CAF50;
}

.activity-icon.badge {
  background: #FFF8E1;
  color: #FFC107;
}

.activity-icon.level {
  background: #E3F2FD;
  color: #2196F3;
}

.activity-icon.friend {
  background: #F3E5F5;
  color: #9C27B0;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #333;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 0.85rem;
  color: #999;
}

@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .profile-avatar {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .profile-level {
    justify-content: center;
  }
  
  .profile-badges {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 