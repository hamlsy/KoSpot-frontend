<template>
  <div class="design-test-page">
    <!-- 헤더 -->
    <header class="test-header">
      <button class="back-btn" @click="$router.push('/main')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h1>RoundResults 디자인 테스트</h1>
      <div class="header-actions">
        <button class="reset-btn" @click="resetData">
          <i class="fas fa-sync-alt"></i>
          초기화
        </button>
      </div>
    </header>

    <!-- 탭 네비게이션 -->
    <nav class="design-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ 'active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-name">{{ tab.name }}</span>
        <span class="tab-desc">{{ tab.description }}</span>
      </button>
    </nav>

    <!-- 컨트롤 패널 -->
    <div class="control-panel">
      <div class="control-group">
        <label>라운드</label>
        <div class="control-input">
          <button @click="demoData.round = Math.max(1, demoData.round - 1)">-</button>
          <span>{{ demoData.round }} / {{ demoData.totalRounds }}</span>
          <button @click="demoData.round = Math.min(demoData.totalRounds, demoData.round + 1)">+</button>
        </div>
      </div>
      <div class="control-group">
        <label>플레이어 수</label>
        <div class="control-input">
          <button @click="removePlayer">-</button>
          <span>{{ demoData.players.length }}명</span>
          <button @click="addPlayer">+</button>
        </div>
      </div>
      <div class="control-group">
        <label>서버 모드</label>
        <button 
          class="toggle-btn" 
          :class="{ 'active': demoData.isServerMode }"
          @click="demoData.isServerMode = !demoData.isServerMode"
        >
          {{ demoData.isServerMode ? 'ON' : 'OFF' }}
        </button>
      </div>
    </div>

    <!-- 디자인 프리뷰 영역 -->
    <div class="preview-container">
      <component 
        :is="currentComponent"
        :players="demoData.players"
        :teams="demoData.teams"
        :is-team-mode="demoData.isTeamMode"
        :actual-location="demoData.actualLocation"
        :round="demoData.round"
        :total-rounds="demoData.totalRounds"
        :current-user-id="demoData.currentUserId"
        :location-name="demoData.locationName"
        :poi-name="demoData.poiName"
        :full-address="demoData.fullAddress"
        :player-guesses="demoData.playerGuesses"
        :top-player="demoData.topPlayer"
        :players-ready-details="demoData.playersReadyDetails"
        :server-countdown-seconds="demoData.isServerMode ? demoData.serverCountdownSeconds : null"
        :is-server-mode="demoData.isServerMode"
        @finish-game="handleFinishGame"
        @request-next-round="handleNextRound"
      />
    </div>
  </div>
</template>

<script>
import RoundResults from '../components/results/RoundResults.vue';
import RoundResultsDesignA from '../components/results/RoundResultsDesignA.vue';
import RoundResultsDesignB from '../components/results/RoundResultsDesignB.vue';
import RoundResultsDesignC from '../components/results/RoundResultsDesignC.vue';
import RoundResultsDesignD from '../components/results/RoundResultsDesignD.vue';
import RoundResultsDesignB2 from '../components/results/RoundResultsDesignB2.vue';

