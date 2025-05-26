import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus' // 添加ElMessage导入
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import './assets/theme.css'  // 引入主题样式

import axios from 'axios'
import { useThemeStore } from './stores/theme'
import { setupAuthInterceptor } from './utils/auth'
import { getApiBaseUrl } from './config/api' // 引入API配置

// 创建应用前设置axios默认值
axios.defaults.baseURL = getApiBaseUrl();
axios.defaults.headers.post['Content-Type'] = 'application/json';

// 添加请求拦截器确保每个请求都包含最新的Authorization头
axios.interceptors.request.use(
  config => {
    // 从localStorage获取最新token
    const token = localStorage.getItem('user_token')
    
    if (token) {
      // 设置Authorization头
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 在应用挂载前同步初始化主题
const themeStore = useThemeStore()

// 初始化用户状态和令牌 - 必须在app.use(pinia)之后
import { useUserStore } from './stores/user'
const userStore = useUserStore()

// 设置认证拦截器
setupAuthInterceptor();

// 初始化用户状态时使用async/await
const initApp = async () => {
  // 在应用挂载前立即初始化主题
  themeStore.initTheme()
  
  // 初始化用户状态
  const success = await userStore.init();
  
  // 挂载应用
  app.mount('#app');
};

// 执行初始化 - 确保主题在Vue挂载前完全加载
async function startApp() {
  // 立即初始化主题，不等待其他任何内容
  themeStore.initTheme();
  
  // 强制等待主题应用
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 然后初始化应用
  await initApp();
}

startApp();
