<template>
  <div 
    class="prompt-card-wrapper" 
    :class="{ 
      'card-loading': isLoading, 
      'card-loaded': !isLoading,
      'card-skeleton': showSkeleton 
    }"
  >
    <!-- 骨架屏加载状态 -->
    <div v-if="showSkeleton" class="card-skeleton-content">
      <div class="skeleton-header">
        <div class="skeleton-title"></div>
        <div class="skeleton-tag"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-meta">
          <div class="skeleton-author"></div>
          <div class="skeleton-date"></div>
        </div>
        <div class="skeleton-actions">
          <div class="skeleton-button primary"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
    
    <!-- 实际卡片内容 -->
    <transition 
      name="card-fade-in" 
      appear
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
    >
      <div 
        v-if="!showSkeleton" 
        class="prompt-card" 
        :class="{ 'card-enter-active': !isLoading }"
      >
        <div class="card-header">
          <span class="prompt-title">{{ prompt.title }}</span>
          <el-tag size="small" :type="getTagType(prompt.category)">{{ prompt.category }}</el-tag>
        </div>
        
        <div class="card-content">
          <p class="prompt-preview">{{ truncateContent(prompt.content) }}</p>
          <div class="card-meta">
            <span class="author">作者: {{ prompt.author }}</span>
            <span class="created-at">{{ formatDate(prompt.created_at) }}</span>
          </div>
          
          <div class="card-actions">
            <router-link :to="`/prompts/${prompt.id}`" class="router-link">
              <el-button type="primary" size="small" class="detail-btn">
                <el-icon><View /></el-icon>
                <span>查看详情</span>
              </el-button>
            </router-link>
            
            <div class="likes">
              <el-button 
                type="text" 
                :icon="Star" 
                @click="handleLike"
                :class="{ 'liked': prompt.hasLiked }"
                class="like-btn"
              >
                <span class="like-count">{{ prompt.likes || 0 }}</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Star, View } from '@element-plus/icons-vue'

