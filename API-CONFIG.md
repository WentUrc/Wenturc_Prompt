# API配置说明

## 概述

项目现在使用动态API配置系统，不再硬编码localhost地址，支持不同环境的API地址配置。

## 配置文件位置

主要配置文件：`frontend/src/config/api.js`

## 环境配置

### 开发环境 (development)
- API地址：`http://localhost:5000`
- WebSocket地址：`ws://localhost:5000`

### 生产环境 (production)
- API地址：`https://your-api-domain.com` (需要修改为实际域名)
- WebSocket地址：`wss://your-api-domain.com`

### 测试环境 (test)
- API地址：`http://test-api.your-domain.com` (需要修改为实际域名)
- WebSocket地址：`ws://test-api.your-domain.com`

## 如何使用

### 1. 修改生产环境配置

编辑 `frontend/src/config/api.js` 文件：

```javascript
const config = {
  // ... 其他配置 ...
  production: {
    // 修改为你的实际API地址
    apiBaseUrl: 'https://your-actual-api-domain.com',
    wsUrl: 'wss://your-actual-api-domain.com'
  }
}
```

### 2. 设置环境变量

有多种方式指定当前环境：

#### 方式1：使用Vite环境变量
创建 `.env.production` 文件：
```
VITE_APP_ENV=production
```

#### 方式2：使用NODE_ENV
```bash
NODE_ENV=production npm run build
```

#### 方式3：手动修改配置
在 `api.js` 中直接返回指定环境的配置。

### 3. 构建和部署

开发环境（默认）：
```bash
npm run dev
```

生产环境构建：
```bash
NODE_ENV=production npm run build
```

## 当前修改的文件

以下文件已经更新为使用动态API配置：

- `frontend/src/main.js` - axios默认配置
- `frontend/src/utils/JwtConfig.js` - JWT配置
- `frontend/src/services/ApiService.js` - API服务
- `frontend/src/views/Login.vue` - 登录页面
- `frontend/src/views/CreatePrompt.vue` - 创建提示页面
- `frontend/src/views/PromptList.vue` - 提示列表页面
- `frontend/src/views/PromptDetail.vue` - 提示详情页面
- `frontend/src/views/JwtDebug.vue` - JWT调试页面
- `frontend/src/stores/user.js` - 用户状态管理

## 调试

打开浏览器控制台，可以看到当前使用的API配置：
```
[API Config] 当前环境: development
[API Config] API地址: http://localhost:5000
```

## 注意事项

1. **生产环境部署前**，请确保修改 `production` 配置中的API地址
2. **CORS配置**：确保后端API配置了正确的CORS策略
3. **HTTPS**：生产环境建议使用HTTPS
4. **环境变量优先级**：VITE_APP_ENV > NODE_ENV > development（默认）

## 扩展

如果需要添加新的环境（如staging），可以在config对象中添加：

```javascript
const config = {
  // ... 现有配置 ...
  staging: {
    apiBaseUrl: 'https://staging-api.your-domain.com',
    wsUrl: 'wss://staging-api.your-domain.com'
  }
}
``` 