import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// 使用懒加载导入所有页面组件，并指定chunk名称
const Home = () => import(/* webpackChunkName: "home" */ '../views/Home.vue')
const Login = () => import(/* webpackChunkName: "auth" */ '../views/Login.vue') 
const Register = () => import(/* webpackChunkName: "auth" */ '../views/Register.vue')
const PromptList = () => import(/* webpackChunkName: "prompts" */ '../views/PromptList.vue')
const PromptDetail = () => import(/* webpackChunkName: "prompts" */ '../views/PromptDetail.vue')
const CreatePrompt = () => import(/* webpackChunkName: "prompts" */ '../views/CreatePrompt.vue')
const AdminPanel = () => import(/* webpackChunkName: "admin" */ '../views/AdminPanel.vue')
const Competition = () => import(/* webpackChunkName: "competition" */ '../views/Competition.vue')

// 使用根路径，因为已经绑定了自定义域名
const base = '/'

const router = createRouter({
  history: createWebHashHistory(base),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    },
    {
      path: '/prompts',
      name: 'prompts',
      component: PromptList
    },
    {
      path: '/prompts/:id',
      name: 'promptDetail',
      component: PromptDetail
    },    {
      path: '/create',
      name: 'createPrompt',
      component: CreatePrompt,
      meta: { requiresAuth: true }
    },
    {
      path: '/competition',
      name: 'competition',
      component: Competition
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPanel,
      meta: { 
        requiresAuth: true,
        requiresAdmin: true
      }
    },
    // 添加通配符路由，处理404情况
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: Home  // 或者你可以创建一个专门的404页面组件
    }
  ]
})

// 添加一个标志来跟踪主题是否已初始化
let themeInitialized = false

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 确保用户状态在路由守卫中已经初始化
  await userStore.init()
  
  // 确保主题在每次路由切换时都正确初始化
  try {
    const { useThemeStore } = await import('../stores/theme')
    const themeStore = useThemeStore()
    
    // 检查是否是直接访问或者主题还未初始化
    const isDirectAccess = !from.name || from.name === to.name
    const needsThemeInit = isDirectAccess || !themeInitialized
      if (needsThemeInit) {
      // 确保 DOM 已准备好
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true })
        })
      }
      
      // 初始化主题
      themeStore.initTheme()
      themeInitialized = true
      
      // 给一个小的延迟确保样式应用
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  } catch (error) {
    console.error('Router guard: 主题初始化失败:', error)
  }
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router
