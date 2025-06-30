<template>
  <div class="roadview-manager">
    <div class="header-section">
      <h2 class="section-title">🛣️ 로드뷰 모드 관리</h2>
      <p class="section-description">로드뷰 게임에 사용될 좌표를 추가하고 관리할 수 있습니다.</p>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <button 
        @click="activeTab = 'add'"
        :class="{ active: activeTab === 'add' }"
        class="tab-btn"
      >
        <i class="fas fa-plus"></i>
        좌표 추가
      </button>
      <button 
        @click="activeTab = 'bulk'"
        :class="{ active: activeTab === 'bulk' }"
        class="tab-btn"
      >
        <i class="fas fa-file-excel"></i>
        엑셀 업로드
      </button>
      <button 
        @click="activeTab = 'list'"
        :class="{ active: activeTab === 'list' }"
        class="tab-btn"
      >
        <i class="fas fa-list"></i>
        좌표 목록
      </button>
    </div>

    <!-- 좌표 개별 추가 -->
    <div v-if="activeTab === 'add'" class="add-section">
      <div class="form-container">
        <div class="form-row">
          <div class="form-group">
            <label>위도 (Latitude)</label>
            <input 
              v-model="newLocation.lat" 
              type="number" 
              step="any"
              placeholder="예: 37.5665"
              @blur="fetchAddressFromCoords"
            />
          </div>
          <div class="form-group">
            <label>경도 (Longitude)</label>
            <input 
              v-model="newLocation.lng" 
              type="number" 
              step="any"
              placeholder="예: 126.9780"
              @blur="fetchAddressFromCoords"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>장소명 (POI Name)</label>
            <input 
              v-model="newLocation.poi_name" 
              type="text" 
              placeholder="예: 경복궁"
            />
          </div>
          <div class="form-group">
            <label>위치 타입</label>
            <select v-model="newLocation.location_type">
              <option value="">타입 선택</option>
              <option value="tourist">관광지</option>
              <option value="landmark">랜드마크</option>
              <option value="nature">자연경관</option>
              <option value="cultural">문화시설</option>
              <option value="commercial">상업지역</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>상세주소</label>
            <input 
              v-model="newLocation.detail_address" 
              type="text" 
              placeholder="카카오맵 API에서 자동 입력됩니다"
              readonly
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>시도</label>
            <input 
              v-model="newLocation.sido" 
              type="text" 
              placeholder="자동 입력됩니다"
              readonly
            />
          </div>
          <div class="form-group">
            <label>시군구</label>
            <input 
              v-model="newLocation.sigungu" 
              type="text" 
              placeholder="자동 입력됩니다"
              readonly
            />
          </div>
        </div>

        <!-- 미리보기 -->
        <div class="preview-section">
          <h3>로드뷰 미리보기</h3>
          <div id="roadview-preview" class="roadview-container">
            <div v-if="!roadviewAvailable" class="no-roadview">
              로드뷰를 사용할 수 없는 위치입니다
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            @click="addLocation" 
            :disabled="!canAddLocation || loading"
            class="add-btn"
          >
            <i class="fas fa-plus"></i>
            좌표 추가
          </button>
          <button @click="resetForm" class="reset-btn">
            <i class="fas fa-undo"></i>
            초기화
          </button>
        </div>
      </div>
    </div>

    <!-- 엑셀 업로드 -->
    <div v-if="activeTab === 'bulk'" class="bulk-section">
      <div class="upload-container">
        <div class="upload-info">
          <h3>엑셀 파일 업로드</h3>
          <p>다음 컬럼을 포함한 엑셀 파일을 업로드하세요:</p>
          <div class="column-info">
            <span class="column">lat</span>
            <span class="column">lng</span>
            <span class="column">detail_address</span>
            <span class="column">poi_name</span>
            <span class="column">sigungu</span>
            <span class="column">location_type</span>
            <span class="column">sido</span>
          </div>
        </div>

        <div class="upload-area" @drop="handleFileDrop" @dragover.prevent>
          <input 
            ref="fileInput" 
            type="file" 
            accept=".xlsx,.xls" 
            @change="handleFileSelect"
            style="display: none"
          />
          <div class="upload-content" @click="$refs.fileInput.click()">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>엑셀 파일을 드래그하거나 클릭하여 업로드</p>
            <span class="file-types">지원 형식: .xlsx, .xls</span>
          </div>
        </div>

        <div v-if="uploadedFile" class="file-info">
          <div class="file-details">
            <i class="fas fa-file-excel"></i>
            <span>{{ uploadedFile.name }}</span>
            <button @click="uploadedFile = null" class="remove-file">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <button @click="uploadExcel" :disabled="loading" class="upload-btn">
            <i class="fas fa-upload"></i>
            엑셀 업로드
          </button>
        </div>
      </div>
    </div>

    <!-- 좌표 목록 -->
    <div v-if="activeTab === 'list'" class="list-section">
      <div class="list-controls">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="장소명 또는 주소로 검색..."
          class="search-input"
        />
        <select v-model="filterType" class="filter-select">
          <option value="">모든 타입</option>
          <option value="tourist">관광지</option>
          <option value="landmark">랜드마크</option>
          <option value="nature">자연경관</option>
          <option value="cultural">문화시설</option>
          <option value="commercial">상업지역</option>
        </select>
      </div>

      <div class="locations-table">
        <div class="table-header">
          <div class="col-name">장소명</div>
          <div class="col-address">주소</div>
          <div class="col-type">타입</div>
          <div class="col-coords">좌표</div>
          <div class="col-actions">작업</div>
        </div>
        <div class="table-body">
          <div 
            v-for="location in filteredLocations" 
            :key="location.id"
            class="table-row"
          >
            <div class="col-name">{{ location.poi_name }}</div>
            <div class="col-address">{{ location.detail_address }}</div>
            <div class="col-type">
              <span class="type-badge" :class="location.location_type">
                {{ getTypeLabel(location.location_type) }}
              </span>
            </div>
            <div class="col-coords">
              {{ location.lat.toFixed(6) }}, {{ location.lng.toFixed(6) }}
            </div>
            <div class="col-actions">
              <button @click="editLocation(location)" class="edit-btn">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="deleteLocation(location.id)" class="delete-btn">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>처리 중...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import apiClient from '@/core/api/apiClient.js'

