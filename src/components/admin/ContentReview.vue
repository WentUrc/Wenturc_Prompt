<template>
  <div class="content-review">
    <div class="review-header">
      <h3>待审核内容</h3>
      <div class="header-actions">
        <el-button @click="loadPendingPrompts" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button 
          type="success" 
          @click="batchApprove" 
          :disabled="selectedPrompts.length === 0"
        >
          批量通过 ({{ selectedPrompts.length }})
        </el-button>
        <el-button 
          type="danger" 
          @click="batchReject" 
          :disabled="selectedPrompts.length === 0"
        >
          批量拒绝 ({{ selectedPrompts.length }})
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && prompts.length === 0" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 空状态 -->
    <el-empty 
      v-else-if="!loading && prompts.length === 0" 
      description="暂无待审核内容"
      :image-size="120"
    />

    <!-- 内容列表 -->
    <div v-else class="prompts-list">
      <el-checkbox 
        v-model="selectAll" 
        @change="handleSelectAll"
        class="select-all-checkbox"
      >
        全选
      </el-checkbox>
      
      <div class="prompt-cards">
        <el-card 
          v-for="prompt in prompts" 
          :key="prompt.id" 
          class="prompt-card"
          shadow="hover"
        >
          <div class="card-header">            
            <el-checkbox 
              :model-value="selectedPrompts.includes(prompt.id)" 
              @change="(val) => handlePromptSelect(prompt.id, val)"
            />
            <div class="prompt-meta">
              <span class="author">作者: {{ prompt.author_name || '未知' }}</span>
              <span class="category">分类: {{ prompt.category }}</span>
              <span class="date">{{ formatDate(prompt.created_at) }}</span>
            </div>
          </div>
          
          <div class="card-content">
            <h4 class="prompt-title">{{ prompt.title }}</h4>
            <p class="prompt-content">{{ truncateText(prompt.content, 200) }}</p>
          </div>
            <div class="card-actions">
            <el-button-group>
              <el-button 
                type="primary" 
                size="small"
                @click="showEditDialog(prompt)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                type="success" 
                size="small"
                @click="reviewPrompt(prompt.id, 'approve')"
                :loading="reviewingPrompts.has(prompt.id)"
              >
                <el-icon><Check /></el-icon>
                通过
              </el-button>
              <el-button 
                type="danger" 
                size="small"
                @click="showRejectDialog(prompt)"
                :loading="reviewingPrompts.has(prompt.id)"
              >
                <el-icon><Close /></el-icon>
                拒绝
              </el-button>
              <el-button 
                size="small"
                @click="viewPromptDetail(prompt)"
              >
                <el-icon><View /></el-icon>
                详情
              </el-button>
            </el-button-group>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination-container" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadPendingPrompts"
          @current-change="loadPendingPrompts"
        />
      </div>
    </div>

    <!-- 拒绝对话框 -->
    <el-dialog 
      v-model="rejectDialogVisible" 
      title="拒绝理由" 
      width="500px"
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝理由">
          <el-input 
            v-model="rejectForm.comment" 
            type="textarea" 
            :rows="4"
            placeholder="请输入拒绝理由（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="confirmReject"
          :loading="reviewingPrompts.has(rejectForm.promptId)"
        >
          确认拒绝
        </el-button>
      </template>
    </el-dialog>    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="内容详情" 
      width="700px"
    >
      <div v-if="selectedPromptDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="标题">{{ selectedPromptDetail.title }}</el-descriptions-item>
          <el-descriptions-item label="作者">{{ selectedPromptDetail.author_name }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ selectedPromptDetail.category }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedPromptDetail.created_at) }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider>内容</el-divider>
        <div class="content-detail">{{ selectedPromptDetail.content }}</div>
      </div>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑内容" 
      width="800px"
    >
      <el-form 
        :model="editForm" 
        :rules="editFormRules"
        ref="editFormRef"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input 
            v-model="editForm.title" 
            placeholder="请输入标题"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="分类" prop="category">
          <el-select 
            v-model="editForm.category" 
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option label="写作助手" value="写作助手" />
            <el-option label="代码编程" value="代码编程" />
            <el-option label="学习教育" value="学习教育" />
            <el-option label="创意灵感" value="创意灵感" />
            <el-option label="工作效率" value="工作效率" />
            <el-option label="生活助手" value="生活助手" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="editForm.content" 
            type="textarea" 
            :rows="8"
            placeholder="请输入内容"
            maxlength="10000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmEdit"
          :loading="editingPrompt"
        >
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Check, Close, View, Edit } from '@element-plus/icons-vue'
import axios from 'axios'
import { getApiBaseUrl } from '../../config/api'

