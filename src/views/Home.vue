<template>
  <div class="home">
    <div class="hero">
      <h1>欢迎来到Prompt收集站</h1>
      <p>在这里你可以发现、分享和收藏各种有用的AI Prompt</p>
      <div class="cta-buttons">
        <el-button class="primary-btn" size="large" @click="$router.push('/prompts')">浏览Prompts</el-button>
        <el-button v-if="!isLoggedIn" class="accent-btn" size="large" @click="$router.push('/register')">立即注册</el-button>
        <el-button v-else class="accent-btn" size="large" @click="$router.push('/create')">创建Prompt</el-button>
      </div>
    </div>
    
    <div class="features">
      <el-row :gutter="20">
        <el-col 
          :xs="24" :sm="24" :md="8" :lg="8" :xl="8" 
          class="feature-col"
          v-for="(feature, index) in features"
          :key="index"
          :style="{ '--feature-index': index }"
        >
          <div class="feature-card" :class="{ 'feature-loaded': featuresLoaded }">
            <el-icon>
              <component :is="feature.icon" />
            </el-icon>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 友情链接部分 -->
    <div class="friends-links-section" v-if="friendsConfig.enabled">
      <h2 class="section-title">{{ friendsConfig.title }}</h2>
      <el-row :gutter="20">
        <el-col 
          :xs="friendsConfig.responsive.xs" 
          :sm="friendsConfig.responsive.sm" 
          :md="friendsConfig.responsive.md" 
          :lg="friendsConfig.responsive.lg" 
          :xl="friendsConfig.responsive.xl" 
          class="friends-col"
          v-for="(link, index) in friendsLinks"
          :key="`${link.name}-${index}`"
          :style="{ 
            '--link-index': index,
            '--stagger-delay': `${friendsConfig.animation.staggerDelay}ms`
          }"
        >
          <div class="friends-card" :class="{ 'friends-loaded': friendsLoaded }">
            <div class="friends-link" @click="openSiteModal(link)">
              <div class="friends-avatar">
                <img :src="link.avatar" :alt="link.name" @error="handleImageError" />
              </div>
              <div class="friends-info">
                <h4>{{ link.name }}</h4>
                <p>{{ link.description }}</p>
                <span class="friends-category" v-if="link.category">{{ link.category }}</span>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- iframe模态框 -->
    <IframeModal 
      :visible="showIframeModal"
      :site-data="selectedSite"
      @close="closeIframeModal"
      @open-external="handleOpenExternal"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { Search, Connection, Star } from '@element-plus/icons-vue'
import { friendsLinks, friendsConfig } from '../config/friends.js'
import IframeModal from '../components/IframeModal.vue'

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

const featuresLoaded = ref(false)
const friendsLoaded = ref(false)

// iframe模态框相关状态
const showIframeModal = ref(false)
const selectedSite = ref({
  name: '',
  description: '',
  url: '',
  avatar: '',
  category: ''
})

const features = [
  {
    icon: Search,
    title: '发现优质Prompt',
    description: '浏览各种类别的高质量Prompt，提升你的AI使用效率'
  },
  {
    icon: Connection,
    title: '分享你的创意',
    description: '创建并分享你的Prompt，帮助他人更好地使用AI工具'
  },
  {
    icon: Star,
    title: '点赞收藏',
    description: '给优质Prompt点赞，建立你自己的收藏列表'
  }
]

// 打开网站模态框
const openSiteModal = (siteData) => {
  selectedSite.value = { ...siteData }
  showIframeModal.value = true
}

// 关闭iframe模态框
const closeIframeModal = () => {
  showIframeModal.value = false
  // 延迟清空数据，等待关闭动画完成
  setTimeout(() => {
    selectedSite.value = {
      name: '',
      description: '',
      url: '',
      avatar: '',
      category: ''
    }
  }, 300)
}

// 处理在新标签页打开
const handleOpenExternal = (siteData) => {
  console.log(`在新标签页打开: ${siteData.name} - ${siteData.url}`)
}

