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
import { install } from 'vue3-recaptcha-v2'
import { getRecaptchaSiteKey } from './config/recaptcha'

// 创建应用前设置axios默认值
axios.defaults.baseURL = getApiBaseUrl();
axios.defaults.headers.post['Content-Type'] = 'application/json';

// 添加请求拦截器记录所有请求
axios.interceptors.request.use(config => {
  console.log(`[${new Date().toISOString()}] 发送${config.method.toUpperCase()}请求到: ${config.url}`, 
    config.headers['Authorization'] ? '包含认证头' : '无认证头');
  return config;
});

// 添加响应拦截器记录所有响应
axios.interceptors.response.use(
  response => {
    console.log(`[${new Date().toISOString()}] 收到响应: ${response.status} ${response.statusText}`);
    return response;
  },
  error => {
    console.error(`[${new Date().toISOString()}] 请求错误:`, error.response?.status || error.message);
    
    // 简化401错误处理，避免动态导入
    if (error.response && error.response.status === 401) {
      console.error('认证失败，可能需要重新登录');
    }
    
    return Promise.reject(error);
  }
);

// 添加请求拦截器以增强调试
axios.interceptors.request.use(
  config => {
    // 在Authorization头部中添加一个空格，确保格式正确
    if (config.headers.Authorization && config.headers.Authorization.startsWith('Bearer') && !config.headers.Authorization.startsWith('Bearer ')) {
      config.headers.Authorization = config.headers.Authorization.replace('Bearer', 'Bearer ');
      console.log('修正了Authorization头部格式');
    }
    
    console.log(`[${new Date().toISOString()}] 发送${config.method?.toUpperCase() || 'UNKNOWN'}请求到: ${config.url}`, 
      config.headers?.Authorization ? '包含认证头' : '无认证头');
    
    return config;
  }, 
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 调试令牌拦截器
import { decodeJwt, isTokenExpired } from './utils/JwtHelper';

axios.interceptors.request.use(
  config => {
    const token = config.headers.Authorization;
    if (token && token.startsWith('Bearer ')) {
      // 检查令牌有效性
      const tokenStr = token.split(' ')[1];
      const payload = decodeJwt(tokenStr);
      
      if (payload) {
        const expired = isTokenExpired(tokenStr);
        if (expired) {
          console.warn('请求使用了已过期的令牌');
        } else {
          console.log('令牌有效，用户ID:', payload.sub);
        }
      }
    }
    return config;
  }, 
  error => Promise.reject(error)
);

// 添加请求拦截器确保每个请求都包含最新的Authorization头
axios.interceptors.request.use(
  config => {
    // 从localStorage获取最新token
    const token = localStorage.getItem('user_token')
    
    if (token) {
      // 记录请求URL和认证状态
      console.log(`[${new Date().toISOString()}] 发送${config.method.toUpperCase()}请求到: ${config.url} ${token ? '包含认证头' : '无认证头'}`)
      
      // 设置Authorization头
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.log(`[${new Date().toISOString()}] 发送${config.method.toUpperCase()}请求到: ${config.url} 无认证头`)
    }
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
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
  console.log('Main.js: 应用挂载前初始化主题');
  themeStore.initTheme()
  
  console.log('应用启动时的用户状态:', {
    isLoggedIn: userStore.isLoggedIn,
    username: userStore.username,
    tokenExists: !!userStore.token
  });
  
  // 初始化用户状态
  const success = await userStore.init();
  console.log('用户状态初始化完成:', success ? '成功' : '失效或未登录');
  
  // 挂载应用
  app.mount('#app');
};

// 添加应用初始化状态检查
const checkApiAvailability = async () => {
  try {
    console.log('检查API可用性...')
    const response = await axios.get(`${getApiBaseUrl()}/api/test`)
    console.log('API可用:', response.data)
    return true
  } catch (error) {
    console.error('API检查失败:', error.message)
    ElMessage.error('无法连接到后端服务，请确保服务已启动')
    return false
  }
}

// 在应用启动时执行
app.provide('checkApiAvailability', checkApiAvailability)
checkApiAvailability()

// 执行初始化 - 确保主题在Vue挂载前完全加载
async function startApp() {
  // 立即初始化主题，不等待其他任何内容
  console.log('App启动: 立即初始化主题');
  themeStore.initTheme();
  
  // 强制等待主题应用
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 然后初始化应用
  await initApp();
}

// 初始化 reCAPTCHA
app.use(install, {
  sitekey: getRecaptchaSiteKey(),
})

startApp();
