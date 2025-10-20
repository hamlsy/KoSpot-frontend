/**
 * 환경변수 로더
 * 빌드 시점에 vue.config.js에서 주입된 환경변수를 사용합니다.
 */

/**
 * 빌드 시 주입된 환경변수 로드
 * @returns {Object} 환경변수 객체
 */
export function loadEnvConfig() {
  // 빌드 시점에 process.env에 주입된 환경변수 사용
  const config = {}
  
  // VUE_APP_ 접두사가 있는 환경변수만 추출
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VUE_APP_')) {
      config[key] = process.env[key]
    }
  })
  
  console.log('✅ Environment variables loaded from build-time injection')
  return config
}

/**
 * 환경변수 검증
 * @param {Object} config - 환경변수 객체
 * @returns {boolean} 유효성 검사 결과
 */
export function validateEnvConfig(config) {
  const requiredKeys = [
    'VUE_APP_KAKAO_MAP_API_KEY',
    'VUE_APP_API_BASE_URL'
  ]
  
  const missingKeys = requiredKeys.filter(key => !config[key])
  
  if (missingKeys.length > 0) {
    console.warn('Missing required environment variables:', missingKeys)
    return false
  }
  
  return true
}

/**
 * 환경변수 마스킹 (로그용)
 * @param {Object} config - 환경변수 객체
 * @returns {Object} 마스킹된 환경변수 객체
 */
export function maskSensitiveData(config) {
  const masked = { ...config }
  const sensitiveKeys = [
    'VUE_APP_KAKAO_MAP_API_KEY',
    'VUE_APP_KAKAO_CLIENT_ID',
    'VUE_APP_GOOGLE_CLIENT_ID'
  ]
  
  sensitiveKeys.forEach(key => {
    if (masked[key]) {
      masked[key] = masked[key].substring(0, 8) + '...'
    }
  })
  
  return masked
}
