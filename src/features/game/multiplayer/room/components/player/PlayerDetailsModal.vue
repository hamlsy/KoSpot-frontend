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
/* ── 오버레이 ── */
.player-details-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

/* ── 모달 컨테이너 ── */
.player-details-modal {
  position: relative;
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(76, 201, 207, 0.15);
}

/* ── 데스크톱: 여유로운 크기 ── */
@media (min-width: 640px) {
  .player-details-modal {
    max-width: 480px;
  }

  .profile-header {
    padding: 26px 28px 20px;
  }

  .marker-wrapper {
    width: 68px;
    height: 68px;
  }

  .nickname {
    font-size: 19px;
  }

  .streak-badge {
    font-size: 12px;
    padding: 4px 11px;
  }

  .rank-card-header {
    padding: 12px 28px 0;
  }

  .rank-card-body {
    padding: 12px 28px 16px;
  }

  .tier-icon {
    width: 42px;
    height: 42px;
    font-size: 16px;
  }

  .tier-name {
    font-size: 15px;
  }

  .tier-level {
    font-size: 13px;
  }

  .rank-stat-item {
    padding: 0 16px;
  }

  .rank-stat-item .stat-value {
    font-size: 17px;
  }

  .rank-stat-item .stat-label {
    font-size: 11px;
  }

  .multi-stat-card {
    padding: 16px 28px;
    gap: 12px;
  }

  .multi-stat-icon {
    width: 38px;
    height: 38px;
    font-size: 14px;
  }

  .multi-stat-value {
    font-size: 20px;
  }

  .multi-stat-label {
    font-size: 11px;
  }

  .join-date-section {
    padding: 13px 28px;
    font-size: 13px;
  }
}

/* ── 닫기 버튼 ── */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  transition: background 0.18s, color 0.18s;
  z-index: 10;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background: #fff;
  color: #111827;
}

/* ── 로딩 상태 ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
}

.loading-spinner {
  font-size: 26px;
  color: #4cc9cf;
}

.loading-text {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

/* ── 에러 상태 ── */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
  text-align: center;
}

.error-icon {
  font-size: 26px;
  color: #f59e0b;
}

.error-text {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: #4cc9cf;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s;
}

.retry-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 201, 207, 0.4);
}

/* ── 프로필 헤더 ── */
.profile-header {
  position: relative;
  padding: 22px 20px 16px;
}

/* accent bar: profile-header-bg 재활용 */
.profile-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #52DEE5 0%, #EEE5E9 100%);
}

.profile-header-bg::after {
  display: none;
}

.profile-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 1;
}

/* ── 마커 이미지 ── */
.marker-wrapper {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.marker-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

.host-crown {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
  border: 2px solid #fff;
}

.host-crown i {
  font-size: 9px;
  color: #fff;
}

/* ── 프로필 정보 ── */
.profile-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.nickname {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  margin: 0 28px 5px 0; /* right margin for close btn */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  background: rgba(76, 201, 207, 0.08);
  border: 1px solid rgba(76, 201, 207, 0.22);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #0891b2;
}

.streak-badge i {
  color: #f59e0b;
  font-size: 10px;
}

/* ── 랭크 카드 ── */
.rank-card {
  margin: 0;
  background: rgba(76, 201, 207, 0.03);
  border-top: 1px solid rgba(76, 201, 207, 0.1);
  border-bottom: 1px solid rgba(76, 201, 207, 0.1);
  border-radius: 0;
  overflow: visible;
}

.rank-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px 0;
}

.rank-mode-icon {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: #4cc9cf;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  flex-shrink: 0;
}

.rank-mode-title {
  font-size: 10px;
  font-weight: 700;
  color: #4cc9cf;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

/* rank-card-body: tier badge + stats 한 줄 */
.rank-card-body {
  display: flex;
  align-items: center;
  padding: 10px 20px 14px;
  gap: 0;
}

/* ── 티어 배지 ── */
.tier-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding: 0;
  background: none;
  box-shadow: none;
  margin-bottom: 0;
}

