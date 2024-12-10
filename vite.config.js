import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  test: {
    // 配置 Vitest 的选项
    environment: 'node', 
    globals: true, 
    include: ['tests/**/*.test.js'],
    coverage: {
      reporter: ['text', 'html'], // 添加覆盖率报告
      provider: 'v8', // 使用 v8 覆盖率工具
    },
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './tests'),
    },
  },
})
