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
          <div class="card-header">            <el-checkbox 
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
    </el-dialog>

    <!-- 详情对话框 -->
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Check, Close, View } from '@element-plus/icons-vue'
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
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.review-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.loading-container {
  padding: 20px;
}

.select-all-checkbox {
  margin-bottom: 15px;
}

.prompt-cards {
  display: grid;
  gap: 15px;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.prompt-card {
  transition: transform 0.2s;
}

.prompt-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.prompt-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--el-text-color-regular);
}

.card-content {
  margin-bottom: 15px;
}

.prompt-title {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 1.1rem;
}

.prompt-content {
  margin: 0;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.card-actions {
  display: flex;
  justify-content: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.content-detail {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  background-color: var(--el-bg-color-page);
  padding: 15px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .prompt-cards {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .prompt-meta {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
  
  .prompt-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
