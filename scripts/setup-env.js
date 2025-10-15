#!/usr/bin/env node

/**
 * 환경변수 설정 스크립트
 * submodule에서 환경별 설정 파일을 복사하여 설정합니다.
 */

const fs = require('fs')
const path = require('path')

// 색상 출력을 위한 유틸리티
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

/**
 * 환경변수 설정
 */
function setupEnvironment() {
  const environment = process.argv[2] || 'development'
  const validEnvironments = ['development', 'staging', 'production']
  
  if (!validEnvironments.includes(environment)) {
    logError(`Invalid environment: ${environment}`)
    logInfo(`Valid environments: ${validEnvironments.join(', ')}`)
    process.exit(1)
  }
  
  logInfo(`Setting up environment: ${environment}`)
  
  // 경로 설정
  const submodulePath = path.resolve(__dirname, '..', 'KoSpot-frontend-private')
  const configPath = path.resolve(__dirname, '..', `${environment}.env`) //환경변수
  const targetPath = path.resolve(submodulePath, '.env')
  const targetEnvPath = path.resolve(submodulePath, `.env.${environment}`)
  
  // submodule 디렉토리 확인
  if (!fs.existsSync(submodulePath)) {
    logError('Submodule directory not found. Please initialize submodule first:')
    log('git submodule update --init --recursive', 'cyan')
    process.exit(1)
  }
  
  // 설정 파일 확인
  if (!fs.existsSync(configPath)) {
    logError(`Environment config file not found: ${configPath}`)
    process.exit(1)
  }
  
  try {
    // 환경변수 파일 복사
    const envContent = fs.readFileSync(configPath, 'utf8')
    
    // .env 파일 생성 (현재 환경용)
    fs.writeFileSync(targetPath, envContent)
    logSuccess(`Created .env file in submodule`)
    
    // 환경별 .env 파일 생성
    fs.writeFileSync(targetEnvPath, envContent)
    logSuccess(`Created .env.${environment} file in submodule`)
    
    // .gitignore 파일 생성/업데이트
    updateGitignore(submodulePath)
    
    logSuccess(`Environment setup completed for: ${environment}`)
    logInfo('Please update the API keys in the submodule files with actual values')
    
  } catch (error) {
    logError(`Failed to setup environment: ${error.message}`)
    process.exit(1)
  }
}

/**
 * .gitignore 파일 업데이트
 */
function updateGitignore(submodulePath) {
  const gitignorePath = path.resolve(submodulePath, '.gitignore')
  const gitignoreContent = `
# Environment files
.env
.env.*
!.env.template

# Logs
*.log

# Runtime data
pids
*.pid
*.seed

# Coverage directory used by tools like istanbul
coverage

# Dependency directories
node_modules/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.local
.env.development.local
.env.test.local
.env.production.local
`.trim()
  
  fs.writeFileSync(gitignorePath, gitignoreContent)
  logSuccess('Updated .gitignore in submodule')
}

/**
 * 환경변수 검증
 */
function validateEnvironment(submodulePath) {
  const envPath = path.resolve(submodulePath, '.env')
  
  if (!fs.existsSync(envPath)) {
    logError('Environment file not found. Please run setup first.')
    return false
  }
  
  const content = fs.readFileSync(envPath, 'utf8')
  const requiredKeys = [
    'VUE_APP_KAKAO_MAP_API_KEY',
    'VUE_APP_API_BASE_URL'
  ]
  
  const missingKeys = requiredKeys.filter(key => !content.includes(key))
  
  if (missingKeys.length > 0) {
    logWarning(`Missing required environment variables: ${missingKeys.join(', ')}`)
    return false
  }
  
  logSuccess('Environment validation passed')
  return true
}

/**
 * 환경변수 마스킹하여 출력
 */
function showEnvironmentInfo(submodulePath) {
  const envPath = path.resolve(submodulePath, '.env')
  
  if (!fs.existsSync(envPath)) {
    logError('Environment file not found')
    return
  }
  
  const content = fs.readFileSync(envPath, 'utf8')
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  
  logInfo('Current environment configuration:')
  lines.forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      const maskedValue = key.includes('KEY') || key.includes('ID') 
        ? value.substring(0, 8) + '...' 
        : value
      log(`  ${key}=${maskedValue}`, 'cyan')
    }
  })
}

// 명령어 처리
const command = process.argv[3] || 'setup'

switch (command) {
  case 'setup':
    setupEnvironment()
    break
    
  case 'validate':
    const submodulePath = path.resolve(__dirname, '..', 'KoSpot-frontend-private')
    validateEnvironment(submodulePath)
    break
    
  case 'show':
    const submodulePath2 = path.resolve(__dirname, '..', 'KoSpot-frontend-private')
    showEnvironmentInfo(submodulePath2)
    break
    
  default:
    logInfo('Usage:')
    log('  node scripts/setup-env.js <environment> [command]', 'cyan')
    log('  node scripts/setup-env.js development setup', 'cyan')
    log('  node scripts/setup-env.js staging validate', 'cyan')
    log('  node scripts/setup-env.js production show', 'cyan')
    break
}
