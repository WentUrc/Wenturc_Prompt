<template>
  <div class="prompt-list">
    <div class="list-header">
      <h2>浏览Prompts</h2>
      <!-- 移除开发模式标记 -->
      <div class="filter-actions">
        <el-select v-model="selectedCategory" placeholder="选择类别" @change="fetchPrompts">
          <el-option label="全部" value=""></el-option>
          <el-option v-for="category in categories" :key="category" :label="category" :value="category"></el-option>
        </el-select>
      </div>
    </div>
    
    <!-- 本站Prompts区域 -->
    <div class="section-header">
      <h3>本站精选</h3>
    </div>
    
    <el-skeleton :rows="6" animated v-if="loading" />
    
    <div v-else-if="prompts.length === 0" class="empty-state">
      <el-empty description="暂无Prompt数据" />
    </div>
    
    <div v-else class="prompt-grid">
      <PromptCard 
        v-for="(prompt, index) in prompts" 
        :key="prompt.id" 
        :prompt="prompt"
        :loading-delay="index * 150"
        @like="toggleLike"
        class="prompt-card-item"
        :style="{ '--card-index': index }"
      />
    </div>    <!-- 外部网站Prompts区域 -->
    <div class="section-header external-section">
      <div class="external-header">
        <div class="external-title-group">          <h3>
            <a 
              href="http://www.jasongjz.top:8000/app/" 
              target="_blank" 
              class="external-link"
              @click.prevent="visitJasonWebsite"
            >
              来自Jason的prompt市场
              <el-icon class="link-icon"><Link /></el-icon>
            </a>
          </h3>
          <el-tag 
            size="small" 
            type="warning" 
            effect="plain"
            class="external-tag"
          >
            <el-icon class="tag-icon"><InfoFilled /></el-icon>
            外部来源
          </el-tag>
        </div>
      </div>
      <p class="section-description">以下内容来自Jason的prompt市场，仅供参考</p>
    </div>
    
    <el-skeleton :rows="4" animated v-if="externalLoading" class="external-skeleton" />
    
    <div v-else-if="externalPrompts.length === 0" class="empty-state external-empty">
      <el-empty description="暂无外部Prompt数据" />
    </div>
      <div v-else class="prompt-grid external-grid">
      <PromptCard 
        v-for="(prompt, index) in externalPrompts" 
        :key="`external-${prompt.id}`" 
        :prompt="prompt"
        :loading-delay="index * 100"
        @like="handleExternalLike"
        @external-detail="handleExternalDetail"
        class="prompt-card-item external-card"
        :style="{ '--card-index': index }"
      />
    </div>    <!-- 第二个外部网站Prompts区域 - vmoranv的市场 -->
    <div class="section-header external-section">
      <div class="external-header">
        <div class="external-title-group">
          <h3>
            <a 
              href="https://prompt.614447.xyz/" 
              target="_blank" 
              class="external-link"
              @click.prevent="visitVmoranvWebsite"
            >
              来自vmoranv的prompt市场
              <el-icon class="link-icon"><Link /></el-icon>
            </a>
          </h3>
          <el-tag 
            size="small" 
            type="success" 
            effect="plain"
            class="external-tag"
          >
            <el-icon class="tag-icon"><InfoFilled /></el-icon>
            外部来源
          </el-tag>
        </div>
      </div>
      <p class="section-description">以下内容来自vmoranv的prompt市场，仅供参考</p>
    </div>
    
    <el-skeleton :rows="4" animated v-if="vmoranvLoading" class="external-skeleton" />
    
    <div v-else-if="vmoranvPrompts.length === 0" class="empty-state external-empty">
      <el-empty description="暂无vmoranv市场Prompt数据" />
    </div>    <div v-else class="prompt-grid external-grid">
      <PromptCard 
        v-for="(prompt, index) in vmoranvPrompts" 
        :key="`vmoranv-${prompt.id}`" 
        :prompt="prompt"
        :loading-delay="index * 100"
        @like="handleExternalLike"
        @click="handleVmoranvPromptClick"
        class="prompt-card-item external-card"
        :style="{ '--card-index': index }"
      />
    </div>

    <!-- 外部Prompt详情模态框 -->
    <ExternalPromptModal
      v-model="showExternalModal"
      :prompt="selectedExternalPrompt"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Star, Link, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import PromptCard from '../components/PromptCard.vue'
