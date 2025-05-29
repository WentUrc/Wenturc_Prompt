<template>
  <div class="competition-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>🏆 哦哦哦，这不来玩玩？</h1>
      <p>展示您最具创意的提示词，获得AI评语反馈！</p>
    </div>

    <!-- 当前比赛 -->
    <div class="current-competition" v-if="currentCompetition">
      <el-card class="competition-card">
        <template #header>
          <div class="card-header">
            <span class="competition-title">{{ currentCompetition.title }}</span>
            <div class="time-info">
              <el-tag v-if="currentCompetition.is_active" type="success" effect="dark">
                进行中
              </el-tag>
              <el-tag v-else type="info" effect="dark">
                已结束
              </el-tag>
            </div>
          </div>
        </template>

        <div class="competition-content">
          <p class="competition-desc">{{ currentCompetition.description }}</p>
          
          <!-- 时间信息 -->
          <div class="time-section">
            <div class="time-item">
              <span class="label">开始时间：</span>
              <span>{{ formatTime(currentCompetition.start_time) }}</span>
            </div>
            <div class="time-item">
              <span class="label">结束时间：</span>
              <span>{{ formatTime(currentCompetition.end_time) }}</span>
            </div>
            <div class="time-item" v-if="currentCompetition.is_active">
              <span class="label">剩余时间：</span>
              <span class="countdown">{{ formatCountdown(timeRemaining) }}</span>
            </div>          
          </div>          
            <!-- 统计信息 -->
          <div class="stats-section">
            
            <!-- 参赛作品数量 - 桌面端显示 -->
            <div class="stat-item count-stat desktop-only">
              <div class="stat-visual">
                <span class="number">{{ currentCompetition.submissions_count || 0 }}</span>
              </div>
              <div class="stat-label">参赛作品</div>
            </div>

            <!-- 移动端：参赛作品 -->
            <div class="stat-item count-stat mobile-only">
              <div class="stat-visual">
                <span class="number">{{ currentCompetition.submissions_count || 0 }}</span>
              </div>
              <div class="stat-label">参赛作品</div>
            </div>              <!-- 贪吃蛇小游戏卡片 - 仅在大屏幕显示 -->
            <div class="stat-item game-stat desktop-game-only">
              <div class="stat-visual game-container">
                <SnakeGame class="snake-game-embedded" />
              </div>
              <div class="stat-label">贪吃蛇</div>
            </div>

            <!-- Bongo Cat小游戏卡片 - 仅在大屏幕显示 -->
            <div class="stat-item game-stat desktop-game-only">
              <div class="stat-visual game-container">
                <BongoCatOriginal class="bongo-cat-embedded" />
              </div>
              <div class="stat-label">Bongo Cat</div>
            </div>
          </div><!-- 操作按钮 -->
          <div class="action-section">            
            <transition name="button-bounce" appear>
              <el-button 
                type="primary" 
                size="large"
                class="animated-button primary-button"
                :disabled="!currentCompetition.is_active && !hasSubmitted"
                @click="handleSubmitButtonClick"
              >
                <el-icon class="button-icon"><EditPen /></el-icon>
                {{ hasSubmitted ? '已提交作品' : '提交作品' }}
              </el-button>            
            </transition>
            <transition name="button-slide-fade" mode="out-in" appear>
              <el-button
                v-if="!showSubmissions"
                key="view-submissions"
                size="large"
                class="animated-button secondary-button"
                @click="viewSubmissions"
              >
              <el-icon class="button-icon"><View /></el-icon>
                查看作品
              </el-button>              
              <el-button 
                  v-else
                  key="refresh-submissions"
                  size="large"
                  class="animated-button refresh-button"
                  :class="{ 'loading-state': loadingSubmissions }"
                  :disabled="loadingSubmissions"
                  @click="refreshSubmissions"
              >
                <el-icon class="button-icon" :class="{ 'rotating': loadingSubmissions }"><Refresh /></el-icon>
                <span class="button-text">{{ loadingSubmissions ? '刷新中' : '刷新作品' }}</span>
              </el-button>
            </transition>
          </div>        </div>
      </el-card>    </div>
    
    <!-- 参赛作品列表 -->
    <transition name="fade-slide" appear>
      <div class="submissions-section" v-if="showSubmissions">
        <h2>参赛作品</h2>
        <div class="submissions-grid">
          <transition-group 
            name="card-appear" 
            tag="div" 
            class="submissions-grid-container"
            appear
          >
            <div 
              v-for="(submission, index) in submissions" 
              :key="submission.id"
              class="submission-card"
              :style="{ '--delay': index * 0.1 + 's' }"
              @click="viewSubmissionDetail(submission)"
            >              <div class="card-content">
                <h3>{{ submission.title }}</h3>
                <p class="category">{{ submission.category }}</p>
                <p class="author">作者：{{ submission.author }}</p>              
                <p class="content">{{ truncateText(submission.content, 100) }}</p>              
              </div>
              <div class="ai-review" v-if="submission.ai_review">
                <h4>AI评语：</h4>
                <p class="ai-review-preview">{{ truncateText(submission.ai_review, 80) }}</p>
                <span class="view-detail-hint">点击查看完整评语...</span>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </transition><!-- 历史比赛 -->
    <div class="history-section">
      <h2>历史比赛</h2>
      
      <div v-if="loadingHistory" class="loading-section">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载历史比赛中...</span>
      </div>

      <div v-else-if="historyCompetitions.length === 0" class="empty-section">
        <el-empty description="暂无历史比赛" />
      </div>      <div v-else class="history-list">
        <div class="history-grid">
          <div 
            v-for="comp in historyCompetitions" 
            :key="comp.id"
            class="history-card-wrapper"
            @click="viewCompetitionDetail(comp.id)"
          >
            <div class="history-card-modern">
              <div class="card-header">
                <h3 class="competition-title">{{ comp.title }}</h3>
                <el-tag type="info" effect="dark" size="small">
                  已结束
                </el-tag>
              </div>
              
              <div class="card-content">
                <p class="competition-description">{{ comp.description }}</p>
                
                <div class="card-meta">
                  <div class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    <span>{{ formatTime(comp.start_time) }} - {{ formatTime(comp.end_time) }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Document /></el-icon>
                    <span>{{ comp.submissions_count }} 个作品</span>
                  </div>
                </div>
              </div>
              
              <div class="card-actions">
                <el-button type="primary" class="detail-btn">
                  <el-icon><View /></el-icon>
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 分页控制 -->
        <div class="pagination-section" v-if="historyPagination.pages > 1">
          <el-pagination
            v-model:current-page="historyPagination.page"
            :page-size="historyPagination.per_page"
            :total="historyPagination.total"
            layout="prev, pager, next"
            @current-change="loadHistory"
          />
        </div>
      </div>
    </div>

    <!-- 提交作品对话框 -->
    <SubmissionDialog 
      v-model:visible="showSubmitDialog"
      @submit="handleSubmit"
    />    <!-- 作品详情对话框 -->
    <SubmissionDetailDialog 
      v-model:visible="showDetailDialog"
      :submission="selectedSubmission"
    />

    <!-- 历史比赛详情对话框 -->
    <CompetitionDetailDialog 
      v-model:visible="showCompetitionDetailDialog"
      :competition-id="selectedCompetitionId"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, View, Loading, Refresh, Calendar, Document } from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import SubmissionDialog from '@/components/competition/SubmissionDialog.vue'
