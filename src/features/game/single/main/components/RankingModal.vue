<template>
  <transition name="modal-fade">
    <div v-if="show" class="ranking-modal-overlay" @click.self="close">
      <div class="ranking-modal-content">
        <div class="modal-header">
          <h2>전체 랭킹</h2>
          <button @click="close" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 티어 탭 -->
        <div class="tier-tabs">
          <button
            v-for="tier in tierList"
            :key="tier.value"
            @click="selectTier(tier.value)"
            :class="[
              'tier-tab',
              { active: selectedTier === tier.value },
              `tier-${tier.value.toLowerCase()}`,
            ]"
          >
            <span class="tier-icon">
              <i :class="getTierIcon(tier.value)"></i>
            </span>
            <span class="tier-name">{{ tier.label }}</span>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading-container">
            <i class="fas fa-spinner fa-spin"></i>
            <p>랭킹을 불러오는 중...</p>
          </div>

          <div v-else-if="error" class="error-container">
            <p>{{ error }}</p>
          </div>

          <div v-else class="ranking-content">
            <!-- 내 랭크 정보 -->
            <div v-if="myRank" class="my-rank-card">
              <div class="my-rank-header">
                <i class="fas fa-user"></i>
                <span>내 랭크</span>
              </div>
              <div class="my-rank-info">
                <div class="my-rank-tier">
                  <div
                    class="rank-badge"
                    :class="`tier-${myRank.rankTier.toLowerCase()}`"
                  >
                    <i :class="getTierIcon(myRank.rankTier)"></i>
                    <span
                      >{{ formatTierName(myRank.rankTier) }}
                      {{ formatLevel(myRank.rankLevel) }}</span
                    >
                  </div>
                </div>
                <div class="my-rank-details">
                  <div class="my-rank-item">
                    <span class="label">닉네임</span>
                    <span class="value">{{ myRank.nickname }}</span>
                  </div>
                  <div class="my-rank-item">
                    <span class="label">레이팅 점수</span>
                    <span class="value">{{
                      formatNumber(myRank.ratingScore)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 플레이어 리스트 -->
            <div class="players-list">
              <div
                v-for="(player, index) in players"
                :key="player.memberId"
                class="player-item"
                :class="{
                  'with-border': index !== players.length - 1,
                  'is-me': myRank && player.nickname === myRank.nickname,
                }"
                @click="showPlayerDetails(player)"
              >
                <div class="player-rank">
                  {{ currentPage * 20 + index + 1 }}
                </div>
                <div class="player-info">
                  <div
                    class="player-tier-badge"
                    :class="`tier-${player.rankTier.toLowerCase()}`"
                  >
                    <i :class="getTierIcon(player.rankTier)"></i>
                    <span
                      >{{ formatTierName(player.rankTier) }}
                      {{ formatLevel(player.rankLevel) }}</span
                    >
                  </div>
                  <span class="player-nickname">{{ player.nickname }}</span>
                  <span
                    v-if="myRank && player.nickname === myRank.nickname"
                    class="my-badge"
                    >나</span
                  >
                </div>
                <div class="player-rating">
                  {{ formatNumber(player.ratingScore) }}
                </div>
              </div>

              <div v-if="players.length === 0" class="no-players">
                <p>랭킹 데이터가 없습니다.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 페이징 -->
        <div v-if="!loading && !error && hasPagination" class="modal-footer">
          <div class="pagination">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 0"
              class="page-button"
            >
              <i class="fas fa-chevron-left"></i>
            </button>

            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page - 1)"
                :class="{ active: currentPage === page - 1 }"
                class="page-number"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="goToPage(currentPage + 1)"
              :disabled="!hasNextPage"
              class="page-button"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>

          <div class="pagination-info">{{ currentPage + 1 }} 페이지</div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 플레이어 상세 정보 모달 -->
  <PlayerDetailsModal
    :is-active="isPlayerDetailsOpen"
    :player="selectedPlayer"
    :is-host="false"
    :current-user-id="currentUserId"
    @close="closePlayerDetails"
  />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import rankingService from "@/features/game/shared/services/ranking.service.js";
import PlayerDetailsModal from "@/features/game/multiplayer/room/components/player/PlayerDetailsModal.vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  gameMode: {
    type: String,
    required: true,
    default: "ROADVIEW",
  },
  initialRankTier: {
    type: String,
    default: "BRONZE",
  },
});

const emit = defineEmits(["close"]);

// 티어 목록
const tierList = [
  { value: "BRONZE", label: "브론즈" },
  { value: "SILVER", label: "실버" },
  { value: "GOLD", label: "골드" },
  { value: "PLATINUM", label: "플래티넘" },
  { value: "DIAMOND", label: "다이아몬드" },
  { value: "MASTER", label: "마스터" },
];

// 상태
const selectedTier = ref(props.initialRankTier);
const myRank = ref(null);
const players = ref([]);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(0);

