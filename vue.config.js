// vue.config.js
const path = require('path')
const { defineConfig } = require('@vue/cli-service')

// 환경 변수 처리 - .env.local 우선 로드
const fs = require('fs')
const envLocalPath = path.resolve(__dirname, '.env.local')

// .env.local이 존재하면 해당 환경 변수들을 process.env에 수동으로 설정
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value && key.startsWith('VUE_APP_')) {
      process.env[key] = value.replace(/^["'](.*)["']$/, '$1') // 따옴표 제거
    }
  })
  console.log('Loaded .env.local variables')
}

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/app/' : '/',
  devServer: {
    hot: true,
    port: 3000,
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
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'src': path.resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.vue', '.json']
    }
  }
})
