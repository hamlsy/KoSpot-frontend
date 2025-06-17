<template>
  <div class="photo-mode-settings">
    <h3 class="text-xl font-semibold mb-4">포토 모드 설정</h3>
    
    <div class="settings-grid">
      <!-- 기본 설정 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">기본 설정</h4>
        
        <div class="form-group">
          <label for="timeLimit" class="block text-sm font-medium text-gray-700 mb-1">
            제한 시간 (초)
          </label>
          <input 
            id="timeLimit" 
            v-model="settings.timeLimit" 
            type="number" 
            min="30" 
            max="300" 
            class="form-input w-full rounded-md border-gray-300 shadow-sm"
          />
          <p class="text-xs text-gray-500 mt-1">각 라운드의 제한 시간을 30~300초 사이로 설정하세요.</p>
        </div>
        
        <div class="form-group mt-4">
          <label for="roundCount" class="block text-sm font-medium text-gray-700 mb-1">
            라운드 수
          </label>
          <input 
            id="roundCount" 
            v-model="settings.roundCount" 
            type="number" 
            min="1" 
            max="10" 
            class="form-input w-full rounded-md border-gray-300 shadow-sm"
          />
          <p class="text-xs text-gray-500 mt-1">게임당 라운드 수를 1~10 사이로 설정하세요.</p>
        </div>
        
        <div class="form-group mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            난이도 설정
          </label>
          <div class="flex items-center space-x-4">
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="settings.difficulty" 
                value="easy" 
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm text-gray-700">쉬움</span>
            </label>
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="settings.difficulty" 
                value="medium" 
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm text-gray-700">보통</span>
            </label>
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="settings.difficulty" 
                value="hard" 
                class="form-radio text-blue-600"
              />
              <span class="ml-2 text-sm text-gray-700">어려움</span>
            </label>
          </div>
          <p class="text-xs text-gray-500 mt-1">난이도에 따라 힌트 제공 및 점수 계산 방식이 달라집니다.</p>
        </div>
      </div>
      
      <!-- 포토 모드 특화 설정 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">포토 모드 특화 설정</h4>
        
        <div class="form-group">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="settings.showPhotoInfo" 
              class="form-checkbox text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">사진 정보 표시</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">사진의 촬영 날짜, 위치 등의 정보를 표시합니다.</p>
        </div>
        
        <div class="form-group mt-4">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="settings.allowZoom" 
              class="form-checkbox text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">사진 확대 허용</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">플레이어가 사진을 확대하여 볼 수 있도록 허용합니다.</p>
        </div>
        
        <div class="form-group mt-4">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="settings.showHints" 
              class="form-checkbox text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">힌트 제공</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">게임 중 위치에 대한 힌트를 제공합니다.</p>
        </div>
        
        <div v-if="settings.showHints" class="form-group mt-4">
          <label for="hintCount" class="block text-sm font-medium text-gray-700 mb-1">
            힌트 개수
          </label>
          <input 
            id="hintCount" 
            v-model="settings.hintCount" 
            type="number" 
            min="1" 
            max="3" 
            class="form-input w-full rounded-md border-gray-300 shadow-sm"
          />
          <p class="text-xs text-gray-500 mt-1">라운드당 제공되는 힌트의 개수입니다.</p>
        </div>
        
        <div class="form-group mt-4">
          <label for="photoBlurLevel" class="block text-sm font-medium text-gray-700 mb-1">
            사진 초기 흐림 정도
          </label>
          <input 
            id="photoBlurLevel" 
            v-model="settings.photoBlurLevel" 
            type="range" 
            min="0" 
            max="10" 
            class="form-range w-full"
          />
          <div class="flex justify-between text-xs text-gray-500">
            <span>없음 (선명한 사진)</span>
            <span>최대 (매우 흐린 사진)</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">게임 시작 시 사진의 흐림 정도를 설정합니다. 시간이 지남에 따라 점점 선명해집니다.</p>
        </div>
      </div>
      
      <!-- 사진 관리 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">사진 컬렉션 관리</h4>
        
        <div class="form-group">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            활성화된 컬렉션
          </label>
          <div class="collection-list bg-white border border-gray-200 rounded-md max-h-60 overflow-y-auto">
            <div 
              v-for="(collection, index) in photoCollections" 
              :key="index"
              class="collection-item flex items-center justify-between p-3 border-b border-gray-100 last:border-0"
            >
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  :id="`collection-${index}`" 
                  v-model="collection.active" 
                  class="form-checkbox text-blue-600 rounded"
                />
                <label :for="`collection-${index}`" class="ml-2 text-sm text-gray-700">
                  {{ collection.name }}
                  <span class="text-xs text-gray-500 ml-1">({{ collection.photoCount }}장)</span>
                </label>
              </div>
              <div class="flex space-x-2">
                <button 
                  @click="viewCollection(index)" 
                  class="text-blue-600 hover:text-blue-800"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  @click="editCollection(index)" 
                  class="text-blue-600 hover:text-blue-800"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  @click="deleteCollection(index)" 
                  class="text-red-600 hover:text-red-800"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group mt-4">
          <button 
            @click="showAddCollectionForm = true" 
            class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            새 컬렉션 추가
          </button>
        </div>
        
        <!-- 새 컬렉션 추가 폼 -->
        <div v-if="showAddCollectionForm" class="add-collection-form mt-4 p-3 bg-white border border-gray-200 rounded-md">
          <h5 class="text-md font-medium mb-2">새 컬렉션 추가</h5>
          
          <div class="form-group">
            <label for="collectionName" class="block text-sm font-medium text-gray-700 mb-1">
              컬렉션 이름
            </label>
            <input 
              id="collectionName" 
              v-model="newCollection.name" 
              type="text" 
              class="form-input w-full rounded-md border-gray-300 shadow-sm"
              placeholder="예: 서울 랜드마크, 한국 자연경관 등"
            />
          </div>
          
          <div class="form-group mt-3">
            <label for="collectionDescription" class="block text-sm font-medium text-gray-700 mb-1">
              컬렉션 설명
            </label>
            <textarea 
              id="collectionDescription" 
              v-model="newCollection.description" 
              rows="2"
              class="form-textarea w-full rounded-md border-gray-300 shadow-sm"
              placeholder="컬렉션에 대한 간단한 설명을 입력하세요."
            ></textarea>
          </div>
          
          <div class="form-group mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              지역 범위
            </label>
            <select 
              v-model="newCollection.region" 
              class="form-select w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="all">전국</option>
              <option value="seoul">서울특별시</option>
              <option value="busan">부산광역시</option>
              <option value="incheon">인천광역시</option>
              <option value="daegu">대구광역시</option>
              <option value="gwangju">광주광역시</option>
              <option value="daejeon">대전광역시</option>
              <option value="ulsan">울산광역시</option>
              <option value="custom">사용자 정의</option>
            </select>
          </div>
          
          <div class="form-group mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              사진 업로드
            </label>
            <div class="flex flex-col space-y-2">
              <button 
                @click="uploadPhotos" 
                class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                사진 업로드
              </button>
              <div v-if="newCollection.photos.length > 0" class="text-sm text-gray-600">
                {{ newCollection.photos.length }}장의 사진이 업로드됨
              </div>
              <div class="photo-preview-grid mt-2" v-if="newCollection.photos.length > 0">
                <div 
                  v-for="(photo, photoIndex) in newCollection.photos.slice(0, 4)" 
                  :key="photoIndex"
                  class="photo-preview-item"
                >
                  <div class="bg-gray-200 h-16 w-16 rounded flex items-center justify-center">
                    <i class="fas fa-image text-gray-400"></i>
                  </div>
                </div>
                <div v-if="newCollection.photos.length > 4" class="photo-preview-more">
                  +{{ newCollection.photos.length - 4 }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 mt-4">
            <button 
              @click="showAddCollectionForm = false" 
              class="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button 
              @click="addCollection" 
              class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              :disabled="!newCollection.name || newCollection.photos.length === 0"
            >
              컬렉션 추가
            </button>
          </div>
        </div>
      </div>
      
      <!-- 점수 설정 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">점수 설정</h4>
        
        <div class="form-group">
          <label for="maxScore" class="block text-sm font-medium text-gray-700 mb-1">
            최대 점수
          </label>
          <input 
            id="maxScore" 
            v-model="settings.maxScore" 
            type="number" 
            min="1000" 
            max="10000" 
            step="100" 
            class="form-input w-full rounded-md border-gray-300 shadow-sm"
          />
          <p class="text-xs text-gray-500 mt-1">정확한 위치를 맞췄을 때 획득하는 최대 점수입니다.</p>
        </div>
        
        <div class="form-group mt-4">
          <label for="distanceWeight" class="block text-sm font-medium text-gray-700 mb-1">
            거리 가중치
          </label>
          <input 
            id="distanceWeight" 
            v-model="settings.distanceWeight" 
            type="range" 
            min="1" 
            max="10" 
            class="form-range w-full"
          />
          <div class="flex justify-between text-xs text-gray-500">
            <span>낮음 (거리에 따른 감점 적음)</span>
            <span>높음 (거리에 따른 감점 많음)</span>
          </div>
        </div>
        
        <div class="form-group mt-4">
          <label for="timeBonus" class="block text-sm font-medium text-gray-700 mb-1">
            시간 보너스
          </label>
          <div class="flex items-center space-x-2">
            <input 
              id="timeBonus" 
              v-model="settings.timeBonus" 
              type="number" 
              min="0" 
              max="100" 
              class="form-input w-32 rounded-md border-gray-300 shadow-sm"
            />
            <span class="text-sm text-gray-700">점/초</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">남은 시간에 따른 보너스 점수 (0 = 보너스 없음)</p>
        </div>
        
        <div class="form-group mt-4">
          <label for="hintPenalty" class="block text-sm font-medium text-gray-700 mb-1">
            힌트 사용 패널티
          </label>
          <div class="flex items-center space-x-2">
            <input 
              id="hintPenalty" 
              v-model="settings.hintPenalty" 
              type="number" 
              min="0" 
              max="1000" 
              step="50" 
              class="form-input w-32 rounded-md border-gray-300 shadow-sm"
            />
            <span class="text-sm text-gray-700">점/힌트</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">힌트 사용 시 차감되는 점수 (0 = 패널티 없음)</p>
        </div>
        
        <div class="form-group mt-4">
          <label for="zoomPenalty" class="block text-sm font-medium text-gray-700 mb-1">
            확대 사용 패널티
          </label>
          <div class="flex items-center space-x-2">
            <input 
              id="zoomPenalty" 
              v-model="settings.zoomPenalty" 
              type="number" 
              min="0" 
              max="500" 
              step="50" 
              class="form-input w-32 rounded-md border-gray-300 shadow-sm"
              :disabled="!settings.allowZoom"
            />
            <span class="text-sm text-gray-700">점/확대</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">사진 확대 사용 시 차감되는 점수 (0 = 패널티 없음)</p>
        </div>
      </div>
    </div>
    
    <div class="actions mt-8 flex justify-end space-x-3">
      <button 
        @click="resetToDefaults" 
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
      >
        기본값으로 초기화
      </button>
      <button 
        @click="saveSettings" 
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        설정 저장
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

// Props 정의
const props = defineProps({
  gameMode: {
    type: Object,
    required: true
  }
});

// Emits 정의
const emit = defineEmits(['settings-change']);

// 기본 설정값
const defaultSettings = {
  timeLimit: 120,
  roundCount: 5,
  showPhotoInfo: false,
  allowZoom: true,
  showHints: true,
  hintsPerRound: 2,
  photoBlurLevel: 5,
  maxScore: 5000,
  distanceWeight: 5,
  timeBonus: 10
};

// 설정 상태 관리
const settings = ref({ ...defaultSettings });

// 사진 콜렉션 목록
const photoCollections = ref([
  { 
    id: 1, 
    name: '서울 랜드마크', 
    description: '서울의 유명 랜드마크와 관광지', 
    region: 'seoul',
    photos: [
      { 
        id: 101, 
        name: '경복궁', 
        imageUrl: 'https://example.com/photos/gyeongbokgung.jpg',
        location: { lat: 37.5796, lng: 126.9770 },
        address: '서울특별시 종로구 사직로 161'
      },
      { 
        id: 102, 
        name: '남산타워', 
        imageUrl: 'https://example.com/photos/namsan.jpg',
        location: { lat: 37.5511, lng: 126.9882 },
        address: '서울특별시 용산구 남산공원길 105'
      }
    ],
    active: true 
  },
  { 
    id: 2, 
    name: '한국 자연경관', 
    description: '한국의 아름다운 자연 풍경', 
    region: 'all',
    photos: [
      { 
        id: 201, 
        name: '제주 성산일출봉', 
        imageUrl: 'https://example.com/photos/seongsan.jpg',
        location: { lat: 33.4580, lng: 126.9427 },
        address: '제주특별자치도 서귀포시 성산일출봉'
      },
      { 
        id: 202, 
        name: '설악산', 
        imageUrl: 'https://example.com/photos/seorak.jpg',
        location: { lat: 38.1193, lng: 128.4654 },
        address: '강원도 속초시 설악동'
      }
    ],
    active: true 
  },
  { 
    id: 3, 
    name: '부산 명소', 
    description: '부산의 유명 관광지와 해변', 
    region: 'busan',
    photos: [
      { 
        id: 301, 
        name: '해운대', 
        imageUrl: 'https://example.com/photos/haeundae.jpg',
        location: { lat: 35.1586, lng: 129.1603 },
        address: '부산광역시 해운대구 해운대해변로 264'
      },
      { 
        id: 302, 
        name: '감지안 문화마을', 
        imageUrl: 'https://example.com/photos/gamcheon.jpg',
        location: { lat: 35.0970, lng: 129.0110 },
        address: '부산광역시 사하구 감지안로 203'
      }
    ],
    active: false 
  }
]);

// 게임 모드에 따라 설정 값 업데이트
onMounted(() => {
  // 실제 구현에서는 API를 통해 해당 게임 모드의 설정을 가져와야 함
  // 예: api.getGameModeSettings(props.gameMode.id)
  console.log(`${props.gameMode.name} 설정 불러오기`);
  
  // 테스트를 위해 기본값 사용
  if (props.gameMode.id === 'photo') {
    // 실제 구현에서는 서버에서 가져온 설정을 사용
    settings.value = { ...defaultSettings };
    // 사진 콜렉션도 서버에서 가져와야 함
    // photoCollections.value = await api.getPhotoCollections();
  }
});

// 설정 변경 감지 및 이벤트 발생
watch([settings, photoCollections], () => {
  emit('settings-change', 'photo', { 
    settings: settings.value,
    photoCollections: photoCollections.value
  });
}, { deep: true });

// 새 콜렉션 추가 폼 표시 여부
const showAddCollectionForm = ref(false);

// 새 콜렉션 데이터
const newCollection = ref({
  name: '',
  description: '',
  region: 'all',
  photos: []
});

// 콜렉션 보기
const viewCollection = (index) => {
  console.log('콜렉션 보기:', photoCollections.value[index]);
  // 실제 구현에서는 콜렉션 내 사진 보기 모달 또는 페이지를 표시
};

// 콜렉션 편집
const editCollection = (index) => {
  console.log('콜렉션 편집:', photoCollections.value[index]);
  // 실제 구현에서는 편집 모달 또는 폼을 표시
};

// 콜렉션 삭제
const deleteCollection = (index) => {
  if (confirm(`정말 "${photoCollections.value[index].name}" 콜렉션을 삭제하시겠습니까?`)) {
    photoCollections.value.splice(index, 1);
  }
};

// 사진 업로드
const uploadPhotos = () => {
  // 사진 업로드 인터페이스 열기
  console.log('사진 업로드 인터페이스 열기');
  // 실제 구현에서는 파일 선택 대화상자를 열거나 드래그 앤 드롭 영역을 표시
  
  // 임시 데이터 추가 (실제 구현에서는 사용자가 업로드한 사진)
  for (let i = 0; i < 3; i++) {
    newCollection.value.photos.push({
      id: Math.floor(Math.random() * 1000),
      name: '사진 ' + (newCollection.value.photos.length + 1),
      imageUrl: `https://example.com/photos/temp-${Date.now()}-${i}.jpg`,
      location: {
        lat: 37.5 + Math.random() * 0.1,
        lng: 127 + Math.random() * 0.1
      },
      address: '서울특별시 강남구 테헤란로 ' + Math.floor(Math.random() * 500)
    });
  }
};

// S3에서 사진 불러오기
const fetchPhotosFromS3 = () => {
  console.log('S3에서 사진 불러오기');
  // 실제 구현에서는 AWS SDK를 사용하여 S3에서 사진 목록을 가져옴
  // 임시 데이터 추가
  alert('S3에서 사진을 불러왔습니다.');
};

// 새 콜렉션 추가
const addCollection = () => {
  photoCollections.value.push({
    id: photoCollections.value.length + 1,
    name: newCollection.value.name,
    description: newCollection.value.description,
    region: newCollection.value.region,
    photos: [...newCollection.value.photos],
    active: true
  });
  
  // 폼 초기화
  newCollection.value = {
    name: '',
    description: '',
    region: 'all',
    photos: []
  };
  
  showAddCollectionForm.value = false;
};

// 기본값으로 초기화
const resetToDefaults = () => {
  settings.value = { ...defaultSettings };
};

// 설정 저장
const saveSettings = () => {
  // 설정 변경 이벤트 발생
  emit('settings-change', 'photo', { 
    settings: settings.value,
    photoCollections: photoCollections.value
  });
  console.log('포토 모드 설정 저장:', settings.value);
  console.log('사진 콜렉션:', photoCollections.value);
};
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.settings-section {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 1rem;
}

/* 폼 요소 스타일링 */
input[type="text"],
input[type="number"],
select,
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
}

input[type="checkbox"],
input[type="radio"] {
  cursor: pointer;
}

input[type="range"] {
  width: 100%;
}

.collection-list {
  max-height: 200px;
  overflow-y: auto;
}

.collection-item {
  transition: background-color 0.2s;
}

.collection-item:hover {
  background-color: #f1f5f9;
}

.photo-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.photo-preview-item {
  width: 4rem;
  height: 4rem;
}

.photo-preview-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background-color: #f1f5f9;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #64748b;
}
</style>
