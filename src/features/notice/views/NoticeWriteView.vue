<template>
  <div class="notice-write-page">
    <NavigationBar />
    
    <main class="main-content">
      <div class="notice-container">
        <!-- 헤더 섹션 -->
        <div class="notice-header">
          <div class="header-content">
            <h1 class="page-title">
              {{ isEditMode ? '📝 공지사항 수정' : '✏️ 공지사항 작성' }}
            </h1>
            <p class="page-description">
              {{ isEditMode ? '공지사항을 수정하세요' : '새로운 공지사항을 작성하세요' }}
            </p>
          </div>
          
          <button @click="goBack" class="back-button">
            <i class="fas fa-arrow-left"></i>
            취소
          </button>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>{{ isEditMode ? '공지사항을 불러오는 중...' : '저장하는 중...' }}</p>
          </div>
        </div>

        <!-- 작성 폼 -->
        <div v-else class="notice-form-container">
          <form @submit.prevent="saveNotice" class="notice-form">
            <!-- 제목 입력 -->
            <div class="form-group">
              <label for="title" class="form-label">
                제목 *
                <span class="char-count">{{ formData.title.length }}/100</span>
              </label>
              <input
                id="title"
                v-model="formData.title"
                type="text"
                class="form-input"
                :class="{ 'error': errors.title }"
                placeholder="공지사항 제목을 입력하세요"
                maxlength="100"
                required
              />
              <div v-if="errors.title" class="error-message">
                {{ errors.title }}
              </div>
            </div>

            <!-- 내용 입력 -->
            <div class="form-group">
              <label for="content" class="form-label">
                내용 *
                <span class="char-count">{{ formData.content.length }}/5000</span>
              </label>
              <textarea
                id="content"
                v-model="formData.content"
                class="form-textarea"
                :class="{ 'error': errors.content }"
                placeholder="공지사항 내용을 입력하세요&#10;&#10;• 줄바꿈은 자동으로 반영됩니다&#10;• 이미지는 하단에서 별도로 추가할 수 있습니다"
                rows="15"
                maxlength="5000"
                required
              ></textarea>
              <div v-if="errors.content" class="error-message">
                {{ errors.content }}
              </div>
            </div>

            <!-- 이미지 업로드 -->
            <div class="form-group">
              <label class="form-label">
                이미지 첨부
                <span class="optional-text">(선택사항)</span>
              </label>
              
              <!-- 이미지 URL 입력 -->
              <div class="image-input-section">
                <div class="image-url-input">
                  <input
                    v-model="imageUrlInput"
                    type="url"
                    placeholder="이미지 URL을 입력하세요"
                    class="form-input"
                  />
                  <button
                    type="button"
                    @click="addImageUrl"
                    class="add-image-button"
                    :disabled="!imageUrlInput.trim()"
                  >
                    <i class="fas fa-plus"></i>
                    추가
                  </button>
                </div>
                <div class="image-help-text">
                  이미지 URL을 입력하여 공지사항에 이미지를 추가할 수 있습니다.
                </div>
              </div>

              <!-- 추가된 이미지 목록 -->
              <div v-if="formData.images.length > 0" class="added-images">
                <div class="images-header">
                  <span>추가된 이미지 ({{ formData.images.length }}개)</span>
                </div>
                <div class="images-grid">
                  <div
                    v-for="(image, index) in formData.images"
                    :key="index"
                    class="image-item"
                  >
                    <img
                      :src="image"
                      :alt="`이미지 ${index + 1}`"
                      class="preview-image"
                      @error="handleImageError($event, index)"
                    />
                    <button
                      type="button"
                      @click="removeImage(index)"
                      class="remove-image-button"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 미리보기 -->
            <div class="form-group">
              <label class="form-label">미리보기</label>
              <div class="preview-container">
                <div class="preview-header">
                  <span class="preview-category">{{ getPreviewCategory() }}</span>
                  <span class="preview-date">{{ getCurrentDate() }}</span>
                </div>
                <h3 class="preview-title">
                  {{ formData.title || '제목을 입력하세요' }}
                </h3>
                <div class="preview-content" v-html="getPreviewContent()"></div>
              </div>
            </div>

            <!-- 폼 액션 버튼 -->
            <div class="form-actions">
              <button type="button" @click="goBack" class="cancel-button">
                취소
              </button>
              <button
                type="submit"
                class="save-button"
                :disabled="!isFormValid || saving"
              >
                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ isEditMode ? '수정하기' : '작성하기' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavigationBar from 'src/core/components/NavigationBar.vue'
