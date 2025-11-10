/**
 * 환경변수 관리 유틸리티
 * submodule을 통해 민감정보를 관리하고 환경별 설정을 제공합니다.
 */

import { loadEnvConfig } from './envLoader.js'

class EnvironmentConfig {
  constructor() {
    this.config = {}
    this.init()
  }

  /**
   * 환경설정 초기화
   */
  init() {
    // 기본 환경변수 로드
    this.loadBaseConfig()
    
    // submodule에서 민감정보 로드 (빌드 시점에만 실행, 브라우저에서는 스킵)
    // 브라우저 환경에서는 이미 process.env에 주입된 값 사용
    if (typeof window === 'undefined') {
      this.loadPrivateConfig()
    }
    
    // 환경별 오버라이드 적용
    this.applyEnvironmentOverrides()
  }

  /**
   * 기본 환경변수 로드
   */
  loadBaseConfig() {
    this.config = {
      // API 설정
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080/api',
      wsUrl: process.env.VUE_APP_WS_URL || 'ws://localhost:8080/ws',
      
      // 환경 정보
      nodeEnv: process.env.NODE_ENV || 'development',
      buildVersion: process.env.VUE_APP_BUILD_VERSION || '1.0.0',
      buildTime: process.env.VUE_APP_BUILD_TIME || new Date().toISOString(),
      
      // 기능 플래그
      enableDebug: process.env.VUE_APP_ENABLE_DEBUG === 'true',
      enableAnalytics: process.env.VUE_APP_ENABLE_ANALYTICS === 'true',
      
      // AWS 설정
      awsRegion: process.env.VUE_APP_AWS_REGION || 'ap-northeast-2',
      awsS3Bucket: process.env.VUE_APP_AWS_S3_BUCKET || '',
      
      // API 키들
      kakaoMapApiKey: process.env.VUE_APP_KAKAO_MAP_API_KEY || '',
      kakaoClientId: process.env.VUE_APP_KAKAO_CLIENT_ID || '',
      googleClientId: process.env.VUE_APP_GOOGLE_CLIENT_ID || '',
    }
  }

  /**
   * submodule에서 민감정보 로드 (빌드 시점에만 실행)
   * 브라우저 환경에서는 이미 process.env에 주입된 값을 사용
   */
  loadPrivateConfig() {
    try {
      // submodule 경로에서 환경변수 로드 (Node.js 환경에서만)
      const privateConfig = loadEnvConfig()
      
      // 민감정보 병합
      if (privateConfig && Object.keys(privateConfig).length > 0) {
        this.config = {
          ...this.config,
          ...privateConfig
        }
      }
    } catch (error) {
      console.warn('Private config loading failed:', error.message)
      // 빌드 시점 개발 환경에서는 기본값 사용
      if (this.config.nodeEnv === 'development') {
        console.warn('Using default development credentials')
      }
    }
  }

  /**
   * 환경별 설정 오버라이드 적용
   */
  applyEnvironmentOverrides() {
    const env = this.config.nodeEnv
    
    switch (env) {
      case 'production':
        this.config.enableDebug = false
        this.config.apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'https://api.kospot.com'
        this.config.wsUrl = process.env.VUE_APP_WS_URL || 'wss://api.kospot.com/ws'
        break
        
      case 'staging':
        this.config.enableDebug = true
        this.config.apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'https://staging-api.kospot.com'
        this.config.wsUrl = process.env.VUE_APP_WS_URL || 'wss://staging-api.kospot.com/ws'
        break
        
      case 'development':
      default:
        // 개발 환경은 기본값 유지
        break
    }
  }

  /**
   * 설정값 조회
   */
  get(key, defaultValue = null) {
    return this.config[key] ?? defaultValue
  }

  /**
   * 모든 설정값 조회
   */
  getAll() {
    return { ...this.config }
  }

  /**
   * API 키 조회 (민감정보)
   */
  getApiKey(service) {
    const keys = {
      kakaoMap: this.config.kakaoMapApiKey,
      kakao: this.config.kakaoClientId,
      google: this.config.googleClientId,
    }
    return keys[service] || null
  }

  /**
   * 환경 정보 조회
   */
  getEnvironmentInfo() {
    return {
      environment: this.config.nodeEnv,
      version: this.config.buildVersion,
      buildTime: this.config.buildTime,
      debug: this.config.enableDebug,
    }
  }
}

// 싱글톤 인스턴스 생성
const environmentConfig = new EnvironmentConfig()

export default environmentConfig
export { EnvironmentConfig }
