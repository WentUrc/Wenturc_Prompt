<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 修改背景图层添加过渡效果 -->
    <div class="app-background" 
         :class="{'background-loaded': backgroundLoaded}"
         :style="{'background-image': `url('${backgroundUrl}')`}">
    </div>
    <div class="app-overlay"></div>
    
    <!-- 移动端菜单全屏遮罩层 -->
    <transition name="mask-fade">
      <div 
        v-if="showMobileMask" 
        class="mobile-menu-mask" 
        @click="handleMaskClick"
      ></div>
    </transition>
    
    <!-- 把AppHeader移出el-container，避免层叠上下文问题 -->
    <AppHeader 
      ref="appHeaderRef"
      :headerLoaded="isHeaderLoaded"
      @logout="logout" 
      @update:darkMode="refreshTheme"
      @update:themeColor="refreshTheme"
      @mobile-menu-toggle="handleMobileMenuToggle"
    />
    
    <el-config-provider>
      <el-container class="full-height">
        <el-main>
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component 
                :is="Component" 
                @iframe-modal-change="handleIframeModalChange"
              />
            </transition>
          </router-view>
        </el-main>
        
        <el-footer 
          ref="footerRef" 
          :class="{ 'footer-visible': isFooterVisible && !isIframeModalVisible }"
        >
          <p>Prompt 收集站 © {{ new Date().getFullYear() }}</p>
        </el-footer>
      </el-container>
    </el-config-provider>
    
    <!-- 返回顶部按钮 -->
    <BackToTop />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from './stores/user';
import { useThemeStore } from './stores/theme';
import AppHeader from './components/AppHeader.vue';
import BackToTop from './components/BackToTop.vue';

const userStore = useUserStore();
const themeStore = useThemeStore();
const router = useRouter();

// 直接从themeStore获取isDarkMode
const isDarkMode = computed(() => themeStore.isDarkMode);
const currentThemeColor = computed(() => themeStore.currentThemeColor);

// 添加背景图片加载状态变量
const backgroundLoaded = ref(false);
const backgroundUrl = ref('https://api.wenturc.com');

// Footer懒加载相关状态
const footerRef = ref(null);
const isFooterVisible = ref(false);
const isHeaderLoaded = ref(false); // 改为控制首次加载动画
const appHeaderRef = ref(null); // AppHeader组件的引用
const showMobileMask = ref(false); // 移动端菜单遮罩层状态
const isIframeModalVisible = ref(false); // 新增：iframe模态框显示状态

// 监听主题变化的简化方法
const refreshTheme = () => {
  // 不再设置themeConfig，因为它导致了警告
  console.log("Theme refreshed");
};

// 监听主题变化
watch([currentThemeColor, isDarkMode], () => {
  refreshTheme();
});

// 登出
const logout = () => {
  userStore.logout();
  router.push('/login');
};

// 处理移动菜单状态变化
const handleMobileMenuToggle = (isOpen) => {
  showMobileMask.value = isOpen;
  console.log('移动菜单状态:', isOpen ? '打开' : '关闭');
};

// 处理遮罩层点击
const handleMaskClick = () => {
  // 调用AppHeader组件的关闭菜单方法
  if (appHeaderRef.value && appHeaderRef.value.closeMobileMenu) {
    appHeaderRef.value.closeMobileMenu();
  }
  showMobileMask.value = false;
  console.log('点击遮罩层，关闭移动菜单');
};

// 监听iframe模态框状态变化
const handleIframeModalChange = (visible) => {
  isIframeModalVisible.value = visible;
  if (visible) {
    isFooterVisible.value = false; // 当iframe显示时，隐藏footer
  }
};

// 滚动监听函数
const handleScroll = () => {
  // 如果iframe模态框正在显示，不处理footer显示逻辑
  if (isIframeModalVisible.value) {
    return;
  }

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  
  // 检测是否为移动端
  const isMobile = window.innerWidth <= 768;
  
  // Footer动画：根据设备类型使用不同的检测距离
  let footerTriggerDistance, footerResetDistance;
  
  if (isMobile) {
    // 移动端：使用相对于屏幕高度的比例检测
    const mobileRatio = 0.8; // 滚动到80%时触发
    const contentFromBottom = documentHeight - (scrollTop + windowHeight);
    const triggerPoint = windowHeight * (1 - mobileRatio); // 屏幕高度的20%
    
    footerTriggerDistance = Math.max(triggerPoint, 150); // 最小150px
    footerResetDistance = footerTriggerDistance + 50;    // 重置距离稍大
  } else {
    // 桌面端：使用固定距离
    footerTriggerDistance = 300;
    footerResetDistance = 400;
  }
  
  const isNearBottom = scrollTop + windowHeight >= documentHeight - footerTriggerDistance;
  const isFarFromBottom = scrollTop + windowHeight < documentHeight - footerResetDistance;
  
  if (isNearBottom && !isFooterVisible.value) {
    console.log(`${isMobile ? '移动端' : '桌面端'}接近底部，触发footer动画，触发距离: ${footerTriggerDistance.toFixed(0)}px`);
    isFooterVisible.value = true;
  } else if (isFarFromBottom && isFooterVisible.value) {
    console.log(`${isMobile ? '移动端' : '桌面端'}离开底部，重置footer状态`);
    isFooterVisible.value = false;
  }
};

