<template>
  <div class="user-card" @click="isLoggedIn ? goToProfile() : null" :class="{ 'clickable': isLoggedIn }">
    <!-- 로그인된 경우 사용자 정보 표시 -->
    <div v-if="isLoggedIn" class="user-profile">
      <div class="profile-header">
        <div class="user-avatar">
          <img 
            :src="userProfile.avatar || userProfile.equippedMarkerImageUrl" 
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

      <div class="user-highlights">
        <div class="highlight-card">
          <div class="highlight-icon">
            <i class="fas fa-coins"></i>
          </div>
          <div class="highlight-text">
            <span class="highlight-label">보유 포인트</span>
            <span class="highlight-value">
              <template v-if="formattedPoint !== null">{{ formattedPoint }}P</template>
              <template v-else>포인트 없음</template>
            </span>
          </div>
        </div>

        <div class="highlight-card">
          <div class="highlight-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="highlight-text">
            <span class="highlight-label">마지막 플레이</span>
            <span class="highlight-value">
              <template v-if="formattedLastPlayed !== null">{{ formattedLastPlayed }}</template>
              <template v-else>기록 없음</template>
            </span>
          </div>
        </div>
      </div>
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
        marker: "",
        currentPoint: 0,
        lastPlayedAt: null
      })
    }
  },
  computed: {
    formattedPoint() {
      const point = this.userProfile?.currentPoint;
      if (point === undefined || point === null) {
        return null;
      }
      const formatter = new Intl.NumberFormat('ko-KR');
      return formatter.format(point);
    },
    formattedLastPlayed() {
      const lastPlayed = this.userProfile?.lastPlayedAt;
      if (!lastPlayed) {
        return null;
      }
      const parsedDate = new Date(lastPlayed);
      if (Number.isNaN(parsedDate.getTime())) {
        return null;
      }
      return parsedDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
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
      event.target.src = '';
    }
  }
};
</script>

<style scoped>
.user-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all var(--transition-normal);
  min-height: 180px;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  background-color: var(--color-surface-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  position: relative;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  overflow: hidden;
  background: var(--color-surface-hover);
  border: 2px solid var(--color-primary);
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.user-name-level {
  margin-left: var(--spacing-md);
  text-align: left;
  flex-grow: 1;
}

.user-name-level h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 600;
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.user-name-level p {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: var(--font-size-small);
}

.user-email {
  font-size: var(--font-size-tiny) !important;
  color: var(--color-text-tertiary) !important;
}

.logout-button {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: absolute;
  right: 0;
  top: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-small);
}

.logout-button i {
  margin-right: var(--spacing-xs);
}

.logout-button:hover {
  background-color: var(--color-surface-hover);
  color: var(--color-error);
}

.user-highlights {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.highlight-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  transition: all var(--transition-normal);
}

.highlight-card:hover {
  border-color: var(--color-primary);
}

.highlight-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  flex-shrink: 0;
}

.highlight-icon i {
  font-size: 1rem;
}

.highlight-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.highlight-label {
  font-size: var(--font-size-tiny);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.highlight-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--color-text-primary);
}

.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-md);
}

.login-section h3 {
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 600;
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-text-primary);
}

.login-section p {
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-small);
}

.login-button {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-xl);
  font-weight: 600;
  font-size: var(--font-size-body);
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: var(--shadow-sm);
  width: 100%;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  background: var(--color-primary-dark);
}

.login-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 768px) {
  .user-avatar {
    width: 48px;
    height: 48px;
  }
  
  .user-name-level h3 {
    font-size: var(--font-size-body);
    max-width: 100px;
  }
  
  .user-highlights {
    flex-direction: column;
  }
}
</style>
