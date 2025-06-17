<template>
  <div 
    class="player-details-modal"
    :class="{ 'active': isActive }"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">플레이어 정보</h3>
        <button 
          class="close-button"
          @click="$emit('close')"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body" v-if="player">
        <!-- Player profile section (more compact) -->
        <div class="player-profile">
          <div class="profile-content">
            <div class="profile-avatar">
              <img :src="player.profileImage || '/assets/default-avatar.png'" :alt="player.nickname">
              <div class="host-badge" v-if="player.isHost">
                <i class="fas fa-crown"></i>
              </div>
            </div>
            
            <div class="profile-info">
              <h4 class="profile-name">{{ player.nickname }}</h4>
              <div class="profile-level">Lv. {{ player.level }}</div>
            </div>
          </div>
        </div>
        
        <!-- Stats section -->
        <div class="stats-section">
          <h5 class="section-title">게임 통계</h5>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-gamepad"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ player.totalGames || 0 }}</div>
                <div class="stat-label">총 게임</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-trophy"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ player.wins || 0 }}</div>
                <div class="stat-label">승리</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ player.multiplayCount || 0 }}</div>
                <div class="stat-label">멀티플레이</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-calendar-alt"></i>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ formatJoinDate }}</div>
                <div class="stat-label">가입일</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Rank section -->
        <div class="rank-section">
          <h5 class="section-title">게임 모드 랭크</h5>
          
          <div class="rank-cards">
            <!-- Horizontal layout for rank cards -->
            <div class="rank-row">
              <!-- Roadview Mode Card -->
              <div class="rank-card roadview">
                <div class="rank-header">
                  <div class="rank-icon">
                    <i class="fas fa-street-view"></i>
                  </div>
                  <div class="rank-title">로드뷰 모드</div>
                  <div 
                    class="rank-mini-badge" 
                    :class="getRankClass(player.roadviewRank)"
                    v-tooltip="formatRank(player.roadviewRank)"
                  >
                    <i :class="getRankIcon(player.roadviewRank)"></i>
                    <span>{{ getRankLevel(player.roadviewRank) }}</span>
                  </div>
                </div>
                
                <div class="rank-details">
                  <div class="rank-stats">
                    <div class="rank-stat">
                      <div class="stat-label">정확도</div>
                      <div class="stat-value">{{ player.roadviewAccuracy || 0 }}%</div>
                    </div>
                    <div class="rank-stat">
                      <div class="stat-label">평균 점수</div>
                      <div class="stat-value">{{ player.roadviewAvgScore || 0 }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Photo Mode Card -->
              <div class="rank-card photo">
                <div class="rank-header">
                  <div class="rank-icon">
                    <i class="fas fa-camera"></i>
                  </div>
                  <div class="rank-title">포토 모드</div>
                  <div 
                    class="rank-mini-badge" 
                    :class="getRankClass(player.photoRank)"
                    v-tooltip="formatRank(player.photoRank)"
                  >
                    <i :class="getRankIcon(player.photoRank)"></i>
                    <span>{{ getRankLevel(player.photoRank) }}</span>
                  </div>
                </div>
                
                <div class="rank-details">
                  <div class="rank-stats">
                    <div class="rank-stat">
                      <div class="stat-label">정확도</div>
                      <div class="stat-value">{{ player.photoAccuracy || 0 }}%</div>
                    </div>
                    <div class="rank-stat">
                      <div class="stat-label">평균 점수</div>
                      <div class="stat-value">{{ player.photoAvgScore || 0 }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

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

// Computed properties
const isSelf = computed(() => {
  return props.player && props.player.id === props.currentUserId;
});

const formatJoinDate = computed(() => {
  if (!props.player || !props.player.joinDate) return 'N/A';
  
  try {
    const date = new Date(props.player.joinDate);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'N/A';
  }
});


// Methods
const getRankClass = (rank) => {
  if (!rank) return 'rank-bronze';
  const [tier] = rank.split('-');
  return `rank-${tier}`;
};

const getRankIcon = (rank) => {
  return 'fas fa-medal';
};

const getRankLevel = (rank) => {
  if (!rank) return 'I';
  const [, level] = rank.split('-');
  return level || 'I';
};

const formatRank = (rank) => {
  if (!rank) return '브론즈 I';
  
  const [tier, level] = rank.split('-');
  const tierNames = {
    'bronze': '브론즈',
    'silver': '실버',
    'gold': '골드',
    'platinum': '플래티넘',
    'diamond': '다이아몬드',
    'master': '마스터',
    'admin': '관리자'
  };
  
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
  const levelNum = parseInt(level) || 1;
  const levelStr = romanNumerals[levelNum - 1] || levelNum.toString();
  
  return `${tierNames[tier] || tier} ${levelStr}`;
};
</script>

<style scoped>
.player-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.player-details-modal.active {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.player-details-modal.active .modal-content {
  transform: translateY(0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: black;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.modal-body {
  padding: 0;
}

/* Player profile section */
.player-profile {
  position: relative;
  padding: 1.25rem;
  overflow: hidden;
}

.profile-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  opacity: 0.2;
  z-index: 0;
}

.profile-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
}

.profile-avatar {
  position: relative;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-right: 1.5rem;
  flex-shrink: 0;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.host-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid white;
  z-index: 2;
}

.host-badge i {
  font-size: 0.7rem;
  color: white;
}

.profile-info {
  text-align: left;
}

.profile-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: black;
  margin: 0 0 0.3rem;
}

.profile-level {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  display: inline-block;
}

/* Stats section */
.stats-section, .rank-section {
  padding: 0.35rem 1rem;
  border-top: 1px solid #f3f4f6;
  margin: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: black;
  margin: 0 0 0.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-card {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  color: #6366f1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: black;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Rank section */
.rank-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rank-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.rank-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rank-card.roadview .rank-header {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(30, 58, 138, 0.08) 100%);
  color: #2563eb;
  border-bottom: 1px solid rgba(37, 99, 235, 0.15);
}

.rank-card.photo .rank-header {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(20, 83, 45, 0.08) 100%);
  color: #16a34a;
  border-bottom: 1px solid rgba(22, 163, 74, 0.15);
}

.rank-header {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  position: relative;
}

.rank-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.rank-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.rank-mini-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.75rem;
  margin-left: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: help;
}

.rank-details {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.rank-stats {
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: space-around;
}

.rank-stat {
  text-align: center;
}

.rank-stat .stat-label {
  font-size: 0.7rem;
  color: #6b7280;
}

.rank-stat .stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: black;
}

/* Actions section */
.actions-section {
  padding: 1rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: center;
}

.kick-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #ef4444;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.kick-button:hover {
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
  color: white;
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 8px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

@media (max-width: 640px) {
  .rank-row {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .profile-content {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-avatar {
    margin-right: 0;
    margin-bottom: 0.75rem;
  }
  
  .profile-info {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
