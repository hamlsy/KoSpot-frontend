const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    hot: true,
    port: 3000, // 포트 3000으로 변경,
    publicPath: process.env.NODE_ENV === 'production' ? '/app/' : '/',
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
        'components': path.resolve(__dirname, 'src/components'),
        'views': path.resolve(__dirname, 'src/views'),
        'assets': path.resolve(__dirname, 'src/assets'),
        'router': path.resolve(__dirname, 'src/router'),
        'store': path.resolve(__dirname, 'src/store'),
        'api': path.resolve(__dirname, 'src/api'),
        'utils': path.resolve(__dirname, 'src/utils'),
        'composables': path.resolve(__dirname, 'src/composables')
      },
      extensions: ['.js', '.vue', '.json']
    }
  }
})
