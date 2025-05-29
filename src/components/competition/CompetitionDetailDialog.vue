<template>  <el-dialog
    v-model="visible"
    :title="competition?.title || '比赛详情'"
    width="90%"
    max-width="1200px"
    destroy-on-close
  >
    <CustomScrollbar 
      direction="vertical" 
      size="thin" 
      theme="primary" 
      :auto-hide="true"
      class="dialog-content"
    >
      <div v-if="competition" class="competition-detail">
      <!-- 比赛信息 -->
      <div class="competition-info">
        <div class="info-item">
          <span class="label">比赛描述：</span>
          <span>{{ competition.description }}</span>
        </div>
        <div class="info-item">
          <span class="label">比赛时间：</span>
          <span>{{ formatTime(competition.start_time) }} 至 {{ formatTime(competition.end_time) }}</span>
        </div>
        <div class="info-item">
          <span class="label">比赛状态：</span>
          <el-tag 
            :type="competition.status === 'active' ? 'success' : 'info'"
            size="small"
            class="status-tag"
          >
            {{ competition.status === 'active' ? '进行中' : '已结束' }}
          </el-tag>
        </div>
        <div class="info-item">
          <span class="label">参赛作品数：</span>
          <span>{{ competition.submissions_count }} 个</span>
        </div>
      </div>

      <!-- 作品列表 -->
      <div class="submissions-section">
        <h3>参赛作品</h3>
        
        <div v-if="loading" class="loading-section">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <div v-else-if="submissions.length === 0" class="empty-section">
          <el-empty description="暂无参赛作品" />
        </div>

        <div v-else class="submissions-grid">
          <div 
            v-for="submission in submissions" 
            :key="submission.id"
            class="submission-card"
            @click="viewSubmissionDetail(submission)"
          >
            <div class="submission-header">
              <h4>{{ submission.title }}</h4>
              <el-tag size="small">{{ submission.category }}</el-tag>
            </div>
            
            <p class="author">作者：{{ submission.author }}</p>
            <p class="content">{{ truncateText(submission.content, 150) }}</p>
              <div class="ai-review" v-if="submission.ai_review">
              <div class="ai-review-header">
                <el-icon><ChatLineRound /></el-icon>
                <span>AI评语</span>
              </div>
              <MarkdownRenderer :content="submission.ai_review" />
            </div>

            <div class="submission-meta">
              <span class="created-time">{{ formatTime(submission.created_at) }}</span>
              <span v-if="submission.promoted_to_prompt" class="promoted-tag">
                <el-tag type="success" size="small">已推广</el-tag>
              </span>
            </div>
          </div>        </div>
      </div>
    </div>
    </CustomScrollbar>

    <!-- 作品详情对话框 -->
    <SubmissionDetailDialog 
      v-model:visible="showSubmissionDetail"
      :submission="selectedSubmission"
    />
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, ChatLineRound } from '@element-plus/icons-vue'
import axios from 'axios'
import SubmissionDetailDialog from './SubmissionDetailDialog.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import CustomScrollbar from '@/components/common/CustomScrollbar.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  competitionId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:visible'])

// 响应式数据
const competition = ref(null)
const submissions = ref([])
const loading = ref(false)
const showSubmissionDetail = ref(false)
const selectedSubmission = ref(null)

// 计算属性
const visible = computed({
  get() {
    return props.visible
  },
  set(value) {
    emit('update:visible', value)
  }
})

// 监听器
watch(() => props.competitionId, (newId) => {
  if (newId && props.visible) {
    loadCompetitionDetail()
  }
})

watch(() => props.visible, (newVisible) => {
  if (newVisible && props.competitionId) {
    loadCompetitionDetail()
  }
})

// 方法
const loadCompetitionDetail = async () => {
  if (!props.competitionId) return

  loading.value = true
  try {
    const response = await axios.get(`/api/competition/${props.competitionId}`)
    competition.value = response.data.competition
    submissions.value = competition.value.submissions || []
  } catch (error) {
    console.error('加载比赛详情失败:', error)
    ElMessage.error('加载比赛详情失败')
  } finally {
    loading.value = false
  }
}

const viewSubmissionDetail = (submission) => {
  selectedSubmission.value = submission
  showSubmissionDetail.value = true
}

// 工具函数
const formatTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString('zh-CN')
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<style scoped>
.competition-detail {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center; /* 居中显示内容 */
}

.competition-info {
  background: var(--background-color-light, #f5f7fa);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  border: 1px solid var(--border-color-light);
  transition: all 0.3s ease;
  max-width: 500px; /* 限制最大宽度 */
  width: 100%;
}

.submissions-section {
  max-width: 1200px; /* 作品列表可以稍微宽一些 */
  width: 100%;
}

.info-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  font-weight: 600;
  color: var(--text-color);
  min-width: 100px;
  flex-shrink: 0;
}

.info-item span:not(.label) {
  color: var(--text-color-secondary);
  flex: 1;
  line-height: 1.6;
}

