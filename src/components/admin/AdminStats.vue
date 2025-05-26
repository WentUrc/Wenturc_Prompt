<template>
  <div class="admin-stats">
    <!-- 管理统计标题 -->
    <div class="stats-header">
      <h2 class="stats-title">管理统计面板</h2>
      <p class="stats-subtitle">系统运行状况与用户活跃度概览</p>
    </div>

    <!-- 概览统计卡片 -->
    <el-row :gutter="20" class="overview-stats">
      <el-col :span="6">
        <el-card class="stat-card users" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
              <div class="stat-trend" :class="overview.userGrowth >= 0 ? 'positive' : 'negative'">
                <el-icon v-if="overview.userGrowth >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(overview.userGrowth) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card prompts" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.totalPrompts }}</div>
              <div class="stat-label">总内容数</div>
              <div class="stat-trend" :class="overview.promptGrowth >= 0 ? 'positive' : 'negative'">
                <el-icon v-if="overview.promptGrowth >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(overview.promptGrowth) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card reviews" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.totalReviews }}</div>
              <div class="stat-label">总审核数</div>
              <div class="stat-trend" :class="overview.reviewGrowth >= 0 ? 'positive' : 'negative'">
                <el-icon v-if="overview.reviewGrowth >= 0"><CaretTop /></el-icon>
                <el-icon v-else><CaretBottom /></el-icon>
                {{ Math.abs(overview.reviewGrowth) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card pending" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overview.pendingReviews }}</div>
              <div class="stat-label">待审核</div>
              <div class="stat-trend urgent" v-if="overview.pendingReviews > 50">
                <el-icon><Warning /></el-icon>
                需要关注
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <!-- 用户增长趋势 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>用户增长趋势</span>
              <el-select v-model="userChartPeriod" @change="loadUserGrowthData" style="width: 120px">
                <el-option label="最近7天" value="7d" />
                <el-option label="最近30天" value="30d" />
                <el-option label="最近90天" value="90d" />
              </el-select>
            </div>
          </template>
          <div ref="userGrowthChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 内容审核状态分布 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>内容审核状态分布</span>
              <el-select v-model="reviewChartPeriod" @change="loadReviewStatusData" style="width: 120px">
                <el-option label="最近7天" value="7d" />
                <el-option label="最近30天" value="30d" />
                <el-option label="全部时间" value="all" />
              </el-select>
            </div>
          </template>
          <div ref="reviewStatusChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细统计表格 -->
    <el-row :gutter="20" class="detail-stats">
      <!-- 热门分类统计 -->
      <el-col :span="12">
        <el-card class="table-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热门分类统计</span>
              <el-button link @click="loadCategoryStats">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table
            v-loading="categoryLoading"
            :data="categoryStats"
            stripe
            max-height="300"
          >
            <el-table-column prop="category" label="分类" />
            <el-table-column prop="count" label="数量" align="center" />
            <el-table-column prop="percentage" label="占比" align="center">
              <template #default="scope">
                {{ scope.row.percentage }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 活跃用户统计 -->
      <el-col :span="12">
        <el-card class="table-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>活跃用户统计</span>
              <el-button link @click="loadActiveUsers">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table
            v-loading="usersLoading"
            :data="activeUsers"
            stripe
            max-height="300"
          >
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="promptCount" label="发布数量" align="center" />
            <el-table-column prop="lastActive" label="最后活跃" align="center">
              <template #default="scope">
                {{ formatDate(scope.row.lastActive) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统性能指标 -->
    <el-row :gutter="20" class="performance-stats">
      <el-col :span="24">
        <el-card class="performance-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>系统性能指标</span>
              <div class="header-actions">
                <el-switch
                  v-model="autoRefresh"
                  @change="toggleAutoRefresh"
                  active-text="自动刷新"
                  inactive-text="手动刷新"
                />
                <el-button link @click="loadPerformanceData">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="performance-metric">
                <div class="metric-title">平均响应时间</div>
                <div class="metric-value">{{ performance.avgResponseTime }}ms</div>
                <el-progress
                  :percentage="Math.min(performance.avgResponseTime / 10, 100)"
                  :color="getResponseTimeColor(performance.avgResponseTime)"
                  :show-text="false"
                />
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="performance-metric">
                <div class="metric-title">CPU使用率</div>
                <div class="metric-value">{{ performance.cpuUsage }}%</div>
                <el-progress
                  :percentage="performance.cpuUsage"
                  :color="getCpuColor(performance.cpuUsage)"
                  :show-text="false"
                />
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="performance-metric">
                <div class="metric-title">内存使用率</div>
                <div class="metric-value">{{ performance.memoryUsage }}%</div>
                <el-progress
                  :percentage="performance.memoryUsage"
                  :color="getMemoryColor(performance.memoryUsage)"
                  :show-text="false"
                />
              </div>
            </el-col>
            
            <el-col :span="6">
              <div class="performance-metric">
                <div class="metric-title">磁盘使用率</div>
                <div class="metric-value">{{ performance.diskUsage }}%</div>
                <el-progress
                  :percentage="performance.diskUsage"
                  :color="getDiskColor(performance.diskUsage)"
                  :show-text="false"
                />
              </div>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="12">
              <div class="performance-metric">
                <div class="metric-title">数据库查询效率</div>
                <div class="metric-value">{{ performance.dbQueryTime }}ms</div>
                <el-progress
                  :percentage="Math.min(performance.dbQueryTime / 5, 100)"
                  :color="getQueryTimeColor(performance.dbQueryTime)"
                  :show-text="false"
                />
              </div>
            </el-col>
            
            <el-col :span="12">
              <div class="performance-metric">
                <div class="metric-title">在线用户</div>
                <div class="metric-value">{{ performance.onlineUsers }}</div>
                <div class="metric-subtitle">活跃用户</div>
              </div>
            </el-col>
          </el-row>
          
          <el-row :gutter="20" style="margin-top: 20px">
            <el-col :span="12">
              <div class="performance-metric">
                <div class="metric-title">今日活跃</div>
                <div class="metric-value">{{ performance.todayActiveUsers }}</div>
                <div class="metric-subtitle">今日累计访问用户</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Document,
  Check,
  Clock,
  Warning,
  CaretTop,
  CaretBottom,
  Refresh
} from '@element-plus/icons-vue'
import axios from 'axios'
import { getApiBaseUrl } from '@/config/api'
import * as echarts from 'echarts'

export default {
  name: 'AdminStats',
  components: {
    User,
    Document,
    Check,
    Clock,
    Warning,
    CaretTop,
    CaretBottom,
    Refresh
  },
  setup() {
    const userGrowthChart = ref(null)
    const reviewStatusChart = ref(null)
    
    const overview = reactive({
      totalUsers: 0,
      totalPrompts: 0,
      totalReviews: 0,
      pendingReviews: 0,
      userGrowth: 0,
      promptGrowth: 0,
      reviewGrowth: 0
    })

    const performance = reactive({
      avgResponseTime: 0,
      dbQueryTime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      onlineUsers: 0,
      todayActiveUsers: 0
    })

    const categoryStats = ref([])
    const activeUsers = ref([])
    const categoryLoading = ref(false)
    const usersLoading = ref(false)

    const userChartPeriod = ref('30d')
    const reviewChartPeriod = ref('30d')
    const autoRefresh = ref(false)

    let userChart = null
    let reviewChart = null
    let refreshInterval = null

    // 加载概览数据
    const loadOverviewData = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/api/admin/stats/overview`)
        Object.assign(overview, response.data)
      } catch (error) {
        ElMessage.error('加载概览数据失败')
      }
    }    // 初始化图表
    const initCharts = async () => {
      await nextTick()
      
      // 等待一小段时间确保DOM完全渲染和CSS样式应用
      await new Promise(resolve => setTimeout(resolve, 200))
      
      try {
        // 确保DOM元素存在且有尺寸
        if (userGrowthChart.value) {
          // 检查元素尺寸
          const userChartRect = userGrowthChart.value.getBoundingClientRect()
          if (userChartRect.width > 0 && userChartRect.height > 0) {
            if (!userChart) {
              userChart = echarts.init(userGrowthChart.value)
              console.log('用户增长图表初始化成功', `尺寸: ${userChartRect.width}x${userChartRect.height}`)
            } else {
              userChart.resize()
            }
          } else {
            console.warn('用户增长图表DOM元素尺寸为0:', userChartRect)
            // 如果尺寸为0，延迟重试
            setTimeout(() => initCharts(), 100)
            return
          }
        } else {
          console.warn('用户增长图表DOM元素未找到')
        }
        
        if (reviewStatusChart.value) {
          // 检查元素尺寸
          const reviewChartRect = reviewStatusChart.value.getBoundingClientRect()
          if (reviewChartRect.width > 0 && reviewChartRect.height > 0) {
            if (!reviewChart) {
              reviewChart = echarts.init(reviewStatusChart.value)
              console.log('审核状态图表初始化成功', `尺寸: ${reviewChartRect.width}x${reviewChartRect.height}`)
            } else {
              reviewChart.resize()
            }
          } else {
            console.warn('审核状态图表DOM元素尺寸为0:', reviewChartRect)
            // 如果尺寸为0，延迟重试
            setTimeout(() => initCharts(), 100)
            return
          }
        } else {
          console.warn('审核状态图表DOM元素未找到')
        }
      } catch (error) {
        console.error('初始化图表失败:', error)
      }
    }// 加载用户增长数据
    const loadUserGrowthData = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/api/admin/stats/user-growth?period=${userChartPeriod.value}`)
        
        // 确保图表实例存在
        if (!userChart) {
          await initCharts()
        }
        
        if (userChart && response.data.dates && response.data.counts) {
          const option = {
            title: {
              text: '用户增长',
              left: 'center',
              textStyle: {
                fontSize: 14,
                color: '#333'
              }
            },
            tooltip: {
              trigger: 'axis',
              formatter: '{b}<br/>新增用户: {c}'
            },
            xAxis: {
              type: 'category',
              data: response.data.dates
            },
            yAxis: {
              type: 'value'
            },
            series: [{
              data: response.data.counts,
              type: 'line',
              smooth: true,
              lineStyle: {
                color: '#409eff'
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [{
                    offset: 0, color: 'rgba(64, 158, 255, 0.3)'
                  }, {
                    offset: 1, color: 'rgba(64, 158, 255, 0.05)'
                  }]
                }
              }
            }]
          }
          
          userChart.setOption(option)
        }
      } catch (error) {
        ElMessage.error('加载用户增长数据失败')
        console.error('加载用户增长数据失败:', error)
      }
    }    // 加载审核状态数据
    const loadReviewStatusData = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/api/admin/stats/review-status?period=${reviewChartPeriod.value}`)
        
        // 确保图表实例存在
        if (!reviewChart) {
          await initCharts()
        }
        
        if (reviewChart && response.data.data) {
          const option = {
            title: {
              text: '审核状态分布',
              left: 'center',
              textStyle: {
                fontSize: 14,
                color: '#333'
              }
            },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)'
            },
            legend: {
              bottom: '5%',
              left: 'center'
            },
            series: [{
              name: '审核状态',
              type: 'pie',
              radius: '60%',
              center: ['50%', '45%'],
              data: response.data.data,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }]
          }
          
          reviewChart.setOption(option)
        }
      } catch (error) {
        ElMessage.error('加载审核状态数据失败')
        console.error('加载审核状态数据失败:', error)
      }
    }

    // 加载分类统计
    const loadCategoryStats = async () => {
      try {
        categoryLoading.value = true
        const response = await axios.get(`${getApiBaseUrl()}/api/admin/stats/categories`)
        categoryStats.value = response.data.categories || []
      } catch (error) {
        ElMessage.error('加载分类统计失败')      } finally {
        categoryLoading.value = false
      }
    }

    // 加载活跃用户
    const loadActiveUsers = async () => {
      try {
        usersLoading.value = true
        const response = await axios.get(`${getApiBaseUrl()}/api/admin/stats/active-users`)
        activeUsers.value = response.data.users || []
      } catch (error) {
        ElMessage.error('加载活跃用户失败')
      } finally {        usersLoading.value = false
      }
    }

    // 加载性能数据
    const loadPerformanceData = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/api/admin/stats/performance`)
        Object.assign(performance, response.data)
      } catch (error) {
        ElMessage.error('加载性能数据失败')
      }
    }

    // 切换自动刷新
    const toggleAutoRefresh = (value) => {
      if (value) {
        refreshInterval = setInterval(() => {
          loadOverviewData()
          loadPerformanceData()
        }, 30000) // 30秒刷新一次
      } else {
        if (refreshInterval) {
          clearInterval(refreshInterval)
          refreshInterval = null
        }
      }
    }

    // 获取响应时间颜色
    const getResponseTimeColor = (time) => {
      if (time < 200) return '#67c23a'
      if (time < 500) return '#e6a23c'
      return '#f56c6c'
    }

    // 获取查询时间颜色
    const getQueryTimeColor = (time) => {
      if (time < 100) return '#67c23a'
      if (time < 300) return '#e6a23c'
      return '#f56c6c'
    }

    // 获取内存使用率颜色
    const getMemoryColor = (usage) => {
      if (usage < 70) return '#67c23a'
      if (usage < 85) return '#e6a23c'
      return '#f56c6c'
    }

    // 获取CPU使用率颜色
    const getCpuColor = (usage) => {
      if (usage < 60) return '#67c23a'
      if (usage < 80) return '#e6a23c'
      return '#f56c6c'
    }

    // 获取磁盘使用率颜色
    const getDiskColor = (usage) => {
      if (usage < 70) return '#67c23a'
      if (usage < 85) return '#e6a23c'
      return '#f56c6c'
    }    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    }

    // 窗口大小变化时重新调整图表
    const handleResize = () => {
      if (userChart) userChart.resize()
      if (reviewChart) reviewChart.resize()
    }

    onMounted(async () => {
      // 等待DOM渲染完成
      await nextTick()
      
      try {
        // 初始化数据
        await Promise.all([
          loadOverviewData(),
          loadCategoryStats(),
          loadActiveUsers(),
          loadPerformanceData()
        ])
        
        // 等待一段时间确保页面布局完成
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // 先初始化图表，再加载图表数据
        await initCharts()
        
        // 加载图表数据
        await Promise.all([
          loadUserGrowthData(),
          loadReviewStatusData()
        ])
        
        window.addEventListener('resize', handleResize)
      } catch (error) {
        console.error('组件初始化失败:', error)
        ElMessage.error('页面初始化失败，请刷新重试')
      }
    })

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      if (userChart) {
        userChart.dispose()
      }
      if (reviewChart) {
        reviewChart.dispose()
      }
      window.removeEventListener('resize', handleResize)
    })

    return {
      userGrowthChart,
      reviewStatusChart,
      overview,
      performance,
      categoryStats,
      activeUsers,
      categoryLoading,
      usersLoading,
      userChartPeriod,
      reviewChartPeriod,
      autoRefresh,
      loadUserGrowthData,
      loadReviewStatusData,
      loadCategoryStats,
      loadActiveUsers,
      loadPerformanceData,
      toggleAutoRefresh,
      getResponseTimeColor,
      getQueryTimeColor,
      getMemoryColor,
      getCpuColor,
      getDiskColor,
      formatDate
    }
  }
}
</script>

