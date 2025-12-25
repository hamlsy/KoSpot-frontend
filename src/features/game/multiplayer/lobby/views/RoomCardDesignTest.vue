<template>
  <div class="design-test-page">
    <header class="test-header">
      <h1>방 카드 디자인 테스트</h1>
      <p>9가지 디자인 후보를 비교하고 테스트합니다.</p>
    </header>
    
    <div class="design-controls">
      <div class="control-group">
        <label>배경 테마:</label>
        <select v-model="bgTheme">
          <option value="light">라이트</option>
          <option value="dark">다크</option>
          <option value="gradient">그라데이션</option>
        </select>
      </div>
      <div class="control-group">
        <label>카드 간격:</label>
        <select v-model="cardGap">
          <option value="tight">좁게</option>
          <option value="normal">보통</option>
          <option value="wide">넓게</option>
        </select>
      </div>
    </div>
    
    <div class="test-container" :class="[bgTheme, cardGap]">
      <!-- 디자인 A: 네온 글래스모피즘 -->
      <section class="design-section">
        <h2>디자인 A: 네온 글래스모피즘</h2>
        <p class="design-desc">반투명 배경 + 네온 테두리, 상태별 글로우</p>
        <div class="cards-grid">
          <RoomCardDesignA
            v-for="room in testRooms"
            :key="'a-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
      
      <!-- 디자인 B: 미니멀 플랫 -->
      <section class="design-section">
        <h2>디자인 B: 미니멀 플랫</h2>
        <p class="design-desc">깔끔한 플랫 디자인, 좌측 컬러 인디케이터</p>
        <div class="cards-grid">
          <RoomCardDesignB
            v-for="room in testRooms"
            :key="'b-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
      
      <!-- 디자인 C: 그라데이션 카드 -->
      <section class="design-section">
        <h2>디자인 C: 그라데이션 카드</h2>
        <p class="design-desc">상태별 그라데이션 배경, 라운드 코너 강조</p>
        <div class="cards-grid">
          <RoomCardDesignC
            v-for="room in testRooms"
            :key="'c-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
      
      <!-- 디자인 D: 게임 HUD 스타일 -->
      <section class="design-section">
        <h2>디자인 D: 게임 HUD 스타일</h2>
        <p class="design-desc">게임 UI 느낌의 각진 모서리, 스캔라인 효과</p>
        <div class="cards-grid">
          <RoomCardDesignD
            v-for="room in testRooms"
            :key="'d-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
      
      <!-- 디자인 E: 소프트 머티리얼 -->
      <section class="design-section">
        <h2>디자인 E: 소프트 머티리얼</h2>
        <p class="design-desc">부드러운 그림자, 파스텔 색상, 둥근 아이콘</p>
        <div class="cards-grid">
          <RoomCardDesignE
            v-for="room in testRooms"
            :key="'e-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
      
      <!-- 디자인 F: HUD 라이트 (신규) -->
      <section class="design-section highlight">
        <h2>🆕 디자인 F: HUD 라이트 (D+B 중간)</h2>
        <p class="design-desc">밝은 배경 + 게임 감성, 캐주얼하면서 모던한 느낌</p>
        <div class="cards-grid">
          <RoomCardDesignF
            v-for="room in testRooms"
            :key="'f-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
      
      <!-- 디자인 G: 지도 탐험가 (신규) -->
      <section class="design-section highlight">
        <h2>🆕 디자인 G: 지도 탐험가 스타일</h2>
        <p class="design-desc">게임 + 지리 탐험 느낌, 따뜻한 색감, 캐주얼한 분위기</p>
        <div class="cards-grid">
          <RoomCardDesignG
            v-for="room in testRooms"
            :key="'g-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
      
      <!-- 디자인 H: 보드게임 카드 (신규) -->
      <section class="design-section highlight">
        <h2>🆕 디자인 H: 보드게임 카드 스타일</h2>
        <p class="design-desc">물리적 카드 느낌, 클래식 게임 보드 감성</p>
        <div class="cards-grid">
          <RoomCardDesignH
            v-for="room in testRooms"
            :key="'h-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
      
      <!-- 디자인 I: 타일/블록 (신규) -->
      <section class="design-section highlight">
        <h2>🆕 디자인 I: 타일/블록 스타일</h2>
        <p class="design-desc">명확한 구조, 심플하고 직관적인 레이아웃</p>
        <div class="cards-grid">
          <RoomCardDesignI
            v-for="room in testRooms"
            :key="'i-' + room.gameRoomId"
            :room="room"
            @click="handleClick"
          />
        </div>
      </section>
    </div>
    
    <!-- 클릭된 방 정보 토스트 -->
    <transition name="toast">
      <div v-if="clickedRoom" class="click-toast">
        <i class="fas fa-mouse-pointer"></i>
        <span>{{ clickedRoom.title }} 클릭됨!</span>
      </div>
    </transition>
  </div>
</template>

