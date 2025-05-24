<template>
  <div class="prompt-detail">
    <el-skeleton :rows="10" animated v-if="loading" />
    
    <div v-else-if="!prompt" class="not-found">
      <el-empty description="未找到该Prompt" />
      <el-button type="primary" @click="$router.push('/prompts')">返回列表</el-button>
    </div>
    
    <div v-else class="prompt-content">
      <div class="prompt-header">
        <div class="title-container">
          <h2>{{ prompt.title }}</h2>
        </div>
        <el-tag size="default">{{ prompt.category }}</el-tag>
      </div>
      
      <div class="prompt-meta">
        <span class="author">作者: {{ prompt.author }}</span>
        <span class="created-at">发布于: {{ formatDate(prompt.created_at) }}</span>
      </div>
      
      <div class="content-box">
        <pre>{{ prompt.content }}</pre>
      </div>
        <div class="prompt-actions">
        <el-button type="primary" @click="copyContent">复制Prompt</el-button>
        <el-button 
          :type="hasLiked ? 'warning' : 'success'" 
          :icon="Star" 
          :disabled="!isLoggedIn"
          :class="{'liked-button': hasLiked}"
          @click="toggleLike">          <span class="like-text">{{ hasLiked ? '取消点赞' : '点赞' }}</span>
          <span class="like-count">{{ prompt.likes }}</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { getApiBaseUrl } from '../config/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const prompt = ref(null)
const loading = ref(true)
const hasLiked = ref(false)  // 添加状态跟踪用户是否已点赞

// 永久启用本地存储模式，但移除"开发"字样
const isDevelopment = ref(true)

const isLoggedIn = computed(() => userStore.isLoggedIn)

// 检查用户是否已经点赞过此Prompt
const checkIfUserLiked = () => {
  if (!isLoggedIn.value || !prompt.value) return;
  
  // 获取用户点赞历史 - 与PromptList.vue保持一致的格式
  const userId = userStore.userId;
  const likedPromptsKey = `user_${userId}_user-liked-prompts`;
  const likedPrompts = JSON.parse(localStorage.getItem(likedPromptsKey) || '[]');
  
  // 检查当前prompt是否在点赞列表中
  hasLiked.value = likedPrompts.includes(prompt.value.id);
  console.log(`检查用户 ${userId} 是否点赞 Prompt ${prompt.value.id}: ${hasLiked.value}`);
};

