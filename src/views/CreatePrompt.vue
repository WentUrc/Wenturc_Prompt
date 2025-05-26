<template>
  <div class="create-prompt">
    <h2>创建新Prompt</h2>
    
    <el-form :model="promptForm" :rules="rules" ref="promptFormRef" :label-width="isMobile ? '0px' : '100px'" :label-position="isMobile ? 'top' : 'left'">
      <el-form-item label="标题" prop="title">
        <el-input v-model="promptForm.title" placeholder="请输入Prompt标题"></el-input>
      </el-form-item>
      
      <el-form-item label="类别" prop="category">
        <el-select v-model="promptForm.category" placeholder="选择类别">
          <el-option v-for="category in categories" :key="category" :label="category" :value="category"></el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="内容" prop="content">
        <el-input 
          v-model="promptForm.content" 
          type="textarea" 
          :rows="10" 
          placeholder="请输入Prompt内容"
        ></el-input>
      </el-form-item>
      
      <el-form-item>
        <div class="button-group">
          <el-button type="primary" @click="submitForm" :loading="loading" class="submit-button">发布</el-button>
          <el-button @click="resetForm" class="reset-button">重置</el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { formatAuthHeader } from '../utils/JwtConfig'
import { getApiBaseUrl } from '../config/api'

const router = useRouter()
const userStore = useUserStore()
const promptFormRef = ref(null)
const loading = ref(false)
const categories = ref(['编程', '写作', '设计', '教育', '商业', '通用'])
const windowWidth = ref(window.innerWidth)

// 响应式判断是否为移动端
const isMobile = computed(() => windowWidth.value <= 768)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// 移除开发模式变量或将其设置为false
const isDevelopment = ref(false) // 关闭本地存储模式

// 在组件挂载时验证用户是否已登录
onMounted(async () => {  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再创建Prompt')
    router.push('/login')
    return
  }
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 清理窗口大小变化监听
  window.removeEventListener('resize', handleResize)
})

const promptForm = reactive({
  title: '',
  category: '通用',
  content: ''
})

const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 3, max: 100, message: '标题长度应在3到100个字符之间', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择类别', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入Prompt内容', trigger: 'blur' },
    { min: 10, message: '内容长度不能少于10个字符', trigger: 'blur' }
  ]
}

const submitForm = async () => {
  if (!promptFormRef.value) return
  
  // 检查登录状态
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再创建Prompt')
    router.push('/login')
    return
  }
  
  // 输出当前令牌状态用于调试
  console.log('=========== 提交前令牌状态 ===========')
  console.log('isLoggedIn:', userStore.isLoggedIn)
  console.log('token存在:', Boolean(userStore.token))
  console.log('token预览:', userStore.token ? userStore.token.substring(0, 15) + '...' : '无')
  console.log('全局认证头:', axios.defaults.headers.common['Authorization'])
  console.log('======================================')
  
  await promptFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const payload = {
          title: promptForm.title.trim(),
          content: promptForm.content.trim(),
          category: promptForm.category
        }
        
        console.log('请求头:', {
          'Authorization': `Bearer ${userStore.token}`,
          'Content-Type': 'application/json'
        })
        console.log('请求数据:', payload)
        
        // 重要：使用完全手动配置的请求而不是依赖全局设置
        const response = await axios({
          method: 'post',
          url: `${getApiBaseUrl()}/api/prompts`,
          headers: {
            'Authorization': `Bearer ${userStore.token}`,
            'Content-Type': 'application/json'
          },
          data: payload,          // 添加调试信息和更长的超时
          timeout: 10000,
          validateStatus: status => {
            return status >= 200 && status < 300
          }        })
        
        // 清空表单
        resetForm()
          ElMessage.success('Prompt创建成功')
        router.push('/prompts')
      } catch (error) {
        
        if (error.response) {
          
          if (error.response.status === 401) {
            
            // 尝试重新获取令牌并重试，而不是直接登出
            try {
              const refreshSuccess = await userStore.refreshTokenIfNeeded()
              if (refreshSuccess) {
                ElMessage.info('会话已更新，请重试')
                return
              }            } catch (refreshError) {
            }
            
            ElMessage.error('登录状态已过期，请重新登录')
            userStore.logout()
            router.push('/login')
            return
          }
            ElMessage.error(`创建失败: ${error.response.data.msg || '服务器错误'}`)
        } else if (error.request) {
          ElMessage.error('服务器未响应，请检查网络连接或后端服务状态')
        } else {
          ElMessage.error(`请求出错: ${error.message}`)
        }
      } finally {
        loading.value = false
      }
    }
  })
}