import { noticeService } from '@/features/notice/services/notice.service.js'

// 라우터 설정
const router = useRouter()
const route = useRoute()

// 반응형 상태
const loading = ref(false)
const saving = ref(false)
const imageUrlInput = ref('')

// 폼 데이터
const formData = reactive({
  title: '',
  content: '',
  images: []
})

// 에러 상태
const errors = reactive({
  title: '',
  content: ''
})

// 편집 모드 여부
const isEditMode = computed(() => {
  return route.name === 'NoticeEdit' || route.params.id
})

// 폼 유효성 검사
const isFormValid = computed(() => {
  return formData.title.trim().length > 0 && 
         formData.content.trim().length > 0 &&
         !errors.title && 
         !errors.content
})

// 메서드
const loadNoticeForEdit = async () => {
  if (!isEditMode.value) return
  
  try {
    loading.value = true
    const noticeId = parseInt(route.params.id)
    
    if (isNaN(noticeId)) {
      throw new Error('잘못된 공지사항 ID입니다.')
    }
    
    const response = await noticeService.getNoticeById(noticeId)
    
    if (response.isSuccess) {
      const notice = response.result
      formData.title = notice.title
      formData.content = notice.content
      formData.images = notice.images || []
      
      console.log('편집용 공지사항 로드 완료:', notice)
    } else {
      throw new Error(response.message || '공지사항을 불러올 수 없습니다.')
    }
  } catch (error) {
    console.error('공지사항 로드 실패:', error)
    alert(error.message || '공지사항을 불러오는데 실패했습니다.')
    goBack()
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  // 에러 초기화
  errors.title = ''
  errors.content = ''
  
  // 제목 검증
  if (!formData.title.trim()) {
    errors.title = '제목을 입력해주세요.'
  } else if (formData.title.length > 100) {
    errors.title = '제목은 100자를 초과할 수 없습니다.'
  }
  
  // 내용 검증
  if (!formData.content.trim()) {
    errors.content = '내용을 입력해주세요.'
  } else if (formData.content.length > 5000) {
    errors.content = '내용은 5000자를 초과할 수 없습니다.'
  }
  
  return !errors.title && !errors.content
}

const addImageUrl = () => {
  const url = imageUrlInput.value.trim()
  if (url && !formData.images.includes(url)) {
    formData.images.push(url)
    imageUrlInput.value = ''
  }
}

const removeImage = (index) => {
  formData.images.splice(index, 1)
}

const handleImageError = (event, index) => {
  console.warn(`이미지 로드 실패: ${formData.images[index]}`)
  event.target.style.opacity = '0.5'
  event.target.title = '이미지를 불러올 수 없습니다'
}

const saveNotice = async () => {
  if (!validateForm()) {
    return
  }
  
  try {
    saving.value = true
    
    const noticeData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      images: formData.images
    }
    
    let response
    if (isEditMode.value) {
      const noticeId = parseInt(route.params.id)
      response = await noticeService.updateNotice(noticeId, {
        title: noticeData.title,
        content: noticeData.content
      })
    } else {
      response = await noticeService.createNotice(noticeData)
    }
    
    if (response.isSuccess) {
      const message = isEditMode.value ? '공지사항이 수정되었습니다.' : '공지사항이 작성되었습니다.'
      alert(message)
      
      // 목록 페이지로 이동
      router.push('/notice')
    } else {
      throw new Error(response.message || '저장에 실패했습니다.')
    }
  } catch (error) {
    console.error('공지사항 저장 실패:', error)
    alert(error.message || '공지사항 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  if (isFormChanged()) {
    if (confirm('작성 중인 내용이 있습니다. 정말로 나가시겠습니까?')) {
      router.go(-1)
    }
  } else {
    router.go(-1)
  }
}

const isFormChanged = () => {
  return formData.title.trim() || formData.content.trim() || formData.images.length > 0
}

const getPreviewCategory = () => {
  return noticeService.getNoticeCategory(formData.title)
}

const getCurrentDate = () => {
  return noticeService.formatDate(new Date().toISOString())
}

const getPreviewContent = () => {
  if (!formData.content.trim()) {
    return '<p class="placeholder-text">내용을 입력하세요</p>'
  }
  
  return formData.content
    .replace(/\n/g, '<br>')
    .replace(/\r\n/g, '<br>')
}

// 라이프사이클
onMounted(() => {
  if (isEditMode.value) {
    loadNoticeForEdit()
  }
})

// 페이지 떠날 때 확인
window.addEventListener('beforeunload', (e) => {
  if (isFormChanged()) {
    e.preventDefault()
    e.returnValue = ''
  }
})
</script>

<style scoped>
.notice-write-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.main-content {
  padding-top: 80px;
  max-width: 900px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.notice-container {
  padding: 2rem 0;
}

/* 헤더 섹션 */
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

.back-button {
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.back-button:hover {
  background: #e5e7eb;
}

/* 로딩 상태 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
}

.loading-spinner i {
  font-size: 2rem;
  color: #667eea;
}

/* 폼 컨테이너 */
.notice-form-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.notice-form {
  max-width: none;
}

/* 폼 그룹 */
.form-group {
  margin-bottom: 2rem;
}

.form-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.char-count {
  font-weight: 400;
  color: #9ca3af;
  font-size: 0.85rem;
}

.optional-text {
  font-weight: 400;
  color: #9ca3af;
  font-size: 0.85rem;
}

/* 폼 입력 */
.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  font-family: inherit;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error,
.form-textarea.error {
  border-color: #ef4444;
}

.form-textarea {
  min-height: 400px;
  line-height: 1.6;
}

.error-message {
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

/* 이미지 섹션 */
.image-input-section {
  margin-bottom: 1rem;
}

.image-url-input {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.image-url-input .form-input {
  flex: 1;
}

.add-image-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.add-image-button:hover:not(:disabled) {
  background: #5a67d8;
}

.add-image-button:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.image-help-text {
  color: #6b7280;
  font-size: 0.85rem;
}

/* 추가된 이미지 */
.added-images {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.images-header {
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-button {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.remove-image-button:hover {
  background: #dc2626;
}

/* 미리보기 */
.preview-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: #f9fafb;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.preview-category {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #374151;
}

.preview-date {
  color: #9ca3af;
  font-size: 0.9rem;
}

.preview-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.preview-content {
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
}

.preview-content .placeholder-text {
  color: #9ca3af;
  font-style: italic;
}

/* 폼 액션 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-button,
.save-button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-button {
  background: #f3f4f6;
  color: #374151;
}

.cancel-button:hover {
  background: #e5e7eb;
}

.save-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a67d8, #6a4394);
  transform: translateY(-2px);
}

.save-button:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .notice-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1.5rem;
  }
  
  .notice-form-container {
    padding: 1.5rem;
  }
  
  .image-url-input {
    flex-direction: column;
  }
  
  .add-image-button {
    align-self: flex-start;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .cancel-button,
  .save-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .notice-container {
    padding: 1rem 0;
  }
  
  .notice-form-container {
    padding: 1rem;
  }
  
  .form-textarea {
    min-height: 300px;
  }
  
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .preview-title {
    font-size: 1.25rem;
  }
}
</style>
