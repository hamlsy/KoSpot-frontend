<template>
  <div class="notice-write-page">
    <NavigationBar 
      :is-logged-in="hasToken"
      :user-info="userProfile"
    />
    
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

            <!-- 내용 입력 (마크다운 에디터) -->
            <div class="form-group">
              <label for="content" class="form-label">
                내용 *
                <span class="char-count">{{ formData.content.length }}/5000</span>
              </label>
              
              <!-- 마크다운 에디터 탭 -->
              <div class="markdown-editor-wrapper">
                <div class="editor-tabs">
                  <button
                    type="button"
                    class="tab-button"
                    :class="{ active: editorMode === 'edit' }"
                    @click="editorMode = 'edit'"
                  >
                    <i class="fas fa-edit"></i>
                    작성
                  </button>
                  <button
                    type="button"
                    class="tab-button"
                    :class="{ active: editorMode === 'preview' }"
                    @click="editorMode = 'preview'"
                  >
                    <i class="fas fa-eye"></i>
                    미리보기
                  </button>
                </div>
                
                <!-- 에디터 영역 -->
                <div v-show="editorMode === 'edit'" class="editor-area">
                  <textarea
                    ref="textareaRef"
                    id="content"
                    v-model="formData.content"
                    class="markdown-textarea"
                    :class="{ 'error': errors.content }"
                    placeholder="마크다운 문법으로 작성하세요&#10;&#10;예시:&#10;# 제목&#10;## 부제목&#10;**굵게** *기울임*&#10;- 목록 항목&#10;1. 번호 목록&#10;&#10;[링크 텍스트](URL)&#10;![이미지 설명](이미지URL)"
                    rows="20"
                    maxlength="5000"
                    required
                  ></textarea>
                </div>
                
                <!-- 미리보기 영역 -->
                <div v-show="editorMode === 'preview'" class="preview-area">
                  <div 
                    class="markdown-preview"
                    v-html="renderedMarkdown"
                  ></div>
                </div>
              </div>
              
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
              
              <!-- 드래그앤드롭 영역 -->
              <div 
                class="image-upload-area"
                :class="{ 'dragging': false, 'uploading': uploading }"
                @dragover.prevent="handleDragOver"
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="handleDrop"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  @change="handleFileSelect"
                  class="file-input-hidden"
                  :disabled="uploading"
                />
                
                <div 
                  v-if="!uploading"
                  class="upload-content"
                  @click="$refs.fileInput?.click()"
                >
                  <i class="fas fa-cloud-upload-alt upload-icon"></i>
                  <p class="upload-text">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <span class="upload-hint">
                    지원 형식: JPG, PNG, GIF, WebP
                  </span>
                </div>
                
                <div v-else class="upload-loading">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>이미지 업로드 중...</p>
                </div>
              </div>
              
              <!-- 업로드 에러 메시지 -->
              <div v-if="uploadError" class="upload-error">
                <i class="fas fa-exclamation-circle"></i>
                {{ uploadError }}
              </div>
              
              <div class="image-help-text">
                이미지를 업로드하면 마크다운 형식으로 자동 삽입됩니다.
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
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavigationBar from 'src/core/components/NavigationBar.vue'
import { noticeService } from '@/features/notice/services/notice.service.js'
import { mainService } from '@/features/main/services/main.service.js'
import { marked } from 'marked'

// 라우터 설정
const router = useRouter()
const route = useRoute()

// 반응형 상태
const loading = ref(false)
const saving = ref(false)
const editorMode = ref('edit') // 'edit' or 'preview'
const textareaRef = ref(null)

// 사용자 프로필 및 인증 상태
const hasToken = computed(() => !!localStorage.getItem('accessToken'))
const userProfile = ref({
  name: "",
  email: "",
  avatar: null,
  isAdmin: false
})

