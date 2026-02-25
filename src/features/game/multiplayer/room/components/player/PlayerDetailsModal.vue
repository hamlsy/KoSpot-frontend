<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div 
        v-if="isActive"
        class="player-details-overlay"
        @click.self="$emit('close')"
      >
        <div class="player-details-modal">
          <!-- 닫기 버튼 -->
          <button class="close-btn" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>

          <!-- 로딩 상태 -->
          <div v-if="isLoading" class="loading-state">
            <div class="loading-spinner">
              <i class="fas fa-circle-notch fa-spin"></i>
            </div>
            <p class="loading-text">플레이어 정보를 불러오는 중...</p>
          </div>

          <!-- 에러 상태 -->
          <div v-else-if="loadError" class="error-state">
            <div class="error-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p class="error-text">{{ loadError }}</p>
            <button class="retry-btn" @click="fetchPlayerData">
              <i class="fas fa-redo"></i>
              다시 시도
            </button>
          </div>

          <!-- 플레이어 정보 -->
          <template v-else-if="playerData">
            <!-- 프로필 헤더 -->
            <div class="profile-header">
              <div class="profile-header-bg"></div>
              <div class="profile-content">
                <!-- 마커 이미지 -->
                <div class="marker-wrapper">
                  <img 
                    :src="playerData.equippedMarkerImageUrl || '/images/default-marker.png'" 
                    :alt="playerData.nickname"
                    class="marker-image"
                  />
                  <div v-if="player?.isHost" class="host-crown">
                    <i class="fas fa-crown"></i>
                  </div>
                </div>

                <!-- 플레이어 정보 -->
                <div class="profile-info">
                  <h2 class="nickname">{{ playerData.nickname }}</h2>
                  <div v-if="playerData.playStreak > 0" class="streak-badge">
                    <i class="fas fa-fire"></i>
                    <span>{{ playerData.playStreak }}일 연속 플레이</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 로드뷰 랭크 카드 -->
            <div class="rank-card">
              <div class="rank-card-header">
                <div class="rank-mode-icon">
                  <i class="fas fa-street-view"></i>
                </div>
                <span class="rank-mode-title">로드뷰 랭크</span>
              </div>

              <div class="rank-card-body">
                <!-- 티어 뱃지 -->
                <div 
                  class="tier-badge"
                  :class="getTierClass(playerData.rankInfo?.roadView?.rankTier)"
                >
                  <div class="tier-icon">
                    <i :class="getTierIcon(playerData.rankInfo?.roadView?.rankTier)"></i>
                  </div>
                  <div class="tier-info">
                    <span class="tier-name">{{ formatTierName(playerData.rankInfo?.roadView?.rankTier) }}</span>
                    <span class="tier-level">{{ formatTierLevel(playerData.rankInfo?.roadView?.rankLevel) }}</span>
                  </div>
                </div>

                <!-- 랭크 통계 -->
                <div class="rank-stats-grid">
                  <div class="rank-stat-item">
                    <div class="stat-value">{{ formatNumber(playerData.rankInfo?.roadView?.ratingScore || 0) }}</div>
                    <div class="stat-label">레이팅</div>
                  </div>
                  <div class="rank-stat-divider"></div>
                  <div class="rank-stat-item">
                    <div class="stat-value">{{ formatNumber(Math.round(playerData.rankInfo?.roadView?.rankAvgScore || 0)) }}</div>
                    <div class="stat-label">평균 점수</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 멀티플레이 통계 -->
            <div class="multi-stats">
              <div class="multi-stat-card">
                <div class="multi-stat-icon games">
                  <i class="fas fa-gamepad"></i>
                </div>
                <div class="multi-stat-content">
                  <div class="multi-stat-value">{{ playerData.multiGameStats?.roadView?.totalGames || 0 }}</div>
                  <div class="multi-stat-label">멀티 게임</div>
                </div>
              </div>

              <div class="multi-stat-card">
                <div class="multi-stat-icon wins">
                  <i class="fas fa-trophy"></i>
                </div>
                <div class="multi-stat-content">
                  <div class="multi-stat-value">{{ playerData.multiGameStats?.roadView?.firstPlaceCount || 0 }}</div>
                  <div class="multi-stat-label">1위 횟수</div>
                </div>
              </div>
            </div>

            <!-- 가입일 -->
            <div class="join-date-section">
              <i class="fas fa-calendar-alt"></i>
              <span>{{ formatJoinDate(playerData.joinedAt) }} 가입</span>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { memberService } from '../../services/member.service.js';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  player: {
    type: Object,
    default: null
  },
  isHost: {
    type: Boolean,
    default: false
  },
  currentUserId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'kick']);

// 상태 관리
const isLoading = ref(false);
const loadError = ref(null);
const playerData = ref(null);

