<template>
  <div class="user-management">
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
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.management-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.user-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-item {
  padding: 10px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--el-text-color-regular);
}

.table-card {
  min-height: 400px;
}

.username-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-tag {
  font-size: 0.75rem;
}

.content-stats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.85rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
    flex-direction: column;
  }
  
  .user-stats {
    margin-bottom: 15px;
  }
  
  .user-stats .el-col {
    margin-bottom: 10px;
  }
  
  .table-card :deep(.el-table) {
    font-size: 0.85rem;
  }
  
  .username-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .header-actions {
    gap: 8px;
  }
  
  .header-actions .el-input,
  .header-actions .el-select {
    width: 100% !important;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .table-card :deep(.el-table .el-button-group) {
    flex-direction: column;
    gap: 4px;
  }
  
  .table-card :deep(.el-table .el-button) {
    padding: 4px 8px;
    font-size: 0.75rem;
  }
}
</style>
