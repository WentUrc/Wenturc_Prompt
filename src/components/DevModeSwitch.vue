<template>
  <div class="dev-mode-switch" v-if="isDevEnvironment">
    <el-switch
      v-model="devMode"
      active-text="开发模式"
      inactive-text="普通模式"
      @change="toggleMode"
    />
    <div class="mode-badge" :class="{ 'active': devMode }">
      {{ devMode ? '开发模式：不验证令牌' : '标准模式：验证令牌' }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

// 检测是否为开发环境
const isDevEnvironment = computed(() => import.meta.env.DEV);

// 开发模式状态绑定
const devMode = ref(userStore.devMode);

// 监听存储中的变化
watch(() => userStore.devMode, (newValue) => {
  devMode.value = newValue;
});

// 切换模式
const toggleMode = () => {
  userStore.toggleDevMode();
};

onMounted(() => {
  // 初始化时同步状态
  devMode.value = userStore.devMode;
});
</script>

<style scoped>
.dev-mode-switch {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mode-badge {
  margin-top: 8px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #409EFF;
  color: white;
  transition: all 0.3s;
}

.mode-badge.active {
  background-color: #E6A23C;
}
</style>