import ExternalPromptModal from '../components/ExternalPromptModal.vue'
import { getApiBaseUrl, getExternalApiBaseUrl, getVmoranvApiBaseUrl } from '../config/api'

const userStore = useUserStore()
const prompts = ref([])
const externalPrompts = ref([])
const vmoranvPrompts = ref([])  // 新增：vmoranv市场的prompts
const loading = ref(false)
const externalLoading = ref(false)
const vmoranvLoading = ref(false)  // 新增：vmoranv市场的加载状态
const selectedCategory = ref('')
const categories = ref(['编程', '写作', '设计', '教育', '商业', '通用'])

// 外部prompt详情模态框相关
const showExternalModal = ref(false)
const selectedExternalPrompt = ref(null)

// 永久启用本地存储模式，但移除"开发"字样
const isDevelopment = ref(true)

// 存储用户已点赞的Prompt ID列表
const likedPromptsKey = 'user-liked-prompts'
const likedPrompts = ref([])

// 初始化用户点赞记录
const initLikedPrompts = () => {
  if (userStore.isLoggedIn) {
    // 每个用户有独立的点赞记录，格式为 user_{userId}_liked_prompts
    const userLikedPromptsKey = `user_${userStore.userId}_${likedPromptsKey}`
    const savedLikedPrompts = JSON.parse(localStorage.getItem(userLikedPromptsKey) || '[]')
    likedPrompts.value = savedLikedPrompts
    console.log('加载用户点赞记录:', likedPrompts.value)
  }
}

// 获取vmoranv市场API数据
const fetchVmoranvPrompts = async () => {
  vmoranvLoading.value = true;
  try {
    console.log('从vmoranv市场API获取prompts数据');
    
    const vmoranvApiUrl = getVmoranvApiBaseUrl();
    console.log('使用的vmoranv API地址:', vmoranvApiUrl);
    
    // 创建一个新的axios实例，使用完整的API URL
    const response = await axios.get(`${vmoranvApiUrl}/prompts`);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      vmoranvPrompts.value = response.data.data.map(prompt => ({
        // 使用_id作为id
        id: prompt._id,
        category: prompt.tags?.[0] || '通用',
        content: prompt.content,
        title: prompt.title,
        description: prompt.content.substring(0, 100) + '...',
        likes: prompt.likesCount || 0,
        created_at: prompt.createdAt,
        // 处理作者信息（从嵌套的author对象获取）
        author: prompt.author?.name || '未知作者',        // 标记为外部来源
        isExternal: true,
        source: 'vmoranv市场',
        // 外部prompts默认不支持点赞状态
        hasLiked: false,
        // 保存原始数据以便详情展示
        originalData: prompt
      }));
      
      console.log('成功获取vmoranv市场API数据，数量:', vmoranvPrompts.value.length);
    } else {
      throw new Error('vmoranv市场API返回的数据格式不正确');
    }
  } catch (error) {    console.warn('获取vmoranv市场API数据失败:', error);
    // 失败时不显示错误消息，只在控制台记录
    vmoranvPrompts.value = [];
  } finally {
    vmoranvLoading.value = false;
  }
}

// 获取外部API数据
const fetchExternalPrompts = async () => {
  externalLoading.value = true
  try {
    console.log('从外部API获取prompts数据');
      // 使用配置中的外部API地址
    const externalApiUrl = getExternalApiBaseUrl()
    
    // 创建一个新的axios实例，不使用默认的baseURL
    const externalAxios = axios.create({
      baseURL: '', // 清空baseURL，使用完整URL
      timeout: 10000
    })
    
    const response = await externalAxios.get(`${externalApiUrl}/prompts/`);
    
    if (response.data && Array.isArray(response.data)) {
      // 转换外部数据格式以匹配本地格式
      externalPrompts.value = response.data.map(prompt => ({
        ...prompt,
        // 确保有必要的字段
        category: prompt.category || '通用',
        content: prompt.content,
        title: prompt.title,
        description: prompt.description,
        likes: prompt.likes || 0,
        created_at: prompt.created_at,
        // 处理作者信息
        author: prompt.owner?.username || '未知作者',
        // 标记为外部来源
        isExternal: true,
        source: '外部网站',
        // 外部prompts默认不支持点赞状态
        hasLiked: false
      }));
      
      console.log('成功获取外部API数据，数量:', externalPrompts.value.length);
    } else {
      throw new Error('外部API返回的数据格式不正确');
    }
  } catch (error) {
    console.warn('获取外部API数据失败:', error);
    // 失败时不显示错误消息，只在控制台记录
    externalPrompts.value = [];
  } finally {
    externalLoading.value = false;
  }
}

