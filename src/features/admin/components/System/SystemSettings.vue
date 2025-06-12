<template>
  <div class="system-settings bg-white rounded-xl shadow-sm p-6">
    <div class="section-header flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-gray-800">시스템 설정</h2>
      <div class="flex space-x-2">
        <button @click="saveAllSettings" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg">
          <i class="fas fa-save mr-2"></i>
          <span>모든 설정 저장</span>
        </button>
        <button @click="resetSettings" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
          <i class="fas fa-undo mr-2"></i>
          <span>초기화</span>
        </button>
      </div>
    </div>

    <!-- 설정 탭 -->
    <div class="settings-tabs mb-6">
      <div class="flex border-b border-gray-200">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 text-sm font-medium transition-colors relative"
          :class="activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
        >
          <i :class="`fas ${tab.icon} mr-2`"></i>
          <span>{{ tab.name }}</span>
          <div 
            v-if="activeTab === tab.id" 
            class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"
          ></div>
        </button>
      </div>
    </div>

    <!-- 일반 설정 -->
    <div v-if="activeTab === 'general'" class="general-settings">
      <div class="setting-group mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">사이트 정보</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 mb-1">사이트 제목</label>
            <input 
              v-model="settings.general.siteTitle" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            />
          </div>
          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 mb-1">사이트 설명</label>
            <input 
              v-model="settings.general.siteDescription" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            />
          </div>
          <div class="form-group col-span-1 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">로고 URL</label>
            <div class="flex">
              <input 
                v-model="settings.general.logoUrl" 
                type="text" 
                class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
              />
              <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-r-lg hover:bg-gray-200 transition-all">
                <i class="fas fa-upload"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-group mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">유지보수 모드</h3>
        <div class="flex items-center mb-4">
          <div class="toggle-switch mr-3">
            <input 
              type="checkbox" 
              id="maintenanceMode" 
              v-model="settings.general.maintenanceMode" 
              class="hidden"
            />
            <label 
              for="maintenanceMode" 
              class="block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer relative"
              :class="settings.general.maintenanceMode ? 'bg-indigo-600' : 'bg-gray-300'"
            >
              <span 
                class="block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out absolute top-1"
                :class="settings.general.maintenanceMode ? 'translate-x-7' : 'translate-x-1'"
              ></span>
            </label>
          </div>
          <span class="text-sm font-medium" :class="settings.general.maintenanceMode ? 'text-indigo-600' : 'text-gray-500'">
            {{ settings.general.maintenanceMode ? '유지보수 모드 활성화' : '유지보수 모드 비활성화' }}
          </span>
        </div>
        <div v-if="settings.general.maintenanceMode" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
            <input 
              v-model="settings.general.maintenanceStart" 
              type="datetime-local" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            />
          </div>
          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
            <input 
              v-model="settings.general.maintenanceEnd" 
              type="datetime-local" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            />
          </div>
          <div class="form-group col-span-1 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">유지보수 메시지</label>
            <textarea 
              v-model="settings.general.maintenanceMessage" 
              rows="3" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h3 class="text-lg font-medium text-gray-800 mb-4">지역 및 시간대</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 mb-1">기본 언어</label>
            <select 
              v-model="settings.general.defaultLanguage" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <div class="form-group">
            <label class="block text-sm font-medium text-gray-700 mb-1">시간대</label>
            <select 
              v-model="settings.general.timezone" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
            >
              <option value="Asia/Seoul">Asia/Seoul (UTC+9)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (UTC-7)</option>
              <option value="Europe/London">Europe/London (UTC+1)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 게임 설정 -->
    <div v-if="activeTab === 'game'" class="game-settings">
      <div class="setting-group mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">게임 난이도</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            v-for="(difficulty, key) in settings.game.difficulties" 
            :key="key"
            class="difficulty-card p-4 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all"
            :class="{ 'border-indigo-500 bg-indigo-50': settings.game.defaultDifficulty === key }"
          >
            <div class="flex justify-between items-center mb-2">
              <h4 class="font-medium" :class="settings.game.defaultDifficulty === key ? 'text-indigo-600' : 'text-gray-700'">
                {{ difficulty.name }}
              </h4>
              <button 
                @click="settings.game.defaultDifficulty = key" 
                class="text-xs px-2 py-1 rounded"
                :class="settings.game.defaultDifficulty === key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'"
              >
                {{ settings.game.defaultDifficulty === key ? '기본값' : '기본값으로 설정' }}
              </button>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">시간 제한</span>
                <div class="flex items-center">
                  <input 
                    v-model="difficulty.timeLimit" 
                    type="number" 
                    min="10" 
                    max="300" 
                    class="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  />
                  <span class="text-xs text-gray-500 ml-1">초</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">힌트 수</span>
                <div class="flex items-center">
                  <input 
                    v-model="difficulty.hints" 
                    type="number" 
                    min="0" 
                    max="5" 
                    class="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  />
                  <span class="text-xs text-gray-500 ml-1">개</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">점수 배율</span>
                <div class="flex items-center">
                  <input 
                    v-model="difficulty.scoreMultiplier" 
                    type="number" 
                    min="0.1" 
                    max="5" 
                    step="0.1" 
                    class="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                  />
                  <span class="text-xs text-gray-500 ml-1">x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-group mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">게임 모드 설정</h3>
        <div class="space-y-4">
          <div 
            v-for="(mode, key) in settings.game.modes" 
            :key="key"
            class="mode-card p-4 rounded-xl border border-gray-200"
          >
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3" :class="mode.color">
                  <i :class="`fas ${mode.icon} text-white`"></i>
                </div>
                <h4 class="font-medium text-gray-700">{{ mode.name }}</h4>
              </div>
              <div class="toggle-switch">
                <input 
                  type="checkbox" 
                  :id="`mode-${key}`" 
                  v-model="mode.enabled" 
                  class="hidden"
                />
                <label 
                  :for="`mode-${key}`" 
                  class="block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer relative"
                  :class="mode.enabled ? 'bg-indigo-600' : 'bg-gray-300'"
                >
                  <span 
                    class="block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out absolute top-1"
                    :class="mode.enabled ? 'translate-x-7' : 'translate-x-1'"
                  ></span>
                </label>
              </div>
            </div>
            <div v-if="mode.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-group">
                <label class="block text-xs font-medium text-gray-500 mb-1">최대 라운드</label>
                <input 
                  v-model="mode.maxRounds" 
                  type="number" 
                  min="1" 
                  max="20" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                />
              </div>
              <div class="form-group">
                <label class="block text-xs font-medium text-gray-500 mb-1">최대 거리 (km)</label>
                <input 
                  v-model="mode.maxDistance" 
                  type="number" 
                  min="1" 
                  max="1000" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 알림 설정 -->
    <div v-if="activeTab === 'notifications'" class="notification-settings">
      <div class="setting-group mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-4">전체 공지사항</h3>
        <div class="space-y-4">
          <div 
            v-for="(announcement, index) in settings.notifications.announcements" 
            :key="index"
            class="announcement-card p-4 rounded-xl border border-gray-200"
          >
            <div class="flex justify-between items-start mb-3">
              <div class="flex-1">
                <input 
                  v-model="announcement.title" 
                  type="text" 
                  placeholder="공지사항 제목" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all mb-2"
                />
                <textarea 
                  v-model="announcement.content" 
                  rows="2" 
                  placeholder="공지사항 내용" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                ></textarea>
              </div>
              <button @click="removeAnnouncement(index)" class="ml-2 text-red-500 hover:text-red-700">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="form-group">
                <label class="block text-xs font-medium text-gray-500 mb-1">시작 시간</label>
                <input 
                  v-model="announcement.startDate" 
                  type="datetime-local" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                />
              </div>
              <div class="form-group">
                <label class="block text-xs font-medium text-gray-500 mb-1">종료 시간</label>
                <input 
                  v-model="announcement.endDate" 
                  type="datetime-local" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                />
              </div>
              <div class="form-group">
                <label class="block text-xs font-medium text-gray-500 mb-1">타입</label>
                <select 
                  v-model="announcement.type" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                >
                  <option value="info">정보</option>
                  <option value="warning">경고</option>
                  <option value="error">오류</option>
                  <option value="success">성공</option>
                </select>
              </div>
            </div>
            <div class="flex items-center mt-3">
              <div class="toggle-switch mr-3">
                <input 
                  type="checkbox" 
                  :id="`announcement-${index}`" 
                  v-model="announcement.active" 
                  class="hidden"
                />
                <label 
                  :for="`announcement-${index}`" 
                  class="block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer relative"
                  :class="announcement.active ? 'bg-indigo-600' : 'bg-gray-300'"
                >
                  <span 
                    class="block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out absolute top-1"
                    :class="announcement.active ? 'translate-x-7' : 'translate-x-1'"
                  ></span>
                </label>
              </div>
              <span class="text-sm" :class="announcement.active ? 'text-indigo-600' : 'text-gray-500'">
                {{ announcement.active ? '활성화' : '비활성화' }}
              </span>
            </div>
          </div>
          <button 
            @click="addAnnouncement" 
            class="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all"
          >
            <i class="fas fa-plus mr-2"></i>
            <span>새 공지사항 추가</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

