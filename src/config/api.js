/**
 * API配置管理
 */

// 环境配置
const config = {  development: {
    // 临时修改：开发环境也使用生产API进行测试
    apiBaseUrl: 'https://apii.wenturc.com',
    wsUrl: 'wss://apii.wenturc.com',
    // 外部API配置 - 开发环境使用代理路径
    externalApiBaseUrl: '/api/external',
    // vmoranv API配置 - 开发环境使用代理路径
    vmoranvApiBaseUrl: '/api/vmoranv'
  },
  production: {
    // 生产环境API地址 - 使用实际的API域名
    apiBaseUrl: 'https://apii.wenturc.com',
    wsUrl: 'wss://apii.wenturc.com',
    // 外部API配置 - 生产环境使用直接访问（需要目标服务器支持CORS）
    externalApiBaseUrl: 'http://43.156.74.33:8000',
    // vmoranv API配置 - 生产环境直接访问（需要目标服务器支持CORS）
    vmoranvApiBaseUrl: 'https://prompt.614447.xyz'
  },
  test: {
    // 测试环境API地址
    apiBaseUrl: 'https://apii.wenturc.com',
    wsUrl: 'wss://apii.wenturc.com',
    // 外部API配置
    externalApiBaseUrl: 'https://cors-anywhere.herokuapp.com/http://43.156.74.33:8000',
    // vmoranv API配置
    vmoranvApiBaseUrl: 'https://prompt.614447.xyz/api'
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

// 日志输出当前配置
console.log(`[API Config] 当前环境: ${getEnvironment()}`)
console.log(`[API Config] API地址: ${API_CONFIG.apiBaseUrl}`)
console.log(`[API Config] 外部API地址: ${API_CONFIG.externalApiBaseUrl}`)
console.log(`[API Config] Vmoranv API地址: ${API_CONFIG.vmoranvApiBaseUrl}`)

export default API_CONFIG 