// 모달이 열릴 때 API 호출
watch(() => props.isActive, async (newValue) => {
  if (newValue && props.player) {
    await fetchPlayerData();
  } else if (!newValue) {
    // 모달이 닫힐 때 상태 초기화
    playerData.value = null;
    loadError.value = null;
  }
}, { immediate: true });

// 플레이어 데이터 가져오기
const fetchPlayerData = async () => {
  if (!props.player) return;
  
  const memberId = props.player.memberId || props.player.id;
  if (!memberId) {
    loadError.value = '플레이어 ID를 찾을 수 없습니다.';
    return;
  }

  isLoading.value = true;
  loadError.value = null;

  try {
    const data = await memberService.getPlayerSummary(memberId);
    playerData.value = data;
  } catch (error) {
    console.error('플레이어 정보 로드 실패:', error);
    loadError.value = error.message || '플레이어 정보를 불러오는데 실패했습니다.';
  } finally {
    isLoading.value = false;
  }
};

// 티어 클래스 반환
const getTierClass = (tier) => {
  if (!tier) return 'tier-bronze';
  return `tier-${tier.toLowerCase()}`;
};

// 티어 아이콘 반환
const getTierIcon = (tier) => {
  const icons = {
    'BRONZE': 'fas fa-medal',
    'SILVER': 'fas fa-medal',
    'GOLD': 'fas fa-medal',
    'PLATINUM': 'fas fa-gem',
    'DIAMOND': 'fas fa-gem',
    'MASTER': 'fas fa-crown'
  };
  return icons[tier] || 'fas fa-medal';
};

// 티어 이름 포맷팅
const formatTierName = (tier) => {
  const names = {
    'BRONZE': '브론즈',
    'SILVER': '실버',
    'GOLD': '골드',
    'PLATINUM': '플래티넘',
    'DIAMOND': '다이아몬드',
    'MASTER': '마스터'
  };
  return names[tier] || '언랭크';
};

// 티어 레벨 포맷팅 (영문 레벨 -> 로마 숫자)
const formatTierLevel = (level) => {
  if (!level) return 'I';
  
  // 영문 레벨 매핑 (ONE, TWO, THREE, FOUR, FIVE)
  const levelMap = {
    'ONE': 'I',
    'TWO': 'II',
    'THREE': 'III',
    'FOUR': 'IV',
    'FIVE': 'V'
  };
  
  // 영문 레벨인 경우
  if (levelMap[level.toUpperCase()]) {
    return levelMap[level.toUpperCase()];
  }
  
  // 숫자인 경우 (fallback)
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
  const levelNum = parseInt(level);
  if (!isNaN(levelNum) && levelNum >= 1 && levelNum <= 5) {
    return romanNumerals[levelNum - 1];
  }
  
  return level.toString();
};

// 숫자 포맷팅 (천 단위 콤마)
const formatNumber = (num) => {
  return num.toLocaleString('ko-KR');
};

// 가입일 포맷팅
const formatJoinDate = (dateString) => {
  if (!dateString) return '알 수 없음';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (e) {
    return '알 수 없음';
  }
};
</script>

<style scoped>
/* 모달 오버레이 */
.player-details-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  transform: translateZ(0);
  contain: paint;
}

/* 모달 컨테이너 */
.player-details-modal {
  position: relative;
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  contain: layout paint;
}

/* 닫기 버튼 */
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background: #ffffff;
  color: #1f2937;
  transform: scale(1.05);
}

/* 로딩 상태 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.loading-spinner {
  font-size: 2.5rem;
  color: var(--color-primary, #0ea5e9);
}

.loading-text {
  color: #64748b;
  font-size: 0.95rem;
}

/* 에러 상태 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  text-align: center;
}

.error-icon {
  font-size: 2.5rem;
  color: #f59e0b;
}

.error-text {
  color: #64748b;
  font-size: 0.95rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary, #0ea5e9);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: var(--color-primary-dark, #0284c7);
  transform: translateY(-1px);
}

/* 프로필 헤더 */
.profile-header {
  position: relative;
  padding: 2rem 1.5rem 1.5rem;
  overflow: hidden;
}

.profile-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0284c7 100%);
  opacity: 0.95;
}

.profile-header-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 40%);
}

.profile-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* 마커 이미지 */
.marker-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
}

.marker-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
}

.host-crown {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  border: 2px solid white;
}

.host-crown i {
  font-size: 0.75rem;
  color: white;
}

/* 프로필 정보 */
.profile-info {
  text-align: center;
}

.nickname {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

.streak-badge i {
  color: #fbbf24;
}

/* 랭크 카드 */
.rank-card {
  margin: 1.25rem;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.rank-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%);
  border-bottom: 1px solid #e2e8f0;
}

