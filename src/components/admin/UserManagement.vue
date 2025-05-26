<template>
  <div class="user-management">
    <!-- 用户管理标题 -->
    <div class="management-title-header">
      <h2 class="management-main-title">用户管理中心</h2>
      <p class="management-subtitle">管理系统用户权限与统计信息</p>
    </div>

    <div class="management-header">
      <h3>用户管理</h3>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名"
          style="width: 200px"
          @input="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="roleFilter" placeholder="筛选角色" @change="loadUsers" clearable>
          <el-option label="全部" value="" />
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
        <el-button @click="loadUsers" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 用户统计卡片 -->
    <div class="user-stats" v-if="userStats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ userStats.total }}</div>
              <div class="stat-label">总用户</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ userStats.admin }}</div>
              <div class="stat-label">管理员</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ userStats.regular }}</div>
              <div class="stat-label">普通用户</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ userStats.new_this_week || 0 }}</div>
              <div class="stat-label">本周新增</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 用户表格 -->
    <el-card class="table-card">
      <el-table 
        :data="users" 
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">
            <div class="username-cell">
              <span>{{ row.username }}</span>
              <el-tag 
                v-if="row.role === 'admin'" 
                type="warning" 
                size="small"
                class="role-tag"
              >
                管理员
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.role === 'admin' ? 'warning' : 'info'"
              size="small"
            >
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="内容统计" min-width="120">
          <template #default="{ row }">
            <div class="content-stats">
              <span>总计: {{ row.prompts_count || 0 }}</span>
              <span>已通过: {{ row.approved_prompts_count || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                v-if="row.role === 'user'"
                type="warning"
                size="small"
                @click="changeUserRole(row, 'admin')"
                :loading="changingRoles.has(row.id)"
                :disabled="isCurrentUser(row)"
              >
                升级
              </el-button>
              <el-button
                v-else
                type="info"
                size="small"
                @click="changeUserRole(row, 'user')"
                :loading="changingRoles.has(row.id)"
                :disabled="isCurrentUser(row)"
              >
                降级
              </el-button>
              <el-button
                size="small"
                @click="viewUserDetail(row)"
              >
                详情
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="用户详情" 
      width="600px"
    >
      <div v-if="selectedUser">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ selectedUser.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ selectedUser.username }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="selectedUser.role === 'admin' ? 'warning' : 'info'">
              {{ selectedUser.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(selectedUser.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="总内容数">{{ selectedUser.prompts_count || 0 }}</el-descriptions-item>
          <el-descriptions-item label="已通过内容">{{ selectedUser.approved_prompts_count || 0 }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import axios from 'axios'
import { getApiBaseUrl } from '../../config/api'

const emit = defineEmits(['refresh-stats'])

const userStore = useUserStore()

// 响应式数据
const loading = ref(false)
const users = ref([])
const userStats = ref(null)
const searchKeyword = ref('')
const roleFilter = ref('')
const changingRoles = ref(new Set())

const pagination = reactive({
  page: 1,
  per_page: 20,
  total: 0,
  pages: 0
})

const detailDialogVisible = ref(false)
const selectedUser = ref(null)

// 搜索防抖
let searchTimeout = null

// 生命周期
onMounted(() => {
  loadUsers()
})

// 方法
const loadUsers = async () => {
  try {
    loading.value = true
    
    const params = {
      page: pagination.page,
      per_page: pagination.per_page
    }
    
    if (searchKeyword.value.trim()) {
      params.search = searchKeyword.value.trim()
    }
    
    if (roleFilter.value) {
      params.role = roleFilter.value
    }
    
    const response = await axios.get(`${getApiBaseUrl()}/api/admin/users`, { params })
    
    users.value = response.data.users || []
    Object.assign(pagination, response.data.pagination)
    
    // 计算用户统计
    calculateUserStats()
    
    console.log('用户列表加载成功:', users.value.length)
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const calculateUserStats = () => {
  const stats = {
    total: pagination.total,
    admin: users.value.filter(u => u.role === 'admin').length,
    regular: users.value.filter(u => u.role === 'user').length,
    new_this_week: 0 // 这个需要从后端获取
  }
  userStats.value = stats
}

const handleSearch = () => {
  // 防抖搜索
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1 // 重置到第一页
    loadUsers()
  }, 500)
}

const changeUserRole = async (user, newRole) => {
  if (isCurrentUser(user)) {
    ElMessage.warning('不能修改自己的角色')
    return
  }
  
  try {
    const action = newRole === 'admin' ? '升级为管理员' : '降级为普通用户'
    await ElMessageBox.confirm(
      `确定要将用户 "${user.username}" ${action}吗？`,
      '确认操作',
      {
        type: 'warning'
      }
    )
    
    changingRoles.value.add(user.id)
    
    await axios.put(`${getApiBaseUrl()}/api/admin/users/${user.id}/role`, {
      role: newRole
    })
    
    ElMessage.success(`用户角色修改成功`)
    
    // 更新本地数据
    const userIndex = users.value.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users.value[userIndex].role = newRole
    }
    
    // 重新计算统计
    calculateUserStats()
    
    // 刷新统计数据
    emit('refresh-stats')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('修改用户角色失败:', error)
      ElMessage.error('修改用户角色失败')
    }
  } finally {
    changingRoles.value.delete(user.id)
  }
}

const viewUserDetail = (user) => {
  selectedUser.value = user
  detailDialogVisible.value = true
}

const isCurrentUser = (user) => {
  return user.id === userStore.userId || user.username === userStore.username
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 暴露方法给父组件
defineExpose({
  loadUsers
})
</script>

<style scoped>
.user-management {
  height: 100%;
  padding: 25px 30px;
  background: var(--hero-background);
  border-radius: 16px;
  position: relative;
}

.user-management::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px dashed var(--warning-color);
  border-radius: 16px;
  pointer-events: none;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.user-management:hover::before {
  opacity: 1;
}

.management-title-header {
  text-align: center;
  margin-bottom: 35px;
  padding: 25px 35px;
  background: var(--hero-background);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  border: 3px solid transparent;
  background-clip: padding-box;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
}

.management-title-header::before {
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
}

.management-title-header:hover::before {
  opacity: 0.2;
}

.management-main-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, var(--text-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  z-index: 1;
}

.management-subtitle {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin: 0;
  position: relative;
  z-index: 1;
  opacity: 0.9;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
  position: relative;
  z-index: 1;
}

.management-header h3 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.header-actions .el-button {
  background: var(--primary-color);
  border: none;
  color: white;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.user-stats {
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
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

.stat-item {
  padding: 18px 20px;
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 2rem;
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

.table-card {
  min-height: 420px;
  background: var(--external-bg);
  border-radius: 14px;
  backdrop-filter: blur(20px);
  border: 2px dashed transparent;
  position: relative;
  overflow: hidden;
}

.table-card::before {
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

.table-card:hover::before {
  opacity: 0.7;
}

.username-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.role-tag {
  font-size: 0.75rem;
  font-weight: 600;
}

.content-stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 25px;
  position: relative;
  z-index: 1;
}

/* 表格内按钮样式 - 使用纯色而非渐变 */
.table-card :deep(.el-button-group .el-button) {
  background: var(--primary-color);
  border: none;
  color: white;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  margin-right: 4px;
}

.table-card :deep(.el-button-group .el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.table-card :deep(.el-button-group .el-button[type="warning"]) {
  background: var(--warning-color, #e6a23c);
}

.table-card :deep(.el-button-group .el-button[type="info"]) {
  background: var(--info-color, #909399);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .user-management {
    background: var(--external-bg-dark);
  }
  
  .stat-card,
  .table-card {
    background: var(--external-bg-dark);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-management {
    padding: 20px 15px;
  }
  
  .management-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
    flex-direction: column;
  }
  
  .user-stats {
    margin-bottom: 20px;
  }
  
  .user-stats .el-col {
    margin-bottom: 12px;
  }
  
  .stat-value {
    font-size: 1.8rem;
  }
  
  .table-card :deep(.el-table) {
    font-size: 0.9rem;
  }
  
  .username-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .user-management {
    padding: 15px 10px;
  }
  
  .header-actions {
    gap: 10px;
  }
  
  .header-actions .el-input,
  .header-actions .el-select {
    width: 100% !important;
  }
  
  .stat-value {
    font-size: 1.6rem;
  }
  
  .table-card :deep(.el-table .el-button-group) {
    flex-direction: column;
    gap: 6px;
  }
  
  .table-card :deep(.el-table .el-button) {
    padding: 6px 10px;
    font-size: 0.8rem;
    margin-right: 0;
    width: 100%;
  }
  
  .content-stats {
    font-size: 0.8rem;
  }
}
</style>
