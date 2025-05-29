<template>  <el-dialog
    v-model="dialogVisible"
    title="提交比赛作品"
    width="70%"
    :before-close="handleClose"
  >
    <CustomScrollbar 
      direction="vertical" 
      size="thin" 
      theme="primary" 
      :auto-hide="true"
      class="dialog-content"
    >
      <el-form 
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        @submit.prevent
      >
        <el-form-item label="作品标题" prop="title">
          <el-input
            v-model="formData.title"
            placeholder="请输入作品标题"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select 
            v-model="formData.category" 
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option label="文案写作" value="文案写作" />
            <el-option label="编程助手" value="编程助手" />
            <el-option label="创意设计" value="创意设计" />
            <el-option label="学习教育" value="学习教育" />
            <el-option label="商业分析" value="商业分析" />
            <el-option label="生活助手" value="生活助手" />
            <el-option label="娱乐游戏" value="娱乐游戏" />
            <el-option label="科研学术" value="科研学术" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="作品内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="8"
            placeholder="请详细描述您的提示词内容..."
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <div class="tips">
            <h4>📝 提交须知：</h4>
            <ul>
              <li>每个比赛周期只能提交一个作品</li>
              <li>作品需要经过管理员审核才会公开展示</li>
              <li>审核通过后会获得AI生成的评语</li>
              <li>请确保内容原创且符合社区规范</li>
            </ul>
          </div>
        </el-form-item>
      </el-form>
    </CustomScrollbar>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="loading"
        >
          提交作品
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import CustomScrollbar from '@/components/common/CustomScrollbar.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:visible', 'submit'])

// 响应式数据
const formRef = ref()
const loading = ref(false)
const formData = ref({
  title: '',
  content: '',
  category: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入作品标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度应在2-200字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入作品内容', trigger: 'blur' },
    { min: 10, max: 2000, message: '内容长度应在10-2000字符之间', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
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
  }
})

// 方法
const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    category: ''
  }
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSubmit = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    loading.value = true

    // 发送提交事件
    emit('submit', { ...formData.value })

  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.tips {
  background: var(--background-color-light);
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid var(--primary-color);
  border: 1px solid var(--border-color-light);
}

.tips h4 {
  margin: 0 0 10px 0;
  color: var(--primary-color);
}

.tips ul {
  margin: 0;
  padding-left: 20px;
}

.tips li {
  color: var(--text-color-secondary);
  margin-bottom: 5px;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .el-button {
  margin-left: 10px;
}

/* 深色模式适配 */
.dark-mode .tips {
  background: var(--background-color);
  border-color: var(--border-color);
}

.dark-mode .tips h4 {
  color: var(--primary-color);
}

.dark-mode .tips li {
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .el-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
}

/* el-dialog 样式优化 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: transparent;
  border-bottom: 1px solid var(--border-color-light);
}

:deep(.el-dialog__close) {
  font-size: 20px !important;
  width: 24px !important;
  height: 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-dialog__close):hover {
  background: var(--background-color-light);
  transform: scale(1.05);
}

/* 深色模式下的 el-dialog 优化 */
.dark-mode :deep(.el-dialog__header) {
  background: transparent;
  border-bottom-color: var(--border-color);
}

/* 对话框内容区域滚动条样式 */
.dialog-content {
  max-height: 60vh;
  min-height: 400px;
  padding-right: 4px;
}

.dark-mode :deep(.el-dialog__close):hover {
  background: var(--background-color-light);
}
</style>
