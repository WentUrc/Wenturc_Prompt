/**
 * API配置管理
 */

// 环境配置
const config = {  development: {
    // 修复：使用localhost替代0.0.0.0解决CORS问题
    apiBaseUrl: 'http://localhost:5000',
    wsUrl: 'wss://localhost:5000',
    // 外部API配置 - 开发环境使用代理路径
    externalApiBaseUrl: '/api/external',
    // vmoranv API配置 - 开发环境使用代理路径
    vmoranvApiBaseUrl: '/api/vmoranv'
  },
  production: {
    // 生产环境API地址 - 使用实际的API域名
    apiBaseUrl: 'https://apii.wenturc.com',
    wsUrl: 'wss://apii.wenturc.com',
    // 外部API配置 - 生产环境也使用代理
    externalApiBaseUrl: 'https://apii.wenturc.com/api/external',
    // vmoranv API配置 - 生产环境也使用代理
    vmoranvApiBaseUrl: 'https://apii.wenturc.com/api/vmoranv'
  },
  test: {
    // 测试环境API地址
    apiBaseUrl: 'https://apii.wenturc.com',
    wsUrl: 'wss://apii.wenturc.com',
    // 外部API配置
    externalApiBaseUrl: 'https://apii.wenturc.com/api/external',
    // vmoranv API配置
    vmoranvApiBaseUrl: 'https://apii.wenturc.com/api/vmoranv'
  }
}

// 获取当前环境
const getEnvironment = () => {
  // 优先级1: 显式设置的VITE_APP_ENV环境变量
  if (import.meta.env.VITE_APP_ENV) {
    return import.meta.env.VITE_APP_ENV
  }
  
  // 优先级2: Vite的PROD标识（这是最可靠的构建时环境标识）
  if (import.meta.env.PROD) {
    return 'production'
  }
  
  // 优先级3: NODE_ENV环境变量
  if (import.meta.env.NODE_ENV === 'production') {
    return 'production'
  }
  
  // 优先级4: 检查特定的部署平台环境变量
  if (import.meta.env.VERCEL || import.meta.env.NETLIFY || import.meta.env.GITHUB_ACTIONS) {
    return 'production'
  }
  
  // 优先级5: 运行时域名检测（作为最后的备选方案）
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname.includes('wenturc.com') || 
        hostname.includes('vercel.app') || 
        hostname.includes('netlify.app') || 
        hostname.includes('github.io')) {
      return 'production'
    }
  }
  
  // 默认开发环境
  return 'development'
}

// 获取当前环境配置
const getCurrentConfig = () => {
  const env = getEnvironment()
  const selectedConfig = config[env] || config.development
  
  // 调试信息（总是显示，方便排查问题）
  if (typeof window !== 'undefined') {
    console.log('🔧 API配置调试信息:', {
      '检测到的环境': env,
      'VITE_APP_ENV': import.meta.env.VITE_APP_ENV,
      'NODE_ENV': import.meta.env.NODE_ENV,
      'PROD': import.meta.env.PROD,
      'VERCEL': import.meta.env.VERCEL,
      'NETLIFY': import.meta.env.NETLIFY,
      'GITHUB_ACTIONS': import.meta.env.GITHUB_ACTIONS,
      '当前域名': window.location.hostname,
      '使用的API地址': selectedConfig.apiBaseUrl
    })
  }
  
  return selectedConfig
}

// 导出API配置
export const API_CONFIG = getCurrentConfig()

// 导出便捷方法
export const getApiBaseUrl = () => API_CONFIG.apiBaseUrl
export const getWsUrl = () => API_CONFIG.wsUrl
export const getExternalApiBaseUrl = () => API_CONFIG.externalApiBaseUrl
export const getVmoranvApiBaseUrl = () => API_CONFIG.vmoranvApiBaseUrl

export default API_CONFIG