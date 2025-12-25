<template>
  <div class="hud-test-page">
    <!-- 배경 효과 -->
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>
    
    <!-- 헤더 -->
    <header class="test-header">
      <div class="header-border">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
      </div>
      
      <div class="header-content">
        <button class="back-btn" @click="$router.push('/main')">
          <i class="fas fa-arrow-left"></i>
          <span>BACK</span>
        </button>
        
        <h1 class="page-title">
          <i class="fas fa-palette"></i>
          HUD DESIGN TEST
        </h1>
        
        <div class="tab-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </header>
    
    <!-- 콘텐츠 -->
    <main class="test-content">
      <!-- 로비 테스트 -->
      <div v-if="activeTab === 'lobby'" class="test-panel">
        <div class="panel-info">
          <h2>LOBBY VIEW HUD</h2>
          <p>멀티플레이어 로비 화면의 HUD 스타일 버전입니다.</p>
          <button class="launch-btn" @click="launchLobby">
            <i class="fas fa-rocket"></i>
            <span>LAUNCH FULL VIEW</span>
          </button>
        </div>
        
        <div class="preview-frame">
          <LobbyViewHUD />
        </div>
      </div>
      
      <!-- 방 대기실 테스트 -->
      <div v-if="activeTab === 'room'" class="test-panel">
        <div class="panel-info">
          <h2>ROOM VIEW HUD</h2>
          <p>게임 방 대기실의 HUD 스타일 버전입니다.</p>
          <button class="launch-btn" @click="launchRoom">
            <i class="fas fa-rocket"></i>
            <span>LAUNCH FULL VIEW</span>
          </button>
        </div>
        
        <div class="preview-frame">
          <RoomViewHUD />
        </div>
      </div>
      
      <!-- 컴포넌트 갤러리 -->
      <div v-if="activeTab === 'components'" class="test-panel components-gallery">
        <div class="panel-info">
          <h2>HUD COMPONENTS</h2>
          <p>개별 HUD 컴포넌트들을 확인합니다.</p>
        </div>
        
        <div class="components-grid">
          <!-- RoomListHUD 미리보기 -->
          <div class="component-card">
            <div class="card-header">
              <span class="card-title">RoomListHUD</span>
            </div>
            <div class="card-preview" style="height: 400px;">
              <RoomListHUD
                :rooms="dummyRooms"
                :loading="false"
                @refresh-rooms="() => {}"
                @join-room="() => {}"
              />
            </div>
          </div>
          
          <!-- CreateRoomModalHUD 미리보기 -->
          <div class="component-card">
            <div class="card-header">
              <span class="card-title">CreateRoomModalHUD</span>
              <button class="show-modal-btn" @click="showCreateModal = true">
                <i class="fas fa-eye"></i>
                SHOW
              </button>
            </div>
            <div class="card-preview modal-preview">
              <p>Click "SHOW" to open the modal</p>
            </div>
          </div>
        </div>
        
        <!-- 방 생성 모달 -->
        <CreateRoomModalHUD
          v-if="showCreateModal"
          @close="showCreateModal = false"
          @create-room="handleCreateRoom"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import LobbyViewHUD from '../lobby/views/LobbyViewHUD.vue';
import RoomViewHUD from '../room/views/RoomViewHUD.vue';
import RoomListHUD from '../lobby/components/hud/RoomListHUD.vue';
import CreateRoomModalHUD from '../lobby/components/hud/CreateRoomModalHUD.vue';

const router = useRouter();

const tabs = [
  { id: 'lobby', label: 'LOBBY', icon: 'fas fa-door-open' },
  { id: 'room', label: 'ROOM', icon: 'fas fa-users' },
  { id: 'components', label: 'COMPONENTS', icon: 'fas fa-cubes' }
];

const activeTab = ref('lobby');
const showCreateModal = ref(false);

const dummyRooms = [
  {
    gameRoomId: 1,
    title: '초보자 환영!',
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
    title: '고수만',
    hostNickname: 'ProGamer',
    gameMode: '로드뷰',
    gameType: '개인전',
    currentPlayerCount: 6,
    maxPlayers: 6,
    privateRoom: true,
    gameRoomStatus: 'WAITING'
  },
  {
    gameRoomId: 3,
    title: '게임중',
    hostNickname: 'GeoKing',
    gameMode: '로드뷰',
    gameType: '개인전',
    currentPlayerCount: 5,
    maxPlayers: 8,
    privateRoom: false,
    gameRoomStatus: 'PLAYING'
  }
];

