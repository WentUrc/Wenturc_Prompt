import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// 使用懒加载导入所有页面组件，并指定chunk名称
const Home = () => import(/* webpackChunkName: "home" */ '../views/Home.vue')
const Login = () => import(/* webpackChunkName: "auth" */ '../views/Login.vue') 
const Register = () => import(/* webpackChunkName: "auth" */ '../views/Register.vue')
const PromptList = () => import(/* webpackChunkName: "prompts" */ '../views/PromptList.vue')
const PromptDetail = () => import(/* webpackChunkName: "prompts" */ '../views/PromptDetail.vue')
const CreatePrompt = () => import(/* webpackChunkName: "prompts" */ '../views/CreatePrompt.vue')
const JwtDebug = () => import(/* webpackChunkName: "debug" */ '../views/JwtDebug.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    },
    {
      path: '/create',
      name: 'createPrompt',
      component: CreatePrompt,
      meta: { requiresAuth: true }
    },
    // 添加JWT调试路由
    {
      path: '/debug',
      name: 'debug',
      component: JwtDebug,
      meta: { 
        requiresAuth: false,  // 不需要认证也可访问，方便调试
        devOnly: true         // 仅开发环境可用
      }
    }
  ]
})

// 添加一个标志来跟踪主题是否已初始化
let themeInitialized = false

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 确保主题在每次路由切换时都正确初始化
  try {
    const { useThemeStore } = await import('../stores/theme')
    const themeStore = useThemeStore()
    
    // 检查是否是直接访问或者主题还未初始化
    const isDirectAccess = !from.name || from.name === to.name
    const needsThemeInit = isDirectAccess || !themeInitialized
    
    if (needsThemeInit) {
      console.log('Router guard: 检测到需要主题初始化')
      console.log('- 路由:', to.path)
      console.log('- 是否直接访问:', isDirectAccess)
      console.log('- 主题已初始化:', themeInitialized)
      
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
      
      console.log('Router guard: 主题初始化完成')
    }
  } catch (error) {
    console.error('Router guard: 主题初始化失败:', error)
  }
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
