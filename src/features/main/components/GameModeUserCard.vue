<template>
  <div class="mode-card user-login-card">
    <!-- 로그인된 경우 사용자 정보 표시 -->
    <div v-if="isLoggedIn" class="user-profile">
      <div class="user-avatar">
        <img :src="userProfile.avatar || '/default-avatar.png'" alt="프로필 이미지">
      </div>
      <div class="user-info">
        <h3>{{ userProfile.name || userProfile.nickname }}</h3>
        <p>{{ userProfile.level }} 레벨</p>
        <div class="user-stats">
          <div class="user-stat">
            <span class="stat-value">{{ userProfile.rankPoints || 0 }}</span>
            <span class="stat-label">랭크 포인트</span>
          </div>
          <div class="user-stat">
            <span class="stat-value">{{ userProfile.playCount || 0 }}</span>
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
      <div class="social-login-buttons">
        <button class="social-login-btn kakao" @click="socialLogin('kakao')">
          <i class="fas fa-comment"></i> 카카오 로그인
        </button>
        <button class="social-login-btn google" @click="socialLogin('google')">
          <i class="fab fa-google"></i> 구글 로그인
        </button>
        <button class="social-login-btn naver" @click="socialLogin('naver')">
          <i class="fas fa-n"></i> 네이버 로그인
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GameModeUserCard",
  props: {
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    userProfile: {
      type: Object,
      default: () => ({
        name: "게스트",
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
    }
  }
};
</script>

<style scoped>
.user-login-card {
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.user-login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 16px;
  border: 3px solid #e5e7eb;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  width: 100%;
}

.user-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.user-info p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.user-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #2563eb;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.profile-button {
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.profile-button:hover {
  background-color: #1d4ed8;
}

.login-section {
  padding: 20px;
  text-align: center;
}

.login-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.login-section p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.social-login-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.social-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.social-login-btn:hover {
  opacity: 0.9;
}

.social-login-btn i {
  margin-right: 8px;
}

.kakao {
  background-color: #FEE500;
  color: #000000;
}

.google {
  background-color: #ffffff;
  color: #4285F4;
  border: 1px solid #dadce0;
}

.naver {
  background-color: #03C75A;
  color: #ffffff;
}
</style>
