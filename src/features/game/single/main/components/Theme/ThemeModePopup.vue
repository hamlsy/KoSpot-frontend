<template>
  <div class="theme-mode-popup" v-if="show" @click.self="closePopup">
    <div class="popup-content">
      <div class="popup-header">
        <h2>테마 게임</h2>
        <button @click="closePopup" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="popup-body">
        <!-- 왼쪽: 테마 리스트 -->
        <div class="theme-list-container" style="background-color: #f8fafc">
          <h3 class="section-title">테마 선택</h3>
          <div class="theme-list">
            <div
              v-for="theme in themes"
              :key="theme.id"
              class="theme-item"
              :class="{ selected: selectedTheme === theme.id }"
              @click="selectTheme(theme.id)"
            >
              <div class="theme-image-container" style="border-radius: 12px">
                <img
                  :src="theme.image"
                  :alt="theme.name"
                  class="theme-image"
                  style="display: block"
                />
                <div class="theme-overlay">
                  <h4>{{ theme.name }}</h4>
                </div>
                <div
                  class="theme-completion-indicator"
                  v-if="theme.completedLocations === theme.totalLocations"
                >
                  <i class="fas fa-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 테마 상세 정보 -->
        <div
          class="theme-detail-container"
          v-if="selectedThemeData"
          style="background-color: #ffffff"
        >
          <div class="theme-detail-header">
            <div
              class="theme-detail-header-bg"
              :style="{ backgroundImage: `url(${selectedThemeData.image})` }"
            ></div>
            <div class="theme-detail-header-overlay">
              <h3>{{ selectedThemeData.name }}</h3>
              <div class="theme-progress">
                <div class="progress-text">
                  <span class="progress-value">{{
                    selectedThemeData.completedLocations
                  }}</span>
                  <span class="progress-separator">/</span>
                  <span class="progress-total">{{
                    selectedThemeData.totalLocations
                  }}</span>
                  <span class="progress-label">지역 완료</span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{
                      width: `${
                        (selectedThemeData.completedLocations /
                          selectedThemeData.totalLocations) *
                        100
                      }%`,
                    }"
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
                :class="{ unlocked: location.unlocked }"
              >
                <div class="location-icon">
                  <i
                    class="fas fa-check-circle"
                    v-if="location.unlocked && location.achievement"
                  ></i>
                  <i
                    class="fas fa-map-marker-alt"
                    v-else-if="location.unlocked"
                  ></i>
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
                  <div
                    class="location-achievement"
                    v-if="location.unlocked && location.achievement"
                  >
                    <span class="achievement-badge">업적 달성</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="theme-achievements">
            <h4 class="achievements-title">테마 업적</h4>
            <div class="achievements-list">
              <div
                class="achievement-item"
                :class="{ achieved: isAllLocationsCompleted }"
              >
                <div class="achievement-icon">
                  <i class="fas fa-trophy"></i>
                </div>
                <div class="achievement-info">
                  <h5>전체 지역 완료</h5>
                  <p>
                    모든 지역을 플레이하고
                    {{ selectedThemeData.completedLocations }}/{{
                      selectedThemeData.totalLocations
                    }}
                    지역 해금
                  </p>
                </div>
                <div class="achievement-status">
                  <i
                    class="fas fa-check-circle"
                    v-if="isAllLocationsCompleted"
                  ></i>
                  <i class="fas fa-times-circle" v-else></i>
                </div>
              </div>
              <div
                class="achievement-item"
                :class="{ achieved: hasHighScoreAchievement }"
              >
                <div class="achievement-icon">
                  <i class="fas fa-star"></i>
                </div>
                <div class="achievement-info">
                  <h5>고득점 달성</h5>
                  <p>모든 지역에서 일정 점수(800점) 이상 획득</p>
                </div>
                <div class="achievement-status">
                  <i
                    class="fas fa-check-circle"
                    v-if="hasHighScoreAchievement"
                  ></i>
                  <i class="fas fa-times-circle" v-else></i>
                </div>
              </div>
            </div>
          </div>

          <button
            class="start-game-button theme-color"
            @click="startGame"
            :disabled="!isGameStartReady"
            style="
              height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
            "
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
import InstagramHotPlace from "@/shared/assets/images/theme/instgram-hot-place-theme.png";
import KMovie from "@/shared/assets/images/theme/k-movie-theme.png";
import NightMarket from "@/shared/assets/images/theme/night-market-theme.webp";
import KPopMusicVideo from "@/shared/assets/images/theme/k-pop-music-video-theme.jpg";

