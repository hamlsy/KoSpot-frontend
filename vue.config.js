const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/app/' : '/',
  devServer: {
    hot: true,
    port: 3000, // 포트 3000으로 변경,
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_BASE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api': '' }  // api 접두사 제거 기능 todo 추후 서버에 api접두사 추가 후 이 줄은 제거
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
