<template>
  <transition name="modal-fade">
    <div v-if="show" class="ranking-overlay" @click.self="close">
      <div class="ranking-modal">
        <!-- 헤더 -->
        <div class="modal-header">
          <h2>전체 랭킹</h2>
          <button class="close-btn" @click="close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 티어 탭 -->
        <div class="tier-tabs">
          <button
            v-for="tier in tierList"
            :key="tier.value"
            @click="selectTier(tier.value)"
            :class="['tier-tab', `tier-${tier.value.toLowerCase()}`, { active: selectedTier === tier.value }]"
          >
            <i :class="getTierIcon(tier.value)"></i>
            <span>{{ tier.label }}</span>
          </button>
        </div>

        <!-- 바디 -->
        <div class="modal-body">
          <div v-if="loading" class="state-box">
            <i class="fas fa-spinner fa-spin"></i>
            <p>랭킹을 불러오는 중...</p>
          </div>

          <div v-else-if="error" class="state-box state-box--error">
            <i class="fas fa-exclamation-circle"></i>
            <p>{{ error }}</p>
          </div>

          <div v-else class="ranking-content">
            <!-- 비회원 CTA -->
            <div v-if="!isLoggedIn" class="guest-cta">
              <i class="fas fa-user-lock guest-icon"></i>
              <div class="guest-text">
                <p class="guest-title">나의 랭킹을 등록하고 싶다면?</p>
                <p class="guest-desc">로그인 후 랭크 게임을 플레이하면 자동 등록됩니다.</p>
              </div>
              <button class="guest-btn" @click="goToLogin">
                <i class="fas fa-sign-in-alt"></i>
                로그인
              </button>
            </div>

            <!-- 내 랭크 카드 -->
            <div v-else-if="myRank" class="my-rank-card">
              <div class="my-rank-label">
                <i class="fas fa-user"></i>
                <span>내 랭크</span>
              </div>
              <div class="my-rank-body">
                <div class="rank-badge" :class="`tier-${myRank.rankTier.toLowerCase()}`">
                  <i :class="getTierIcon(myRank.rankTier)"></i>
                  <span>{{ formatTierName(myRank.rankTier) }} {{ formatLevel(myRank.rankLevel) }}</span>
                </div>
                <div class="my-rank-stats">
                  <span class="my-rank-nickname">{{ myRank.nickname }}</span>
                  <span class="my-rank-score">{{ formatNumber(myRank.ratingScore) }}점</span>
                </div>
              </div>
            </div>

            <!-- 플레이어 리스트 -->
            <div class="players-list">
              <div
                v-for="(player, index) in players"
                :key="player.memberId"
                class="player-row"
                :class="{ 'is-me': myRank && player.nickname === myRank.nickname }"
                @click="showPlayerDetails(player)"
              >
                <span class="player-rank" :class="getRankClass(index)">
                  {{ currentPage * 20 + index + 1 }}
                </span>
                <div class="player-info">
                  <div class="tier-badge-sm" :class="`tier-${player.rankTier.toLowerCase()}`">
                    <i :class="getTierIcon(player.rankTier)"></i>
                    <span class="tier-text">{{ formatTierName(player.rankTier) }} {{ formatLevel(player.rankLevel) }}</span>
                  </div>
                  <span class="player-name">{{ player.nickname }}</span>
                  <span v-if="myRank && player.nickname === myRank.nickname" class="me-badge">나</span>
                </div>
                <span class="player-score">{{ formatNumber(player.ratingScore) }}</span>
              </div>

              <div v-if="players.length === 0" class="empty-state">
                <i class="fas fa-users-slash"></i>
                <p>플레이어 정보가 없습니다.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="!loading && !error && hasPagination" class="modal-footer">
          <div class="pagination">
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 0" class="page-btn">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page - 1)"
              :class="['page-num', { active: currentPage === page - 1 }]"
            >
              {{ page }}
            </button>
            <button @click="goToPage(currentPage + 1)" :disabled="!hasNextPage" class="page-btn">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 플레이어 상세 모달 -->
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
  show: { type: Boolean, required: true },
  gameMode: { type: String, required: true, default: "ROADVIEW" },
  initialRankTier: { type: String, default: "BRONZE" },
});

const emit = defineEmits(["close"]);

const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'));

const tierList = [
  { value: "BRONZE",   label: "브론즈" },
  { value: "SILVER",   label: "실버" },
  { value: "GOLD",     label: "골드" },
  { value: "PLATINUM", label: "플래티넘" },
  { value: "DIAMOND",  label: "다이아몬드" },
  { value: "MASTER",   label: "마스터" },
];

const selectedTier = ref(props.initialRankTier);
const myRank = ref(null);
const players = ref([]);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(0);
const totalPages = ref(1);

const selectedPlayer = ref(null);
const isPlayerDetailsOpen = ref(false);

const currentUserId = computed(() => localStorage.getItem("memberId") || "");

const hasNextPage = computed(() => currentPage.value < totalPages.value - 1);
const hasPagination = computed(() => totalPages.value > 1 || currentPage.value > 0);