const props = defineProps({
  prompt: {
    type: Object,
    required: true
  },
  loadingDelay: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['like'])

const isLoading = ref(true)
const showSkeleton = ref(true)

// 在组件挂载后模拟加载完成
onMounted(() => {
  // 根据 loadingDelay 延迟显示真实内容
  setTimeout(() => {
    showSkeleton.value = false
    // 再稍微延迟一下触发加载完成动画
    setTimeout(() => {
      isLoading.value = false
    }, 100)
  }, props.loadingDelay)
})

// 截断内容显示
const truncateContent = (content) => {
  if (!content) return ''
  return content.length > 100 ? content.substring(0, 100) + '...' : content
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 获取标签类型
const getTagType = (category) => {
  const typeMap = {
    '编程': 'primary',
    '写作': 'success',
    '设计': 'warning',
    '教育': 'info',
    '商业': 'danger',
    '通用': ''
  }
  return typeMap[category] || ''
}

// 处理点赞事件
const handleLike = () => {
  emit('like', props.prompt)
}

// 动画钩子函数 - 简化为淡出淡入
const onBeforeEnter = (el) => {
  el.style.opacity = '0'
  el.style.transform = 'scale(0.98)'
}

const onEnter = (el, done) => {
  // 强制重新计算布局
  el.offsetHeight
  
  el.style.transition = 'all 0.5s ease-out'
  el.style.opacity = '1'
  el.style.transform = 'scale(1)'
  
  // 简化：不再添加闪烁效果，直接完成
  setTimeout(() => {
    done()
  }, 500)
}

const onAfterEnter = (el) => {
  // 清理样式
  el.style.transition = ''
}
</script>

<style scoped>
.prompt-card-wrapper {
  height: 100%;
  position: relative;
  transition: all 0.3s ease;
}

/* 骨架屏样式 */
.card-skeleton-content {
  background-color: var(--card-background, #fff);
  border-radius: 16px;
  padding: 20px;
  height: 320px;
  position: relative;
  z-index: 1;
  overflow: hidden;
  border: 2px solid transparent;
}

/* 骨架屏渐变边框 */
.card-skeleton-content::before {
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
  opacity: 0.2;
  animation: skeleton-shimmer 2s infinite;
}

@keyframes skeleton-shimmer {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color-light, #e4e7ed);
}

.skeleton-title {
  height: 20px;
  width: 60%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-tag {
  height: 24px;
  width: 60px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 12px;
}

.skeleton-body {
  flex: 1;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 10px;
}

.skeleton-line.short {
  width: 70%;
}

.skeleton-meta {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.skeleton-author,
.skeleton-date {
  height: 14px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

.skeleton-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.skeleton-button {
  height: 32px;
  width: 80px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 16px;
}

.skeleton-button.primary {
  width: 100px;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.1) 25%, rgba(64, 158, 255, 0.2) 50%, rgba(64, 158, 255, 0.1) 75%);
  background-size: 200% 100%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 深色模式骨架屏 */
.dark-mode .skeleton-title,
.dark-mode .skeleton-tag,
.dark-mode .skeleton-line,
.dark-mode .skeleton-author,
.dark-mode .skeleton-date,
.dark-mode .skeleton-button {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
  animation: skeleton-loading-dark 1.5s infinite;
}

.dark-mode .skeleton-button.primary {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.2) 25%, rgba(64, 158, 255, 0.3) 50%, rgba(64, 158, 255, 0.2) 75%);
  background-size: 200% 100%;
}

@keyframes skeleton-loading-dark {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 卡片过渡动画 - 简化为淡入淡出 */
.card-fade-in-enter-active {
  transition: all 0.5s ease-out;
}

.card-fade-in-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

/* 实际卡片样式 */
:global(.prompt-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  background-color: var(--card-background, #fff);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 卡片渐变边框 - 恢复变量使用，与Home完全一致 */
:global(.prompt-card::before) {
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

:global(.prompt-card:hover) {
  transform: translateY(-3px);
}

:global(.prompt-card:hover::before) {
  opacity: 0.8;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 20px 15px 20px;
  border-bottom: 1px solid var(--border-color-light, #e4e7ed);
}

.prompt-title {
  font-weight: 600;
  font-size: 17px;
  color: var(--text-color, #333333);
  transition: color 0.3s;
  line-height: 1.3;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 卡片内容样式 */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.prompt-preview {
  color: var(--text-color-secondary, #606266);
  margin-bottom: 16px;
  flex: 1;
  line-height: 1.6;
  font-size: 14px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-color-secondary, #909399);
  margin-bottom: 16px;
}

/* 卡片操作区域 */
.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: auto;
}

.detail-btn {
  border-radius: 20px !important;
  transition: all 0.3s ease;
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  padding: 8px 16px !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px;
}

.detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb, 64, 158, 255), 0.3);
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
}

.like-btn {
  background-color: var(--secondary-color) !important;
  border-color: var(--secondary-color) !important;
  color: white !important;
  border-radius: 20px !important;
  padding: 8px 12px !important;
  transition: all 0.3s ease;
  display: flex !important;
  align-items: center !important;
  gap: 6px;
}

.like-btn:hover {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb, 64, 158, 255), 0.3);
}

.like-btn.liked {
  background-color: #ff9800 !important;
  border-color: #ff9800 !important;
}

.like-btn.liked:hover {
  background-color: #f57c00 !important;
  border-color: #f57c00 !important;
}

.like-count {
  font-weight: 600;
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 12px;
  font-weight: 500;
  font-size: 12px;
  padding: 4px 12px;
}

/* 深色模式适配 */
:global(.dark-mode .prompt-card) {
  background-color: var(--card-background, rgba(30, 41, 59, 0.7));
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
}

:global(.dark-mode .prompt-card .card-header) {
  border-bottom-color: var(--border-color-dark, #4b5563);
}

/* 响应式设计 */
@media (max-width: 768px) {
  :global(.prompt-card .card-actions) {
    flex-direction: column;
    gap: 8px;
  }
  
  :global(.prompt-card .detail-btn),
  :global(.prompt-card .like-btn) {
    width: 100%;
    justify-content: center;
  }
  
  :global(.prompt-card .prompt-title) {
    max-width: 85%;
    font-size: 16px;
  }
  
  :global(.prompt-card) {
    padding: 15px; /* 移动端减少内边距 */
  }
  
  :global(.prompt-card .card-header) {
    margin-bottom: 15px;
    padding-bottom: 12px;
  }
}

@media (max-width: 480px) {
  :global(.prompt-card .prompt-title) {
    font-size: 15px;
  }
  
  :global(.prompt-card .prompt-preview) {
    font-size: 13px;
  }
}
</style> 