const emit = defineEmits(['refresh-stats'])

// 响应式数据
const loading = ref(false)
const prompts = ref([])
const selectedPrompts = ref([])
const reviewingPrompts = ref(new Set())

const pagination = reactive({
  page: 1,
  per_page: 10,
  total: 0,
  pages: 0
})

const rejectDialogVisible = ref(false)
const rejectForm = reactive({
  promptId: null,
  comment: ''
})

const detailDialogVisible = ref(false)
const selectedPromptDetail = ref(null)

// 编辑相关
const editDialogVisible = ref(false)
const editingPrompt = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  id: null,
  title: '',
  content: '',
  category: ''
})

const editFormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 200, message: '标题长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 1, max: 10000, message: '内容长度在 1 到 10000 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const selectAll = computed({
  get() {
    return prompts.value.length > 0 && selectedPrompts.value.length === prompts.value.length
  },
  set(value) {
    if (value) {
      selectedPrompts.value = prompts.value.map(p => p.id)
    } else {
      selectedPrompts.value = []
    }
  }
})

// 生命周期
onMounted(() => {
  loadPendingPrompts()
})

// 方法
const loadPendingPrompts = async () => {
  try {
    loading.value = true
    const response = await axios.get(`${getApiBaseUrl()}/api/admin/prompts/pending`, {
      params: {
        page: pagination.page,
        per_page: pagination.per_page
      }
    })
    
    prompts.value = response.data.prompts || []
    Object.assign(pagination, response.data.pagination)
    selectedPrompts.value = []
    
    console.log('待审核内容加载成功:', prompts.value.length)
  } catch (error) {
    console.error('加载待审核内容失败:', error)
    ElMessage.error('加载待审核内容失败')
  } finally {
    loading.value = false
  }
}

const reviewPrompt = async (promptId, action, comment = '') => {
  try {
    reviewingPrompts.value.add(promptId)
    
    await axios.post(`${getApiBaseUrl()}/api/admin/prompts/${promptId}/review`, {
      action,
      comment
    })
    
    ElMessage.success(`内容${action === 'approve' ? '通过' : '拒绝'}成功`)
    
    // 从列表中移除已审核的内容
    prompts.value = prompts.value.filter(p => p.id !== promptId)
    selectedPrompts.value = selectedPrompts.value.filter(id => id !== promptId)
    
    // 刷新统计数据
    emit('refresh-stats')
    
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error('审核操作失败')
  } finally {
    reviewingPrompts.value.delete(promptId)
  }
}

const showRejectDialog = (prompt) => {
  rejectForm.promptId = prompt.id
  rejectForm.comment = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  await reviewPrompt(rejectForm.promptId, 'reject', rejectForm.comment)
  rejectDialogVisible.value = false
}

// 编辑相关方法
const showEditDialog = (prompt) => {
  editForm.id = prompt.id
  editForm.title = prompt.title
  editForm.content = prompt.content
  editForm.category = prompt.category
  editDialogVisible.value = true
}