// PlayerDetailsModal 상태
const selectedPlayer = ref(null);
const isPlayerDetailsOpen = ref(false);

// 현재 사용자 ID (localStorage에서 가져오기)
const currentUserId = computed(() => {
  return localStorage.getItem("memberId") || "";
});

// 페이징 관련 computed
const hasNextPage = computed(() => players.value.length >= 20);
const hasPagination = computed(() => {
  // 플레이어가 있고, 첫 페이지가 아니거나 다음 페이지가 있으면 페이징 표시
  return (
    players.value.length > 0 && (currentPage.value > 0 || hasNextPage.value)
  );
});

// 보이는 페이지 번호 계산 (0부터 시작하지만 표시는 1부터)
const visiblePages = computed(() => {
  const maxVisible = 5;
  const current = currentPage.value + 1; // 표시용으로 1부터 시작
  const start = Math.max(1, current - Math.floor(maxVisible / 2));
  const end = start + maxVisible - 1;
  return Array.from(
    { length: Math.min(maxVisible, end - start + 1) },
    (_, i) => start + i,
  );
});

// 티어 선택
function selectTier(tier) {
  selectedTier.value = tier;
  currentPage.value = 0;
  fetchRanking(tier, 0);
}

// 랭킹 조회
async function fetchRanking(tier, page = 0) {
  loading.value = true;
  error.value = null;

  try {
    const result = await rankingService.getRanking(props.gameMode, tier, page);

    myRank.value = result.myRank;
    players.value = result.players || [];
    currentPage.value = page;
  } catch (err) {
    console.error("랭킹 조회 중 오류:", err);
    error.value = "랭킹을 불러오는데 실패했습니다.";
    myRank.value = null;
    players.value = [];
  } finally {
    loading.value = false;
  }
}

// 페이지 이동
function goToPage(page) {
  if (page >= 0) {
    fetchRanking(selectedTier.value, page);
  }
}

// 모달 닫기
function close() {
  emit("close");
}

// 플레이어 상세 정보 표시
function showPlayerDetails(player) {
  // PlayerDetailsModal에 전달할 player 객체 형식
  selectedPlayer.value = {
    id: player.memberId,
    memberId: player.memberId,
    nickname: player.nickname,
  };
  isPlayerDetailsOpen.value = true;
}

// 플레이어 상세 정보 모달 닫기
function closePlayerDetails() {
  isPlayerDetailsOpen.value = false;
  selectedPlayer.value = null;
}

// 티어 아이콘 가져오기
function getTierIcon(tier) {
  const iconMap = {
    BRONZE: "fas fa-trophy bronze",
    SILVER: "fas fa-trophy silver",
    GOLD: "fas fa-trophy gold",
    PLATINUM: "fas fa-trophy platinum",
    DIAMOND: "fas fa-trophy diamond",
    MASTER: "fas fa-crown master",
  };
  return iconMap[tier] || "fas fa-trophy";
}

// 티어 이름 포맷팅
function formatTierName(tier) {
  const nameMap = {
    BRONZE: "브론즈",
    SILVER: "실버",
    GOLD: "골드",
    PLATINUM: "플래티넘",
    DIAMOND: "다이아몬드",
    MASTER: "마스터",
  };
  return nameMap[tier] || tier;
}

// 레벨 포맷팅 (ONE -> 1)
function formatLevel(level) {
  const levelMap = {
    ONE: "1",
    TWO: "2",
    THREE: "3",
    FOUR: "4",
    FIVE: "5",
  };
  return levelMap[level] || level;
}

// 숫자 포맷팅
function formatNumber(number) {
  return number.toLocaleString();
}

// 모달이 열릴 때 초기 데이터 로드
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      selectedTier.value = props.initialRankTier;
      currentPage.value = 0;
      fetchRanking(props.initialRankTier, 0);
    }
  },
);
</script>

<style scoped>
.ranking-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.82);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  transform: translateZ(0);
  contain: layout paint;
}

.ranking-modal-content {
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  contain: layout paint;
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s, color 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
  color: #1f2937;
}

/* 티어 탭 스타일 */
.tier-tabs {
  display: flex;
  flex-wrap: wrap;
  padding: 12px 20px;
  gap: 8px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.tier-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid transparent;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease,
    box-shadow 0.15s ease;
  white-space: nowrap;
  font-weight: 600;
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}

