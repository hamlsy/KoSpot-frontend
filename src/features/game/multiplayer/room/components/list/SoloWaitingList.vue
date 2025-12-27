<template>
  <div class="solo-players-container">
    <div class="players-grid">
      <!-- 항상 8개 슬롯 표시 -->
      <div 
        v-for="n in 8"
        :key="`slot-${n}`"
        class="slot-wrapper"
        :class="{ 
          'disabled-slot': n > maxPlayers,
          'player-slot': n <= maxPlayers && players[n - 1],
          'empty-slot': n <= maxPlayers && !players[n - 1]
        }"
      >
        <!-- 플레이어가 있는 슬롯 -->
        <div 
          v-if="n <= maxPlayers && players[n - 1]"
          class="player-card"
          :class="{ 
            'is-current': players[n - 1].id === currentUserId,
            'is-host': players[n - 1].isHost
          }"
          @click="$emit('show-player-details', players[n - 1])"
        >
          <!-- 강퇴 버튼 (방장만 표시, 본인 제외) -->
          <button 
            v-if="isHost && players[n - 1].id !== currentUserId"
            class="kick-button"
            @click.stop="$emit('kick-player', players[n - 1])"
            title="강퇴하기"
          >
            <i class="fas fa-times"></i>
          </button>

          <!-- 플레이어 아바타 -->
          <div class="player-avatar">
            <img 
              :src="players[n - 1].profileImage || '/images/default-avatar.png'"
              :alt="players[n - 1].nickname"
              class="avatar-image"
            />
            
            <!-- 방장 배지 -->
            <div v-if="players[n - 1].isHost" class="host-badge">
              <i class="fas fa-crown"></i>
            </div>
          </div>

          <!-- 플레이어 정보 -->
          <div class="player-info">
            <div class="player-name">
              <span class="player-name-text">{{ players[n - 1].nickname }}</span>
              <span v-if="players[n - 1].id === currentUserId" class="you-badge">나</span>
            </div>
          </div>
        </div>

        <!-- 빈 슬롯 (활성화된 슬롯만) -->
        <div 
          v-else-if="n <= maxPlayers"
          class="empty-slot-card"
        >
          <div class="empty-avatar">
            <i class="fas fa-user-plus"></i>
          </div>
          <div class="empty-text">대기 중</div>
        </div>

        <!-- 비활성화된 슬롯 (maxPlayers 초과) -->
        <div 
          v-else
          class="disabled-slot-card"
        >
          <div class="disabled-avatar">
            <i class="fas fa-lock"></i>
          </div>
          <div class="disabled-text">비활성화</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  players: {
    type: Array,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  },
  isHost: {
    type: Boolean,
    default: false
  },
  maxPlayers: {
    type: Number,
    default: 8
  },
  playerMessages: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['show-player-details', 'kick-player']);
</script>

<style scoped>
.solo-players-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  width: 100%;
  max-width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* 플레이어 카드 */
.player-card {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  min-height: 120px;
}

.player-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.player-card.is-current {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

.player-card.is-host {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.02) 0%, rgba(217, 119, 6, 0.02) 100%);
}

/* 강퇴 버튼 */
.kick-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  opacity: 0;
  transform: scale(0.8);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.player-card:hover .kick-button {
  opacity: 1;
  transform: scale(1);
}

.kick-button:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: scale(1.1);
}

/* 플레이어 아바타 */
.player-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  margin-bottom: 0.75rem;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
  transition: all 0.2s ease;
}

.player-card.is-current .avatar-image {
  border-color: #667eea;
}

.player-card.is-host .avatar-image {
  border-color: #f59e0b;
}

/* 방장 배지 */
.host-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

.host-badge i {
  font-size: 0.6rem;
  color: white;
}

/* 플레이어 정보 */
.player-info {
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.player-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  max-width: 100%;
  min-width: 0;
}

.player-name-text {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.2;
}

.you-badge {
  font-size: 0.7rem;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 8px;
  font-weight: 500;
}

/* 슬롯 래퍼 */
.slot-wrapper {
  width: 100%;
  min-height: 120px;
}

/* 빈 슬롯 카드 (활성화된 슬롯) */
.empty-slot-card {
  background: #f8fafc;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  max-height: 160px;
  transition: all 0.2s ease;
}

.empty-slot-card:hover {
  background: #f1f5f9;
  border-color: #9ca3af;
}

.empty-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.empty-avatar i {
  font-size: 1.2rem;
  color: #9ca3af;
}

.empty-text {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

/* 비활성화된 슬롯 카드 */
.disabled-slot-card {
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  max-height: 160px;
  opacity: 0.5;
  cursor: not-allowed;
}

.disabled-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.disabled-avatar i {
  font-size: 1rem;
  color: #94a3b8;
}

.disabled-text {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .players-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .players-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .player-card {
    min-height: 100px;
    padding: 0.5rem;
  }
  
  .player-avatar {
    width: 36px;
    height: 36px;
    margin-bottom: 0.5rem;
  }
  
  .kick-button {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }
  
  .host-badge {
    width: 16px;
    height: 16px;
  }
  
  .host-badge i {
    font-size: 0.5rem;
  }
}

@media (max-width: 480px) {
  .players-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
  }
  
  .player-card {
    min-height: 90px;
    padding: 0.4rem;
  }
  
  .player-avatar {
    width: 32px;
    height: 32px;
  }
  
  .player-name {
    font-size: 0.75rem;
  }
  
  .empty-avatar,
  .disabled-avatar {
    width: 32px;
    height: 32px;
  }

  .empty-avatar i,
  .disabled-avatar i {
    font-size: 1rem;
  }

  .empty-text,
  .disabled-text {
    font-size: 0.7rem;
  }
}
</style>