export default {
  name: 'DesignTestView',
  
  components: {
    RoundResults,
    RoundResultsDesignA,
    RoundResultsDesignB,
    RoundResultsDesignC,
    RoundResultsDesignD,
    RoundResultsDesignB2,
  },

  data() {
    return {
      activeTab: 'original',
      tabs: [
        { id: 'original', name: '원본', description: '기존 디자인' },
        { id: 'designA', name: '디자인 A', description: '미니멀 카드' },
        { id: 'designB', name: '디자인 B', description: '게이미피케이션' },
        { id: 'designC', name: '디자인 C', description: '대시보드' },
        { id: 'designD', name: '디자인 D', description: '풀스크린 맵' },
        { id: 'designB2', name: '디자인 B\'', description: 'B 라이트 개선' },
      ],
      demoData: this.getInitialDemoData(),
    };
  },

  computed: {
    currentComponent() {
      const components = {
        original: 'RoundResults',
        designA: 'RoundResultsDesignA',
        designB: 'RoundResultsDesignB',
        designC: 'RoundResultsDesignC',
        designD: 'RoundResultsDesignD',
        designB2: 'RoundResultsDesignB2',
      };
      return components[this.activeTab];
    },
  },

  methods: {
    getInitialDemoData() {
      const players = [
        { id: 'player1', nickname: '김코스팟', score: 4500, lastRoundScore: 950, equippedMarker: null },
        { id: 'player2', nickname: '박지도', score: 4200, lastRoundScore: 880, equippedMarker: null },
        { id: 'player3', nickname: '이위치', score: 3800, lastRoundScore: 750, equippedMarker: null },
        { id: 'player4', nickname: '최탐험', score: 3500, lastRoundScore: 620, equippedMarker: null },
      ];

      return {
        players,
        teams: [],
        isTeamMode: false,
        actualLocation: { lat: 37.5665, lng: 126.978 },
        round: 3,
        totalRounds: 5,
        currentUserId: 'player1',
        locationName: '경복궁',
        poiName: '경복궁 근정전',
        fullAddress: '서울특별시 종로구 사직로 161',
        playerGuesses: players.map((p, i) => ({
          playerId: p.id,
          playerName: p.nickname,
          position: { 
            lat: 37.5665 + (Math.random() - 0.5) * 0.1, 
            lng: 126.978 + (Math.random() - 0.5) * 0.1 
          },
          color: ['#FF5252', '#2196F3', '#4CAF50', '#FF9800'][i],
        })),
        topPlayer: {
          playerId: 'player1',
          playerName: '김코스팟',
          distance: 0.523,
        },
        playersReadyDetails: [
          { id: 'player1', nickname: '김코스팟', equippedMarker: null },
          { id: 'player2', nickname: '박지도', equippedMarker: null },
        ],
        isServerMode: false,
        serverCountdownSeconds: 8,
      };
    },

    resetData() {
      this.demoData = this.getInitialDemoData();
    },

    addPlayer() {
      const id = `player${this.demoData.players.length + 1}`;
      const names = ['홍길동', '강민수', '윤서연', '정하늘', '송별', '문하람'];
      const newPlayer = {
        id,
        nickname: names[this.demoData.players.length % names.length],
        score: Math.floor(Math.random() * 3000) + 1000,
        lastRoundScore: Math.floor(Math.random() * 800) + 200,
        equippedMarker: null,
      };
      this.demoData.players.push(newPlayer);
      this.demoData.playerGuesses.push({
        playerId: id,
        playerName: newPlayer.nickname,
        position: { 
          lat: 37.5665 + (Math.random() - 0.5) * 0.1, 
          lng: 126.978 + (Math.random() - 0.5) * 0.1 
        },
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      });
    },

    removePlayer() {
      if (this.demoData.players.length > 2) {
        this.demoData.players.pop();
        this.demoData.playerGuesses.pop();
      }
    },

    handleFinishGame() {
      alert('최종 결과 보기 클릭됨!');
    },

    handleNextRound() {
      if (this.demoData.round < this.demoData.totalRounds) {
        this.demoData.round++;
        alert(`라운드 ${this.demoData.round}로 진행!`);
      }
    },
  },
};
</script>

<style scoped>
.design-test-page {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
}

/* 헤더 */
.test-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f3f4f6;
}

.test-header h1 {
  flex: 1;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #f3f4f6;
}

/* 탭 네비게이션 */
.design-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  min-width: 140px;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.tab-btn:hover {
  border-color: #93c5fd;
  background: #f0f9ff;
}

.tab-btn.active {
  border-color: #2563eb;
  background: #dbeafe;
}

.tab-name {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.tab-desc {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
}

.tab-btn.active .tab-name {
  color: #2563eb;
}

/* 컨트롤 패널 */
.control-panel {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.control-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.25rem;
}

.control-input button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.control-input button:hover {
  background: #e5e7eb;
}

.control-input span {
  min-width: 60px;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

/* 프리뷰 컨테이너 */
.preview-container {
  flex: 1;
  min-height: 600px;
  margin: 1rem;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background: white;
}

/* 반응형 */
@media (max-width: 768px) {
  .test-header {
    padding: 0.75rem 1rem;
  }

  .test-header h1 {
    font-size: 1rem;
  }

  .design-tabs {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }

  .tab-btn {
    min-width: 100px;
    padding: 0.75rem;
  }

  .control-panel {
    padding: 0.75rem 1rem;
    gap: 1rem;
  }

  .preview-container {
    margin: 0.5rem;
    min-height: 500px;
  }
}
</style>