.tier-tab:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tier-tab.active {
  border-color: currentColor;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tier-tab.active.tier-bronze {
  background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
}

.tier-tab.active.tier-silver {
  background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
}

.tier-tab.active.tier-gold {
  background: linear-gradient(135deg, #ca8a04 0%, #fbbf24 100%);
}

.tier-tab.active.tier-platinum {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
}

.tier-tab.active.tier-diamond {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
}

.tier-tab.active.tier-master {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
}

.tier-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tier-icon i {
  font-size: 16px;
}

.tier-name {
  font-size: 14px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 32px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #6b7280;
}

.loading-container i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #3b82f6;
}

.error-container p {
  font-size: 16px;
}

/* 내 랭크 카드 */
.my-rank-card {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border: 2px solid #3b82f6;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.my-rank-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.my-rank-header i {
  color: #3b82f6;
}

.my-rank-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.my-rank-tier {
  display: flex;
  align-items: center;
}

.my-rank-details {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.my-rank-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.my-rank-item .label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.my-rank-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

/* 플레이어 리스트 */
.players-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.player-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.player-item.is-me {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(147, 197, 253, 0.05) 100%
  );
  border: 2px solid #3b82f6;
}

.player-item.with-border {
  margin-bottom: 4px;
}

.player-rank {
  font-size: 18px;
  font-weight: 700;
  color: #6b7280;
  min-width: 40px;
  text-align: center;
}

.player-item.is-me .player-rank {
  color: #3b82f6;
}

.player-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.player-tier-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.player-tier-badge.tier-bronze {
  background: linear-gradient(
    135deg,
    rgba(146, 64, 14, 0.15) 0%,
    rgba(180, 83, 9, 0.1) 100%
  );
  color: #92400e;
  border: 1px solid rgba(146, 64, 14, 0.3);
}

.player-tier-badge.tier-silver {
  background: linear-gradient(
    135deg,
    rgba(100, 116, 139, 0.15) 0%,
    rgba(148, 163, 184, 0.1) 100%
  );
  color: #64748b;
  border: 1px solid rgba(100, 116, 139, 0.3);
}

.player-tier-badge.tier-gold {
  background: linear-gradient(
    135deg,
    rgba(202, 138, 4, 0.15) 0%,
    rgba(251, 191, 36, 0.1) 100%
  );
  color: #ca8a04;
  border: 1px solid rgba(202, 138, 4, 0.3);
}

.player-tier-badge.tier-platinum {
  background: linear-gradient(
    135deg,
    rgba(8, 145, 178, 0.15) 0%,
    rgba(6, 182, 212, 0.1) 100%
  );
  color: #0891b2;
  border: 1px solid rgba(8, 145, 178, 0.3);
}

.player-tier-badge.tier-diamond {
  background: linear-gradient(
    135deg,
    rgba(14, 165, 233, 0.15) 0%,
    rgba(59, 130, 246, 0.1) 100%
  );
  color: #0ea5e9;
  border: 1px solid rgba(14, 165, 233, 0.3);
}

.player-tier-badge.tier-master {
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.15) 0%,
    rgba(168, 85, 247, 0.1) 100%
  );
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.3);
}

.player-tier-badge i {
  font-size: 12px;
}

.player-nickname {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.my-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
}

.player-rating {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  min-width: 100px;
  text-align: right;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.rank-badge.tier-bronze {
  background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
  color: white;
}

.rank-badge.tier-silver {
  background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
  color: white;
}

.rank-badge.tier-gold {
  background: linear-gradient(135deg, #ca8a04 0%, #fbbf24 100%);
  color: white;
}

.rank-badge.tier-platinum {
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
  color: white;
}

.rank-badge.tier-diamond {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
  color: white;
}

.rank-badge.tier-master {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
}

.rank-badge i {
  font-size: 16px;
}

.no-players {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.no-players p {
  font-size: 16px;
}

.modal-footer {
  padding: 20px 32px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.page-button {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: background-color 0.2s, border-color 0.2s;
}

.page-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.page-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  min-width: 40px;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.page-number:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.page-number.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #3b82f6;
}

.pagination-info {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
}

/* 애니메이션 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
  will-change: opacity;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .ranking-modal-content,
.modal-fade-leave-active .ranking-modal-content {
  transition: transform 0.26s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.22s ease;
  will-change: transform, opacity;
}

.modal-fade-enter-from .ranking-modal-content,
.modal-fade-leave-to .ranking-modal-content {
  transform: translate3d(0, 12px, 0) scale(0.96);
  opacity: 0;
}

.modal-fade-enter-to .ranking-modal-content,
.modal-fade-leave-from .ranking-modal-content {
  transform: translate3d(0, 0, 0) scale(1);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-fade-enter-active .ranking-modal-content,
  .modal-fade-leave-active .ranking-modal-content {
    transition-duration: 0.01ms;
  }
}

/* 반응형 */
@media (max-width: 768px) {
  .ranking-modal-content {
    max-width: 100%;
    margin: 20px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px 20px;
  }

  .tier-tabs {
    padding: 10px 12px;
    gap: 6px;
  }

  .tier-tab {
    padding: 6px 10px;
    font-size: 12px;
    gap: 4px;
  }

  .tier-icon i {
    font-size: 12px;
  }

  .player-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .player-info {
    width: 100%;
    flex-wrap: wrap;
  }

  .player-rating {
    width: 100%;
    text-align: left;
  }

  .my-rank-details {
    flex-direction: column;
    gap: 12px;
  }

  .page-numbers {
    overflow-x: auto;
  }
}
</style>
