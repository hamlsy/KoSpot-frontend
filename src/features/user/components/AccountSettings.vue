<template>
  <div class="account-settings-page">
    <NavigationBar />
    <div class="settings-container">
      <div class="settings-header">
        <h2>계정 설정</h2>
        <p>계정 정보를 관리하고 보안 설정을 변경할 수 있습니다.</p>
      </div>
      
      <div class="settings-content">
        <!-- 프로필 정보 -->
        <div class="settings-section">
          <h3>프로필 정보</h3>
          
          <div class="form-group">
            <label for="nickname">닉네임</label>
            <div class="input-with-button">
              <input
                type="text"
                id="nickname"
                v-model="userSettings.nickname"
                :disabled="!editingNickname"
              >
              <button 
                v-if="!editingNickname" 
                class="edit-btn"
                @click="startEditNickname"
              >
                수정
              </button>
              <button 
                v-else 
                class="save-btn"
                @click="saveNickname"
              >
                저장
              </button>
            </div>
            <p class="input-hint">다른 사용자에게 표시되는 이름입니다.</p>
          </div>
          
          <div class="form-group">
            <label for="email">이메일 주소</label>
            <div class="input-with-button">
              <input
                type="email"
                id="email"
                v-model="userSettings.email"
                :disabled="!editingEmail"
              >
              <button 
                v-if="!editingEmail" 
                class="edit-btn"
                @click="startEditEmail"
              >
                수정
              </button>
              <button 
                v-else 
                class="save-btn"
                @click="saveEmail"
              >
                저장
              </button>
            </div>
            <p class="input-hint">알림을 받고 계정을 복구하는 데 사용됩니다.</p>
          </div>
          
          <div class="form-group">
            <label for="language">언어 설정</label>
            <select id="language" v-model="userSettings.language">
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
        
        <!-- 비밀번호 변경 -->
        <div class="settings-section">
          <h3>비밀번호 변경</h3>
          
          <div class="form-group">
            <label for="current-password">현재 비밀번호</label>
            <input
              type="password"
              id="current-password"
              v-model="passwordForm.currentPassword"
            >
          </div>
          
          <div class="form-group">
            <label for="new-password">새 비밀번호</label>
            <input
              type="password"
              id="new-password"
              v-model="passwordForm.newPassword"
            >
            <p class="input-hint">비밀번호는 8자 이상이어야 하며 숫자와 특수문자를 포함해야 합니다.</p>
          </div>
          
          <div class="form-group">
            <label for="confirm-password">비밀번호 확인</label>
            <input
              type="password"
              id="confirm-password"
              v-model="passwordForm.confirmPassword"
            >
          </div>
          
          <div class="password-strength" v-if="passwordForm.newPassword">
            <div class="strength-label">비밀번호 강도:</div>
            <div class="strength-meter">
              <div 
                class="strength-bar" 
                :style="{ width: passwordStrength.percentage + '%' }"
                :class="passwordStrength.class"
              ></div>
            </div>
            <div class="strength-text" :class="passwordStrength.class">
              {{ passwordStrength.text }}
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              class="primary-btn" 
              @click="changePassword"
              :disabled="!canChangePassword"
            >
              비밀번호 변경
            </button>
          </div>
        </div>
        
        <!-- 알림 설정 -->
        <div class="settings-section">
          <h3>알림 설정</h3>
          
          <div class="toggle-group">
            <div class="toggle-label">
              <span>게임 초대 알림</span>
              <p>친구가 게임에 초대했을 때 알림을 받습니다.</p>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="userSettings.notifications.gameInvites">
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <div class="toggle-group">
            <div class="toggle-label">
              <span>레벨 업 알림</span>
              <p>레벨이 올랐을 때 알림을 받습니다.</p>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="userSettings.notifications.levelUp">
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <div class="toggle-group">
            <div class="toggle-label">
              <span>새 친구 알림</span>
              <p>새로운 친구 요청이 있을 때 알림을 받습니다.</p>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="userSettings.notifications.friendRequests">
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <div class="toggle-group">
            <div class="toggle-label">
              <span>이메일 마케팅</span>
              <p>새로운 이벤트, 기능 또는 혜택에 대한 이메일을 받습니다.</p>
            </div>
            <label class="toggle">
              <input type="checkbox" v-model="userSettings.notifications.marketing">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <!-- 계정 관리 -->
        <div class="settings-section">
          <h3>계정 관리</h3>
          
          <div class="settings-actions">
            <button class="secondary-btn" @click="downloadData">
              <i class="fas fa-download"></i>
              내 데이터 다운로드
            </button>
            
            <button class="danger-btn" @click="showDeleteAccountModal = true">
              <i class="fas fa-user-times"></i>
              계정 삭제
            </button>
          </div>
        </div>
      </div>
      
      <!-- 계정 삭제 확인 모달 -->
      <div v-if="showDeleteAccountModal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h3>계정 삭제</h3>
            <button class="close-btn" @click="showDeleteAccountModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-content">
            <div class="warning-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            
            <p class="modal-text">
              계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 취소할 수 없습니다.
            </p>
            
            <div class="confirm-input">
              <label for="delete-confirm">확인을 위해 "삭제"를 입력하세요</label>
              <input 
                type="text" 
                id="delete-confirm" 
                v-model="deleteConfirmText"
                placeholder="삭제"
              >
            </div>
          </div>
          
          <div class="modal-footer">
            <button 
              class="cancel-btn" 
              @click="showDeleteAccountModal = false"
            >
              취소
            </button>
            <button 
              class="delete-btn" 
              :disabled="deleteConfirmText !== '삭제'"
              @click="deleteAccount"
            >
              계정 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NavigationBar from '@/core/components/NavigationBar.vue';