const confirmEdit = async () => {
  if (!editFormRef.value) return
  
  try {
    // 验证表单
    await editFormRef.value.validate()
    
    editingPrompt.value = true
    
    const response = await axios.put(`${getApiBaseUrl()}/api/admin/prompts/${editForm.id}/edit`, {
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      category: editForm.category
    })
    
    ElMessage.success('编辑成功')
    editDialogVisible.value = false
    
    // 更新本地数据
    const index = prompts.value.findIndex(p => p.id === editForm.id)
    if (index !== -1) {
      prompts.value[index] = {
        ...prompts.value[index],
        ...response.data.prompt
      }
    }
    
  } catch (error) {
    console.error('编辑失败:', error)
    if (error.response?.data?.msg) {
      ElMessage.error(error.response.data.msg)
    } else {
      ElMessage.error('编辑失败')
    }
  } finally {
    editingPrompt.value = false
  }
}

const batchApprove = async () => {
  if (selectedPrompts.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(`确定要批量通过 ${selectedPrompts.value.length} 个内容吗？`, '确认操作', {
      type: 'warning'
    })
    
    await axios.post(`${getApiBaseUrl()}/api/admin/prompts/batch-review`, {
      prompt_ids: selectedPrompts.value,
      action: 'approve',
      comment: '批量通过'
    })
    
    ElMessage.success('批量通过成功')
    await loadPendingPrompts()
    emit('refresh-stats')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量通过失败:', error)
      ElMessage.error('批量通过失败')
    }
  }
}

const batchReject = async () => {
  if (selectedPrompts.value.length === 0) return
  
  try {
    const { value: comment } = await ElMessageBox.prompt(
      `确定要批量拒绝 ${selectedPrompts.value.length} 个内容吗？请输入拒绝理由：`,
      '批量拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '拒绝理由（可选）'
      }
    )
    
    await axios.post(`${getApiBaseUrl()}/api/admin/prompts/batch-review`, {
      prompt_ids: selectedPrompts.value,
      action: 'reject',
      comment: comment || '批量拒绝'
    })
    
    ElMessage.success('批量拒绝成功')
    await loadPendingPrompts()
    emit('refresh-stats')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量拒绝失败:', error)
      ElMessage.error('批量拒绝失败')
    }
  }
}

const handleSelectAll = () => {
  // selectAll 的 setter 会自动处理
}

const handlePromptSelect = (promptId, isSelected) => {
  if (isSelected) {
    if (!selectedPrompts.value.includes(promptId)) {
      selectedPrompts.value.push(promptId)
    }
  } else {
    const index = selectedPrompts.value.indexOf(promptId)
    if (index > -1) {
      selectedPrompts.value.splice(index, 1)
    }
  }
}

const updateSelectAll = () => {
  // 当单个选择改变时，计算属性会自动更新 selectAll
}

