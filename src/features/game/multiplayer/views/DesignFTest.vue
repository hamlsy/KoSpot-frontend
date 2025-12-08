<template>
  <div class="design-f-test">
    <!-- 헤더 -->
    <header class="test-header">
      <div class="header-inner">
        <button class="back-btn" @click="$router.push('/main')">
          <i class="fas fa-arrow-left"></i>
        </button>
        
        <div class="header-title">
          <span class="badge">DESIGN F</span>
          <h1>HUD 라이트 스타일 테스트</h1>
        </div>
        
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
    <main class="test-main">
      <!-- 로비 테스트 -->
      <div v-if="activeTab === 'lobby'" class="test-section">
        <div class="section-info">
          <div class="info-card">
            <h2>
              <i class="fas fa-door-open"></i>
              로비 화면
            </h2>
            <p>HUD 라이트 스타일의 멀티플레이어 로비입니다. 밝고 캐주얼한 느낌으로 디자인되었습니다.</p>
            <div class="feature-list">
              <span class="feature"><i class="fas fa-check"></i> 깔끔한 방 목록</span>
              <span class="feature"><i class="fas fa-check"></i> 상태별 컬러 바</span>
              <span class="feature"><i class="fas fa-check"></i> 컴팩트 채팅</span>
              <span class="feature"><i class="fas fa-check"></i> 반응형 디자인</span>
            </div>
            <button class="launch-btn" @click="$router.push('/design-f-lobby')">
              <i class="fas fa-external-link-alt"></i>
              전체 화면으로 보기
            </button>
          </div>
        </div>
        
        <div class="preview-frame">
          <LobbyViewDesignF />
        </div>
      </div>
      
      <!-- 방 생성 모달 테스트 -->
      <div v-if="activeTab === 'modal'" class="test-section modal-test">
        <div class="section-info">
          <div class="info-card">
            <h2>
              <i class="fas fa-plus-circle"></i>
              방 생성 모달
            </h2>
            <p>깔끔하고 직관적인 방 생성 UI입니다. 모든 설정을 한 눈에 볼 수 있습니다.</p>
            <div class="feature-list">
              <span class="feature"><i class="fas fa-check"></i> 직관적인 옵션 선택</span>
              <span class="feature"><i class="fas fa-check"></i> 카운터 컨트롤</span>
              <span class="feature"><i class="fas fa-check"></i> 토글 스위치</span>
              <span class="feature"><i class="fas fa-check"></i> 비밀번호 설정</span>
            </div>
            <button class="launch-btn" @click="showModal = true">
              <i class="fas fa-eye"></i>
              모달 열기
            </button>
          </div>
        </div>
        
        <div class="modal-preview-area">
          <div class="modal-demo-bg">
            <CreateRoomModalDesignF
              v-if="showModalPreview"
              @close="() => {}"
              @create-room="handleCreateRoom"
            />
          </div>
        </div>
        
        <CreateRoomModalDesignF
          v-if="showModal"
          @close="showModal = false"
          @create-room="handleCreateRoom"
        />
      </div>
      
      <!-- 대기실 테스트 -->
      <div v-if="activeTab === 'room'" class="test-section">
        <div class="section-info">
          <div class="info-card">
            <h2>
              <i class="fas fa-users"></i>
              대기실 화면
            </h2>
            <p>게임 대기실입니다. 프로필, 전적, 플레이어 목록, 채팅이 포함됩니다.</p>
            <div class="feature-list">
              <span class="feature"><i class="fas fa-check"></i> 내 프로필 & 전적</span>
              <span class="feature"><i class="fas fa-check"></i> 플레이어 슬롯</span>
              <span class="feature"><i class="fas fa-check"></i> 컴팩트 채팅</span>
              <span class="feature"><i class="fas fa-check"></i> 게임 시작 카운트다운</span>
            </div>
            <button class="launch-btn" @click="$router.push('/design-f-room')">
              <i class="fas fa-external-link-alt"></i>
              전체 화면으로 보기
            </button>
          </div>
        </div>
        
        <div class="preview-frame">
          <RoomViewDesignF />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LobbyViewDesignF from '../lobby/views/LobbyViewDesignF.vue';
import CreateRoomModalDesignF from '../lobby/components/designs/CreateRoomModalDesignF.vue';
import RoomViewDesignF from '../room/views/RoomViewDesignF.vue';

const tabs = [
  { id: 'lobby', label: '로비', icon: 'fas fa-door-open' },
  { id: 'modal', label: '방 생성', icon: 'fas fa-plus-circle' },
  { id: 'room', label: '대기실', icon: 'fas fa-users' }
];

const activeTab = ref('lobby');
const showModal = ref(false);
const showModalPreview = ref(true);

const handleCreateRoom = (data) => {
  showModal.value = false;
  alert(`방 "${data.title}" 생성 완료! (테스트 모드)`);
};
</script>

<style scoped>
.design-f-test {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* 헤더 */
.test-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-inner {
  max-width: 1600px;
  margin: 0 auto;
  height: 100%;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  letter-spacing: 0.03em;
}

.header-title h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
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
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-btn.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

/* 메인 */
.test-main {
  padding: 80px 1.5rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.test-section {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  min-height: calc(100vh - 120px);
}

.test-section.modal-test {
  grid-template-columns: 320px 1fr;
}

/* 정보 카드 */
.section-info {
  position: sticky;
  top: 80px;
  align-self: start;
}

.info-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
}

.info-card h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  color: #111827;
}

.info-card h2 i {
  color: #10b981;
}

.info-card p {
  margin: 0 0 1rem 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #374151;
}

.feature i {
  color: #10b981;
  font-size: 0.7rem;
}

.launch-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.launch-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
}

/* 프리뷰 프레임 */
.preview-frame {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  min-height: 600px;
}

/* 모달 프리뷰 */
.modal-preview-area {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  min-height: 600px;
  padding: 2rem;
}

.modal-demo-bg {
  position: relative;
  width: 100%;
  max-width: 500px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .test-section {
    grid-template-columns: 1fr;
  }
  
  .section-info {
    position: static;
  }
  
  .tab-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0;
    padding: 0.5rem;
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    z-index: 100;
  }
  
  .tab-btn {
    flex: 1;
    flex-direction: column;
    padding: 0.6rem 0.5rem;
    border: none;
    border-radius: 0;
    gap: 0.2rem;
  }
  
  .tab-btn span {
    font-size: 0.65rem;
  }
  
  .test-main {
    padding-bottom: 80px;
  }
}

@media (max-width: 640px) {
  .header-inner {
    padding: 0 1rem;
    gap: 1rem;
  }
  
  .header-title h1 {
    font-size: 0.9rem;
  }
  
  .test-main {
    padding: 74px 1rem 80px;
  }
}
</style>