// 修改为同步初始化用户状态
onMounted(async () => {
  // 立即初始化主题，确保页面刷新时主题状态正确
  console.log('App.vue: 开始初始化主题...');
  themeStore.initTheme();
  refreshTheme();
  console.log('App.vue: 主题初始化完成');

  // 初始化用户状态并等待完成
  console.log('初始化用户状态开始...');
  const success = await userStore.init();
  console.log('初始化用户状态完成:', success ? '成功' : '失败或未登录');
  
  // 替代debugState调用的替代方案
  console.log('当前用户状态:', {
    isLoggedIn: userStore.isLoggedIn,
    username: userStore.username,
    hasToken: Boolean(userStore.token)
  });

  // 优化背景图片加载
  loadBackgroundImage();
  
  // 触发首次header加载动画
  setTimeout(() => {
    console.log('触发header首次加载动画');
    isHeaderLoaded.value = true;
  }, 50); // 进一步缩短延迟为50ms，让动画立即启动
  
  // 设置滚动监听
  window.addEventListener('scroll', handleScroll);
  // 添加resize监听，处理设备方向改变
  window.addEventListener('resize', handleScroll);
  console.log('Footer滚动和resize监听已设置，支持移动端自适应');
  
  // 立即检查一次滚动位置，以防页面加载时就在底部
  setTimeout(() => {
    handleScroll();
    console.log('初始滚动检查完成，footer:', isFooterVisible.value);
  }, 100);
});

onUnmounted(() => {
  // 清理滚动和resize监听
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleScroll);
});

// 加载背景图片并处理过渡效果
const loadBackgroundImage = () => {
  const img = new Image();
  
  img.onload = () => {
    console.log("背景图片加载成功");
    // 图片加载成功，更新URL并标记为已加载
    backgroundUrl.value = img.src;
    // 添加短暂延迟确保DOM更新后再触发动画
    setTimeout(() => {
      backgroundLoaded.value = true;
    }, 50);
  };
  
  img.onerror = () => {
    console.warn("原始背景图片加载失败，使用备用图片");
    // 加载备用图片
    const backupImg = new Image();
    backupImg.src = 'https://source.unsplash.com/random/1920x1080/?nature';
    
    backupImg.onload = () => {
      backgroundUrl.value = backupImg.src;
      // 添加短暂延迟确保DOM更新后再触发动画
      setTimeout(() => {
        backgroundLoaded.value = true;
      }, 50);
    };
    
    backupImg.onerror = () => {
      console.error("备用图片也加载失败，使用纯色背景");
      backgroundLoaded.value = true; // 仍然标记为已加载，显示遮罩层
    };
  };
  
  img.src = backgroundUrl.value;
}
</script>

<style>
/* 导入主题样式 */
@import './assets/theme.css';

/* 强制应用工具提示圆角样式 */
.el-popper,
.el-popper[role="tooltip"],
.el-tooltip__popper,
[role="tooltip"] {
  border-radius: 10px !important;
  overflow: hidden !important;
}

/* 移除影响圆角的箭头 */
.el-popper__arrow {
  display: none !important;
}
</style>

<style scoped>
.app-container {
  min-height: 100vh;
  transition: all 0.3s;
  position: relative; /* 创建层叠上下文，统一管理所有子组件的z-index */
  z-index: 0; /* 建立层叠上下文基准 */
}

/* 背景图样式 - 添加加载动画 */
.app-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 1;
  opacity: 0; /* 初始不可见 */
  transition: opacity 1.2s ease-in-out; /* 添加淡入过渡动画 */
}

/* 图片加载完成后显示 */
.background-loaded {
  opacity: 1;
}

/* 遮罩层样式也添加过渡效果 */
.app-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 2;
  transition: background-color 0.8s ease, opacity 1s ease;
  opacity: 0.9; /* 初始更不透明 */
}

/* 背景加载后调整遮罩透明度 */
.background-loaded ~ .app-overlay {
  opacity: 0.7; /* 背景图加载后调整遮罩透明度 */
}

/* 深色模式下的遮罩样式 */
.dark-mode .app-overlay {
  background-color: rgba(20, 30, 50, 0.8); /* 深色模式下的遮罩 */
}

.full-height {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  z-index: 10; /* 低于遮罩层(15)，让遮罩层遮住内容 */
  background-color: transparent; /* 确保容器本身是透明的 */
}

.el-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-top: 88px; /* 为固定顶栏腾出空间：顶栏68px + 间距20px */
  padding-bottom: 30px; /* 为滑入动画留出一些空间 */
  color: var(--text-color);
  flex-grow: 1;
  width: 100%;
  /* 修改为透明背景，让所有卡片内容自己处理背景 */
  background-color: transparent;
  border-radius: 8px;
  position: relative;
  z-index: 10; /* 低于遮罩层(15)，让遮罩层遮住内容 */
}