import SubmissionDetailDialog from '@/components/competition/SubmissionDetailDialog.vue'
import CompetitionDetailDialog from '@/components/competition/CompetitionDetailDialog.vue'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'
import CustomScrollbar from '@/components/common/CustomScrollbar.vue'
import SnakeGame from '@/components/game/SnakeGame.vue'
import BongoCatOriginal from '@/components/game/BongoCatOriginal.vue'

const userStore = useUserStore()

// 响应式数据
const currentCompetition = ref(null)
const submissions = ref([])
const historyCompetitions = ref([])
const mySubmissions = ref([])
const showSubmissions = ref(false)
const showSubmitDialog = ref(false)
const showDetailDialog = ref(false)
const showCompetitionDetailDialog = ref(false)
const selectedSubmission = ref(null)
const selectedCompetitionId = ref(null)
const timeRemaining = ref(0)
const timer = ref(null)
const loadingHistory = ref(false)
const loadingSubmissions = ref(false)
const historyPagination = ref({
  page: 1,
  per_page: 10,
  total: 0,
  pages: 0
})

// 计算属性
const hasSubmitted = computed(() => {
  if (!currentCompetition.value || !userStore.isLoggedIn) return false
  return mySubmissions.value.some(sub => 
    sub.competition_id === currentCompetition.value.id
  )
})

// 时间进度百分比（剩余时间的反向百分比）
const timeProgressPercentage = computed(() => {
  if (!currentCompetition.value || !currentCompetition.value.is_active || !currentCompetition.value.start_time || !currentCompetition.value.end_time) return 0
  
  const startTime = new Date(currentCompetition.value.start_time).getTime()
  const endTime = new Date(currentCompetition.value.end_time).getTime()
  const now = new Date().getTime()
  
  if (now < startTime) return 0
  if (now > endTime) return 100
  
  const totalDuration = endTime - startTime
  if (totalDuration <= 0) return 100
  
  const elapsed = now - startTime
  return Math.round((elapsed / totalDuration) * 100)
})

// 比赛进度百分比
const competitionProgressPercentage = computed(() => {
  return timeProgressPercentage.value
})

// 时间进度颜色（基于剩余时间动态变化）
const timeProgressColor = computed(() => {
  const percentage = timeProgressPercentage.value
  if (percentage < 50) return '#67c23a' // 绿色
  if (percentage < 80) return '#e6a23c' // 橙色
  return '#f56c6c' // 红色
})

