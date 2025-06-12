<template>
  <div class="theme-mode-settings">
    <h3 class="text-xl font-semibold mb-4">테마 모드 설정</h3>

    <div class="settings-grid">
      <!-- 기본 설정 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">기본 설정</h4>

        <div class="form-group">
          <label
            for="timeLimit"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
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
          <p class="text-xs text-gray-500 mt-1">
            각 라운드의 제한 시간을 30~300초 사이로 설정하세요.
          </p>
        </div>

        <div class="form-group mt-4">
          <label
            for="roundCount"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
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
          <p class="text-xs text-gray-500 mt-1">
            게임당 라운드 수를 1~10 사이로 설정하세요.
          </p>
        </div>
      </div>

      <!-- 테마 관리 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">테마 관리</h4>

        <div class="form-group">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            활성화된 테마
          </label>
          <div
            class="theme-list bg-white border border-gray-200 rounded-md max-h-60 overflow-y-auto"
          >
            <div
              v-for="(theme, index) in themes"
              :key="index"
              class="theme-item flex items-center justify-between p-3 border-b border-gray-100 last:border-0"
            >
              <div class="flex items-center">
                <input
                  type="checkbox"
                  :id="`theme-${index}`"
                  v-model="theme.active"
                  class="form-checkbox text-blue-600 rounded"
                />
                <label
                  :for="`theme-${index}`"
                  class="ml-2 text-sm text-gray-700"
                >
                  {{ theme.name }}
                </label>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="editTheme(index)"
                  class="text-blue-600 hover:text-blue-800"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  @click="deleteTheme(index)"
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
            @click="showAddThemeForm = true"
            class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            새 테마 추가
          </button>
        </div>

        <!-- 새 테마 추가 폼 -->
        <div
          v-if="showAddThemeForm"
          class="add-theme-form mt-4 p-3 bg-white border border-gray-200 rounded-md"
        >
          <h5 class="text-md font-medium mb-2">새 테마 추가</h5>

          <div class="form-group">
            <label
              for="themeName"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              테마 이름
            </label>
            <input
              id="themeName"
              v-model="newTheme.name"
              type="text"
              class="form-input w-full rounded-md border-gray-300 shadow-sm"
              placeholder="예: 서울 명소, 한국 대학교 등"
            />
          </div>

          <div class="form-group mt-3">
            <label
              for="themeDescription"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              테마 설명
            </label>
            <textarea
              id="themeDescription"
              v-model="newTheme.description"
              rows="2"
              class="form-textarea w-full rounded-md border-gray-300 shadow-sm"
              placeholder="테마에 대한 간단한 설명을 입력하세요."
            ></textarea>
          </div>

          <div class="form-group mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              테마 아이콘
            </label>
            <div class="flex space-x-2">
              <button
                class="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
              >
                아이콘 선택
              </button>
              <div v-if="newTheme.icon" class="flex items-center">
                <i :class="newTheme.icon" class="text-lg"></i>
                <span class="ml-2 text-sm text-gray-600">{{
                  newTheme.icon
                }}</span>
              </div>
            </div>
          </div>

          <div class="form-group mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              위치 추가
            </label>
            <div class="flex space-x-2">
              <button
                @click="openLocationSelector"
                class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                지도에서 위치 선택
              </button>
              <span class="text-sm text-gray-600">
                {{ newTheme.locations.length }}개의 위치 선택됨
              </span>
            </div>
          </div>

          <div class="flex justify-end space-x-2 mt-4">
            <button
              @click="showAddThemeForm = false"
              class="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              @click="addTheme"
              class="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              :disabled="!newTheme.name || newTheme.locations.length === 0"
            >
              테마 추가
            </button>
          </div>
        </div>
      </div>

      <!-- 테마 모드 특화 설정 섹션 -->
      <div class="settings-section">
        <h4 class="text-lg font-medium mb-3">테마 모드 특화 설정</h4>

        <div class="form-group">
          <label class="flex items-center">
            <input
              type="checkbox"
              v-model="settings.showThemeName"
              class="form-checkbox text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">테마 이름 표시</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">
            게임 중 현재 테마의 이름을 표시합니다.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

// Props 정의
const props = defineProps({
  gameMode: {
    type: Object,
    required: true,
  },
});

// Emits 정의
const emit = defineEmits(["settings-change"]);

// 기본 설정값
const defaultSettings = {
  timeLimit: 120,
  roundCount: 5,
  randomTheme: true,
  showHints: true,
  hintsPerRound: 2,
  maxScore: 5000,
  distanceWeight: 5,
  timeBonus: 10,
};

// 설정 상태 관리
const settings = ref({ ...defaultSettings });

