<template>
  <div 
    class="player-card"
    :class="{ 
      'is-host': player.isHost, 
      'is-current': player.id === currentUserId,
      [`team-${player.teamId}-player`]: player.teamId
    }"
    @click="$emit('click', player)"
  >
    <!-- Chat bubble -->
    <div 
      class="chat-bubble" 
      v-if="playerMessage" 
      :class="{ 'active': playerMessage.show }"
    >
      {{ playerMessage.message }}
    </div>
    
    <!-- Player avatar with gradient border -->
    <div class="player-avatar">
      <div class="avatar-wrapper">
        <img :src="player.profileImage || '/assets/default-avatar.png'" :alt="player.nickname">
      </div>
      <div class="host-badge" v-if="player.isHost">
        <i class="fas fa-crown"></i>
      </div>
    </div>
    
    <!-- Player info -->
    <div class="player-info">
      <div class="player-name">{{ player.nickname }}</div>
      <div class="player-stats">
        <div class="player-level">Lv. {{ player.level }}</div>
        <div class="multiplayer-stats" v-if="showMultiplayStats">멀티: {{ player.multiplayCount || 0 }}판</div>
      </div>
    </div>
    
    <!-- Player ranks -->
    <div class="player-ranks">
      <div class="rank-badge roadview">
        <i class="fas fa-street-view"></i>
        <span class="rank-icon" :class="getRankClass(player.roadviewRank)">
          <i :class="getRankIcon(player.roadviewRank)"></i>
        </span>
        <span class="rank-level">{{ convertToRoman(getRankLevel(player.roadviewRank)) }}</span>
      </div>
      <div class="rank-badge photo">
        <i class="fas fa-camera"></i>
        <span class="rank-icon" :class="getRankClass(player.photoRank)">
          <i :class="getRankIcon(player.photoRank)"></i>
        </span>
        <span class="rank-level">{{ convertToRoman(getRankLevel(player.photoRank)) }}</span>
      </div>
    </div>
    
    <!-- Player actions -->
    <div class="player-actions">
      <!-- Host-only kick button -->
      <button 
        v-if="isHost && player.id !== currentUserId" 
        class="kick-button"
        @click.stop="$emit('kick', player)"
        title="강퇴하기"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  player: {
    type: Object,
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
  playerMessage: {
    type: Object,
    default: null
  },
  showMultiplayStats: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click', 'kick']);

// Utility functions for rank display
const getRankClass = (rank) => {
  if (!rank) return 'rank-bronze';
  const [tier] = rank.split('-');
  return `rank-${tier}`;
};

const getRankIcon = (rank) => {
  return 'fas fa-medal';
};

const getRankLevel = (rank) => {
  if (!rank) return 1;
  const parts = rank.split('-');
  return parts.length > 1 ? parseInt(parts[1]) : 1;
};

const convertToRoman = (num) => {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
  return romanNumerals[num - 1] || num.toString();
};
</script>

<style scoped>
.player-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 16px;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.player-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.6) 0%, rgba(168, 85, 247, 0.6) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.player-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.player-card:hover::before {
  opacity: 1;
}

.player-card.is-current {
  background: linear-gradient(to right, rgba(243, 244, 246, 0.5), white);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.player-card.is-host {
  background: linear-gradient(to right, rgba(254, 243, 199, 0.2), white);
}

/* Team-specific styling */
.team-blue-player::before {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  opacity: 1;
}

.team-red-player::before {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
  opacity: 1;
}

.team-green-player::before {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  opacity: 1;
}

.team-yellow-player::before {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
  opacity: 1;
}

/* Avatar styling */
.player-avatar {
  position: relative;
  margin-right: 1rem;
}

.avatar-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f3f4f6;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.host-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
}

.host-badge i {
  font-size: 0.6rem;
  color: white;
}

/* Player info styling */
.player-info {
  flex: 1.5;
  min-width: 0;
}

.player-name {
  font-weight: 600;
  color: black;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #6b7280;
}

/* Rank badges styling */
.player-ranks {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-right: 0.75rem;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rank-badge.roadview {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(30, 58, 138, 0.1) 100%);
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.2);
}

.rank-badge.photo {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(20, 83, 45, 0.1) 100%);
  color: #16a34a;
  border: 1px solid rgba(22, 163, 74, 0.2);
}

/* Rank icons styling */
.rank-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.7rem;
}

.rank-bronze {
  background-color: #CD7F32;
  color: white;
}

.rank-silver {
  background-color: #C0C0C0;
  color: white;
}

.rank-gold {
  background-color: #FFD700;
  color: white;
}

.rank-platinum {
  background-color: #00CED1;
  color: white;
}

.rank-diamond {
  background-color: #B9F2FF;
  color: white;
}

.rank-master {
  background-color: #9370DB;
  color: white;
}

.rank-admin {
  background-color: #FF5675;
  color: white;
}

/* Kick button styling */
.kick-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #ef4444;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.kick-button:hover {
  transform: scale(1.1);
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
  color: white;
}

/* Chat bubble styling */
.chat-bubble {
  position: absolute;
  top: -40px;
  left: 10px;
  background-color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  max-width: 200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.chat-bubble::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 20px;
  width: 16px;
  height: 16px;
  background-color: white;
  transform: rotate(45deg);
  z-index: -1;
  box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.03);
}

.chat-bubble.active {
  opacity: 1;
  transform: translateY(0);
}
</style>

