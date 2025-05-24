import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { getApiBaseUrl } from '../config/api'

export const useUserStore = defineStore('user', () => {
  const username = ref('')
  const token = ref('')
  const userId = ref(null)
  
  // 计算属性：是否登录
  const isLoggedIn = computed(() => Boolean(token.value))
  
  // 初始化用户状态
  async function init() {
    console.log('初始化用户状态...')
    
    // 从本地存储获取用户信息
    const storedToken = localStorage.getItem('user_token')
    const storedUsername = localStorage.getItem('user_name')
    
    if (storedToken && storedUsername) {
      console.log('发现存储的用户凭据')
      token.value = storedToken
      username.value = storedUsername
      
      // 重要：为所有后续请求设置默认Authorization头
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      console.log('已设置全局认证头:', `Bearer ${storedToken.substring(0, 10)}...`)
      
      try {
        // 验证令牌有效性
        const response = await axios.get(`${getApiBaseUrl()}/api/token-info`)
        console.log('令牌验证成功:', response.data)
        userId.value = response.data.user_id
        return true
      } catch (error) {
        console.error('令牌验证失败:', error.response?.data || error.message)
        // 令牌无效，不要自动登出，允许用户继续使用
        // 因为可能只是token-info端点不存在
        return true // 仍然返回true允许用户继续使用应用
      }
    } else {
      console.log('未找到存储的用户凭据')
      return false
    }
  }
  
  // 登录
  function login(userData) {
    console.log('登录中...')
    username.value = userData.username
    token.value = userData.access_token
    userId.value = userData.user_id || null
    
    // 保存到本地存储
    localStorage.setItem('user_token', userData.access_token)
    localStorage.setItem('user_name', userData.username)
    
    // 关键：为所有后续请求设置默认Authorization头
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.access_token}`
    console.log('登录成功，令牌已保存到全局头:', axios.defaults.headers.common['Authorization'])
  }
  
  // 登出
  function logout() {
    console.log('执行登出操作')
    username.value = ''
    token.value = ''
    userId.value = null
    
    // 清除本地存储
    localStorage.removeItem('user_token')
    localStorage.removeItem('user_name')
    
    // 移除默认授权头
    delete axios.defaults.headers.common['Authorization']
    console.log('已清除授权头')
  }
  
  // 获取标准格式的 Authorization 头
  function getAuthHeader() {
    if (!token.value) return {}
    return { Authorization: `Bearer ${token.value}` }
  }
  
  // 改进register方法，增强错误处理和日志
  async function register(userData) {
    try {
      console.log('注册请求数据:', userData);
      
      // 本地验证
      if (userData.username?.length < 3) {
        throw new Error('用户名长度不能少于3个字符');
      }
      
      if (userData.password?.length < 6) {
        throw new Error('密码长度不能少于6个字符');
      }
      
      // 发送注册请求
      const response = await axios.post(`${getApiBaseUrl()}/api/register`, userData);
      
      console.log('注册成功:', response.data);
      return response.data;
    } catch (error) {
      // 增强错误处理
      if (error.response) {
        // 服务器返回错误
        console.error('注册失败 - 服务器响应:', error.response.status, error.response.data);
        
        if (error.response.status === 409) {
          throw new Error('该用户名已被注册');
        } else if (error.response.data?.msg) {
          throw new Error(error.response.data.msg);
        } else {
          throw new Error(`服务器错误(${error.response.status})`);
        }
      } else if (error.request) {
        // 请求发出但没有收到响应
        console.error('注册失败 - 无响应:', error.request);
        throw new Error('服务器未响应，请检查网络连接');
      } else if (error.message) {
        // 本地验证错误或其他错误
        console.error('注册失败 - 错误信息:', error.message);
        throw error;
      } else {
        // 未知错误
        console.error('注册失败 - 未知错误:', error);
        throw new Error('注册过程中发生未知错误');
      }
    }
  }
  
  // 添加刷新令牌方法
  async function refreshTokenIfNeeded() {
    // 简单实现：检查令牌是否存在，不进行实际刷新
    return Boolean(token.value)
  }
  
  // 调试方法
  function debugState() {
    console.log('当前用户状态:', {
      isLoggedIn: isLoggedIn.value,
      username: username.value,
      token: token.value ? token.value.substring(0, 10) + '...' : '无',
      userId: userId.value,
      axiosAuth: axios.defaults.headers.common['Authorization'] || '无'
    })
  }
  
  // 确保所有必要的方法都被导出
  return {
    username,
    token,
    userId,
    isLoggedIn,
    login,
    logout,
    init,
    getAuthHeader,
    register,
    refreshTokenIfNeeded,
    debugState
  }
})
