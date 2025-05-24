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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import PromptCard from '../components/PromptCard.vue'
import { getApiBaseUrl } from '../config/api'

const userStore = useUserStore()
const prompts = ref([])
const loading = ref(false)
const selectedCategory = ref('')
const categories = ref(['编程', '写作', '设计', '教育', '商业', '通用'])

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
  // 获取提示列表
  fetchPrompts();
})
</script>

<style scoped>
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
.dark-mode .empty-state,
:deep(.dark-mode .el-skeleton) {
  background-color: var(--hero-background, rgba(30, 41, 59, 0.8));
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
}

.dark-mode .list-header {
  background-color: var(--hero-background, rgba(30, 41, 59, 0.8));
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
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
  
  .prompt-grid {
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .list-header h2 {
    font-size: 1.5rem;
  }
  
  .prompt-grid {
    gap: 12px;
  }
}
</style>
