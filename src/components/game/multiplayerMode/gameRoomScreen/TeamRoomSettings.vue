<template>
  <div class="team-room-settings">
    <h3 class="settings-title">팀 모드 설정</h3>
    
    <div class="settings-section">
      <div class="setting-item">
        <div class="setting-label">
          <span>팀 모드 활성화</span>
          <el-tooltip content="팀 모드를 활성화하면 플레이어들이 팀을 이루어 협력할 수 있습니다" placement="top">
            <i class="el-icon-question"></i>
          </el-tooltip>
        </div>
        <el-switch
          v-model="localSettings.teamMode"
          @change="updateSettings"
          :disabled="!isHost"
        ></el-switch>
      </div>
      
      <template v-if="localSettings.teamMode">
        <div class="setting-item">
          <div class="setting-label">
            <span>최대 팀 수</span>
            <el-tooltip content="게임에 참여할 수 있는 최대 팀 수를 설정합니다" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </div>
          <el-input-number
            v-model="localSettings.maxTeams"
            :min="2"
            :max="6"
            :step="1"
            @change="updateSettings"
            :disabled="!isHost"
          ></el-input-number>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <span>팀당 최대 플레이어 수</span>
            <el-tooltip content="각 팀에 참여할 수 있는 최대 플레이어 수를 설정합니다" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </div>
          <el-input-number
            v-model="localSettings.maxPlayersPerTeam"
            :min="2"
            :max="5"
            :step="1"
            @change="updateSettings"
            :disabled="!isHost"
          ></el-input-number>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <span>팀 투표 시간 제한 (초)</span>
            <el-tooltip content="팀 투표 진행 시 제한 시간을 설정합니다" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </div>
          <el-input-number
            v-model="localSettings.teamVotingTimeLimit"
            :min="5"
            :max="30"
            :step="5"
            @change="updateSettings"
            :disabled="!isHost"
          ></el-input-number>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">
            <span>팀 채팅 활성화</span>
            <el-tooltip content="팀원들끼리 채팅할 수 있는 기능을 활성화합니다" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </div>
          <el-switch
            v-model="localSettings.teamChatEnabled"
            @change="updateSettings"
            :disabled="!isHost"
          ></el-switch>
        </div>
      </template>
    </div>
    
    <div v-if="localSettings.teamMode && isHost" class="teams-management">
      <h4 class="teams-title">팀 관리</h4>
      
      <div class="teams-list">
        <div v-for="(team, index) in teams" :key="index" class="team-item">
          <div class="team-header" :style="{ backgroundColor: team.color }">
            <span class="team-name">{{ team.name }}</span>
            <div class="team-actions">
              <el-button 
                type="text" 
                icon="el-icon-edit"
                @click="openTeamEditModal(team)"
                size="mini"
              ></el-button>
              <el-button 
                type="text" 
                icon="el-icon-delete"
                @click="deleteTeam(team.id)"
                size="mini"
                :disabled="isDefaultTeam(team)"
              ></el-button>
            </div>
          </div>
          <div class="team-info">
            <div class="team-members-count">
              <i class="el-icon-user"></i>
              <span>{{ getTeamMembersCount(team.id) }} / {{ localSettings.maxPlayersPerTeam }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="canAddTeam" class="add-team-btn">
          <el-button
            type="primary"
            icon="el-icon-plus"
            size="small"
            @click="openTeamAddModal"
          >
            팀 추가
          </el-button>
        </div>
      </div>
      
      <el-dialog
        :title="teamDialogTitle"
        :visible.sync="showTeamDialog"
        width="400px"
        :close-on-click-modal="false"
        class="team-dialog"
      >
        <div class="team-form">
          <el-form :model="teamForm" label-position="top">
            <el-form-item label="팀 이름">
              <el-input v-model="teamForm.name" maxlength="20"></el-input>
            </el-form-item>
            
            <el-form-item label="팀 색상">
              <el-color-picker v-model="teamForm.color" show-alpha></el-color-picker>
            </el-form-item>
          </el-form>
        </div>
        
        <span slot="footer" class="dialog-footer">
          <el-button @click="showTeamDialog = false">취소</el-button>
          <el-button type="primary" @click="saveTeam">저장</el-button>
        </span>
      </el-dialog>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamRoomSettings',
  
  props: {
    // 방 설정
    settings: {
      type: Object,
      required: true
    },
    
    // 방장 여부
    isHost: {
      type: Boolean,
      default: false
    },
    
    // 현재 팀 목록
    teams: {
      type: Array,
      default: () => []
    },
    
    // 플레이어 목록
    players: {
      type: Array,
      default: () => []
    }
  },
  
  data() {
    return {
      localSettings: {
        teamMode: false,
        maxTeams: 4,
        maxPlayersPerTeam: 3,
        teamVotingTimeLimit: 15,
        teamChatEnabled: true
      },
      
      showTeamDialog: false,
      teamForm: {
        id: null,
        name: '',
        color: '#7F5AF0'
      },
      isEditingTeam: false
    };
  },
  
  computed: {
    teamDialogTitle() {
      return this.isEditingTeam ? '팀 수정' : '새 팀 추가';
    },
    
    canAddTeam() {
      return this.teams.length < this.localSettings.maxTeams;
    }
  },
  
  watch: {
    settings: {
      handler(newSettings) {
        // 깊은 복사를 통해 설정 값을 로컬 데이터에 복사
        this.localSettings = {
          teamMode: newSettings.teamMode || false,
          maxTeams: newSettings.maxTeams || 4,
          maxPlayersPerTeam: newSettings.maxPlayersPerTeam || 3,
          teamVotingTimeLimit: newSettings.teamVotingTimeLimit || 15,
          teamChatEnabled: newSettings.teamChatEnabled !== undefined ? newSettings.teamChatEnabled : true
        };
      },
      immediate: true,
      deep: true
    }
  },
  
  methods: {
    // 설정 업데이트
    updateSettings() {
      this.$emit('update:settings', { ...this.localSettings });
    },
    
    // 팀 추가 모달 열기
    openTeamAddModal() {
      this.isEditingTeam = false;
      this.teamForm = {
        id: null,
        name: `팀 ${this.teams.length + 1}`,
        color: this.getRandomColor()
      };
      this.showTeamDialog = true;
    },
    
    // 팀 수정 모달 열기
    openTeamEditModal(team) {
      this.isEditingTeam = true;
      this.teamForm = {
        id: team.id,
        name: team.name,
        color: team.color
      };
      this.showTeamDialog = true;
    },
    
    // 팀 저장 (추가 또는 수정)
    saveTeam() {
      if (!this.teamForm.name.trim()) {
        this.$message.error('팀 이름을 입력해주세요.');
        return;
      }
      
      const teamData = {
        id: this.isEditingTeam ? this.teamForm.id : Date.now().toString(),
        name: this.teamForm.name,
        color: this.teamForm.color
      };
      
      if (this.isEditingTeam) {
        this.$emit('update-team', teamData);
      } else {
        this.$emit('add-team', teamData);
      }
      
      this.showTeamDialog = false;
    },
    
    // 팀 삭제
    deleteTeam(teamId) {
      this.$confirm('정말로 이 팀을 삭제하시겠습니까? 이 팀에 속한 플레이어들은 팀이 없는 상태가 됩니다.', '팀 삭제', {
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        type: 'warning'
      }).then(() => {
        this.$emit('delete-team', teamId);
      }).catch(() => {});
    },
    
    // 팀 멤버 수 가져오기
    getTeamMembersCount(teamId) {
      return this.players.filter(player => player.teamId === teamId).length;
    },
    
    // 기본 팀인지 확인 (삭제 불가)
    isDefaultTeam(team) {
      // 예: 처음 두 팀은 기본 팀으로 설정하여 삭제 불가능하게 할 수 있음
      return this.teams.length <= 2;
    },
    
    // 랜덤 색상 생성
    getRandomColor() {
      const colors = [
        '#7F5AF0', // 보라색
        '#2CB67D', // 녹색
        '#FF8E3C', // 주황색
        '#FF5470', // 분홍색
        '#3DA9FC', // 파란색
        '#FFCC00'  // 노란색
      ];
      
      // 이미 사용 중인 색상은 제외
      const usedColors = this.teams.map(team => team.color);
      const availableColors = colors.filter(color => !usedColors.includes(color));
      
      if (availableColors.length > 0) {
        return availableColors[0];
      }
      
      // 모든 색상이 사용 중이면 약간 변형된 색상 반환
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }
};
</script>

<style scoped>
.team-room-settings {
  background-color: #242629;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.settings-title {
  font-size: 18px;
  color: #fffffe;
  margin-top: 0;
  margin-bottom: 16px;
  font-weight: 600;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a1b2;
}

.setting-label i {
  color: #7f5af0;
  cursor: pointer;
}

.teams-management {
  margin-top: 24px;
  border-top: 1px solid #3c3d3e;
  padding-top: 16px;
}

.teams-title {
  font-size: 16px;
  color: #fffffe;
  margin-top: 0;
  margin-bottom: 16px;
  font-weight: 500;
}

.teams-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.team-item {
  background-color: #16161a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.team-header {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-name {
  color: #fffffe;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-actions {
  display: flex;
  gap: 4px;
}

.team-info {
  padding: 12px;
}

.team-members-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a1b2;
}

.add-team-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(127, 90, 240, 0.1);
  border-radius: 8px;
  min-height: 100px;
}

/* 다이얼로그 스타일 */
.team-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
}

.team-form {
  padding: 0 10px;
}
</style> 