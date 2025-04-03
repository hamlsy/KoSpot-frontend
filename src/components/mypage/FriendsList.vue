<template>
  <div class="friends-page">
    <NavigationBar />
    <div class="friends-content">
      <div class="friends-container">
        <div class="friends-header">
          <h2>내 친구</h2>
          <div class="header-controls">
            <div class="search-bar">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="친구 검색..." 
                @input="filterFriends"
              >
            </div>
            <button class="add-friend-btn" @click="showAddFriendModal = true">
              <i class="fas fa-user-plus"></i>
              친구 추가
            </button>
          </div>
        </div>
        
        <div class="tabs">
          <div 
            class="tab" 
            :class="{ active: activeTab === 'friends' }"
            @click="setActiveTab('friends')"
          >
            친구 목록 ({{ friends.length }})
          </div>
          <div 
            class="tab" 
            :class="{ active: activeTab === 'requests' }"
            @click="setActiveTab('requests')"
          >
            친구 요청 
            <span v-if="pendingRequests.length" class="request-badge">
              {{ pendingRequests.length }}
            </span>
          </div>
        </div>
        
        <!-- 친구 목록 탭 -->
        <div v-if="activeTab === 'friends'" class="friends-list">
          <div v-if="filteredFriends.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-user-friends"></i>
            </div>
            <p>{{ searchQuery ? '검색 결과가 없습니다.' : '친구가 없습니다.' }}</p>
            <button 
              v-if="!searchQuery" 
              class="add-friend-btn" 
              @click="showAddFriendModal = true"
            >
              친구 추가하기
            </button>
          </div>
          
          <div v-else class="friends-grid">
            <div 
              v-for="friend in filteredFriends" 
              :key="friend.id"
              class="friend-card"
            >
              <div class="friend-status" :class="friend.status"></div>
              <div class="friend-avatar">
                <img :src="friend.profileImage" :alt="friend.nickname">
              </div>
              <div class="friend-info">
                <div class="friend-name">
                  {{ friend.nickname }}
                  <span class="friend-level">Lv.{{ friend.level }}</span>
                </div>
                <div class="friend-meta">
                  <span v-if="friend.status === 'online'">온라인</span>
                  <span v-else-if="friend.status === 'ingame'">게임 중</span>
                  <span v-else>{{ formatLastSeen(friend.lastSeen) }}</span>
                </div>
              </div>
              <div class="friend-actions">
                <button class="action-btn invite-btn" v-if="friend.status !== 'offline'">
                  <i class="fas fa-gamepad"></i>
                  초대
                </button>
                <button class="action-btn message-btn">
                  <i class="fas fa-comment"></i>
                  메시지
                </button>
                <button class="action-btn more-btn">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 친구 요청 탭 -->
        <div v-else class="requests-list">
          <div v-if="pendingRequests.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-user-check"></i>
            </div>
            <p>새로운 친구 요청이 없습니다.</p>
          </div>
          
          <div v-else>
            <div 
              v-for="request in pendingRequests" 
              :key="request.id"
              class="request-item"
            >
              <div class="request-avatar">
                <img :src="request.profileImage" :alt="request.nickname">
              </div>
              <div class="request-info">
                <div class="request-name">{{ request.nickname }}</div>
                <div class="request-meta">
                  <span class="request-time">{{ formatTime(request.requestTime) }}</span>
                  <span v-if="request.mutualFriends" class="mutual-friends">
                    함께 아는 친구 {{ request.mutualFriends }}명
                  </span>
                </div>
              </div>
              <div class="request-actions">
                <button class="accept-btn" @click="acceptRequest(request.id)">
                  수락
                </button>
                <button class="reject-btn" @click="rejectRequest(request.id)">
                  거절
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 친구 추가 모달 -->
        <div v-if="showAddFriendModal" class="modal-overlay">
          <div class="modal-container">
            <div class="modal-header">
              <h3>친구 추가</h3>
              <button class="close-btn" @click="showAddFriendModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-content">
              <div class="search-section">
                <label for="friend-search">코스팟 ID 또는 이메일로 검색</label>
                <div class="search-input">
                  <input 
                    type="text" 
                    id="friend-search" 
                    v-model="friendSearch"
                    placeholder="친구의 ID 또는 이메일 입력"
                  >
                  <button class="search-btn" @click="searchFriend">
                    <i class="fas fa-search"></i>
                  </button>
                </div>
              </div>
              
              <div class="search-results" v-if="searchResults.length > 0">
                <h4>검색 결과</h4>
                <div 
                  v-for="result in searchResults" 
                  :key="result.id"
                  class="result-item"
                >
                  <div class="result-avatar">
                    <img :src="result.profileImage" :alt="result.nickname">
                  </div>
                  <div class="result-info">
                    <div class="result-name">{{ result.nickname }}</div>
                    <div class="result-id">@{{ result.userId }}</div>
                  </div>
                  <button 
                    class="add-btn" 
                    :class="{ 'sent': result.requestSent }"
                    :disabled="result.requestSent"
                    @click="sendFriendRequest(result.id)"
                  >
                    {{ result.requestSent ? '요청됨' : '친구 추가' }}
                  </button>
                </div>
              </div>
              
              <div class="divider">
                <span>또는</span>
              </div>
              
              <div class="invite-section">
                <h4>친구 초대</h4>
                <p>아직 코스팟을 사용하지 않는 친구를 초대해 보세요.</p>
                
                <div class="share-buttons">
                  <button class="share-btn kakao">
                    <i class="fas fa-comment"></i>
                    카카오톡
                  </button>
                  <button class="share-btn facebook">
                    <i class="fab fa-facebook-f"></i>
                    페이스북
                  </button>
                  <button class="share-btn email">
                    <i class="fas fa-envelope"></i>
                    이메일
                  </button>
                  <button class="share-btn link">
                    <i class="fas fa-link"></i>
                    링크 복사
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavigationBar from '../shared/NavigationBar.vue';

