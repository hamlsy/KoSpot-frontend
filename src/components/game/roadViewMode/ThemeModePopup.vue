<template>
  <div class="theme-mode-popup" v-if="show">
    <div class="popup-content">
      <div class="popup-header">
        <h2>테마 게임</h2>
        <button @click="closePopup" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="popup-body">
        <!-- 왼쪽: 테마 리스트 -->
        <div class="theme-list-container" style="background-color: #f8fafc;">
          <h3 class="section-title">테마 선택</h3>
          <div class="theme-list">
            <div 
              v-for="theme in themes" 
              :key="theme.id"
              class="theme-item"
              :class="{ 'selected': selectedTheme === theme.id }"
              @click="selectTheme(theme.id)"
            >
              <div class="theme-image-container" style="border-radius: 12px;">
                <img :src="theme.image" :alt="theme.name" class="theme-image" style="display: block;">
                <div class="theme-overlay">
                  <h4>{{ theme.name }}</h4>
                </div>
                <div class="theme-completion-indicator" v-if="theme.completedLocations === theme.totalLocations">
                  <i class="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 테마 상세 정보 -->
        <div class="theme-detail-container" v-if="selectedThemeData" style="background-color: #ffffff;">
          <div class="theme-detail-header" :style="{ backgroundImage: `url(${selectedThemeData.image})` }">
            <div class="theme-detail-header-overlay">
              <h3>{{ selectedThemeData.name }}</h3>
              <div class="theme-progress">
                <div class="progress-text">
                  <span class="progress-value">{{ selectedThemeData.completedLocations }}</span>
                  <span class="progress-separator">/</span>
                  <span class="progress-total">{{ selectedThemeData.totalLocations }}</span>
                  <span class="progress-label">지역 완료</span>
                </div>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{width: `${(selectedThemeData.completedLocations / selectedThemeData.totalLocations) * 100}%`}"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="theme-description">
            <p>{{ selectedThemeData.description }}</p>
          </div>

          <div class="theme-locations">
            <h4 class="locations-title">플레이한 지역</h4>
            <div class="locations-grid">
              <div 
                v-for="location in selectedThemeData.locations" 
                :key="location.id"
                class="location-item"
                :class="{ 'unlocked': location.unlocked }"
              >
                <div class="location-icon">
                  <i class="fas fa-check-circle" v-if="location.unlocked && location.achievement"></i>
                  <i class="fas fa-map-marker-alt" v-else-if="location.unlocked"></i>
                  <i class="fas fa-question" v-else></i>
                </div>
                <div class="location-info">
                  <div class="location-name">
                    <span v-if="location.unlocked">{{ location.name }}</span>
                    <span v-else>???</span>
                  </div>
                  <div class="location-score" v-if="location.unlocked">
                    <span>최고점수: {{ location.highScore || 0 }}점</span>
                  </div>
                  <div class="location-achievement" v-if="location.unlocked && location.achievement">
                    <span class="achievement-badge">업적 달성</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="theme-achievements">
            <h4 class="achievements-title">테마 업적</h4>
            <div class="achievements-list">
              <div class="achievement-item" :class="{ 'achieved': isAllLocationsCompleted }">
                <div class="achievement-icon">
                  <i class="fas fa-trophy"></i>
                </div>
                <div class="achievement-info">
                  <h5>전체 지역 완료</h5>
                  <p>모든 지역을 플레이하고 {{ selectedThemeData.completedLocations }}/{{ selectedThemeData.totalLocations }} 지역 해금</p>
                </div>
                <div class="achievement-status">
                  <i class="fas fa-check-circle" v-if="isAllLocationsCompleted"></i>
                  <i class="fas fa-times-circle" v-else></i>
                </div>
              </div>
              <div class="achievement-item" :class="{ 'achieved': hasHighScoreAchievement }">
                <div class="achievement-icon">
                  <i class="fas fa-star"></i>
                </div>
                <div class="achievement-info">
                  <h5>고득점 달성</h5>
                  <p>모든 지역에서 일정 점수(800점) 이상 획득</p>
                </div>
                <div class="achievement-status">
                  <i class="fas fa-check-circle" v-if="hasHighScoreAchievement"></i>
                  <i class="fas fa-times-circle" v-else></i>
                </div>
              </div>
            </div>
          </div>

          <button
            class="start-game-button theme-color"
            @click="startGame"
            :disabled="!isGameStartReady"
            style="height: 60px; display: flex; align-items: center; justify-content: center;"
          >
            게임 시작
          </button>
        </div>

        <!-- 테마가 선택되지 않았을 때 표시할 안내 메시지 -->
        <div class="theme-detail-placeholder" v-else>
          <div class="placeholder-content">
            <i class="fas fa-map-marked-alt"></i>
            <p>왼쪽에서 테마를 선택하면 상세 정보가 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ThemeModePopup",
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedTheme: null,
      themes: [
        {
          id: "tourist",
          name: "관광 명소",
          icon: "fas fa-landmark",
          image: "https://images.unsplash.com/photo-1601621915196-2ad9b3b3c249?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          description: "한국의 유명 관광 명소들을 탐험하세요. 경복궁부터 해운대까지, 대한민국의 아름다운 명소들을 방문하고 점수를 획득하세요.",
          completedLocations: 10,
          totalLocations: 10,
          locations: [
            { id: 1, name: "경복궁", unlocked: true, highScore: 950, achievement: true },
            { id: 2, name: "남산타워", unlocked: true, highScore: 920, achievement: true },
            { id: 3, name: "해운대", unlocked: true, highScore: 880, achievement: true },
            { id: 4, name: "제주 성산일출봉", unlocked: true, highScore: 900, achievement: true },
            { id: 5, name: "불국사", unlocked: true, highScore: 850, achievement: true },
            { id: 6, name: "한라산", unlocked: true, highScore: 830, achievement: true },
            { id: 7, name: "설악산", unlocked: true, highScore: 810, achievement: true },
            { id: 8, name: "광화문", unlocked: true, highScore: 890, achievement: true },
            { id: 9, name: "독도", unlocked: true, highScore: 940, achievement: true },
            { id: 10, name: "63빌딩", unlocked: true, highScore: 870, achievement: true }
          ],
          rewardIcon: "fas fa-medal",
          rewardName: "관광 달인 배지",
          rewardDescription: "모든 관광 명소를 완료하면 프로필에 특별한 관광 달인 배지가 추가됩니다."
        },
        {
          id: "city",
          name: "도시 풍경",
          icon: "fas fa-city",
          image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          description: "한국의 다양한 도시 풍경을 탐험하세요. 서울의 번화가부터 부산의 해안가까지, 다양한 도시 풍경을 경험하세요.",
          completedLocations: 2,
          totalLocations: 8,
          locations: [
            { id: 1, name: "강남역", unlocked: true, highScore: 900, achievement: true },
            { id: 2, name: "부산 서면", unlocked: true, highScore: 800, achievement: false },
            { id: 3, name: "대구 동성로", unlocked: false },
            { id: 4, name: "광주 충장로", unlocked: false },
            { id: 5, name: "대전 으능정이거리", unlocked: false },
            { id: 6, name: "인천 송도", unlocked: false },
            { id: 7, name: "울산 삼산동", unlocked: false },
            { id: 8, name: "제주 신제주", unlocked: false }
          ],
          rewardIcon: "fas fa-building",
          rewardName: "도시 탐험가 칭호",
          rewardDescription: "모든 도시 지역을 완료하면 '도시 탐험가' 칭호를 획득할 수 있습니다."
        },
        {
          id: "nature",
          name: "자연 경관",
          icon: "fas fa-mountain",
          image: "https://images.unsplash.com/photo-1545193544-312983719627?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          description: "한국의 아름다운 자연 경관을 탐험하세요. 산, 강, 바다 등 다양한 자연 환경에서 게임을 즐기세요.",
          completedLocations: 0,
          totalLocations: 8,
          locations: [
            { id: 1, name: "지리산", unlocked: false },
            { id: 2, name: "설악산", unlocked: false },
            { id: 3, name: "한라산", unlocked: false },
            { id: 4, name: "태안해안", unlocked: false },
            { id: 5, name: "속초 해변", unlocked: false },
            { id: 6, name: "남한강", unlocked: false },
            { id: 7, name: "우포늪", unlocked: false },
            { id: 8, name: "순천만", unlocked: false }
          ],
          rewardIcon: "fas fa-leaf",
          rewardName: "자연 친화 마커",
          rewardDescription: "모든 자연 경관을 완료하면 특별한 자연 친화적 마커를 획득할 수 있습니다."
        },
        {
          id: "food",
          name: "음식 문화",
          icon: "fas fa-utensils",
          image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          description: "한국의 다양한 음식 문화를 탐험하세요. 전통 시장부터 현대적인 레스토랑까지, 맛있는 음식들이 있는 장소를 찾아보세요.",
          completedLocations: 0,
          totalLocations: 7,
          locations: [
            { id: 1, name: "광장시장", unlocked: false },
            { id: 2, name: "전주 한옥마을", unlocked: false },
            { id: 3, name: "안동 구시장", unlocked: false },
            { id: 4, name: "부산 자갈치시장", unlocked: false },
            { id: 5, name: "제주 동문시장", unlocked: false },
            { id: 6, name: "대구 서문시장", unlocked: false },
            { id: 7, name: "포항 죽도시장", unlocked: false }
          ],
          rewardIcon: "fas fa-hamburger",
          rewardName: "미식가 칭호",
          rewardDescription: "모든 음식 명소를 완료하면 '미식가' 칭호를 획득할 수 있습니다."
        },
        {
          id: "history",
          name: "역사 유적",
          icon: "fas fa-monument",
          image: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          description: "한국의 역사적 장소들을 탐험하세요. 고궁, 사찰, 성곽 등 역사적 의미가 있는 장소들을 방문하고 점수를 획득하세요.",
          completedLocations: 1,
          totalLocations: 9,
          locations: [
            { id: 1, name: "창덕궁", unlocked: true, highScore: 900, achievement: true },
            { id: 2, name: "불국사", unlocked: false },
            { id: 3, name: "수원화성", unlocked: false },
            { id: 4, name: "강화도 고인돌", unlocked: false },
            { id: 5, name: "경주 불국사", unlocked: false },
            { id: 6, name: "공주 무령왕릉", unlocked: false },
            { id: 7, name: "하회마을", unlocked: false },
            { id: 8, name: "안동 도산서원", unlocked: false },
            { id: 9, name: "고창 고인돌", unlocked: false }
          ],
          rewardIcon: "fas fa-scroll",
          rewardName: "역사학자 배지",
          rewardDescription: "모든 역사 유적을 완료하면 역사학자 배지를 획득할 수 있습니다."
        }
      ]
    };
  },
  computed: {
    selectedThemeData() {
      if (!this.selectedTheme) return null;
      return this.themes.find(theme => theme.id === this.selectedTheme);
    },
    isGameStartReady() {
      return this.selectedTheme !== null;
    },
    isAllLocationsCompleted() {
      return this.selectedThemeData.completedLocations === this.selectedThemeData.totalLocations;
    },
    hasHighScoreAchievement() {
      return this.selectedThemeData.locations.every(location => location.highScore >= 800);
    }
  },
  
  methods: {
    selectTheme(themeId) {
      this.selectedTheme = themeId;
    },
    closePopup() {
      this.$emit('close');
      this.selectedTheme = null;
    },
    startGame() {
      if (!this.isGameStartReady) return;
      
      this.$emit('start-game', {
        mode: 'theme',
        theme: this.selectedTheme
      });
    }
  },
  watch: {
    show(newVal) {
      if (!newVal) {
        this.selectedTheme = null;
      }
    }
  }
};
</script>

