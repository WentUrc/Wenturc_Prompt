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
      </div>

      <!-- 主要功能标签页 -->
      <el-card class="main-tabs">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="内容审核" name="review">
            <ContentReview ref="contentReviewRef" @refresh-stats="loadStats" />
          </el-tab-pane>
          
          <el-tab-pane label="用户管理" name="users">
            <UserManagement ref="userManagementRef" @refresh-stats="loadStats" />
          </el-tab-pane>
          
          <el-tab-pane label="审核历史" name="history">
            <ReviewHistory ref="reviewHistoryRef" />
          </el-tab-pane>
          
          <el-tab-pane label="统计数据" name="stats">
            <AdminStats :stats="stats" @refresh="loadStats" />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { getApiBaseUrl } from '../config/api'

// 导入子组件
import ContentReview from '../components/admin/ContentReview.vue'
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

// 检查权限
onMounted(async () => {
  if (!userStore.isAdmin) {
    ElMessage.error('您没有权限访问管理员面板')
    router.push('/')
    return
  }
  
  await loadStats()
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
  background-color: var(--el-bg-color-page);
  padding: 20px;
}

.access-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.admin-content {
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  text-align: center;
  margin-bottom: 30px;
}

.admin-header h1 {
  font-size: 2.5rem;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.welcome-text {
  font-size: 1.1rem;
  color: var(--el-text-color-regular);
  margin: 0;
}

.stats-cards {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
}

.main-tabs {
  min-height: 600px;
}

.main-tabs :deep(.el-tabs__content) {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-panel {
    padding: 10px;
  }
  
  .admin-header h1 {
    font-size: 2rem;
  }
  
  .stats-cards {
    margin-bottom: 20px;
  }
  
  .main-tabs {
    min-height: 500px;
  }
  
  .main-tabs :deep(.el-tabs__content) {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .admin-header h1 {
    font-size: 1.8rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