// 比赛进度渐变色 - Element Plus 兼容格式
const progressGradient = computed(() => {
  return '#409eff'
})

// 生命周期
onMounted(() => {
  loadCurrentCompetition()
  loadHistory() // 自动加载历史比赛
  if (userStore.isLoggedIn) {
    loadMySubmissions()
  }
  startTimer()
})

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

// 方法
const loadCurrentCompetition = async () => {
  try {
    const response = await axios.get('/api/competition/current')
    currentCompetition.value = response.data.competition
    if (currentCompetition.value.submissions) {
      submissions.value = currentCompetition.value.submissions
    }
    updateTimeRemaining()
  } catch (error) {
    console.error('加载当前比赛失败:', error)
  }
}

const loadMySubmissions = async () => {
  try {
    const response = await axios.get('/api/competition/my-submissions')
    mySubmissions.value = response.data.submissions
  } catch (error) {
    console.error('加载我的提交失败:', error)
  }
}

const loadHistory = async (page = 1) => {
  loadingHistory.value = true
  try {
    const response = await axios.get('/api/competition/history', {
      params: {
        page: page,
        per_page: historyPagination.value.per_page
      }
    })
    historyCompetitions.value = response.data.competitions
    historyPagination.value = {
      page: response.data.page,
      per_page: response.data.per_page,
      total: response.data.total,
      pages: response.data.pages
    }
  } catch (error) {
    console.error('加载历史比赛失败:', error)
    ElMessage.error('加载历史比赛失败')
  } finally {
    loadingHistory.value = false
  }
}

const viewSubmissions = () => {
  showSubmissions.value = !showSubmissions.value
  if (showSubmissions.value && submissions.value.length === 0) {
    loadCurrentCompetition()
  }
}

const viewSubmissionDetail = (submission) => {
  selectedSubmission.value = submission
  showDetailDialog.value = true
}

const viewCompetitionDetail = async (competitionId) => {
  selectedCompetitionId.value = competitionId
  showCompetitionDetailDialog.value = true
}

const handleSubmit = async (submissionData) => {
  try {
    await axios.post('/api/competition/submit', submissionData)
    ElMessage.success('作品提交成功，等待管理员审核')
    showSubmitDialog.value = false
    loadMySubmissions()
  } catch (error) {
    const msg = error.response?.data?.msg || '提交失败'
    ElMessage.error(msg)
  }
}

const handleSubmitButtonClick = () => {
  // 检查比赛是否活跃
  if (!currentCompetition.value?.is_active) {
    ElMessage.warning('比赛已结束，无法提交作品')
    return
  }
  
  // 检查用户是否已提交
  if (hasSubmitted.value) {
    ElMessage.info('您已经提交过作品了，每个比赛周期只能提交一个作品')
    return
  }
  
  // 如果比赛活跃且用户未提交，则打开提交对话框
  showSubmitDialog.value = true
}

const refreshSubmissions = async () => {
  loadingSubmissions.value = true
  try {
    await loadCurrentCompetition()
    ElMessage.success('作品列表已刷新')
  } catch (error) {
    ElMessage.error('刷新失败，请稍后重试')
  } finally {
    loadingSubmissions.value = false
  }
}

const updateTimeRemaining = () => {
  if (currentCompetition.value && currentCompetition.value.is_active) {
    timeRemaining.value = currentCompetition.value.time_remaining
  }
}

const startTimer = () => {
  timer.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value -= 1
    } else if (currentCompetition.value && currentCompetition.value.is_active) {
      // 比赛结束，重新加载
      loadCurrentCompetition()
    }
  }, 1000)
}

// 工具函数
const formatTime = (timeString) => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString('zh-CN')
}

const formatCountdown = (seconds) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${secs}秒`
  } else {
    return `${secs}秒`
  }
}

const formatShortCountdown = (seconds) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}天`
  } else if (hours > 0) {
    return `${hours}小时`
  } else if (minutes > 0) {
    return `${minutes}分`
  } else {
    return `<1分`
  }
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}
</script>

