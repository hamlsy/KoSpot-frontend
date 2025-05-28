<template>
  <div 
    class="score-card"
    :class="{
      'expanded': isExpanded,
      'highlight': isHighlighted,
      'current-user': isCurrentUser
    }"
  >
    <div class="card-header" @click="toggleExpand">
      <div class="header-left">
        <div class="rank-badge">{{ rank || '-' }}</div>
        <div class="player-info">
          <div class="player-avatar">
            <img :src="player.profileImage || '/img/default-avatar.png'" :alt="player.nickname">
          </div>
          <div class="player-details">
            <div class="player-name">
              {{ player.nickname }}
              <span class="level-badge" v-if="player.level">Lv.{{ player.level }}</span>
              <span class="current-user-badge" v-if="isCurrentUser">나</span>
            </div>
            <div class="player-stats">
              <span class="stat-item" v-if="player.region">
                <i class="fas fa-map-marker-alt"></i> {{ player.region }}
              </span>
              <span class="stat-item" v-if="player.totalGames">
                <i class="fas fa-gamepad"></i> {{ player.totalGames }}판
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="header-right">
        <div class="score-display">
          {{ formatNumber(player.score || 0) }}
          <span class="score-unit">점</span>
        </div>
        
        <div class="expand-icon">
          <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        </div>
      </div>
    </div>
    
    <div class="card-content" v-if="isExpanded">
      <div class="score-details">
        <div class="detail-item">
          <div class="detail-label">총 점수</div>
          <div class="detail-value">{{ formatNumber(player.score || 0) }}점</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">평균 거리</div>
          <div class="detail-value">{{ formatDistance(player.avgDistance) }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">정확도</div>
          <div class="detail-value">{{ formatPercentage(player.accuracy) }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">평균 시간</div>
          <div class="detail-value">{{ formatTime(player.avgTime) }}</div>
        </div>
      </div>
      
      <div class="round-scores" v-if="showRoundDetails && player.roundScores">
        <h4 class="round-header">라운드별 점수</h4>
        <div class="rounds-grid">
          <div 
            v-for="(score, index) in player.roundScores" 
            :key="index"
            class="round-item"
            :class="{ 'missed-round': score === null }"
          >
            <div class="round-label">R{{ index + 1 }}</div>
            <div class="round-score">
              <template v-if="score !== null">
                {{ formatNumber(score) }}
              </template>
              <template v-else>
                <i class="fas fa-minus"></i>
              </template>
            </div>
          </div>
        </div>
      </div>
      
      <div class="player-achievements" v-if="showAchievements && player.achievements && player.achievements.length > 0">
        <h4 class="achievements-header">획득한 업적</h4>
        <div class="achievements-list">
          <div 
            v-for="(achievement, index) in player.achievements" 
            :key="index"
            class="achievement-item"
          >
            <div class="achievement-icon">
              <i :class="achievement.icon || 'fas fa-award'"></i>
            </div>
            <div class="achievement-info">
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-description">{{ achievement.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScoreCard',
  
  props: {
    player: {
      type: Object,
      required: true
    },
    rank: {
      type: Number,
      default: null
    },
    isCurrentUser: {
      type: Boolean,
      default: false
    },
    isHighlighted: {
      type: Boolean,
      default: false
    },
    showRoundDetails: {
      type: Boolean,
      default: true
    },
    showAchievements: {
      type: Boolean,
      default: true
    },
    initialExpanded: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      isExpanded: this.initialExpanded || this.isCurrentUser
    };
  },
  
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    },
    
    formatNumber(num) {
      if (num === null || num === undefined) return '-';
      
      return num.toLocaleString();
    },
    
    formatDistance(distance) {
      if (!distance) return '-';
      
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      }
      return `${distance.toFixed(1)}km`;
    },
    
    formatPercentage(value) {
      if (!value && value !== 0) return '-';
      
      return `${(value * 100).toFixed(1)}%`;
    },
    
    formatTime(seconds) {
      if (!seconds && seconds !== 0) return '-';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      
      if (minutes > 0) {
        return `${minutes}분 ${remainingSeconds}초`;
      }
      return `${remainingSeconds}초`;
    }
  }
};
</script>

<style scoped>
.score-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.score-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.score-card.highlight {
  border-left: 4px solid #FBBC05;
}

.score-card.current-user {
  border-left: 4px solid #4285F4;
  background: #f8f9ff;
}

.card-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s ease;
}

.card-header:hover {
  background: #f8f9fa;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
}

.score-card:nth-child(1) .rank-badge {
  background: #FFD700;
  color: white;
}

.score-card:nth-child(2) .rank-badge {
  background: #C0C0C0;
  color: white;
}

.score-card:nth-child(3) .rank-badge {
  background: #CD7F32;
  color: white;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-details {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.level-badge {
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  background: #f0f0f0;
  color: #666;
}

.current-user-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  background: #4285F4;
  color: white;
}

.player-stats {
  font-size: 0.8rem;
  color: #666;
  display: flex;
  gap: 0.8rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.score-display {
  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}

.score-unit {
  font-size: 0.9rem;
  font-weight: normal;
  color: #666;
}

.expand-icon {
  color: #999;
  transition: transform 0.3s ease;
}

.expanded .expand-icon {
  transform: rotate(180deg);
}

.card-content {
  padding: 0 1rem 1rem;
  border-top: 1px solid #f0f0f0;
  animation: slideDown 0.3s ease;
}

.score-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.detail-label {
  font-size: 0.8rem;
  color: #666;
}

.detail-value {
  font-weight: 600;
  color: #333;
}

.round-scores {
  margin-top: 1.5rem;
}

.round-header, .achievements-header {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.8rem;
}

.rounds-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.round-item {
  padding: 0.5rem;
  border-radius: 6px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.round-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.2rem;
}

.round-score {
  font-weight: 600;
  color: #333;
}

.missed-round {
  background: #f0f0f0;
  opacity: 0.7;
}

.player-achievements {
  margin-top: 1.5rem;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem;
  border-radius: 6px;
  background: #f8f9fa;
}

.achievement-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #FBBC05;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.2rem;
}

.achievement-description {
  font-size: 0.8rem;
  color: #666;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .score-details {
    grid-template-columns: 1fr;
  }
  
  .rounds-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .header-left {
    gap: 0.6rem;
  }
  
  .player-avatar {
    width: 36px;
    height: 36px;
  }
  
  .score-display {
    font-size: 1.1rem;
  }
  
  .rank-badge {
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
  }
}
</style> 