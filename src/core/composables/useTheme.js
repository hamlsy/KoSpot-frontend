/**
 * useTheme Composable
 * 
 * 라이트 모드만 지원 (다크모드 전면 비활성화)
 * CSS 변수를 동적으로 업데이트합니다.
 */

import { ref } from 'vue';
import { lightColors, generateCSSVariables } from '@/shared/styles/theme/colors.js';

const isInitialized = ref(false);

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
 * HTML 루트 요소에 라이트 클래스 적용
 */
function applyThemeClass() {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.classList.add('light');
  root.classList.remove('dark');
}

/**
 * 라이트 테마 적용
 */
function applyLightTheme() {
  applyCSSVariables(lightColors);
  applyThemeClass();
}

/**
 * useTheme Hook
 * 다크모드 비활성화 - 항상 라이트 모드만 사용
 */
export function useTheme() {
  // 초기화 (최초 한 번만) - 항상 라이트 모드
  if (!isInitialized.value) {
    applyLightTheme();
    isInitialized.value = true;
  }
  
  // 다크모드 관련 함수들은 더미 함수로 제공 (호환성 유지)
  const isDarkMode = ref(false);
  
  const toggleTheme = () => {
    // 다크모드 비활성화 - 아무 동작 안 함
    console.log('다크모드는 현재 비활성화되어 있습니다.');
  };
  
  const setTheme = (isDark) => {
    // 다크모드 비활성화 - 항상 라이트 모드 유지
    if (isDark) {
      console.log('다크모드는 현재 비활성화되어 있습니다. 라이트 모드를 유지합니다.');
    }
    applyLightTheme();
  };
  
  const resetToSystemTheme = () => {
    // 항상 라이트 모드로 리셋
    applyLightTheme();
  };
  
  return {
    isDarkMode,
    toggleTheme,
    setTheme,
    resetToSystemTheme,
    theme: 'light',
  };
}

export default useTheme;