const fetchPrompt = async () => {
  loading.value = true;
  try {
    const promptId = route.params.id;
    
    // 首先尝试从本地存储获取（处理以dev-开头的ID）
    const devPrompts = JSON.parse(localStorage.getItem('dev-prompts') || '[]');
    const localPrompt = devPrompts.find(p => p.id == promptId);
    
    if (localPrompt) {
      prompt.value = localPrompt;
      console.log('从本地存储获取到prompt数据:', promptId);
    } else {
      // 如果本地没有，尝试从API获取
      try {
        const response = await axios.get(`${getApiBaseUrl()}/api/prompts/${promptId}`);
        prompt.value = response.data;
        console.log('从API获取到prompt数据:', promptId);
      } catch (error) {
        console.error('API获取prompt失败:', error);
        prompt.value = null;
        ElMessage.error('未找到该Prompt');
      }
    }
    
    // 如果成功获取到prompt且用户已登录，检查点赞状态
    if (prompt.value && userStore.isLoggedIn) {
      checkIfUserLiked();
    }
  } catch (error) {
    console.error('获取Prompt详情失败:', error);
    ElMessage.error('获取Prompt详情失败，请稍后重试');
    prompt.value = null;
  } finally {
    loading.value = false;
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const copyContent = () => {
  navigator.clipboard.writeText(prompt.value.content)
    .then(() => {
      ElMessage.success('已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
      ElMessage.error('复制失败，请手动复制')
    })
}

// 将点赞函数重命名为toggleLike，并增加取消点赞功能
const toggleLike = async () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再操作');
    return;
  }
  
  // 获取用户ID和点赞记录 - 与PromptList.vue保持一致的格式
  const userId = userStore.userId;
  const likedPromptsKey = `user_${userId}_user-liked-prompts`;
  const likedPrompts = JSON.parse(localStorage.getItem(likedPromptsKey) || '[]');
  
  // 检查是否已点赞，处理不同的逻辑
  if (hasLiked.value) {
    // 取消点赞逻辑
    await unlikePrompt(likedPrompts, likedPromptsKey);
  } else {
    // 点赞逻辑
    await likePrompt(likedPrompts, likedPromptsKey);
  }
};

// 点赞处理 - 处理两种不同的存储模式
const likePrompt = async (likedPrompts, likedPromptsKey) => {
  // 检查是否为本地存储的Prompt（ID以dev-开头）
  if (prompt.value.id.toString().startsWith('dev-')) {
    // 本地存储模式 - 不会上传到服务器
    console.log('处理本地存储Prompt的点赞操作:', prompt.value.id);
    
    // 从本地存储获取所有prompts
    const devPrompts = JSON.parse(localStorage.getItem('dev-prompts') || '[]');
    
    // 找到要点赞的prompt
    const promptIndex = devPrompts.findIndex(p => p.id === prompt.value.id);
    if (promptIndex === -1) {
      ElMessage.error('未找到该Prompt');
      return;
    }
    
    // 更新本地存储中的点赞数
    devPrompts[promptIndex].likes += 1;
    prompt.value.likes += 1;
    localStorage.setItem('dev-prompts', JSON.stringify(devPrompts));
    
    // 保存用户点赞记录 - 确保不重复添加
    if (!likedPrompts.includes(prompt.value.id)) {
      likedPrompts.push(prompt.value.id);
      localStorage.setItem(likedPromptsKey, JSON.stringify(likedPrompts));
      console.log(`用户 ${userStore.userId} 点赞了 Prompt ${prompt.value.id}, 已保存记录`);
    }
    
    // 更新点赞状态
    hasLiked.value = true;
    
    ElMessage.success('点赞成功');
    return;
  }
  
  // 服务器模式 - 会上传到服务器
  try {
    const response = await axios.post(`${getApiBaseUrl()}/api/prompts/${prompt.value.id}/like`, {}, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    });
    
    prompt.value.likes = response.data.likes;
    
    // 保存用户点赞记录 - 确保不重复添加
    if (!likedPrompts.includes(prompt.value.id)) {
      likedPrompts.push(prompt.value.id);
      localStorage.setItem(likedPromptsKey, JSON.stringify(likedPrompts));
      console.log(`用户 ${userStore.userId} 点赞了 Prompt ${prompt.value.id}, 已保存记录`);
    }
    
    // 更新点赞状态
    hasLiked.value = true;
    
    ElMessage.success('点赞成功');
  } catch (error) {
    console.error('点赞失败:', error);
    ElMessage.error('点赞失败，请稍后重试');
  }
};

