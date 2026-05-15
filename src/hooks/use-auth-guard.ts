import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

/**
 * 管理后台登录校验 Hook
 * 1. 检查本地存储中是否存在 admin_token，不存在则跳转登录页
 * 2. 监听全局 401 事件，token 失效时自动跳转登录页
 */
export function useAuthGuard() {
  useEffect(() => {
    const token = Taro.getStorageSync('admin_token')
    if (!token) {
      Taro.redirectTo({ url: '/pages/admin/login/index' })
      return
    }

    // 监听 token 失效事件
    const handler = () => {
      Taro.removeStorageSync('admin_token')
      Taro.removeStorageSync('admin_user')
      Taro.redirectTo({ url: '/pages/admin/login/index' })
    }
    Taro.eventCenter.on('auth:unauthorized', handler)

    return () => {
      Taro.eventCenter.off('auth:unauthorized', handler)
    }
  }, [])
}

/**
 * 管理后台请求封装
 * 自动附加 Authorization header，401 时触发跳转
 */
export function getAdminHeaders() {
  const token = Taro.getStorageSync('admin_token')
  return { Authorization: `Bearer ${token}` }
}

/**
 * 管理后台请求封装
 * 自动附加 header + 处理 401
 */
export async function adminRequest(options: { url: string; method?: string; data?: any; header?: any }) {
  const token = Taro.getStorageSync('admin_token')
  const header = { ...options.header, Authorization: `Bearer ${token}` }
  try {
    const res = await Network.request({ ...options, header } as any)
    return res
  } catch (err: any) {
    if (err?.statusCode === 401) {
      Taro.eventCenter.trigger('auth:unauthorized')
    }
    throw err
  }
}
