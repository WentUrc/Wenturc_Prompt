import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 获取当前部署环境
const getDeploymentEnv = () => {
  if (process.env.VERCEL) {
    return 'vercel'
  }
  if (process.env.GITHUB_ACTIONS) {
    return 'github'
  }
  return 'local'
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 使用根路径，因为已经绑定了自定义域名
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
  },  // 添加服务器配置
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 处理前端路由
    historyApiFallback: true,    // 添加代理配置解决CORS问题
    proxy: {
      '/api/external': {
        target: 'http://43.156.74.33:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/external/, '/api/v1'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      },      // 新增：vmoranv的prompt市场API代理
      '/api/vmoranv': {
        target: 'https://prompt.614447.xyz',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/vmoranv/, '/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('vmoranv API proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to vmoranv API:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from vmoranv API:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
