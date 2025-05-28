<template>
  <el-dialog
    v-model="visible"
    :title="prompt?.title || '外部Prompt详情'"
    :width="getDialogWidth()"
    :before-close="handleClose"
    class="external-prompt-modal"
  >
    <el-skeleton :rows="8" animated v-if="loading" />
    
    <div v-else-if="!promptDetail" class="error-state">
      <el-empty description="获取外部Prompt详情失败" />
    </div>
    
    <div v-else class="external-prompt-content">
      <!-- 提示信息 -->      <el-alert
        title="外部内容提示"
        type="info"
        :closable="false"
        show-icon
        class="external-notice"
      >
        <template #default>
          <p>以下内容来自外部网站，仅供参考学习使用</p>
          <p><strong>数据来源：</strong>Jason的prompt市场</p>
        </template>
      </el-alert>
      
      <!-- Prompt 详情内容 -->
      <div class="prompt-header">
        <h3>{{ promptDetail.title }}</h3>
        <div class="meta-info">
          <el-tag :type="getTagType(promptDetail.category)" size="default">
            {{ promptDetail.category }}
          </el-tag>
          <span class="author">作者: {{ promptDetail.author || promptDetail.owner?.username || '未知作者' }}</span>
          <span class="date">创建时间: {{ formatDate(promptDetail.created_at) }}</span>
        </div>
      </div>
      
      <div class="prompt-description" v-if="promptDetail.description">
        <h4>描述</h4>
        <p>{{ promptDetail.description }}</p>
      </div>
      
      <div class="prompt-content">
        <h4>Prompt内容</h4>
        <div class="content-box">
          <pre>{{ promptDetail.content }}</pre>
        </div>
      </div>
      
      <div class="prompt-stats" v-if="promptDetail.likes !== undefined">
        <el-statistic title="点赞数" :value="promptDetail.likes" />
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="copyContent" :disabled="!promptDetail">
          复制内容
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { getApiBaseUrl } from '../config/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  prompt: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(false)
const loading = ref(false)
const promptDetail = ref(null)

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
  if (newValue && props.prompt) {
    fetchExternalPromptDetail()
  }
})

// 监听 visible 变化，同步到父组件
watch(visible, (newValue) => {
  emit('update:modelValue', newValue)
})

// 获取外部 Prompt 详情
const fetchExternalPromptDetail = async () => {
  if (!props.prompt?.id) {
    ElMessage.error('无效的Prompt ID')
    return
  }
  
  loading.value = true
  try {
    const apiBaseUrl = getApiBaseUrl()
    
    // 使用我们自己的后端代理来请求数据
    // 确保ID是数字类型
    const promptId = Number(props.prompt.id)
    if (isNaN(promptId)) {
      throw new Error('无效的Prompt ID格式')
    }
    
    const response = await axios.get(`${apiBaseUrl}/api/external/prompts/${promptId}`)
    
    if (response.data) {
      promptDetail.value = {
        ...response.data,
        // 确保必要字段
        author: response.data.owner?.username || response.data.author || '未知作者',
        category: response.data.category || '通用'
      }
      console.log('成功获取外部Prompt详情:', promptDetail.value)
    } else {
      throw new Error('外部API返回的数据格式不正确')
    }
  } catch (error) {
    console.error('获取外部Prompt详情失败:', error)
    ElMessage.error('获取外部Prompt详情失败，请稍后重试')
    promptDetail.value = null
  } finally {
    loading.value = false
  }
}

// 复制内容
const copyContent = async () => {
  if (!promptDetail.value?.content) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  try {
    await navigator.clipboard.writeText(promptDetail.value.content)
    ElMessage.success('内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  // 清理数据
  setTimeout(() => {
    promptDetail.value = null
  }, 300)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取对话框宽度（响应式）
const getDialogWidth = () => {
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 360) return '95%'
    if (window.innerWidth <= 768) return '90%'
    return '80%'
  }
  return '80%'
}

// 获取标签类型
const getTagType = (category) => {
  const typeMap = {
    '编程': 'primary',
    '写作': 'success',
    '设计': 'warning',
    '教育': 'info',
    '商业': 'danger',
    '通用': 'info'
  }
  return typeMap[category] || 'info'
}
</script>

<style scoped>
.external-notice {
  margin-bottom: 20px;
}

.external-prompt-content {
  /* 基础样式 */
}

.prompt-header {
  margin-bottom: 20px;
}

.prompt-header h3 {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 1.5em;
  font-weight: 600;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: var(--el-text-color-regular);
  font-size: 0.9em;
}

.meta-info .author,
.meta-info .date {
  color: var(--el-text-color-secondary);
}

.prompt-description {
  margin-bottom: 20px;
}

.prompt-description h4 {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 1.1em;
  font-weight: 500;
}

.prompt-description p {
  margin: 0;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.prompt-content {
  margin-bottom: 20px;
}

.prompt-content h4 {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 1.1em;
  font-weight: 500;
}

.content-box {
  padding: 20px;
  margin: 20px 0;
  border-radius: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.6;
  overflow-x: auto;
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  transition: all var(--transition-duration);
}

.content-box pre {
  font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
  margin: 0;
  white-space: pre-wrap;
  color: var(--text-color);
  line-height: 1.6;
  font-size: 1rem;
}

/* 深色模式下的内容框样式 */
:deep(.dark-mode) .content-box {
  background-color: rgba(15, 23, 42, 0.95);
  border-color: var(--border-color);
  color: rgba(255, 255, 255, 0.95);
}

:deep(.dark-mode) .content-box pre {
  color: rgba(255, 255, 255, 0.95);
}

.prompt-stats {
  margin-top: 20px;
}

.error-state {
  text-align: center;
  padding: 40px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 深色模式适配 */
.dark .content-box {
  background: var(--el-fill-color-darker);
  border-color: var(--el-border-color-darker);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .content-box {
    padding: 12px;
  }
  
  .content-box pre {
    font-size: 13px;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .dialog-footer .el-button {
    width: 100%;
    margin: 0;
  }
}

@media (max-width: 360px) {
  .external-notice {
    margin-bottom: 15px;
  }
  
  .external-notice p {
    font-size: 13px;
  }
  
  .prompt-header {
    margin-bottom: 15px;
  }
  
  .prompt-header h3 {
    font-size: 1.3em;
  }
  
  .meta-info {
    font-size: 0.8em;
  }
  
  .prompt-description {
    margin-bottom: 15px;
  }
  
  .prompt-description h4 {
    font-size: 1em;
  }
  
  .prompt-description p {
    font-size: 13px;
  }
  
  .prompt-content {
    margin-bottom: 15px;
  }
  
  .prompt-content h4 {
    font-size: 1em;
  }
  
  .content-box {
    padding: 10px;
  }
  
  .content-box pre {
    font-size: 12px;
    line-height: 1.4;
  }
}
</style>