// 활성 탭
const activeTab = ref('general');

// 탭 정의
const tabs = [
  { id: 'general', name: '일반 설정', icon: 'fa-cog' },
  { id: 'game', name: '게임 설정', icon: 'fa-gamepad' },
  { id: 'notifications', name: '알림 설정', icon: 'fa-bell' }
];

// 설정 데이터
const settings = reactive({
  general: {
    siteTitle: 'KoSpot',
    siteDescription: '위치 기반 추리 게임',
    logoUrl: '/assets/logo.png',
    maintenanceMode: false,
    maintenanceStart: '',
    maintenanceEnd: '',
    maintenanceMessage: '현재 서비스 점검 중입니다. 잠시 후 다시 시도해주세요.',
    defaultLanguage: 'ko',
    timezone: 'Asia/Seoul'
  },
  game: {
    defaultDifficulty: 'normal',
    difficulties: {
      easy: {
        name: '쉬움',
        timeLimit: 180,
        hints: 3,
        scoreMultiplier: 0.8
      },
      normal: {
        name: '보통',
        timeLimit: 120,
        hints: 2,
        scoreMultiplier: 1.0
      },
      hard: {
        name: '어려움',
        timeLimit: 90,
        hints: 1,
        scoreMultiplier: 1.5
      }
    },
    modes: {
      roadview: {
        name: '로드뷰 모드',
        enabled: true,
        maxRounds: 5,
        maxDistance: 500,
        icon: 'fa-road',
        color: 'bg-blue-500'
      },
      photo: {
        name: '포토 모드',
        enabled: true,
        maxRounds: 5,
        maxDistance: 300,
        icon: 'fa-camera',
        color: 'bg-green-500'
      },
      multiplayer: {
        name: '멀티플레이어 모드',
        enabled: true,
        maxRounds: 7,
        maxDistance: 400,
        icon: 'fa-users',
        color: 'bg-purple-500'
      },
      special: {
        name: '특별 이벤트 모드',
        enabled: false,
        maxRounds: 3,
        maxDistance: 200,
        icon: 'fa-star',
        color: 'bg-amber-500'
      }
    }
  },
  notifications: {
    announcements: [
      {
        title: '서비스 업데이트 안내',
        content: '새로운 기능이 추가되었습니다. 자세한 내용은 공지사항을 확인해주세요.',
        startDate: '2023-11-01T00:00',
        endDate: '2023-11-30T23:59',
        type: 'info',
        active: true
      }
    ]
  }
});

// 모든 설정 저장
const saveAllSettings = () => {
  // 실제로는 API 호출하여 설정 저장
  console.log('설정 저장:', settings);
  alert('설정이 저장되었습니다.');
};

// 설정 초기화
const resetSettings = () => {
  if (confirm('모든 설정을 초기화하시겠습니까?')) {
    // 실제로는 API 호출하여 기본 설정 불러오기
    console.log('설정 초기화');
  }
};

// 공지사항 추가
const addAnnouncement = () => {
  settings.notifications.announcements.push({
    title: '',
    content: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    type: 'info',
    active: false
  });
};

// 공지사항 제거
const removeAnnouncement = (index) => {
  if (confirm('이 공지사항을 삭제하시겠습니까?')) {
    settings.notifications.announcements.splice(index, 1);
  }
};
</script>
