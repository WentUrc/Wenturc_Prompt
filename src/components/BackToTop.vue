<template>
  <transition name="back-to-top">
    <div 
      class="back-to-top-btn" 
      v-if="isVisible"
      @click="scrollToTop"
      :title="'返回顶部'"
    >
      <el-icon class="back-to-top-icon">
        <ArrowUp />
      </el-icon>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowUp } from '@element-plus/icons-vue'

const isVisible = ref(false)
const scrollThreshold = 400 // 滚动超过400px时显示

// 检查滚动位置
const checkScroll = () => {
  isVisible.value = window.scrollY > scrollThreshold
}

// 平滑滚动到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 节流函数，提高滚动性能
let ticking = false
const throttledCheckScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      checkScroll()
      ticking = false
    })
    ticking = true
  }
}

onMounted(() => {
  window.addEventListener('scroll', throttledCheckScroll, { passive: true })
  checkScroll() // 初始检查
})

onUnmounted(() => {
  window.removeEventListener('scroll', throttledCheckScroll)
})
</script>

<style scoped>
.back-to-top-btn {
  position: fixed;
  right: 30px;
  bottom: 60px;
  width: 55px;
  height: 55px;
  background: var(--card-background, var(--primary-color));
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(10px);
}

.back-to-top-btn:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.back-to-top-btn:active {
  transform: translateY(0);
  transition: transform 0.1s;
}

.back-to-top-icon {
  font-size: 34px;
  color: var(--primary-color);
  text-shadow: 0 0 6px var(--primary-color), 0 0 6px var(--primary-color);
  transition: transform 0.3s ease, filter 0.3s ease;
}

/* 进一步加粗——针对 SVG 线条图标 */
.back-to-top-icon svg {
  stroke: var(--primary-color);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: var(--primary-color);
}

.back-to-top-btn:hover .back-to-top-icon {
  transform: translateY(-1px);
}

/* 渐变边框效果 */
.back-to-top-btn::before {
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
  border-radius: inherit;
  z-index: -1;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.back-to-top-btn:hover::before {
  opacity: 0.8;
}

/* 动画过渡 */
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.back-to-top-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

/* 深色模式适配 */
.dark-mode .back-to-top-btn {
  background: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark-mode .back-to-top-btn:hover {
  background: var(--secondary-color);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .back-to-top-btn {
    right: 20px;
    bottom: 45px;
    width: 50px;
    height: 50px;
  }
  
  .back-to-top-icon {
    font-size: 22px;
  }
}

/* 小屏幕适配 */
@media (max-width: 480px) {
  .back-to-top-btn {
    right: 16px;
    bottom: 35px;
    width: 47px;
    height: 47px;
  }
  
  .back-to-top-icon {
    font-size: 20px;
  }
}

/* 确保不与其他固定元素冲突 */
@media (max-height: 600px) {
  .back-to-top-btn {
    bottom: 20px;
  }
}

/* 高分辨率屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .back-to-top-btn {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  .back-to-top-btn:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
}
</style> 