// 테마 목록
const themes = ref([
  {
    id: 1,
    name: "서울 명소",
    description: "서울의 유명 관광지와 명소들",
    backgroundImage: "", // 테마 배경 이미지 URL
    active: true,
    locations: [
      {
        id: 1,
        name: "경복궁",
        lat: 37.5796,
        lng: 126.977,
        address: "서울특별시 종로구 사직로 161",
      },
      {
        id: 2,
        name: "남산타워",
        lat: 37.5511,
        lng: 126.9882,
        address: "서울특별시 용산구 남산공원길 105",
      },
      {
        id: 3,
        name: "광화문광장",
        lat: 37.5725,
        lng: 126.9766,
        address: "서울특별시 종로구 세종로 172",
      },
    ],
  },
  {
    id: 2,
    name: "한국 대학교",
    description: "한국의 주요 대학교 캠퍼스",
    backgroundImage: "", // 테마 배경 이미지 URL
    active: true,
    locations: [
      {
        id: 4,
        name: "서울대학교",
        lat: 37.4591,
        lng: 126.952,
        address: "서울특별시 관악구 관악로 1",
      },
      {
        id: 5,
        name: "연세대학교",
        lat: 37.5658,
        lng: 126.9385,
        address: "서울특별시 서대문구 연세로 50",
      },
      {
        id: 6,
        name: "고려대학교",
        lat: 37.5902,
        lng: 127.0324,
        address: "서울특별시 성북구 안암로 145",
      },
    ],
  },
  {
    id: 3,
    name: "한국 야구장",
    description: "한국 프로야구 구장들",
    backgroundImage: "", // 테마 배경 이미지 URL
    active: false,
    locations: [
      {
        id: 7,
        name: "잠실야구장",
        lat: 37.5122,
        lng: 127.072,
        address: "서울특별시 송파구 올림픽로 25",
      },
      {
        id: 8,
        name: "고척스카이돔",
        lat: 37.4982,
        lng: 126.8668,
        address: "서울특별시 구로구 경인로 430",
      },
      {
        id: 9,
        name: "창원NC파크",
        lat: 35.2219,
        lng: 128.5813,
        address: "경상남도 창원시 마산회원구 삼호로 63",
      },
    ],
  },
]);

// 게임 모드에 따라 설정 값 업데이트
onMounted(() => {
  // 실제 구현에서는 API를 통해 해당 게임 모드의 설정을 가져와야 함
  // 예: api.getGameModeSettings(props.gameMode.id)
  console.log(`${props.gameMode.name} 설정 불러오기`);

  // 테스트를 위해 기본값 사용
  if (props.gameMode.id === "theme") {
    // 실제 구현에서는 서버에서 가져온 설정을 사용
    settings.value = { ...defaultSettings };
    // 테마 목록도 서버에서 가져와야 함
    // themes.value = await api.getThemes();
  }
});

// 설정 변경 감지 및 이벤트 발생
watch(
  [settings, themes],
  () => {
    emit("settings-change", "theme", {
      settings: settings.value,
      themes: themes.value,
    });
  },
  { deep: true }
);

// 새 테마 추가 폼 표시 여부
const showAddThemeForm = ref(false);

// 새 테마 데이터
const newTheme = ref({
  name: "",
  description: "",
  backgroundImage: "",
  active: true,
  locations: [],
});

// 테마 편집
const editTheme = (index) => {
  console.log("테마 편집:", themes.value[index]);
  // 실제 구현에서는 편집 모달 또는 폼을 표시
};

// 테마 삭제
const deleteTheme = (index) => {
  if (confirm(`정말 "${themes.value[index].name}" 테마를 삭제하시겠습니까?`)) {
    themes.value.splice(index, 1);
  }
};

// 위치 선택기 열기
const openLocationSelector = () => {
  // 지도 선택 모달 또는 인터페이스 열기
  console.log("위치 선택기 열기");
  // 실제 구현에서는 모달을 열거나 지도 컴포넌트를 표시

  // 임시 데이터 추가 (실제 구현에서는 사용자가 지도에서 선택)
  newTheme.value.locations.push({
    id: Math.floor(Math.random() * 1000),
    name: "새 위치 " + (newTheme.value.locations.length + 1),
    lat: 37.5 + Math.random() * 0.1,
    lng: 127 + Math.random() * 0.1,
    address: "서울특별시 강남구 테헤란로 " + Math.floor(Math.random() * 500),
  });
};

// 배경 이미지 업로드
const uploadBackgroundImage = () => {
  console.log("배경 이미지 업로드");
  // 실제 구현에서는 파일 업로드 다이얼로그를 열고 S3에 업로드
  // 임시로 URL 설정
  newTheme.value.backgroundImage =
    "https://example.com/background-" + Date.now() + ".jpg";
};

// 새 테마 추가
const addTheme = () => {
  themes.value.push({
    id: themes.value.length + 1,
    name: newTheme.value.name,
    description: newTheme.value.description,
    backgroundImage: newTheme.value.backgroundImage,
    active: true,
    locations: [...newTheme.value.locations],
  });

  // 폼 초기화
  newTheme.value = {
    name: "",
    description: "",
    backgroundImage: "",
    active: true,
    locations: [],
  };

  showAddThemeForm.value = false;
};

// 기본값으로 초기화
const resetToDefaults = () => {
  settings.value = { ...defaultSettings };
};

// 설정 저장
const saveSettings = () => {
  // 설정 변경 이벤트 발생
  emit("settings-change", "theme", {
    settings: settings.value,
    themes: themes.value,
  });
  console.log("테마 모드 설정 저장:", settings.value);
  console.log("테마 목록:", themes.value);
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

.theme-list {
  max-height: 200px;
  overflow-y: auto;
}

.theme-item {
  transition: background-color 0.2s;
}

.theme-item:hover {
  background-color: #f1f5f9;
}
</style>