export default {
  name: "ThemeModePopup",
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedTheme: null,
      themes: [
        // K-드라마 촬영지 테마
        {
          id: "kdrama",
          name: "인기 K-영화 촬영지",
          icon: "fas fa-video",
          image:
            KMovie,
          description:
            "전국 각지에 있는 인기 영화 촬영지를 탐험하세요. 서울부터 제주까지, 감동적인 장면이 촬영된 실제 장소들을 방문하고 점수를 획득하세요.",
          completedLocations: 1,
          totalLocations: 7,
          locations: [
            {
              id: 1,
              name: "서울 보신각",
              unlocked: true,
              highScore: 920,
              achievement: true,
            },
            { id: 2, name: "양양 갯마을", unlocked: false },
            { id: 3, name: "포항 구룡포", unlocked: false },
            { id: 4, name: "군산 경암동", unlocked: false },
            { id: 5, name: "전주 한옥마을", unlocked: false },
            { id: 6, name: "제주 월정리", unlocked: false },
            { id: 7, name: "춘천 남이섬", unlocked: false },
          ],
          rewardIcon: "fas fa-star",
          rewardName: "K-영화 팬 배지",
          rewardDescription:
            "모든 영화 촬영지를 완료하면 특별한 K-영화화 팬 배지가 추가됩니다.",
        },

        // 인스타그램 핫플레이스 테마
        {
          id: "insta",
          name: "인스타그램 핫플레이스",
          icon: "fas fa-camera",
          image:
            InstagramHotPlace,
          description:
            "전국의 SNS에서 인기 있는 장소들을 탐험하세요. 인스타그램에서 핫한 장소들을 방문하고 점수를 획득하세요.",
          completedLocations: 0,
          totalLocations: 7,
          locations: [
            { id: 1, name: "서울 성수동", unlocked: false },
            { id: 2, name: "부산 감천문화마을", unlocked: false },
            { id: 3, name: "전주 경기전", unlocked: false },
            { id: 4, name: "강릉 안목해변", unlocked: false },
            { id: 5, name: "제주 애월해안도로", unlocked: false },
            { id: 6, name: "통영 동피랑", unlocked: false },
            { id: 7, name: "여수 밤바다", unlocked: false },
          ],
          rewardIcon: "fas fa-heart",
          rewardName: "인플루언서 칭호",
          rewardDescription:
            "모든 인스타 핫플레이스를 완료하면 '인플루언서' 칭호를 획득할 수 있습니다.",
        },

        // K-POP 뮤직비디오 촬영지 테마
        {
          id: "kpop",
          name: "K-POP 뮤직비디오 촬영지",
          icon: "fas fa-music",
          image:
          KPopMusicVideo,
          description:
            "K-POP 뮤직비디오 촬영지와 음악 관련 명소들을 탐험하세요. 아이돌 그룹의 뮤직비디오가 촬영된 장소들을 방문하고 점수를 획득하세요.",
          completedLocations: 0,
          totalLocations: 7,
          locations: [
            { id: 1, name: "서울 홍대", unlocked: false },
            { id: 2, name: "부산 해운대", unlocked: false },
            { id: 3, name: "인천 송도", unlocked: false },
            { id: 4, name: "대전 유성구", unlocked: false },
            { id: 5, name: "광주 음악거리", unlocked: false },
            { id: 6, name: "제주 성산일출봉", unlocked: false },
            { id: 7, name: "경주 동궁과 월지", unlocked: false },
          ],
          rewardIcon: "fas fa-headphones",
          rewardName: "K-POP 팬 마커",
          rewardDescription:
            "모든 음악 관련 장소를 완료하면 특별한 K-POP 팬 마커를 획득할 수 있습니다.",
        },

        // 전국 야시장 투어 테마
        {
          id: "nightmarket",
          name: "전국 야시장 투어",
          icon: "fas fa-store",
          image:
          NightMarket,
          description:
            "전국의 유명 야시장과 먹거리 골목을 탐험하세요. 다양한 지역의 특색 있는 시장과 맛집을 방문하고 점수를 획득하세요.",
          completedLocations: 0,
          totalLocations: 7,
          locations: [
            { id: 1, name: "서울 광장시장", unlocked: false },
            { id: 2, name: "부산 부평깡통시장", unlocked: false },
            { id: 3, name: "대구 서문시장", unlocked: false },
            { id: 4, name: "전주 남부시장", unlocked: false },
            { id: 5, name: "포항 죽도시장", unlocked: false },
            { id: 6, name: "제주 동문시장", unlocked: false },
            { id: 7, name: "수원 지동시장", unlocked: false },
          ],
          rewardIcon: "fas fa-utensils",
          rewardName: "야식 마니아 배지",
          rewardDescription:
            "모든 야시장을 완료하면 특별한 야식 마니아 배지가 추가됩니다.",
        },

        // 한국 게임 속 실제 배경 테마
        // {
        //   id: "gamescene",
        //   name: "한국 게임 속 실제 배경",
        //   icon: "fas fa-gamepad",
        //   image:
        //     "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        //   description:
        //     "인기 한국 게임의 실제 모델이 된 장소들을 탐험하세요. 유명 게임의 배경이 된 실제 장소들을 방문하고 점수를 획득하세요.",
        //   completedLocations: 7,
        //   totalLocations: 7,
        //   locations: [
        //     { id: 1, name: "서울 강남역", unlocked: false },
        //     { id: 2, name: "부산 해운대", unlocked: false },
        //     { id: 3, name: "인천 송도", unlocked: false },
        //     { id: 4, name: "대전 유성구", unlocked: false },
        //     { id: 5, name: "대구 동성로", unlocked: false },
        //     { id: 6, name: "광주 충장로", unlocked: false },
        //     { id: 7, name: "울산 태화강", unlocked: false },
        //   ],
        //   rewardIcon: "fas fa-trophy",
        //   rewardName: "게이머 칭호",
        //   rewardDescription:
        //     "모든 게임 배경 장소를 완료하면 '프로 게이머' 칭호를 획득할 수 있습니다.",
        // },
      ],
    };
  },
  computed: {
    selectedThemeData() {
      if (!this.selectedTheme) return null;
      return this.themes.find((theme) => theme.id === this.selectedTheme);
    },
    isGameStartReady() {
      return this.selectedTheme !== null;
    },
    isAllLocationsCompleted() {
      return (
        this.selectedThemeData.completedLocations ===
        this.selectedThemeData.totalLocations
      );
    },
    hasHighScoreAchievement() {
      return this.selectedThemeData.locations.every(
        (location) => location.highScore >= 800
      );
    },
  },

  methods: {
    selectTheme(themeId) {
      // 현재 선택된 테마와 동일한 테마를 선택하면 무시
      if (this.selectedTheme === themeId) return;
      
      // 선택된 테마를 먼저 null로 설정하여 DOM 업데이트 사이클을 분리
      this.selectedTheme = null;
      
      // nextTick을 사용하여 DOM 업데이트 후 새 테마 설정
      this.$nextTick(() => {
        this.selectedTheme = themeId;
      });
    },
    closePopup() {
      this.$emit("close");
      this.selectedTheme = null;
    },
    startGame() {
      if (!this.isGameStartReady) return;

      this.$emit("start-game", {
        mode: "theme",
        theme: this.selectedTheme,
      });
    },
  },
  watch: {
    show(newVal) {
      if (!newVal) {
        this.selectedTheme = null;
      }
    },
  },
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
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0) 100%
  );
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

.theme-detail-header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(0.8px);
  opacity: 0.8;
  z-index: 0;
}


.theme-detail-header-overlay {
  position: relative;
  z-index: 1;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0) 100%
  );
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
  color: white;
}

.progress-label {
  margin-left: 0.5rem;
  color: white;
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
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 100%
  );
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

  .theme-detail-container,
  .theme-detail-placeholder {
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
