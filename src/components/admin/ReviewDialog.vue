<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    :before-close="handleClose"
  >
    <div class="review-dialog" v-if="submission">
      <!-- 作品信息 -->
      <div class="submission-info">
        <el-descriptions title="作品信息" :column="2" border>
          <el-descriptions-item label="标题">
            {{ submission.title }}
          </el-descriptions-item>
          <el-descriptions-item label="作者">
            {{ submission.author }}
          </el-descriptions-item>
          <el-descriptions-item label="分类">
            <el-tag type="primary">{{ submission.category }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatTime(submission.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 作品内容 -->
      <div class="content-section">
        <h4>作品内容</h4>
        <div class="content-box">
          {{ submission.content }}
        </div>
      </div>

      <!-- 审核表单 -->
      <div class="review-form">
        <el-form 
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="审核结果" prop="action">
            <el-radio-group v-model="formData.action">
              <el-radio value="approve" size="large">
                <el-icon color="#67c23a"><Check /></el-icon>
                通过
              </el-radio>
              <el-radio value="reject" size="large">
                <el-icon color="#f56c6c"><Close /></el-icon>
                拒绝
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item 
            :label="formData.action === 'approve' ? '通过备注' : '拒绝理由'"
            prop="comment"
          >
            <el-input
              v-model="formData.comment"
              type="textarea"
              :rows="4"
              :placeholder="formData.action === 'approve' ? '请输入通过备注（可选）' : '请输入拒绝理由'"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item v-if="formData.action === 'approve'">
            <div class="tips success-tips">
              <h4>✅ 通过后操作：</h4>
              <ul>
                <li>作品将在比赛页面公开展示</li>
                <li>系统会自动生成AI评语</li>
                <li>作者将收到通过通知</li>
                <li>后续可推广为普通提示词</li>
              </ul>
            </div>
          </el-form-item>

          <el-form-item v-if="formData.action === 'reject'">
            <div class="tips reject-tips">
              <h4>❌ 拒绝说明：</h4>
              <ul>
                <li>作品将不会公开展示</li>
                <li>作者将收到拒绝通知及理由</li>
                <li>拒绝后无法撤销，请谨慎操作</li>
              </ul>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          :type="formData.action === 'approve' ? 'success' : 'danger'"
          @click="handleSubmit"
          :loading="loading"
        >
          <el-icon v-if="formData.action === 'approve'"><Check /></el-icon>
          <el-icon v-else><Close /></el-icon>
          {{ formData.action === 'approve' ? '确认通过' : '确认拒绝' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import axios from 'axios'
import { getApiBaseUrl } from '../../config/api'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  submission: {
    type: Object,
    default: null
  },
  action: {
    type: String,
    default: 'approve' // 'approve' or 'reject'
  }
})

// Emits
const emit = defineEmits(['update:visible', 'reviewed'])

// 响应式数据
const formRef = ref()
const loading = ref(false)
const formData = ref({
  action: 'approve',
  comment: ''
})

// 表单验证规则
const rules = computed(() => ({
  action: [
    { required: true, message: '请选择审核结果', trigger: 'change' }
  ],
  comment: formData.value.action === 'reject' ? [
    { required: true, message: '拒绝时必须填写理由', trigger: 'blur' },
    { min: 5, max: 500, message: '理由长度应在5-500字符之间', trigger: 'blur' }
  ] : [
    { max: 500, message: '备注长度不能超过500字符', trigger: 'blur' }
  ]
}))

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const dialogTitle = computed(() => {
  if (!props.submission) return '审核作品'
  return `审核作品：${props.submission.title}`
})

// 监听属性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm()
    formData.value.action = props.action || 'approve'
  }
})

watch(() => props.action, (newVal) => {
  if (newVal) {
    formData.value.action = newVal
  }
})

// 方法
const resetForm = () => {
  formData.value = {
    action: 'approve',
    comment: ''
  }
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString('zh-CN')
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
  try {
    // 修复表单验证处理
    const isValid = await formRef.value.validate().catch(() => false)
    if (!isValid) {
      ElMessage.warning('请检查表单输入')
      return
    }

    loading.value = true// 添加详细的请求诊断信息
    const requestUrl = `${getApiBaseUrl()}/api/competition/admin/review/${props.submission.id}`
    console.log('发送审核请求:', requestUrl)
    console.log('当前用户Token:', localStorage.getItem('user_token') ? '已设置' : '未设置')
    console.log('当前用户角色:', localStorage.getItem('user_role'))
    console.log('请求数据:', {
      action: formData.value.action,
      comment: formData.value.comment.trim()
    })

    const response = await axios.post(requestUrl, {
      action: formData.value.action,
      comment: formData.value.comment.trim()
    })
    
    console.log('审核响应:', response.data)
    
    const actionText = formData.value.action === 'approve' ? '通过' : '拒绝'
    ElMessage.success(`作品审核${actionText}成功`)
    
    emit('reviewed', {
      submission: response.data.submission || props.submission,
      action: formData.value.action
    })
    
    dialogVisible.value = false
  } catch (error) {
    console.error('审核失败详细信息:')
    console.error('- 错误对象:', error)
    console.error('- 错误消息:', error.message)
    console.error('- 错误代码:', error.code)
    console.error('- 请求配置:', error.config)
    
    if (error.response) {
      // 服务器返回了错误响应
      console.error('- 响应状态:', error.response.status)
      console.error('- 响应头:', error.response.headers)
      console.error('- 响应数据:', error.response.data)
    } else if (error.request) {
      // 请求发出了但没有收到响应
      console.error('- 请求对象:', error.request)
      console.error('- 网络错误或超时')
    }
    
    let errorMsg = '审核失败'
    if (error.response?.data?.msg) {
      errorMsg = error.response.data.msg
    } else if (error.response?.data?.error) {
      errorMsg = error.response.data.error
    } else if (error.response?.status) {
      errorMsg = `服务器错误 (HTTP ${error.response.status})`
    } else if (error.code === 'NETWORK_ERROR') {
      errorMsg = '网络连接错误，请检查网络或服务器状态'
    } else if (error.code === 'ECONNREFUSED') {
      errorMsg = '服务器拒绝连接，请检查服务器是否运行'
    } else if (error.message?.includes('timeout')) {
      errorMsg = '请求超时，请重试'
    } else if (error.message) {
      errorMsg = `请求失败: ${error.message}`
    } else {
      errorMsg = '未知错误，请查看控制台获取详细信息'
    }
    
    ElMessage.error(errorMsg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.review-dialog {
  max-height: 70vh;
  overflow-y: auto;
}

.submission-info {
  margin-bottom: 25px;
}

.content-section {
  margin-bottom: 25px;
}

.content-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 1.1rem;
}

.content-box {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.review-form {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.tips {
  padding: 15px;
  border-radius: 6px;
  margin-top: 10px;
}

.success-tips {
  background: #f0f9ff;
  border-left: 4px solid #67c23a;
}

.reject-tips {
  background: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.tips h4 {
  margin: 0 0 10px 0;
}

.success-tips h4 {
  color: #67c23a;
}

.reject-tips h4 {
  color: #f56c6c;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
}

.tips li {
  color: #606266;
  margin-bottom: 5px;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .el-button {
  margin-left: 10px;
}

.el-radio {
  display: flex;
  align-items: center;
  margin-right: 30px;
  margin-bottom: 10px;
}

.el-radio .el-icon {
  margin-right: 5px;
}

@media (max-width: 768px) {
  .el-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
  
  .review-dialog {
    max-height: 60vh;
  }
  
  .content-box {
    max-height: 150px;
  }
}
</style>