const fetchPrompts = async () => {
  loading.value = true
  try {
    console.log('从本地存储获取prompts数据');
    
    // 从本地存储获取开发模式下保存的prompts
    const devPrompts = JSON.parse(localStorage.getItem('dev-prompts') || '[]');
    
    // 尝试从API获取数据作为补充（可能会失败，但不影响用户体验）
    try {
      const url = `${getApiBaseUrl()}/api/prompts${selectedCategory.value ? `?category=${selectedCategory.value}` : ''}`;
      const response = await axios.get(url);
      
      if (response.data && Array.isArray(response.data)) {
        // 合并数据，API数据在前，本地数据在后
        const apiPrompts = response.data;
        const allPrompts = [...apiPrompts, ...devPrompts];
        
        // 根据创建时间排序
        allPrompts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 根据分类过滤
        if (selectedCategory.value) {
          prompts.value = allPrompts.filter(p => p.category === selectedCategory.value);
        } else {
          prompts.value = allPrompts;
        }
        
        console.log('获取到API和本地数据');
      } else {
        throw new Error('API返回的数据格式不正确');
      }
    } catch (error) {
      console.warn('获取API数据失败，仅使用本地数据:', error);
      
      // 仅使用本地数据
      if (selectedCategory.value) {
        prompts.value = devPrompts.filter(p => p.category === selectedCategory.value);
      } else {
        prompts.value = devPrompts;
      }
    }
    
    // 标记用户已点赞的Prompt
    markLikedPrompts();
  } catch (error) {
    console.error('获取Prompts失败:', error);
    ElMessage.error('获取数据失败，请稍后重试');
    prompts.value = [];
  } finally {
    loading.value = false;
  }
}

// 标记用户已点赞的Prompts
const markLikedPrompts = () => {
  if (!userStore.isLoggedIn || prompts.value.length === 0) return;
  
  // 为所有Prompt添加hasLiked属性
  prompts.value.forEach(prompt => {
    prompt.hasLiked = likedPrompts.value.includes(prompt.id);
  });
}

