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
            />
          </div>
          <div class="form-group">
            <label>경도 (Longitude)</label>
            <input 
              v-model="newLocation.lng" 
              type="number" 
              step="any"
              placeholder="예: 126.9780"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>장소명 (POI Name)</label>
            <input 
              v-model="newLocation.poiName" 
              type="text" 
              placeholder="예: 경복궁"
            />
          </div>
          <div class="form-group">
            <label>위치 타입</label>
            <select v-model="newLocation.locationType">
              <option value="">타입 선택</option>
              <option value="TOURIST">관광지</option>
              <option value="LANDMARK">랜드마크</option>
              <option value="NATURE">자연경관</option>
              <option value="CULTURAL">문화시설</option>
              <option value="COMMERCIAL">상업지역</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>상세주소</label>
            <input 
              v-model="newLocation.detailAddress" 
              type="text" 
              placeholder="카카오맵 API에서 자동 입력됩니다"
              readonly
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>시도 키</label>
            <input 
              v-model="newLocation.sidoKey" 
              type="text" 
              placeholder="예: SEOUL (자동 입력됩니다)"
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
          <p class="info-description">다음 형식의 엑셀 파일을 업로드하세요:</p>
          
          <!-- 엑셀 형식 안내 표 -->
          <div class="excel-format-table">
            <h4 class="table-title">
              <i class="fas fa-table"></i>
              엑셀 파일 형식
            </h4>
            <div class="table-wrapper">
              <table class="format-table">
                <thead>
                  <tr>
                    <th>CTPR_NM<br><span class="th-desc">시도명</span></th>
                    <th>SIGNGU_NM<br><span class="th-desc">시군구명</span></th>
                    <th>EMD_NM<br><span class="th-desc">읍면동명</span></th>
                    <th>LI_NM<br><span class="th-desc">리명</span></th>
                    <th>LC_LO<br><span class="th-desc">경도</span></th>
                    <th>LC_LA<br><span class="th-desc">위도</span></th>
                    <th>POI_NM<br><span class="th-desc">POI 이름</span></th>
                    <th>CL_NM<br><span class="th-desc">분류명</span></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>서울특별시</td>
                    <td>종로구</td>
                    <td>삼청동</td>
                    <td class="empty-cell">-</td>
                    <td>126.98165850000</td>
                    <td>37.58775478000</td>
                    <td>삼청동길</td>
                    <td>일반관광지</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="table-note">
              <i class="fas fa-info-circle"></i>
              <span>LI_NM 컬럼은 선택사항이며 비워둘 수 있습니다.</span>
            </div>
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
          <option value="TOURIST">관광지</option>
          <option value="LANDMARK">랜드마크</option>
          <option value="NATURE">자연경관</option>
          <option value="CULTURAL">문화시설</option>
          <option value="COMMERCIAL">상업지역</option>
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
            <div class="col-name">{{ location.poiName }}</div>
            <div class="col-address">{{ location.detailAddress }}</div>
            <div class="col-type">
              <span class="type-badge" :class="location.locationType.toLowerCase()">
                {{ getTypeLabel(location.locationType) }}
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
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { coordinateAdminService } from '@/features/admin/services/coordinateAdmin.service.js'

const activeTab = ref('add')
const loading = ref(false)
const roadviewAvailable = ref(false)
const uploadedFile = ref(null)
const roadviewInstance = ref(null) // 로드뷰 인스턴스 저장

// 새 좌표 데이터
const newLocation = reactive({
  lat: '',
  lng: '',
  detailAddress: '',
  poiName: '',
  sigungu: '',
  locationType: '',
  sidoKey: ''
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
         newLocation.poiName && 
         newLocation.locationType &&
         newLocation.sidoKey &&
         newLocation.sigungu &&
         newLocation.detailAddress
})

// 좌표 변경 감지하여 자동으로 주소 조회 및 로드뷰 미리보기 업데이트
watch([() => newLocation.lat, () => newLocation.lng], ([newLat, newLng], [oldLat, oldLng]) => {
  // 좌표가 변경되고 유효한 숫자인 경우에만 실행
  if (newLat && newLng && 
      (newLat !== oldLat || newLng !== oldLng) &&
      !isNaN(parseFloat(newLat)) && !isNaN(parseFloat(newLng))) {
    // 디바운싱: 500ms 후 실행
    clearTimeout(window.coordWatchTimeout)
    window.coordWatchTimeout = setTimeout(() => {
      fetchAddressFromCoords()
    }, 500)
  }
})

