<template>
  <div class="admin-panel">
    <!-- 权限检查 -->
    <div v-if="!userStore.isAdmin" class="access-denied">
      <el-result 
        icon="warning" 
        title="访问被拒绝" 
        sub-title="您没有权限访问管理员面板"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
        </template>
      </el-result>
    </div>

    <!-- 管理员面板内容 -->
    <div v-else class="admin-content">
      <div class="admin-header">
        <h1>管理员面板</h1>
        <p class="welcome-text">欢迎, {{ userStore.username }}</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards" v-if="stats">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.users?.total || 0 }}</div>
                <div class="stat-label">总用户数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.prompts?.pending || 0 }}</div>
                <div class="stat-label">待审核</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.prompts?.approved || 0 }}</div>
                <div class="stat-label">已通过</div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ stats.users?.admin || 0 }}</div>
                <div class="stat-label">管理员</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>      <!-- 主要功能标签页 -->
      <div class="main-tabs">        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="内容审核" name="review">
            <ContentReview ref="contentReviewRef" @refresh-stats="loadStats" />
          </el-tab-pane>
          
          <el-tab-pane label="比赛管理" name="competition">
            <CompetitionManagement ref="competitionManagementRef" @refresh-stats="loadStats" />
          </el-tab-pane>
          
          <el-tab-pane label="用户管理" name="users">
            <UserManagement ref="userManagementRef" @refresh-stats="loadStats" />
          </el-tab-pane>
          
          <el-tab-pane label="审核历史" name="history">
            <ReviewHistory ref="reviewHistoryRef" />
          </el-tab-pane>
            <el-tab-pane label="统计数据" name="stats">
            <AdminStats ref="adminStatsRef" :stats="stats" @refresh="loadStats" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { getApiBaseUrl } from '../config/api'

// 导入子组件
import ContentReview from '../components/admin/ContentReview.vue'
import CompetitionManagement from '../components/admin/CompetitionManagement.vue'
import UserManagement from '../components/admin/UserManagement.vue'
import ReviewHistory from '../components/admin/ReviewHistory.vue'
import AdminStats from '../components/admin/AdminStats.vue'

const userStore = useUserStore()
const router = useRouter()
const baseURL = getApiBaseUrl()

const activeTab = ref('review')
const stats = ref(null)
const loading = ref(false)

// 子组件引用
const contentReviewRef = ref(null)
const userManagementRef = ref(null)
const reviewHistoryRef = ref(null)
const adminStatsRef = ref(null)

// 检查权限
onMounted(async () => {
  if (!userStore.isAdmin) {
    ElMessage.error('您没有权限访问管理员面板')
    router.push('/')
    return
  }
  
  await loadStats()
})

// 监听标签页切换
watch(activeTab, async (newTab, oldTab) => {
  if (newTab === 'stats') {
    // 切换到统计数据标签页时，等待DOM更新后重新初始化图表
    await nextTick()
    // 给一些额外时间让标签页内容完全显示
    setTimeout(() => {
      if (adminStatsRef.value && adminStatsRef.value.reinitializeCharts) {
        adminStatsRef.value.reinitializeCharts()
      }
    }, 200)
  }
})

// 加载统计数据
const loadStats = async () => {
  try {
    loading.value = true
    const response = await axios.get(`${baseURL}/api/admin/stats`)
    stats.value = response.data
    console.log('统计数据加载成功:', stats.value)
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-panel {
  min-height: calc(100vh - 60px);
  background: var(--hero-background);
  padding: 25px 30px;
  position: relative;
  border-radius: 20px;
  margin: 10px;
}

.admin-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed var(--warning-color);
  border-radius: 16px;
  pointer-events: none;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.admin-panel:hover::before {
  opacity: 0.8;
}

.access-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  background: var(--external-bg);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
}

.admin-content {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.admin-header {
  text-align: center;
  margin-bottom: 35px;
  padding: 30px 40px;
  background: var(--hero-background);
  border-radius: 16px;
  position: relative;
  overflow: visible;
  border: 3px solid transparent;
  background-clip: padding-box;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
}

.admin-header::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color), var(--primary-color));
  background-size: 200% 200%;
  animation: gradientShift 3s ease infinite;
  border-radius: 19px;
  z-index: -1;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.admin-header:hover::before {
  opacity: 1;
}

.admin-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--text-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  z-index: 1;
}