// 新增：取消点赞处理
const unlikePrompt = async (likedPrompts, likedPromptsKey) => {
  // 检查是否为本地存储的Prompt
  if (prompt.value.id.toString().startsWith('dev-')) {
    console.log('处理本地存储Prompt的取消点赞操作:', prompt.value.id);
    
    // 从本地存储获取所有prompts
    const devPrompts = JSON.parse(localStorage.getItem('dev-prompts') || '[]');
    
    // 找到要取消点赞的prompt
    const promptIndex = devPrompts.findIndex(p => p.id === prompt.value.id);
    if (promptIndex === -1) {
      ElMessage.error('未找到该Prompt');
      return;
    }
    
    // 更新本地存储中的点赞数，确保不会小于0
    devPrompts[promptIndex].likes = Math.max(0, devPrompts[promptIndex].likes - 1);
    prompt.value.likes = devPrompts[promptIndex].likes;
    localStorage.setItem('dev-prompts', JSON.stringify(devPrompts));
    
    // 从用户点赞记录中移除
    const newLikedPrompts = likedPrompts.filter(id => id !== prompt.value.id);
    localStorage.setItem(likedPromptsKey, JSON.stringify(newLikedPrompts));
    console.log(`用户 ${userStore.userId} 取消点赞 Prompt ${prompt.value.id}, 已更新记录`);
    
    // 更新点赞状态
    hasLiked.value = false;
    
    ElMessage.success('已取消点赞');
    return;
  }
  
  // 如果不是本地存储的Prompt，则调用API
  try {
    const response = await axios.delete(`${getApiBaseUrl()}/api/prompts/${prompt.value.id}/like`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`
      }
    });
    
    prompt.value.likes = response.data.likes;
    
    // 从用户点赞记录中移除
    const newLikedPrompts = likedPrompts.filter(id => id !== prompt.value.id);
    localStorage.setItem(likedPromptsKey, JSON.stringify(newLikedPrompts));
    console.log(`用户 ${userStore.userId} 取消点赞 Prompt ${prompt.value.id}, 已更新记录`);
    
    // 更新点赞状态
    hasLiked.value = false;
    
    ElMessage.success('已取消点赞');
  } catch (error) {
    console.error('取消点赞失败:', error);
    ElMessage.error('取消点赞失败，请稍后重试');
  }
}

// 修改标记计算属性
const isLocalPrompt = computed(() => {
  return prompt.value?.id?.toString().startsWith('dev-');
})

onMounted(() => {
  fetchPrompt();
  
  // 如果用户已登录，检查点赞状态
  if (userStore.isLoggedIn && prompt.value) {
    checkIfUserLiked();
  }
});

// 监听用户登录状态变化
watch(() => userStore.isLoggedIn, (newValue) => {
  if (newValue && prompt.value) {
    checkIfUserLiked();
  } else if (!newValue) {
    // 用户登出时清除点赞状态
    hasLiked.value = false;
  }
});

// 监听路由参数变化，当查看不同prompt时重新获取数据
watch(() => route.params.id, (newId, oldId) => {
  if (newId !== oldId) {
    fetchPrompt();
  }
});
</script>

<style scoped>
.prompt-detail {
  margin: 30px 0;
  color: var(--text-color, #333333);
}

/* 骨架屏基础样式 */
:deep(.el-skeleton) {
  background-color: var(--hero-background, #f0f9ff);
  padding: 20px;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  overflow: hidden;
  margin: 0 auto; /* 添加水平居中 */
  width: 100%; /* 确保宽度100% */
  max-width: 100%; /* 防止超出 */
  box-sizing: border-box; /* 确保padding不会导致超出 */
}

/* 骨架屏渐变边框 */
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

/* 移动端骨架屏适配 */
@media (max-width: 768px) {
  :deep(.el-skeleton) {
    padding: 15px;
    margin: 15px;
    width: calc(100% - 30px); /* 考虑margin的宽度计算 */
    border-radius: 12px;
  }

  :deep(.el-skeleton)::before {
    border-radius: 14px; /* 适应新的圆角 */
  }

  /* 调整骨架屏行高和间距 */
  :deep(.el-skeleton-item) {
    margin-bottom: 12px;
  }
}

/* 小屏幕进一步优化 */
@media (max-width: 480px) {
  :deep(.el-skeleton) {
    padding: 12px;
    margin: 10px;
    width: calc(100% - 20px);
  }
}

/* 未找到页面样式优化 */
.not-found {
  text-align: center;
  padding: 50px 20px;
  background-color: var(--hero-background, #f0f9ff);
  border-radius: 16px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 为未找到页面添加渐变边框 */
.not-found::before {
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
  opacity: 0.3;
  transition: all 0.3s ease;
}

/* Prompt内容卡片样式 */
.prompt-content {
  padding: 30px;
  background-color: var(--card-background, #fff);
  border-radius: 16px;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

/* 添加渐变边框效果 */
.prompt-content::before {
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
  opacity: 0.3;
  transition: all 0.3s ease;
}

.prompt-content:hover::before {
  opacity: 0.5;
}

/* 标题区域样式 */
.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color-light, #e4e7ed);
}

.prompt-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--text-color, #333);
  font-weight: 600;
}

/* 标签样式优化 */
:deep(.el-tag) {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s;
}

/* 深色模式标签样式覆盖 */
:global(.dark-mode) :deep(.el-tag) {
  color: rgba(255, 255, 255, 0.9) !important;
  border-color: var(--border-color-dark, #4b5563) !important;
}

:global(.dark-mode) :deep(.el-tag--primary) {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: white !important;
}

:global(.dark-mode) :deep(.el-tag--success) {
  background-color: #22c55e !important;
  border-color: #22c55e !important;
  color: white !important;
}

:global(.dark-mode) :deep(.el-tag--warning) {
  background-color: #f59e0b !important;
  border-color: #f59e0b !important;
  color: white !important;
}

:global(.dark-mode) :deep(.el-tag--info) {
  background-color: #6b7280 !important;
  border-color: #6b7280 !important;
  color: white !important;
}

:global(.dark-mode) :deep(.el-tag--danger) {
  background-color: #ef4444 !important;
  border-color: #ef4444 !important;
  color: white !important;
}

:global(.dark-mode) :deep(.el-tag:not([class*="--"])) {
  background-color: var(--secondary-color) !important;
  border-color: var(--secondary-color) !important;
  color: white !important;
}

/* 元数据区域样式 */
.prompt-meta {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-color-secondary, #909399);
  margin-bottom: 24px;
  padding: 0 5px;
}

/* 内容框样式优化 */
.content-box {
  background-color: var(--content-box-background, #f8f9fa);
  border: 1px solid var(--border-color, #ebeef5);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.content-box pre {
  font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
  margin: 0;
  white-space: pre-wrap;
  color: var(--code-text-color, #476582);
  line-height: 1.6;
  font-size: 1rem;
}

/* 操作按钮样式 - 使点赞按钮颜色随主题色变化 */
.prompt-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

/* 与Home组件统一按钮样式 */
.prompt-actions .el-button {
  border-radius: 30px !important;
  transition: all 0.3s ease;
  padding: 12px 20px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.prompt-actions .el-button--primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

/* 修改点赞按钮使用主题色 */
.prompt-actions .el-button--success {
  background-color: var(--secondary-color) !important; /* 使用主题次要颜色 */
  border-color: var(--secondary-color) !important;
  color: #ffffff !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px; /* 使用gap来控制元素间距 */
  font-weight: 500;
  position: relative;
  overflow: hidden;
  padding: 10px 20px !important;
  transition: all 0.3s ease;
  border-radius: 30px !important;
}

.prompt-actions .el-button--success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.4);
  background-color: var(--primary-color) !important; /* 悬停时使用主题主要颜色 */
  border-color: var(--primary-color) !important;
}

/* 确保图标和文字间距一致 */
.prompt-actions .el-button--success .el-icon {
  margin-right: 0; /* 移除原有的margin */
  transition: transform 0.3s ease;
  font-size: 18px;
}

.prompt-actions .el-button--success:hover .el-icon {
  transform: rotate(72deg) scale(1.2);
}

.like-text {
  margin: 0; /* 移除所有margin */
}

.like-count {
  padding: 3px 10px;
  font-size: 14px;
  margin: 0; /* 移除所有margin */
}

.prompt-actions .el-button--success:disabled {
  background-color: rgba(var(--primary-color-rgb), 0.5) !important; /* 半透明主题色 */
  border-color: rgba(var(--primary-color-rgb), 0.5) !important;
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 已点赞状态的按钮样式 */
.prompt-actions .el-button--warning {
  background-color: #ff9800 !important;
  border-color: #ff9800 !important;
  color: #ffffff !important;
  display: flex;
  align-items: center;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  padding: 10px 20px !important;
  transition: all 0.3s ease;
  border-radius: 30px !important;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
}

.prompt-actions .el-button--warning:hover {
  background-color: #f57c00 !important;
  border-color: #f57c00 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
}

.prompt-actions .el-button--warning .el-icon {
  margin-right: 8px;
  transition: transform 0.3s ease;
  font-size: 18px;
  color: #fff5e6 !important;
}

.prompt-actions .el-button--warning:hover .el-icon {
  transform: rotate(-72deg) scale(1.2);
}

.prompt-actions .liked-button .like-count {
  background-color: rgba(255, 255, 255, 0.3);
}

.prompt-actions .liked-button .like-count {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 标题容器样式 */
.title-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 深色模式适配 */
:deep(.dark-mode) .prompt-content {
  background-color: var(--card-background, rgba(30, 41, 59, 0.7));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

:deep(.dark-mode) .prompt-header {
  border-bottom-color: var(--border-color-dark, #4b5563);
}

:deep(.dark-mode) .prompt-header h2 {
  color: var(--text-color-dark, rgba(255, 255, 255, 0.95));
}

:deep(.dark-mode) .prompt-meta {
  color: var(--text-color-secondary-dark, rgba(255, 255, 255, 0.7));
}

:deep(.dark-mode) .content-box {
  background-color: rgba(15, 23, 42, 0.7);
  border-color: var(--border-color-dark, #4b5563);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

:deep(.dark-mode) .content-box pre {
  color: var(--code-text-color-dark, #a8b6d0);
}

:deep(.dark-mode) .not-found, 
:deep(.dark-mode) .el-skeleton {
  background-color: var(--hero-background, rgba(30, 41, 59, 0.8));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* 为未找到页面按钮设置样式 */
.not-found .el-button {
  margin-top: 20px;
  border-radius: 30px !important;
  padding: 12px 24px !important;
  transition: all 0.3s ease;
}

:deep(.dark-mode) .not-found .el-button {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: #ffffff;
}

:deep(.dark-mode) .not-found .el-button:hover {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 添加缺失的CSS变量 */
:root {
  --warning-color: #e6a23c;
  --warning-hover-color: #d48f1f;
  --content-box-background: #f8f9fa;
  --code-text-color: #476582;
  --code-text-color-dark: #a8b6d0;
  /* 移除特定的点赞按钮颜色变量，使用主题色变量替代 */
}

.dark-mode {
  /* 深色模式样式已在各元素中通过选择器定义 */
  --dark-mode-specific: true;
}

/* 响应式设计增强 */
@media (max-width: 768px) {
  .prompt-detail {
    margin: 20px 0;
  }

  .prompt-content {
    padding: 25px 20px;
    margin: 0 15px;
    border-radius: 12px;
  }

  .prompt-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 18px;
    padding-bottom: 12px;
  }
  
  .prompt-header h2 {
    font-size: 1.6rem;
    margin-bottom: 0;
    line-height: 1.3;
  }

  /* 移动端标签样式优化 */
  :deep(.el-tag) {
    padding: 6px 14px;
    font-size: 13px;
    border-radius: 16px;
  }
  
  .prompt-meta {
    flex-direction: column;
    gap: 8px;
    margin-bottom: 20px;
    font-size: 13px;
  }
  
  .content-box {
    padding: 18px;
    margin-bottom: 25px;
    border-radius: 10px;
  }
  
  .content-box pre {
    font-size: 14px;
    line-height: 1.5;
  }
  
  .prompt-actions {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  
  .prompt-actions .el-button {
    width: 100%;
    height: 46px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    margin: 0 !important; /* 覆盖Element Plus的默认margin */
  }
  
  /* 点赞按钮特殊处理 */
  .prompt-actions .el-button--success,
  .prompt-actions .el-button--warning {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 8px !important;
    height: 46px !important;
    padding: 0 20px !important;
    margin: 0 !important; /* 确保覆盖所有margin */
  }

  .prompt-actions .el-button--success .el-icon,
  .prompt-actions .el-button--warning .el-icon {
    margin: 0 !important;
  }

  .like-text {
    margin: 0 !important;
  }

  .like-count {
    margin: 0 !important;
    padding: 3px 10px;
    font-size: 14px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
  }

  /* 移动端加载状态优化 */
  :deep(.el-skeleton) {
    padding: 15px;
    margin: 0 15px;
    border-radius: 12px;
  }

  /* 移动端未找到页面优化 */
  .not-found {
    padding: 40px 20px;
    margin: 0 15px;
    border-radius: 12px;
  }

  .not-found .el-button {
    width: 100%;
    height: 46px !important;
    font-size: 15px !important;
  }
}

@media (max-width: 480px) {
  .prompt-detail {
    margin: 15px 0;
  }

  .prompt-content {
    padding: 20px 16px;
    margin: 0 10px;
  }
  
  .prompt-header h2 {
    font-size: 1.4rem;
  }

  /* 480px标签进一步优化 */
  :deep(.el-tag) {
    padding: 5px 12px;
    font-size: 12px;
    border-radius: 14px;
  }

  .prompt-meta {
    font-size: 12px;
    gap: 6px;
  }
  
  .content-box {
    padding: 15px;
    border-radius: 8px;
  }
  
  .content-box pre {
    font-size: 13px;
    line-height: 1.4;
  }

  .prompt-actions {
    flex-direction: column;
    gap: 10px;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .prompt-actions .el-button {
    height: 44px !important;
    font-size: 14px !important;
  }

  /* 480px加载和未找到页面 */
  :deep(.el-skeleton) {
    padding: 12px;
    margin: 0 10px;
  }

  .not-found {
    padding: 30px 16px;
    margin: 0 10px;
  }

  .not-found .el-button {
    height: 44px !important;
    font-size: 14px !important;
  }
}

@media (max-width: 360px) {
  .prompt-content {
    padding: 18px 14px;
    margin: 0 8px;
  }
  
  .prompt-header h2 {
    font-size: 1.3rem;
    line-height: 1.2;
  }

  /* 360px标签最小化 */
  :deep(.el-tag) {
    padding: 4px 10px;
    font-size: 11px;
    border-radius: 12px;
  }

  .prompt-meta {
    font-size: 11px;
  }
  
  .content-box {
    padding: 12px;
  }
  
  .content-box pre {
    font-size: 12px;
    line-height: 1.3;
  }

  .prompt-actions {
    flex-direction: column;
    gap: 8px;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .prompt-actions .el-button {
    height: 42px !important;
    font-size: 13px !important;
  }

  /* 360px加载和未找到页面 */
  :deep(.el-skeleton) {
    padding: 10px;
    margin: 0 8px;
  }

  .not-found {
    padding: 25px 14px;
    margin: 0 8px;
  }

  .not-found .el-button {
    height: 42px !important;
    font-size: 13px !important;
  }
}

/* 平板横屏适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .prompt-content {
    max-width: 700px;
    margin: 0 auto;
    padding: 35px 30px;
  }
  
  .prompt-header h2 {
    font-size: 1.7rem;
  }
  
  .content-box {
    padding: 25px;
  }
  
  .content-box pre {
    font-size: 15px;
  }
}
</style>
