// vue.config.js
const path = require('path')
const { defineConfig } = require('@vue/cli-service')

// 환경 변수 처리 - submodule에서 민감정보 로드
const fs = require('fs')

// submodule에서 환경변수 로드 함수
function loadSubmoduleEnv() {
  const submodulePath = path.resolve(__dirname, 'KoSpot-frontend-private')
  const envPath = path.resolve(submodulePath, '.env')
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value && key.startsWith('VUE_APP_')) {
        process.env[key] = value.replace(/^["'](.*)["']$/, '$1') // 따옴표 제거
      }
    })
    console.log('✅ Loaded environment variables from submodule')
  } else {
    console.warn('⚠️  Submodule environment file not found. Using default values.')
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
