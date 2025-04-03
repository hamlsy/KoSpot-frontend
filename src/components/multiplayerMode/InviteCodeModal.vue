<template>
  <div class="invite-modal" v-if="visible">
    <div class="modal-overlay" @click="close"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">친구 초대하기</h2>
        <button class="close-button" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="invite-code-section">
          <div class="section-title">초대 코드</div>
          <div class="invite-code">
            <span class="code">{{ inviteCode }}</span>
            <button class="copy-button" @click="copyInviteCode" :disabled="copySuccess">
              <i :class="copySuccess ? 'fas fa-check' : 'fas fa-copy'"></i>
              {{ copySuccess ? '복사됨' : '복사' }}
            </button>
          </div>
          <div class="code-expiry">
            유효기간: {{ formattedExpiry }}
          </div>
        </div>
        
        <div class="invite-link-section">
          <div class="section-title">초대 링크</div>
          <div class="invite-link">
            <input 
              type="text" 
              :value="inviteLink" 
              readonly 
              ref="inviteLinkInput"
            />
            <button class="copy-button" @click="copyInviteLink" :disabled="linkCopySuccess">
              <i :class="linkCopySuccess ? 'fas fa-check' : 'fas fa-copy'"></i>
              {{ linkCopySuccess ? '복사됨' : '복사' }}
            </button>
          </div>
        </div>
        
        <div class="share-section">
          <div class="section-title">공유하기</div>
          <div class="share-buttons">
            <button class="share-button kakao" @click="shareToKakao">
              <img src="/img/kakao-icon.png" alt="카카오톡" />
              카카오톡
            </button>
            <button class="share-button facebook" @click="shareToFacebook">
              <i class="fab fa-facebook-f"></i>
              페이스북
            </button>
            <button class="share-button twitter" @click="shareToTwitter">
              <i class="fab fa-twitter"></i>
              트위터
            </button>
            <button class="share-button line" @click="shareToLine">
              <img src="/img/line-icon.png" alt="라인" />
              라인
            </button>
          </div>
        </div>
        
        <div class="qr-code-section">
          <div class="section-title">QR 코드</div>
          <div class="qr-code">
            <img :src="qrCodeUrl" alt="QR 코드" />
            <button class="download-button" @click="downloadQRCode">
              <i class="fas fa-download"></i>
              다운로드
            </button>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="refresh-button" @click="refreshInviteCode">
          <i class="fas fa-sync-alt"></i>
          새 코드 생성
        </button>
        <button class="close-btn" @click="close">닫기</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InviteCodeModal',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    roomId: {
      type: String,
      required: true
    },
    inviteCode: {
      type: String,
      required: true
    },
    expiryTime: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 현재 시간으로부터 24시간 후
    },
    qrCodeUrl: {
      type: String,
      default: 'https://via.placeholder.com/200x200?text=QR+Code' // 기본 QR 코드 이미지
    }
  },
  
  data() {
    return {
      copySuccess: false,
      linkCopySuccess: false,
      copyTimeout: null,
      linkCopyTimeout: null
    };
  },
  
  computed: {
    inviteLink() {
      // 실제 서비스 도메인으로 변경 필요
      return `https://kospot.com/join/${this.inviteCode}`;
    },
    
    formattedExpiry() {
      if (!this.expiryTime) return '알 수 없음';
      
      const now = new Date();
      const expiry = new Date(this.expiryTime);
      const diffMs = expiry - now;
      
      // 만료된 경우
      if (diffMs <= 0) {
        return '만료됨';
      }
      
      // 시간 계산
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      if (hours > 0) {
        return `${hours}시간 ${mins}분 후 만료`;
      } else {
        return `${mins}분 후 만료`;
      }
    }
  },
  
  methods: {
    close() {
      this.$emit('close');
    },
    
    async copyInviteCode() {
      if (this.copySuccess) return;
      
      try {
        await navigator.clipboard.writeText(this.inviteCode);
        this.copySuccess = true;
        
        // 2초 후 복사 성공 표시 초기화
        clearTimeout(this.copyTimeout);
        this.copyTimeout = setTimeout(() => {
          this.copySuccess = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('복사에 실패했습니다. 다시 시도해주세요.');
      }
    },
    
    async copyInviteLink() {
      if (this.linkCopySuccess) return;
      
      try {
        await navigator.clipboard.writeText(this.inviteLink);
        this.linkCopySuccess = true;
        
        // 2초 후 복사 성공 표시 초기화
        clearTimeout(this.linkCopyTimeout);
        this.linkCopyTimeout = setTimeout(() => {
          this.linkCopySuccess = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('복사에 실패했습니다. 다시 시도해주세요.');
      }
    },
    
    shareToKakao() {
      // 카카오톡 공유 API 구현 필요
      this.$emit('share', 'kakao');
    },
    
    shareToFacebook() {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.inviteLink)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
    },
    
    shareToTwitter() {
      const text = '코스팟(KoSpot)에서 함께 게임해요!';
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.inviteLink)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
    },
    
    shareToLine() {
      const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(this.inviteLink)}`;
      window.open(shareUrl, '_blank', 'width=600,height=600');
    },
    
    downloadQRCode() {
      // QR 코드 이미지 다운로드 구현
      const link = document.createElement('a');
      link.href = this.qrCodeUrl;
      link.download = `kospot-invite-${this.inviteCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    
    refreshInviteCode() {
      this.$emit('refresh-code');
    }
  },
  
  beforeDestroy() {
    // 타이머 정리
    clearTimeout(this.copyTimeout);
    clearTimeout(this.linkCopyTimeout);
  }
};
</script>

<style scoped>
.invite-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: -1;
}

.modal-container {
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: zoomIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-title {
  margin: 0;
  font-size: 1.4rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: #666;
}

.invite-code-section, .invite-link-section, .share-section, .qr-code-section {
  margin-bottom: 1.5rem;
}

.invite-code {
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border: 1px solid #e0e5ec;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
}

.code {
  font-family: monospace;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 1px;
  flex: 1;
  color: #333;
}

.copy-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.copy-button:hover:not(:disabled) {
  background: #5a6edb;
}

.copy-button:disabled {
  background: #4caf50;
  cursor: default;
}

.code-expiry {
  font-size: 0.8rem;
  color: #999;
  text-align: right;
}

.invite-link {
  display: flex;
  background: #f5f7fa;
  border: 1px solid #e0e5ec;
  border-radius: 8px;
  overflow: hidden;
}

.invite-link input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  color: #333;
  outline: none;
}

.invite-link .copy-button {
  border-radius: 0;
}

.share-buttons {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.share-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  color: white;
}

.share-button img {
  width: 16px;
  height: 16px;
}

.kakao {
  background: #fee500;
  color: #333;
}

.kakao:hover {
  background: #f7d500;
}

.facebook {
  background: #1877f2;
}

.facebook:hover {
  background: #1665d1;
}

.twitter {
  background: #1da1f2;
}

.twitter:hover {
  background: #1991db;
}

.line {
  background: #00c300;
}

.line:hover {
  background: #00b300;
}

.qr-code {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-code img {
  width: 150px;
  height: 150px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.5rem;
}

.download-button {
  background: #f5f7fa;
  color: #333;
  border: 1px solid #e0e5ec;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.download-button:hover {
  background: #e0e5ec;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-top: 1px solid #eee;
}

.refresh-button {
  background: #f5f7fa;
  color: #333;
  border: 1px solid #e0e5ec;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.refresh-button:hover {
  background: #e0e5ec;
}

.close-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #5a6edb;
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 640px) {
  .modal-container {
    width: 95%;
  }
  
  .share-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  
  .code {
    font-size: 1.2rem;
  }
}
</style> 