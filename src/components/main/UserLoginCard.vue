<template>
  <div class="user-card">
    <!-- 로그인된 경우 사용자 정보 표시 -->
    <div v-if="isLoggedIn" class="user-profile">
      <div class="user-avatar">
        <img :src="userProfile.avatar || '/default-avatar.png'" alt="프로필 이미지">
      </div>
      <div class="user-info">
        <h3>{{ userProfile.nickname }}</h3>
        <p>{{ userProfile.level }} 레벨</p>
        <div class="user-stats">
          <div class="user-stat">
            <span class="stat-value">{{ userProfile.rankPoints }}</span>
            <span class="stat-label">랭크 포인트</span>
          </div>
          <div class="user-stat">
            <span class="stat-value">{{ userProfile.playCount }}</span>
            <span class="stat-label">플레이 횟수</span>
          </div>
        </div>
        <button class="profile-button" @click="goToProfile">
          프로필 보기
        </button>
      </div>
    </div>

    <!-- 로그인되지 않은 경우 로그인 버튼 표시 -->
    <div v-else class="login-section">
      <h3>로그인하고 게임을 즐겨보세요!</h3>
      <p>로그인하면 랭킹 등록, 기록 저장 등 다양한 기능을 이용할 수 있습니다.</p>
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
      default: false
    },
    userProfile: {
      type: Object,
      default: () => ({
        nickname: "게스트",
        level: 1,
        rankPoints: 0,
        playCount: 0,
        avatar: null
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
      this.$emit('navigate', 'homePage');
    }
  }
};
</script>

<style scoped>
.user-card {
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 15px;
  border: 3px solid #4cd964;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #333;
}

.user-info p {
  color: #666;
  margin: 0 0 15px 0;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.user-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.profile-button {
  background: linear-gradient(135deg, #4cd964, #34c759);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(76, 217, 100, 0.3);
}

.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.login-section h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #333;
}

.login-section p {
  color: #666;
  margin: 0 0 10px 0;
  font-size: 0.9rem;
}

.login-button {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 500;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.15);
  width: 100%;
  margin-top: 16px;
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

.login-button::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.login-button:hover::after {
  opacity: 1;
}

@media (max-width: 768px) {
  .user-stats {
    gap: 15px;
  }
}
</style>
