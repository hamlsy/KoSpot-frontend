<template>
  <div class="game-mode-picker">
    <h2 class="mode-title">게임 모드 선택</h2>
    
    <div class="mode-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="setActiveTab(tab.id)"
      >
        <i :class="tab.icon"></i>
        <span>{{ tab.name }}</span>
      </button>
    </div>
    
    <div class="mode-content">
      <!-- 개인전 모드 -->
      <div v-if="activeTab === 'individual'" class="mode-container">
        <div 
          v-for="mode in individualModes" 
          :key="mode.id"
          :class="['mode-card', { selected: selectedMode === mode.id }]"
          @click="selectMode(mode.id)"
        >
          <div class="mode-icon">
            <i :class="mode.icon"></i>
          </div>
          <div class="mode-info">
            <h3>{{ mode.name }}</h3>
            <p>{{ mode.description }}</p>
          </div>
        </div>
      </div>
      
      <!-- 협동 모드 -->
      <div v-if="activeTab === 'cooperative'" class="mode-container">
        <div 
          v-for="mode in cooperativeModes" 
          :key="mode.id"
          :class="['mode-card', { selected: selectedMode === mode.id }]"
          @click="selectMode(mode.id)"
        >
          <div class="mode-icon">
            <i :class="mode.icon"></i>
          </div>
          <div class="mode-info">
            <h3>{{ mode.name }}</h3>
            <p>{{ mode.description }}</p>
          </div>
        </div>
      </div>
      
      <!-- 경쟁 모드 -->
      <div v-if="activeTab === 'competitive'" class="mode-container">
        <div 
          v-for="mode in competitiveModes" 
          :key="mode.id"
          :class="['mode-card', { selected: selectedMode === mode.id }]"
          @click="selectMode(mode.id)"
        >
          <div class="mode-icon">
            <i :class="mode.icon"></i>
          </div>
          <div class="mode-info">
            <h3>{{ mode.name }}</h3>
            <p>{{ mode.description }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mode-details" v-if="selectedModeDetails">
      <h3>{{ selectedModeDetails.name }}</h3>
      <p class="mode-description">{{ selectedModeDetails.description }}</p>
      
      <div class="mode-features">
        <div class="feature">
          <i class="fas fa-users"></i>
          <span>{{ selectedModeDetails.playerCount }}</span>
        </div>
        <div class="feature">
          <i class="fas fa-clock"></i>
          <span>{{ selectedModeDetails.timeLimit }}</span>
        </div>
        <div class="feature">
          <i class="fas fa-map-marked-alt"></i>
          <span>{{ selectedModeDetails.mapType }}</span>
        </div>
      </div>
      
      <div class="mode-rules">
        <h4>게임 규칙</h4>
        <ul>
          <li v-for="(rule, index) in selectedModeDetails.rules" :key="index">
            {{ rule }}
          </li>
        </ul>
      </div>
    </div>
    
    <div class="action-buttons">
      <button 
        class="cancel-button"
        @click="$emit('cancel')"
      >
        취소
      </button>
      <button 
        class="confirm-button"
        :disabled="!selectedMode"
        @click="confirmSelection"
      >
        선택 완료
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameModePicker',
  
  data() {
    return {
      activeTab: 'individual',
      selectedMode: null,
      tabs: [
        { id: 'individual', name: '개인전', icon: 'fas fa-user' },
        { id: 'cooperative', name: '협동전', icon: 'fas fa-users' },
        { id: 'competitive', name: '경쟁전', icon: 'fas fa-trophy' }
      ],
      individualModes: [
        {
          id: 'solo_roadview',
          name: '로드뷰 개인전',
          icon: 'fas fa-road',
          description: '혼자서 로드뷰를 보고 현재 위치를 맞추는 게임입니다.'
        },
        {
          id: 'solo_photo',
          name: '포토 개인전',
          icon: 'fas fa-image',
          description: '혼자서 관광지 사진을 보고 현재 위치를 맞추는 게임입니다.'
        }
      ],
      cooperativeModes: [
        {
          id: 'team_roadview',
          name: '로드뷰 팀플레이',
          icon: 'fas fa-users',
          description: '팀을 이루어 함께 로드뷰를 보고 현재 위치를 맞추는 게임입니다. 팀원들과 협력하여 더 정확한 위치를 찾아보세요.'
        },
        {
          id: 'team_photo',
          name: '포토 팀플레이',
          icon: 'fas fa-images',
          description: '팀을 이루어 함께 관광지 사진을 보고 현재 위치를 맞추는 게임입니다. 팀원들과 협력하여 더 정확한 위치를 찾아보세요.'
        }
      ],
      competitiveModes: [
        {
          id: 'battle_roadview',
          name: '로드뷰 배틀',
          icon: 'fas fa-gamepad',
          description: '다른 플레이어들과 경쟁하며 로드뷰로 현재 위치를 맞추는 게임입니다. 가장 정확하고 빠르게 맞춘 플레이어가 승리합니다.'
        },
        {
          id: 'battle_photo',
          name: '포토 배틀',
          icon: 'fas fa-camera',
          description: '다른 플레이어들과 경쟁하며 관광지 사진으로 현재 위치를 맞추는 게임입니다. 가장 정확하고 빠르게 맞춘 플레이어가 승리합니다.'
        }
      ],
      modeDetails: {
        solo_roadview: {
          name: '로드뷰 개인전',
          description: '혼자서 로드뷰를 보고 현재 위치를 맞추는 게임입니다. 정해진 라운드 동안 가능한 정확하게 위치를 맞춰보세요.',
          playerCount: '1인',
          timeLimit: '라운드당 120초',
          mapType: '로드뷰',
          rules: [
            '각 라운드마다 무작위 위치의 로드뷰가 제공됩니다.',
            '제한 시간 내에 지도에서 현재 위치를 클릭하세요.',
            '실제 위치와의 거리에 따라 점수가 부여됩니다.',
            '모든 라운드 종료 후 총점이 계산됩니다.'
          ]
        },
        solo_photo: {
          name: '포토 개인전',
          description: '혼자서 관광지 사진을 보고 현재 위치를 맞추는 게임입니다. 정해진 라운드 동안 가능한 정확하게 위치를 맞춰보세요.',
          playerCount: '1인',
          timeLimit: '라운드당 90초',
          mapType: '사진',
          rules: [
            '각 라운드마다 무작위 관광지 사진이 제공됩니다.',
            '제한 시간 내에 지도에서 해당 관광지의 위치를 클릭하세요.',
            '실제 위치와의 거리에 따라 점수가 부여됩니다.',
            '모든 라운드 종료 후 총점이 계산됩니다.'
          ]
        },
        team_roadview: {
          name: '로드뷰 팀플레이',
          description: '팀을 이루어 함께 로드뷰를 보고 현재 위치를 맞추는 협동 게임입니다.',
          playerCount: '2-5인 팀',
          timeLimit: '라운드당 180초',
          mapType: '로드뷰',
          rules: [
            '각 라운드마다 무작위 위치의 로드뷰가 제공됩니다.',
            '팀원들과 채팅으로 의견을 나누고 협력하세요.',
            '팀원 중 한 명이 "Spot!" 버튼을 누르면 팀원들의 투표가 시작됩니다.',
            '과반수 이상이 동의하면 해당 위치로 제출됩니다.',
            '실제 위치와의 거리에 따라 팀 점수가 부여됩니다.',
            '다른 팀과 경쟁하여 가장 높은 점수를 얻는 팀이 승리합니다.'
          ]
        },
        team_photo: {
          name: '포토 팀플레이',
          description: '팀을 이루어 함께 관광지 사진을 보고 현재 위치를 맞추는 협동 게임입니다.',
          playerCount: '2-5인 팀',
          timeLimit: '라운드당 150초',
          mapType: '사진',
          rules: [
            '각 라운드마다 무작위 관광지 사진이 제공됩니다.',
            '팀원들과 채팅으로 의견을 나누고 협력하세요.',
            '팀원 중 한 명이 "Spot!" 버튼을 누르면 팀원들의 투표가 시작됩니다.',
            '과반수 이상이 동의하면 해당 위치로 제출됩니다.',
            '실제 위치와의 거리에 따라 팀 점수가 부여됩니다.',
            '다른 팀과 경쟁하여 가장 높은 점수를 얻는 팀이 승리합니다.'
          ]
        },
        battle_roadview: {
          name: '로드뷰 배틀',
          description: '다른 플레이어들과 경쟁하며 로드뷰로 현재 위치를 맞추는 게임입니다.',
          playerCount: '2-8인',
          timeLimit: '라운드당 120초',
          mapType: '로드뷰',
          rules: [
            '각 라운드마다 무작위 위치의 로드뷰가 제공됩니다.',
            '모든 플레이어는 동일한 로드뷰를 보게 됩니다.',
            '제한 시간 내에 지도에서 현재 위치를 클릭하세요.',
            '실제 위치와의 거리에 따라 점수가 부여됩니다.',
            '시간이 많이 남을수록 추가 점수가 부여됩니다.',
            '모든 라운드 종료 후 가장 높은 점수를 획득한 플레이어가 승리합니다.'
          ]
        },
        battle_photo: {
          name: '포토 배틀',
          description: '다른 플레이어들과 경쟁하며 관광지 사진으로 현재 위치를 맞추는 게임입니다.',
          playerCount: '2-8인',
          timeLimit: '라운드당 90초',
          mapType: '사진',
          rules: [
            '각 라운드마다 무작위 관광지 사진이 제공됩니다.',
            '모든 플레이어는 동일한 사진을 보게 됩니다.',
            '제한 시간 내에 지도에서 해당 관광지의 위치를 클릭하세요.',
            '실제 위치와의 거리에 따라 점수가 부여됩니다.',
            '시간이 많이 남을수록 추가 점수가 부여됩니다.',
            '모든 라운드 종료 후 가장 높은 점수를 획득한 플레이어가 승리합니다.'
          ]
        }
      }
    };
  },
  
  computed: {
    selectedModeDetails() {
      return this.selectedMode ? this.modeDetails[this.selectedMode] : null;
    }
  },
  
  methods: {
    setActiveTab(tabId) {
      this.activeTab = tabId;
      this.selectedMode = null;
    },
    
    selectMode(modeId) {
      this.selectedMode = modeId;
    },
    
    confirmSelection() {
      if (this.selectedMode) {
        this.$emit('select-mode', {
          id: this.selectedMode,
          details: this.selectedModeDetails
        });
      }
    }
  }
};
</script>

