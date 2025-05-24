/**
 * JWT配置与工具函数
 */
import { getApiBaseUrl } from '../config/api'

// JWT配置
export const JWT_CONFIG = {
  // 应用配置
  skipValidation: true,
  
  // JWT存储键
  storageKeys: {
    token: 'user_token',
    username: 'user_name',
    expiration: 'token_expiration',
    localPrompts: 'dev-prompts' // 添加本地Prompts存储键
  },
  
  // API基础URL - 使用动态配置
  get apiBaseUrl() {
    return getApiBaseUrl()
  },
  
  // 过期时间（毫秒）：1天
  expirationTime: 86400000,
}

// 解析JWT令牌
export function parseJwt(token) {
  try {
    // 分割令牌
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // 解码payload部分
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('解析JWT令牌失败:', error);
    return null;
  }
}

// 格式化Authorization头部
export function formatAuthHeader(token) {
  if (!token) return null;
  
  // 确保token前没有多余空格
  const trimmedToken = token.trim();
  
  // 确保格式为"Bearer token"，包含空格
  if (trimmedToken.startsWith('Bearer ')) {
    return trimmedToken;
  }
  return `Bearer ${trimmedToken}`;
}

// 检查令牌是否过期
export function isTokenExpired(token) {
  // 跳过过期检查
  if (JWT_CONFIG.skipValidation) {
    return false;
  }
  
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  
  // JWT exp是秒级时间戳，需要转换为毫秒
  const expiry = payload.exp * 1000;
  const now = Date.now();
  
  return now >= expiry;
}

/**
 * 检查ID是否为本地存储的ID
 */
export function isLocalStorageId(id) {
  return id && id.toString().startsWith('dev-');
}
