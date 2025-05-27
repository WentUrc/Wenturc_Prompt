/**
 * 认证相关工具函数
 */
import axios from 'axios';

/**
 * 确保token格式正确，添加Bearer前缀
 * @param {string} token - JWT令牌
 * @returns {string} 格式化后的Authorization头值
 */
export function formatAuthHeader(token) {
  if (!token) return '';
  
  // 清理可能的空格
  const trimmedToken = token.trim();
  
  // 已经有Bearer前缀
  if (trimmedToken.startsWith('Bearer ')) {
    return trimmedToken;
  }
  
  return `Bearer ${trimmedToken}`;
}

/**
 * 设置请求拦截器，确保令牌格式正确
 */
export function setupAuthInterceptor() {
  axios.interceptors.request.use(
    config => {
      const authHeader = config.headers.Authorization;
      
      if (authHeader) {
        // 确保Authorization头格式正确
        config.headers.Authorization = formatAuthHeader(authHeader);
      }
      
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
}

/**
 * 从localStorage获取用户数据
 */
export function getStoredAuth() {
  return {
    token: localStorage.getItem('user_token'),
    username: localStorage.getItem('user_name')
  };
}
