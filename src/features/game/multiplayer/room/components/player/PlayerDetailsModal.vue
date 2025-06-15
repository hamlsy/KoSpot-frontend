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
        <!-- Player profile section -->
        <div class="player-profile">
          <div class="profile-background" :style="profileGradient"></div>
          
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
            <div class="rank-card roadview">
              <div class="rank-header">
                <div class="rank-icon">
                  <i class="fas fa-street-view"></i>
                </div>
                <div class="rank-title">로드뷰 모드</div>
              </div>
              
              <div class="rank-details">
                <div class="rank-badge" :class="getRankClass(player.roadviewRank)">
                  <i :class="getRankIcon(player.roadviewRank)"></i>
                  <span>{{ formatRank(player.roadviewRank) }}</span>
                </div>
                
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
            
            <div class="rank-card photo">
              <div class="rank-header">
                <div class="rank-icon">
                  <i class="fas fa-camera"></i>
                </div>
                <div class="rank-title">포토 모드</div>
              </div>
              
              <div class="rank-details">
                <div class="rank-badge" :class="getRankClass(player.photoRank)">
                  <i :class="getRankIcon(player.photoRank)"></i>
                  <span>{{ formatRank(player.photoRank) }}</span>
                </div>
                
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
        
        <!-- Actions section (only for host) -->
        <div class="actions-section" v-if="isHost && !isSelf">
          <button 
            class="kick-button"
            @click="$emit('kick', player)"
          >
            <i class="fas fa-user-times"></i>
            <span>강퇴하기</span>
          </button>
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

const profileGradient = computed(() => {
  if (!props.player) return '';
  
  if (props.player.isHost) {
    return {
      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)'
    };
  }
  
  if (props.player.teamId) {
    const teamColors = {
      'blue': 'linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%)',
      'red': 'linear-gradient(135deg, #fee2e2 0%, #ef4444 100%)',
      'green': 'linear-gradient(135deg, #d1fae5 0%, #10b981 100%)',
      'yellow': 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)'
    };
    
    return {
      background: teamColors[props.player.teamId] || 'linear-gradient(135deg, #f3f4f6 0%, #9ca3af 100%)'
    };
  }
  
  return {
    background: 'linear-gradient(135deg, #f3f4f6 0%, #9ca3af 100%)'
  };
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
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.profile-avatar {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1;
  margin-bottom: 1rem;
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
  width: 28px;
  height: 28px;
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
  font-size: 0.8rem;
  color: white;
}

.profile-info {
  text-align: center;
  z-index: 1;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: black;
  margin: 0 0 0.5rem;
}

.profile-level {
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  display: inline-block;
}

/* Stats section */
.stats-section, .rank-section {
  padding: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: black;
  margin: 0 0 1rem;
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
  gap: 1rem;
}

.rank-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #f3f4f6;
}

.rank-card.roadview .rank-header {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(30, 58, 138, 0.1) 100%);
  color: #2563eb;
  border-bottom: 1px solid rgba(37, 99, 235, 0.2);
}

.rank-card.photo .rank-header {
  background: linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(20, 83, 45, 0.1) 100%);
  color: #16a34a;
  border-bottom: 1px solid rgba(22, 163, 74, 0.2);
}

.rank-header {
  display: flex;
  align-items: center;
  padding: 1rem;
}

.rank-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rank-title {
  font-weight: 600;
}

.rank-details {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.rank-bronze {
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.1) 0%, rgba(205, 127, 50, 0.2) 100%);
  color: #CD7F32;
  border: 1px solid rgba(205, 127, 50, 0.3);
}

.rank-silver {
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.1) 0%, rgba(192, 192, 192, 0.2) 100%);
  color: #808080;
  border: 1px solid rgba(192, 192, 192, 0.3);
}

.rank-gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.2) 100%);
  color: #FFD700;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.rank-platinum {
  background: linear-gradient(135deg, rgba(0, 206, 209, 0.1) 0%, rgba(0, 206, 209, 0.2) 100%);
  color: #00CED1;
  border: 1px solid rgba(0, 206, 209, 0.3);
}

.rank-diamond {
  background: linear-gradient(135deg, rgba(185, 242, 255, 0.1) 0%, rgba(185, 242, 255, 0.2) 100%);
  color: #50C8FF;
  border: 1px solid rgba(185, 242, 255, 0.3);
}

.rank-master {
  background: linear-gradient(135deg, rgba(147, 112, 219, 0.1) 0%, rgba(147, 112, 219, 0.2) 100%);
  color: #9370DB;
  border: 1px solid rgba(147, 112, 219, 0.3);
}

.rank-admin {
  background: linear-gradient(135deg, rgba(255, 86, 117, 0.1) 0%, rgba(255, 86, 117, 0.2) 100%);
  color: #FF5675;
  border: 1px solid rgba(255, 86, 117, 0.3);
}

.rank-stats {
  display: flex;
  gap: 1rem;
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
  padding: 1.5rem;
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

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .rank-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .rank-badge {
    align-self: center;
  }
}
</style>
