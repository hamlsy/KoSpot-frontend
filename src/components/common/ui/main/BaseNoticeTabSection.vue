<template>
  <section class="notices-section">
    <div class="section-header">
      <h2 class="section-title">공지사항</h2>
      <div class="tabs-container">
        <div class="tabs">
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'all' }" 
            @click="activeTab = 'all'"
          >
            전체
          </button>
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'notice' }" 
            @click="activeTab = 'notice'"
          >
            공지사항
          </button>
          <button 
            class="tab-button" 
            :class="{ active: activeTab === 'event' }" 
            @click="activeTab = 'event'"
          >
            이벤트
          </button>
        </div>
      </div>
    </div>
    
    <div class="notices-list">
      <div
        v-for="notice in filteredNotices"
        :key="notice.id"
        class="notice-item"
      >
        <div class="notice-info">
          <span
            class="notice-category"
            :class="notice.category.toLowerCase()"
          >{{ notice.category }}</span>
          <h3 class="notice-title">{{ notice.title }}</h3>
        </div>
        <span class="notice-date">{{ notice.date }}</span>
      </div>
      
      <div v-if="filteredNotices.length === 0" class="no-notices">
        <p>표시할 내용이 없습니다.</p>
      </div>
    </div>
    
    <div class="view-all-container">
      <router-link :to="viewAllLink" class="view-all">
        전체보기 <i class="fas fa-angle-right"></i>
      </router-link>
    </div>
  </section>
</template>

<script>
export default {
  name: "NoticeTabSection",
  props: {
    notices: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      activeTab: 'all'
    };
  },
  computed: {
    filteredNotices() {
      if (this.activeTab === 'all') {
        return this.notices;
      } else if (this.activeTab === 'notice') {
        return this.notices.filter(notice => notice.category === '공지');
      } else if (this.activeTab === 'event') {
        return this.notices.filter(notice => notice.category === '이벤트');
      }
      return this.notices;
    },
    viewAllLink() {
      if (this.activeTab === 'event') {
        return '/eventList';
      }
      return '/noticeList';
    }
  }
};
</script>

<style scoped>
.notices-section {
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.tabs-container {
  display: flex;
  align-items: center;
}

.tabs {
  display: flex;
  gap: 5px;
}

.tab-button {
  background: none;
  border: none;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.tab-button:hover {
  background-color: #f5f5f5;
}

.tab-button.active {
  background-color: #4cd964;
  color: white;
  font-weight: 500;
}

.notices-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

.notice-item:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.notice-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notice-category {
  font-size: 0.8rem;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.notice-category.공지 {
  background-color: #e3f2fd;
  color: #1976d2;
}

.notice-category.이벤트 {
  background-color: #fff8e1;
  color: #ff9800;
}

.notice-title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  color: #333;
}

.notice-date {
  font-size: 0.8rem;
  color: #999;
}

.view-all-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}

.view-all {
  font-size: 0.9rem;
  color: #666;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.view-all:hover {
  color: #333;
}

.no-notices {
  padding: 20px;
  text-align: center;
  color: #999;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .tabs-container {
    width: 100%;
  }
  
  .tabs {
    width: 100%;
    justify-content: space-between;
  }
  
  .tab-button {
    flex: 1;
    text-align: center;
  }
}
</style>
