/**
 * KoSpot Design System - Color Palette
 * 
 * Sky Blue 기반의 자연스러운 색상 시스템
 * 라이트/다크 모드 지원
 */

export const lightColors = {
  // Primary Colors
  primary: '#0ea5e9',           // Sky Blue - 밝고 친근한 하늘색
  primaryLight: '#38bdf8',      // 밝은 변형
  primaryDark: '#0284c7',       // 어두운 변형
  
  // Secondary Colors
  secondary: '#06b6d4',         // Ocean - 차분한 청록색
  secondaryLight: '#22d3ee',
  secondaryDark: '#0891b2',
  
  // Accent Colors
  accent: '#FF7F50',            // Warm Coral - 포인트용
  accentLight: '#FF9A76',
  accentDark: '#E66A3C',
  
  // Background Colors
  background: '#FAFAFA',        // Soft White - 부드러운 흰색
  surface: '#FFFFFF',           // Clean White - 카드/패널
  surfaceHover: '#F8F9FA',      // 호버 상태
  
  // Text Colors
  textPrimary: '#1F2937',       // Charcoal - 주요 텍스트
  textSecondary: '#6B7280',     // Gray - 보조 텍스트
  textTertiary: '#9CA3AF',      // Light Gray - 비활성 텍스트
  
  // Border Colors
  border: '#E5E7EB',            // 기본 border
  borderLight: '#F3F4F6',       // 미묘한 border
  borderDark: '#D1D5DB',        // 강조 border
  
  // Status Colors
  success: '#10b981',           // Green
  warning: '#f59e0b',           // Amber
  error: '#ef4444',             // Red
  info: '#3b82f6',              // Blue
  
  // Shadow Colors
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowStrong: 'rgba(0, 0, 0, 0.15)',
};

export const darkColors = {
  // Primary Colors
  primary: '#38BDF8',           // Sky Blue - 밝게 조정
  primaryLight: '#7DD3FC',
  primaryDark: '#0EA5E9',
  
  // Secondary Colors
  secondary: '#22D3EE',         // Cyan
  secondaryLight: '#67E8F9',
  secondaryDark: '#06B6D4',
  
  // Accent Colors
  accent: '#FF9A76',            // Lighter Coral
  accentLight: '#FFB199',
  accentDark: '#FF7F50',
  
  // Background Colors
  background: '#0F172A',        // Deep Navy
  surface: '#1E293B',           // Slate
  surfaceHover: '#334155',      // 호버 상태
  
  // Text Colors
  textPrimary: '#F8FAFC',       // Moon White - 주요 텍스트
  textSecondary: '#94A3B8',     // Slate Gray - 보조 텍스트
  textTertiary: '#64748B',      // Dark Slate - 비활성 텍스트
  
  // Border Colors
  border: '#334155',            // 기본 border
  borderLight: '#1E293B',       // 미묘한 border
  borderDark: '#475569',        // 강조 border
  
  // Status Colors
  success: '#34d399',           // Light Green
  warning: '#fbbf24',           // Light Amber
  error: '#f87171',             // Light Red
  info: '#60a5fa',              // Light Blue
  
  // Shadow Colors
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowMedium: 'rgba(0, 0, 0, 0.3)',
  shadowStrong: 'rgba(0, 0, 0, 0.4)',
};

/**
 * CSS 변수로 변환하는 함수
 */
export function generateCSSVariables(colors, prefix = '') {
  const cssVars = {};
  
  Object.entries(colors).forEach(([key, value]) => {
    // camelCase를 kebab-case로 변환
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    cssVars[`--color-${kebabKey}`] = value;
  });
  
  return cssVars;
}

/**
 * 현재 테마 색상 가져오기
 */
export function getThemeColors(isDark = false) {
  return isDark ? darkColors : lightColors;
}

export default {
  light: lightColors,
  dark: darkColors,
  generateCSSVariables,
  getThemeColors,
};

