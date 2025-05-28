<template>
  <div class="team-round-results" v-if="visible">
    <div class="results-backdrop"></div>
    <div class="results-container">
      <div class="results-header">
        <div class="round-info">
          <div class="round-label">라운드 {{ round }}/{{ totalRounds }}</div>
          <div class="rounds-progress">
            <div 
              v-for="i in totalRounds" 
              :key="i"
              class="round-indicator"
              :class="{ 
                'completed': i < round, 
                'current': i === round,
                'upcoming': i > round
              }"
            ></div>
          </div>
        </div>
        
        <h2 class="location-name">{{ locationName }}</h2>
        
        <button class="close-button" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="results-content">
        <div class="results-map-section">
          <div class="map-container">
            <kakao-map
              ref="resultsMap"
              :center="mapCenter"
              :actual-position="actualLocation"
              :disable-interaction="true"
              :team-markers="teamGuesses"
            />
          </div>
          
          <div class="map-info">
            <div v-if="locationDescription" class="location-description">
              <h3><i class="fas fa-info-circle"></i> 장소 정보</h3>
              <p>{{ locationDescription }}</p>
              <div v-if="interestingFact" class="interesting-fact">
                <i class="fas fa-lightbulb"></i> {{ interestingFact }}
              </div>
            </div>
            
            <div v-if="locationImage" class="location-image">
              <img :src="locationImage" :alt="locationName" />
            </div>
          </div>
        </div>
        
        <div class="team-results-section">
          <h3 class="section-title">팀 결과</h3>
          
          <div class="teams-results-list">
            <div 
              v-for="(team, index) in sortedTeams"
              :key="team.id"
              class="team-result-card"
              :class="`team-${getTeamColor(team.id)}-card`"
            >
              <div class="team-rank">{{ index + 1 }}</div>
              <div class="team-info">
                <div class="team-name">{{ team.name }} 팀</div>
                <div class="team-score">{{ formatNumber(team.roundScore) }} 점</div>
              </div>
              <div class="team-distance">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ formatDistance(team.distance) }}</span>
              </div>
              <div class="team-members">
                <div 
                  v-for="player in getTeamPlayers(team.id)"
                  :key="player.id"
                  class="team-member"
                  :class="{ 'current-player': player.id === currentUserId }"
                >
                  <img :src="player.profileImage || '/assets/default-avatar.png'" :alt="player.nickname" class="member-avatar">
                  <div class="member-info">
                    <div class="member-name">{{ player.nickname }}</div>
                    <div class="member-stats">
                      <span class="member-score">{{ formatNumber(player.roundScore) }} 점</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="results-footer">
        <div class="footer-stats">
          <div v-if="round === totalRounds" class="final-message">
            마지막 라운드가 끝났습니다!
          </div>
          <div v-else class="round-progress">
            다음 라운드까지: {{ nextRoundCountdown }}
          </div>
        </div>
        
        <div class="footer-buttons">
          <button 
            v-if="round < totalRounds"
            class="next-button"
            @click="$emit('next-round')"
          >
            <i class="fas fa-arrow-right"></i>
            다음 라운드
          </button>
          <button 
            v-else
            class="finish-button"
            @click="$emit('finish-game')"
          >
            <i class="fas fa-flag-checkered"></i>
            게임 종료
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KakaoMap from '@/components/game/common/kakao/KakaoMap.vue';

