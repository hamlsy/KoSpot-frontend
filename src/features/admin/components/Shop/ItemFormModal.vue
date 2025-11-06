<template>
  <div class="item-form-modal">
    <div class="modal-overlay" @click="cancel"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ isEdit ? '아이템 수정' : '새 아이템 추가' }}</h3>
        <button class="close-button" @click="cancel">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form @submit.prevent="save" class="modal-content">
        <div class="form-group">
          <label for="name">아이템 이름 *</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="아이템 이름을 입력하세요"
            required
            maxlength="50"
          />
          <div class="char-count">{{ formData.name.length }}/50</div>
        </div>

        <div class="form-group">
          <label for="description">설명 *</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="아이템 설명을 입력하세요"
            required
            maxlength="200"
            rows="3"
          ></textarea>
          <div class="char-count">{{ formData.description.length }}/200</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="price">가격 *</label>
            <div class="price-input-container">
              <input
                id="price"
                v-model.number="formData.price"
                type="number"
                placeholder="0"
                min="0"
                max="999999"
                required
              />
              <span class="currency-icon">
                <i class="fas fa-coins"></i>
              </span>
            </div>
          </div>

          <div class="form-group">
            <label for="quantity">수량</label>
            <input
              id="quantity"
              v-model.number="formData.quantity"
              type="number"
              placeholder="0"
              min="0"
              max="9999"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="itemType">아이템 타입 *</label>
          <select id="itemType" v-model="formData.itemTypeKey" required>
            <option value="">타입을 선택하세요</option>
            <option
              v-for="type in itemTypes"
              :key="type.key"
              :value="type.key"
            >
              {{ type.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="imageFile">이미지 파일 *</label>
          <div class="file-upload-section">
            <input
              id="imageFile"
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="file-input"
            />
            <label for="imageFile" class="file-input-label">
              <i class="fas fa-upload"></i>
              <span>{{ selectedFile ? selectedFile.name : '파일 선택' }}</span>
            </label>
            <button
              v-if="selectedFile"
              type="button"
              @click="removeFile"
              class="remove-file-btn"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div v-if="imagePreview" class="image-preview-container">
            <img :src="imagePreview" alt="미리보기" class="image-preview" />
          </div>
          
          <p class="file-hint">또는 이미지 URL을 사용할 수 있습니다</p>
          
          <div class="image-input-section">
            <input
              v-model="imageInput"
              type="url"
              placeholder="이미지 URL을 입력하세요"
              @keyup.enter="addImage"
            />
            <button type="button" @click="addImage" class="add-image-btn">
              <i class="fas fa-plus"></i>
              추가
            </button>
          </div>
          
          <div v-if="formData.images.length > 0" class="image-list">
            <div
              v-for="(image, index) in formData.images"
              :key="index"
              class="image-item"
            >
              <img :src="image" :alt="`이미지 ${index + 1}`" />
              <button
                type="button"
                @click="removeImage(index)"
                class="remove-image-btn"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="cancel" class="cancel-btn">
            취소
          </button>
          <button
            type="submit"
            :disabled="!isFormValid"
            class="save-btn"
          >
            {{ isEdit ? '수정하기' : '추가하기' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    default: null
  },
  itemTypes: {
    type: Array,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel'])

// 폼 데이터
const formData = reactive({
  name: '',
  description: '',
  price: 0,
  quantity: 0,
  itemTypeKey: '',
  images: []
})

// 이미지 입력
const imageInput = ref('')
const selectedFile = ref(null)
const imagePreview = ref(null)
const fileInput = ref(null)

// 편집 모드일 때 기존 데이터 로드
watch(() => props.item, (newItem) => {
  if (newItem && props.isEdit) {
    formData.name = newItem.name || ''
    formData.description = newItem.description || ''
    formData.price = newItem.price || 0
    formData.quantity = newItem.stock || 0
    formData.itemTypeKey = newItem.itemTypeKey || ''
    formData.images = newItem.images ? [...newItem.images] : (newItem.imageUrl ? [newItem.imageUrl] : [])
    selectedFile.value = null
    imagePreview.value = newItem.imageUrl || null
  } else {
    // 새 아이템일 때 초기화
    resetForm()
  }
}, { immediate: true })

// 폼 유효성 검사
const isFormValid = computed(() => {
  return formData.name.trim().length > 0 &&
         formData.description.trim().length > 0 &&
         formData.price >= 0 &&
         formData.itemTypeKey.length > 0 &&
         (selectedFile.value || formData.images.length > 0 || props.isEdit) // 수정 모드에서는 이미지 필수 아님
})

// 메서드들
const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formData.price = 0
  formData.quantity = 0
  formData.itemTypeKey = ''
  formData.images = []
  imageInput.value = ''
  selectedFile.value = null
  imagePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }
    
    selectedFile.value = file
    
    // 미리보기 생성
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeFile = () => {
  selectedFile.value = null
  imagePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const addImage = () => {
  const url = imageInput.value.trim()
  if (url && !formData.images.includes(url)) {
    formData.images.push(url)
    imageInput.value = ''
  }
}

const removeImage = (index) => {
  formData.images.splice(index, 1)
}

const save = () => {
  if (isFormValid.value) {
    emit('save', { 
      ...formData,
      imageFile: selectedFile.value 
    })
  }
}

const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.item-form-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: zoomIn 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.char-count {
  font-size: 0.8rem;
  color: #6b7280;
  text-align: right;
  margin-top: 0.25rem;
}

.price-input-container {
  position: relative;
}

.currency-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #fbbf24;
  pointer-events: none;
}

.price-input-container input {
  padding-right: 2.5rem;
}

.file-upload-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}

.file-input {
  display: none;
}

.file-input-label {
  flex: 1;
  padding: 0.75rem;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  background: #f9fafb;
  color: #6b7280;
  font-weight: 500;
}

.file-input-label:hover {
  border-color: #667eea;
  background: #f3f4f6;
  color: #667eea;
}

.remove-file-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-file-btn:hover {
  background: #dc2626;
}

.image-preview-container {
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.image-preview {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.file-hint {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.image-input-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  margin-top: 0.5rem;
}

.image-input-section input {
  flex: 1;
}

.add-image-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  white-space: nowrap;
}

.add-image-btn:hover {
  background: #5a67d8;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
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
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.remove-image-btn:hover {
  background: #dc2626;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a67d8, #6a4394);
  transform: translateY(-2px);
}

.save-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .image-input-section {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .cancel-btn,
  .save-btn {
    width: 100%;
  }
}
</style>