// 图片加载失败处理
const handleImageError = (event) => {
  // 使用配置文件中的默认头像
  event.target.src = friendsConfig.defaultAvatar
}

onMounted(() => {
  // 延迟触发卡片加载动画
  setTimeout(() => {
    featuresLoaded.value = true
  }, 800) // 在页面加载后稍作延迟
  
  // 友情链接稍后加载，使用配置文件中的延迟设置
  setTimeout(() => {
    friendsLoaded.value = true
  }, friendsConfig.animation.loadDelay)
})
</script>

<style scoped>
.home {
  padding: 20px 0;
  max-width: 1280px;
  margin: 0 auto;
  width: 70%;
}

/* 修改hero样式，添加渐变边框 */
:global(.hero) {
  text-align: center;
  padding: 60px 20px;
  background-color: var(--hero-background, #f0f9ff);
  border-radius: 16px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

/* 为hero添加渐变边框效果 */
:global(.hero::before) {
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
  border-radius: 18px; /* 略大于hero本身 */
  z-index: -1;
  opacity: 0.3;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

:global(.hero:hover::before) {
  opacity: 0.4; /* 悬停时轻微增加边框亮度 */
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

:global(.hero h1) {
  font-size: 2.5rem;
  margin-bottom: 16px;
  color: var(--hero-title-color, #303133);
}

:global(.hero p) {
  font-size: 1.25rem;
  color: var(--hero-text-color, #606266);
  margin-bottom: 32px;
}

/* 按钮容器基础样式 */
.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* 按钮统一样式 */
.cta-buttons .el-button {
  min-width: 140px;
  transition: all 0.3s;
  border-radius: 30px !important;
  padding: 12px 24px !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

/* 主题按钮样式 */
.primary-btn {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.primary-btn:hover, .primary-btn:focus {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: white;
  transform: translateY(-2px); /* 添加悬浮效果 */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.accent-btn {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: white;
}

.accent-btn:hover, .accent-btn:focus {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.features {
  margin-top: 40px;
}

/* 修改卡片样式，添加渐变边框和加载动画 */
:global(.feature-card) {
  text-align: center;
  padding: 30px;
  background-color: var(--card-background, #fff);
  border-radius: 16px;
  position: relative;
  height: 100%;
  z-index: 1;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  /* 初始加载状态 - 简化为淡出淡入 */
  opacity: 0;
  transform: scale(0.98);
  transition: all 0.3s ease-out; /* 缩短动画时间 */
  
  /* 错落动画延迟 */
  transition-delay: calc(var(--feature-index) * 0.2s);
}

/* 加载完成状态 */
:global(.feature-card.feature-loaded) {
  opacity: 1;
  transform: scale(1);
}

/* 悬停时的额外动画 - 与PromptCard保持一致 */
:global(.feature-card.feature-loaded:hover) {
  transform: translateY(-3px); /* 移除scale，与PromptCard保持一致 */
  transition: transform 0.3s ease;
}

/* 创建渐变边框效果 - 简化版本 */
:global(.feature-card::before) {
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
  opacity: 0.3; /* 默认可见 */
  transition: opacity 0.3s ease; /* 简化过渡 */
}

/* 卡片加载完成后边框完全显示 */
:global(.feature-card.feature-loaded::before) {
  opacity: 0.4; /* 加载完成后的透明度 */
}

/* 悬停时增强边框 */
:global(.feature-card.feature-loaded:hover::before) {
  opacity: 0.8; /* 悬停时更明显 */
}

:global(.feature-card h3) {
  font-size: 1.5rem;
  margin-bottom: 16px;
  color: var(--text-color, #303133);
}

:global(.feature-card p) {
  color: var(--text-color-secondary, #606266);
}

:global(.feature-card .el-icon) {
  font-size: 48px;
  color: var(--primary-color);
  margin-bottom: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .home {
    width: 95%;
  }
  
  :global(.hero) {
    padding: 40px 15px;
    margin-bottom: 35px;
  }
  
  :global(.hero h1) {
    font-size: 2rem;
  }
  
  :global(.hero p) {
    font-size: 1.1rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }
  
  .cta-buttons .el-button {
    width: 100% !important;
    min-width: unset !important;
    padding: 13px 22px !important;
    font-size: 1rem !important;
    margin: 0 !important;
  }
  
  .features {
    margin-top: 30px;
  }
  
  .feature-col {
    padding: 10px;
    margin-bottom: 15px;
  }
  
  :global(.feature-card) {
    padding: 25px 20px !important;
  }
  
  :global(.feature-card .el-icon) {
    font-size: 42px !important;
    margin-bottom: 14px !important;
  }
  
  :global(.feature-card h3) {
    font-size: 1.3rem !important;
    margin-bottom: 14px !important;
  }
}

/* 小屏幕手机适配 (320px - 480px) */
@media (max-width: 480px) {
  .home {
    width: 100%;
    padding: 10px;
  }
  
  :global(.hero) {
    padding: 30px 15px;
    margin-bottom: 30px;
    border-radius: 12px;
  }
  
  :global(.hero h1) {
    font-size: 1.8rem !important;
    margin-bottom: 12px;
    line-height: 1.3;
  }
  
  :global(.hero p) {
    font-size: 1rem !important;
    margin-bottom: 24px;
    line-height: 1.5;
    padding: 0 10px;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
  }
  
  .cta-buttons .el-button {
    width: 100% !important;
    min-width: unset !important;
    padding: 14px 20px !important;
    font-size: 0.95rem !important;
    border-radius: 25px !important;
    margin: 0 !important;
  }
  
  .features {
    margin-top: 30px;
  }
  
  .feature-col {
    padding: 8px;
    margin-bottom: 12px;
  }
  
  :global(.feature-card) {
    padding: 20px 15px !important;
    border-radius: 12px !important;
  }
  
  :global(.feature-card .el-icon) {
    font-size: 36px !important;
    margin-bottom: 12px !important;
  }
  
  :global(.feature-card h3) {
    font-size: 1.2rem !important;
    margin-bottom: 12px !important;
  }
  
  :global(.feature-card p) {
    font-size: 0.9rem !important;
    line-height: 1.5;
  }
}

/* 标准移动端适配 (481px - 768px) */
@media (max-width: 768px) and (min-width: 481px) {
  .home {
    width: 95%;
    padding: 15px;
  }
  
  :global(.hero) {
    padding: 40px 20px;
    margin-bottom: 35px;
  }
  
  :global(.hero h1) {
    font-size: 2.2rem !important;
    margin-bottom: 14px;
  }
  
  :global(.hero p) {
    font-size: 1.1rem !important;
    margin-bottom: 28px;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }
  
  .cta-buttons .el-button {
    width: 100% !important;
    min-width: unset !important;
    padding: 13px 22px !important;
    font-size: 1rem !important;
    margin: 0 !important;
  }
  
  .feature-col {
    padding: 10px;
    margin-bottom: 15px;
  }
  
  :global(.feature-card) {
    padding: 25px 20px !important;
  }
  
  :global(.feature-card .el-icon) {
    font-size: 42px !important;
    margin-bottom: 14px !important;
  }
  
  :global(.feature-card h3) {
    font-size: 1.3rem !important;
    margin-bottom: 14px !important;
  }
}

/* 平板适配 (769px - 1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .home {
    width: 85%;
  }
  
  :global(.hero) {
    padding: 50px 25px;
  }
  
  :global(.hero h1) {
    font-size: 2.3rem;
  }
  
  :global(.hero p) {
    font-size: 1.15rem;
  }
  
  .cta-buttons {
    gap: 18px;
  }
  
  .cta-buttons .el-button {
    min-width: 160px;
    padding: 13px 26px !important;
  }
  
  /* 添加feature-card之间的间隙 */
  .feature-col {
    padding: 12px;
    margin-bottom: 18px;
  }
  
  :global(.feature-card) {
    padding: 28px 22px !important;
  }
}

/* 小尺寸平板竖屏适配 */
@media (max-width: 900px) and (min-width: 769px) and (orientation: portrait) {
  .cta-buttons {
    flex-direction: column;
    align-items: center;
    gap: 16px;
    max-width: 350px;
    margin: 0 auto;
  }
  
  .cta-buttons .el-button {
    width: 100%;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .cta-buttons .el-button {
    min-height: 48px; /* 确保触摸目标足够大 */
  }
  
  :global(.feature-card) {
    cursor: default; /* 移除鼠标指针样式 */
  }
  
  /* 优化触摸设备的悬停效果 */
  :global(.feature-card:hover) {
    transform: none; /* 触摸设备上禁用悬停动画 */
  }
  
  .cta-buttons .el-button:hover {
    transform: none; /* 触摸设备上禁用按钮悬停动画 */
  }
}

/* 横屏手机适配 */
@media (max-height: 500px) and (orientation: landscape) {
  :global(.hero) {
    padding: 20px 15px;
  }
  
  :global(.hero h1) {
    font-size: 1.8rem;
    margin-bottom: 8px;
  }
  
  :global(.hero p) {
    font-size: 1rem;
    margin-bottom: 16px;
  }
  
  .cta-buttons {
    flex-direction: row;
    gap: 12px;
    justify-content: center;
  }
  
  .cta-buttons .el-button {
    width: auto !important;
    min-width: 120px;
    padding: 10px 18px !important;
    font-size: 0.9rem !important;
  }
  
  .features {
    margin-top: 20px;
  }
}

/* 高分辨率小屏幕适配 */
@media (-webkit-min-device-pixel-ratio: 2) and (max-width: 480px) {
  :global(.hero h1) {
    font-weight: 600;
  }
  
  :global(.feature-card h3) {
    font-weight: 600;
  }
  
  .cta-buttons .el-button {
    font-weight: 600;
    letter-spacing: 0.02em;
  }
}

/* 在:root中添加hero相关的变量 */
:global(:root) {
  --card-background: #fff;
  --text-color: #303133;
  --text-color-secondary: #606266;
  --hero-background: #f0f9ff;
  --hero-title-color: #303133;
  --hero-text-color: #606266;
  --accent-color: #67c23a; /* 渐变的第三个颜色 */
}

/* 适配暗色模式 - 添加hero相关的变量 */
:global(html.dark-mode), :global(body.dark-mode), :global(.dark-mode) {
  --card-background: rgba(30, 41, 59, 0.7) !important;
  --text-color: rgba(255, 255, 255, 0.9) !important;
  --text-color-secondary: rgba(255, 255, 255, 0.7) !important;
  --hero-background: rgba(30, 41, 59, 0.8) !important;
  --hero-title-color: rgba(255, 255, 255, 0.95) !important;
  --hero-text-color: rgba(255, 255, 255, 0.8) !important;
  --accent-color: #95d475 !important; /* 深色模式下渐变的第三个颜色更亮 */
}

/* 深色模式下hero区域的特殊效果 */
:global(.dark-mode .hero) {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  /* 移除原来的边框，因为已经有渐变边框了 */
  border: none;
}

:global(.dark-mode .hero::before) {
  opacity: 0.25; /* 深色模式下默认边框透明度 */
  background: linear-gradient(
    45deg, 
    var(--secondary-color), 
    var(--primary-color) 60%,
    rgba(255, 255, 255, 0.4) 100%
  );
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

:global(.dark-mode .hero:hover::before) {
  opacity: 0.4; /* 深色模式下悬停时边框透明度 */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
}

/* 移除非全局化的重复定义，避免冲突 */
.feature-card, .feature-card:hover, 
.feature-card h3, .feature-card p,
.feature-card .el-icon {
  /* 这里不再定义样式，改用全局样式 */
}

/* 友情链接部分样式 */
.friends-links-section {
  margin-top: 60px;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 40px;
  color: var(--text-color, #303133);
  font-weight: 600;
}

/* 友情链接卡片样式 */
:global(.friends-card) {
  background-color: var(--card-background, #fff);
  border-radius: 12px;
  position: relative;
  height: 100%;
  z-index: 1;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  /* 初始加载状态 */
  opacity: 0;
  transform: scale(0.98);
  transition: all 0.3s ease-out;
  
  /* 错落动画延迟 - 使用配置文件中的延迟值 */
  transition-delay: calc(var(--link-index) * var(--stagger-delay));
}

/* 加载完成状态 */
:global(.friends-card.friends-loaded) {
  opacity: 1;
  transform: scale(1);
}

/* 悬停动画 */
:global(.friends-card.friends-loaded:hover) {
  transform: translateY(-3px);
  transition: transform 0.3s ease;
}

/* 友情链接渐变边框 */
:global(.friends-card::before) {
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
    var(--accent-color, #67c23a)
  );
  border-radius: 14px;
  z-index: -1;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

/* 加载完成后边框显示 */
:global(.friends-card.friends-loaded::before) {
  opacity: 0.4;
}

/* 悬停时增强边框 */
:global(.friends-card.friends-loaded:hover::before) {
  opacity: 0.8;
}

/* 友情链接内容样式 */
.friends-link {
  display: block;
  padding: 24px; /* 增加桌面端内边距 */
  text-decoration: none;
  color: inherit;
  height: 100%;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 12px;
}

.friends-link:hover {
  text-decoration: none;
  color: inherit;
  background-color: rgba(var(--primary-color-rgb, 64, 158, 255), 0.05);
}

.friends-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 16px; /* 增加间距 */
}

.friends-avatar img {
  width: 48px; /* 增加头像大小 */
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid var(--border-color, #e4e7ed);
  transition: all 0.3s ease;
}

.friends-card:hover .friends-avatar img {
  border-color: var(--primary-color);
  transform: scale(1.1);
}

.friends-info {
  text-align: center;
}

.friends-info h4 {
  font-size: 1.1rem; /* 增加标题字体 */
  margin: 0 0 10px 0; /* 增加底部间距 */
  color: var(--text-color, #303133);
  font-weight: 600;
  line-height: 1.2;
}

.friends-info p {
  font-size: 0.85rem; /* 增加描述字体 */
  color: var(--text-color-secondary, #909399);
  margin: 0 0 10px 0; /* 增加底部间距 */
  line-height: 1.4; /* 增加行高 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.friends-category {
  display: inline-block;
  font-size: 0.75rem; /* 稍微增加标签字体 */
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb, 64, 158, 255), 0.1);
  padding: 4px 8px; /* 增加标签内边距 */
  border-radius: 8px;
  margin-top: 6px; /* 增加顶部间距 */
  border: 1px solid rgba(var(--primary-color-rgb, 64, 158, 255), 0.2);
  transition: all 0.3s ease;
}

/* 友情链接卡片列间距 - 桌面端默认样式 */
.friends-col {
  padding: 12px; /* 增加卡片间的内边距 */
  margin-bottom: 24px; /* 增加桌面端卡片间距 */
}

/* 移动端适配 */
@media (max-width: 768px) {
  .friends-links-section {
    margin-top: 50px;
  }
  
  .section-title {
    font-size: 1.6rem;
    margin-bottom: 30px;
  }
  
  .friends-col {
    padding: 8px;
    margin-bottom: 12px;
  }
  
  :global(.friends-card) {
    border-radius: 10px;
  }
  
  .friends-link {
    padding: 16px;
  }
  
  .friends-avatar img {
    width: 36px;
    height: 36px;
  }
  
  .friends-info h4 {
    font-size: 0.9rem;
  }
  
  .friends-info p {
    font-size: 0.75rem;
  }
}

/* 小屏幕适配 */
@media (max-width: 480px) {
  .friends-links-section {
    margin-top: 40px;
  }
  
  .section-title {
    font-size: 1.4rem;
    margin-bottom: 25px;
  }
  
  .friends-col {
    padding: 6px;
    margin-bottom: 10px;
  }
  
  .friends-link {
    padding: 14px;
  }
  
  .friends-avatar img {
    width: 32px;
    height: 32px;
  }
  
  .friends-info h4 {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }
  
  .friends-info p {
    font-size: 0.7rem;
  }
}
</style>
