import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { getApiBaseUrl } from '../config/api'

export const useUserStore = defineStore('user', () => {
  const username = ref('')
  const token = ref('')
  const userId = ref(null)
  const role = ref('user') // 添加角色状态
  const isServerConnected = ref(true) // 添加服务器连接状态
  
  // 计算属性：是否登录
  const isLoggedIn = computed(() => Boolean(token.value))
  
  // 计算属性：是否为管理员
  const isAdmin = computed(() => role.value === 'admin')
    // 初始化用户状态
  async function init() {
    // 从本地存储获取用户信息
    const storedToken = localStorage.getItem('user_token')
    const storedUsername = localStorage.getItem('user_name')
    const storedRole = localStorage.getItem('user_role')
    
    if (storedToken && storedUsername) {
      token.value = storedToken
      username.value = storedUsername
      role.value = storedRole || 'user' // 从本地存储恢复角色
      
      // 重要：为所有后续请求设置默认Authorization头
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        try {
        // 验证令牌有效性并获取用户信息
        const response = await axios.get(`${getApiBaseUrl()}/api/token-info`)
        userId.value = response.data.user_id
        console.log('Token验证成功，用户ID:', userId.value)
        return true
      } catch (error) {
        console.warn('Token验证失败，可能是服务器连接问题:', error.message)
        // 如果是连接错误，保持登录状态但显示警告
        if (error.code === 'ERR_CONNECTION_REFUSED' || error.code === 'ERR_NETWORK') {
          console.warn('无法连接到服务器，将在离线模式下继续')
          return true
        }
        // 如果是token无效，清除登录状态
        if (error.response && error.response.status === 401) {
          console.log('Token已过期，清除登录状态')
          logout()
          return false
        }
        return true // 其他错误情况下仍然保持登录状态
      }
    } else {
      return false
    }
  }
  // 登录
  function login(userData) {
    username.value = userData.username
    token.value = userData.access_token
    userId.value = userData.user_id || null
    role.value = userData.role || 'user' // 设置用户角色
    
    // 保存到本地存储
    localStorage.setItem('user_token', userData.access_token)
    localStorage.setItem('user_name', userData.username)
    localStorage.setItem('user_role', role.value)
    
    // 关键：为所有后续请求设置默认Authorization头
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`
  }

  // 登出
  function logout() {
    username.value = ''
    token.value = ''
    userId.value = null
    role.value = 'user'
    
    // 清除本地存储
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_role')    
    // 移除默认授权头
    delete axios.defaults.headers.common['Authorization']
  }
  
  // 改进register方法，增强错误处理
  async function register(userData) {
    try {
      // 本地验证
      if (userData.username?.length < 3) {
        throw new Error('用户名长度不能少于3个字符');
      }
      
      if (userData.password?.length < 6) {
        throw new Error('密码长度不能少于6个字符');
      }
      
      // 发送注册请求
      const response = await axios.post(`${getApiBaseUrl()}/api/register`, userData);
      
      return response.data;
    } catch (error) {
      // 增强错误处理
      if (error.response) {
        // 服务器返回错误
        if (error.response.status === 409) {
          throw new Error('该用户名已被注册');
        } else if (error.response.data?.msg) {
          throw new Error(error.response.data.msg);        } else {
          throw new Error(`服务器错误(${error.response.status})`);
        }
      } else if (error.request) {
        // 请求发出但没有收到响应
        throw new Error('服务器未响应，请检查网络连接');
      } else if (error.message) {
        // 本地验证错误或其他错误
        throw error;
      } else {
        // 未知错误
        throw new Error('注册过程中发生未知错误');
      }
    }
  }
  
  // 添加刷新令牌方法
  async function refreshTokenIfNeeded() {
    // 简单实现：检查令牌是否存在，不进行实际刷新
    return Boolean(token.value)
  }

  // 获取标准格式的 Authorization 头
  function getAuthHeader() {
    if (!token.value) return {}
    return { Authorization: `Bearer ${token.value}` }
  }
  
  // 确保所有必要的方法都被导出
  return {
    username,
    token,
    userId,
    role,
    isLoggedIn,
    isAdmin,
    init,
    login,
    logout,
    register,
    refreshTokenIfNeeded,
    getAuthHeader
  }
})
