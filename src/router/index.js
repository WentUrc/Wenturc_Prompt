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

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
