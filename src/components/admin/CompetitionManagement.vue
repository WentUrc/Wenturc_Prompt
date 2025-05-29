<template>
  <div class="competition-management">
    <div class="management-header">
      <h2>🏆 比赛管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建新比赛
        </el-button>
        <el-button @click="loadStats">
          <el-icon><Refresh /></el-icon>
          刷新统计
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_competitions }}</div>
          <div class="stat-label">总比赛数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.active_competitions }}</div>
          <div class="stat-label">活跃比赛</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.total_submissions }}</div>
          <div class="stat-label">总作品数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.approved_submissions }}</div>
          <div class="stat-label">已通过作品</div>
        </div>
      </el-card>
    </div>    <!-- 当前比赛信息 -->
    <el-card class="current-competition-card" v-if="currentCompetition">
      <template #header>
        <div class="card-header">
          <span>当前比赛</span>
          <div class="header-right">
            <el-tag 
              :type="currentCompetition.is_active ? 'success' : 'info'"
              effect="dark"
            >
              {{ currentCompetition.is_active ? '进行中' : '已结束' }}
            </el-tag>
            <el-button 
              v-if="currentCompetition.is_active"
              size="small" 
              type="danger"
              @click="showEndCompetitionDialog"
              style="margin-left: 10px;"
            >
              结束比赛
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="competition-info">
        <h3>{{ currentCompetition.title }}</h3>
        <p>{{ currentCompetition.description }}</p>
        <div class="time-info">
          <div class="time-item">
            <span class="label">开始：</span>
            <span>{{ formatTime(currentCompetition.start_time) }}</span>
          </div>
          <div class="time-item">
            <span class="label">结束：</span>
            <span>{{ formatTime(currentCompetition.end_time) }}</span>
          </div>
          <div class="time-item" v-if="currentCompetition.is_active">
            <span class="label">剩余：</span>
            <span class="countdown">{{ formatCountdown(currentCompetition.time_remaining) }}</span>
          </div>
        </div>
        <div class="submission-count">
          <span>参赛作品：{{ currentCompetition.submissions_count }} 个</span>
        </div>
      </div>
    </el-card>

    <!-- 待审核作品 -->
    <el-card class="pending-submissions-card">
      <template #header>
        <div class="card-header">
          <span>待审核作品</span>
          <el-badge :value="pendingSubmissions.length" class="badge">
            <el-button size="small" @click="loadPendingSubmissions">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </el-badge>
        </div>
      </template>

      <div v-if="pendingSubmissions.length === 0" class="empty-state">
        <el-empty description="暂无待审核作品" />
      </div>

      <div v-else class="submissions-list">
        <div 
          v-for="submission in pendingSubmissions" 
          :key="submission.id"
          class="submission-item"
        >          <div class="submission-info">
            <h4>{{ submission.title }}</h4>
            <div class="submission-meta">
              <span>作者：{{ submission.author }}</span>
              <span>分类：{{ submission.category }}</span>
              <span v-if="submission.competition_title">比赛：{{ submission.competition_title }}</span>
              <span>提交时间：{{ formatTime(submission.created_at) }}</span>
            </div>
            <p class="submission-content">{{ truncateText(submission.content, 100) }}</p>
          </div>
          <div class="submission-actions">
            <el-button size="small" @click="viewSubmission(submission)">
              查看详情
            </el-button>
            <el-button 
              size="small" 
              type="success"
              @click="reviewSubmission(submission.id, 'approve')"
            >
              通过
            </el-button>
            <el-button 
              size="small" 
              type="danger"
              @click="reviewSubmission(submission.id, 'reject')"
            >
              拒绝
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 已通过作品管理 -->
    <el-card class="approved-submissions-card">
      <template #header>
        <div class="card-header">
          <span>已通过作品管理</span>
          <el-button size="small" @click="loadApprovedSubmissions">
            <el-icon><Refresh /></el-icon>
            加载
          </el-button>
        </div>
      </template>

      <div v-if="approvedSubmissions.length === 0" class="empty-state">
        <el-empty description="暂无已通过作品" />
      </div>

      <div v-else class="approved-list">
        <div 
          v-for="submission in approvedSubmissions" 
          :key="submission.id"
          class="approved-item"
        >          <div class="approved-info">
            <h4>{{ submission.title }}</h4>
            <div class="approved-meta">
              <span>作者：{{ submission.author }}</span>
              <span>分类：{{ submission.category }}</span>
              <span v-if="submission.competition_title">比赛：{{ submission.competition_title }}</span>
              <el-tag 
                v-if="submission.promoted_to_prompt" 
                type="success" 
                size="small"
              >
                已推广
              </el-tag>
            </div>
          </div>          <div class="approved-actions">
            <el-button size="small" @click="viewSubmission(submission)">
              查看详情
            </el-button>
            <el-button 
              v-if="!submission.promoted_to_prompt"
              size="small" 
              type="primary"
              @click="promoteToPrompt(submission.id)"
            >
              推广为普通提示词
            </el-button>
            <el-button 
              v-if="submission.promoted_to_prompt"
              size="small" 
              type="warning"
              @click="unpromoteSubmission(submission.id)"
            >
              撤销推广
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 创建比赛对话框 -->
    <CreateCompetitionDialog 
      v-model:visible="showCreateDialog"
      @created="handleCompetitionCreated"
    />

    <!-- 作品详情对话框 -->
    <SubmissionDetailDialog 
      v-model:visible="showDetailDialog"
      :submission="selectedSubmission"
    />

    <!-- 审核对话框 -->
    <ReviewDialog 
      v-model:visible="showReviewDialog"
      :submission="selectedSubmission"
      :action="reviewAction"
      @reviewed="handleReviewed"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { getApiBaseUrl } from '../../config/api'