<style scoped>
.competition-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: var(--text-color);
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  padding: 60px 20px;
  background-color: var(--hero-background, #f0f9ff);
  border-radius: 16px;
  margin-bottom: 40px;
  position: relative;
  z-index: 15; /* 提高z-index，确保在overlay层(z-index: 2)之上 */
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

/* 为page-header添加渐变边框效果 - 完全匹配hero样式 */
.page-header::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(
    45deg, 
    var(--secondary-color), 
    var(--primary-color) 50%,
    var(--accent-color, #67c23a) 100%
  );
  border-radius: 18px; /* 略大于page-header本身 */
  z-index: -1;
  opacity: 0.3;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.page-header:hover::before {
  opacity: 0.4; /* 悬停时轻微增加边框亮度 */
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 16px;
  color: var(--hero-title-color, #303133);
  font-weight: 700;
}

.page-header p {
  font-size: 1.25rem;
  color: var(--hero-text-color, #606266);
  margin: 0;
}

.current-competition {
  position: relative;
  z-index: 1;
}

:deep(.current-competition .el-card) {
  margin-bottom: 30px;
  border-radius: 16px;
  overflow: visible;
  box-shadow: var(--box-shadow);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  background: var(--background-color);
  border: none !important;
  z-index: 1;
}

/* 添加渐变边框效果 */
:deep(.current-competition .el-card)::before {
  content: "";
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(
    45deg, 
    var(--secondary-color), 
    var(--primary-color) 50%,
    var(--accent-color) 100%
  );
  border-radius: 20px;
  z-index: -1;
  opacity: 0.6;
  transition: all 0.3s ease;
}

:deep(.current-competition .el-card):hover::before {
  opacity: 0.8;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

:deep(.current-competition .el-card__header) {
  background: var(--background-color-light);
  border-bottom: none;
  padding: 20px 25px;
  position: relative;
  border-radius: 16px 16px 0 0;
}

:deep(.current-competition .el-card__header)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  opacity: 0.5;
}

:deep(.current-competition .el-card__body) {
  padding: 25px;
  background: var(--background-color);
  border-radius: 0 0 16px 16px;
}

/* 深色模式适配 */
.dark-mode :deep(.current-competition .el-card) {
  background: var(--background-color-dark);
}

.dark-mode :deep(.current-competition .el-card)::before {
  opacity: 0.25;
  background: linear-gradient(
    45deg, 
    var(--secondary-color), 
    var(--primary-color) 60%,
    rgba(255, 255, 255, 0.4) 100%
  );
}

.dark-mode :deep(.current-competition .el-card):hover::before {
  opacity: 0.4;
}

.dark-mode :deep(.current-competition .el-card__header) {
  background: var(--background-color-dark-hover);
  border-radius: 16px 16px 0 0;
}

.dark-mode :deep(.current-competition .el-card__body) {
  background: var(--background-color-dark);
  border-radius: 0 0 16px 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.competition-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.competition-content {
  padding: 0;
}

.competition-desc {
  font-size: 1.1rem;
  color: var(--text-color-secondary);
  margin-bottom: 25px;
  line-height: 1.6;
}

.time-section {
  background: var(--background-color-light);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 25px;
  border: 1px solid var(--border-color-light);
}

.time-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-item:last-child {
  margin-bottom: 0;
}

.time-item .label {
  font-weight: 600;
  color: var(--text-color);
  min-width: 80px;
}

.countdown {
  color: var(--warning-color);
  font-weight: 700;
  font-size: 1.1rem;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  padding: 25px;
  background: var(--background-color-light);
  border-radius: 16px;
  border: 1px solid var(--border-color-light);
}

/* 当比赛结束时显示两列布局 */
.stats-section.two-cols {
  grid-template-columns: repeat(2, 1fr);
}

.stat-item {
  text-align: center;
  padding: 20px 15px;
  border-radius: 12px;
  background: var(--background-color);
  border: 1px solid var(--border-color-light);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 210px;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.stat-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-item:hover::before {
  opacity: 1;
}

.stat-visual {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.stat-label {
  color: var(--text-color-secondary);
  font-weight: 500;
  font-size: 0.9rem;
  padding: 8px 0 0;
  border-top: 1px solid var(--border-color-light);
  margin-top: auto;
  position: absolute;
  border-radius: 0 0 12px 12px;
  bottom: 15px;
  left: 15px;
  right: 15px;
  background: var(--background-color);
}

/* 深色模式适配 */
.dark-mode .stat-label {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
  border-top-color: var(--border-color-dark);
  background: var(--background-color-dark);
}

/* 数量统计样式 */
.count-stat .stat-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 90%;
  margin-bottom: 15px;
  position: relative;
  overflow: hidden;
}

/* 为参赛作品添加时间图标背景 */
.count-stat .stat-visual::before {
  content: "🕒";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 8rem;
  opacity: 0.08;
  z-index: 0;
  pointer-events: none;
  transition: all 0.3s ease;
}

.count-stat:hover .stat-visual::before {
  opacity: 0.12;
  transform: translate(-50%, -50%) scale(1.05);
}

.count-stat .stat-visual .number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin: 0;
  position: relative;
  z-index: 1;
}

/* 游戏统计样式 */
.game-stat .stat-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: calc(100% - 40px);
  margin-bottom: 15px;
  overflow: hidden;
  position: relative;
}

.game-stat .stat-visual::before {
  content: "";
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.03), rgba(var(--accent-color-rgb, 103, 194, 58), 0.03));
  border-radius: 8px;
}

.game-stat:hover .stat-visual::before {
  background: linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.05), rgba(var(--accent-color-rgb, 103, 194, 58), 0.05));
}

.snake-game-embedded {
  transform: scale(0.95);
  width: 100%;
  max-height: 100%;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  z-index: 1;
  position: relative;
  transition: transform 0.3s ease;
}

.stat-item:hover .snake-game-embedded {
  transform: scale(1);
}

