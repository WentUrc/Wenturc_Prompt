/**
 * API配置管理
 */

// 环境配置
const config = {  development: {
    // 临时修改：开发环境也使用生产API进行测试
    apiBaseUrl: 'https://apii.wenturc.com',
    wsUrl: 'wss://apii.wenturc.com',
    // 外部API配置 - 开发环境使用代理路径
    externalApiBaseUrl: '/api/external'
  },
  production: {
    // 生产环境API地址 - 使用实际的API域名
    apiBaseUrl: 'https://apii.wenturc.com',
    wsUrl: 'wss://apii.wenturc.com',
    // 外部API配置 - 生产环境直接访问
    externalApiBaseUrl: 'http://43.156.74.33:8000'
  },
  test: {
    // 测试环境API地址
    apiBaseUrl: 'https://apii.wenturc.com',
    wsUrl: 'wss://apii.wenturc.com',
    // 外部API配置
    externalApiBaseUrl: 'http://43.156.74.33:8000'
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

// 日志输出当前配置
console.log(`[API Config] 当前环境: ${getEnvironment()}`)
console.log(`[API Config] API地址: ${API_CONFIG.apiBaseUrl}`)

export default API_CONFIG 