const truncateContent = (content) => {
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 更新用户点赞状态记录
const saveUserLikedPrompts = () => {
  if (userStore.isLoggedIn) {
    const userLikedPromptsKey = `user_${userStore.userId}_${likedPromptsKey}`
    localStorage.setItem(userLikedPromptsKey, JSON.stringify(likedPrompts.value))
    console.log('保存用户点赞记录:', likedPrompts.value)
  }
}

// 处理外部prompts的点赞（仅提示，不实际操作）
const handleExternalLike = (prompt) => {
  ElMessage.info('外部网站的Prompt暂不支持点赞操作')
}

// 处理vmoranv prompts的点击（提示用户）
const handleVmoranvPromptClick = (prompt) => {
  ElMessage.info('这是来自vmoranv市场的Prompt，请访问原网站查看完整内容')
}

// 处理外部prompts的详情查看
const handleExternalDetail = (prompt) => {
  selectedExternalPrompt.value = prompt
  showExternalModal.value = true
}

// 访问Jason的原网站
const visitJasonWebsite = () => {
  window.open('http://www.jasongjz.top:8000/app/', '_blank')
}

// 访问vmoranv的网站
const visitVmoranvWebsite = () => {
  window.open('https://prompt.614447.xyz/', '_blank')
}

// 统一处理点赞/取消点赞
const toggleLike = async (prompt) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再点赞')
    return
  }
  
  const promptId = prompt.id
  const isAlreadyLiked = prompt.hasLiked
  
  // 检查是否为本地存储的Prompt（ID以dev-开头）
  if (promptId.toString().startsWith('dev-')) {
    console.log(`处理本地存储Prompt的${isAlreadyLiked ? '取消点赞' : '点赞'}操作:`, promptId)
    
    // 从本地存储获取所有prompts
    const devPrompts = JSON.parse(localStorage.getItem('dev-prompts') || '[]')
    
    // 找到要操作的prompt
    const promptIndex = devPrompts.findIndex(p => p.id === promptId)
    if (promptIndex === -1) {
      ElMessage.error('未找到该Prompt')
      return
    }
    
    // 更新本地存储中的点赞数
    if (isAlreadyLiked) {
      // 取消点赞
      devPrompts[promptIndex].likes = Math.max(0, devPrompts[promptIndex].likes - 1)
      
      // 从用户点赞记录中移除
      likedPrompts.value = likedPrompts.value.filter(id => id !== promptId)
    } else {
      // 点赞
      devPrompts[promptIndex].likes += 1
      
      // 添加到用户点赞记录
      if (!likedPrompts.value.includes(promptId)) {
        likedPrompts.value.push(promptId)
      }
    }
    
    localStorage.setItem('dev-prompts', JSON.stringify(devPrompts))
    
    // 更新当前页面显示的点赞数和状态
    const index = prompts.value.findIndex(p => p.id === promptId)
    if (index !== -1) {
      prompts.value[index].likes = devPrompts[promptIndex].likes
      prompts.value[index].hasLiked = !isAlreadyLiked
    }
    
    // 保存用户点赞记录
    saveUserLikedPrompts()
    
    ElMessage.success(isAlreadyLiked ? '已取消点赞' : '点赞成功')
    return
  }
  
  // 如果不是本地存储的Prompt，则调用API
  try {
    let response
    
    if (isAlreadyLiked) {
      // 取消点赞
      response = await axios.delete(`${getApiBaseUrl()}/api/prompts/${promptId}/like`, {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      })
      
      // 从用户点赞记录中移除
      likedPrompts.value = likedPrompts.value.filter(id => id !== promptId)
    } else {
      // 点赞
      response = await axios.post(`${getApiBaseUrl()}/api/prompts/${promptId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${userStore.token}`
        }
      })
      
      // 添加到用户点赞记录
      if (!likedPrompts.value.includes(promptId)) {
        likedPrompts.value.push(promptId)
      }
    }
    
    // 更新点赞数和状态
    const index = prompts.value.findIndex(p => p.id === promptId)
    if (index !== -1) {
      prompts.value[index].likes = response.data.likes
      prompts.value[index].hasLiked = !isAlreadyLiked
    }
    
    // 保存用户点赞记录
    saveUserLikedPrompts()
    
    ElMessage.success(isAlreadyLiked ? '已取消点赞' : '点赞成功')
  } catch (error) {
    console.error(isAlreadyLiked ? '取消点赞失败:' : '点赞失败:', error)
    ElMessage.error(isAlreadyLiked ? '取消点赞失败，请稍后重试' : '点赞失败，请稍后重试')
  }
}

onMounted(() => {
  // 初始化用户点赞记录
  initLikedPrompts();
  // 获取本站提示列表
  fetchPrompts();
  // 获取外部网站提示列表
  fetchExternalPrompts();  // 获取vmoranv市场提示列表
  fetchVmoranvPrompts();
})
</script>

<style scoped>
/* 区域分隔样式 */
.section-header {
  margin: 40px 0 20px 0;
  padding: 0 10px;
}

