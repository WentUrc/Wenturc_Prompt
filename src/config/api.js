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
  // 支持Vite环境变量
  if (import.meta.env.VITE_APP_ENV) {
    return import.meta.env.VITE_APP_ENV
  }
  
  // 支持NODE_ENV
  if (import.meta.env.NODE_ENV) {
    return import.meta.env.NODE_ENV
  }
  
  // 默认开发环境
  return 'development'
}

// 获取当前环境配置
const getCurrentConfig = () => {
  const env = getEnvironment()
  return config[env] || config.development
}

// 导出API配置
export const API_CONFIG = getCurrentConfig()

// 导出便捷方法
export const getApiBaseUrl = () => API_CONFIG.apiBaseUrl
export const getWsUrl = () => API_CONFIG.wsUrl
export const getExternalApiBaseUrl = () => API_CONFIG.externalApiBaseUrl
export const getVmoranvApiBaseUrl = () => API_CONFIG.vmoranvApiBaseUrl

export default API_CONFIG