.submissions-section h3 {
  margin: 0 0 20px 0;
  color: var(--text-color);
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 10px;
  font-size: 1.4rem;
}

.loading-section {
  text-align: center;
  padding: 40px;
  color: var(--text-color-secondary);
  background: var(--background-color-light);
  border-radius: 12px;
}

.loading-section .el-icon {
  font-size: 24px;
  margin-right: 8px;
  color: var(--primary-color);
}

.empty-section {
  padding: 40px;
  background: var(--background-color-light);
  border-radius: 12px;
}

.submissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.submission-card {
  background: var(--background-color);
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
}

.submission-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.submission-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: var(--primary-color);
}

.submission-card:hover::before {
  opacity: 1;
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.submission-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.4;
  flex: 1;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: calc(100% - 80px); /* 为标签预留空间 */
}

.submission-header .el-tag {
  flex-shrink: 0; /* 防止标签被压缩 */
  white-space: nowrap; /* 保持标签文字在一行 */
}

.author {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin: 0 0 12px 0;
}

.content {
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 0 0 15px 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.ai-review {
  background: var(--background-color-light, #f5f7fa);
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid var(--primary-color);
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.ai-review-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.9rem;
  gap: 6px;
}

.ai-review-header .el-icon {
  font-size: 16px;
}

.ai-review p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.submission-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color-light);
  margin-top: 15px;
}

.created-time {
  color: var(--text-color-placeholder);
  font-size: 0.85rem;
}

.promoted-tag {
  margin-left: 8px;
}

.status-tag {
  font-size: 0.9rem;
  padding: 0 12px;
  height: 24px;
  max-width: 60px;
  line-height: 24px;
  border-radius: 12px;
}

:deep(.dark-mode) .competition-info {
  background: var(--background-color-dark-hover, #2d3748);
  border-color: var(--border-color-dark, #4b5563);
}

:deep(.dark-mode) .info-item .label {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:deep(.dark-mode) .info-item span:not(.label) {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

:deep(.dark-mode) .submissions-section h3 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:deep(.dark-mode) .loading-section,
:deep(.dark-mode) .empty-section {
  background: var(--background-color-dark-hover, #2d3748);
}

:deep(.dark-mode) .submission-card {
  background: var(--background-color-dark, #1e293b);
  border-color: var(--border-color-dark, #4b5563);
}

:deep(.dark-mode) .submission-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

:deep(.dark-mode) .submission-header h4 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:deep(.dark-mode) .author,
:deep(.dark-mode) .content {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

:deep(.dark-mode) .ai-review {
  background: var(--background-color-dark-hover, #2d3748);
  border-left-color: var(--primary-color);
  box-shadow: inset 0 0 0 1px var(--border-color-dark, #4b5563);
}

:deep(.dark-mode) .ai-review-header {
  color: var(--primary-color);
}

:deep(.dark-mode) .ai-review p {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

:deep(.dark-mode) .submission-meta {
  border-top-color: var(--border-color-dark, #4b5563);
}

:deep(.dark-mode) .created-time {
  color: var(--text-color-placeholder-dark, rgba(255, 255, 255, 0.4));
}

:deep(.dark-mode) .status-tag {
  background-color: transparent;
}

:deep(.dark-mode) .status-tag.el-tag--success {
  color: var(--el-color-success);
  border-color: var(--el-color-success);
  background-color: rgba(var(--el-color-success-rgb), 0.1);
}

:deep(.dark-mode) .status-tag.el-tag--info {
  color: var(--el-color-info);
  border-color: var(--el-color-info);
  background-color: rgba(var(--el-color-info-rgb), 0.1);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .competition-detail {
    padding: 15px;
  }

  .competition-info {
    padding: 15px;
    margin-bottom: 20px;
    max-width: 100%; /* 移动端占满宽度 */
  }

  .info-item {
    flex-direction: column;
    gap: 6px;
  }

  .info-item .label {
    min-width: auto;
  }

  .submissions-section h3 {
    font-size: 1.2rem;
    margin-bottom: 15px;
  }

  .submissions-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .submission-card {
    padding: 15px;
  }

  .submission-header {
    flex-direction: column;
    gap: 8px;
  }

  .submission-header h4 {
    font-size: 1.1rem;
  }

  .ai-review {
    padding: 12px;
  }

  .submission-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .promoted-tag {
    margin-left: 0;
  }
}

/* 小屏幕适配 */
@media (max-width: 480px) {
  .competition-detail {
    padding: 12px;
  }

  .competition-info,
  .submission-card {
    padding: 12px;
  }

  .submissions-section h3 {
    font-size: 1.1rem;
  }

  .submission-header h4 {
    font-size: 1rem;
  }

  .author,
  .content,
  .ai-review p {
    font-size: 0.85rem;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .submission-card:hover {
    transform: none;
  }

  .submission-card:active {
    transform: scale(0.98);
  }
}

/* 对话框内容区域滚动条样式 */
.dialog-content {
  max-height: 75vh;
  min-height: 500px;
  padding-right: 4px;
}
</style>