const visiblePages = computed(() => {
  const maxVisible = 5;
  const current = currentPage.value + 1;
  const start = Math.max(1, current - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages.value, start + maxVisible - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function selectTier(tier) {
  selectedTier.value = tier;
  currentPage.value = 0;
  fetchRanking(tier, 0);
}

async function fetchRanking(tier, page = 0) {
  loading.value = true;
  error.value = null;
  try {
    const result = await rankingService.getRanking(props.gameMode, tier, page);
    myRank.value = result.myRank;
    players.value = result.players || [];
    totalPages.value = result.totalPages ?? 1;
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

function goToPage(page) {
  if (page >= 0 && page < totalPages.value) fetchRanking(selectedTier.value, page);
}

function close() {
  emit("close");
}

function goToLogin() {
  close();
  import('vue-router').then(({ useRouter }) => {
    const router = useRouter();
    router.push('/loginPage');
  }).catch(() => {
    window.location.href = '/loginPage';
  });
}

function showPlayerDetails(player) {
  selectedPlayer.value = { id: player.memberId, memberId: player.memberId, nickname: player.nickname };
  isPlayerDetailsOpen.value = true;
}

function closePlayerDetails() {
  isPlayerDetailsOpen.value = false;
  selectedPlayer.value = null;
}

function getRankClass(index) {
  const rank = currentPage.value * 20 + index + 1;
  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';
  return '';
}

function getTierIcon(tier) {
  const iconMap = {
    BRONZE:   "fas fa-trophy",
    SILVER:   "fas fa-trophy",
    GOLD:     "fas fa-trophy",
    PLATINUM: "fas fa-trophy",
    DIAMOND:  "fas fa-trophy",
    MASTER:   "fas fa-crown",
  };
  return iconMap[tier] || "fas fa-trophy";
}

function formatTierName(tier) {
  const nameMap = { BRONZE: "브론즈", SILVER: "실버", GOLD: "골드", PLATINUM: "플래티넘", DIAMOND: "다이아몬드", MASTER: "마스터" };
  return nameMap[tier] || tier;
}

function formatLevel(level) {
  const levelMap = { ONE: "1", TWO: "2", THREE: "3", FOUR: "4", FIVE: "5" };
  return levelMap[level] || level;
}

function formatNumber(number) {
  return number.toLocaleString();
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedTier.value = props.initialRankTier;
    currentPage.value = 0;
    fetchRanking(props.initialRankTier, 0);
  }
});
</script>

<style scoped>
/* ── 오버레이 ── */
.ranking-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

/* ── 모달 ── */
.ranking-modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

/* ── 헤더 ── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  background: linear-gradient(135deg, #52DEE5 0%, #EEE5E9 100%);
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.close-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-size: 14px;
  transition: background 0.18s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.88);
}

/* ── 티어 탭 ── */
.tier-tabs {
  display: flex;
  padding: 10px 12px;
  gap: 6px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.tier-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 4px;
  border: 1.5px solid transparent;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.18s ease;
  white-space: nowrap;
}

.tier-tab:hover:not(.active) {
  background: #e5e7eb;
  color: #111827;
}

.tier-tab.active.tier-bronze  { background: linear-gradient(135deg, #92400e, #b45309); color: #fff; border-color: transparent; }
.tier-tab.active.tier-silver  { background: linear-gradient(135deg, #64748b, #94a3b8); color: #fff; border-color: transparent; }
.tier-tab.active.tier-gold    { background: linear-gradient(135deg, #ca8a04, #fbbf24); color: #fff; border-color: transparent; }
.tier-tab.active.tier-platinum{ background: linear-gradient(135deg, #0891b2, #06b6d4); color: #fff; border-color: transparent; }
.tier-tab.active.tier-diamond { background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: #fff; border-color: transparent; }
.tier-tab.active.tier-master  { background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; border-color: transparent; }

/* ── 바디 ── */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px;
}

/* ── 상태 박스 ── */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 180px;
  gap: 12px;
  color: #6b7280;
  font-size: 14px;
}

.state-box i { font-size: 32px; color: #4cc9cf; }
.state-box p { margin: 0; }
.state-box--error i { color: #ef4444; }

/* ── 비회원 CTA ── */
.guest-cta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(76, 201, 207, 0.08), rgba(238, 229, 233, 0.16));
  border: 1.5px solid rgba(76, 201, 207, 0.28);
  border-radius: 14px;
  margin-bottom: 14px;
}

.guest-icon {
  font-size: 22px;
  color: #4cc9cf;
  flex-shrink: 0;
}

.guest-text { flex: 1; min-width: 0; }

.guest-title {
  margin: 0 0 3px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.guest-desc {
  margin: 0;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
}

.guest-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: #4cc9cf;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}

.guest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(76, 201, 207, 0.42);
}

/* ── 내 랭크 카드 ── */
.my-rank-card {
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(76, 201, 207, 0.07), rgba(238, 229, 233, 0.12));
  border: 1.5px solid rgba(76, 201, 207, 0.28);
  border-radius: 14px;
  margin-bottom: 14px;
}

.my-rank-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #4cc9cf;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.my-rank-body {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.my-rank-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.my-rank-nickname {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.my-rank-score {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

/* ── 랭크 배지 (내 랭크 카드용) ── */
.rank-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.rank-badge.tier-bronze  { background: linear-gradient(135deg, #92400e, #b45309); color: #fff; }
.rank-badge.tier-silver  { background: linear-gradient(135deg, #64748b, #94a3b8); color: #fff; }
.rank-badge.tier-gold    { background: linear-gradient(135deg, #ca8a04, #fbbf24); color: #fff; }
.rank-badge.tier-platinum{ background: linear-gradient(135deg, #0891b2, #06b6d4); color: #fff; }
.rank-badge.tier-diamond { background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: #fff; }
.rank-badge.tier-master  { background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; }

/* ── 플레이어 리스트 ── */
.players-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  background: #f9fafb;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
}

.player-row:hover {
  background: #f3f4f6;
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.player-row.is-me {
  background: linear-gradient(135deg, rgba(76, 201, 207, 0.08), rgba(238, 229, 233, 0.08));
  border-color: rgba(76, 201, 207, 0.3);
}

/* 순위 숫자 */
.player-rank {
  font-size: 15px;
  font-weight: 700;
  min-width: 26px;
  text-align: center;
  color: #9ca3af;
  flex-shrink: 0;
}

.player-rank.rank-gold   { color: #ca8a04; }
.player-rank.rank-silver { color: #94a3b8; }
.player-rank.rank-bronze { color: #b45309; }

/* 티어 배지 소형 */
.tier-badge-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.tier-badge-sm.tier-bronze  { background: rgba(146, 64, 14, 0.1);  color: #92400e; border: 1px solid rgba(146, 64, 14, 0.22); }
.tier-badge-sm.tier-silver  { background: rgba(100, 116, 139, 0.1); color: #64748b; border: 1px solid rgba(100, 116, 139, 0.22); }
.tier-badge-sm.tier-gold    { background: rgba(202, 138, 4, 0.1);   color: #ca8a04; border: 1px solid rgba(202, 138, 4, 0.22); }
.tier-badge-sm.tier-platinum{ background: rgba(8, 145, 178, 0.1);   color: #0891b2; border: 1px solid rgba(8, 145, 178, 0.22); }
.tier-badge-sm.tier-diamond { background: rgba(14, 165, 233, 0.1);  color: #0ea5e9; border: 1px solid rgba(14, 165, 233, 0.22); }
.tier-badge-sm.tier-master  { background: rgba(124, 58, 237, 0.1);  color: #7c3aed; border: 1px solid rgba(124, 58, 237, 0.22); }

/* 플레이어 정보 */
.player-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.player-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.me-badge {
  background: #4cc9cf;
  color: #fff;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

.player-score {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  flex-shrink: 0;
  min-width: 52px;
  text-align: right;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #9ca3af;
  font-size: 14px;
}

.empty-state i {
  font-size: 28px;
  display: block;
  margin-bottom: 10px;
}

.empty-state p { margin: 0; }

/* ── 푸터 / 페이지네이션 ── */
.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.page-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-num {
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.page-num:hover:not(.active) {
  background: #f3f4f6;
}

.page-num.active {
  background: #4cc9cf;
  border-color: #4cc9cf;
  color: #fff;
}

/* ── 애니메이션 ── */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .ranking-modal,
.modal-fade-leave-active .ranking-modal {
  transition: transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.22s ease;
}

.modal-fade-enter-from .ranking-modal,
.modal-fade-leave-to .ranking-modal {
  transform: scale(0.96) translateY(10px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .modal-fade-enter-active,
  .modal-fade-leave-active,
  .modal-fade-enter-active .ranking-modal,
  .modal-fade-leave-active .ranking-modal {
    transition-duration: 0.01ms;
  }
}

/* ── 모바일 ── */
@media (max-width: 520px) {
  .ranking-overlay {
    padding: 10px;
  }

  .ranking-modal {
    max-height: 92vh;
  }

  /* 티어 탭: 3×2 그리드 */
  .tier-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 8px 10px;
    gap: 5px;
  }

  .tier-tab {
    flex-direction: column;
    gap: 3px;
    padding: 7px 4px;
    font-size: 10px;
  }

  /* 플레이어 행 간소화 */
  .player-row {
    padding: 9px 10px;
    gap: 8px;
  }

  /* 티어 텍스트 숨김 (아이콘만 표시) */
  .tier-text {
    display: none;
  }

  .tier-badge-sm {
    padding: 3px 6px;
  }

  .player-name {
    font-size: 12px;
  }

  .player-score {
    font-size: 12px;
    min-width: 44px;
  }

  /* 비회원 CTA */
  .guest-cta {
    flex-wrap: wrap;
  }

  .guest-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
