import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/auth/login',
        method: 'POST',
        data: { username: username.trim(), password: password.trim() },
      })
      console.log('[AdminLogin] login response:', res.data)
      const data = res.data?.data
      if (data?.token) {
        Taro.setStorageSync('admin_token', data.token)
        Taro.setStorageSync('admin_user', JSON.stringify(data.user))
        if (data.user.mustChangePassword) {
          Taro.showToast({ title: '请修改默认密码', icon: 'none', duration: 2000 })
          setTimeout(() => {
            Taro.navigateTo({ url: '/pages/admin/dashboard/index?changePassword=1' })
          }, 1500)
        } else {
          Taro.redirectTo({ url: '/pages/admin/dashboard/index' })
        }
      } else {
        Taro.showToast({ title: res.data?.msg || '登录失败', icon: 'none' })
      }
    } catch (err) {
      console.error('[AdminLogin] error:', err)
      Taro.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex flex-col min-h-full bg-muted items-center justify-center p-6">
      <View className="w-full max-w-sm">
        <View className="mb-8 text-center">
          <Text className="block text-3xl font-bold text-foreground">预约服务</Text>
          <Text className="block text-base text-muted-foreground mt-2">管理后台</Text>
        </View>

        <View className="bg-background rounded-2xl p-6 shadow-sm">
          <View className="mb-4">
            <Text className="block text-sm font-medium text-foreground mb-2">用户名</Text>
            <View className="bg-muted rounded-xl px-4 py-3">
              <Input
                className="w-full bg-transparent"
                placeholder="请输入用户名"
                value={username}
                onInput={(e) => setUsername(e.detail.value)}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="block text-sm font-medium text-foreground mb-2">密码</Text>
            <View className="bg-muted rounded-xl px-4 py-3">
              <Input
                className="w-full bg-transparent"
                type={'password' as any}
                placeholder="请输入密码"
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
              />
            </View>
          </View>

          <Button
            className="w-full bg-primary text-primary-foreground rounded-xl py-3"
            onClick={handleLogin}
            disabled={loading}
          >
            <Text className="text-primary-foreground font-medium">
              {loading ? '登录中...' : '登 录'}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
