<template>
  <el-header class="app-header" :class="{'shadow-header': isScrolled, 'header-visible': isHeaderLoaded}" ref="appHeaderRef">
    <div class="header-content">        
      <router-link to="/" class="logo-link">
        <h1 class="logo"><img src="/img/logo.png" alt="WentUrc" class="logo-icon" draggable="false" /> WentUrc Prompt</h1>
      </router-link>
        <div class="nav-links">
        <router-link to="/">首 页</router-link>
        <router-link to="/prompts">浏 览</router-link>
        <router-link v-if="isLoggedIn" to="/create">创 建</router-link>
        <router-link v-if="isLoggedIn && userStore.isAdmin" to="/admin" class="admin-link">
          <el-icon><Setting /></el-icon>
          <span>管理</span>
        </router-link>
        <router-link v-if="!isLoggedIn" to="/login">登录</router-link>
        <router-link v-if="!isLoggedIn" to="/register" class="register-link">注册</router-link>
        <a v-if="isLoggedIn" href="#" @click.prevent="onLogout" class="logout-link">
          <el-icon><SwitchButton /></el-icon>
          <span>退出</span>
        </a>
        
        <!-- 主题设置下拉菜单 - 使用完全自定义的过渡效果 -->
        <div class="theme-dropdown" ref="themeDropdownRef">
          <div 
            class="theme-trigger" 
            :class="{'active': isDropdownOpen}" 
            @click="toggleThemeMenu"
          >
            <div class="color-dot" :style="{ backgroundColor: themeColors[currentThemeColor].primary }"></div>
            <el-icon class="dropdown-icon" :class="{'is-rotate': isDropdownOpen}"><ArrowDown /></el-icon>
          </div>
          
          <!-- 使用显式的Vue过渡组件 -->
          <transition name="pure-fade">
            <div v-if="isDropdownOpen" class="custom-dropdown-menu">
              <div class="theme-menu-header">
                <span>外观设置</span>
              </div>
              
              <!-- 明暗模式切换 -->
              <div class="theme-menu-section">
                <span>模式</span>
                <div class="mode-options">
                  <div 
                    class="mode-option" 
                    :class="{ active: !isDarkMode }"
                    @click="setDarkMode(false)"
                  >
                    <el-icon><Sunny /></el-icon>
                    <span>浅色</span>
                  </div>
                  <div 
                    class="mode-option" 
                    :class="{ active: isDarkMode }"
                    @click="setDarkMode(true)"
                  >
                    <el-icon><Moon /></el-icon>
                    <span>深色</span>
                  </div>
                </div>
              </div>
              
              <!-- 主题色选择 -->
              <div class="theme-menu-section">
                <span>颜色</span>
                <div class="color-options">
                  <div 
                    v-for="(color, name) in themeColors" 
                    :key="name"
                    class="color-option"
                    :class="{ active: currentThemeColor === name }"
                    :style="{ backgroundColor: color.primary }"
                    @click="setThemeColor(name)"
                    :title="color.name"
                  >
                    <el-icon v-if="currentThemeColor === name"><Check /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
      
      <!-- 移动端菜单按钮 -->
      <el-button
        class="mobile-menu-btn"
        @click="toggleMobileMenu"
        :class="{'active-menu': showMobileMenu}"
        circle
      >
        <span class="hamburger-icon">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </span>
      </el-button>
    </div>
      <!-- 移动端下拉菜单 -->
    <transition name="slide-fade">
      <div class="mobile-menu" v-if="showMobileMenu" @click.stop>
        <router-link to="/" @click="closeMobileMenu">首页</router-link>
        <router-link to="/prompts" @click="closeMobileMenu">浏览</router-link>
        <router-link v-if="isLoggedIn" to="/create" @click="closeMobileMenu">创建</router-link>
        <router-link v-if="isLoggedIn && userStore.isAdmin" to="/admin" @click="closeMobileMenu" class="admin-mobile-link">
          <el-icon><Setting /></el-icon>
          <span>管理员面板</span>
        </router-link>
        <router-link v-if="!isLoggedIn" to="/login" @click="closeMobileMenu">登录</router-link>
        <router-link v-if="!isLoggedIn" to="/register" @click="closeMobileMenu">注册</router-link>
        <a v-if="isLoggedIn" href="#" @click.prevent="handleMobileLogout">退出登录</a>
        
        <!-- 移动端主题设置 -->
        <div class="mobile-theme-settings">
          <div class="mobile-theme-header">
            <span>外观设置</span>
          </div>
          
          <!-- 移动端明暗模式选择 -->
          <div class="mobile-theme-section">
            <span>模式</span>
            <div class="mobile-mode-options">
              <div 
                class="mobile-mode-option" 
                :class="{ active: !isDarkMode }"
                @click="setDarkMode(false)"
              >
                <el-icon><Sunny /></el-icon>
                <span>浅色</span>
              </div>
              <div 
                class="mobile-mode-option" 
                :class="{ active: isDarkMode }"
                @click="setDarkMode(true)"
              >
                <el-icon><Moon /></el-icon>
                <span>深色</span>
              </div>
            </div>
          </div>
          
          <!-- 移动端主题色选择 -->
          <div class="mobile-theme-section">
            <span>颜色</span>
            <div class="mobile-color-options">
              <div 
                v-for="(color, name) in themeColors" 
                :key="name"
                class="mobile-color-option"
                :class="{ active: currentThemeColor === name }"
                :style="{ backgroundColor: color.primary }"
                @click="setThemeColor(name)"
              >
                <el-icon class="check-icon" v-if="currentThemeColor === name"><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </el-header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, readonly } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useThemeStore } from '../stores/theme';
