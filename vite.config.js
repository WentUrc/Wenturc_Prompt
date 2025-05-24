import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 设置为根路径，适用于自定义域名
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // Vue核心库
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // Element Plus UI库
          'element-plus': ['element-plus'],
          // 工具库
          'utils': ['axios']
        }
      }
    },
    // 增加chunk大小警告限制到800KB
    chunkSizeWarningLimit: 800,
    // 优化构建
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true // 生产环境移除debugger
      }
    }
  },
  // 添加服务器配置
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 处理前端路由
    historyApiFallback: true
  }
})
