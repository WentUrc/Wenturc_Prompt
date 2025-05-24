import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// 预设的主题色
export const THEME_COLORS = {
  blue: {
    primary: '#409EFF',
    secondary: '#79bbff',
    accent: '#ecf5ff',
    name: '蓝色'
  },
  green: {
    primary: '#67C23A',
    secondary: '#95d475',
    accent: '#f0f9eb',
    name: '绿色'
  },
  purple: {
    primary: '#8265FC',
    secondary: '#b3a7fe',
    accent: '#f5f2ff',
    name: '紫色'
  },
  orange: {
    primary: '#E6A23C',
    secondary: '#eebe77',
    accent: '#fdf6ec',
    name: '橙色'
  },
  red: {
    primary: '#F56C6C',
    secondary: '#f89898',
    accent: '#fef0f0',
    name: '红色'
  },
  teal: {
    primary: '#26A69A',
    secondary: '#80cbc4',
    accent: '#e0f2f1',
    name: '青色'
  }
};

export const useThemeStore = defineStore('theme', () => {
  // 从本地存储读取主题设置，默认为蓝色和浅色模式
  const currentThemeColor = ref(localStorage.getItem('themeColor') || 'blue');
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');

  // 监听变化，保存到本地存储
  watch(currentThemeColor, (newColor) => {
    localStorage.setItem('themeColor', newColor);
    applyThemeColor(newColor);
  });

  watch(isDarkMode, (isDark) => {
    localStorage.setItem('darkMode', isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
  });

  // 应用主题色到文档根元素
  const applyThemeColor = (colorName) => {
    const color = THEME_COLORS[colorName];
    if (!color) return;

    document.documentElement.style.setProperty('--primary-color', color.primary);
    document.documentElement.style.setProperty('--secondary-color', color.secondary);
    document.documentElement.style.setProperty('--accent-color', color.accent);
  };  // 初始化主题 - 简化逻辑，确保可靠性
  const initTheme = () => {
    console.log('Theme Store: 开始初始化主题...');
    
    try {
      // 1. 立即设置深色模式类
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
      
      // 2. 强制浏览器重新计算样式
      document.documentElement.offsetHeight;
      
      // 3. 设置主题色
      applyThemeColor(currentThemeColor.value);
      
      // 4. 验证结果
      setTimeout(() => {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        console.log('Theme Store: 初始化完成，文字颜色:', textColor);
      }, 50);
      
    } catch (error) {
      console.error('Theme Store: 初始化失败:', error);
    }
  };

  // 修改切换函数，确保状态切换正确
  const toggleDarkMode = () => {
    console.log('切换前的深色模式状态:', isDarkMode.value);
    isDarkMode.value = !isDarkMode.value;
    console.log('切换后的深色模式状态:', isDarkMode.value);
    
    // 确保DOM也被更新
    document.documentElement.classList.toggle('dark-mode', isDarkMode.value);
    
    // 保存到本地存储
    localStorage.setItem('darkMode', isDarkMode.value);
  };

  // 设置主题色
  const setThemeColor = (colorName) => {
    if (THEME_COLORS[colorName]) {
      currentThemeColor.value = colorName;
    }
  };

  return {
    currentThemeColor,
    isDarkMode,
    toggleDarkMode,
    setThemeColor,
    initTheme,
    themeColors: THEME_COLORS,
  };
});
