<template>
  <div class="login-container">
    <h2>登录</h2>
    <el-form 
      :model="loginForm" 
      :rules="rules" 
      ref="loginFormRef"
      @keyup.enter="submitForm"
    >
      <el-form-item prop="username">
        <el-input 
          v-model="loginForm.username" 
          placeholder="用户名"
          prefix-icon="User"
          @keyup.enter="focusPassword"
        ></el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input 
          v-model="loginForm.password" 
          :type="showPassword ? 'text' : 'password'" 
          placeholder="密码"
          prefix-icon="Lock"
          ref="passwordInput"
        >
          <template #suffix>
            <el-icon 
              class="password-toggle" 
              @click="togglePasswordVisibility"
              :class="{ 'is-visible': showPassword }"
            >
              <View v-if="showPassword" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="loading" class="submit-btn">登录</el-button>
      </el-form-item>
    </el-form>
    <div class="register-link">
      还没有账号？<router-link to="/register">立即注册</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'
import { getApiBaseUrl } from '../config/api'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref(null)
const passwordInput = ref(null)
const loading = ref(false)
const showPassword = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ]
}

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 聚焦密码输入框
const focusPassword = () => {
  passwordInput.value?.focus()
}

const submitForm = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        ElMessage.info('正在发送登录请求...')
        
        const response = await axios.post(`${getApiBaseUrl()}/api/login`, {
          username: loginForm.username,
          password: loginForm.password
        })
        
        // 保存用户数据到状态管理
        userStore.login({
          username: response.data.username,
          access_token: response.data.access_token,
          user_id: response.data.user_id,
          role: response.data.role  // 添加角色信息
        })
        
        ElMessage.success('登录成功')
        router.push('/')
      } catch (error) {
        console.error('登录失败:', error)
        
        if (error.response) {
          const errorMsg = error.response.data?.msg || error.response.statusText || '服务器错误'
          ElMessage.error(`登录失败: ${errorMsg}`)
        } else if (error.request) {
          ElMessage.error('服务器连接失败，请检查后端服务是否运行')
        } else {
          ElMessage.error(`请求出错: ${error.message}`)
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 60px auto;
  padding: 40px;
  background-color: var(--card-background, #fff);
  border-radius: 16px;
  position: relative;
  z-index: 1;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 添加渐变边框效果 */
.login-container::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(
    135deg, 
    var(--primary-color), 
    var(--secondary-color) 50%,
    var(--accent-color, #67c23a) 100%
  );
  border-radius: 18px;
  z-index: -1;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.login-container:hover::before {
  opacity: 0.5;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--text-color, #303133);
  font-weight: 600;
  font-size: 1.8rem;
}

/* 美化表单元素 */
:deep(.el-input__wrapper) {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 1px var(--border-color, #dcdfe6) inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

:deep(.el-input__inner) {
  height: 44px;
  color: var(--text-color, #303133);
  transition: color 0.3s ease;
}

/* 提交按钮样式 */
.submit-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px !important;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  transition: all 0.3s ease;
  margin-top: 10px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(var(--primary-color-rgb), 0.3);
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
}

/* 注册链接样式 */
.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-color-secondary, #606266);
  transition: color 0.3s ease;
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
}

.register-link a:hover {
  color: var(--secondary-color);
  border-bottom-color: var(--secondary-color);
}

/* 深色模式适配 */
:global(.dark-mode) .login-container {
  background-color: var(--card-background, rgba(30, 41, 59, 0.7));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

:global(.dark-mode) h2 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:global(.dark-mode) .register-link {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

:global(.dark-mode) :deep(.el-input__wrapper) {
  background-color: rgba(15, 23, 42, 0.6);
  box-shadow: 0 0 0 1px var(--border-color-dark, #4b5563) inset !important;
}

:global(.dark-mode) :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

:global(.dark-mode) :deep(.el-input__inner) {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.9));
  background-color: transparent;
}

:global(.dark-mode) :deep(.el-input__inner::placeholder) {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.5));
}

/* 响应式设计增强 */
@media (max-width: 480px) {
  .login-container {
    margin: 40px auto;
    padding: 30px 20px;
    width: 90%;
  }
  
  h2 {
    font-size: 1.6rem;
    margin-bottom: 20px;
  }
  
  .submit-btn {
    height: 40px;
  }
}

/* 密码可见性切换按钮样式 */
.password-toggle {
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-color-secondary, #909399);
}

.password-toggle:hover {
  color: var(--primary-color);
}

.password-toggle.is-visible {
  color: var(--primary-color);
}

/* 深色模式适配 */
:global(.dark-mode) .password-toggle {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

:global(.dark-mode) .password-toggle:hover,
:global(.dark-mode) .password-toggle.is-visible {
  color: var(--primary-color-light, #79bbff);
}

/* 开发模式提示样式 */
.dev-mode-notice {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.dev-notice {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.dev-notice .el-alert__content) {
  justify-content: center;
}

/* 深色模式适配 */
:global(.dark-mode) .dev-notice {
  background-color: var(--el-color-info-dark);
  color: var(--el-color-white);
}
</style>