import CreateCompetitionDialog from './CreateCompetitionDialog.vue'
import SubmissionDetailDialog from '../competition/SubmissionDetailDialog.vue'
import ReviewDialog from './ReviewDialog.vue'

// 响应式数据
const stats = ref({
  total_competitions: 0,
  active_competitions: 0,
  total_submissions: 0,
  approved_submissions: 0
})

const currentCompetition = ref(null)
const pendingSubmissions = ref([])
const approvedSubmissions = ref([])
const selectedSubmission = ref(null)

const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showReviewDialog = ref(false)
const reviewAction = ref('')

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const loadData = async () => {
  await Promise.all([
    loadStats(),
    loadCurrentCompetition(),
    loadPendingSubmissions(),
    loadApprovedSubmissions()
  ])
}

const loadStats = async () => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/competition/stats`)
    stats.value = response.data
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const loadCurrentCompetition = async () => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/competition/current`)
    currentCompetition.value = response.data.competition
  } catch (error) {
    console.error('加载当前比赛失败:', error)
  }
}

const loadPendingSubmissions = async () => {
  try {
    const response = await axios.get(`${getApiBaseUrl()}/api/competition/admin/pending`)
    pendingSubmissions.value = response.data.submissions
  } catch (error) {
    console.error('加载待审核作品失败:', error)
  }
}

const loadApprovedSubmissions = async () => {
  try {
    // 这里需要添加获取已通过作品的API
    const response = await axios.get(`${getApiBaseUrl()}/api/competition/admin/approved`)
    approvedSubmissions.value = response.data.submissions
  } catch (error) {
    console.error('加载已通过作品失败:', error)
  }
}

const viewSubmission = (submission) => {
  selectedSubmission.value = submission
  showDetailDialog.value = true
}

const reviewSubmission = (submissionId, action) => {
  const submission = pendingSubmissions.value.find(s => s.id === submissionId)
  if (!submission) return

  selectedSubmission.value = submission
  reviewAction.value = action
  showReviewDialog.value = true
}

const handleReviewed = () => {
  loadPendingSubmissions()
  loadApprovedSubmissions()
  loadStats()
  showReviewDialog.value = false
}