.bongo-cat-embedded {
  transform: scale(0.85);
  width: 100%;
  max-height: 100%;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  z-index: 1;
  position: relative;
  transition: transform 0.3s ease;
}

.stat-item:hover .bongo-cat-embedded {
  transform: scale(0.9);
}

.action-section {
  text-align: center;
  margin-top: 25px;
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* 按钮基础样式和动画 */
.animated-button {
  margin: 0;
  padding: 12px 30px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  will-change: transform;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.animated-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.animated-button:active {
  transform: translateY(0) scale(0.98);
  transition: all 0.1s ease;
}

/* 按钮图标动画 */
.button-icon {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  margin-right: 8px;
}

.animated-button:hover .button-icon {
  transform: scale(1.1) rotate(5deg);
}

/* 特殊按钮样式 */
.primary-button {
  background: var(--primary-color);
  border: none;
  color: white;
}

.primary-button:hover {
  background: var(--secondary-color);
}

.secondary-button {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.secondary-button:hover {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
  border-color: transparent;
}

.refresh-button {
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
  color: var(--primary-color);
  transition: all 0.3s ease;
}

.refresh-button:hover {
  background: color-mix(in srgb, var(--primary-color) 15%, transparent);
  border-color: color-mix(in srgb, var(--primary-color) 50%, transparent);
  color: var(--secondary-color);
}

.refresh-button:hover .button-icon {
  transform: scale(1.1) rotate(180deg);
}

/* 旋转动画 */
.button-icon.rotating {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 按钮文字过渡动画 */
.button-text {
  transition: all 0.3s ease;
  margin-left: 8px;
}

/* 按钮出现动画 */
.button-bounce-enter-active {
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transition-delay: 0.2s;
}

.button-bounce-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}

.button-bounce-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 按钮切换动画 - 优雅的滑动淡入淡出 */
.button-slide-fade-enter-active {
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transition-delay: 0.4s; /* 在主按钮之后出现 */
}

.button-slide-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.button-slide-fade-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}

.button-slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.button-slide-fade-enter-to,
.button-slide-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 初始出现时使用弹跳效果，切换时使用滑动效果 */
.button-slide-fade-enter-active[data-appear] {
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transition-delay: 0.4s; /* 在主按钮之后出现 */
}

.button-slide-fade-enter-from[data-appear] {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}

/* 深色模式下的按钮样式 */
.dark-mode .secondary-button {
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.dark-mode .secondary-button:hover {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: white;
}

/* 游戏样式已整合到stats-section中 */

.submissions-section {
  margin-bottom: 40px;
  margin-top: 40px;
}

.submissions-section h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary-color);
  display: inline-block;
}

.submissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-top: 25px;
}

.submissions-grid-container {
  display: contents;
}

/* 整体区域的淡入动画 */
.fade-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* 卡片逐个出现的动画 */
.card-appear-enter-active {
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: var(--delay, 0s);
}

.card-appear-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.8);
  filter: blur(4px);
}

.card-appear-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

/* 卡片移除动画 */
.card-appear-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.card-appear-leave-from {
  opacity: 1;
  transform: scale(1);
}

.card-appear-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.submission-card {
  background: var(--background-color);
  border: 1px solid var(--border-color-light);
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: var(--box-shadow);
  position: relative;
  overflow: hidden;
  will-change: transform, opacity;
  width: 100%;
  box-sizing: border-box;
  min-width: 0; /* 防止内容撑开容器 */
  height: 400px; /* 固定高度 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
  border-color: var(--primary-color);
}

.submission-card:hover::before {
  opacity: 1;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 自下而上的渐变蒙版效果 - 只针对参赛作品卡片 */
.submission-card .card-content::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(
    to top,
    var(--background-color) 0%,
    rgba(255, 255, 255, 0.9) 20%,
    rgba(255, 255, 255, 0.7) 40%,
    rgba(255, 255, 255, 0.3) 70%,
    transparent 100%
  );
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1;
}

