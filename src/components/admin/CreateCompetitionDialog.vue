<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建新比赛"
    width="600px"
    :before-close="handleClose"
  >
    <el-form 
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <el-form-item label="比赛标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入比赛标题"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="比赛描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入比赛描述"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="开始时间" prop="start_time">
        <el-date-picker
          v-model="formData.start_time"
          type="datetime"
          placeholder="选择开始时间"
          style="width: 100%"
          :disabled-date="disabledStartDate"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>

      <el-form-item label="结束时间" prop="end_time">
        <el-date-picker
          v-model="formData.end_time"
          type="datetime"
          placeholder="选择结束时间"
          style="width: 100%"
          :disabled-date="disabledEndDate"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>

      <el-form-item>
        <div class="tips">
          <h4>📋 创建须知：</h4>
          <ul>
            <li>比赛时间建议设置为3天周期</li>
            <li>比赛一旦创建并开始，时间无法修改</li>
            <li>系统会自动管理比赛状态切换</li>
            <li>比赛结束后可以手动创建新比赛</li>
          </ul>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="loading"
        >
          创建比赛
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { getApiBaseUrl } from '../../config/api'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible', 'created'])

// 响应式数据
const formRef = ref()
const loading = ref(false)
const formData = ref({
  title: '',
  description: '',
  start_time: '',
  end_time: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入比赛标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度应在2-200字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入比赛描述', trigger: 'blur' },
    { min: 10, max: 1000, message: '描述长度应在10-1000字符之间', trigger: 'blur' }
  ],
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  end_time: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    { validator: validateEndTime, trigger: 'change' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听对话框显示状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm()
    setDefaultTimes()
  }
})

// 自定义验证函数
function validateEndTime(rule, value, callback) {
  if (!value) {
    callback(new Error('请选择结束时间'))
  } else if (formData.value.start_time && new Date(value) <= new Date(formData.value.start_time)) {
    callback(new Error('结束时间必须晚于开始时间'))
  } else {
    callback()
  }
}

// 禁用日期函数
const disabledStartDate = (time) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

const disabledEndDate = (time) => {
  if (!formData.value.start_time) return false
  return time.getTime() <= new Date(formData.value.start_time).getTime()
}

// 方法
const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  }
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const setDefaultTimes = () => {
  const now = new Date()
  const start = new Date(now.getTime() + 60 * 60 * 1000) // 1小时后开始
  const end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000) // 3天后结束
  
  formData.value.start_time = start.toISOString().slice(0, 19).replace('T', ' ')
  formData.value.end_time = end.toISOString().slice(0, 19).replace('T', ' ')
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    loading.value = true

    const response = await axios.post(`${getApiBaseUrl()}/api/competition/admin/create`, formData.value)
    
    ElMessage.success('比赛创建成功')
    emit('created', response.data.competition)
    dialogVisible.value = false

  } catch (error) {
    console.error('创建比赛失败:', error)
    const msg = error.response?.data?.msg || '创建失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.tips {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.tips h4 {
  margin: 0 0 10px 0;
  color: #409eff;
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

@media (max-width: 768px) {
  .el-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
}
</style>