.welcome-text {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
  margin: 0;
  position: relative;
  z-index: 1;
  opacity: 0.9;
  font-weight: 500;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.stats-cards {
  margin-bottom: 35px;
}

.stat-card {
  text-align: center;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
  background: var(--external-bg);
  border-radius: 14px;
  backdrop-filter: blur(20px);
  border: 2px dashed transparent;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed var(--warning-color);
  border-radius: 14px;
  opacity: 0.3;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.stat-card:hover::before {
  opacity: 0.8;
}

.stat-content {
  padding: 18px 20px;
  position: relative;
  z-index: 1;
}

.stat-number {
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.main-tabs {
  min-height: 620px;
  position: relative;
}

.main-tabs::before {
  display: none;
}

.main-tabs :deep(.el-tabs__content) {
  padding: 25px;
  position: relative;
}

.main-tabs :deep(.el-tabs__nav-wrap) {
  position: relative;
}

.main-tabs :deep(.el-tabs__item) {
  font-weight: 600;
  font-size: 1rem;
  padding: 0 25px;
  transition: all 0.3s ease;
}

.main-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 700;
}

/* Element Plus 统计卡片样式覆盖 */
.stat-card :deep(.el-card) {
  background: var(--external-bg) !important;
  border: 2px solid transparent !important;
  border-radius: 14px !important;
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card::before) {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 14px;
  z-index: 0;
}

.stat-card :deep(.el-card__body) {
  background: var(--external-bg) !important;
  border-radius: 12px;
  position: relative;
  z-index: 1;
}

/* 深色模式下加深卡片背景 */
@media (prefers-color-scheme: dark) {
  .stat-card :deep(.el-card) {
    background: var(--card-bg-dark) !important;
  }
  
  .stat-card :deep(.el-card__body) {
    background: var(--card-bg-dark) !important;
  }
}

:global(.dark-mode) .stat-card :deep(.el-card) {
  background: var(--card-bg-dark) !important;
}

:global(.dark-mode) .stat-card :deep(.el-card__body) {
  background: var(--card-bg-dark) !important;
}

/* Element Plus 标签页样式覆盖 */
.main-tabs :deep(.el-tabs) {
  background: transparent !important;
  border-radius: 16px !important;
}

/* 确保Element Plus弹窗组件始终显示在标签页之上 */
:global(.el-overlay),
:global(.el-dialog),
:global(.el-message-box),
:global(.el-loading-mask),
:global(.el-drawer),
:global(.el-popover),
:global(.el-tooltip__popper) {
  z-index: 2000 !important;
}

/* 为 border-card 类型的标签页添加圆角 */
.main-tabs :deep(.el-tabs--border-card) {
  border-radius: 16px !important;
  overflow: hidden !important;
  border: 1px solid var(--border-color) !important;
}

.main-tabs :deep(.el-tabs--border-card > .el-tabs__header) {
  border-radius: 16px 16px 0 0 !important;
  overflow: hidden !important;
  margin: 0 !important;
  border-bottom: 1px solid var(--border-color) !important;
  background: var(--external-bg) !important;
}

.main-tabs :deep(.el-tabs--border-card > .el-tabs__content) {
  border-radius: 0 0 16px 16px !important;
  border: none !important;
  background: var(--external-bg) !important;
}

.main-tabs :deep(.el-tabs__nav-scroll) {
  background: var(--external-bg) !important;
  border-radius: 16px 16px 0 0 !important;
  padding: 8px 12px 0 12px;
  border: none !important;
  position: relative;
}

/* 确保选项卡文字在深色模式下可见 */
.main-tabs :deep(.el-tabs__nav-scroll .el-tabs__nav) {
  background: transparent !important;
}

.main-tabs :deep(.el-tabs__item) {
  background: transparent !important;
  border: none !important;
}

.main-tabs :deep(.el-tabs__nav-scroll::before) {
  display: none;
}

.main-tabs :deep(.el-tabs__nav-wrap) {
  position: relative;
  background: transparent !important;
}

.main-tabs :deep(.el-tabs__nav) {
  background: transparent !important;
  border: none !important;
}

.main-tabs :deep(.el-tabs__item) {
  font-weight: 600;
  font-size: 1rem;
  padding: 12px 25px;
  transition: all 0.3s ease;
  background: transparent !important;
  border: none !important;
  color: var(--text-color-secondary) !important;
  border-radius: 12px 12px 0 0;
  margin: 0 2px;
}

.main-tabs :deep(.el-tabs__item:hover) {
  background: rgba(var(--primary-color-rgb), 0.1) !important;
  color: var(--primary-color) !important;
}

.main-tabs :deep(.el-tabs__item.is-active) {
  background: var(--external-bg) !important;
  color: var(--primary-color) !important;
  font-weight: 700;
}

.main-tabs :deep(.el-tabs__content) {
  background: var(--external-bg) !important;
  border-radius: 0 0 16px 16px !important;
  padding: 25px;
  position: relative;
  border: none !important;
}

.main-tabs :deep(.el-tabs__content::before) {
  display: none;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .admin-panel {
    background: var(--external-bg-dark);
  }
  
  .admin-header::before {
    background: linear-gradient(135deg, 
      var(--primary-color), 
      var(--accent-color), 
      var(--primary-color)
    );
    opacity: 0.9;
  }
  
  .access-denied,
  .stat-card {
    background: var(--external-bg-dark);
  }
  
  .main-tabs :deep(.el-tabs__nav-scroll),
  .main-tabs :deep(.el-tabs__content),
  .main-tabs :deep(.el-tabs--border-card > .el-tabs__header),
  .main-tabs :deep(.el-tabs--border-card > .el-tabs__content) {
    background: var(--external-bg-dark) !important;
  }
  
  .main-tabs :deep(.el-tabs__nav-scroll .el-tabs__nav) {
    background: transparent !important;
  }
  
  .main-tabs :deep(.el-tabs__item) {
    color: var(--text-color-secondary) !important;
    background: transparent !important;
  }
    .main-tabs :deep(.el-tabs__item:hover) {
    background: rgba(var(--primary-color-rgb), 0.15) !important;
    color: var(--text-color) !important;
  }
    .main-tabs :deep(.el-tabs__item.is-active) {
    color: var(--primary-color) !important;
    background: var(--external-bg-dark) !important;
  }
}

:global(.dark-mode) .admin-panel {
  background: var(--external-bg-dark);
}

:global(.dark-mode) .admin-header::before {
  background: linear-gradient(135deg, 
    var(--primary-color), 
    var(--accent-color), 
    var(--primary-color)
  );
  opacity: 0.9;
}

:global(.dark-mode) .access-denied,
:global(.dark-mode) .stat-card {
  background: var(--external-bg-dark);
}

:global(.dark-mode) .main-tabs :deep(.el-tabs__nav-scroll),
:global(.dark-mode) .main-tabs :deep(.el-tabs__content),
:global(.dark-mode) .main-tabs :deep(.el-tabs--border-card > .el-tabs__header),
:global(.dark-mode) .main-tabs :deep(.el-tabs--border-card > .el-tabs__content) {
  background: var(--external-bg-dark) !important;
}

:global(.dark-mode) .main-tabs :deep(.el-tabs__nav-scroll .el-tabs__nav) {
  background: transparent !important;
}

:global(.dark-mode) .main-tabs :deep(.el-tabs__item) {
  color: var(--text-color-secondary) !important;
  background: transparent !important;
}

:global(.dark-mode) .main-tabs :deep(.el-tabs__item:hover) {
  background: rgba(var(--primary-color-rgb), 0.15) !important;
  color: var(--text-color) !important;
}

:global(.dark-mode) .main-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary-color) !important;
  background: var(--external-bg-dark) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-panel {
    padding: 20px 15px;
  }
  
  .admin-header {
    padding: 25px 30px;
  }
  
  .admin-header h1 {
    font-size: 2.2rem;
  }
  
  .welcome-text {
    font-size: 1.1rem;
  }
  
  .stats-cards {
    margin-bottom: 25px;
  }
  
  .stat-number {
    font-size: 1.8rem;
  }
  
  .main-tabs {
    min-height: 520px;
  }
  
  .main-tabs :deep(.el-tabs__content) {
    padding: 20px 15px;
  }
  
  .main-tabs :deep(.el-tabs__item) {
    padding: 0 15px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .admin-panel {
    padding: 15px 10px;
  }
  
  .admin-header {
    padding: 20px 25px;
  }
  
  .admin-header h1 {
    font-size: 1.9rem;
  }
  
  .welcome-text {
    font-size: 1rem;
  }
  
  .stat-number {
    font-size: 1.6rem;
  }
  
  .main-tabs {
    min-height: 450px;
  }
  
  .main-tabs :deep(.el-tabs__content) {
    padding: 15px 10px;
  }
  
  .main-tabs :deep(.el-tabs__item) {
    padding: 0 10px;
    font-size: 0.85rem;
  }
}
</style>