<script>
import RoomCardDesignA from '../components/designs/RoomCardDesignA.vue';
import RoomCardDesignB from '../components/designs/RoomCardDesignB.vue';
import RoomCardDesignC from '../components/designs/RoomCardDesignC.vue';
import RoomCardDesignD from '../components/designs/RoomCardDesignD.vue';
import RoomCardDesignE from '../components/designs/RoomCardDesignE.vue';
import RoomCardDesignF from '../components/designs/RoomCardDesignF.vue';
import RoomCardDesignG from '../components/designs/RoomCardDesignG.vue';
import RoomCardDesignH from '../components/designs/RoomCardDesignH.vue';
import RoomCardDesignI from '../components/designs/RoomCardDesignI.vue';

export default {
  name: 'RoomCardDesignTest',
  components: {
    RoomCardDesignA,
    RoomCardDesignB,
    RoomCardDesignC,
    RoomCardDesignD,
    RoomCardDesignE,
    RoomCardDesignF,
    RoomCardDesignG,
    RoomCardDesignH,
    RoomCardDesignI
  },
  data() {
    return {
      bgTheme: 'light',
      cardGap: 'normal',
      clickedRoom: null,
      clickTimeout: null,
      testRooms: [
        {
          gameRoomId: 1,
          title: '초보자 환영! 같이 놀아요',
          hostNickname: 'MapMaster',
          gameMode: '로드뷰',
          gameType: '개인전',
          currentPlayerCount: 3,
          maxPlayers: 8,
          privateRoom: false,
          gameRoomStatus: 'WAITING'
        },
        {
          gameRoomId: 2,
          title: '고수만 입장 (비밀방)',
          hostNickname: 'ProGamer123',
          gameMode: '에어리어뷰',
          gameType: '팀전',
          currentPlayerCount: 6,
          maxPlayers: 6,
          privateRoom: true,
          gameRoomStatus: 'WAITING'
        },
        {
          gameRoomId: 3,
          title: '한국 지리왕 결정전',
          hostNickname: 'GeoKing',
          gameMode: '로드뷰',
          gameType: '개인전',
          currentPlayerCount: 5,
          maxPlayers: 8,
          privateRoom: false,
          gameRoomStatus: 'PLAYING'
        },
        {
          gameRoomId: 4,
          title: '친목방 (비번: 1234)',
          hostNickname: 'FriendlyHost',
          gameMode: '에어리어뷰',
          gameType: '개인전',
          currentPlayerCount: 2,
          maxPlayers: 4,
          privateRoom: true,
          gameRoomStatus: 'PLAYING'
        }
      ]
    };
  },
  methods: {
    handleClick(room) {
      this.clickedRoom = room;
      
      if (this.clickTimeout) {
        clearTimeout(this.clickTimeout);
      }
      
      this.clickTimeout = setTimeout(() => {
        this.clickedRoom = null;
      }, 2000);
    }
  },
  beforeUnmount() {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
  }
};
</script>

<style scoped>
.design-test-page {
  min-height: 100vh;
  padding: 2rem;
  background: #f8fafc;
}

.test-header {
  text-align: center;
  margin-bottom: 2rem;
}

.test-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
}

.test-header p {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
}

.design-controls {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.control-group select {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.control-group select:hover {
  border-color: #cbd5e1;
}

.control-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.test-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.test-container.light {
  background: #f8fafc;
}

.test-container.dark {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.test-container.gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.design-section {
  margin-bottom: 3rem;
}

.design-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.test-container.light .design-section h2,
.test-container.light .design-desc {
  color: #1e293b;
}

.test-container.dark .design-section h2,
.test-container.gradient .design-section h2 {
  color: #f1f5f9;
}

.design-desc {
  font-size: 0.9rem;
  margin: 0 0 1.25rem 0;
}

/* 신규 디자인 하이라이트 */
.design-section.highlight {
  padding: 1.5rem;
  border-radius: 16px;
  position: relative;
}

.design-section.highlight::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  padding: 2px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.test-container.light .design-section.highlight {
  background: rgba(59, 130, 246, 0.03);
}

.test-container.dark .design-section.highlight,
.test-container.gradient .design-section.highlight {
  background: rgba(255, 255, 255, 0.03);
}

.test-container.light .design-desc {
  color: #64748b;
}

.test-container.dark .design-desc,
.test-container.gradient .design-desc {
  color: #94a3b8;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  transition: gap 0.3s ease;
}

.test-container.tight .cards-grid {
  gap: 0.75rem;
}

.test-container.normal .cards-grid {
  gap: 1.25rem;
}

.test-container.wide .cards-grid {
  gap: 2rem;
}

.click-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #1e293b;
  color: white;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.click-toast i {
  color: #3b82f6;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* 반응형 */
@media (max-width: 768px) {
  .design-test-page {
    padding: 1rem;
  }
  
  .test-header h1 {
    font-size: 1.5rem;
  }
  
  .design-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .test-container {
    padding: 1rem;
  }
  
  .design-section h2 {
    font-size: 1.2rem;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>