export default {
  name: 'TeamRoundResults',
  
  components: {
    KakaoMap
  },
  
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    teams: {
      type: Array,
      required: true
    },
    players: {
      type: Array,
      required: true
    },
    actualLocation: {
      type: Object,
      required: true
    },
    round: {
      type: Number,
      required: true
    },
    totalRounds: {
      type: Number,
      required: true
    },
    currentUserId: {
      type: String,
      required: true
    },
    currentUserTeam: {
      type: String,
      default: null
    },
    locationName: {
      type: String,
      default: '알 수 없는 위치'
    },
    locationDescription: {
      type: String,
      default: ''
    },
    locationImage: {
      type: String,
      default: ''
    },
    interestingFact: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      countdownTime: 10,
      timer: null,
      teamsWithResults: []
    };
  },
  
  computed: {
    mapCenter() {
      return this.actualLocation;
    },
    
    sortedTeams() {
      if (this.teamsWithResults.length === 0) return [];
      
      return [...this.teamsWithResults].sort((a, b) => b.roundScore - a.roundScore);
    },
    
    nextRoundCountdown() {
      if (this.countdownTime <= 0) {
        return '카운트 종료';
      }
      
      return `${this.countdownTime}초`;
    },
    
    // 팀 마커 정보
    teamGuesses() {
      return this.teamsWithResults.map(team => ({
        id: team.id,
        position: team.guessPosition,
        color: this.getTeamColor(team.id)
      }));
    }
  },
  
  watch: {
    visible(newValue) {
      if (newValue) {
        this.startCountdown();
        this.prepareTeamResults();
      } else {
        this.clearCountdown();
      }
    }
  },
  
  methods: {
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    formatDistance(distance) {
      if (!distance && distance !== 0) return '측정 불가';
      
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      } else {
        return `${distance.toFixed(1)}km`;
      }
    },
    
    getTeamColor(teamId) {
      const colorMap = {
        'team1': 'blue',
        'team2': 'red',
        'team3': 'green',
        'team4': 'yellow'
      };
      
      return colorMap[teamId] || 'blue';
    },
    
    getTeamPlayers(teamId) {
      return this.players.filter(player => player.teamId === teamId)
        .sort((a, b) => b.roundScore - a.roundScore);
    },
    
    startCountdown() {
      this.clearCountdown();
      this.countdownTime = 10;
      
      this.timer = setInterval(() => {
        if (this.countdownTime > 0) {
          this.countdownTime--;
        } else {
          this.clearCountdown();
          
          // 마지막 라운드가 아니면 자동으로 다음 라운드로 진행
          if (this.round < this.totalRounds) {
            this.$emit('next-round');
          }
        }
      }, 1000);
    },
    
    clearCountdown() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    
    prepareTeamResults() {
      // 테스트용 데이터 생성 (실제로는 서버에서 받아옴)
      this.teamsWithResults = this.teams.map(team => {
        // 팀 내 플레이어
        const teamPlayers = this.players.filter(p => p.teamId === team.id);
        
        // 테스트용 랜덤 데이터 생성
        const randomDistance = Math.random() * 20; // 0~20km 범위
        const roundScore = Math.max(0, Math.floor(5000 - randomDistance * 250));
        
        // 플레이어별 점수 할당 (테스트용)
        teamPlayers.forEach(player => {
          player.roundScore = Math.floor(roundScore / teamPlayers.length) + Math.floor(Math.random() * 100);
        });
        
        // 가상의 팀 추측 위치 생성 (실제로는 서버에서 받아옴)
        const guessPosition = {
          lat: this.actualLocation.lat + (Math.random() * 0.04 - 0.02),
          lng: this.actualLocation.lng + (Math.random() * 0.04 - 0.02)
        };
        
        return {
          ...team,
          distance: randomDistance,
          roundScore: roundScore,
          guessPosition: guessPosition
        };
      });
    }
  },
  
  beforeUnmount() {
    this.clearCountdown();
  }
};
</script>

<style scoped>
.team-round-results {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.results-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
}

.results-container {
  position: relative;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.4s ease;
}

.results-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #4a6cf7 0%, #2563eb 100%);
  color: white;
  position: relative;
  display: flex;
  flex-direction: column;
}

.round-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.round-label {
  font-size: 1.1rem;
  font-weight: 600;
}

.rounds-progress {
  display: flex;
  gap: 0.4rem;
}

.round-indicator {
  width: 24px;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.3);
}

.round-indicator.completed {
  background-color: white;
}

.round-indicator.current {
  background-color: #f59e0b;
}

.location-name {
  font-size: 1.6rem;
  margin: 0;
  font-weight: 700;
  text-align: center;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.results-content {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.results-map-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.map-container {
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.location-description {
  background-color: #f9fafb;
  padding: 1.2rem;
  border-radius: 12px;
}

.location-description h3 {
  font-size: 1.1rem;
  margin: 0 0 0.8rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-description p {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #4b5563;
}

.interesting-fact {
  background-color: #e0f2fe;
  padding: 0.8rem;
  border-radius: 8px;
  color: #0369a1;
  font-size: 0.9rem;
  display: flex;
  gap: 0.5rem;
  line-height: 1.4;
}

.location-image {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
}

.location-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.team-results-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.3rem;
  margin: 0 0 1rem;
  color: #333;
}

.teams-results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-result-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  border: 1px solid #eee;
  transition: transform 0.2s ease;
}

.team-result-card:hover {
  transform: translateY(-3px);
}

.team-blue-card {
  border-top: 4px solid #3b82f6;
}

.team-red-card {
  border-top: 4px solid #ef4444;
}

.team-green-card {
  border-top: 4px solid #10b981;
}

.team-yellow-card {
  border-top: 4px solid #f59e0b;
}

.team-rank {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  color: #64748b;
}

.team-info {
  flex: 1;
}

.team-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.team-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4a6cf7;
}

.team-distance {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f9fafb;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.team-distance i {
  color: #ef4444;
}

.team-members {
  width: 100%;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  margin-top: 0.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem;
  background-color: #f9fafb;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.team-member.current-player {
  background-color: #e0f2fe;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-stats {
  font-size: 0.8rem;
  color: #64748b;
}

.member-score {
  font-weight: 600;
  color: #4a6cf7;
}

.results-footer {
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eee;
  background-color: #f9fafb;
}

.footer-stats {
  font-size: 1rem;
}

.final-message {
  font-weight: 600;
  color: #10b981;
}

.round-progress {
  color: #64748b;
}

.footer-buttons {
  display: flex;
  gap: 1rem;
}

.next-button, .finish-button {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.next-button {
  background-color: #4a6cf7;
  color: white;
  border: none;
}

.next-button:hover {
  background-color: #3b5de7;
  transform: translateY(-2px);
}

.finish-button {
  background-color: #10b981;
  color: white;
  border: none;
}

.finish-button:hover {
  background-color: #0d9488;
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .results-map-section {
    grid-template-columns: 1fr;
  }
  
  .map-container {
    height: 250px;
  }
  
  .team-members {
    grid-template-columns: 1fr;
  }
}
</style> 