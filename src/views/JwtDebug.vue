<template>
  <div class="jwt-debug">
    <h2>JWT令牌调试工具</h2>
    
    <div class="token-info" v-if="userStore.isLoggedIn">
      <h3>当前令牌信息</h3>
      <p><strong>用户名：</strong> {{ userStore.username }}</p>
      <p><strong>令牌状态：</strong> {{ userStore.isTokenExpired ? '已过期' : '有效' }}</p>
      <p><strong>过期时间：</strong> {{ formatDate(userStore.tokenExpiration) }}</p>
      
      <el-input
        type="textarea"
        v-model="tokenDisplay"
        :rows="3"
        placeholder="令牌内容"
        readonly
      ></el-input>
      
      <div class="token-parts" v-if="decodedToken">
        <h4>令牌解码结果</h4>
        <p><strong>头部(Header)：</strong></p>
        <pre>{{ decodedToken.header }}</pre>
        
        <p><strong>载荷(Payload)：</strong></p>
        <pre>{{ decodedToken.payload }}</pre>
        
        <p><strong>签名(Signature)：</strong></p>
        <pre>{{ decodedToken.signature }}</pre>
      </div>
        <div class="actions">
        <el-button type="primary" @click="testToken">测试令牌</el-button>
        <el-button type="success" @click="testTokenInfo">测试token-info端点</el-button>
        <el-button type="warning" @click="refreshToken">刷新令牌</el-button>
        <el-button type="danger" @click="clearToken">清除令牌</el-button>
      </div>
      
      <div class="test-result" v-if="testResult">
        <h4>测试结果</h4>
        <pre>{{ testResult }}</pre>
      </div>
    </div>
    
    <div v-else class="no-token">
      <p>当前未登录，没有有效令牌</p>
      <el-button type="primary" @click="goToLogin">前往登录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import axios from 'axios'
import { getApiBaseUrl } from '../config/api'

const router = useRouter()
const userStore = useUserStore()
const testResult = ref('')

// 以安全的方式显示令牌
const tokenDisplay = computed(() => {
  if (!userStore.token) return ''
  const token = userStore.token
  const firstPart = token.substring(0, 15)
  const lastPart = token.substring(token.length - 10)
  return `${firstPart}...${lastPart}`
})

// 解码JWT令牌（仅展示，不验证签名）
const decodedToken = computed(() => {
  if (!userStore.token) return null
  try {
    const parts = userStore.token.split('.')
    if (parts.length !== 3) return null
    
    return {
      header: JSON.stringify(JSON.parse(atob(parts[0])), null, 2),
      payload: JSON.stringify(JSON.parse(atob(parts[1])), null, 2),
      signature: parts[2]
    }
  } catch (e) {
    console.error('解析令牌失败:', e)
    return null
  }
})

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown'
  return new Date(parseInt(timestamp)).toLocaleString()
}

// 测试令牌是否有效
const testToken = async () => {
  if (!userStore.token) {
    testResult.value = '没有令牌可测试'
    return
  }
  
  testResult.value = '测试中...'
  try {
    const response = await axios({
      method: 'get',
      url: `${getApiBaseUrl()}/api/auth-test`,
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    testResult.value = JSON.stringify(response.data, null, 2)
  } catch (error) {
    testResult.value = `测试失败: ${error.message}\n`
    if (error.response) {
      testResult.value += `状态码: ${error.response.status}\n`
      testResult.value += `响应数据: ${JSON.stringify(error.response.data, null, 2)}`
    }
  }
}

// 测试token-info端点
const testTokenInfo = async () => {
  if (!userStore.token) {
    testResult.value = '没有令牌可测试'
    return
  }
  
  testResult.value = '测试token-info端点...'
  try {
    const response = await axios({
      method: 'get',
      url: `${getApiBaseUrl()}/api/token-info`,
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    
    testResult.value = `Token-Info端点测试成功:\n${JSON.stringify(response.data, null, 2)}`
  } catch (error) {
    testResult.value = `Token-Info端点测试失败: ${error.message}\n`
    if (error.response) {
      testResult.value += `状态码: ${error.response.status}\n`
      testResult.value += `响应数据: ${JSON.stringify(error.response.data, null, 2)}`
    }
  }
}

// 刷新令牌（实际应用中需要后端支持）
const refreshToken = () => {
  testResult.value = '此功能需要后端支持刷新令牌API'
}

// 清除令牌
const clearToken = () => {
  userStore.logout()
  testResult.value = '令牌已清除'
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 页面加载时尝试解析令牌
onMounted(() => {
  if (userStore.token) {
    console.log('正在调试令牌:', tokenDisplay.value)
  }
})
</script>

<style scoped>
.jwt-debug {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2, h3, h4 {
  margin-bottom: 16px;
}

.token-info, .no-token {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 20px;
  margin-top: 20px;
}

.token-parts {
  margin-top: 20px;
}

pre {
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.actions {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.test-result {
  margin-top: 20px;
}
</style>
