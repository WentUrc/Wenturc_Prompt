/**
 * API配置管理 - 构建时确定环境
 */

// 在构建时就确定 API 配置
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://apii.wenturc.com'  // 生产环境
  : 'http://localhost:5000'     // 开发环境

const EXTERNAL_API_BASE_URL = import.meta.env.PROD
  ? 'https://apii.wenturc.com/api/external'
  : '/api/external'

const VMORANV_API_BASE_URL = import.meta.env.PROD
  ? 'https://apii.wenturc.com/api/vmoranv'
  : '/api/vmoranv'

const WS_URL = import.meta.env.PROD
  ? 'wss://apii.wenturc.com'
  : 'wss://localhost:5000'

// 导出 API 配置
export const API_CONFIG = {
  apiBaseUrl: API_BASE_URL,
  wsUrl: WS_URL,
  externalApiBaseUrl: EXTERNAL_API_BASE_URL,
  vmoranvApiBaseUrl: VMORANV_API_BASE_URL
}

// 导出便捷方法
export const getApiBaseUrl = () => API_BASE_URL
export const getWsUrl = () => WS_URL
export const getExternalApiBaseUrl = () => EXTERNAL_API_BASE_URL
export const getVmoranvApiBaseUrl = () => VMORANV_API_BASE_URL

// 调试信息
console.log('🔧 API配置 (构建时确定):', {
  '构建环境': import.meta.env.PROD ? 'production' : 'development',
  'API地址': API_BASE_URL,
  'WebSocket地址': WS_URL,
  '外部API地址': EXTERNAL_API_BASE_URL,
  'Vmoranv API地址': VMORANV_API_BASE_URL
})

export default API_CONFIG