export default {
  name: 'FriendsList',
  components: {
    NavigationBar,
  },
  data() {
    return {
      activeTab: 'friends',
      searchQuery: '',
      showAddFriendModal: false,
      friendSearch: '',
      searchResults: [],
      friends: [
        {
          id: '1',
          nickname: '여행마니아',
          userId: 'travellover',
          profileImage: '/assets/avatars/user1.png',
          level: 38,
          status: 'online',
          lastSeen: null
        },
        {
          id: '2',
          nickname: '지도탐험가',
          userId: 'mapexplorer',
          profileImage: '/assets/avatars/user2.png',
          level: 27,
          status: 'ingame',
          lastSeen: null
        },
        {
          id: '3',
          nickname: '포토그래퍼',
          userId: 'photographer',
          profileImage: '/assets/avatars/user3.png',
          level: 42,
          status: 'offline',
          lastSeen: new Date(2023, 8, 25, 18, 30)
        },
        {
          id: '4',
          nickname: '도시탐험가',
          userId: 'cityexplorer',
          profileImage: '/assets/avatars/user4.png',
          level: 15,
          status: 'offline',
          lastSeen: new Date(2023, 8, 24, 12, 15)
        }
      ],
      pendingRequests: [
        {
          id: 'r1',
          nickname: '한국여행자',
          profileImage: '/assets/avatars/user5.png',
          requestTime: new Date(2023, 8, 25, 10, 45),
          mutualFriends: 2
        },
        {
          id: 'r2',
          nickname: '로드뷰마스터',
          profileImage: '/assets/avatars/user6.png',
          requestTime: new Date(2023, 8, 23, 14, 30),
          mutualFriends: 0
        }
      ],
      filteredFriends: []
    };
  },
  
  created() {
    this.filterFriends();
  },
  
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab;
    },
    
    filterFriends() {
      if (!this.searchQuery) {
        this.filteredFriends = [...this.friends];
        return;
      }
      
      const query = this.searchQuery.toLowerCase();
      this.filteredFriends = this.friends.filter(friend => 
        friend.nickname.toLowerCase().includes(query) ||
        friend.userId.toLowerCase().includes(query)
      );
    },
    
    formatLastSeen(date) {
      if (!date) return '알 수 없음';
      
      const now = new Date();
      const diff = now - date;
      
      // 1일 이내
      if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours}시간 전`;
      }
      
      // 7일 이내
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days}일 전`;
      }
      
      // 날짜 표시
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    },
    
    formatTime(date) {
      if (!date) return '';
      
      const now = new Date();
      const diff = now - date;
      
      // 1일 이내
      if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours}시간 전`;
      }
      
      // 날짜 표시
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    },
    
    acceptRequest(requestId) {
      // 요청 수락 로직
      const requestIndex = this.pendingRequests.findIndex(req => req.id === requestId);
      if (requestIndex === -1) return;
      
      const request = this.pendingRequests[requestIndex];
      
      // 친구 목록에 추가
      this.friends.push({
        id: request.id,
        nickname: request.nickname,
        userId: request.id,
        profileImage: request.profileImage,
        level: 1,
        status: 'offline',
        lastSeen: new Date()
      });
      
      // 요청 목록에서 제거
      this.pendingRequests.splice(requestIndex, 1);
      
      this.filterFriends();
    },
    
    rejectRequest(requestId) {
      // 요청 거절 로직
      const requestIndex = this.pendingRequests.findIndex(req => req.id === requestId);
      if (requestIndex === -1) return;
      
      // 요청 목록에서 제거
      this.pendingRequests.splice(requestIndex, 1);
    },
    
    searchFriend() {
      if (!this.friendSearch) return;
      
      // 친구 검색 로직 (임시 데이터)
      this.searchResults = [
        {
          id: 'search1',
          nickname: '대한민국여행자',
          userId: 'koreatravel',
          profileImage: '/assets/avatars/user7.png',
          requestSent: false
        },
        {
          id: 'search2',
          nickname: '서울탐험가',
          userId: 'seoulexplorer',
          profileImage: '/assets/avatars/user8.png',
          requestSent: true
        }
      ];
    },
    
    sendFriendRequest(userId) {
      // 친구 요청 보내기 로직
      const resultIndex = this.searchResults.findIndex(result => result.id === userId);
      if (resultIndex === -1) return;
      
      this.searchResults[resultIndex].requestSent = true;
    }
  }
};
</script>

<style scoped>
.friends-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.friends-content {
  padding-top: 80px; /* 네비게이션바 높이만큼 여백 */
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.friends-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.friends-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.friends-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.header-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-bar {
  position: relative;
  width: 250px;
}

.search-bar i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-bar input {
  width: 100%;
  padding: 8px 12px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.9rem;
}

.search-bar input:focus {
  outline: none;
  border-color: #4285F4;
}

.add-friend-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-friend-btn:hover {
  background: #3367d6;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #eee;
}

.tab {
  padding: 15px 20px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tab:hover {
  color: #333;
  background: #f8f9fa;
}

.tab.active {
  color: #4285F4;
  border-bottom: 2px solid #4285F4;
}

.request-badge {
  background: #f44336;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 5px;
}

.friends-list, .requests-list {
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #ddd;
  margin-bottom: 15px;
}

.empty-state p {
  margin: 0 0 15px 0;
  color: #666;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.friend-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  position: relative;
  transition: all 0.2s ease;
}

.friend-card:hover {
  background: #f0f2f5;
  transform: translateY(-2px);
}

.friend-status {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.friend-status.online {
  background: #4CAF50;
}

.friend-status.ingame {
  background: #FF9800;
}

.friend-status.offline {
  background: #9E9E9E;
}

.friend-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
}

.friend-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
}

.friend-level {
  font-size: 0.8rem;
  color: #666;
  margin-left: 8px;
}

.friend-meta {
  font-size: 0.85rem;
  color: #666;
}

.friend-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.invite-btn:hover {
  color: #4285F4;
}

.message-btn:hover {
  color: #4CAF50;
}

.request-item {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
}

.request-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
}

.request-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.request-info {
  flex: 1;
}

.request-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.request-meta {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
}

.request-time {
  margin-right: 10px;
}

.mutual-friends {
  display: flex;
  align-items: center;
}

.mutual-friends:before {
  content: "•";
  margin-right: 5px;
}

.request-actions {
  display: flex;
  gap: 10px;
}

.accept-btn, .reject-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.accept-btn {
  background: #4285F4;
  color: white;
}

.accept-btn:hover {
  background: #3367d6;
}

.reject-btn {
  background: #f0f2f5;
  color: #333;
}

.reject-btn:hover {
  background: #e0e3e9;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #999;
  cursor: pointer;
}

.modal-content {
  padding: 20px;
}

.search-section, .invite-section {
  margin-bottom: 20px;
}

.search-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
}

.search-input {
  display: flex;
  gap: 10px;
}

.search-input input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-btn {
  background: #4285F4;
  color: white;
  border: none;
  border-radius: 6px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-results {
  margin-top: 20px;
}

.search-results h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.result-item:hover {
  background: #f8f9fa;
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
}

.result-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-info {
  flex: 1;
}

.result-name {
  font-weight: 600;
  color: #333;
}

.result-id {
  font-size: 0.85rem;
  color: #666;
}

.add-btn {
  background: #4285F4;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: #3367d6;
}

.add-btn.sent {
  background: #f0f2f5;
  color: #666;
  cursor: default;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #999;
}

.divider:before, .divider:after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #eee;
}

.divider span {
  padding: 0 10px;
}

.invite-section h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.invite-section p {
  margin: 0 0 15px 0;
  color: #666;
}

.share-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.share-btn {
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: none;
}

.share-btn.kakao {
  background: #FEE500;
  color: #3C1E1E;
}

.share-btn.facebook {
  background: #3b5998;
  color: white;
}

.share-btn.email {
  background: #f0f2f5;
  color: #333;
}

.share-btn.link {
  background: #f0f2f5;
  color: #333;
}

.share-btn:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .friends-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-controls {
    width: 100%;
    flex-direction: column;
  }
  
  .search-bar {
    width: 100%;
  }
  
  .add-friend-btn {
    width: 100%;
    justify-content: center;
  }
  
  .friends-grid {
    grid-template-columns: 1fr;
  }
  
  .request-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
  }
  
  .request-avatar {
    margin: 0 auto 10px auto;
  }
  
  .request-meta {
    justify-content: center;
    flex-direction: column;
    gap: 5px;
  }
  
  .mutual-friends:before {
    display: none;
  }
  
  .request-actions {
    width: 100%;
    margin-top: 10px;
  }
  
  .accept-btn, .reject-btn {
    flex: 1;
  }
  
  .share-buttons {
    grid-template-columns: 1fr;
  }
}
</style> 