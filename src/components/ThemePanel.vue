<template>
  <div class="theme-panel">
    <!-- 触发按钮 -->
    <el-button 
      circle 
      class="theme-button" 
      size="small" 
      @click="isPanelVisible = !isPanelVisible"
    >
      <el-icon><Brush /></el-icon>
    </el-button>
    
    <!-- 使用动画更强的transition -->
    <transition 
      name="fade-panel"
      @before-enter="onBeforeEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @after-leave="onAfterLeave"
    >
      <!-- 完全自定义面板 -->
      <div v-show="isPanelVisible" class="theme-panel-popup" ref="panelRef">
        <div class="panel-content">
          <h4>主题设置</h4>
          
          <!-- 明暗模式切换 - 添加模式选项 -->
          <div class="setting-item">
            <span class="label">模式</span>
            <div class="mode-options">
              <div 
                class="mode-option" 
                :class="{ active: !isDarkMode }"
                @click="toggleDarkMode(false)"
              >
                <el-icon><Sunny /></el-icon>
                <span>浅色</span>
              </div>
              <div 
                class="mode-option" 
                :class="{ active: isDarkMode }"
                @click="toggleDarkMode(true)"
              >
                <el-icon><Moon /></el-icon>
                <span>深色</span>
              </div>
            </div>
          </div>
          
          <!-- 主题色选择 -->
          <div class="setting-item">
            <span class="label">主题颜色</span>
            <div class="color-grid">
              <div 
                v-for="(color, name) in themeColors" 
                :key="name"
                class="color-dot"
                :class="{ active: currentThemeColor === name }"
                :style="{ backgroundColor: color.primary }"
                @click="setThemeColor(name)"
              >
                <el-icon v-if="currentThemeColor === name"><Check /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 点击外部关闭面板 -->
    <div v-if="isPanelVisible" class="backdrop" @click="isPanelVisible = false"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useThemeStore } from '../stores/theme';
import { Brush, Check, Sunny, Moon } from '@element-plus/icons-vue';

const themeStore = useThemeStore();
const isPanelVisible = ref(false);
const panelRef = ref(null);

// 计算属性
const isDarkMode = computed(() => themeStore.isDarkMode);
const currentThemeColor = computed(() => themeStore.currentThemeColor);
const themeColors = themeStore.themeColors;

// 切换深色模式
const toggleDarkMode = (forceDark) => {
  if (typeof forceDark === 'boolean') {
    if ((forceDark && !isDarkMode.value) || (!forceDark && isDarkMode.value)) {
      themeStore.toggleDarkMode();
    }
  } else {
    themeStore.toggleDarkMode();
  }
};

// 设置主题颜色
const setThemeColor = (colorName) => {
  themeStore.setThemeColor(colorName);
};

// 动画钩子函数 - 确保动画能正确触发
const onBeforeEnter = (el) => {
  el.style.opacity = 0;
};

const onAfterEnter = (el) => {
  el.style.opacity = 1;
};

const onBeforeLeave = (el) => {
  el.style.opacity = 1;
};

const onAfterLeave = (el) => {
  el.style.opacity = 0;
};

// 关闭面板的ESC键处理
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isPanelVisible.value) {
    isPanelVisible.value = false;
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  themeStore.initTheme();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.theme-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
}

.theme-button {
  background-color: var(--primary-color);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  position: relative;
  z-index: 10000;
}

.theme-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* 面板样式 */
.theme-panel-popup {
  position: absolute;
  right: 0;
  bottom: 50px; 
  width: 280px;
  background-color: var(--background-color, #ffffff);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color, #dcdfe6);
  z-index: 9999;
  will-change: opacity;
}

/* 确保动画流畅 */
.fade-panel-enter-active,
.fade-panel-leave-active {
  transition: opacity 0.3s ease !important;
  will-change: opacity;
}

.fade-panel-enter-from,
.fade-panel-leave-to {
  opacity: 0 !important;
}

/* 面板内容样式 */
.panel-content {
  padding: 16px;
  color: var(--text-color, #333); /* 确保文本颜色使用变量 */
}

.panel-content h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color, #333);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color-light, #e2e8f0);
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item .label {
  display: block;
  font-size: 14px;
  color: var(--text-color-secondary, #666);
  margin-bottom: 8px;
}

/* 颜色选择网格 */
.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.color-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  border: 2px solid transparent;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.color-dot:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.color-dot.active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--primary-color);
}

.color-dot :deep(svg) {
  color: white;
  font-size: 14px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* 点击遮罩层 */
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
}

/* 新增: 模式选择样式 */
.mode-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.mode-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid var(--border-color, #dcdfe6);
  background-color: var(--background-color, #fff);
}

.mode-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mode-option.active {
  border-color: var(--primary-color);
  background-color: var(--accent-color, #f0f9ff);
}

.mode-option i {
  font-size: 22px;
  margin-bottom: 8px;
  color: var(--primary-color);
}

.mode-option span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color, #333);
}

/* 明确设置深色模式文字颜色 */
:global(.dark-mode) .mode-option {
  background-color: var(--background-color-dark, #1f2937);
  border-color: var(--border-color-dark, #4b5563);
}

:global(.dark-mode) .mode-option span {
  color: var(--text-color-dark, #e5e7eb);
}

:global(.dark-mode) .mode-option:hover {
  background-color: var(--background-color-dark-hover, #2d3748);
}

:global(.dark-mode) .mode-option.active {
  background-color: var(--background-color-dark-active, #374151);
  border-color: var(--primary-color);
}
</style>
