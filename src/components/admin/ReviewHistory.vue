<template>
  <div class="review-history">
    <!-- 审核历史标题 -->
    <div class="history-header">
      <h2 class="history-title">审核历史管理</h2>
      <p class="history-subtitle">查看和管理所有内容审核记录</p>
    </div>

    <!-- 搜索筛选区域 --><el-card class="search-card" shadow="hover">
      <div class="search-filters">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="filters.search"
              placeholder="搜索内容标题..."
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="filters.action"
              placeholder="审核结果"
              clearable
              @change="loadReviewHistory"
            >
              <el-option label="全部" value="" />
              <el-option label="已批准" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select
              v-model="filters.reviewer"
              placeholder="审核人"
              clearable
              @change="loadReviewHistory"
            >
              <el-option label="全部" value="" />
              <el-option 
                v-for="reviewer in reviewers" 
                :key="reviewer.id"
                :label="reviewer.username"
                :value="reviewer.id"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="loadReviewHistory"
            />
          </el-col>
          <el-col :span="4">
            <el-button type="primary" @click="exportHistory">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总审核数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card approved">
          <div class="stat-content">
            <div class="stat-value">{{ stats.approved }}</div>
            <div class="stat-label">已批准</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card rejected">
          <div class="stat-content">
            <div class="stat-value">{{ stats.rejected }}</div>
            <div class="stat-label">已拒绝</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.avgResponseTime }}</div>
            <div class="stat-label">平均响应时间</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 审核历史列表 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>审核历史</span>
          <div class="header-actions">
            <el-button
              type="danger"
              :disabled="!selectedPrompts.length"
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
            <el-button link @click="loadReviewHistory">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="reviewHistory"
        stripe
        style="width: 100%"
        @sort-change="handleSortChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" :selectable="isSelectable" />
        <el-table-column prop="id" label="ID" width="80" sortable />
          <el-table-column prop="title" label="内容标题" min-width="200">
          <template #default="scope">
            <el-button
              link
              @click="viewPromptDetail(scope.row)"
              class="prompt-title-link"
            >
              {{ scope.row.title || '未知标题' }}
            </el-button>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="审核结果" width="100">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 'approved' ? 'success' : 'danger'"
              size="small"
            >
              {{ scope.row.status === 'approved' ? '已批准' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="reviewer_name" label="审核人" width="120" />

        <el-table-column prop="review_comment" label="审核备注" min-width="200">
          <template #default="scope">
            <span v-if="scope.row.review_comment">
              {{ scope.row.review_comment }}
            </span>
            <span v-else class="text-muted">无备注</span>
          </template>
        </el-table-column>

        <el-table-column prop="reviewed_at" label="审核时间" width="180" sortable>
          <template #default="scope">
            {{ formatDateTime(scope.row.reviewed_at) }}
          </template>
        </el-table-column>        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              link
              size="small"
              @click="viewDetails(scope.row)"
            >
              查看详情
            </el-button>
            <el-button
              link
              size="small"
              @click="rollbackReview(scope.row)"
            >
              撤销审核
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
              :disabled="scope.row.status === 'approved'"
              :title="scope.row.status === 'approved' ? '已通过审核的内容不能删除' : ''"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialog.visible"
      title="审核详情"
      width="60%"
      :before-close="closeDetailDialog"
    >
      <div v-if="detailDialog.data" class="review-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="审核ID">
            {{ detailDialog.data.id }}
          </el-descriptions-item>
          <el-descriptions-item label="内容ID">
            {{ detailDialog.data.id }}
          </el-descriptions-item>
          <el-descriptions-item label="内容标题">
            {{ detailDialog.data.title }}
          </el-descriptions-item>
          <el-descriptions-item label="内容作者">
            {{ detailDialog.data.author_name }}
          </el-descriptions-item>
          <el-descriptions-item label="审核结果">
            <el-tag
              :type="detailDialog.data.status === 'approved' ? 'success' : 'danger'"
            >
              {{ detailDialog.data.status === 'approved' ? '已批准' : '已拒绝' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核人">
            {{ detailDialog.data.reviewer_name }}
          </el-descriptions-item>
          <el-descriptions-item label="审核时间" :span="2">
            {{ formatDateTime(detailDialog.data.reviewed_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="审核备注" :span="2">
            {{ detailDialog.data.review_comment || '无备注' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 内容预览 -->
        <div class="content-preview" v-if="detailDialog.data.content">
          <h4>内容预览</h4>
          <div class="prompt-content">
            {{ detailDialog.data.content }}
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download, Refresh } from '@element-plus/icons-vue'
import axios from 'axios'
import { getApiBaseUrl } from '@/config/api'

export default {
  name: 'ReviewHistory',
  components: {
    Search,
    Download,
    Refresh
  },
  setup() {
    const loading = ref(false)
    const reviewHistory = ref([])
    const reviewers = ref([])
    const selectedPrompts = ref([])
    
    const filters = reactive({
      search: '',
      action: '',
      reviewer: '',
      dateRange: null
    })

    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })

    const stats = reactive({
      total: 0,
      approved: 0,
      rejected: 0,
      avgResponseTime: '0小时'
    })

    const detailDialog = reactive({
      visible: false,
      data: null
    })

    const sortConfig = reactive({
      prop: 'reviewed_at',
      order: 'descending'
    })

    // 搜索防抖
    let searchTimeout = null
    const handleSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        pagination.currentPage = 1
        loadReviewHistory()
      }, 500)
    }

    // 加载审核历史
    const loadReviewHistory = async () => {
      try {
        loading.value = true
        
        const params = {
          page: pagination.currentPage,
          limit: pagination.pageSize,
          sort_by: sortConfig.prop,
          sort_order: sortConfig.order === 'descending' ? 'desc' : 'asc'
        }

        if (filters.search) params.search = filters.search
        if (filters.action) params.action = filters.action
        if (filters.reviewer) params.reviewer_id = filters.reviewer
        if (filters.dateRange && filters.dateRange.length === 2) {
          params.start_date = filters.dateRange[0]
          params.end_date = filters.dateRange[1]        }

        const response = await axios.get(`${getApiBaseUrl()}/api/admin/review-history`, { params })
        
        reviewHistory.value = response.data.history || []
        pagination.total = response.data.pagination.total || 0
        
        // 更新统计数据
        if (response.data.stats) {
          Object.assign(stats, response.data.stats)
        }
        
      } catch (error) {
        console.error('加载审核历史失败:', error)
        ElMessage.error('加载审核历史失败')
      } finally {
        loading.value = false
      }
    }    // 加载审核人列表
    const loadReviewers = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/api/admin/reviewers`)
        reviewers.value = response.data.reviewers || []
      } catch (error) {
        console.error('加载审核人列表失败:', error)
      }
    }

    // 排序处理
    const handleSortChange = ({ prop, order }) => {
      sortConfig.prop = prop
      sortConfig.order = order
      loadReviewHistory()
    }

    // 分页处理
    const handleSizeChange = (val) => {
      pagination.pageSize = val
      pagination.currentPage = 1
      loadReviewHistory()
    }

    const handleCurrentChange = (val) => {
      pagination.currentPage = val
      loadReviewHistory()
    }

    // 查看详情
    const viewDetails = (row) => {
      detailDialog.data = row
      detailDialog.visible = true
    }

    const closeDetailDialog = () => {
      detailDialog.visible = false
      detailDialog.data = null
    }

    // 查看内容详情
    const viewPromptDetail = (row) => {
      if (row.id) {
        // 打开新窗口查看内容详情
        const url = `/prompt/${row.id}`
        window.open(url, '_blank')
      }
    }

    // 撤销审核
    const rollbackReview = async (row) => {
      try {
        await ElMessageBox.confirm(
          '确定要撤销此审核操作吗？撤销后内容将重新进入待审核状态。',
          '确认撤销',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'          }
        )
        
        await axios.post(`${getApiBaseUrl()}/api/admin/rollback-review`, {
          promptId: row.id
        })
        ElMessage.success('审核已撤销')
        loadReviewHistory()
        
      } catch (error) {
        if (error !== 'cancel') {
          console.error('撤销审核失败:', error)
          ElMessage.error('撤销审核失败')
        }
      }
    }

    // 导出历史
    const exportHistory = async () => {
      try {
        const params = { ...filters }
        if (params.dateRange && params.dateRange.length === 2) {
          params.start_date = params.dateRange[0]
          params.end_date = params.dateRange[1]
          delete params.dateRange        }

        const response = await axios.get(`${getApiBaseUrl()}/api/admin/export-review-history`, {
          params,
          responseType: 'blob'
        })

        // 创建下载链接
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `审核历史_${new Date().toISOString().slice(0, 10)}.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)

        ElMessage.success('导出成功')
        
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败')
      }
    }

    // 格式化日期时间
    const formatDateTime = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 处理删除
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除这条审核记录吗？删除后将无法恢复。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }        )

        await axios.delete(`${getApiBaseUrl()}/api/admin/prompts/${row.id}`)
        ElMessage.success('删除成功')
        loadReviewHistory()
        
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        }
      }
    }

    // 判断是否可以选择（已通过审核的不能选择）
    const isSelectable = (row) => {
      return row.status !== 'approved'
    }

    // 处理表格选择变化
    const handleSelectionChange = (selection) => {
      selectedPrompts.value = selection
    }

    // 批量删除
    const handleBatchDelete = async () => {
      if (!selectedPrompts.value.length) return

      try {
        await ElMessageBox.confirm(
          `确定要删除选中的 ${selectedPrompts.value.length} 条记录吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }        )

        const deletePromises = selectedPrompts.value.map(prompt => 
          axios.delete(`${getApiBaseUrl()}/api/admin/prompts/${prompt.id}`)
        )

        await Promise.all(deletePromises)
        ElMessage.success('批量删除成功')
        loadReviewHistory()
        
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除失败:', error)
          ElMessage.error('批量删除失败')
        }
      }
    }

    onMounted(() => {
      loadReviewHistory()
      loadReviewers()
    })

    return {
      loading,
      reviewHistory,
      reviewers,
      selectedPrompts,
      filters,
      pagination,
      stats,
      detailDialog,
      handleSearch,
      loadReviewHistory,
      handleSortChange,
      handleSizeChange,
      handleCurrentChange,
      viewDetails,
      closeDetailDialog,
      viewPromptDetail,
      rollbackReview,
      exportHistory,
      formatDateTime,
      handleDelete,
      isSelectable,
      handleSelectionChange,
      handleBatchDelete
    }
  }
}
</script>

<style scoped>
.review-history {
  padding: 25px 30px;
  background: var(--hero-background);
  border-radius: 16px;
  position: relative;
}

.review-history::before {
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

.review-history:hover::before {
  opacity: 1;
}

.history-header {
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

.history-header::before {
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

.history-header:hover::before {
  opacity: 0.2;
}

.history-title {
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

.history-subtitle {
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

.search-card {
  margin-bottom: 25px;
  background: var(--external-bg);
  border-radius: 14px;
  backdrop-filter: blur(20px);
  border: 2px dashed transparent;
  position: relative;
  overflow: hidden;
}

.search-card::before {
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

.search-card:hover::before {
  opacity: 0.7;
}

.search-filters {
  width: 100%;
  position: relative;
  z-index: 1;
}

.stats-row {
  margin-bottom: 25px;
}

.stat-card {
  text-align: center;
  cursor: pointer;
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

.stat-card.approved::before {
  border-color: #67c23a;
}

.stat-card.rejected::before {
  border-color: #f56c6c;
}

.stat-content {
  padding: 18px 20px;
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.stat-label {
  font-size: 15px;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.table-card {
  margin-bottom: 25px;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  position: relative;
  z-index: 1;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions .el-button {
  background: var(--primary-color);
  border: none;
  color: white;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.header-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.header-actions .el-button[type="danger"] {
  background: var(--danger-color, #f56c6c);
}

.prompt-title-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.prompt-title-link:hover {
  color: var(--accent-color);
  text-decoration: underline;
}

.text-muted {
  color: var(--text-color-tertiary);
  font-style: italic;
}

.pagination-wrapper {
  margin-top: 25px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.review-detail {
  margin-bottom: 20px;
}

.content-preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.content-preview h4 {
  margin-bottom: 12px;
  color: var(--text-color);
  font-weight: 600;
}

.prompt-content {
  background: var(--background-light);
  padding: 18px;
  border-radius: 12px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid var(--border-color);
  font-family: var(--font-mono);
  line-height: 1.6;
}

.dialog-footer {
  text-align: right;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .review-history {
    background: var(--external-bg-dark);
  }
  
  .search-card,
  .stat-card,
  .table-card {
    background: var(--external-bg-dark);
  }
  
  .prompt-content {
    background: var(--background-dark);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-history {
    padding: 20px 15px;
  }
  
  .search-filters .el-col {
    margin-bottom: 12px;
  }
  
  .stats-row .el-col {
    margin-bottom: 15px;
  }
  
  .stat-value {
    font-size: 28px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .header-actions .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .review-history {
    padding: 15px 10px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .prompt-content {
    padding: 12px;
    font-size: 14px;
  }
}
</style>