import { Menu, Close, Moon, Sunny, ArrowDown, Check, SwitchButton, Setting } from '@element-plus/icons-vue';

const emit = defineEmits(['logout', 'update:darkMode', 'update:themeColor', 'mobile-menu-toggle']);

const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();

// 移动菜单状态
const showMobileMenu = ref(false);

// 新增: 跟踪滚动状态和下拉菜单状态
const isScrolled = ref(false);
const isDropdownOpen = ref(false);
const isHeaderLoaded = ref(false); // 改为首次加载动画状态
const themeDropdownRef = ref(null); // 添加主题下拉菜单的ref
const appHeaderRef = ref(null); // 添加顶栏的ref

// 添加header动画的props接收
const props = defineProps({
  headerLoaded: {
    type: Boolean,
    default: false
  }
});

// 监听props变化
watch(() => props.headerLoaded, (newVal) => {
  isHeaderLoaded.value = newVal;
});

const isLoggedIn = computed(() => userStore.isLoggedIn);
const currentThemeColor = computed(() => themeStore.currentThemeColor);
const themeColors = themeStore.themeColors;

// 使用计算属性直接访问themeStore的isDarkMode
const isDarkMode = computed(() => themeStore.isDarkMode);

// 设置明暗模式
const setDarkMode = (isDark) => {
  if ((isDark && !themeStore.isDarkMode) || (!isDark && themeStore.isDarkMode)) {
    themeStore.toggleDarkMode();
    // 仍然emit事件，保持父组件同步
    emit('update:darkMode', themeStore.isDarkMode);
  }
};

// 设置主题色
const setThemeColor = (colorName) => {
  emit('update:themeColor', colorName);
  themeStore.setThemeColor(colorName);
};

