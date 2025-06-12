<template>
  <div class="roadview-mode-settings">
    <h3 class="text-xl font-semibold mb-4">로드뷰 모드 설정</h3>
    
    <div class="settings-grid">
      <!-- 기본 설정 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">기본 설정</h4>
        
        
      </div>
      
      <!-- 로드뷰 특화 설정 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">로드뷰 특화 설정</h4>
        
        <div class="form-group">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="settings.allowPanning" 
              class="form-checkbox text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">로드뷰 회전 허용</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">플레이어가 로드뷰에서 주변을 둘러볼 수 있도록 허용합니다.</p>
        </div>
        
        <div class="form-group mt-4">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="settings.allowMovement" 
              class="form-checkbox text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">로드뷰 이동 허용</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">플레이어가 로드뷰에서 다른 위치로 이동할 수 있도록 허용합니다.</p>
        </div>
        
        <div class="form-group mt-4">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="settings.showCompass" 
              class="form-checkbox text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">나침반 표시</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">로드뷰에 방향을 알려주는 나침반을 표시합니다.</p>
        </div>
        
        <div class="form-group mt-4">
          <label for="movementLimit" class="block text-sm font-medium text-gray-700 mb-1">
            이동 제한 (클릭 수)
          </label>
          <input 
            id="movementLimit" 
            v-model="settings.movementLimit" 
            type="number" 
            min="0" 
            max="20" 
            class="form-input w-full rounded-md border-gray-300 shadow-sm"
            :disabled="!settings.allowMovement"
          />
          <p class="text-xs text-gray-500 mt-1">로드뷰에서 허용되는 최대 이동 횟수 (0 = 무제한)</p>
        </div>
      </div>
      
      <!-- 지역 설정 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">지역 설정</h4>
        
        <div class="form-group">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            지역 범위
          </label>
          <select 
            v-model="settings.regionType" 
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
        
        <div v-if="settings.regionType === 'custom'" class="form-group mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            사용자 정의 지역
          </label>
          <div class="flex space-x-2">
            <button 
              @click="openMapSelector" 
              class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              지도에서 선택
            </button>
            <button 
              @click="clearCustomRegion" 
              class="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              초기화
            </button>
          </div>
          <p v-if="settings.customRegion" class="text-xs text-gray-600 mt-2">
            선택된 지역: {{ settings.customRegion.name }} ({{ settings.customRegion.radius }}km 반경)
          </p>
        </div>
        
        <div class="form-group mt-4">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="settings.excludeIslands" 
              class="form-checkbox text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">섬 지역 제외</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">섬 지역을 게임 범위에서 제외합니다.</p>
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
  difficulty: 'medium',
  allowPanning: true,
  allowMovement: true,
  showCompass: true,
  movementLimit: 5,
  regionType: 'all',
  customRegion: null,
  excludeIslands: true,
  maxScore: 5000,
  distanceWeight: 5,
  timeBonus: 10
};

// 설정 상태 관리
const settings = ref({ ...defaultSettings });

// 게임 모드에 따라 설정 값 업데이트
onMounted(() => {
  // 실제 구현에서는 API를 통해 해당 게임 모드의 설정을 가져와야 함
  // 예: api.getGameModeSettings(props.gameMode.id)
  console.log(`${props.gameMode.name} 설정 불러오기`);
  
  // 테스트를 위해 기본값 사용
  if (props.gameMode.id === 'roadview') {
    // 실제 구현에서는 서버에서 가져온 설정을 사용
    settings.value = { ...defaultSettings };
  }
});

// 설정 변경 감지 및 이벤트 발생
watch(settings, (newSettings) => {
  emit('settings-change', 'roadview', newSettings);
}, { deep: true });

// 지도 선택기 열기
const openMapSelector = () => {
  // 지도 선택 모달 또는 인터페이스 열기
  console.log('지도 선택기 열기');
  // 실제 구현에서는 모달을 열거나 지도 컴포넌트를 표시
};

// 사용자 정의 지역 초기화
const clearCustomRegion = () => {
  settings.value.customRegion = null;
};

// 기본값으로 초기화
const resetToDefaults = () => {
  settings.value = { ...defaultSettings };
};

// 설정 저장
const saveSettings = () => {
  // 설정 변경 이벤트 발생
  emit('settings-change', 'roadview', settings.value);
  console.log('로드뷰 모드 설정 저장:', settings.value);
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
select {
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
</style>