const viewPromptDetail = (prompt) => {
  selectedPromptDetail.value = prompt
  detailDialogVisible.value = true
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString('zh-CN')
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 暴露方法给父组件
defineExpose({
  loadPendingPrompts
})
</script>

<style scoped>
.content-review {
  height: 100%;
  color: var(--text-color, #333333);
  transition: all var(--transition-duration, 0.3s);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
  background-color: var(--hero-background, #f0f9ff);
  padding: 25px 35px;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 统一的动画渐变背景效果 */
.review-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color), var(--primary-color));
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
  border-radius: 16px;
  opacity: 0.1;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.review-header:hover::before {
  opacity: 0.2;
}

.review-header:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
}

.review-header h3 {
  margin: 0;
  color: var(--hero-title-color, #303133);
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions .el-button {
  border-radius: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.loading-container {
  padding: 25px;
  background-color: var(--external-bg, rgba(249, 250, 251, 0.5));
  border-radius: 14px;
  border: 2px dashed var(--warning-color, #f9c23c);
  position: relative;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.loading-container:hover {
  background-color: var(--external-bg, rgba(249, 250, 251, 0.7));
  border-color: var(--primary-color);
}

.select-all-checkbox {
  margin-bottom: 18px;
  color: var(--text-color, #303133);
  font-weight: 500;
}

.select-all-checkbox :deep(.el-checkbox__label) {
  font-weight: 500;
  color: var(--text-color, #303133);
}

.prompts-list {
  position: relative;
  background: var(--external-bg, rgba(249, 250, 251, 0.5));
  border-radius: 12px;
  padding: 20px;
  margin: 10px 0;
}

/* 类似 external-grid 的虚线边框效果 */
.prompts-list::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px dashed var(--warning-color-light, #f9c23c);
  border-radius: 14px;
  z-index: -1;
  opacity: 0.6;
}

.prompt-cards {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
}

.prompt-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
  background-color: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  opacity: 0.94;
  backdrop-filter: blur(4px);
}

.prompt-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  opacity: 1;
  border-color: var(--primary-color);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding: 15px 15px 0;
}

.prompt-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-color-secondary, #606266);
}

.card-content {
  margin-bottom: 15px;
  padding: 0 15px;
}

.prompt-title {
  margin: 0 0 10px 0;
  color: var(--text-color, #303133);
  font-size: 1.1rem;
  font-weight: 600;
}

.prompt-content {
  margin: 0;
  line-height: 1.5;
  color: var(--text-color-secondary, #606266);
}

.card-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 18px;
  background: linear-gradient(135deg, var(--background-color-light, #f5f7fa) 0%, rgba(249, 250, 251, 0.8) 100%);
  border-top: 1px solid var(--border-color-light, #e4e7ed);
}

.card-actions .el-button {
  border-radius: 18px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.card-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 35px;
  padding: 25px;
  background-color: var(--external-bg, rgba(249, 250, 251, 0.5));
  border-radius: 14px;
  border: 2px dashed var(--warning-color, #f9c23c);
  position: relative;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.pagination-container:hover {
  background-color: var(--external-bg, rgba(249, 250, 251, 0.7));
  border-color: var(--primary-color);
}

.content-detail {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--text-color, #303133);
  background-color: var(--background-color-light, #f5f7fa);
  padding: 15px;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color, #dcdfe6);
}

/* 深色模式适配 - 增强版 external-grid 样式 */
:deep(.dark-mode) .review-header {
  background-color: var(--hero-background, rgba(30, 41, 59, 0.8));
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.25);
}

:deep(.dark-mode) .review-header h3 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.dark-mode) .loading-container,
:deep(.dark-mode) .prompts-list,
:deep(.dark-mode) .pagination-container {
  background: var(--external-bg-dark, rgba(30, 41, 59, 0.4));
  border-color: var(--warning-color-dark, #f9c23c);
  backdrop-filter: blur(6px);
}

:deep(.dark-mode) .loading-container:hover,
:deep(.dark-mode) .pagination-container:hover {
  background: var(--external-bg-dark, rgba(30, 41, 59, 0.6));
  border-color: var(--primary-color);
}

:deep(.dark-mode) .prompts-list::before {
  border-color: var(--warning-color-dark, #f9c23c);
}

:deep(.dark-mode) .prompt-card {
  background-color: var(--card-background, rgba(30, 41, 59, 0.7));
  border-color: var(--border-color-dark, #4b5563);
  opacity: 0.94;
  backdrop-filter: blur(6px);
}

:deep(.dark-mode) .prompt-card:hover {
  box-shadow: 0 6px 32px rgba(0, 0, 0, 0.4);
  opacity: 1;
  border-color: var(--primary-color);
}

:deep(.dark-mode) .card-header,
:deep(.dark-mode) .prompt-meta {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

:deep(.dark-mode) .prompt-title {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:deep(.dark-mode) .prompt-content {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

:deep(.dark-mode) .card-actions {
  background: linear-gradient(135deg, var(--background-color-dark-hover, #2d3748) 0%, rgba(45, 55, 72, 0.8) 100%);
  border-top-color: var(--border-color-dark, #4b5563);
}

:deep(.dark-mode) .content-detail {
  background-color: rgba(15, 23, 42, 0.8);
  border-color: var(--border-color-dark, #4b5563);
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:deep(.dark-mode) .select-all-checkbox,
:deep(.dark-mode) .select-all-checkbox :deep(.el-checkbox__label) {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

/* 增强按钮效果 - 使用纯色而非渐变 */
.header-actions .el-button--success {
  background: var(--success-color, #67c23a);
  border: none;
  color: white;
  font-weight: 600;
}

.header-actions .el-button--danger {
  background: var(--danger-color, #f56c6c);
  border: none;
  color: white;
  font-weight: 600;
}

.header-actions .el-button--primary {
  background: var(--primary-color);
  border: none;
  color: white;
  font-weight: 600;
}

/* 卡片按钮优化 - 使用纯色而非渐变 */
.card-actions .el-button--success {
  background: var(--success-color, #67c23a);
  border: none;
  color: white;
  font-size: 12px;
  padding: 8px 16px;
}

.card-actions .el-button--danger {
  background: var(--danger-color, #f56c6c);
  border: none;
  color: white;
  font-size: 12px;
  padding: 8px 16px;
}

.card-actions .el-button--primary {
  background: var(--primary-color);
  border: none;
  color: white;
  font-size: 12px;
  padding: 8px 16px;
}

.card-actions .el-button {
  font-size: 12px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--background-color);
  color: var(--text-color);
}

/* 加载骨架屏美化 */
.loading-container :deep(.el-skeleton) {
  opacity: 0.8;
}

.loading-container :deep(.el-skeleton__item) {
  background: linear-gradient(90deg, rgba(190, 190, 190, 0.2) 25%, rgba(129, 129, 129, 0.24) 37%, rgba(190, 190, 190, 0.2) 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: -100% 50%;
  }
}

/* 深色模式下的加载骨架屏 */
:deep(.dark-mode) .loading-container :deep(.el-skeleton__item) {
  background: linear-gradient(90deg, rgba(70, 70, 70, 0.2) 25%, rgba(100, 100, 100, 0.24) 37%, rgba(70, 70, 70, 0.2) 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

/* 响应式设计 */
/* 响应式设计 */
@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    align-items: stretch;
    padding: 20px;
    gap: 20px;
  }
  
  .review-header h3 {
    font-size: 1.6rem;
    text-align: center;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .header-actions .el-button {
    flex: 1;
    min-width: 120px;
    margin: 0 5px 8px;
  }
  
  .prompt-cards {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .prompt-meta {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.8rem;
  }
  
  .card-actions {
    padding: 15px 12px;
  }
  
  .card-actions .el-button-group {
    width: 100%;
  }
  
  .card-actions .el-button {
    flex: 1;
    font-size: 11px;
    padding: 6px 8px;
  }
  
  .prompts-list {
    padding: 15px;
  }
  
  .pagination-container {
    padding: 20px 15px;
  }
  
  /* 移动端对话框优化 */
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }
  
  :deep(.el-dialog__body) {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .review-header {
    padding: 16px;
  }
  
  .review-header h3 {
    font-size: 1.4rem;
  }
  
  .header-actions .el-button {
    flex-direction: column;
    padding: 12px 8px;
    font-size: 12px;
  }
  
  .prompt-cards {
    gap: 12px;
  }
  
  .prompt-card {
    margin: 0 5px;
  }
  
  .card-content {
    padding: 0 12px;
  }
  
  .prompt-title {
    font-size: 1rem;
    line-height: 1.3;
  }
  
  .prompt-content {
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .card-actions .el-button {
    padding: 8px 6px;
    font-size: 10px;
  }
  
  .card-actions .el-button .el-icon {
    margin-right: 2px;
  }
  
  .prompts-list {
    padding: 12px;
  }
  
  .prompt-meta {
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
  }
  
  /* 超小屏幕分页器优化 */
  .pagination-container :deep(.el-pagination) {
    justify-content: center;
  }
  
  .pagination-container :deep(.el-pagination .el-pager) {
    display: none;
  }
  
  .pagination-container :deep(.el-pagination .el-pagination__jump) {
    display: none;
  }
}
</style>