// 移动菜单操作
let savedScrollTop = 0; // 保存滚动位置

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
  
  // 通知父组件移动菜单状态变化
  emit('mobile-menu-toggle', showMobileMenu.value);
  
  // 控制背景滚动
  if (showMobileMenu.value) {
    // 菜单打开时禁用背景滚动并保存当前滚动位置
    savedScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollTop}px`;
    document.body.style.width = '100%';
  } else {
    // 菜单关闭时恢复背景滚动和滚动位置
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    // 恢复滚动位置
    window.scrollTo(0, savedScrollTop);
  }
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
  
  // 通知父组件移动菜单状态变化
  emit('mobile-menu-toggle', false);
  
  // 恢复背景滚动和滚动位置
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  // 恢复滚动位置
  window.scrollTo(0, savedScrollTop);
};

const handleMobileLogout = () => {
  closeMobileMenu();
  onLogout();
};

const onLogout = () => {
  emit('logout');
};

// 监听窗口滚动，为顶栏添加阴影效果
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10;
};

// 添加缺失的handleResize函数
const handleResize = () => {
  if (window.innerWidth > 768 && showMobileMenu.value) {
    showMobileMenu.value = false;
    // 当从移动端切换到桌面端时，恢复背景滚动和滚动位置
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    // 恢复滚动位置
    window.scrollTo(0, savedScrollTop);
  }
};

// 监听主题切换，处理下拉菜单样式
const updateDropdownTheme = () => {
  setTimeout(() => {
    const dropdown = document.querySelector('.el-popper.el-dropdown__popper');
    if (dropdown) {
      if (themeStore.isDarkMode) {
        dropdown.classList.add('dark-theme-dropdown');
      } else {
        dropdown.classList.remove('dark-theme-dropdown');
      }
    }
  }, 0);
};

// 修改dropdown切换处理
const toggleThemeMenu = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

// 点击外部区域关闭主题菜单
const handleClickOutside = (event) => {
  if (isDropdownOpen.value && themeDropdownRef.value) {
    if (!themeDropdownRef.value.contains(event.target)) {
      isDropdownOpen.value = false;
      console.log('点击外部区域，关闭主题菜单');
    }
  }
};

// 监听主题变化，同时更新下拉菜单和移动菜单的样式
const stopWatch = watch(() => themeStore.isDarkMode, () => {
  updateDropdownTheme();
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // 初始检查
  
  // 初始应用主题到下拉菜单
  updateDropdownTheme();
  
  // 添加全局点击监听，处理点击外部关闭菜单
  document.addEventListener('click', handleClickOutside);
  
  // 增加全局监听，确保任何时候下拉菜单出现时都应用正确的主题
  document.addEventListener('click', () => {
    updateDropdownTheme();
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll);
  stopWatch();
  document.removeEventListener('click', updateDropdownTheme);
  document.removeEventListener('click', handleClickOutside);
  
  // 组件卸载时确保恢复背景滚动和滚动位置
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  // 如果有保存的滚动位置，恢复它
  if (savedScrollTop > 0) {
    window.scrollTo(0, savedScrollTop);
  }
});

// 导出方法供父组件调用
defineExpose({
  closeMobileMenu
});
</script>

<style scoped>
/* 导入Showcard Gothic字体 */
@font-face {
  font-family: 'Showcard Gothic';
  src: url('/font/Showcard-Gothic.woff2') format('woff2'),
       url('/font/Showcard-Gothic.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.app-header {
  /* 程序坞样式改进 */
  background: var(--primary-color);
  color: white;
  line-height: normal;
  padding: 0;
  height: 70px !important; /* 临时设置很大的高度来测试 */
  min-height: 70px !important; /* 同时设置最小高度 */
  max-height: 70px !important; /* 同时设置最大高度 */
  display: flex;
  align-items: center;
  position: fixed; /* 固定位置，始终在页面顶部 */
  top: 0; /* 贴在页面顶部 */
  left: 50%;
  transform: translateX(-50%) translateY(-60px); /* 桌面端与footer保持一致的滑入距离 */
  width: 90%;
  max-width: 1200px;
  z-index: 10000!important; /* 确保高于遮罩层(9999) */
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), 
              opacity 0.5s ease,
              box-shadow 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 0 0 20px 20px; /* 只保留下方圆角 */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  margin-bottom: 16px; /* 底部间距 */
  opacity: 0; /* 初始透明 */
}

/* 添加渐变边框效果 */
.app-header::before {
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
  border-radius: 0 0 22px 22px; /* 匹配顶栏的圆角 */
  z-index: -1;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

/* Header加载完成时的状态 */
.app-header.header-visible {
  transform: translateX(-50%) translateY(0); /* 滑入到正常位置 */
  opacity: 1;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); /* 正常阴影 */
}

/* Header加载完成时增强边框 */
.app-header.header-visible::before {
  opacity: 0.6;
}

/* 顶栏悬停效果 */
.app-header:hover::before {
  opacity: 0.8;
}

/* 添加程序坞发光效果 */
.app-header::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 30%;
  right: 30%;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  filter: blur(4px);
  border-radius: 4px;
  opacity: 0; /* 初始透明 */
  z-index: 1;
  transition: opacity 0.6s ease 0.2s; /* 延迟显示发光效果 */
}

/* Header加载完成时显示发光效果 */
.app-header.header-visible::after {
  opacity: 0.7;
}

/* 修改阴影效果动画 */
.shadow-header {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
}

/* 深色模式下的顶栏样式 */
.dark-mode .app-header {
  background: var(--background-color-dark, #1f2937);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
}

/* 深色模式下的渐变边框 */
.dark-mode .app-header::before {
  background: linear-gradient(
    135deg, 
    var(--secondary-color), 
    var(--primary-color) 50%,
    var(--accent-color, #67c23a)
  );
  opacity: 0.5;
}

.dark-mode .app-header.header-visible::before {
  opacity: 0.7;
}

.dark-mode .app-header:hover::before {
  opacity: 0.9;
}

/* 深色模式下的发光效果 */
.dark-mode .app-header::after {
  background: rgba(255, 255, 255, 0.4);
  opacity: 0; /* 初始透明 */
}

.dark-mode .app-header.header-visible::after {
  opacity: 0.5;
}

/* 深色模式下的阴影效果 */
.dark-mode .shadow-header {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

/* 优化性能：仅对变换属性应用硬件加速 */
.app-header {
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* 移动设备响应式设计 */
@media (max-width: 768px) {
  .app-header {
    top: 0;
    width: 94%;
    height: 80px !important; /* 修正移动端高度为80px */
    min-height: 80px !important;
    max-height: 80px !important;
    border-radius: 0 0 16px 16px;
    transform: translateX(-50%) translateY(-50px); /* 移动端与footer保持一致的滑入距离 */
  }
  
  /* 移动端边框圆角调整 */
  .app-header::before {
    border-radius: 0 0 18px 18px; /* 匹配移动端圆角 */
  }
  
  .app-header.header-visible {
    transform: translateX(-50%) translateY(0); /* 移动端滑入 */
  }
  
  .app-header .header-content {
    padding: 8px 22px !important; /* 增加上下padding到8px */
    margin: 0 auto !important;
    max-width: 1200px !important;
  }
  
  /* 修改移动设备下的发光效果 */
  .app-header::after {
    left: 35%;
    right: 35%;
    height: 3px;
  }
}

/* 小屏幕适配 */
@media (max-width: 480px) {
  .header-content {
    padding: 0 16px;
  }
  
  .logo {
    font-size: 1.1rem;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 4px 24px; /* 桌面端增加上下padding */
  height: 100%;
  width: 100%;
}

/* 确保移动端padding样式生效 */
@media (max-width: 768px) {
  .header-content {
    padding: 8px 22px !important; /* 增加上下padding到8px */
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0 16px;
  }
  
  .logo {
    font-size: 1.1rem;
  }
}

.logo-link {
  text-decoration: none;
  color: white;
  display: flex;
  align-items: center;
  /* 禁用拖拽 */
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  /* 应用字体 */
  font-family: 'Showcard Gothic', sans-serif;
}

.logo {
  margin: 0;
  font-weight: 600;
  font-size: 1.4rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  /* 继承父元素的字体 */
  font-family: inherit;
}

.logo-icon {
  margin-right: 10px;
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 8px;
  position: relative;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
}

.logo-icon::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(
    45deg, 
    var(--primary-color), 
    var(--secondary-color) 50%,
    var(--accent-color, #67c23a) 100%
  );
  border-radius: 10px;
  z-index: -1;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.logo:hover .logo-icon::before {
  opacity: 0.8;
}

.logo:hover {
  transform: scale(1.03);
}

.nav-links {
  display: flex;
  align-items: center;
  height: 100%;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.9);
  margin-left: 20px;
  text-decoration: none;
  position: relative;
  font-weight: 500;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 8px;
  transition: all 0.2s ease;
}

.nav-links a:hover {
  color: white;
  transform: translateY(0px); /* 微妙的上浮效果，类似程序坞 */
}

.nav-links a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 7px;
  width: 0;
  height: 4px;
  background: white;
  opacity: 0.8;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-origin: left;
}

.nav-links a:hover::after,
.nav-links a.router-link-active::after {
  width: 100%;
}

.register-link, .logout-link, .admin-link {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 6px 14px !important;
  margin-left: 20px;
  height: auto !important;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  /* 完全禁用下划线伪元素 */
  position: relative;
}

.register-link:hover, .logout-link:hover, .admin-link:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 加强特异性，彻底禁用这些按钮的下划线效果 */
.nav-links .register-link::after, 
.nav-links .logout-link::after,
.nav-links .admin-link::after {
  display: none !important; /* 完全不显示伪元素 */
}

/* 保留原来的规则，双重保证 */
.register-link:hover:after, .register-link.router-link-active:after,
.logout-link:hover:after, .logout-link.router-link-active:after,
.admin-link:hover:after, .admin-link.router-link-active:after {
  width: 0 !important; /* 强制覆盖普通链接hover时的下划线宽度 */
}

.logout-link, .admin-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 主题下拉菜单样式 */
.theme-dropdown {
  margin-left: 24px;
  position: relative;
}

.theme-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.theme-trigger:hover, .theme-trigger.active {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dropdown-icon {
  margin-left: 6px;
  font-size: 12px;
  color: white;
  transition: transform 0.3s;
}

.dropdown-icon.is-rotate {
  transform: rotate(180deg);
}

/* 自定义下拉菜单样式和动画 */
.pure-fade-enter-active,
.pure-fade-leave-active {
  transition: opacity 0.25s ease;
}

.pure-fade-enter-from,
.pure-fade-leave-to {
  opacity: 0;
}

.custom-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  width: 280px;
  padding: 16px;
  background-color: var(--background-color, #ffffff);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color, #dcdfe6);
  z-index: 100;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.mobile-menu-btn:hover, .mobile-menu-btn.active-menu {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 18px;
  height: 14px;
}

.hamburger-line {
  display: block;
  width: 100%;
  height: 2px;
  background-color: white;
  border-radius: 2px;
  transition: all 0.3s;
}

.active-menu .hamburger-line:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.active-menu .hamburger-line:nth-child(2) {
  opacity: 0;
}

.active-menu .hamburger-line:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* 移动端菜单 */
.mobile-menu {
  position: fixed;
  top: 80px; /* 桌面端顶栏高度70px + 10px间隙 */
  left: 50%;
  width: 90%;
  max-width: 1200px;
  min-height: fit-content;
  max-height: calc(100vh - 140px);
  height: auto;
  background-color: white;
  border-radius: 16px;
  padding: 8px 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  z-index: 10001; /* 确保高于遮罩层(9999)和顶栏(10000) */
  overflow-y: auto;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform: translateX(-50%);
}

.mobile-menu a {
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 14px 24px;
  border-left: 3px solid transparent;
  color: #333;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.2s ease;
  text-shadow: none;
}

/* 管理员移动端链接特殊样式 */
.mobile-menu .admin-mobile-link {
  gap: 8px;
  color: #f56c6c;
  font-weight: 600;
}

.mobile-menu .admin-mobile-link .el-icon {
  font-size: 16px;
  color: #f56c6c;
}

.mobile-menu a:hover, .mobile-menu a.router-link-active {
  background-color: rgba(0, 0, 0, 0.08);
  border-left-color: var(--primary-color);
  color: var(--primary-color);
  text-shadow: none;
}

.mobile-menu a:hover {
  background-color: var(--primary-color);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 管理员移动端链接hover效果 */
.mobile-menu .admin-mobile-link:hover {
  background-color: #f56c6c;
  border-left-color: #f56c6c;
  color: white;
}

.mobile-menu .admin-mobile-link:hover .el-icon {
  color: white;
}

/* 移动端主题设置 */
.mobile-theme-settings {
  padding: 15px 20px;
  background-color: rgba(0, 0, 0, 0.05);
  margin: 10px 0;
  border-radius: 8px;
}

.mobile-theme-header {
  color: #333;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 16px;
}

.mobile-theme-section {
  margin-bottom: 20px;
}

.mobile-theme-section > span {
  display: block;
  color: #666;
  margin-bottom: 12px;
  font-weight: 500;
}

/* 移动端模式选择 */
.mobile-mode-options {
  display: flex;
  gap: 12px;
  margin-bottom: 5px;
}

.mobile-mode-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.mobile-mode-option:hover {
  background-color: rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.mobile-mode-option.active {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(var(--primary-color-rgb, 64, 158, 255), 0.3);
}

.mobile-mode-option i {
  font-size: 20px;
  margin-bottom: 8px;
  color: var(--primary-color);
}

.mobile-mode-option.active i {
  color: white;
}

.mobile-mode-option span {
  color: #333;
  font-size: 14px;
}

.mobile-mode-option.active span {
  color: white;
}

/* 移动端颜色选择 */
.mobile-color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mobile-color-option {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.mobile-color-option:active {
  transform: scale(0.95);
}

.mobile-color-option.active {
  border-color: white;
  box-shadow: 0 0 0 3px var(--primary-color), 0 2px 8px rgba(0, 0, 0, 0.2);
}

.check-icon {
  color: white;
  font-size: 18px;
}

/* 深色模式下的移动菜单 */
.dark-mode .mobile-menu {
  background-color: var(--background-color-dark, #1f2937);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-color-dark, #4b5563);
}

.dark-mode .mobile-menu a {
  color: var(--text-color-dark, #e5e7eb);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.dark-mode .mobile-menu a:hover, 
.dark-mode .mobile-menu a.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-left-color: var(--primary-color);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

/* 深色模式下的管理员移动端链接 */
.dark-mode .mobile-menu .admin-mobile-link {
  color: #fca5a5;
}

.dark-mode .mobile-menu .admin-mobile-link .el-icon {
  color: #fca5a5;
}

.dark-mode .mobile-menu .admin-mobile-link:hover {
  background-color: #f56c6c;
  border-left-color: #f56c6c;
  color: white;
}

.dark-mode .mobile-menu .admin-mobile-link:hover .el-icon {
  color: white;
}

.dark-mode .mobile-theme-settings {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-mode .mobile-theme-header {
  color: var(--text-color-dark, #e5e7eb);
  border-bottom-color: rgba(255, 255, 255, 0.2);
}

.dark-mode .mobile-theme-section > span {
  color: var(--text-color-secondary-dark, #9ca3af);
}

.dark-mode .mobile-mode-option {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.dark-mode .mobile-mode-option:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.dark-mode .mobile-mode-option.active {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(var(--primary-color-rgb, 64, 158, 255), 0.3);
}

.dark-mode .mobile-mode-option span {
  color: var(--text-color-dark, #e5e7eb);
}

.dark-mode .mobile-mode-option i {
  color: var(--primary-color);
}

.dark-mode .mobile-mode-option.active i {
  color: white;
}

.dark-mode .mobile-mode-option.active span {
  color: white;
}

.dark-mode .mobile-color-option {
  border-color: rgba(255, 255, 255, 0.2);
}

.dark-mode .mobile-color-option.active {
  border-color: var(--background-color-dark, #1f2937);
  box-shadow: 0 0 0 3px var(--primary-color), 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .mobile-menu {
    top: 90px; /* 移动端顶栏高度80px + 10px间隙 */
    width: 94%;
    max-height: calc(100vh - 120px);
  }
}

@media (max-width: 480px) {
  .mobile-menu {
    top: 90px; /* 小屏幕顶栏高度80px + 10px间隙 */
    max-height: calc(100vh - 100px);
  }
}

/* 移动端菜单动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-50%) translateY(-10px);
  opacity: 0;
}

/* 响应式设计 - 移动端适配 */
@media (max-width: 768px) {
  .app-header {
    height: 80px !important;
  }
  
  .nav-links a:not(.theme-dropdown),
  .theme-dropdown {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .logo {
    font-size: 1.2rem;
  }
  
  .logo-icon {
    font-size: 1.1em;
  }
}

@media (min-width: 769px) {
  .mobile-menu {
    display: none !important;
  }
}

/* 动画效果 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* 在深色模式下的特定样式 - 需添加到App.vue或theme.css */
:root {
  --primary-color-rgb: 64, 158, 255;
}

.dark-mode .app-header {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

/* 全局样式 - 修复 Element Plus 下拉菜单的深色模式样式 */
.dark-theme-dropdown {
  --el-bg-color: #1f2937 !important;
  --el-fill-color-blank: #1f2937 !important;
  --el-border-color: #4b5563 !important;
  --el-text-color-primary: #e5e7eb !important;
  --el-text-color-regular: #d1d5db !important;
  background-color: #1f2937 !important;
  border-color: #4b5563 !important;
  color: #e5e7eb !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
  border-radius: 16px !important; /* 确保深色模式也应用圆角 */
}

/* 添加深色模式下的dropdown样式 */
:deep(.theme-dropdown-menu) {
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
}

/* 深色模式下的样式 */
:deep(.dark-mode) .theme-menu-header {
  color: var(--text-color-dark, #e5e7eb);
  border-bottom-color: var(--border-color-dark, #4b5563);
}

:deep(.dark-mode) .theme-menu-section > span {
  color: var(--text-color-secondary-dark, #9ca3af);
}

:deep(.dark-mode) .mode-option {
  background-color: var(--background-color-dark, #1f2937);
  border-color: var(--border-color-dark, #4b5563);
}

:deep(.dark-mode) .mode-option.active {
  background-color: #374151;
}

/* 直接覆盖 Element Plus 的弹出菜单样式 */
:global(.el-popper.is-dark) {
  background-color: var(--background-color-dark, #1f2937) !important;
  border-color: var(--border-color-dark, #4b5563) !important;
}

:global(.dark-mode .el-dropdown__popper) {
  --el-dropdown-menuItem-hover-fill: #374151 !important;
  --el-dropdown-menuItem-hover-color: #ffffff !important;
}

/* 修复模式选项卡在深色模式下的样式 */
.dark-mode .mode-option {
  background-color: #1f2937;
  border-color: #4b5563;
  color: #e5e7eb;
}

.dark-mode .mode-option:hover {
  background-color: #374151;
}

.dark-mode .mode-option.active {
  background-color: #374151;
  border-color: var(--primary-color);
}

.dark-mode .mode-option i {
  color: var(--primary-color);
}

.dark-mode .theme-menu-header {
  border-bottom-color: #4b5563;
  color: #e7e9eb;
}

/* 添加CSS变量以确保有正确的深色模式变量 */
:root {
  --background-color-dark: #1f2937;
  --text-color-dark: #e7e9eb;
  --text-color-secondary-dark: #9ca3af;
  --border-color-dark: #4b5563;
}

/* 添加全局淡入淡出动画 */
:global(.fade-dropdown) {
  transition: opacity 0.25s cubic-bezier(0.3, 1, 0.5, 1) !important;
  border-radius: 16px !important;
  /* 不要设置transform */
}

:global(.fade-dropdown.el-popper--hidden) {
  opacity: 0 !important;
}

:global(.fade-dropdown:not(.el-popper--hidden)) {
  opacity: 1 !important;
}

/* 深色主题适配 */
.dark-mode .custom-dropdown-menu {
  background-color: var(--background-color-dark, #1f2937);
  border-color: var(--border-color-dark, #4b5563);
  color: var(--text-color-dark, #e5e7eb);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* 主题下拉菜单样式改进 - 增强圆角效果 */
.theme-dropdown-menu {
  padding: 16px;
  min-width: 260px;
  border-radius: 16px !important; /* 增大圆角 */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden; /* 确保内容不超出圆角 */
}

/* 修改Element Plus的全局下拉菜单组件样式 */
:deep(.el-dropdown-menu) {
  border-radius: 16px !important; /* 强制应用圆角 */
  overflow: hidden;
}

:deep(.el-dropdown__popper),
:deep(.el-popper.el-dropdown__popper) {
  border-radius: 16px !important;
  overflow: hidden;
}

/* 移除下拉菜单的箭头，保持圆角美观 */
:deep(.el-popper__arrow) {
  display: none !important;
}

/* 深色主题下拉菜单增强 */
.dark-theme-dropdown {
  --el-bg-color: #1f2937 !important;
  --el-fill-color-blank: #1f2937 !important;
  --el-border-color: #4b5563 !important;
  --el-text-color-primary: #e5e7eb !important;
  --el-text-color-regular: #d1d5db !important;
  background-color: #1f2937 !important;
  border-color: #4b5563 !important;
  color: #e5e7eb !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
  border-radius: 16px !important; /* 确保深色模式也应用圆角 */
}

.theme-menu-header {
  font-weight: bold;
  padding: 0 0 10px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-color-light);
  color: var(--text-color);
  font-size: 16px;
}

.theme-menu-section {
  margin-bottom: 20px;
}

.theme-menu-section > span {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-secondary);
  margin-bottom: 10px;
}

/* 模式选择样式 */
.mode-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.mode-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid var(--border-color);
  background-color: var(--background-color);
}

/* 修复模式选项文字颜色问题 */
.mode-option span {
  color: var(--text-color, #333) !important; /* 明确设置颜色并提高优先级 */
  font-weight: 500;
  transition: color 0.3s ease;
}

/* 明确处理深色模式下的文字颜色 */
.dark-mode .mode-option span {
  color: var(--text-color-dark, #e5e7eb) !important;
}

/* 使用不同选择器确保样式应用 */
:global(html.dark-mode) .mode-option span {
  color: var(--text-color-dark, #e5e7eb) !important;
}

/* 确保所有文字在深色模式下可见 */
:deep(.dark-mode) .theme-menu-header,
:deep(.dark-mode) .theme-menu-section > span,
:deep(.dark-mode) .mode-option span {
  color: var(--text-color-dark, #e5e7eb) !important;
}

.mode-option:hover {
  background-color: var(--accent-color);
  transform: translateY(-2px);
}

.mode-option.active {
  border-color: var(--primary-color);
  background-color: var(--accent-color);
  box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.2);
}

.mode-option i {
  font-size: 24px;
  margin-bottom: 10px;
  color: var(--primary-color);
}

/* 颜色选择样式 */
.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: space-between;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.3s;
  border: 2px solid transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.color-option:hover {
  transform: scale(1.15) translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-option.active {
  border-color: var(--border-color);
  box-shadow: 0 0 0 2px white, 0 4px 10px rgba(0, 0, 0, 0.2);
}

.color-option i {
  color: white;
  font-size: 18px;
}

/* 移动端菜单遮罩层 */
.mobile-menu-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99; /* 在菜单下方，但在其他内容上方 */
  backdrop-filter: blur(2px);
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
</style>