// 필터링된 좌표 목록
const filteredLocations = computed(() => {
  let filtered = locations.value

  if (searchQuery.value) {
    filtered = filtered.filter(loc => 
      loc.poiName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      loc.detailAddress.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (filterType.value) {
    filtered = filtered.filter(loc => loc.locationType === filterType.value)
  }

  const start = (currentPage.value - 1) * itemsPerPage
  return filtered.slice(start, start + itemsPerPage)
})

// 총 페이지 수
const totalPages = computed(() => {
  const total = locations.value.length
  return Math.ceil(total / itemsPerPage)
})

// 시도명을 시도 키로 변환하는 헬퍼 함수
const convertSidoNameToKey = (sidoName) => {
  const sidoMap = {
    '서울특별시': 'SEOUL',
    '부산광역시': 'BUSAN',
    '대구광역시': 'DAEGU',
    '인천광역시': 'INCHEON',
    '광주광역시': 'GWANGJU',
    '대전광역시': 'DAEJEON',
    '울산광역시': 'ULSAN',
    '세종특별자치시': 'SEJONG',
    '경기도': 'GYEONGGI',
    '강원도': 'GANGWON',
    '충청북도': 'CHUNGBUK',
    '충청남도': 'CHUNGNAM',
    '전라북도': 'JEONBUK',
    '전라남도': 'JEONNAM',
    '경상북도': 'GYEONGBUK',
    '경상남도': 'GYEONGNAM',
    '제주특별자치도': 'JEJU'
  }
  return sidoMap[sidoName] || 'SEOUL'
}

// 카카오맵 API로 주소 정보 가져오기
const fetchAddressFromCoords = async () => {
  const lat = parseFloat(newLocation.lat)
  const lng = parseFloat(newLocation.lng)
  
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return
  }

  try {
    // 카카오맵 좌표→주소 변환 API 호출
    const apiKey = process.env.VUE_APP_KAKAO_REST_API_KEY || process.env.VUE_APP_KAKAO_MAP_API_KEY
    if (!apiKey) {
      console.error('카카오 API 키가 설정되지 않았습니다.')
      return
    }

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
      {
        headers: {
          'Authorization': `KakaoAK ${apiKey}`
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.documents && data.documents.length > 0) {
      const address = data.documents[0].address
      if (address) {
        newLocation.detailAddress = address.address_name || ''
        // 시도명을 시도 키로 변환 (예: 서울특별시 -> SEOUL)
        const sidoName = address.region_1depth_name
        if (sidoName) {
          newLocation.sidoKey = convertSidoNameToKey(sidoName)
        }
        newLocation.sigungu = address.region_2depth_name || ''
      }
    } else {
      console.warn('주소 정보를 찾을 수 없습니다.')
      newLocation.detailAddress = ''
      newLocation.sidoKey = ''
      newLocation.sigungu = ''
    }
  } catch (error) {
    console.error('주소 정보 가져오기 실패:', error)
    newLocation.detailAddress = ''
    newLocation.sidoKey = ''
    newLocation.sigungu = ''
  }

  // 로드뷰 가용성 확인 및 미리보기 업데이트
  checkRoadviewAvailability()
}

// 로드뷰 가용성 확인 및 미리보기 업데이트
const checkRoadviewAvailability = () => {
  const lat = parseFloat(newLocation.lat)
  const lng = parseFloat(newLocation.lng)
  
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    roadviewAvailable.value = false
    return
  }

  if (!window.kakao || !window.kakao.maps) {
    console.warn('Kakao Maps SDK가 로드되지 않았습니다.')
    roadviewAvailable.value = false
    return
  }

  nextTick(() => {
    const container = document.getElementById('roadview-preview')
    if (!container) {
      console.warn('로드뷰 미리보기 컨테이너를 찾을 수 없습니다.')
      return
    }

    const position = new kakao.maps.LatLng(lat, lng)
    
    const roadviewClient = new kakao.maps.RoadviewClient()
    roadviewClient.getNearestPanoId(position, 100, (panoId) => {
      if (panoId) {
        roadviewAvailable.value = true
        
        // 기존 로드뷰 인스턴스가 있으면 제거
        if (roadviewInstance.value) {
          try {
            // 이벤트 리스너 제거
            if (roadviewInstance.value._listeners) {
              kakao.maps.event.removeListener(roadviewInstance.value)
            }
          } catch (e) {
            console.warn('기존 로드뷰 인스턴스 정리 중 오류:', e)
          }
        }
        
        // 새 로드뷰 인스턴스 생성
        try {
          roadviewInstance.value = new kakao.maps.Roadview(container)
          roadviewInstance.value.setPanoId(panoId, position)
          
          // 로드뷰 로드 완료 이벤트
          kakao.maps.event.addListener(roadviewInstance.value, 'init', () => {
            console.log('로드뷰 미리보기 로드 완료')
          })
        } catch (error) {
          console.error('로드뷰 미리보기 생성 실패:', error)
          roadviewAvailable.value = false
        }
      } else {
        roadviewAvailable.value = false
      }
    })
  })
}

// 좌표 추가
const addLocation = async () => {
  // 필수 필드 검증
  if (!canAddLocation.value) {
    alert('모든 필수 필드를 입력해주세요.')
    return
  }

  try {
    loading.value = true
    
    // 숫자 형식으로 변환하여 전송
    const coordinateData = {
      lat: parseFloat(newLocation.lat),
      lng: parseFloat(newLocation.lng),
      poiName: newLocation.poiName.trim(),
      sidoKey: newLocation.sidoKey,
      sigungu: newLocation.sigungu.trim(),
      detailAddress: newLocation.detailAddress.trim(),
      locationType: newLocation.locationType
    }
    
    await coordinateAdminService.createCoordinate(coordinateData)
    
    console.log('좌표가 성공적으로 추가되었습니다.')
    alert('좌표가 성공적으로 추가되었습니다.')
    resetForm()
    loadLocations()
  } catch (error) {
    console.error('좌표 추가 실패:', error)
    const errorMessage = error.response?.data?.message || '좌표 추가에 실패했습니다.'
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}

// 폼 초기화
const resetForm = () => {
  Object.assign(newLocation, {
    lat: '',
    lng: '',
    detailAddress: '',
    poiName: '',
    sigungu: '',
    locationType: '',
    sidoKey: ''
  })
  
  // 로드뷰 인스턴스 정리
  if (roadviewInstance.value) {
    try {
      if (window.kakao && window.kakao.maps) {
        kakao.maps.event.removeListener(roadviewInstance.value)
      }
    } catch (e) {
      console.warn('로드뷰 인스턴스 정리 중 오류:', e)
    }
    roadviewInstance.value = null
  }
  
  roadviewAvailable.value = false
  
  // 미리보기 컨테이너 초기화
  nextTick(() => {
    const container = document.getElementById('roadview-preview')
    if (container) {
      container.innerHTML = ''
    }
  })
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
    
    await coordinateAdminService.importExcel(uploadedFile.value)
    
    console.log('엑셀 파일이 성공적으로 업로드되었습니다.')
    uploadedFile.value = null
    loadLocations()
  } catch (error) {
    console.error('엑셀 업로드 실패:', error)
  } finally {
    loading.value = false
  }
}

// 좌표 목록 로드
const loadLocations = async () => {
  try {
    const pageData = await coordinateAdminService.getCoordinates({ page: 0, size: 1000 })
    locations.value = pageData.content
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
    
    await coordinateAdminService.deleteCoordinate(id)
    
    console.log('좌표가 삭제되었습니다.')
    loadLocations()
  } catch (error) {
    console.error('좌표 삭제 실패:', error)
  } finally {
    loading.value = false
  }
}

// 타입 라벨 가져오기
const getTypeLabel = (type) => {
  const labels = {
    TOURIST: '관광지',
    LANDMARK: '랜드마크',
    NATURE: '자연경관',
    CULTURAL: '문화시설',
    COMMERCIAL: '상업지역'
  }
  return labels[type] || type
}

onMounted(() => {
  loadLocations()
})

onBeforeUnmount(() => {
  // 컴포넌트 언마운트 시 로드뷰 인스턴스 정리
  if (roadviewInstance.value) {
    try {
      if (window.kakao && window.kakao.maps) {
        kakao.maps.event.removeListener(roadviewInstance.value)
      }
    } catch (e) {
      console.warn('로드뷰 인스턴스 정리 중 오류:', e)
    }
    roadviewInstance.value = null
  }
  
  // 디바운싱 타이머 정리
  if (window.coordWatchTimeout) {
    clearTimeout(window.coordWatchTimeout)
  }
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

.info-description {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

/* 엑셀 형식 표 스타일 */
.excel-format-table {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.table-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-title i {
  color: #4f46e5;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.format-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.format-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.format-table th {
  padding: 1rem 0.75rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.format-table th:last-child {
  border-right: none;
}

.th-desc {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.format-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s ease;
}

.format-table tbody tr:hover {
  background-color: #f8fafc;
}

.format-table tbody tr:last-child {
  border-bottom: none;
}

.format-table td {
  padding: 0.75rem;
  text-align: center;
  font-size: 0.9rem;
  color: #374151;
  border-right: 1px solid #e5e7eb;
}

.format-table td:last-child {
  border-right: none;
}

.empty-cell {
  color: #9ca3af;
  font-style: italic;
}

.table-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.875rem;
}

.table-note i {
  color: #3b82f6;
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
  
  /* 엑셀 형식 표 모바일 스타일 */
  .excel-format-table {
    padding: 1rem;
  }
  
  .format-table th {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .th-desc {
    font-size: 0.65rem;
  }
  
  .format-table td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .table-wrapper {
    -webkit-overflow-scrolling: touch;
  }
}
</style> 