// 메인 페이지 데이터 로드하여 관리자 여부 확인
const loadUserProfileFromMain = async () => {
  try {
    const response = await mainService.getMainPageData()
    
    if (response.isSuccess && response.result) {
      userProfile.value.isAdmin = response.result.myInfo?.isAdmin || false
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
  }
}

// 폼 데이터
const formData = reactive({
  title: '',
  content: '' // 마크다운 형식
})

// 이미지 업로드 상태
const uploading = ref(false)
const uploadError = ref('')

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

// 마크다운 렌더링
const renderedMarkdown = computed(() => {
  if (!formData.content.trim()) {
    return '<p class="placeholder-text">내용을 입력하세요</p>'
  }
  
  try {
    return marked(formData.content)
  } catch (error) {
    console.error('마크다운 파싱 오류:', error)
    return '<p class="error-text">마크다운을 렌더링하는 중 오류가 발생했습니다.</p>'
  }
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
    
    // 수정용 마크다운 API 호출 (GET /notice/{id}/markdown)
    const response = await noticeService.getNoticeMarkdown(noticeId)
    
    if (response.isSuccess) {
      const notice = response.result
      formData.title = notice.title
      // 백엔드에서 markdownContent 필드로 마크다운 원본 반환
      formData.content = notice.markdownContent || ''
      
      console.log('편집용 공지사항 마크다운 로드 완료:', notice)
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

// 텍스트 영역에 마크다운 삽입
const insertMarkdown = (text) => {
  const textarea = textareaRef.value
  if (!textarea) {
    // 텍스트 영역이 없으면 끝에 추가
    formData.content += '\n' + text
    return
  }
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const content = formData.content
  const before = content.substring(0, start)
  const after = content.substring(end)
  
  // 커서 위치에 삽입, 커서가 없으면 끝에 추가
  const newContent = before + (start === end ? text : text) + after
  formData.content = newContent
  
  // 커서 위치 조정 (삽입된 텍스트 뒤로)
  setTimeout(() => {
    const newCursorPos = start + text.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
  }, 0)
}

// 파일 선택 핸들러
const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return
  
  // 첫 번째 파일만 처리 (단일 업로드)
  await uploadImage(files[0])
  
  // input 초기화 (같은 파일을 다시 선택할 수 있도록)
  event.target.value = ''
}

// 드래그앤드롭 핸들러
const handleDragOver = (event) => {
  event.preventDefault()
  event.stopPropagation()
  event.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = (event) => {
  event.preventDefault()
  event.stopPropagation()
}

const handleDrop = async (event) => {
  event.preventDefault()
  event.stopPropagation()
  
  const files = Array.from(event.dataTransfer.files || [])
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length === 0) {
    uploadError.value = '이미지 파일만 업로드할 수 있습니다.'
    setTimeout(() => { uploadError.value = '' }, 3000)
    return
  }
  
  // 첫 번째 이미지만 처리
  await uploadImage(imageFiles[0])
}

// 이미지 업로드
const uploadImage = async (file) => {
  if (!file || !file.type.startsWith('image/')) {
    uploadError.value = '이미지 파일만 업로드할 수 있습니다.'
    setTimeout(() => { uploadError.value = '' }, 3000)
    return
  }
  
  try {
    uploading.value = true
    uploadError.value = ''
    
    const response = await noticeService.uploadNoticeImage(file)
    
    if (response.isSuccess && response.result) {
      const imageUrl = response.result.url
      // 마크다운 형식으로 삽입: ![](url)
      const markdownImage = `![${file.name}](${imageUrl})`
      insertMarkdown(markdownImage)
    } else {
      throw new Error(response.message || '이미지 업로드에 실패했습니다.')
    }
  } catch (error) {
    console.error('이미지 업로드 실패:', error)
    uploadError.value = error.message || '이미지 업로드에 실패했습니다.'
    setTimeout(() => { uploadError.value = '' }, 5000)
  } finally {
    uploading.value = false
  }
}

const saveNotice = async () => {
  if (!validateForm()) {
    return
  }
  
  try {
    saving.value = true
    
    const noticeData = {
      title: formData.title.trim(),
      contentMd: formData.content.trim() // contentMd로 전송
    }
    
    let response
    if (isEditMode.value) {
      const noticeId = parseInt(route.params.id)
      response = await noticeService.updateNotice(noticeId, noticeData)
    } else {
      response = await noticeService.createNotice(noticeData)
    }
    
    if (response.isSuccess) {
      const message = isEditMode.value ? '공지사항이 수정되었습니다.' : '공지사항이 작성되었습니다.'
      alert(message)
      
      // 목록 페이지로 이동 (라우트 이름 사용)
      router.push({ name: 'NoticeListView' })
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
  return formData.title.trim() || formData.content.trim()
}

// 라이프사이클
onMounted(() => {
  if (isEditMode.value) {
    loadNoticeForEdit()
  }
  if (hasToken.value) {
    loadUserProfileFromMain()
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
  background-color: var(--color-background);
  transition: background-color var(--transition-slow);
}

.main-content {
  padding-top: 80px;
  max-width: 1400px;
  margin: 0 auto;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

.notice-container {
  padding: var(--spacing-2xl) 0;
}

/* 헤더 섹션 */
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--spacing-2xl);
  gap: var(--spacing-lg);
}

.header-content h1 {
  font-family: var(--font-heading);
  font-size: var(--font-size-display);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  letter-spacing: -0.02em;
}

.page-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
  margin: 0;
}

.back-button {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.back-button:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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
  color: var(--color-text-secondary);
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--color-primary);
}

/* 폼 컨테이너 */
.notice-form-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.notice-form-container:hover {
  box-shadow: var(--shadow-md);
}

.notice-form {
  max-width: none;
}

/* 폼 그룹 */
.form-group {
  margin-bottom: var(--spacing-2xl);
}

.form-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-body);
}

.char-count {
  font-weight: 400;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-small);
}

.optional-text {
  font-weight: 400;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-small);
}

