/**
 * JWT辅助工具，用于调试和管理JWT令牌
 */

/**
 * 解码JWT令牌的有效部分（不验证签名）
 * @param {string} token JWT令牌
 * @returns {Object|null} 解码后的payload部分，解码失败返回null
 */
export function decodeJwt(token) {
  try {
    if (!token) return null;
    
    // 移除Bearer前缀
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }
    
    // 分割JWT的三个部分
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('无效的JWT格式');
      return null;
    }
    
    // 解码payload部分
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch (error) {
    console.error('JWT解码失败:', error);
    return null;
  }
}

/**
 * 检查令牌是否已过期
 * @param {string} token JWT令牌
 * @returns {boolean} 是否已过期
 */
export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) return true;
  
  const expTime = payload.exp * 1000; // 转换为毫秒
  const currentTime = Date.now();
  
  console.log('令牌信息:', {
    过期时间: new Date(expTime).toLocaleString(),
    当前时间: new Date(currentTime).toLocaleString(),
    剩余时间: `${Math.floor((expTime - currentTime) / 60000)}分钟`
  });
  
  return currentTime > expTime;
}

/**
 * 格式化JWT令牌（确保Bearer前缀）
 */
export function formatToken(token) {
  if (!token) return '';
  token = token.trim();
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

/**
 * 从存储中恢复JWT并更新axios默认头
 */
export function restoreJwtFromStorage() {
  const token = localStorage.getItem('user_token');
  if (token) {
    const axios = require('axios');
    axios.defaults.headers.common['Authorization'] = formatToken(token);
    return true;
  }
  return false;
}