<style scoped>
.game-mode-picker {
  background-color: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  color: #fff;
}

.mode-title {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.8rem;
  font-weight: 700;
  color: #e6e6ff;
}

.mode-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #333355;
  padding-bottom: 10px;
}

.tab-button {
  background: transparent;
  border: none;
  color: #aaaacc;
  padding: 10px 20px;
  margin: 0 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
}

.tab-button i {
  font-size: 1.1rem;
}

.tab-button:hover {
  color: #ffffff;
  background-color: #2d2d44;
}

.tab-button.active {
  color: #ffffff;
  background-color: #3b3b5d;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.mode-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.mode-card {
  background-color: #2a2a45;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  height: 100px;
  border: 2px solid transparent;
}

.mode-card:hover {
  background-color: #343456;
  transform: translateY(-2px);
}

.mode-card.selected {
  border-color: #7f5af0;
  box-shadow: 0 0 10px rgba(127, 90, 240, 0.5);
}

.mode-icon {
  width: 60px;
  height: 60px;
  background-color: #3b3b5d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.mode-icon i {
  font-size: 1.8rem;
  color: #7f5af0;
}

.mode-info {
  flex: 1;
}

.mode-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #e2e2ff;
}

.mode-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #b8b8d0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mode-details {
  background-color: #2a2a45;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #7f5af0;
}

