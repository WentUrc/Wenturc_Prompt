<template>
  <div class="register-container">
    <div class="register-form-wrapper">
      <h2>注册账号</h2>
      <el-form :model="registerForm" :rules="rules" ref="registerFormRef" :label-width="isMobile ? '0px' : '100px'" :label-position="isMobile ? 'top' : 'left'">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码"></el-input>
        </el-form-item>
        
        <!-- 完全重构按钮容器结构 -->
        <el-form-item>
          <div style="width:100%; text-align:center;">
            <el-button 
              type="primary" 
              @click="submitForm" 
              :loading="loading" 
              class="submit-btn"
              style="width:240px;">
              注册
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <div class="login-link">
        已有账号？<router-link to="/login">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const registerFormRef = ref(null)
const loading = ref(false)
const windowWidth = ref(window.innerWidth)

// 响应式判断是否为移动端
const isMobile = computed(() => windowWidth.value <= 768)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 修复：将form改名为registerForm，确保模板和脚本使用相同的变量名
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// 验证密码是否一致的自定义验证规则
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '长度在 6 到 30 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const submitForm = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 修复：使用registerForm而不是未定义的form
        await userStore.register({
          username: registerForm.username,
          password: registerForm.password
        });
        
        ElMessage.success('注册成功，请登录');
        router.push('/login');
      } catch (error) {
        console.error('注册失败:', error);
        ElMessage.error(error.message || '注册失败，请稍后再试');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.register-form-wrapper {
  width: 100%;
  max-width: 500px;
  padding: 40px;
  border-radius: 16px;
  background-color: var(--card-background, #ffffff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

/* 添加渐变边框效果 */
.register-form-wrapper::before {
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
  transition: all 0.3s ease;
}

.register-form-wrapper:hover::before {
  opacity: 0.5;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--text-color, #303133);
  font-weight: 600;
  font-size: 1.8rem;
}

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

/* 完全重新定义按钮和表单项样式 */
:deep(.el-form-item:last-child) {
  /* 清除之前的flex样式 */
  display: block !important;
}

:deep(.el-form-item:last-child .el-form-item__content) {
  /* Element Plus使用该元素控制表单项内容 */
  margin-left: 0 !important; /* 覆盖默认margin */
  display: block !important;
  text-align: center !important;
}

/* 简化按钮样式，减少与Element Plus的冲突 */
.submit-btn {
  width: 240px !important;
  height: 44px !important;
  border-radius: 22px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  letter-spacing: 1px !important;
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  transition: all 0.3s ease !important;
}

.submit-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 15px rgba(var(--primary-color-rgb), 0.3) !important;
  background-color: var(--secondary-color) !important;
  border-color: var(--secondary-color) !important;
}

/* 删除干扰的样式定义 */
.btn-container,
:deep(.btn-container) {
  display: none !important;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-color-secondary, #606266);
  transition: color 0.3s ease;
}

.login-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
}

.login-link a:hover {
  color: var(--secondary-color);
  border-bottom-color: var(--secondary-color);
}

:deep(.el-form-item__error) {
  font-size: 12px;
  color: var(--error-color, #f56c6c);
  margin-top: 4px;
  transition: all 0.3s;
}

:global(.dark-mode) .register-container {
  background-color: var(--card-background, rgba(30, 41, 59, 0.7));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

:global(.dark-mode) h2 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:global(.dark-mode) .login-link {
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

:global(.dark-mode) :deep(.el-form-item__error) {
  color: var(--error-color-dark, #f89898);
}

/* 响应式设计增强 */
@media (max-width: 768px) {
  .register-container {
    padding: 25px 20px;
    margin: 30px auto;
  }
  
  .register-form-wrapper {
    padding: 30px 25px;
    max-width: unset;
    width: 100%;
    margin: 0;
  }
  
  h2 {
    font-size: 1.7rem;
    margin-bottom: 25px;
  }
  
  :deep(.el-form-item__label) {
    padding-bottom: 8px;
    font-size: 14px;
  }
  
  :deep(.el-form--label-top .el-form-item__label) {
    margin-bottom: 8px;
  }
  
  .submit-btn {
    width: 100% !important;
    height: 46px !important;
    font-size: 15px !important;
  }
  
  .login-link {
    margin-top: 20px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .register-container {
    margin: 20px auto;
    padding: 20px 15px;
  }
  
  .register-form-wrapper {
    padding: 25px 20px;
    border-radius: 12px;
  }
  
  .register-form-wrapper::before {
    border-radius: 14px;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  
  :deep(.el-input__inner) {
    height: 42px;
    font-size: 15px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 13px;
    padding-bottom: 6px;
  }
  
  .submit-btn {
    height: 42px !important;
    font-size: 14px !important;
    border-radius: 21px !important;
  }
  
  .login-link {
    margin-top: 18px;
    font-size: 12px;
  }
  
  .login-link a {
    font-size: 13px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .register-container {
    margin: 15px auto;
    padding: 15px 10px;
  }
  
  .register-form-wrapper {
    padding: 20px 15px;
  }
  
  h2 {
    font-size: 1.4rem;
    margin-bottom: 18px;
  }
  
  :deep(.el-input__inner) {
    height: 40px;
    font-size: 14px;
  }
  
  .submit-btn {
    height: 40px !important;
    font-size: 13px !important;
  }
}

/* 平板横屏适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .register-container {
    padding: 35px 25px;
  }
  
  .register-form-wrapper {
    max-width: 480px;
    padding: 35px;
  }
  
  h2 {
    font-size: 1.75rem;
  }
}
</style>