<style scoped>
.theme-mode-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.popup-content {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 1000px;
  height: 80vh;
  max-height: 700px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.popup-header h2 {
  margin: 0;
  font-size: 1.6rem;
  color: #334155;
  font-weight: 700;
}

.close-button {
  background: #f1f5f9;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #e2e8f0;
  color: #334155;
}

.popup-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 왼쪽: 테마 리스트 */
.theme-list-container {
  width: 40%;
  border-right: 2px solid #e2e8f0;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1.2rem;
  color: #334155;
  margin-bottom: 1.2rem;
  font-weight: 600;
}

.theme-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
  padding-right: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.theme-list::-webkit-scrollbar {
  width: 8px;
  display: block;
}

.theme-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.theme-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.theme-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.theme-item {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  position: relative;
  min-height: 180px;
}

.theme-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.theme-item.selected {
  box-shadow: 0 0 0 3px #f59e0b, 0 8px 16px rgba(0, 0, 0, 0.06);
}

.theme-image-container {
  position: relative;
  height: 180px;
  overflow: hidden;
  width: 100%;
  border-radius: 12px;
}

.theme-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  display: block;
}

.theme-item:hover .theme-image {
  transform: scale(1.05);
}

.theme-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 100%);
  color: white;
  text-align: center;
}