.rank-mode-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-primary, #0ea5e9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.rank-mode-title {
  font-weight: 600;
  font-size: 1rem;
  color: #1f2937;
}

.rank-card-body {
  padding: 1.25rem;
}

/* 티어 뱃지 */
.tier-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tier-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  flex-shrink: 0;
}

.tier-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.tier-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
}

.tier-level {
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
}

/* 티어별 색상 */
.tier-bronze .tier-icon {
  background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
}

.tier-silver .tier-icon {
  background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
}

.tier-gold .tier-icon {
  background: linear-gradient(135deg, #ca8a04 0%, #eab308 100%);
}

.tier-platinum .tier-icon {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
}

.tier-diamond .tier-icon {
  background: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%);
}

.tier-master .tier-icon {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
}

/* 랭크 통계 그리드 */
.rank-stats-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.rank-stat-item {
  flex: 1;
  text-align: center;
}

.rank-stat-divider {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
  margin: 0 1rem;
}

.rank-stat-item .stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.rank-stat-item .stat-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.25rem;
}

/* 멀티플레이 통계 */
.multi-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin: 0 1.25rem 1.25rem;
}

.multi-stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.multi-stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.multi-stat-icon.games {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: #6366f1;
}

.multi-stat-icon.wins {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.1) 100%);
  color: #f59e0b;
}

.multi-stat-content {
  flex: 1;
  min-width: 0;
}

.multi-stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.multi-stat-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.15rem;
}

/* 가입일 섹션 */
.join-date-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  margin: 0 1.25rem 1.25rem;
  background: #f1f5f9;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #64748b;
}

.join-date-section i {
  color: var(--color-primary, #0ea5e9);
}

/* 모달 애니메이션 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
  will-change: opacity;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .player-details-modal,
.modal-fade-leave-active .player-details-modal {
  transition: transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.22s ease;
  will-change: transform, opacity;
}

.modal-fade-enter-from .player-details-modal,
.modal-fade-leave-to .player-details-modal {
  transform: translate3d(0, 10px, 0) scale(0.96);
  opacity: 0;
}

.modal-fade-enter-to .player-details-modal,
.modal-fade-leave-from .player-details-modal {
  transform: translate3d(0, 0, 0) scale(1);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-fade-enter-active .player-details-modal,
  .modal-fade-leave-active .player-details-modal {
    transition-duration: 0.01ms;
  }
}

/* 스크롤바 스타일링 */
.player-details-modal::-webkit-scrollbar {
  width: 6px;
}

.player-details-modal::-webkit-scrollbar-track {
  background: transparent;
}

.player-details-modal::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.player-details-modal::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 반응형 - 태블릿 */
@media (max-width: 768px) {
  .player-details-modal {
    max-width: 360px;
  }

  .marker-wrapper {
    width: 80px;
    height: 80px;
  }

  .nickname {
    font-size: 1.35rem;
  }

  .tier-icon {
    width: 44px;
    height: 44px;
  }

  .tier-name {
    font-size: 1rem;
  }

  .rank-stat-item .stat-value {
    font-size: 1.2rem;
  }
}

/* 반응형 - 모바일 */
@media (max-width: 480px) {
  .player-details-overlay {
    padding: 0.75rem;
  }

  .player-details-modal {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 16px;
  }

  .profile-header {
    padding: 1.5rem 1rem 1.25rem;
  }

  .marker-wrapper {
    width: 72px;
    height: 72px;
  }

  .nickname {
    font-size: 1.25rem;
  }

  .streak-badge {
    font-size: 0.8rem;
    padding: 0.35rem 0.7rem;
  }

  .rank-card {
    margin: 1rem;
  }

  .rank-card-header {
    padding: 0.85rem 1rem;
  }

  .rank-card-body {
    padding: 1rem;
  }

  .tier-badge {
    padding: 0.85rem;
    gap: 0.75rem;
  }

  .tier-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }

  .tier-name {
    font-size: 0.95rem;
  }

  .rank-stats-grid {
    padding: 0.85rem;
  }

  .rank-stat-item .stat-value {
    font-size: 1.1rem;
  }

  .multi-stats {
    margin: 0 1rem 1rem;
    gap: 0.6rem;
  }

  .multi-stat-card {
    padding: 0.85rem;
    gap: 0.6rem;
  }

  .multi-stat-icon {
    width: 38px;
    height: 38px;
    font-size: 0.9rem;
  }

  .multi-stat-value {
    font-size: 1.1rem;
  }

  .join-date-section {
    margin: 0 1rem 1rem;
    padding: 0.85rem;
    font-size: 0.85rem;
  }
}

/* 다크모드에서도 모달은 항상 라이트 테마 유지 */
</style>
