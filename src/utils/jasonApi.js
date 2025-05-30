// Jason prompt市场API工具
import { getApiBaseUrl } from '@/config/api'

export const jasonApi = {
  // 分页获取Jason的prompt（通过我们的代理）
  async getPrompts(skip = 0, limit = 1000) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/external/prompts?skip=${skip}&limit=${limit}`)
      const data = await response.json()
      
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('获取Jason prompt失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // 直接访问Jason的API（可能有跨域问题）
  async getPromptsDirectly(skip = 0, limit = 1000) {
    try {
      const response = await fetch(`https://www.jasongjz.top/api/v1/prompts/?skip=${skip}&limit=${limit}`)
      const data = await response.json()
      
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('直接访问Jason API失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // 批量获取Jason的prompt（通过多次分页调用）
  async getAllPrompts() {
    try {
      let allPrompts = []
      let skip = 0
      const limit = 100
      let hasMore = true
      
      while (hasMore) {
        const result = await this.getPrompts(skip, limit)
        
        if (result.success && Array.isArray(result.data)) {
          allPrompts = allPrompts.concat(result.data)
          
          // 如果返回的数据少于limit，说明已经获取完所有数据
          if (result.data.length < limit) {
            hasMore = false
          } else {
            skip += limit
          }
        } else {
          throw new Error(result.error || '分页获取失败')
        }
      }
      
      return {
        success: true,
        prompts: allPrompts,
        total: allPrompts.length
      }
    } catch (error) {
      console.error('批量获取Jason prompt失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