.section-header h3 {
  color: var(--text-color, #333333);
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-description {
  color: var(--text-color-secondary, #909399);
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

.external-section {
  border-top: 2px dashed var(--border-color, #e0e0e0);
  padding-top: 30px;
  margin-top: 50px;
}

/* 外部区域头部布局 */
.external-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.external-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.external-title-group h3 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color, #333333);
}

/* 外部链接样式 */
.external-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary-color, #409eff);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 4px 8px;
  position: relative;
}

.external-link:hover {
  color: var(--secondary-color, #67c23a);
  transform: translateY(-1px);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(103, 194, 58, 0.05) 100%);
}

.external-link:active {
  transform: translateY(0);
}

.link-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.external-link:hover .link-icon {
  transform: translateX(2px) scale(1.1);
}

/* 外部标签样式 */
.external-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: linear-gradient(135deg, #fef3e7 0%, #fff2e6 100%);
  border: 1px solid #f0c78a;
  color: #b8860b;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(240, 199, 138, 0.2);
}

.external-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(240, 199, 138, 0.3);
  background: linear-gradient(135deg, #fef0e0 0%, #fdebdc 100%);
}

.tag-icon {
  font-size: 12px;
}

/* 深色模式适配 */
:deep(.dark-mode) .external-title-group h3 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:deep(.dark-mode) .external-link {
  color: var(--primary-color-light, #79bbff);
}

:deep(.dark-mode) .external-link:hover {
  color: var(--secondary-color-light, #95d475);
  background: linear-gradient(135deg, rgba(121, 187, 255, 0.1) 0%, rgba(149, 212, 117, 0.1) 100%);
}

:deep(.dark-mode) .external-tag {
  background: linear-gradient(135deg, rgba(254, 243, 231, 0.1) 0%, rgba(255, 242, 230, 0.1) 100%);
  border-color: rgba(240, 199, 138, 0.3);
  color: #ffd700;
  box-shadow: 0 2px 4px rgba(240, 199, 138, 0.1);
}

:deep(.dark-mode) .external-tag:hover {
  background: linear-gradient(135deg, rgba(254, 240, 224, 0.15) 0%, rgba(253, 235, 220, 0.15) 100%);
  box-shadow: 0 4px 8px rgba(240, 199, 138, 0.2);
}

/* 外部内容区域样式 */
.external-grid {
  position: relative;
  background: var(--external-bg, rgba(249, 250, 251, 0.5));
  border-radius: 12px;
  padding: 15px;
  margin: 10px 0;
}

.external-grid::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px dashed var(--warning-color-light, #f9c23c);
  border-radius: 14px;
  z-index: -1;
  opacity: 0.6;
}

.external-card {
  position: relative;
  opacity: 0.92;
  transition: opacity 0.3s ease;
}

.external-card:hover {
  opacity: 1;
}

.external-skeleton {
  border: 2px dashed var(--warning-color-light, #f9c23c);
  border-radius: 12px;
  padding: 20px;
  margin: 10px 0;
  background: var(--external-bg, rgba(249, 250, 251, 0.3));
}

.external-empty {
  border: 2px dashed var(--warning-color-light, #f9c23c);
  margin: 10px 0;
  background: var(--external-bg, rgba(249, 250, 251, 0.3));
  border-radius: 12px;
}

/* 深色模式适配 */
:deep(.dark-mode) .section-header h3 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:deep(.dark-mode) .external-section {
  border-top-color: var(--border-color-dark, rgba(255, 255, 255, 0.2));
}

:deep(.dark-mode) .external-grid {
  background: var(--external-bg-dark, rgba(30, 41, 59, 0.3));
}

:deep(.dark-mode) .external-grid::before,
:deep(.dark-mode) .external-skeleton,
:deep(.dark-mode) .external-empty {
  border-color: var(--warning-color-dark, #f9c23c);
  background: var(--external-bg-dark, rgba(30, 41, 59, 0.3));
}

.prompt-list {
  margin: 20px 0;
  color: var(--text-color, #333333);
}

.list-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  background-color: var(--hero-background, #f0f9ff);
  padding: 20px 30px;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 添加与Home组件一致的渐变边框 */
.list-header::before {
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
  border-radius: 18px;
  z-index: -1;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.list-header:hover::before {
  opacity: 0.8;
}

.list-header h2 {
  color: var(--hero-title-color, #303133);
  margin: 0;
  font-size: 1.8rem;
}

.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.prompt-card-item {
  animation: card-fade-in 0.6s ease-out forwards;
  animation-delay: calc(var(--card-index) * 0.1s);
  opacity: 0;
}

@keyframes card-fade-in {
  0% {
    opacity: 0;
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  color: var(--text-color-secondary, #909399);
  background-color: var(--hero-background, #f0f9ff);
  border-radius: 16px;
  position: relative;
  z-index: 1;
  margin: 20px 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 为空状态也添加渐变边框 */
.empty-state::before {
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
  border-radius: 18px;
  z-index: -1;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.empty-state:hover::before {
  opacity: 0.8;
}

.filter-actions {
  margin-left: auto;
}

:deep(.el-select) {
  width: 140px;
}

/* 统一select输入框高度与按钮一致 */
:deep(.el-select .el-input__wrapper) {
  height: 36px;
  border-radius: 20px;
}

:deep(.el-select .el-input__inner) {
  height: 36px;
  line-height: 36px;
}

:deep(.el-tag) {
  transition: background-color 0.3s, border-color 0.3s, color 0.3s;
  border-radius: 12px;
}

/* Skeleton 加载状态增强 */
:deep(.el-skeleton) {
  background-color: var(--hero-background, #f0f9ff);
  padding: 20px;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

:deep(.el-skeleton)::before {
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
  border-radius: 18px;
  z-index: -1;
  opacity: 0.2;
}

/* 深色模式适配 */
:deep(.dark-mode) .empty-state,
:deep(.dark-mode) .el-skeleton {
  background-color: var(--hero-background, rgba(30, 41, 59, 0.8));
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
}

:deep(.dark-mode) .list-header {
  background-color: var(--hero-background, rgba(30, 41, 59, 0.8));
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
}

/* 深色模式下的标题颜色 */
:deep(.dark-mode) .list-header h2 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

/* 响应式设计增强 */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    padding: 16px 20px;
  }
  
  .filter-actions {
    margin-left: 0;
    width: 100%;
  }
  
  :deep(.el-select) {
    width: 100%;
  }
  
  /* 移动端筛选框高度统一 */
  :deep(.el-select .el-input__wrapper) {
    height: 40px;
  }

  :deep(.el-select .el-input__inner) {
    height: 40px;
    line-height: 40px;
  }
  
  .prompt-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  /* 移动端外部区域响应式 */
  .external-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .external-title-group {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .list-header h2 {
    font-size: 1.5rem;
  }
  
  .prompt-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }
  
  /* 移动端增加外部区域的顶部间隔 */
  .external-section {
    margin-top: 55px;
    padding-top: 35px;
  }
  /* 小屏幕优化 */
  .external-title-group h3 {
    font-size: 1.3rem;
  }
  
  .external-tag {
    font-size: 11px;
    padding: 4px 10px;
  }
  
  .link-icon {
    font-size: 14px;
  }
}

/* 针对600px及以下屏幕的新布局 */
@media (max-width: 600px) {
  /* 移动端增加外部区域的顶部间隔 */
  .external-section {
    margin-top: 55px;
    padding-top: 35px;
  }
}

/* 大屏幕默认隐藏移动端标签 */
@media (min-width: 601px) {
  /* 桌面端保持默认样式 */
}

/* 针对360px及更小屏幕的特殊适配 */
@media (max-width: 360px) {
  .prompt-list {
    margin: 10px 0;
  }
  
  .prompt-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .list-header {
    padding: 12px 16px;
  }
  
  .list-header h2 {
    font-size: 1.3rem;
  }
  
  .section-header {
    padding: 0 16px;
    margin: 20px 0 15px 0;
  }
  
  /* 增加外部区域的顶部间隔 */
  .external-section {
    margin-top: 60px;
    padding-top: 40px;
  }
  
  .section-description {
    font-size: 12px;
    margin-top: 8px;
  }
  /* 超小屏幕优化 */
  .external-title-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .external-title-group h3 {
    font-size: 1.2rem;
  }
  
  .external-tag {
    align-self: flex-start;
  }
  
  .link-icon {
    font-size: 12px;
  }
}

/* 针对极小屏幕（如320px）的进一步优化 */
@media (max-width: 320px) {  /* 进一步增加外部区域的顶部间隔 */
  .external-section {
    margin-top: 70px;
    padding-top: 45px;
  }
  
  .section-title-row h3 {
    font-size: 1rem;
  }
}
</style>
