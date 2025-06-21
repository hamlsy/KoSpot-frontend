// vue.config.js
const path = require('path')
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/app/' : '/',
  devServer: {
    hot: true,
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_BASE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
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
