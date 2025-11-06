<template>
  <div class="user-card" @click="isLoggedIn ? goToProfile() : null" :class="{ 'clickable': isLoggedIn }">
    <!-- 로그인된 경우 사용자 정보 표시 -->
    <div v-if="isLoggedIn" class="user-profile">
      <div class="profile-header">
        <div class="user-avatar">
          <img 
            :src="userProfile.avatar || userProfile.equippedMarkerImageUrl || '/assets/markers/default-marker.png'" 
            alt="마커 이미지"
            @error="handleImageError"
          >
        </div>
        <div class="user-name-level">
          <h3>{{ userProfile.name || userProfile.nickname || '게스트' }}</h3>
          <p v-if="userProfile.email" class="user-email">{{ userProfile.email }}</p>
        </div>
        <button class="logout-button" @click.stop="logout">
          <i class="fas fa-sign-out-alt"></i>
          <span>로그아웃</span>
        </button>
      </div>
      <!-- 통계 정보는 나중에 추가 예정 (첫 가입일, Spot 수 등) -->
    </div>

    <!-- 로그인되지 않은 경우 로그인 버튼 표시 -->
    <div v-else class="login-section">
      <h3>로그인하고 게임을 즐겨보세요!</h3>
      <p>랭킹 등록, 기록 저장 등 다양한 기능</p>
      <button class="login-button" @click="goToLogin">
        로그인하러 가기
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "UserLoginCard",
  props: {
    isLoggedIn: {
      type: Boolean,
      default: true
    },
    userProfile: {
      type: Object,
      default: () => ({
        nickname: "게스트",
        level: 1,
        photoRating: 0,
        roadRating: 0,
        playCount: 0,
        marker: "/assets/markers/default-marker.png"
      })
    }
  },
  methods: {
    goToProfile() {
      this.$emit('navigate', 'profile');
    },
    socialLogin(provider) {
      this.$emit('social-login', provider);
    },
    goToLogin() {
      this.$emit('navigate', 'loginPage');
    },
    logout() {
      this.$emit('logout');
    },
    handleImageError(event) {
      // 이미지 로드 실패 시 기본 이미지로 대체
      event.target.src = '/assets/markers/default-marker.png';
    }
  }
};
</script>

<style scoped>
.user-card {
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  max-height: 180px;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background-color: #f8fafc;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
  border: 2px solid #4cd964;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.user-name-level {
  margin-left: 12px;
  text-align: left;
  flex-grow: 1;
}

.user-name-level h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-name-level p {
  color: #000;
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.user-email {
  font-size: 0.75rem !important;
  opacity: 0.6 !important;
}

.logout-button {
  background: transparent;
  color: #000;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: absolute;
  right: 0;
  top: 0;
  padding: 4px 8px;
  font-size: 0.75rem;
}

.logout-button i {
  margin-right: 4px;
}

.logout-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* 통계 정보는 나중에 추가 예정 */
.user-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 12px;
  padding: 10px;
}

.user-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #000;
}

.stat-label {
  font-size: 0.7rem;
  color: #000;
  opacity: 0.7;
  margin-top: 2px;
}

.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px;
}

.login-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #000;
}

.login-section p {
  color: #000;
  margin: 0 0 10px 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.login-button {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.15);
  width: 100%;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(99, 102, 241, 0.2);
}

.login-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
}

@media (max-width: 768px) {
  .user-avatar {
    width: 40px;
    height: 40px;
  }
  
  .user-name-level h3 {
    font-size: 0.9rem;
    max-width: 100px;
  }
  
  .stat-value {
    font-size: 0.9rem;
  }
  
  .stat-label {
    font-size: 0.65rem;
  }
}
</style>