.theme-overlay h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.theme-completion-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.2rem;
  color: #22c55e;
}

/* 오른쪽: 테마 상세 정보 */
.theme-detail-container {
  width: 60%;
  padding: 1rem 2rem;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #ffffff;
}

.theme-detail-header {
  background-size: cover;
  background-position: center;
  padding: 2rem;
  border-radius: 12px;
  position: relative;
}

.theme-detail-header-overlay {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0) 100%);
  padding: 1rem;
  border-radius: 12px;
}

.theme-detail-header h3 {
  font-size: 1.5rem;
  color: white;
  margin: 0 0 1rem 0;
  font-weight: 700;
}

.theme-progress {
  margin-top: 1rem;
}

.progress-text {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.progress-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f59e0b;
}

.progress-separator {
  color: #64748b;
}

.progress-total {
  font-size: 1.2rem;
  font-weight: 600;
  color: #334155;
}

.progress-label {
  margin-left: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.progress-bar {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.theme-description {
  color: #64748b;
  line-height: 1.6;
  font-size: 1rem;
}

.theme-locations {
  margin-top: 0.5rem;
}

.locations-title {
  font-size: 1.1rem;
  color: #334155;
  margin-bottom: 1rem;
  font-weight: 600;
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
}

.locations-grid::-webkit-scrollbar {
  width: 6px;
}

.locations-grid::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.locations-grid::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.locations-grid::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.location-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  border-radius: 8px;
  background: #f8fafc;
  transition: all 0.2s ease;
  width: 100%;
  min-width: 0;
}

.location-item.unlocked {
  background: #f0fdf4;
}

.location-icon {
  color: #94a3b8;
  font-size: 0.9rem;
  width: 20px;
  display: flex;
  justify-content: center;
}

.location-item.unlocked .location-icon {
  color: #22c55e;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.location-name {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.location-item.unlocked .location-name {
  color: #334155;
  font-weight: 600;
}

.location-score {
  font-size: 0.8rem;
  color: #64748b;
}

.location-achievement {
  font-size: 0.8rem;
  color: #22c55e;
}

.achievement-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: #22c55e;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
}