const activeTab = ref('add')
const loading = ref(false)
const roadviewAvailable = ref(false)
const uploadedFile = ref(null)

// 새 좌표 데이터
const newLocation = reactive({
  lat: '',
  lng: '',
  detail_address: '',
  poi_name: '',
  sigungu: '',
  location_type: '',
  sido: ''
})

// 좌표 목록 관련
const locations = ref([])
const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// 좌표 추가 가능 여부
const canAddLocation = computed(() => {
  return newLocation.lat && 
         newLocation.lng && 
         newLocation.poi_name && 
         newLocation.location_type
})

// 필터링된 좌표 목록
const filteredLocations = computed(() => {
  let filtered = locations.value

  if (searchQuery.value) {
    filtered = filtered.filter(loc => 
      loc.poi_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      loc.detail_address.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (filterType.value) {
    filtered = filtered.filter(loc => loc.location_type === filterType.value)
  }

  const start = (currentPage.value - 1) * itemsPerPage
  return filtered.slice(start, start + itemsPerPage)
})

// 총 페이지 수
const totalPages = computed(() => {
  const total = locations.value.length
  return Math.ceil(total / itemsPerPage)
})

// 카카오맵 API로 주소 정보 가져오기
const fetchAddressFromCoords = async () => {
  if (!newLocation.lat || !newLocation.lng) return

  try {
    // 카카오맵 좌표→주소 변환 API 호출
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${newLocation.lng}&y=${newLocation.lat}`,
      {
        headers: {
          'Authorization': `KakaoAK ${process.env.VUE_APP_KAKAO_REST_API_KEY}`
        }
      }
    )
    
    const data = await response.json()
    
    if (data.documents && data.documents.length > 0) {
      const address = data.documents[0].address
      newLocation.detail_address = address.address_name
      newLocation.sido = address.region_1depth_name
      newLocation.sigungu = address.region_2depth_name
    }
  } catch (error) {
    console.error('주소 정보 가져오기 실패:', error)
  }

  // 로드뷰 가용성 확인
  checkRoadviewAvailability()
}

// 로드뷰 가용성 확인
const checkRoadviewAvailability = () => {
  if (!window.kakao || !window.kakao.maps) return

  nextTick(() => {
    const container = document.getElementById('roadview-preview')
    const position = new kakao.maps.LatLng(newLocation.lat, newLocation.lng)
    
    const roadviewClient = new kakao.maps.RoadviewClient()
    roadviewClient.getNearestPanoId(position, 100, (panoId) => {
      if (panoId) {
        roadviewAvailable.value = true
        
        const roadview = new kakao.maps.Roadview(container)
        roadview.setPanoId(panoId, position)
      } else {
        roadviewAvailable.value = false
      }
    })
  })
}

// 좌표 추가
const addLocation = async () => {
  try {
    loading.value = true
    
    const response = await apiClient.post('/admin/roadview/locations', newLocation)
    
    if (response.data.isSuccess) {
      console.log('좌표가 성공적으로 추가되었습니다.')
      resetForm()
      loadLocations()
    }
  } catch (error) {
    console.error('좌표 추가 실패:', error)
  } finally {
    loading.value = false
  }
}

// 폼 초기화
const resetForm = () => {
  Object.assign(newLocation, {
    lat: '',
    lng: '',
    detail_address: '',
    poi_name: '',
    sigungu: '',
    location_type: '',
    sido: ''
  })
  roadviewAvailable.value = false
}

// 파일 드롭 처리
const handleFileDrop = (e) => {
  e.preventDefault()
  const files = e.dataTransfer.files
  if (files.length > 0) {
    uploadedFile.value = files[0]
  }
}

// 파일 선택 처리
const handleFileSelect = (e) => {
  uploadedFile.value = e.target.files[0]
}

// 엑셀 업로드
const uploadExcel = async () => {
  if (!uploadedFile.value) return

  try {
    loading.value = true
    
    const formData = new FormData()
    formData.append('file', uploadedFile.value)
    
    const response = await apiClient.post('/admin/roadview/locations/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (response.data.isSuccess) {
      console.log('엑셀 파일이 성공적으로 업로드되었습니다.')
      uploadedFile.value = null
      loadLocations()
    }
  } catch (error) {
    console.error('엑셀 업로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// 좌표 목록 로드
const loadLocations = async () => {
  try {
    const response = await apiClient.get('/admin/roadview/locations')
    
    if (response.data.isSuccess) {
      locations.value = response.data.result
    }
  } catch (error) {
    console.error('좌표 목록 로드 실패:', error)
  }
}

// 좌표 수정
const editLocation = (location) => {
  Object.assign(newLocation, location)
  activeTab.value = 'add'
}

// 좌표 삭제
const deleteLocation = async (id) => {
  if (!confirm('정말로 이 좌표를 삭제하시겠습니까?')) return

  try {
    loading.value = true
    
    const response = await apiClient.delete(`/admin/roadview/locations/${id}`)
    
    if (response.data.isSuccess) {
      console.log('좌표가 삭제되었습니다.')
      loadLocations()
    }
  } catch (error) {
    console.error('좌표 삭제 실패:', error)
  } finally {
    loading.value = false
  }
}

// 타입 라벨 가져오기
const getTypeLabel = (type) => {
  const labels = {
    tourist: '관광지',
    landmark: '랜드마크',
    nature: '자연경관',
    cultural: '문화시설',
    commercial: '상업지역'
  }
  return labels[type] || type
}

onMounted(() => {
  loadLocations()
})
</script>

<style scoped>
.roadview-manager {
  position: relative;
}

.header-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #6b7280;
  font-size: 0.95rem;
}

.tab-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #6b7280;
}

.tab-btn:hover {
  color: #4f46e5;
}

.tab-btn.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.form-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #e5e7eb;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input[readonly] {
  background-color: #f9fafb;
  color: #6b7280;
}

.preview-section {
  margin: 2rem 0;
}

.preview-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.roadview-container {
  width: 100%;
  height: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-roadview {
  color: #6b7280;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.add-btn,
.reset-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-btn {
  background: #10b981;
  color: white;
}

.add-btn:hover:not(:disabled) {
  background: #059669;
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-btn {
  background: #6b7280;
  color: white;
}

.reset-btn:hover {
  background: #4b5563;
}

.upload-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #e5e7eb;
}

.upload-info {
  margin-bottom: 2rem;
}

.upload-info h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.column-info {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.column {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #374151;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.upload-area:hover {
  border-color: #4f46e5;
  background-color: #f8fafc;
}

.upload-content i {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.upload-content p {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.file-types {
  color: #6b7280;
  font-size: 0.9rem;
}

.file-info {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-file {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
}

.upload-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.upload-btn:hover:not(:disabled) {
  background: #4338ca;
}

.list-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-input {
  flex: 1;
}

.filter-select {
  min-width: 150px;
}

.locations-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr 2fr 1fr;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
}

.table-header {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.table-row {
  border-bottom: 1px solid #f3f4f6;
}

.table-row:hover {
  background: #f8fafc;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.type-badge.tourist {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.landmark {
  background: #fef3c7;
  color: #92400e;
}

.type-badge.nature {
  background: #d1fae5;
  color: #065f46;
}

.type-badge.cultural {
  background: #e0e7ff;
  color: #3730a3;
}

.type-badge.commercial {
  background: #fce7f3;
  color: #be185d;
}

.edit-btn,
.delete-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 0.5rem;
}

.edit-btn {
  background: #3b82f6;
  color: white;
}

.edit-btn:hover {
  background: #2563eb;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.page-btn {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 500;
  color: #374151;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.loading-spinner i {
  font-size: 2rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .list-controls {
    flex-direction: column;
  }
}
</style> 