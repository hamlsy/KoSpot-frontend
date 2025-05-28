<template>
  <div class="room-settings">
    <h2 class="settings-header">게임 설정</h2>
    
    <div class="settings-container">
      <!-- 게임 모드 선택 -->
      <div class="settings-group">
        <h3 class="group-title">게임 모드</h3>
        <div class="mode-selector">
          <el-radio-group v-model="localSettings.gameMode" @change="updateSettings" :disabled="!isHost">
            <el-radio-button label="normal">일반 모드</el-radio-button>
            <el-radio-button label="team">팀 모드</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      
      <!-- 팀 모드 설정 (팀 모드일 때만 표시) -->
      <team-room-settings
        v-if="localSettings.gameMode === 'team'"
        :settings="teamSettings"
        @update:settings="updateTeamSettings"
        :is-host="isHost"
        :teams="teams"
        :players="players"
        @add-team="addTeam"
        @update-team="updateTeam"
        @delete-team="deleteTeam"
      ></team-room-settings>
      
      <!-- 기본 게임 설정 -->
      <div class="settings-group">
        // ... existing code ...
      </div>
      
      // ... existing code ...
    </div>
  </div>
</template>

<script>
import TeamRoomSettings from './TeamRoomSettings.vue';

export default {
  name: 'RoomSettings',
  
  components: {
    TeamRoomSettings
  },
  
  props: {
    // ... existing code ...
    // 팀 목록 (팀 모드에서 사용)
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
        // ... existing code ...
        gameMode: 'normal', // 'normal' 또는 'team'
      },
      // 팀 모드 설정
      teamSettings: {
        teamMode: true,
        maxTeams: 4,
        maxPlayersPerTeam: 3,
        teamVotingTimeLimit: 15,
        teamChatEnabled: true
      }
      // ... existing code ...
    };
  },
  
  watch: {
    settings: {
      handler(newSettings) {
        // ... existing code ...
        this.localSettings.gameMode = newSettings.gameMode || 'normal';
        
        // 팀 설정 초기화
        if (newSettings.teamSettings) {
          this.teamSettings = { ...newSettings.teamSettings };
        }
      },
      immediate: true,
      deep: true
    }
  },
  
  methods: {
    // ... existing code ...
    
    // 설정 업데이트
    updateSettings() {
      const updatedSettings = { ...this.localSettings };
      
      // 팀 모드 설정 추가
      if (this.localSettings.gameMode === 'team') {
        updatedSettings.teamSettings = { ...this.teamSettings };
      }
      
      this.$emit('update:settings', updatedSettings);
    },
    
    // 팀 설정 업데이트
    updateTeamSettings(newTeamSettings) {
      this.teamSettings = { ...newTeamSettings };
      this.updateSettings();
    },
    
    // 팀 추가
    addTeam(team) {
      this.$emit('add-team', team);
    },
    
    // 팀 업데이트
    updateTeam(team) {
      this.$emit('update-team', team);
    },
    
    // 팀 삭제
    deleteTeam(teamId) {
      this.$emit('delete-team', teamId);
    }
    // ... existing code ...
  }
};
</script>

// ... existing code ... 