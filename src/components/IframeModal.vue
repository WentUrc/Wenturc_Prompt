<template>
  <div 
    class="iframe-modal-overlay" 
    v-if="visible" 
    :class="{ 'modal-visible': modalLoaded, 'modal-closing': closing }"
    @click="handleOverlayClick"
  >
    <div 
      class="iframe-modal" 
      :class="{ 'modal-visible': modalLoaded, 'modal-closing': closing }"
    >
      <!-- 窗口头部 -->
      <div class="modal-header">
        <div class="modal-title">
          <div class="site-info">
            <img :src="siteData.avatar" :alt="siteData.name" class="site-avatar" @error="handleAvatarError" />
            <div class="site-details">
              <h3>{{ siteData.name }}</h3>
              <p>{{ siteData.description }}</p>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <!-- 在新标签页打开 -->
          <el-button 
            type="primary" 
            :icon="Link" 
            @click.stop="openInNewTab"
            class="external-btn"
            title="在新标签页中打开"
          >
            跳转
          </el-button>
          
          <!-- 关闭按钮 -->
          <el-button 
            type="info" 
            :icon="Close" 
            @click.stop="closeModal"
            class="close-btn"
            title="关闭窗口"
          >
            关闭
          </el-button>
        </div>
      </div>
      
      <!-- iframe内容区 -->
      <div class="modal-body" @click.stop>
        <div class="iframe-container">
          <iframe 
            :src="siteData.url" 
            frameborder="0"
            allowfullscreen
            :title="siteData.name"
            @load="handleIframeLoad"
            @error="handleIframeError"
            class="site-iframe"
            ref="iframeRef"
          ></iframe>
          
          <!-- 加载指示器 -->
          <div class="loading-overlay" v-if="iframeLoading">
            <div v-loading="true" element-loading-text="正在加载网站..." class="loading-container"></div>
          </div>
          
          <!-- 错误提示 -->
          <div class="error-overlay" v-if="iframeError">
            <el-result icon="warning" title="无法加载网站" :sub-title="errorMessage">
              <template #extra>
                <el-button type="primary" @click.stop="openInNewTab">
                  <el-icon><Link /></el-icon>
                  在新标签页中打开
                </el-button>
                <el-button @click.stop="retryLoad">
                  <el-icon><Refresh /></el-icon>
                  重试
                </el-button>
              </template>
            </el-result>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Close, Link, Refresh } from '@element-plus/icons-vue'
import { friendsConfig } from '../config/friends.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  siteData: {
    type: Object,
    required: true,
    default: () => ({
      name: '',
      description: '',
      url: '',
      avatar: ''
    })
  }
})

const emit = defineEmits(['close', 'open-external'])

const modalLoaded = ref(false)
const iframeLoading = ref(true)
const iframeError = ref(false)
const errorMessage = ref('')
const iframeRef = ref(null)
const savedScrollY = ref(0)
const closing = ref(false)

// 处理模态框显示
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 保存当前滚动位置
    savedScrollY.value = window.scrollY
    
    // 禁用背景滚动
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = `-${savedScrollY.value}px`
    
    // 重置状态
    closing.value = false
    
    // 延迟显示模态框动画
    nextTick(() => {
      modalLoaded.value = true
    })
  } else {
    // 恢复背景滚动
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
    document.body.style.top = ''
    
    // 恢复滚动位置
    window.scrollTo(0, savedScrollY.value)
    
    modalLoaded.value = false
    iframeLoading.value = true
    iframeError.value = false
  }
})

// 点击遮罩层关闭
const handleOverlayClick = (event) => {
  if (event.target.classList.contains('iframe-modal-overlay')) {
    closeModal()
  }
}

// 关闭模态框
const closeModal = () => {
  if (!closing.value) {
    closing.value = true
    // 等待动画完成后再关闭
    setTimeout(() => {
      emit('close')
      closing.value = false
    }, 300)
  }
}

// 在新标签页打开
const openInNewTab = () => {
  window.open(props.siteData.url, '_blank', 'noopener,noreferrer')
  emit('open-external', props.siteData)
  // 打开新标签页后关闭模态框
  closeModal()
}

// iframe加载完成
const handleIframeLoad = () => {
  iframeLoading.value = false
  iframeError.value = false
}

// iframe加载错误
const handleIframeError = () => {
  iframeLoading.value = false
  iframeError.value = true
  errorMessage.value = '无法加载该网站，可能是网络问题或该网站不支持嵌入显示'
}

