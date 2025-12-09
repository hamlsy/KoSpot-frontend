<template>
  <div class="design-test-container">
    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <i :class="tab.icon"></i>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 컨텐츠 영역 -->
    <div class="content-area">
      <!-- CreateRoomModal 테스트 -->
      <div v-if="activeTab === 'create-room'" class="tab-content">
        <div class="test-header">
          <h2>방 생성 모달 디자인 테스트</h2>
          <button class="show-modal-btn" @click="showCreateModal = true">
            모달 열기
          </button>
        </div>
        <div class="test-info">
          <p>위 버튼을 클릭하여 방 생성 모달을 열고 디자인을 확인하세요.</p>
        </div>
        
        <CreateRoomModal
          v-if="showCreateModal"
          @close="showCreateModal = false"
          @create-room="handleCreateRoom"
        />
      </div>

      <!-- RoomView 테스트 -->
      <div v-if="activeTab === 'room-view'" class="tab-content">
        <div class="test-header">
          <h2>대기실 뷰 디자인 테스트</h2>
          <div class="test-controls">
            <button @click="toggleRoomViewMobile" class="control-btn">
              {{ isRoomViewMobile ? '데스크톱' : '모바일' }} 모드
            </button>
            <button @click="toggleRoomViewChat" class="control-btn" v-if="isRoomViewMobile">
              {{ isRoomViewChatVisible ? '채팅 닫기' : '채팅 열기' }}
            </button>
          </div>
        </div>
        
        <div class="room-view-wrapper" :class="{ 'mobile': isRoomViewMobile }">
          <RoomViewDummy
            :room-id="dummyRoomData.id"
            :is-mobile="isRoomViewMobile"
            :is-chat-visible="isRoomViewChatVisible"
            @toggle-chat="isRoomViewChatVisible = !isRoomViewChatVisible"
          />
        </div>
      </div>

      <!-- LobbyView 테스트 -->
      <div v-if="activeTab === 'lobby-view'" class="tab-content">
        <div class="test-header">
          <h2>로비 뷰 디자인 테스트</h2>
          <div class="test-controls">
            <button @click="toggleLobbyMobile" class="control-btn">
              {{ isLobbyMobile ? '데스크톱' : '모바일' }} 모드
            </button>
            <button @click="toggleLobbyChat" class="control-btn" v-if="isLobbyMobile">
              {{ isLobbyChatVisible ? '채팅 닫기' : '채팅 열기' }}
            </button>
          </div>
        </div>
        
        <div class="lobby-view-wrapper" :class="{ 'mobile': isLobbyMobile }">
          <LobbyViewDummy
            :is-mobile="isLobbyMobile"
            :is-chat-visible="isLobbyChatVisible"
            @toggle-chat="isLobbyChatVisible = !isLobbyChatVisible"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CreateRoomModal from '../lobby/components/CreateRoomModal.vue';
import RoomViewDummy from './components/RoomViewDummy.vue';
import LobbyViewDummy from './components/LobbyViewDummy.vue';

// 탭 관리
const tabs = [
  { id: 'create-room', label: '방 생성 모달', icon: 'fas fa-plus-circle' },
  { id: 'room-view', label: '대기실 뷰', icon: 'fas fa-door-open' },
  { id: 'lobby-view', label: '로비 뷰', icon: 'fas fa-home' }
];
const activeTab = ref('create-room');

// CreateRoomModal 상태
const showCreateModal = ref(false);

// RoomView 테스트 상태
const isRoomViewMobile = ref(false);
const isRoomViewChatVisible = ref(false);

// LobbyView 테스트 상태
const isLobbyMobile = ref(false);
const isLobbyChatVisible = ref(false);

// 더미 방 데이터
const dummyRoomData = ref({
  id: 'test-room-123'
});

// 메서드
const handleCreateRoom = (roomData) => {
  console.log('방 생성 데이터:', roomData);
  alert(`방 생성 시뮬레이션:\n방 이름: ${roomData.title}\n인원: ${roomData.maxPlayers}명\n라운드: ${roomData.totalRounds}`);
  showCreateModal.value = false;
};

const toggleRoomViewMobile = () => {
  isRoomViewMobile.value = !isRoomViewMobile.value;
};

const toggleRoomViewChat = () => {
  isRoomViewChatVisible.value = !isRoomViewChatVisible.value;
};

const toggleLobbyMobile = () => {
  isLobbyMobile.value = !isLobbyMobile.value;
};

const toggleLobbyChat = () => {
  isLobbyChatVisible.value = !isLobbyChatVisible.value;
};
</script>

<style scoped>
.design-test-container {
  min-height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.tab-navigation {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 2px solid #e2e8f0;
  padding: 0 2rem;
  display: flex;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.05);
}

.tab-button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  background: rgba(37, 99, 235, 0.05);
}

.tab-button i {
  font-size: 1rem;
}

.content-area {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.tab-content {
  max-width: 1600px;
  margin: 0 auto;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.test-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.test-controls {
  display: flex;
  gap: 0.75rem;
}

.control-btn,
.show-modal-btn {
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

.control-btn:hover,
.show-modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.test-info {
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.test-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.room-view-wrapper,
.lobby-view-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.room-view-wrapper.mobile,
.lobby-view-wrapper.mobile {
  max-width: 480px;
  margin: 0 auto;
  border: 2px solid #e2e8f0;
}

@media (max-width: 768px) {
  .tab-navigation {
    padding: 0 1rem;
    overflow-x: auto;
  }

  .tab-button {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
  }

  .tab-button span {
    display: none;
  }

  .content-area {
    padding: 1rem;
  }

  .test-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .test-controls {
    width: 100%;
    flex-direction: column;
  }

  .control-btn {
    width: 100%;
  }
}
</style>

