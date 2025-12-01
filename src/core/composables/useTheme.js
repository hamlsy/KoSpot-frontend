/**
 * useTheme Composable
 * 
 * 다크모드/라이트모드 전환을 관리하는 컴포저블
 * localStorage에 테마 설정을 저장하고, CSS 변수를 동적으로 업데이트합니다.
 */

import { ref, watch, onMounted } from 'vue';
import { lightColors, darkColors, generateCSSVariables } from '@/shared/styles/theme/colors.js';

const THEME_STORAGE_KEY = 'kospot-theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

// 전역 상태로 테마 관리 (모든 컴포넌트에서 동일한 상태 공유)
const isDarkMode = ref(false);
const isInitialized = ref(false);

/**
 * 시스템 다크모드 선호도 감지
 */
function getSystemPreference() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * localStorage에서 저장된 테마 가져오기
 */
function getSavedTheme() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(THEME_STORAGE_KEY);
}

/**
 * localStorage에 테마 저장
 */
function saveTheme(theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * CSS 변수 적용
 */
function applyCSSVariables(colors) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const cssVars = generateCSSVariables(colors);
  
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * HTML 루트 요소에 테마 클래스 적용
 */
function applyThemeClass(isDark) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

/**
 * 테마 적용 (CSS 변수 + 클래스)
 */
function applyTheme(isDark) {
  const colors = isDark ? darkColors : lightColors;
  applyCSSVariables(colors);
  applyThemeClass(isDark);
  saveTheme(isDark ? THEME_DARK : THEME_LIGHT);
}

/**
 * useTheme Hook
 */
export function useTheme() {
  // 초기화 (최초 한 번만)
  if (!isInitialized.value) {
    const savedTheme = getSavedTheme();
    
    if (savedTheme) {
      // 저장된 테마 사용
      isDarkMode.value = savedTheme === THEME_DARK;
    } else {
      // 시스템 설정 사용
      isDarkMode.value = getSystemPreference();
    }
    
    applyTheme(isDarkMode.value);
    isInitialized.value = true;
  }
  
  // 테마 변경 감지 및 적용
  watch(isDarkMode, (newValue) => {
    applyTheme(newValue);
  });
  
  // 시스템 다크모드 설정 변경 감지
  onMounted(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // 사용자가 수동으로 설정하지 않은 경우에만 시스템 설정 따름
      const savedTheme = getSavedTheme();
      if (!savedTheme) {
        isDarkMode.value = e.matches;
      }
    };
    
    // 최신 브라우저
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } 
    // 구형 브라우저
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  });
  
  /**
   * 테마 토글
   */
  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
  };
  
  /**
   * 특정 테마로 설정
   */
  const setTheme = (isDark) => {
    isDarkMode.value = isDark;
  };
  
  /**
   * 시스템 설정으로 리셋
   */
  const resetToSystemTheme = () => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    isDarkMode.value = getSystemPreference();
  };
  
  return {
    isDarkMode,
    toggleTheme,
    setTheme,
    resetToSystemTheme,
    theme: isDarkMode.value ? THEME_DARK : THEME_LIGHT,
  };
}

export default useTheme;

