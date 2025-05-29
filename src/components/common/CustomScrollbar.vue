<template>
  <div 
    class="custom-scrollbar-container"
    :class="{
      'horizontal': direction === 'horizontal',
      'vertical': direction === 'vertical',
      'both': direction === 'both',
      'thin': size === 'thin',
      'normal': size === 'normal',
      'thick': size === 'thick'
    }"
    :style="containerStyle"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 滚动方向: 'vertical' | 'horizontal' | 'both'
  direction: {
    type: String,
    default: 'vertical',
    validator: (value) => ['vertical', 'horizontal', 'both'].includes(value)
  },
  // 滚动条大小: 'thin' | 'normal' | 'thick'
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['thin', 'normal', 'thick'].includes(value)
  },
  // 最大高度
  maxHeight: {
    type: String,
    default: null
  },
  // 最大宽度
  maxWidth: {
    type: String,
    default: null
  },
  // 是否自动隐藏滚动条
  autoHide: {
    type: Boolean,
    default: true
  },
  // 滚动条颜色主题: 'primary' | 'secondary' | 'accent' | 'custom'
  theme: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'accent', 'custom'].includes(value)
  },
  // 自定义颜色（当theme为custom时使用）
  customColor: {
    type: String,
    default: null
  }
})

// 计算容器样式
const containerStyle = computed(() => {
  const styles = {}
  
  if (props.maxHeight) {
    styles.maxHeight = props.maxHeight
  }
  
  if (props.maxWidth) {
    styles.maxWidth = props.maxWidth
  }
  
  return styles
})
</script>

<style scoped>
.custom-scrollbar-container {
  overflow: overlay;
  position: relative;
}

/* 基础滚动条样式 */
.custom-scrollbar-container::-webkit-scrollbar {
  background: transparent;
  transition: all 0.3s ease;
}

.custom-scrollbar-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track-color, rgba(0, 0, 0, 0.05));
  border-radius: 10px;
  margin: 2px;
}

.custom-scrollbar-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-color, var(--primary-color));
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: content-box;
  transition: all 0.3s ease;
}

.custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover-color, var(--primary-color-hover));
  background-clip: content-box;
}

.custom-scrollbar-container::-webkit-scrollbar-thumb:active {
  background: var(--scrollbar-thumb-active-color, var(--primary-color-active));
  background-clip: content-box;
}

.custom-scrollbar-container::-webkit-scrollbar-corner {
  background: var(--scrollbar-track-color, rgba(0, 0, 0, 0.05));
}

/* 滚动条大小变体 */
.custom-scrollbar-container.thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar-container.normal::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar-container.thick::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

/* 方向控制 */
.custom-scrollbar-container.vertical {
  overflow-x: hidden;
  overflow-y: overlay;
}

.custom-scrollbar-container.horizontal {
  overflow-x: overlay;
  overflow-y: hidden;
}

.custom-scrollbar-container.both {
  overflow: overlay;
}

/* 自动隐藏效果 */
.custom-scrollbar-container.auto-hide::-webkit-scrollbar {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.custom-scrollbar-container.auto-hide:hover::-webkit-scrollbar {
  opacity: 1;
}

/* 主题颜色变体 */
.custom-scrollbar-container.theme-primary {
  --scrollbar-thumb-color: var(--primary-color, #409eff);
  --scrollbar-thumb-hover-color: var(--primary-color-hover, #66b1ff);
  --scrollbar-thumb-active-color: var(--primary-color-active, #3a8ee6);
}

.custom-scrollbar-container.theme-secondary {
  --scrollbar-thumb-color: var(--secondary-color, #67c23a);
  --scrollbar-thumb-hover-color: var(--secondary-color-hover, #85ce61);
  --scrollbar-thumb-active-color: var(--secondary-color-active, #5daf34);
}

.custom-scrollbar-container.theme-accent {
  --scrollbar-thumb-color: var(--accent-color, #e6a23c);
  --scrollbar-thumb-hover-color: var(--accent-color-hover, #ebb563);
  --scrollbar-thumb-active-color: var(--accent-color-active, #cf9236);
}

/* 深色模式适配 */
.dark-mode .custom-scrollbar-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track-color-dark, rgba(255, 255, 255, 0.1));
}

.dark-mode .custom-scrollbar-container.theme-primary {
  --scrollbar-thumb-color: var(--primary-color-dark, #409eff);
  --scrollbar-thumb-hover-color: var(--primary-color-hover-dark, #66b1ff);
  --scrollbar-thumb-active-color: var(--primary-color-active-dark, #3a8ee6);
}

.dark-mode .custom-scrollbar-container.theme-secondary {
  --scrollbar-thumb-color: var(--secondary-color-dark, #67c23a);
  --scrollbar-thumb-hover-color: var(--secondary-color-hover-dark, #85ce61);
  --scrollbar-thumb-active-color: var(--secondary-color-active-dark, #5daf34);
}

.dark-mode .custom-scrollbar-container.theme-accent {
  --scrollbar-thumb-color: var(--accent-color-dark, #e6a23c);
  --scrollbar-thumb-hover-color: var(--accent-color-hover-dark, #ebb563);
  --scrollbar-thumb-active-color: var(--accent-color-active-dark, #cf9236);
}

/* Firefox 滚动条样式 */
.custom-scrollbar-container {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb-color, var(--primary-color)) var(--scrollbar-track-color, rgba(0, 0, 0, 0.05));
}

/* 响应式适配 */
@media (max-width: 768px) {
  .custom-scrollbar-container.thin::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  .custom-scrollbar-container.normal::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .custom-scrollbar-container.thick::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
}

/* 平滑滚动 */
.custom-scrollbar-container {
  scroll-behavior: smooth;
}

/* 可选：为触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .custom-scrollbar-container::-webkit-scrollbar {
    opacity: 0.7;
  }
  
  .custom-scrollbar-container::-webkit-scrollbar-thumb {
    border-width: 1px;
  }
}
</style>