/* 深色模式下的渐变蒙版 - 只针对参赛作品卡片 */
.dark-mode .submission-card .card-content::after {
  background: linear-gradient(
    to top,
    var(--background-color-dark, #1f2937) 0%,
    rgba(31, 41, 59, 0.9) 20%,
    rgba(31, 41, 59, 0.7) 40%,
    rgba(31, 41, 59, 0.3) 70%,
    transparent 100%
  );
}

/* 悬停时减弱蒙版效果 - 只针对参赛作品卡片 */
.submission-card:hover .card-content::after {
  opacity: 0.7;
}

.submission-card h3 {
  margin: 0 0 15px 0;
  color: var(--text-color);
  font-size: 1.3rem;
  font-weight: 600;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.submission-card .category {
  color: var(--primary-color);
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-weight: 500;
  word-wrap: break-word;
}

.submission-card .author {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin-bottom: 15px;
  font-weight: 500;
  word-wrap: break-word;
}

.submission-card .content {
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 0.95rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  flex: 1; /* 占据剩余空间 */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4; /* 最多显示4行 */
  line-clamp: 4; /* 标准属性 */
  -webkit-box-orient: vertical;
}

.ai-review {
  background: var(--accent-color);
  padding: 12px 15px;
  border-radius: 10px;
  border-left: 4px solid var(--primary-color);
  margin-top: auto; /* 推到底部 */
  flex-shrink: 0; /* 防止被压缩 */
  min-height: 60px; /* 最小高度 */
  max-height: 160px; /* 最大高度，防止过高 */
  overflow: hidden;
}

.ai-review h4 {
  margin: 0 0 10px 0;
  color: var(--primary-color);
  font-size: 0.95rem;
  font-weight: 600;
}

.ai-review-preview {
  margin: 0 0 8px 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.view-detail-hint {
  font-size: 0.8rem;
  color: var(--primary-color);
  font-style: italic;
  opacity: 0.8;
}

.ai-review p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.history-section {
  margin-top: 50px;
}

.history-section h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary-color);
  display: inline-block;
}

.loading-section {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-color-secondary);
}

.loading-section .el-icon {
  font-size: 32px;
  margin-right: 12px;
  color: var(--primary-color);
}

.empty-section {
  padding: 60px 20px;
}

.history-list {
  margin-top: 25px;
}

/* 历史比赛网格布局 */
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

/* 历史比赛现代化卡片样式 */
.history-card-wrapper {
  position: relative;
  transition: all 0.3s ease;
}

.history-card-modern {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  background-color: var(--card-background, #fff);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  overflow: visible;
}

/* 卡片渐变边框效果 - 调整z-index层级 */
.history-card-modern::before {
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
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.history-card-modern:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.history-card-modern:hover::before {
  opacity: 0.8;
}

/* 卡片头部样式 */
.history-card-modern .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 15px 20px;
  border-bottom: 1px solid var(--border-color-light, #e4e7ed);
}

.history-card-modern .competition-title {
  font-weight: 600;
  font-size: 18px;
  color: var(--text-color, #333333);
  margin: 0;
  line-height: 1.3;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 卡片内容样式 - 增加与边界线的距离 */
.history-card-modern .card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 20px 16px 20px;
}

.history-card-modern .competition-description {
  color: var(--text-color-secondary, #606266);
  margin-bottom: 20px;
  flex: 1;
  line-height: 1.6;
  font-size: 14px;
}

.history-card-modern .card-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 0;
}

.history-card-modern .meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-color-secondary, #909399);
}

.history-card-modern .meta-item .el-icon {
  color: var(--primary-color);
  font-size: 14px;
  flex-shrink: 0;
}

/* 卡片操作区域 */
.history-card-modern .card-actions {
  padding: 0 20px 20px 20px;
  margin-top: auto;
}

.history-card-modern .detail-btn {
  width: 100%;
  border-radius: 20px !important;
  transition: all 0.3s ease;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  height: 40px !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px;
  justify-content: center !important;
}

.history-card-modern .detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb, 64, 158, 255), 0.3);
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding: 20px;
}