const launchLobby = () => {
  router.push('/hud-lobby');
};

const launchRoom = () => {
  router.push('/hud-room');
};

const handleCreateRoom = (data) => {
  console.log('Room created:', data);
  showCreateModal.value = false;
  alert(`Room "${data.title}" created! (Demo)`);
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

.hud-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  font-family: 'Orbitron', monospace;
  position: relative;
}

.bg-grid {
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.bg-scanline {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(34, 211, 238, 0.01) 2px,
    rgba(34, 211, 238, 0.01) 4px
  );
  pointer-events: none;
}

/* 헤더 */
.test-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(180deg, rgba(12, 18, 34, 0.98) 0%, rgba(12, 18, 34, 0.9) 100%);
  backdrop-filter: blur(10px);
  z-index: 100;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
}

.header-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #22d3ee;
}

.corner-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.corner-tr { top: 0; right: 0; border-left: none; border-bottom: none; }

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  height: 100%;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  color: #22d3ee;
  padding: 0.5rem 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  letter-spacing: 0.1em;
}

.back-btn:hover {
  background: rgba(34, 211, 238, 0.2);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #22d3ee;
  letter-spacing: 0.15em;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
}

.tab-nav {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid rgba(100, 116, 139, 0.2);
  color: #64748b;
  padding: 0.5rem 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  letter-spacing: 0.08em;
}

.tab-btn:hover {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

.tab-btn.active {
  background: rgba(34, 211, 238, 0.15);
  border-color: rgba(34, 211, 238, 0.4);
  color: #22d3ee;
}

/* 콘텐츠 */
.test-content {
  padding: 100px 1.5rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.test-panel {
  min-height: calc(100vh - 120px);
}

.panel-info {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.2);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.panel-info h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #22d3ee;
  letter-spacing: 0.1em;
}

.panel-info p {
  margin: 0 0 1rem 0;
  font-size: 0.75rem;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.launch-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%);
  border: 1px solid rgba(34, 211, 238, 0.5);
  color: #22d3ee;
  padding: 0.6rem 1.25rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  letter-spacing: 0.1em;
}

.launch-btn:hover {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(34, 211, 238, 0.15) 100%);
  box-shadow: 0 0 25px rgba(34, 211, 238, 0.3);
}

.preview-frame {
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 4px;
  overflow: hidden;
  height: calc(100vh - 250px);
  min-height: 500px;
}

/* 컴포넌트 갤러리 */
.components-gallery {
  min-height: auto;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.component-card {
  background: rgba(12, 18, 34, 0.8);
  border: 1px solid rgba(34, 211, 238, 0.2);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(34, 211, 238, 0.05);
  border-bottom: 1px solid rgba(34, 211, 238, 0.15);
}

.card-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #22d3ee;
  letter-spacing: 0.1em;
}

.show-modal-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(167, 139, 250, 0.15);
  border: 1px solid rgba(167, 139, 250, 0.4);
  color: #a78bfa;
  padding: 0.35rem 0.75rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.show-modal-btn:hover {
  background: rgba(167, 139, 250, 0.25);
  box-shadow: 0 0 15px rgba(167, 139, 250, 0.3);
}

.card-preview {
  padding: 1rem;
  overflow: auto;
}

.modal-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #64748b;
  font-size: 0.75rem;
}

/* 반응형 */
@media (max-width: 1024px) {
  .tab-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
    padding: 0;
    background: rgba(12, 18, 34, 0.98);
    border-top: 1px solid rgba(34, 211, 238, 0.2);
    display: flex;
    z-index: 100;
  }
  
  .tab-btn {
    flex: 1;
    flex-direction: column;
    padding: 0.75rem 0.5rem;
    clip-path: none;
    border: none;
    border-radius: 0;
    gap: 0.25rem;
  }
  
  .tab-btn span {
    font-size: 0.55rem;
  }
  
  .test-content {
    padding-bottom: 80px;
  }
  
  .components-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
    gap: 1rem;
  }
  
  .back-btn span {
    display: none;
  }
  
  .page-title {
    font-size: 0.9rem;
  }
  
  .test-content {
    padding: 90px 1rem 80px;
  }
  
  .preview-frame {
    height: calc(100vh - 280px);
    min-height: 400px;
  }
}
</style>

