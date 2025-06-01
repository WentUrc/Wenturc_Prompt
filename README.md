# WentUrc Prompt Collection - 前端

🎨 一个现代化的 AI 提示词收集与分享平台的前端项目

## 📋 项目简介

WentUrc Prompt Collection 是一个专为 AI 提示词爱好者打造的社区平台。用户可以在这里发现、分享和收藏各种高质量的 AI 提示词，参与定期举办的创意比赛，并获得 AI 智能评价反馈。

### ✨ 核心功能

- 🔍 **智能浏览** - 按分类浏览和搜索 AI 提示词
- 📝 **创作分享** - 创建和发布原创提示词作品
- 🏆 **创意比赛** - 参与3天一轮的提示词创意比赛
- 🤖 **AI 评价** - 获得智能 AI 对作品的专业评语
- ❤️ **社交互动** - 为优秀作品点赞收藏
- 🎨 **主题定制** - 深色/浅色模式 + 多色彩主题
- 📱 **响应式设计** - 完美适配桌面端和移动端

## 🛠️ 技术栈

### 核心框架
- **Vue 3** - 渐进式 JavaScript 框架
- **Composition API** - Vue 3 组合式 API
- **Vite** - 下一代前端构建工具

### UI 组件库
- **Element Plus** - 基于 Vue 3 的组件库
- **Element Plus Icons** - 官方图标库

### 状态管理
- **Pinia** - Vue 3 官方推荐状态管理库

### 路由管理
- **Vue Router 4** - Vue 3 官方路由器

### 样式预处理
- **SCSS/Sass** - CSS 预处理器
- **CSS 变量** - 现代 CSS 主题系统

### HTTP 客户端
- **Axios** - Promise 基础的 HTTP 库

### 开发工具
- **ESLint** - 代码质量检查
- **Terser** - JavaScript 压缩优化

## 📁 项目结构

```
frontend/
├── public/                 # 静态资源
│   ├── img/               # 图片资源
│   ├── font/              # 字体文件
│   └── bongo-cat/         # 小游戏资源
├── src/
│   ├── components/        # 组件目录
│   │   ├── admin/         # 管理员组件
│   │   ├── common/        # 通用组件
│   │   ├── competition/   # 比赛相关组件
│   │   └── game/          # 游戏组件
│   ├── views/             # 页面组件
│   ├── stores/            # Pinia 状态管理
│   ├── router/            # 路由配置
│   ├── utils/             # 工具函数
│   ├── config/            # 配置文件
│   └── assets/            # 资源文件
├── package.json           # 项目配置
├── vite.config.js         # Vite 配置
└── vercel.json           # Vercel 部署配置
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0

### 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 开发模式启动

```bash
# 启动开发服务器
npm run dev

# 或
yarn dev
```

开发服务器将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
# 构建生产环境
npm run build

# 构建开发环境（用于测试）
npm run dev

# 预览构建结果
npm run preview
```

## ⚙️ 配置说明

### 环境配置

项目支持多环境配置，主要配置文件：`src/config/api.js`

```javascript
// 开发环境
const API_BASE_URL = 'http://localhost:5000'

// 生产环境
const API_BASE_URL = 'https://apii.wenturc.com'
```

### 主题配置

项目内置完整的主题系统，支持：

- **明暗模式切换**
- **多色彩主题**（蓝色、绿色、紫色、橙色、红色、青色）
- **响应式设计**
- **主题持久化存储**

### API 配置

详细的 API 配置说明请参考 [API-CONFIG.md](./API-CONFIG.md)

## 🎨 主题系统

### 主题色彩

```css
:root {
  --primary-color: #409eff;     /* 主色调 */
  --secondary-color: #67c23a;   /* 辅助色 */
  --accent-color: #e6a23c;      /* 强调色 */
  --text-color: #303133;        /* 文字颜色 */
  --bg-color: #ffffff;          /* 背景色 */
}
```

### 深色模式

```css
:root[data-theme="dark"] {
  --text-color: #e5e7eb;
  --bg-color: #1f2937;
  --card-bg: #374151;
}
```

## 📱 响应式设计

项目采用移动优先的响应式设计策略：