/* 深色模式适配 */
.dark-mode .page-header {
  background-color: var(--background-color-dark, #1e293b) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: none;
}

/* 深色模式下page-header的渐变边框 */
.dark-mode .page-header::before {
  opacity: 0.25;
  background: linear-gradient(
    45deg, 
    var(--secondary-color), 
    var(--primary-color) 60%,
    rgba(255, 255, 255, 0.4) 100%
  );
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

.dark-mode .page-header:hover::before {
  opacity: 0.4;
}

.dark-mode .competition-card {
  background: var(--background-color-dark);
  border-color: var(--border-color-dark);
}

.dark-mode .submission-card {
  background-color: var(--background-color-dark, #1e293b) !important;
  border-color: var(--border-color-dark, #4b5563);
}

.dark-mode .history-card-modern {
  background-color: var(--card-background, rgba(30, 41, 59, 0.7));
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
}

.dark-mode .history-card-modern .card-header {
  border-bottom-color: var(--border-color-dark, #4b5563);
}

.dark-mode .history-card-modern .competition-title {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

.dark-mode .history-card-modern .competition-description {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

.dark-mode .history-card-modern .meta-item {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.85));
}

.dark-mode .history-card-modern .card-content {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

.dark-mode .time-section,
.dark-mode .stats-section {
  background-color: var(--background-color-dark-hover, #2d3748) !important;
  border-color: var(--border-color-dark, #4b5563);
}

.dark-mode .stat-item {
  background-color: var(--background-color-dark, #1e293b) !important;
  border-color: var(--border-color-dark, #4b5563);
}

.dark-mode .stat-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.dark-mode .count-stat .stat-visual .number {
  color: var(--primary-color);
}

.dark-mode .stat-item .label {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

.dark-mode .ai-review {
  background-color: rgba(var(--primary-color-rgb), 0.1);
  border-left-color: var(--primary-color);
}

.dark-mode .competition-title,
.dark-mode h1,
.dark-mode h2,
.dark-mode h3 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

.dark-mode .competition-desc,
.dark-mode p {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

.dark-mode .time-item .label {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

.dark-mode .stat-item .number {
  color: var(--primary-color);
}

.dark-mode .stat-item .label {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .competition-page {
    padding: 16px;
  }
    .submissions-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
  
  .history-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .competition-page {
    padding: 15px;
  }
    .page-header {
    padding: 40px 15px;
    margin-bottom: 35px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .page-header p {
    font-size: 1.1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .competition-title {
    font-size: 1.4rem;
  }
  
  .competition-desc {
    font-size: 1rem;
    margin-bottom: 20px;
  }
  
  :deep(.competition-card .el-card__header),
  :deep(.competition-card .el-card__body) {
    padding: 20px;
  }
    .time-section,
  .stats-section {
    padding: 16px;
    margin-bottom: 20px;
  }

  /* 移动端统计区域布局调整 */
  .stats-section {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 20px 16px;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .stat-item {
    padding: 16px 12px;
  }
  .count-stat .stat-visual .number {
    font-size: 2rem;
  }
  
  .time-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 10px;
  }
  
  .time-item .label {
    min-width: auto;
    font-size: 0.9rem;
  }
  
  .stat-item {
    padding: 0 20px;
  }
  
  .stat-item .number {
    font-size: 2rem;
  }
  
  .submissions-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .submission-card {
    padding: 20px;
    height: 370px; /* 移动端稍微降低高度 */
  }
    .action-section {
    margin-top: 20px;
    gap: 12px;
  }
  
  .animated-button {
    flex: 1;
    min-width: calc(50% - 6px);
    padding: 10px 16px;
  }
    .history-section {
    margin-top: 35px;
  }
  
  .history-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }  /* 新历史卡片响应式 */
  .history-card-modern .card-header {
    padding: 16px 16px 12px 16px;
  }
  
  .history-card-modern .card-content {
    padding: 20px 16px 16px 16px;
  }
  
  .history-card-modern .card-actions {
    padding: 0 16px 16px 16px;
  }
  
  .history-card-modern .competition-title {
    font-size: 16px;
    max-width: 85%;
  }
  
  .history-card-modern .competition-description {
    font-size: 13px;
  }
  
  .pagination-section {
    padding: 16px;
    margin-top: 30px;
  }
}

@media (max-width: 480px) {
  .competition-page {
    padding: 12px;
  }
    .page-header {
    padding: 30px 15px;
    margin-bottom: 30px;
    border-radius: 12px;
  }
  
  .page-header h1 {
    font-size: 1.8rem !important;
    margin-bottom: 12px;
    line-height: 1.3;
  }
  
  .page-header p {
    font-size: 1rem;
    margin-bottom: 16px;
  }
  
  .competition-title {
    font-size: 1.3rem;
  }
  
  .competition-desc {
    font-size: 0.95rem;
  }
  
  /* 游戏区域移动端优化 */
  .game-section {
    margin: 30px 0;
  }
  
  .game-card-header {
    padding: 14px 16px;
  }
  
  :deep(.competition-card .el-card__header),
  :deep(.competition-card .el-card__body) {
    padding: 16px;
  }
    .time-section,
  .stats-section {
    padding: 14px;
  }

  /* 小屏幕统计区域优化 */
  .stats-section {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 16px 14px;
  }

  .stat-item {
    padding: 14px 10px;
  }

  .count-stat .stat-visual .number {
    font-size: 1.8rem;
  }
  .stat-item .label {
    font-size: 0.8rem;
  }

  .submission-card {
    padding: 16px;
    height: 400px; /* 小屏幕进一步降低高度 */
  }
  
  .submission-card h3 {
    font-size: 1.2rem;
  }

  .action-section .el-button {
    width: 100%;
    margin: 4px 0;
    padding: 12px;
  }

  .animated-button {
    width: 100%;
    margin: 4px 0;
    padding: 12px;
  }
  
  .history-grid {
    gap: 12px;
  }
    
  .history-meta {
    gap: 4px;
    font-size: 0.8rem;
  }
    /* 新历史卡片小屏幕响应式 */
  .history-card-modern .card-header {
    padding: 14px 14px 10px 14px;
  }
  
  .history-card-modern .card-content {
    padding: 18px 14px 14px 14px;
  }
  
  .history-card-modern .card-actions {
    padding: 0 14px 14px 14px;
  }
  
  .history-card-modern .competition-title {
    font-size: 15px;
  }
  
  .history-card-modern .competition-description {
    font-size: 12px;
  }
  
  .history-card-modern .meta-item {
    font-size: 11px;
  }
  
  .history-card-modern .detail-btn {
    height: 36px !important;
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .competition-page {
    padding: 10px;
  }
    .page-header {
    padding: 16px 10px;
    margin-bottom: 20px;
  }
  
  .page-header h1 {
    font-size: 1.6rem;
  }
  
  .page-header p {
    font-size: 0.9rem;
  }
  
  .submissions-grid {
    gap: 12px;
  }

  .submission-card {
    padding: 14px;
    height: 360px; /* 超小屏幕最紧凑的高度 */
  }
    .time-section,
  .stats-section {
    padding: 12px;
  }

  /* 超小屏幕统计区域紧凑布局 */
  .stats-section {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 14px 12px;
  }

  .stat-item {
    padding: 12px 8px;
  }

  .count-stat .stat-visual .number {
    font-size: 1.6rem;
  }

  .stat-item .label {
    font-size: 0.75rem;  }
    
  :deep(.competition-card .el-card__header),
  :deep(.competition-card .el-card__body) {
    padding: 14px;
  }
}

/* 高DPI屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2) and (max-width: 768px) {
  .page-header h1,
  .competition-title,
  .submissions-section h2,
  .history-section h2 {
    font-weight: 600;
    letter-spacing: -0.02em;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .submission-card:hover,
  .history-card-modern:hover,
  .competition-card:hover {
    transform: none;
  }
  
  .animated-button {
    min-height: 48px;
  }
  
  .animated-button:hover {
    transform: none;
  }
  
  .animated-button:active {
    transform: scale(0.95);
  }
}

/* Competition 页面中 el-dialog 深浅主题适配 */
:deep(.el-dialog) {
  background: var(--background-color);
  color: var(--text-color);
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

:deep(.el-dialog__header) {
  background: transparent;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color-light);
  padding: 20px 24px 16px;
}

:deep(.el-dialog__title) {
  color: var(--text-color);
  font-weight: 600;
  font-size: 1.2rem;
}

:deep(.el-dialog__body) {
  background: var(--background-color);
  color: var(--text-color);
  padding: 24px;
}

:deep(.el-dialog__close) {
  color: var(--text-color-secondary);
  font-size: 20px !important;
  width: 24px !important;
  height: 24px !important;
  transition: all 0.3s ease;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-dialog__close):hover {
  color: var(--text-color);
  background: var(--background-color-light);
  transform: scale(1.05);
}

/* 深色模式下的 el-dialog 适配 */
.dark-mode :deep(.el-dialog) {
  background: var(--background-color);
  color: var(--text-color);
  border-color: var(--border-color);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
}

.dark-mode :deep(.el-dialog__header) {
  background: transparent;
  color: var(--text-color);
  border-bottom-color: var(--border-color);
}

.dark-mode :deep(.el-dialog__title) {
  color: var(--text-color);
}

.dark-mode :deep(.el-dialog__body) {
  background: var(--background-color);
  color: var(--text-color);
}

.dark-mode :deep(.el-dialog__close) {
  color: var(--text-color-secondary);
}

.dark-mode :deep(.el-dialog__close):hover {
  color: var(--text-color);
  background: var(--background-color-light);
}

/* 对话框内容元素的深浅主题适配 */
:deep(.el-dialog .el-form-item__label) {
  color: var(--text-color);
}

:deep(.el-dialog .el-input__inner) {
  background: var(--background-color);
  border-color: var(--border-color-light);
  color: var(--text-color);
}

:deep(.el-dialog .el-textarea__inner) {
  background: var(--background-color);
  border-color: var(--border-color-light);
  color: var(--text-color);
}

:deep(.el-dialog .el-select .el-input__inner) {
  background: var(--background-color);
  border-color: var(--border-color-light);
  color: var(--text-color);
}

/* 深色模式下的表单元素 */
.dark-mode :deep(.el-dialog .el-input__inner),
.dark-mode :deep(.el-dialog .el-textarea__inner),
.dark-mode :deep(.el-dialog .el-select .el-input__inner) {
  background: var(--background-color);
  border-color: var(--border-color);
  color: var(--text-color);
}

.dark-mode :deep(.el-dialog .el-input__inner:focus),
.dark-mode :deep(.el-dialog .el-textarea__inner:focus) {
  border-color: var(--primary-color);
}

.dark-mode :deep(.el-dialog .el-form-item__label) {
  color: var(--text-color);
}

/* 对话框中的按钮适配 */
:deep(.el-dialog .el-button--default) {
  background: var(--background-color);
  border-color: var(--border-color-light);
  color: var(--text-color);
}

.dark-mode :deep(.el-dialog .el-button--default) {
  background: var(--background-color-light);
  border-color: var(--border-color);
  color: var(--text-color);
}

.dark-mode :deep(.el-dialog .el-button--default):hover {
  background: var(--background-color-hover);
  border-color: var(--primary-color);
}

/* 响应式显示控制 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

.desktop-game-only {
  display: block;
}

@media (max-width: 764px) {
  .desktop-game-only {
    display: none;
  }
  
  /* 当游戏隐藏时，让参赛作品卡片占满整个统计区域 */
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .count-stat.desktop-only {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .mobile-only {
    display: block;
  }
}
</style>
