<template>
  <transition name="modal-fade">
    <div v-if="show" class="history-modal-overlay" @click.self="close">
      <div class="history-modal-content">
        <div class="modal-header">
          <h2>전체 기록</h2>
          <button @click="close" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading-container">
            <i class="fas fa-spinner fa-spin"></i>
            <p>로딩 중...</p>
          </div>

          <div v-else-if="error" class="error-container">
            <p>{{ error }}</p>
          </div>

          <div v-else class="history-list">
            <div
              v-for="(record, index) in records"
              :key="record.gameId"
              class="history-item"
              :class="{ 'with-border': index !== records.length - 1 }"
            >
              <div class="history-info">
                <div
                  class="history-mode-badge"
                  :class="{
                    'rank-mode': record.gameType === 'RANK',
                    'practice-mode': record.gameType === 'PRACTICE'
                  }"
                >
                  {{ record.gameType === 'RANK' ? '랭크' : '연습' }}
                </div>
                <span class="history-poi">{{ record.poiName }}</span>
                <div class="history-details">
                  <span class="history-distance">{{ formatDistance(record.answerDistance) }}</span>
                  <span class="history-time">{{ formatTime(record.answerTime) }}</span>
                </div>
                <p class="history-score">{{ formatScore(record.score) }}점</p>
              </div>
              <div class="history-meta">
                <span v-if="record.practiceSido" class="history-region">{{ formatRegion(record.practiceSido) }}</span>
                <span class="history-date">{{ formatDate(record.playedAt) }}</span>
              </div>
            </div>

            <div v-if="records.length === 0" class="no-records">
              <p>기록이 없습니다.</p>
            </div>
          </div>
        </div>

        <div v-if="!loading && !error && totalPages > 1" class="modal-footer">
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
              :disabled="currentPage >= totalPages - 1"
              class="page-button"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          
          <div class="pagination-info">
            총 {{ totalElements }}개 기록 ({{ currentPage + 1 }} / {{ totalPages }} 페이지)
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import roadViewMainService from '../services/roadViewMain.service';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close']);

const records = ref([]);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(0);
const totalPages = ref(0);
const totalElements = ref(0);
const pageSize = ref(10);

// 보이는 페이지 번호 계산
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value + 1;
  const maxVisible = 5;
  
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// 지역 코드를 한글로 변환
const regionMap = {
  SEOUL: '서울',
  BUSAN: '부산',
  DAEGU: '대구',
  INCHEON: '인천',
  GWANGJU: '광주',
  DAEJEON: '대전',
  ULSAN: '울산',
  SEJONG: '세종',
  GYEONGGI: '경기',
  GANGWON: '강원',
  CHUNGBUK: '충북',
  CHUNGNAM: '충남',
  JEONBUK: '전북',
  JEONNAM: '전남',
  GYEONGBUK: '경북',
  GYEONGNAM: '경남',
  JEJU: '제주'
};

// 전체 기록 조회
async function fetchHistory(page = 0) {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await roadViewMainService.getHistory(page, pageSize.value);
    
    if (response.data.isSuccess) {
      const result = response.data.result;
      records.value = result.games;
      currentPage.value = result.currentPage;
      totalPages.value = result.totalPages;
      totalElements.value = result.totalElements;
    } else {
      error.value = response.data.message || '기록을 불러오는데 실패했습니다.';
    }
  } catch (err) {
    console.error('전체 기록 조회 중 오류:', err);
    error.value = '기록을 불러오는데 실패했습니다.';
  } finally {
    loading.value = false;
  }
}

// 페이지 이동
function goToPage(page) {
  if (page >= 0 && page < totalPages.value) {
    fetchHistory(page);
  }
}

// 모달 닫기
function close() {
  emit('close');
}

// 포맷팅 함수들
function formatDistance(distance) {
  distance = distance*1000;
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
}

function formatTime(time) {
  return `${time.toFixed(1)}초`;
}

function formatScore(score) {
  return score.toFixed(1);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\. /g, '.').replace(/\.$/, '');
}

function formatRegion(sidoCode) {
  return regionMap[sidoCode] || sidoCode;
}

// 모달이 열릴 때 첫 페이지 로드
watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchHistory(0);
  }
});
</script>

<style scoped>
.history-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.history-modal-content {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
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
}

.error-container p {
  font-size: 16px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
}

.history-item:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.history-item.with-border {
  margin-bottom: 4px;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.history-mode-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.rank-mode {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.practice-mode {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
}

.history-poi {
  font-weight: 500;
  color: #1f2937;
  min-width: 120px;
}

.history-details {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.history-score {
  margin: 0;
  font-weight: 600;
  font-size: 16px;
  color: #1f2937;
  margin-left: auto;
}

.history-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: 16px;
}

.history-region {
  font-size: 12px;
  color: #6b7280;
  padding: 2px 8px;
  background: #e5e7eb;
  border-radius: 4px;
}

.history-date {
  font-size: 12px;
  color: #9ca3af;
}

.no-records {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.no-records p {
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
  transition: opacity 0.3s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .history-modal-content,
.modal-fade-leave-active .history-modal-content {
  transition: transform 0.3s;
}

.modal-fade-enter-from .history-modal-content,
.modal-fade-leave-to .history-modal-content {
  transform: scale(0.9);
}

/* 반응형 */
@media (max-width: 768px) {
  .history-modal-content {
    max-width: 100%;
    margin: 20px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px 20px;
  }

  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .history-info {
    flex-wrap: wrap;
  }

  .history-meta {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .page-numbers {
    overflow-x: auto;
  }
}
</style>

