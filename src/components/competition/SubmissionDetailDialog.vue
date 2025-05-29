<template>  <el-dialog
    v-model="dialogVisible"
    :title="submission?.title || '作品详情'"
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
      <div class="submission-detail" v-if="submission"><!-- 作品信息 -->
      <div class="submission-info">
        <div class="info-item">
          <span class="label">作者：</span>
          <span class="value">{{ submission.author }}</span>
        </div>
        <div class="info-item">
          <span class="label">分类：</span>
          <el-tag type="primary">{{ submission.category }}</el-tag>
        </div>
        <div class="info-item">
          <span class="label">提交时间：</span>
          <span class="value">{{ formatTime(submission.created_at) }}</span>
        </div>
        <div class="info-item" v-if="submission.status">
          <span class="label">状态：</span>
          <el-tag 
            :type="getStatusType(submission.status)"
            effect="dark"
          >
            {{ getStatusText(submission.status) }}
          </el-tag>
        </div>
        <!-- 比赛信息 -->
        <div class="info-item" v-if="submission.competition_title">
          <span class="label">所属比赛：</span>
          <el-tag type="warning" effect="dark">
            {{ submission.competition_title }}
          </el-tag>
        </div>
        <div class="info-item" v-if="submission.competition_description">
          <span class="label">比赛描述：</span>
          <span class="value">{{ submission.competition_description }}</span>
        </div>
        <div class="info-item" v-if="submission.competition_status">
          <span class="label">比赛状态：</span>
          <el-tag 
            :type="submission.competition_status === 'active' ? 'success' : 'info'"
            effect="dark"
          >
            {{ submission.competition_status === 'active' ? '进行中' : '已结束' }}
          </el-tag>
        </div>
      </div>

      <!-- 作品内容 -->
      <div class="content-section">
        <h3>作品内容</h3>
        <div class="content-box">
          {{ submission.content }}
        </div>
      </div>      <!-- AI评语 -->
      <div class="ai-review-section" v-if="submission.ai_review">
        <h3>🤖 AI评语</h3>
        <div class="ai-review-box">
          <MarkdownRenderer :content="submission.ai_review" />
        </div>
        <div class="ai-review-time" v-if="submission.ai_reviewed_at">
          评语生成时间: {{ formatTime(submission.ai_reviewed_at) }}
        </div>
      </div>

      <!-- 审核信息 (仅作者和管理员可见) -->
      <div 
        class="review-section" 
        v-if="submission.review_comment && (isOwner || isAdmin)"
      >
        <h3>审核信息</h3>
        <div class="review-box">
          <div class="review-item" v-if="submission.reviewer">
            <span class="label">审核人：</span>
            <span class="value">{{ submission.reviewer }}</span>
          </div>
          <div class="review-item" v-if="submission.reviewed_at">
            <span class="label">审核时间：</span>
            <span class="value">{{ formatTime(submission.reviewed_at) }}</span>
          </div>
          <div class="review-item" v-if="submission.review_comment">
            <span class="label">审核意见：</span>
            <div class="review-comment">{{ submission.review_comment }}</div>
          </div>
        </div>
      </div>

      <!-- 推广信息 -->
      <div class="promotion-section" v-if="submission.promoted_to_prompt">
        <el-alert
          title="该作品已推广为普通提示词"
          type="success"
          :closable="false"
          show-icon
        >
          <template #default>
            <div>推广时间: {{ formatTime(submission.promoted_at) }}</div>
            <div v-if="submission.promoter">推广人: {{ submission.promoter }}</div>
          </template>        </el-alert>
      </div>
    </div>
    </CustomScrollbar>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button 
          v-if="submission?.content"
          type="primary"
          @click="copyContent"
        >
          复制内容
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import CustomScrollbar from '@/components/common/CustomScrollbar.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  submission: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:visible'])

// Store
const userStore = useUserStore()

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const isOwner = computed(() => {
  return props.submission && userStore.user && 
         props.submission.user_id === userStore.user.id
})

const isAdmin = computed(() => {
  return userStore.user && userStore.user.role === 'admin'
})

// 方法
const handleClose = () => {
  dialogVisible.value = false
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const statusMap = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待审核',
    'approved': '已通过',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.submission.content)
    ElMessage.success('内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.submission-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.submission-info {
  background: var(--background-color-light);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--border-color-light);
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  font-weight: bold;
  color: var(--text-color);
  width: 80px;
  flex-shrink: 0;
}

.info-item .value {
  color: var(--text-color-secondary);
}

.content-section,
.ai-review-section,
.review-section,
.promotion-section {
  margin-bottom: 25px;
}

.content-section h3,
.ai-review-section h3,
.review-section h3 {
  margin: 0 0 15px 0;
  color: var(--text-color);
  font-size: 1.1rem;
}

.content-box {
  background: var(--background-color);
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  padding: 15px;
  line-height: 1.6;
  color: var(--text-color-secondary);
  white-space: pre-wrap;
}

.ai-review-box {
  background: var(--background-color-light);
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  padding: 15px;
  line-height: 1.6;
  color: var(--text-color-secondary);
  border-left: 4px solid var(--primary-color);
}

.ai-review-time {
  text-align: right;
  color: var(--text-color-placeholder);
  font-size: 0.9rem;
  margin-top: 10px;
}

.review-box {
  background: var(--background-color-light);
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  padding: 15px;
}

.review-item {
  margin-bottom: 10px;
}

.review-item:last-child {
  margin-bottom: 0;
}

.review-item .label {
  font-weight: bold;
  color: var(--text-color);
  margin-right: 10px;
}

.review-comment {
  margin-top: 5px;
  padding: 10px;
  background: var(--background-color);
  border-radius: 4px;
  line-height: 1.5;
  color: var(--text-color-secondary);
  border: 1px solid var(--border-color-light);
}

.promotion-section {
  margin-top: 20px;
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
  
  .submission-detail {
    max-height: 50vh;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item .label {
    width: auto;
    margin-bottom: 5px;
  }
}

/* 深色模式适配 */
.dark-mode .submission-info {
  background: var(--background-color);
  border-color: var(--border-color);
}

.dark-mode .info-item .label {
  color: var(--text-color);
}

.dark-mode .info-item .value {
  color: var(--text-color-secondary);
}

.dark-mode .content-section h3,
.dark-mode .ai-review-section h3,
.dark-mode .review-section h3 {
  color: var(--text-color);
}

.dark-mode .content-box {
  background: var(--background-color);
  border-color: var(--border-color);
  color: var(--text-color-secondary);
}

.dark-mode .ai-review-box {
  background: var(--background-color);
  border-color: var(--border-color);
  color: var(--text-color-secondary);
}

.dark-mode .ai-review-time {
  color: var(--text-color-placeholder);
}

.dark-mode .review-box {
  background: var(--background-color);
  border-color: var(--border-color);
}

.dark-mode .review-item .label {
  color: var(--text-color);
}

.dark-mode .review-comment {
  background: var(--background-color);
  border-color: var(--border-color);
  color: var(--text-color-secondary);
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

.dark-mode :deep(.el-dialog__close):hover {
  background: var(--background-color-light);
}

/* 对话框内容区域滚动条样式 */
.dialog-content {
  max-height: 70vh;
  min-height: 400px;
  padding-right: 4px;
}
</style>
