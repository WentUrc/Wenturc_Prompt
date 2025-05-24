/**
 * 友情链接配置文件
 * 管理员可以在这里添加、修改或删除友情链接
 */

export const friendsLinks = [
  {
    name: '大英警察进比利时的Prompt市场',
    description: '探索、分享和使用高质量的 AI Prompts',
    url: 'https://prompt.614447.xyz/',
    avatar: 'https://avatars.githubusercontent.com/u/98155299?v=4',
    category: 'Prompt市场'
  },
  {
    name: 'Jason.Joestar的prompt市场',
    description: 'Jason.Joestar的prompt市场',
    url: 'http://www.jasongjz.top:8000/app/',
    avatar: 'https://avatars.githubusercontent.com/u/197440256?v=4',
    category: 'Prompt市场'
  },
  {
    name: 'Prompt工程指南',
    description: 'Prompt工程学习资源',
    url: 'https://www.promptingguide.ai/zh',
    avatar: 'https://www.promptingguide.ai/144-favicon.svg',
    category: '学习资源'
  },
  {
    name: 'AI工具集',
    description: '实用AI工具推荐',
    url: 'https://ai-bot.cn',
    avatar: 'https://ai-bot.cn/favicon.ico',
    category: 'AI工具'
  }
]

/**
 * 友情链接配置
 */
export const friendsConfig = {
  // 是否启用友情链接模块
  enabled: true,
  
  // 标题
  title: '友情链接',
  
  // 每行显示的数量（响应式）
  responsive: {
    xs: 12,  // 手机：每行2个
    sm: 8,   // 小平板：每行3个
    md: 6,   // 平板：每行4个
    lg: 6,   // 桌面：每行4个（更大的卡片）
    xl: 6    // 大屏：每行4个（更大的卡片）
  },
  
  // 动画配置
  animation: {
    loadDelay: 1200,        // 加载延迟（毫秒）
    staggerDelay: 100       // 错落动画延迟（毫秒）
  },
  
  // 默认头像（当头像加载失败时使用）
  defaultAvatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzQwOWVmZiIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkY8L3RleHQ+Cjwvc3ZnPgo='
}

/**
 * 根据分类筛选友情链接
 * @param {string} category - 分类名称，不传则返回所有
 * @returns {Array} 筛选后的友情链接列表
 */
export function getFriendsByCategory(category = null) {
  if (!category) {
    return friendsLinks
  }
  return friendsLinks.filter(link => link.category === category)
}

/**
 * 获取所有分类
 * @returns {Array} 分类列表
 */
export function getAllCategories() {
  const categories = [...new Set(friendsLinks.map(link => link.category))]
  return categories.sort()
} 