import axios from 'axios';
import { JWT_CONFIG, formatAuthHeader } from '../utils/JwtConfig';
import { getApiBaseUrl } from '../config/api';
import { useUserStore } from '../stores/user';

// 创建API服务
const apiService = {
  // 基础URL - 使用动态配置
  get baseURL() {
    return getApiBaseUrl()
  },
  
  // 设置请求头
  getHeaders(requireAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (requireAuth) {
      const store = useUserStore();
      if (store.token) {
        headers['Authorization'] = formatAuthHeader(store.token);
      }
    }
    
    return headers;
  },
  
  // GET请求
  async get(endpoint, requireAuth = true) {
    return axios({
      method: 'get',
      url: `${this.baseURL}${endpoint}`,
      headers: this.getHeaders(requireAuth)
    });
  },
  
  // POST请求
  async post(endpoint, data, requireAuth = true) {
    return axios({
      method: 'post',
      url: `${this.baseURL}${endpoint}`,
      data,
      headers: this.getHeaders(requireAuth)
    });
  },
  
  // PUT请求
  async put(endpoint, data, requireAuth = true) {
    return axios({
      method: 'put',
      url: `${this.baseURL}${endpoint}`,
      data,
      headers: this.getHeaders(requireAuth)
    });
  },
  
  // DELETE请求
  async delete(endpoint, requireAuth = true) {
    return axios({
      method: 'delete',
      url: `${this.baseURL}${endpoint}`,
      headers: this.getHeaders(requireAuth)
    });
  }
};

export default apiService;
