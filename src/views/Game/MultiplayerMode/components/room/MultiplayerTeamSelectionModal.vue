<template>
  <div class="team-selection-modal" v-if="show">
    <div class="modal-backdrop" @click.self="$emit('close')"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-users"></i> 팀 선택하기
        </h3>
        <button class="close-button" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="team-selection-desc">참가하고 싶은 팀을 선택해주세요.</p>
        
        <div class="teams-container">
          <div 
            v-for="team in availableTeams" 
            :key="team.id"
            class="team-card"
            :class="{ 
              'selected': selectedTeam === team.id,
              [`team-${team.color}`]: true
            }"
            @click="selectTeam(team.id)"
          >
            <div class="team-header">
              <div class="team-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="team-name">{{ team.name }}</div>
            </div>
            
            <div class="team-members">
              <div 
                v-for="player in getTeamPlayers(team.id)" 
                :key="player.id"
                class="team-member"
              >
                <img 
                  :src="player.profileImage || '/assets/default-avatar.png'" 
                  :alt="player.nickname"
                  class="member-avatar"
                >
                <div class="member-info">
                  <div class="member-name">{{ player.nickname }}</div>
                  <div class="member-level">Lv. {{ player.level }}</div>
                </div>
              </div>
              
              <!-- 빈 슬롯 표시 -->
              <div 
                v-for="n in (maxTeamSize - getTeamPlayers(team.id).length)" 
                :key="`empty-${team.id}-${n}`"
                class="team-member empty"
              >
                <div class="empty-slot">
                  <i class="fas fa-user-plus"></i>
                  <span>빈 자리</span>
                </div>
              </div>
            </div>
            
            <div class="team-status">
              <div class="team-count">
                {{ getTeamPlayers(team.id).length }} / {{ maxTeamSize }}
              </div>
              <div 
                class="team-status-badge"
                :class="{ 'full': getTeamPlayers(team.id).length >= maxTeamSize }"
              >
                {{ getTeamPlayers(team.id).length >= maxTeamSize ? '가득 참' : '참가 가능' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">취소</button>
        <button 
          class="join-button" 
          @click="joinTeam"
          :disabled="!selectedTeam || isTeamFull(selectedTeam)"
        >
          <i class="fas fa-sign-in-alt"></i>
          팀 참가하기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamSelectionModal',
  
  props: {
    show: {
      type: Boolean,
      required: true
    },
    players: {
      type: Array,
      required: true
    },
    availableTeams: {
      type: Array,
      required: true
    },
    maxTeamSize: {
      type: Number,
      default: 2
    },
    currentUserId: {
      type: String,
      required: true
    },
    currentUserTeam: {
      type: String,
      default: null
    }
  },
  
  data() {
    return {
      selectedTeam: null
    };
  },
  
  watch: {
    show(newValue) {
      if (newValue) {
        this.selectedTeam = this.currentUserTeam;
      }
    },
    
    currentUserTeam(newValue) {
      this.selectedTeam = newValue;
    }
  },
  
  methods: {
    getTeamPlayers(teamId) {
      return this.players.filter(player => player.teamId === teamId);
    },
    
    selectTeam(teamId) {
      // 가득 찬 팀은 선택 불가
      if (this.isTeamFull(teamId)) return;
      
      this.selectedTeam = teamId;
    },
    
    isTeamFull(teamId) {
      const teamPlayers = this.getTeamPlayers(teamId);
      const isMember = teamPlayers.some(player => player.id === this.currentUserId);
      
      // 이미 멤버라면 가득차도 선택 가능
      if (isMember) return false;
      
      return teamPlayers.length >= this.maxTeamSize;
    },
    
    joinTeam() {
      if (!this.selectedTeam || this.isTeamFull(this.selectedTeam)) return;
      
      this.$emit('join-team', this.selectedTeam);
    }
  },
  
  created() {
    this.selectedTeam = this.currentUserTeam;
  }
};
</script>

<style scoped>
.team-selection-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.modal-container {
  position: relative;
  width: 90%;
  max-width: 700px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #4a6cf7 0%, #2563eb 100%);
  color: white;
}

.modal-title {
  margin: 0;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-button {
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

.modal-body {
  padding: 1.5rem;
}

.team-selection-desc {
  margin: 0 0 1.5rem;
  text-align: center;
  color: #4b5563;
  font-size: 1.1rem;
}

.teams-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.team-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.team-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.team-card.selected {
  border-color: currentColor;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.team-card.selected::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 30px;
  background-color: currentColor;
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}

.team-card.selected::after {
  content: "\f00c";
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  position: absolute;
  top: 5px;
  right: 5px;
  color: white;
  font-size: 0.7rem;
}

.team-blue {
  color: #3b82f6;
}

.team-red {
  color: #ef4444;
}

.team-green {
  color: #10b981;
}

.team-yellow {
  color: #f59e0b;
}

.team-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.team-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: currentColor;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.team-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.team-members {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
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

.team-member:hover {
  background-color: #f1f5f9;
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
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.2rem;
}

.member-level {
  font-size: 0.8rem;
  color: #64748b;
}

.team-member.empty {
  opacity: 0.6;
  border: 1px dashed #cbd5e1;
  background-color: transparent;
}

.empty-slot {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.9rem;
}

.team-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-count {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.team-status-badge {
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  background-color: #dcfce7;
  color: #10b981;
  font-weight: 500;
}

.team-status-badge.full {
  background-color: #fee2e2;
  color: #ef4444;
}

.modal-footer {
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #eee;
}

.cancel-button, .join-button {
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background-color: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.cancel-button:hover {
  background-color: #f8fafc;
  color: #475569;
}

.join-button {
  background-color: #4a6cf7;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.join-button:hover {
  background-color: #3b5de7;
}

.join-button:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
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

@media (max-width: 640px) {
  .teams-container {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .cancel-button, .join-button {
    width: 100%;
  }
}
</style>