const resetForm = () => {
  if (promptFormRef.value) {
    promptFormRef.value.resetFields()
  }
}


</script>

<style scoped>
.create-prompt {
  max-width: 800px;
  margin: 30px auto;
  padding: 40px;
  background-color: var(--card-background, #fff);
  color: var(--text-color, #303133);
  border-radius: 16px;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

/* 添加渐变边框效果 */
.create-prompt::before {
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

.create-prompt:hover::before {
  opacity: 0.5;
}

h2 {
  margin-bottom: 30px;
  text-align: center;
  color: var(--text-color, #303133);
  font-size: 1.8rem;
  font-weight: 600;
}

/* 美化表单元素 */
:deep(.el-form-item__label) {
  color: var(--text-color, #303133);
  font-weight: 500;
  transition: color 0.3s ease;
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
  color: var(--text-color, #303133);
  transition: color 0.3s ease;
}

:deep(.el-textarea__inner) {
  border-radius: 10px;
  transition: all 0.3s ease;
  min-height: 200px;
  background-color: var(--background-color, #fff);
  color: var(--text-color, #303133);
  line-height: 1.6;
  font-family: 'Courier New', monospace;
  padding: 12px;
  box-shadow: 0 0 0 1px var(--border-color, #dcdfe6) inset;
}

:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

/* 美化表单按钮 */
:deep(.el-form-item:last-child) {
  margin-bottom: 0;
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

/* 按钮组样式 */
.button-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  width: 100%;
}

:deep(.el-button) {
  border-radius: 30px !important;
  padding: 12px 30px !important;
  transition: all 0.3s ease;
  font-weight: 500;
  letter-spacing: 1px;
}

:deep(.el-button--primary) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(var(--primary-color-rgb), 0.3);
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
}

:deep(.el-button--default) {
  margin-left: 20px;
}

:deep(.el-button--default:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

/* 下拉选择框样式 - 增强圆角一致性 */
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--border-color, #dcdfe6) inset !important;
  border-radius: 10px !important; /* 确保与其他输入框一致的圆角 */
  overflow: hidden;
}

:deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

/* 强制设置下拉菜单及其所有子元素的圆角 */
:deep(.el-select-dropdown) {
  border-radius: 10px !important; /* 与输入框保持一致的圆角 */
  overflow: hidden !important;
  margin-top: 5px !important;
  border: 1px solid var(--border-color, #dcdfe6) !important;
}

:deep(.el-select-dropdown .el-scrollbar__view) {
  border-radius: 10px !important;
  overflow: hidden !important;
}

:deep(.el-popper.el-select__popper),
:deep(.el-popper[role=tooltip]) {
  border-radius: 10px !important;
  overflow: hidden !important;
}

/* 强化所有下拉菜单和工具提示的圆角一致性 */
:deep(.el-select-dropdown),
:deep(.el-tooltip__popper),
:deep(.el-select__popper),
:deep(.el-popper),
:global(.el-select__popper),
:global(.el-tooltip__popper),
:global(.el-popover) {
  border-radius: 10px !important;
  overflow: hidden !important;
}

/* 确保工具提示的圆角与其他元素一致 */
:deep([role="tooltip"]),
:global([role="tooltip"]) {
  border-radius: 10px !important;
  overflow: hidden !important;
}

/* 强制下拉菜单相关的所有元素圆角一致 */
:deep(.el-tooltip__trigger .el-tooltip__popper),
:deep(.el-select .el-tooltip__popper),
:global(.el-select-dropdown.el-popper),
:global(.el-tooltip__popper) {
  border-radius: 10px !important;
  margin-top: 5px !important;
}

/* 使用更高特异性覆盖Element Plus默认样式 */
html body .el-popper.is-pure,
html body .el-tooltip__popper,
html body .el-select-dropdown {
  border-radius: 10px !important;
}

/* 确保深色模式下工具提示样式也正确 */
:global(.dark-mode) :deep(.el-tooltip__popper),
:global(.dark-mode) :deep([role="tooltip"]),
:global(.dark-mode) .el-tooltip__popper {
  background-color: var(--background-color-dark, #1f2937) !important;
  border-color: var(--border-color-dark, #4b5563) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
}

/* 深色模式移动端优化 */
:global(.dark-mode) .create-prompt {
  background-color: var(--card-background, rgba(30, 41, 59, 0.7));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

:global(.dark-mode) h2 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:global(.dark-mode) :deep(.el-form-item__label) {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.9));
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

:global(.dark-mode) :deep(.el-textarea__inner) {
  background-color: rgba(15, 23, 42, 0.6);
  color: var(--text-color-dark, rgba(255, 255, 255, 0.9));
  box-shadow: 0 0 0 1px var(--border-color-dark, #4b5563) inset !important;
}

:global(.dark-mode) :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

:global(.dark-mode) :deep(.el-textarea__inner::placeholder) {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.5));
}

/* 响应式设计增强 */
@media (max-width: 768px) {
  .create-prompt {
    padding: 30px 25px;
    margin: 25px 20px;
    max-width: unset;
  }
  
  h2 {
    font-size: 1.7rem;
    margin-bottom: 25px;
  }
  
  :deep(.el-form-item__label) {
    padding-bottom: 8px;
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  :deep(.el-textarea__inner) {
    min-height: 180px;
    font-size: 15px;
  }
  
  :deep(.el-input__inner) {
    height: 46px;
    font-size: 15px;
  }
  
  :deep(.el-form-item:last-child) {
    margin-top: 25px;
    flex-direction: column;
    gap: 12px;
  }
  
  /* 移动端按钮组垂直排列 */
  .button-group {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  :deep(.el-button) {
    width: 100%;
    height: 46px !important;
    font-size: 15px !important;
    margin-left: 0 !important;
  }
}

@media (max-width: 480px) {
  .create-prompt {
    padding: 25px 20px;
    margin: 20px 15px;
    border-radius: 12px;
  }
  
  .create-prompt::before {
    border-radius: 14px;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 13px;
    padding-bottom: 6px;
    margin-bottom: 6px;
  }
  
  :deep(.el-input__inner) {
    height: 42px;
    font-size: 14px;
  }
  
  :deep(.el-textarea__inner) {
    min-height: 160px;
    font-size: 14px;
    padding: 10px;
  }
  
  :deep(.el-button) {
    height: 42px !important;
    font-size: 14px !important;
    border-radius: 21px !important;
  }
  
  :deep(.el-form-item:last-child) {
    margin-top: 20px;
    gap: 10px;
  }
  
  /* 480px移动端按钮组 */
  .button-group {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  .create-prompt {
    padding: 20px 15px;
    margin: 15px 10px;
  }
  
  h2 {
    font-size: 1.4rem;
    margin-bottom: 18px;
  }
  
  :deep(.el-input__inner) {
    height: 40px;
    font-size: 13px;
  }
  
  :deep(.el-textarea__inner) {
    min-height: 140px;
    font-size: 13px;
  }
  
  :deep(.el-button) {
    height: 40px !important;
    font-size: 13px !important;
  }
  
  :deep(.el-form-item__label) {
    font-size: 12px;
  }
  
  /* 360px移动端按钮组 */
  .button-group {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}

/* 平板横屏适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .create-prompt {
    max-width: 700px;
    padding: 35px 30px;
    margin: 30px auto;
  }
  
  h2 {
    font-size: 1.75rem;
  }
  
  :deep(.el-textarea__inner) {
    min-height: 180px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1200px) {
  .create-prompt {
    max-width: 900px;
    padding: 45px 50px;
  }
  
  h2 {
    font-size: 2rem;
  }
  
  :deep(.el-textarea__inner) {
    min-height: 220px;
  }
}
</style>
