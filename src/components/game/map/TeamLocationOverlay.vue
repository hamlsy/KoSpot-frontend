<template>
  <div class="team-location-overlay">
    <div class="team-marker" :style="{ borderColor: teamColor }">
      <div class="team-icon">
        <span class="team-initial">{{ teamInitial }}</span>
      </div>
      <div class="team-pulse" :style="{ backgroundColor: teamColor }"></div>
    </div>
    
    <div class="team-info">
      <div class="team-name" :style="{ backgroundColor: teamColor }">
        {{ teamName }}
      </div>
      <div class="team-members" v-if="showMembers">
        <div v-for="(member, index) in teamMembers" :key="index" class="member">
          <img v-if="member.avatar" :src="member.avatar" :alt="member.name" class="member-avatar" />
          <div v-else class="member-initial">{{ getInitial(member.name) }}</div>
          <span class="member-name">{{ member.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamLocationOverlay',
  
  props: {
    // 팀 ID
    teamId: {
      type: String,
      required: true
    },
    
    // 팀 이름
    teamName: {
      type: String,
      required: true
    },
    
    // 팀 색상
    teamColor: {
      type: String,
      default: '#7f5af0'
    },
    
    // 팀원 목록
    teamMembers: {
      type: Array,
      default: () => []
    },
    
    // 팀원 표시 여부
    showMembers: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    // 팀 이름의 첫 글자
    teamInitial() {
      return this.teamName.charAt(0).toUpperCase();
    }
  },
  
  methods: {
    // 이름에서 이니셜 추출
    getInitial(name) {
      return name ? name.charAt(0).toUpperCase() : '?';
    }
  }
};
</script>

<style scoped>
.team-location-overlay {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 5;
  margin-top: -40px;
}

.team-marker {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #1f1f33;
  border: 3px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.team-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.team-initial {
  color: white;
  font-weight: bold;
  font-size: 16px;
  user-select: none;
}

.team-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: team-pulse 2s infinite;
  opacity: 0.5;
  z-index: -1;
}

.team-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 5px;
}

.team-name {
  padding: 3px 8px;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-bottom: 5px;
  user-select: none;
}

.team-members {
  background-color: rgba(31, 31, 51, 0.8);
  border-radius: 4px;
  padding: 5px;
  min-width: 120px;
  max-width: 200px;
}

.member {
  display: flex;
  align-items: center;
  margin-bottom: 3px;
  padding: 2px 0;
}

.member:last-child {
  margin-bottom: 0;
}

.member-avatar, .member-initial {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 5px;
  flex-shrink: 0;
}

.member-initial {
  background-color: #7f5af0;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

.member-name {
  color: white;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}

@keyframes team-pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  70% {
    transform: scale(1.5);
    opacity: 0.2;
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}
</style> 