/* Footer程序坞样式 */
.el-footer {
  text-align: center;
  color: white;
  padding: 20px 0;
  position: relative;
  flex-shrink: 0;
  margin: 0 auto;
  width: 90%;
  max-width: 1200px;
  background: var(--primary-color);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 20px rgba(0, 0, 0, 0.2);
  margin-top: 16px;
  z-index: 10; /* 低于遮罩层(15)，让遮罩层遮住Footer */
  /* 自下而上的滑入动画 */
  transform: translateY(60px);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), 
              opacity 0.5s ease,
              box-shadow 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 添加footer渐变边框效果 */
.el-footer::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(
    -135deg, 
    var(--primary-color), 
    var(--secondary-color) 50%,
    var(--accent-color, #67c23a)
  );
  border-radius: 22px 22px 0 0; /* 匹配footer的圆角 */
  z-index: -1;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

/* Footer可见时的动画状态 */
.el-footer.footer-visible {
  transform: translateY(0);
  opacity: 1;
  box-shadow: 0 -12px 30px rgba(0, 0, 0, 0.25);
}

/* Footer可见时增强边框 */
.el-footer.footer-visible::before {
  opacity: 0.6;
}

/* Footer悬停效果 */
.el-footer:hover::before {
  opacity: 0.8;
}

/* 添加程序坞发光效果 - 在顶部 */
.el-footer::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 30%;
  right: 30%;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  filter: blur(4px);
  border-radius: 4px;
  opacity: 0.9;
  z-index: 1;
  transition: opacity 0.6s ease 0.2s; /* 延迟一点显示发光效果 */
}

/* 当footer可见时显示发光效果 */
.el-footer.footer-visible::after {
  opacity: 0.5;
}

/* 深色模式下的Footer样式 */
.dark-mode .el-footer {
  background: var(--background-color-dark, #1f2937);
}

/* 深色模式下的footer渐变边框 */
.dark-mode .el-footer::before {
  background: linear-gradient(
    -135deg, 
    var(--secondary-color), 
    var(--primary-color) 50%,
    var(--accent-color, #67c23a)
  );
  opacity: 0.5;
}

.dark-mode .el-footer.footer-visible {
  box-shadow: 0 -12px 35px rgba(0, 0, 0, 0.4);
}

.dark-mode .el-footer.footer-visible::before {
  opacity: 0.7;
}

.dark-mode .el-footer:hover::before {
  opacity: 0.9;
}

/* 深色模式下的发光效果 */
.dark-mode .el-footer::after {
  background: rgba(255, 255, 255, 0.4);
}

/* 移动端响应式Footer */
@media (max-width: 768px) {
  .el-footer {
    width: 94%;
    border-radius: 16px 16px 0 0;
    /* 移动端自下而上滑入动画 */
    transform: translateY(50px);
    opacity: 0;
  }
  
  .el-footer.footer-visible {
    transform: translateY(0);
    opacity: 1;
    /* 移动端适中的阴影效果 */
    box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.2);
  }
  
  /* 移动设备下的发光效果 */
  .el-footer::after {
    left: 35%;
    right: 35%;
    height: 3px;
  }
  
  /* 深色模式移动端阴影 */
  .dark-mode .el-footer.footer-visible {
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.35);
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 在深色模式下的特定样式 */
.dark-mode .el-header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 在theme.css中添加RGB变量，这里作为备份 */
:root {
  --background-color-rgb: 255, 255, 255;
  --background-color-light-rgb: 245, 245, 245;
}

.dark-mode {
  --background-color-rgb: 30, 41, 59;
  --background-color-light-rgb: 36, 48, 69;
}

/* 移动端响应式调整内容padding */
@media (max-width: 768px) {
  .el-main {
    padding-top: 100px; /* 移动端顶栏80px + 间距20px */
    padding-bottom: 24px; /* 恢复正常的底部间距 */
    padding-left: 16px;
    padding-right: 16px;
  }
}

@media (max-width: 480px) {
  .el-main {
    padding-top: 100px; /* 小屏幕顶栏80px + 间距20px */
    padding-bottom: 20px; /* 恢复正常的底部间距 */
    padding-left: 12px;
    padding-right: 12px;
  }
}

/* 移动端遮罩层 */
.mobile-menu-mask {
  position: fixed;
  top: 0; /* 从页面顶部开始，覆盖整个屏幕 */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 11; /* 刚好高于内容层(10)，低于顶栏(10000)和移动菜单(10001) */
  backdrop-filter: blur(2px);
  cursor: pointer;
}

/* 遮罩层动画 */
.mask-fade-enter-active,
.mask-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* 深色模式下的遮罩层 */
.dark-mode .mobile-menu-mask {
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
}

/* 移动端遮罩层响应式调整 */
@media (max-width: 768px) {
  .mobile-menu-mask {
    top: 0; /* 移动端也从页面顶部开始 */
  }
}

@media (max-width: 480px) {
  .mobile-menu-mask {
    top: 0; /* 小屏幕也从页面顶部开始 */
  }
}
</style>
