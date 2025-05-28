<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-logo">
        <h2>KoSpot</h2>
        <p>대한민국 지역 맞추기 게임</p>
      </div>
      
      <div class="footer-links">
        <div class="footer-section">
          <h3>서비스</h3>
          <ul>
            <li><router-link to="/game/photo">포토 모드</router-link></li>
            <li><router-link to="/game/roadview">로드뷰 모드</router-link></li>
            <li><router-link to="/game/multiplayer">멀티플레이어</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3>정보</h3>
          <ul>
            <li><router-link to="/about">소개</router-link></li>
            <li><router-link to="/noticeList">공지사항</router-link></li>
            <li><router-link to="/terms">이용약관</router-link></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h3>고객지원</h3>
          <ul>
            <li><router-link to="/faq">자주 묻는 질문</router-link></li>
            <li><router-link to="/contact">문의하기</router-link></li>
            <li><router-link to="/report">버그 신고</router-link></li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} KoSpot. All rights reserved.</p>
      <div class="social-links">
        <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
        <a href="#" class="social-link"><i class="fab fa-facebook"></i></a>
        <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
        <a href="#" class="social-link"><i class="fab fa-github"></i></a>
      </div>
    </div>
  </footer>
</template>

<script setup>
// Vue 3 Composition API 방식으로 구현된 푸터 컴포넌트
import { computed } from 'vue';

// 현재 연도 계산
const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>
.footer {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 3rem 0 1.5rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.footer-logo {
  flex: 1;
  min-width: 250px;
}

.footer-logo h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #4a6cf7;
}

.footer-logo p {
  color: #9ca3af;
  margin: 0;
}

.footer-links {
  flex: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.footer-section {
  flex: 1;
  min-width: 150px;
}

.footer-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #e5e7eb;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s;
  font-size: 0.875rem;
}

.footer-section a:hover {
  color: #f9fafb;
}

.footer-bottom {
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 1.5rem 1.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #374151;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-bottom p {
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  color: #9ca3af;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.social-link:hover {
  color: #f9fafb;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 2rem;
  }
  
  .footer-links {
    gap: 1.5rem;
  }
  
  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>
