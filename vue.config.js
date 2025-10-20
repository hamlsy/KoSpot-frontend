// vue.config.js
const path = require('path')
const { defineConfig } = require('@vue/cli-service')

// 환경 변수 처리 - submodule에서 민감정보 로드
const fs = require('fs')

// submodule에서 환경변수 로드 함수
function loadSubmoduleEnv() {
  const submodulePath = path.resolve(__dirname, 'KoSpot-frontend-private')
  const env = process.env.NODE_ENV || 'development'
  
  // 환경별 파일명 (development.env, production.env 형식)
  const envPath = path.resolve(submodulePath, `${env}.env`)
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      line = line.trim()
      // 주석이나 빈 줄 무시
      if (!line || line.startsWith('#')) return
      
      const equalIndex = line.indexOf('=')
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim()
        let value = line.substring(equalIndex + 1).trim()
        
        // 따옴표 제거
        value = value.replace(/^["'](.*)["']$/, '$1')
        
        if (key.startsWith('VUE_APP_')) {
          process.env[key] = value
        }
      }
    })
    console.log(`✅ Loaded environment variables from: ${env}.env`)
  } else {
    console.warn(`⚠️  Submodule environment file not found: ${envPath}`)
    console.warn('⚠️  Using default values.')
  }
}

// 환경변수 로드
loadSubmoduleEnv()

module.exports = defineConfig({
  transpileDependencies: true,
  // publicPath: process.env.NODE_ENV === 'production' ? '/app/' : '/',
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  devServer: {
    hot: true,
    port: 3000,
    webSocketServer: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        secure: false,
        logLevel: 'debug'
      }
    },
    client: {
      webSocketURL: 'ws://localhost:8080/ws'
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'src': path.resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.vue', '.json']
    },
    plugins: [
      new (require('html-webpack-plugin'))({
        template: 'public/index.html',
        templateParameters: {
          KAKAO_MAP_API_KEY: process.env.VUE_APP_KAKAO_MAP_API_KEY || 'your_kakao_map_api_key_here'
        }
      })
    ]
  }
})