<style scoped>
.admin-stats {
  padding: 25px 30px;
  background: var(--hero-background);
  border-radius: 16px;
  position: relative;
}

.admin-stats::before {
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

.admin-stats:hover::before {
  opacity: 1;
}

.stats-header {
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

.stats-header::before {
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

.stats-header:hover::before {
  opacity: 0.2;
}

.stats-title {
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

.stats-subtitle {
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

.overview-stats {
  margin-bottom: 25px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.320, 1);
  border-radius: 14px;
  background: var(--external-bg);
  border: 2px dashed transparent;
  backdrop-filter: blur(20px);
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

.stat-card.users::before {
  border-color: #409eff;
}

.stat-card.prompts::before {
  border-color: #67c23a;
}

.stat-card.reviews::before {
  border-color: #e6a23c;
}

.stat-card.pending::before {
  border-color: #f56c6c;
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 18px 20px;
  position: relative;
  z-index: 1;
}

.stat-icon {
  font-size: 42px;
  margin-right: 18px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
  transition: all 0.3s ease;
}

.stat-label {
  font-size: 15px;
  color: var(--text-color-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-trend {
  font-size: 13px;
  display: flex;
  align-items: center;
  font-weight: 600;
}

.stat-trend.positive {
  color: #67c23a;
}

.stat-trend.negative {
  color: #f56c6c;
}

.stat-trend.urgent {
  color: #e6a23c;
}

.charts-section {
  margin-bottom: 25px;
}

.chart-card {
  height: 420px;
  background: var(--external-bg);
  border-radius: 14px;
  backdrop-filter: blur(20px);
  border: 2px dashed transparent;
  position: relative;
  overflow: hidden;
}

.chart-card::before {
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

.chart-card:hover::before {
  opacity: 0.7;
}

.chart-container {
  height: 320px;
  width: 100%;
  padding: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-stats {
  margin-bottom: 25px;
}

.table-card {
  height: 420px;
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

.performance-stats {
  margin-bottom: 25px;
}

.performance-card {
  border-radius: 14px;
  background: var(--external-bg);
  backdrop-filter: blur(20px);
  border: 2px dashed transparent;
  position: relative;
  overflow: hidden;
}

.performance-card::before {
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

.performance-card:hover::before {
  opacity: 0.7;
}

.performance-metric {
  text-align: center;
  padding: 25px 15px;
  position: relative;
  z-index: 1;
}

.metric-title {
  font-size: 15px;
  color: var(--text-color-secondary);
  margin-bottom: 12px;
  font-weight: 500;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.metric-subtitle {
  font-size: 13px;
  color: var(--text-color-tertiary);
  font-weight: 400;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .admin-stats {
    background: var(--external-bg-dark);
  }
  
  .stat-card,
  .chart-card,
  .table-card,
  .performance-card {
    background: var(--external-bg-dark);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-section .el-col {
    margin-bottom: 20px;
  }
  
  .detail-stats .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .admin-stats {
    padding: 20px 15px;
  }
  
  .overview-stats .el-col {
    margin-bottom: 15px;
  }
  
  .stat-content {
    flex-direction: column;
    text-align: center;
    padding: 15px;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 12px;
    font-size: 36px;
  }
  
  .chart-card {
    height: 320px;
  }
  
  .chart-container {
    height: 220px;
  }
  
  .performance-metric {
    padding: 20px 10px;
  }
  
  .metric-value {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .admin-stats {
    padding: 15px 10px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .metric-value {
    font-size: 20px;
  }
  
  .chart-card,
  .table-card {
    height: 280px;
  }
  
  .chart-container {
    height: 180px;
  }
}
</style>