.mode-details h3 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: #e2e2ff;
}

.mode-description {
  color: #b8b8d0;
  margin-bottom: 15px;
  line-height: 1.5;
}

.mode-features {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #b8b8d0;
}

.feature i {
  color: #7f5af0;
}

.mode-rules {
  background-color: #343456;
  border-radius: 6px;
  padding: 15px;
}

.mode-rules h4 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  color: #e2e2ff;
}

.mode-rules ul {
  margin: 0;
  padding-left: 20px;
}

.mode-rules li {
  color: #b8b8d0;
  margin-bottom: 5px;
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.cancel-button, .confirm-button {
  padding: 10px 25px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-button {
  background-color: #3a3a5e;
  color: #d2d2f0;
}

.cancel-button:hover {
  background-color: #494973;
}

.confirm-button {
  background-color: #7f5af0;
  color: #ffffff;
}

.confirm-button:hover:not(:disabled) {
  background-color: #6a4ad8;
  transform: translateY(-2px);
}

.confirm-button:disabled {
  background-color: #4d4d69;
  color: #9595b1;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .mode-container {
    grid-template-columns: 1fr;
  }
  
  .mode-tabs {
    flex-wrap: wrap;
  }
  
  .tab-button {
    padding: 8px 15px;
    font-size: 0.9rem;
  }
  
  .mode-features {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 