export default {
  name: 'AccountSettings',
  components: {
    NavigationBar,
  },
  
  data() {
    return {
      userSettings: {
        nickname: '코스팟마스터',
        email: 'example@kospot.com',
        language: 'ko',
        notifications: {
          gameInvites: true,
          levelUp: true,
          friendRequests: true,
          marketing: false
        }
      },
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      editingNickname: false,
      editingEmail: false,
      showDeleteAccountModal: false,
      deleteConfirmText: ''
    };
  },
  
  computed: {
    passwordStrength() {
      if (!this.passwordForm.newPassword) {
        return { percentage: 0, class: '', text: '' };
      }
      
      let strength = 0;
      const password = this.passwordForm.newPassword;
      
      // 길이 체크
      if (password.length >= 8) strength += 25;
      
      // 소문자 체크
      if (/[a-z]/.test(password)) strength += 15;
      
      // 대문자 체크
      if (/[A-Z]/.test(password)) strength += 15;
      
      // 숫자 체크
      if (/[0-9]/.test(password)) strength += 20;
      
      // 특수문자 체크
      if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
      
      let strengthClass = '';
      let strengthText = '';
      
      if (strength < 30) {
        strengthClass = 'weak';
        strengthText = '매우 약함';
      } else if (strength < 50) {
        strengthClass = 'fair';
        strengthText = '약함';
      } else if (strength < 75) {
        strengthClass = 'good';
        strengthText = '보통';
      } else {
        strengthClass = 'strong';
        strengthText = '강함';
      }
      
      return {
        percentage: strength,
        class: strengthClass,
        text: strengthText
      };
    },
    
    canChangePassword() {
      return (
        this.passwordForm.currentPassword &&
        this.passwordForm.newPassword &&
        this.passwordForm.confirmPassword &&
        this.passwordForm.newPassword === this.passwordForm.confirmPassword &&
        this.passwordStrength.percentage >= 50
      );
    }
  },
  
  methods: {
    startEditNickname() {
      this.editingNickname = true;
    },
    
    saveNickname() {
      // 실제 구현에서는 API를 통해 서버에 저장
      this.editingNickname = false;
    },
    
    startEditEmail() {
      this.editingEmail = true;
    },
    
    saveEmail() {
      // 실제 구현에서는 API를 통해 서버에 저장
      this.editingEmail = false;
    },
    
    changePassword() {
      if (!this.canChangePassword) return;
      
      // 실제 구현에서는 API를 통해 서버에 저장
      alert('비밀번호가 변경되었습니다.');
      
      // 폼 초기화
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    },
    
    downloadData() {
      // 실제 구현에서는 API를 통해 서버에서 데이터 다운로드
      alert('데이터 다운로드 요청이 처리되었습니다. 이메일로 다운로드 링크가 전송됩니다.');
    },
    
    deleteAccount() {
      if (this.deleteConfirmText !== '삭제') return;
      
      // 실제 구현에서는 API를 통해 서버에 삭제 요청
      alert('계정 삭제 요청이 처리되었습니다. 곧 로그아웃 됩니다.');
      this.showDeleteAccountModal = false;
      
      // 로그아웃 처리 (실제 구현에서 추가)
    }
  }
};
</script>

<style scoped>
.account-settings-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.settings-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.settings-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.settings-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: #333;
}

.settings-header p {
  margin: 0;
  color: #666;
}

.settings-content {
  padding: 20px;
}

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #eee;
}

.settings-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.settings-section h3 {
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4285F4;
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.input-hint {
  margin: 5px 0 0 0;
  font-size: 0.85rem;
  color: #888;
}

.input-with-button {
  display: flex;
  gap: 10px;
}

.input-with-button input {
  flex: 1;
}

.edit-btn, .save-btn {
  padding: 0 15px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.edit-btn {
  background: #f0f2f5;
  color: #4285F4;
}

.save-btn {
  background: #4285F4;
  color: white;
}

.password-strength {
  margin-bottom: 20px;
}

.strength-label {
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #666;
}

.strength-meter {
  height: 6px;
  background: #eee;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
}

.strength-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.strength-bar.weak {
  background: #f44336;
}

.strength-bar.fair {
  background: #ff9800;
}

.strength-bar.good {
  background: #4caf50;
}

.strength-bar.strong {
  background: #2196f3;
}

.strength-text {
  font-size: 0.85rem;
  text-align: right;
}

.strength-text.weak {
  color: #f44336;
}

.strength-text.fair {
  color: #ff9800;
}

.strength-text.good {
  color: #4caf50;
}

.strength-text.strong {
  color: #2196f3;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.primary-btn {
  padding: 10px 20px;
  background: #4285F4;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-btn:hover {
  background: #3367d6;
}

.primary-btn:disabled {
  background: #c5c5c5;
  cursor: not-allowed;
}

.toggle-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toggle-label {
  flex: 1;
}

.toggle-label span {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
}

.toggle-label p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: #4285F4;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.settings-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.secondary-btn, .danger-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
}

.secondary-btn {
  background: #f0f2f5;
  color: #333;
}

.secondary-btn:hover {
  background: #e0e3e9;
}

.danger-btn {
  background: #f8d7da;
  color: #dc3545;
}

.danger-btn:hover {
  background: #f5c2c7;
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
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
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
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 15px;
}

.modal-text {
  margin-bottom: 20px;
  color: #333;
  line-height: 1.5;
}

.confirm-input label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
}

.confirm-input input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  text-align: center;
  font-size: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
}

.cancel-btn, .delete-btn {
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-btn {
  background: #f0f2f5;
  color: #333;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:disabled {
  background: #e9a2a9;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .toggle-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .toggle {
    align-self: flex-start;
  }
}
</style> 