// 重试加载
const retryLoad = () => {
  iframeLoading.value = true
  iframeError.value = false
  
  // 重新设置iframe src来触发重新加载
  const iframe = iframeRef.value
  if (iframe) {
    const currentSrc = iframe.src
    iframe.src = ''
    setTimeout(() => {
      iframe.src = currentSrc
    }, 100)
  }
}

// 头像加载错误处理
const handleAvatarError = (event) => {
  event.target.src = friendsConfig.defaultAvatar
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape' && props.visible) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  
  // 确保在组件销毁时恢复滚动
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
  document.body.style.top = ''
})
</script>

<style scoped>
/* 模态框遮罩层 */
.iframe-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10002; /* 确保高于顶栏(10000)和移动菜单(10001) */
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: all 0.3s ease-out;
}

.iframe-modal-overlay.modal-visible {
  opacity: 1;
}

.iframe-modal-overlay.modal-closing {
  opacity: 0;
  transition: all 0.3s ease-in;
}

/* 模态框主体 */
.iframe-modal {
  width: 95vw;
  height: calc(100vh - 160px);
  max-width: 1400px;
  background: var(--card-background, #fff);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  margin: 120px auto 40px; /* 增加顶部间距，让窗口下移 */
  z-index: 1;
  
  /* 初始状态和动画 */
  transform: scale(0.95) translateY(20px);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 渐变边框 */
.iframe-modal::after {
  content: "";
  position: absolute;
  inset: 0; /* 使用inset替代top/right/bottom/left */
  padding: 2px; /* 边框宽度 */
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--secondary-color) 50%,
    var(--accent-color, #67c23a)
  );
  border-radius: 16px; /* 与modal相同的圆角 */
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* 模态框显示状态 */
.iframe-modal.modal-visible {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* 模态框关闭动画 */
.iframe-modal.modal-closing {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 模态框头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e4e7ed);
  background: var(--card-background, #fff);
  min-height: 80px;
}

.modal-title {
  flex: 1;
}

.site-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.site-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid var(--border-color, #e4e7ed);
  flex-shrink: 0;
}

.site-details h3 {
  margin: 0 0 4px 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-color, #303133);
}

.site-details p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-color-secondary, #606266);
}

.modal-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.external-btn {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.close-btn {
  background: var(--border-color, #e4e7ed);
  color: var(--text-color, #303133);
  border-color: var(--border-color, #e4e7ed);
}

/* 模态框主体内容 */
.modal-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.iframe-container {
  flex: 1;
  position: relative;
  display: flex;
}

.site-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

/* 加载覆盖层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-background, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* 错误覆盖层 */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--card-background, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* 深色模式适配 */
.dark-mode .iframe-modal {
  background: var(--background-color-dark, #1f2937);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.dark-mode .modal-header {
  background: var(--background-color-dark, #1f2937);
  border-bottom-color: var(--border-color-dark, #4b5563);
}

.dark-mode .loading-overlay,
.dark-mode .error-overlay {
  background: var(--background-color-dark, #1f2937);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .iframe-modal {
    width: 100vw;
    height: calc(100vh - 120px);
    border-radius: 16px 16px 0 0;
    margin: 100px auto 0; /* 增加与顶栏的间距 */
  }

  .iframe-modal::after {
    border-radius: 16px 16px 0 0;
  }
  
  .modal-header {
    padding: 16px;
    min-height: 70px;
  }
  
  .site-info {
    gap: 12px;
  }
  
  .site-avatar {
    width: 40px;
    height: 40px;
  }
  
  .site-details h3 {
    font-size: 1.2rem;
  }
  
  .site-details p {
    font-size: 0.8rem;
  }
  
  .modal-actions {
    gap: 8px;
  }
  
  .external-btn,
  .close-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .iframe-modal {
    height: calc(100vh - 100px);
    margin: 90px auto 0; /* 小屏幕的顶栏间距 */
    border-radius: 12px 12px 0 0;
  }

  .iframe-modal::after {
    border-radius: 12px 12px 0 0;
  }
  
  .modal-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    min-height: auto;
    padding-bottom: 12px;
  }
  
  .modal-title {
    flex: none;
  }
  
  .modal-actions {
    justify-content: center;
  }
  
  .external-btn,
  .close-btn {
    flex: 1;
  }
}
</style> 