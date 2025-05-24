import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import PromptList from '../views/PromptList.vue'
import PromptDetail from '../views/PromptDetail.vue'
import CreatePrompt from '../views/CreatePrompt.vue'
import JwtDebug from '../views/JwtDebug.vue'  // 添加JWT调试页面

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