const promoteToPrompt = async (submissionId) => {
  try {
    await ElMessageBox.confirm(
      '确定要将该作品推广为普通提示词吗？',
      '确认推广',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await axios.post(`${getApiBaseUrl()}/api/competition/admin/promote/${submissionId}`)
    ElMessage.success('作品推广成功')
    loadApprovedSubmissions()
    
  } catch (error) {
    if (error === 'cancel') return
    const msg = error.response?.data?.msg || '推广失败'
    ElMessage.error(msg)
  }
}

const unpromoteSubmission = async (submissionId) => {
  try {
    await ElMessageBox.confirm(
      '确定要撤销该作品的推广状态吗？这将删除对应的普通提示词。',
      '确认撤销推广',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true,
        message: '<p>撤销推广后：</p><ul><li>该作品将回到"已通过"状态</li><li>对应的普通提示词将被删除</li><li>相关的点赞记录也会被删除</li></ul>'
      }
    )

    await axios.post(`${getApiBaseUrl()}/api/competition/admin/unpromote/${submissionId}`)
    ElMessage.success('推广状态已撤销')
    loadApprovedSubmissions()
    
  } catch (error) {
    if (error === 'cancel') return
    const msg = error.response?.data?.msg || '撤销推广失败'
    ElMessage.error(msg)
  }
}

const showEndCompetitionDialog = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '确定要手动结束当前比赛吗？请输入结束原因（可选）：',
      '确认结束比赛',
      {
        confirmButtonText: '确定结束',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：提前结束、系统维护等',
        inputType: 'textarea',
        inputValidator: (value) => {
          // 允许空原因
          return true
        }
      }
    )

    await endCurrentCompetition(reason || '')
    
  } catch (error) {
    if (error === 'cancel') return
  }
}

const endCurrentCompetition = async (reason) => {
  try {
    await axios.post(`${getApiBaseUrl()}/api/competition/admin/end-current`, {
      reason: reason
    })
    
    ElMessage.success('比赛已手动结束')
    
    // 重新加载数据
    await loadData()
    
  } catch (error) {
    const msg = error.response?.data?.msg || '结束比赛失败'
    ElMessage.error(msg)
  }
}

const handleCompetitionCreated = () => {
  loadCurrentCompetition()
  loadStats()
  showCreateDialog.value = false
}

// 工具函数
const formatTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString('zh-CN')
}

const formatCountdown = (seconds) => {
  if (!seconds) return '已结束'
  
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<style scoped>
.competition-management {
  padding: 20px;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.management-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions .el-button {
  margin-left: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}

.stat-label {
  color: #606266;
  font-size: 0.9rem;
}

.current-competition-card,
.pending-submissions-card,
.approved-submissions-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.competition-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.competition-info p {
  color: #606266;
  margin-bottom: 15px;
}

.time-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
}

.time-item .label {
  font-weight: bold;
  color: #333;
}

.countdown {
  color: #e6a23c;
  font-weight: bold;
}

.submission-count {
  color: #909399;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

.submissions-list,
.approved-list {
  max-height: 400px;
  overflow-y: auto;
}

.submission-item,
.approved-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.submission-item:last-child,
.approved-item:last-child {
  border-bottom: none;
}

.submission-info,
.approved-info {
  flex: 1;
  margin-right: 20px;
}

.submission-info h4,
.approved-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.submission-meta,
.approved-meta {
  color: #909399;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.submission-meta span,
.approved-meta span {
  margin-right: 15px;
}

.submission-content {
  color: #606266;
  margin: 0;
  line-height: 1.4;
}

.submission-actions,
.approved-actions {
  display: flex;
  gap: 10px;
}

.badge {
  margin-left: 10px;
}

@media (max-width: 768px) {
  .competition-management {
    padding: 15px;
  }
  
  .management-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .submission-item,
  .approved-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .submission-actions,
  .approved-actions {
    margin-top: 10px;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