/* 폼 입력 */
.form-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  transition: all var(--transition-normal);
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.form-input.error {
  border-color: var(--color-error);
}

.error-message {
  color: var(--color-error);
  font-size: var(--font-size-small);
  margin-top: var(--spacing-sm);
}

/* 마크다운 에디터 */
.markdown-editor-wrapper {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.editor-tabs {
  display: flex;
  background: var(--color-surface-hover);
  border-bottom: 1px solid var(--color-border);
}

.tab-button {
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.tab-button:hover {
  color: var(--color-text-primary);
  background: var(--color-surface);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background: var(--color-surface);
}

.tab-button i {
  font-size: var(--font-size-small);
}

.editor-area,
.preview-area {
  min-height: 500px;
  padding: var(--spacing-lg);
}

.markdown-textarea {
  width: 100%;
  min-height: 500px;
  padding: var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-body);
  font-family: var(--font-mono);
  line-height: var(--line-height-relaxed);
  resize: vertical;
  background: var(--color-surface);
  color: var(--color-text-primary);
  transition: all var(--transition-normal);
}

.markdown-textarea:focus {
  outline: none;
  background: var(--color-surface-hover);
}

.markdown-textarea.error {
  border: 1px solid var(--color-error);
}

.markdown-preview {
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  font-size: var(--font-size-body);
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3),
.markdown-preview :deep(h4),
.markdown-preview :deep(h5),
.markdown-preview :deep(h6) {
  font-family: var(--font-heading);
  font-weight: 600;
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.markdown-preview :deep(h1) {
  font-size: var(--font-size-h1);
  border-bottom: 2px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}

.markdown-preview :deep(h2) {
  font-size: var(--font-size-h2);
}

.markdown-preview :deep(h3) {
  font-size: var(--font-size-h3);
}

.markdown-preview :deep(p) {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-left: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
}

.markdown-preview :deep(li) {
  margin-bottom: var(--spacing-sm);
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid var(--color-primary);
  padding-left: var(--spacing-md);
  margin: var(--spacing-md) 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

.markdown-preview :deep(code) {
  background: var(--color-surface-hover);
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--color-primary);
}

.markdown-preview :deep(pre) {
  background: var(--color-surface-hover);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--spacing-md) 0;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--color-text-primary);
}

.markdown-preview :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all var(--transition-normal);
}

.markdown-preview :deep(a:hover) {
  border-bottom-color: var(--color-primary);
}

.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  margin: var(--spacing-md) 0;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--spacing-xl) 0;
}

.markdown-preview .placeholder-text {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.markdown-preview .error-text {
  color: var(--color-error);
}

/* 이미지 업로드 섹션 */
.image-upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-2xl);
  background: var(--color-surface-hover);
  transition: all var(--transition-normal);
  cursor: pointer;
  position: relative;
  margin-bottom: var(--spacing-md);
}

.image-upload-area:hover {
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.image-upload-area.dragging {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.image-upload-area.uploading {
  cursor: wait;
  opacity: 0.7;
}

.file-input-hidden {
  display: none;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  text-align: center;
}

.upload-icon {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.upload-text {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.upload-hint {
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.upload-loading i {
  font-size: 2rem;
  color: var(--color-primary);
}

.upload-loading p {
  margin: 0;
  font-size: var(--font-size-body);
}

.upload-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  color: var(--color-error);
  font-size: var(--font-size-small);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.upload-error i {
  font-size: 1rem;
}

.image-help-text {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-small);
}

/* 폼 액션 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-2xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

.cancel-button,
.save-button {
  padding: var(--spacing-md) var(--spacing-2xl);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  box-shadow: var(--shadow-sm);
}

.cancel-button {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.cancel-button:hover {
  background: var(--color-surface-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.save-button {
  background: var(--color-primary);
  color: white;
}

.save-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.save-button:disabled {
  background: var(--color-border-dark);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }
  
  .notice-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-lg);
  }
  
  .notice-form-container {
    padding: var(--spacing-lg);
  }
  
  .editor-area,
  .preview-area {
    min-height: 400px;
    padding: var(--spacing-md);
  }
  
  .markdown-textarea {
    min-height: 400px;
  }
  
  .image-upload-area {
    padding: var(--spacing-lg);
  }
  
  .upload-icon {
    font-size: 2rem;
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
    padding: var(--spacing-md) 0;
  }
  
  .notice-form-container {
    padding: var(--spacing-md);
  }
  
  .editor-area,
  .preview-area {
    min-height: 300px;
    padding: var(--spacing-sm);
  }
  
  .markdown-textarea {
    min-height: 300px;
    font-size: var(--font-size-small);
  }
  
  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>