.tier-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #fff;
  flex-shrink: 0;
}

.tier-info {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 4px;
}

.tier-name {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.tier-level {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

/* 티어별 아이콘 색상 */
.tier-bronze .tier-icon  { background: linear-gradient(135deg, #92400e, #b45309); }
.tier-silver .tier-icon  { background: linear-gradient(135deg, #64748b, #94a3b8); }
.tier-gold .tier-icon    { background: linear-gradient(135deg, #ca8a04, #eab308); }
.tier-platinum .tier-icon{ background: linear-gradient(135deg, #0891b2, #06b6d4); }
.tier-diamond .tier-icon { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }
.tier-master .tier-icon  { background: linear-gradient(135deg, #7c3aed, #a855f7); }

/* ── 랭크 통계 (tier badge 우측) ── */
.rank-stats-grid {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
  background: none;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
}

.rank-stat-item {
  flex: none;
  text-align: center;
  padding: 0 14px;
}

.rank-stat-divider {
  width: 1px;
  height: 26px;
  background: rgba(76, 201, 207, 0.2);
  margin: 0;
}

.rank-stat-item .stat-value {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.rank-stat-item .stat-label {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
  white-space: nowrap;
}

/* ── 멀티 통계 ── */
.multi-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin: 0;
}

.multi-stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #fff;
  border-radius: 0;
  border: none;
}

.multi-stat-card:first-child {
  border-right: 1px solid rgba(76, 201, 207, 0.1);
}

.multi-stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.multi-stat-icon.games {
  background: rgba(76, 201, 207, 0.1);
  color: #4cc9cf;
}

.multi-stat-icon.wins {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.multi-stat-content { flex: 1; min-width: 0; }

.multi-stat-value {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.multi-stat-label {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 1px;
}

/* ── 가입일 ── */
.join-date-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 20px;
  margin: 0;
  border-top: 1px solid rgba(76, 201, 207, 0.1);
  background: #fff;
  font-size: 12px;
  color: #9ca3af;
  border-radius: 0;
}

.join-date-section i {
  color: #4cc9cf;
  font-size: 11px;
}

/* ── 애니메이션 ── */
.modal-fade-enter-active {
  transition: opacity 0.22s ease;
}
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .player-details-modal {
  transition: transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.22s ease;
}
.modal-fade-leave-active .player-details-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from .player-details-modal {
  transform: scale(0.96) translateY(10px);
  opacity: 0;
}
.modal-fade-leave-to .player-details-modal {
  transform: scale(0.96);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-fade-enter-active .player-details-modal,
  .modal-fade-leave-active .player-details-modal {
    transition-duration: 0.01ms;
  }
}

/* ── 모바일 (≤480px) ── */
@media (max-width: 480px) {
  .player-details-overlay {
    padding: 12px;
  }

  .profile-header {
    padding: 20px 16px 14px;
  }

  .marker-wrapper {
    width: 48px;
    height: 48px;
  }

  .nickname {
    font-size: 15px;
  }

  .rank-card-header {
    padding: 10px 16px 0;
  }

  .rank-card-body {
    padding: 10px 16px 12px;
  }

  .rank-stat-item {
    padding: 0 10px;
  }

  .rank-stat-item .stat-value {
    font-size: 13px;
  }

  .multi-stat-card {
    padding: 12px 16px;
  }

  .join-date-section {
    padding: 10px 16px;
  }
}

/* ── 소형 모바일 (≤359px): rank row wrap ── */
@media (max-width: 359px) {
  .rank-card-body {
    flex-wrap: wrap;
    gap: 8px;
  }

  .rank-stats-grid {
    width: 100%;
    justify-content: flex-start;
    padding-left: 44px;
  }
}

/* ── landscape 안전망 ── */
@media (max-height: 500px) {
  .player-details-modal {
    max-height: 90vh;
    overflow-y: auto;
  }
}
</style>