.theme-achievements {
  margin-top: 0.5rem;
}

.achievements-title {
  font-size: 1.1rem;
  color: #334155;
  margin-bottom: 1rem;
  font-weight: 600;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.achievement-item.achieved {
  background: #f0fdf4;
}

.achievement-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.achievement-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.achievement-info h5 {
  margin: 0;
  font-size: 1rem;
  color: #334155;
  font-weight: 600;
}

.achievement-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.4;
}

.achievement-status {
  margin-left: auto;
  font-size: 1.2rem;
  color: #94a3b8;
}

.achievement-status i {
  font-size: 1.2rem;
  color: #22c55e;
}

.start-game-button {
  width: 100%;
  height: 60px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.start-game-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.start-game-button:hover:not(:disabled)::after {
  opacity: 1;
}

.start-game-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
}

.start-game-button:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.theme-detail-placeholder {
  width: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.placeholder-content {
  text-align: center;
  color: #94a3b8;
}

.placeholder-content i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.placeholder-content p {
  font-size: 1.1rem;
}

@media (max-width: 1200px) {
  .locations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .locations-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .popup-body {
    flex-direction: column;
  }
  
  .theme-list-container {
    width: 100%;
    border-right: none;
    border-bottom: 2px solid #e2e8f0;
    padding: 1rem;
    max-height: 300px;
  }
  
  .theme-detail-container, .theme-detail-placeholder {
    width: 100%;
    padding: 1rem;
  }
}

@media (max-width: 640px) {
  .popup-header {
    padding: 1rem;
  }
  
  .popup-header h2 {
    font-size: 1.4rem;
  }
  
  .theme-image-container {
    height: 120px;
  }
  
  .theme-overlay h4 {
    font-size: 1rem;
  }
  
  .theme-detail-header h3 {
    font-size: 1.3rem;
  }
}
</style>