- **手机端**: < 768px
- **平板端**: 768px - 1024px  
- **桌面端**: > 1024px

## 🔐 权限系统

### 用户角色

- **游客**: 浏览公开内容
- **普通用户**: 创建提示词、参与比赛
- **管理员**: 内容审核、用户管理、比赛管理

### 路由守卫

```javascript
// 需要登录的路由
meta: { requiresAuth: true }

// 需要管理员权限的路由  
meta: { requiresAuth: true, requiresAdmin: true }
```

## 🎮 特色功能

### 比赛系统

- **自动化比赛**: 每3天自动开启新一轮比赛
- **作品提交**: 用户可提交原创提示词参赛
- **AI 评价**: 通过后的作品获得 AI 智能评语
- **作品推广**: 优秀作品可推广为公开提示词

### 智能搜索

- **分类筛选**: 按编程、写作、设计等分类查找
- **关键词搜索**: 支持标题和内容全文搜索
- **状态筛选**: 查看已审核/待审核内容

### 社交功能

- **点赞系统**: 为优秀作品点赞
- **作者信息**: 查看作品创作者
- **创作统计**: 个人创作数据统计

## 🔧 开发指南

### 代码风格

项目遵循 Vue 3 官方推荐的代码风格：

- 使用 Composition API
- 组件采用 `<script setup>` 语法
- 响应式数据使用 `ref()` 和 `reactive()`
- 组合式函数以 `use` 开头

### 组件开发

```vue
<template>
  <div class="component-name">
    <!-- 模板内容 -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 组件逻辑
const data = ref('')
const computedValue = computed(() => {
  return data.value.toUpperCase()
})

onMounted(() => {
  // 组件挂载后的逻辑
})
</script>

<style scoped>
.component-name {
  /* 组件样式 */
}
</style>
```

### 状态管理

使用 Pinia 进行状态管理：

```javascript
// stores/example.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExampleStore = defineStore('example', () => {
  const data = ref('')
  
  const getData = computed(() => data.value)
  
  function updateData(newData) {
    data.value = newData
  }
  
  return { data, getData, updateData }
})
```

## 📦 部署

### Vercel 部署

项目已配置 Vercel 自动部署：

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 自定义部署

1. 构建项目：`npm run build`
2. 将 `dist` 目录部署到静态文件服务器
3. 配置服务器支持 SPA 路由

### 环境变量

```bash
# 生产环境 API 地址
VITE_API_BASE_URL=https://your-api-domain.com

# 其他配置...
```

## 🐛 常见问题

### Q: 开发服务器启动失败？
A: 检查 Node.js 版本是否 >= 16.0.0，清除 node_modules 重新安装依赖

### Q: API 请求失败？
A: 检查后端服务是否启动，确认 API 地址配置正确

### Q: 主题切换不生效？
A: 清除浏览器缓存，检查本地存储是否被清理

### Q: 移动端显示异常？
A: 检查 viewport 配置，确认响应式样式是否正确

## 🤝 贡献指南

欢迎为项目贡献代码！请遵循以下步骤：

1. Fork 项目到个人账户
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建 Pull Request

### 开发规范

- 遵循项目现有代码风格
- 添加必要的注释和文档
- 确保新功能有相应的测试
- 提交信息使用中文，格式清晰

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../backend/LICENSE) 文件了解详情

## 🔗 相关链接

- **在线演示**: [https://prompt.wenturc.com](https://prompt.wenturc.com)
- **API 文档**: [API-CONFIG.md](./API-CONFIG.md)
- **后端项目**: [../backend/](../backend/)
- **GitHub**: [https://github.com/WentUrc/Wenturc_Prompt](https://github.com/WentUrc/Wenturc_Prompt)

## 📞 联系我们

- **官网**: [https://wenturc.com](https://wenturc.com)
- **笔记**: [https://note.wenturc.com](https://note.wenturc.com)  
- **聊天**: [https://chat.wenturc.com](https://chat.wenturc.com)

---

<div align="center">

**WentUrc Prompt Collection** - 让 AI 提示词创作更有趣 🚀

Made with ❤️ by [IGCrystal](https://wenturc.com)

</div>
