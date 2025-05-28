const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    hot: true,
    port: 3000, // 포트 3000으로 변경
  },
  env: {
    'vue/setup-compiler-macros': true
  }
})
