/**
 * 환경변수 로더
 * submodule에서 민감정보를 안전하게 로드합니다.
 */

/**
 * submodule에서 환경변수 설정 로드
 * @returns {Object} 환경변수 객체
 */
export function loadEnvConfig() {
  try {
    // submodule 경로 설정
    const submodulePath = './KoSpot-frontend-private'
    
    // 현재 환경에 따른 파일명 결정
    const env = process.env.NODE_ENV || 'development'
    const envFile = `${submodulePath}/.env.${env}`
    
    // 환경변수 파일 읽기 시도
    const envConfig = loadEnvFile(envFile)
    
    if (envConfig) {
      console.log(`Environment config loaded from: ${envFile}`)
      return envConfig
    }
    
    // 환경별 파일이 없으면 기본 파일 시도
    const defaultFile = `${submodulePath}/.env`
    const defaultConfig = loadEnvFile(defaultFile)
    
    if (defaultConfig) {
      console.log(`Default config loaded from: ${defaultFile}`)
      return defaultConfig
    }
    
    throw new Error('No environment configuration file found')
    
  } catch (error) {
    console.warn('Failed to load private environment config:', error.message)
    return {}
  }
}

/**
 * 환경변수 파일 로드
 * @param {string} filePath - 파일 경로
 * @returns {Object|null} 환경변수 객체 또는 null
 */
function loadEnvFile(filePath) {
  try {
    // Node.js 환경에서 파일 시스템 접근
    if (typeof window === 'undefined' && typeof require !== 'undefined') {
      const fs = require('fs')
      const path = require('path')
      
      const fullPath = path.resolve(filePath)
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8')
        return parseEnvContent(content)
      }
    }
    
    // 브라우저 환경에서는 동적 import 시도
    if (typeof window !== 'undefined') {
      return loadEnvFileBrowser(filePath)
    }
    
    return null
    
  } catch (error) {
    console.warn(`Failed to load env file ${filePath}:`, error.message)
    return null
  }
}

/**
 * 브라우저 환경에서 환경변수 파일 로드
 * @param {string} filePath - 파일 경로
 * @returns {Object|null} 환경변수 객체 또는 null
 */
async function loadEnvFileBrowser(filePath) {
  try {
    // public 폴더에서 환경변수 파일 로드
    const publicPath = filePath.replace('./KoSpot-frontend-private/', '/config/')
    const response = await fetch(publicPath)
    
    if (response.ok) {
      const content = await response.text()
      return parseEnvContent(content)
    }
    
    return null
    
  } catch (error) {
    console.warn(`Failed to load env file in browser ${filePath}:`, error.message)
    return null
  }
}

/**
 * 환경변수 파일 내용 파싱
 * @param {string} content - 파일 내용
 * @returns {Object} 파싱된 환경변수 객체
 */
function parseEnvContent(content) {
  const config = {}
  
  content.split('\n').forEach(line => {
    line = line.trim()
    
    // 주석이나 빈 줄 무시
    if (!line || line.startsWith('#')) {
      return
    }
    
    // KEY=VALUE 형태 파싱
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=')
      
      // 따옴표 제거
      value = value.replace(/^["'](.*)["']$/, '$1')
      
      // VUE_APP_ 접두사가 있는 경우만 처리
      if (key.startsWith('VUE_APP_')) {
        config[key] = value
      }
    }
  })
  
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
