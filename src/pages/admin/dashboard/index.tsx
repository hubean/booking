import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { House, Calendar, Users, Scissors, LogOut, KeyRound } from 'lucide-react-taro'
import { useAuthGuard } from '@/hooks/use-auth-guard'

function getAdminHeaders() {
  const token = Taro.getStorageSync('admin_token')
  return { Authorization: `Bearer ${token}` }
}

export default function AdminDashboard() {
  useAuthGuard()
  const [stats, setStats] = useState({ services: 0, appointments: 0, pending: 0, users: 0 })
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.changePassword === '1') {
      setShowPasswordDialog(true)
    }
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [servicesRes, appointmentsRes, pendingRes, usersRes] = await Promise.all([
        Network.request({ url: '/api/services?all=true', header: getAdminHeaders() }),
        Network.request({ url: '/api/appointments/admin/list', header: getAdminHeaders() }),
        Network.request({ url: '/api/appointments/admin/list?status=pending', header: getAdminHeaders() }),
        Network.request({ url: '/api/users', header: getAdminHeaders() }),
      ])
      setStats({
        services: servicesRes.data?.data?.length || 0,
        appointments: appointmentsRes.data?.data?.length || 0,
        pending: pendingRes.data?.data?.length || 0,
        users: usersRes.data?.data?.length || 0,
      })
    } catch (err) {
      console.error('[Dashboard] loadStats error:', err)
    }
  }

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd) {
      Taro.showToast({ title: '请填写完整', icon: 'none' })
      return
    }
    if (newPwd.length < 4) {
      Taro.showToast({ title: '新密码至少4位', icon: 'none' })
      return
    }
    setChanging(true)
    try {
      const res = await Network.request({
        url: '/api/auth/change-password',
        method: 'PUT',
        data: { oldPassword: oldPwd, newPassword: newPwd },
        header: getAdminHeaders(),
      })
      if (res.data?.code === 200) {
        Taro.showToast({ title: '密码修改成功', icon: 'success' })
        setShowPasswordDialog(false)
        setOldPwd('')
        setNewPwd('')
        // Update user info
        const user = JSON.parse(Taro.getStorageSync('admin_user') || '{}')
        user.mustChangePassword = false
        Taro.setStorageSync('admin_user', JSON.stringify(user))
      } else {
        Taro.showToast({ title: res.data?.msg || '修改失败', icon: 'none' })
      }
    } catch (err) {
      Taro.showToast({ title: '修改失败', icon: 'none' })
    } finally {
      setChanging(false)
    }
  }

  const handleLogout = () => {
    Taro.removeStorageSync('admin_token')
    Taro.removeStorageSync('admin_user')
    Taro.redirectTo({ url: '/pages/admin/login/index' })
  }

  const menuItems = [
    { icon: Scissors, label: '服务管理', url: '/pages/admin/services/index', color: '#F97316' },
    { icon: Calendar, label: '预约管理', url: '/pages/admin/appointments/index', color: '#22C55E' },
    { icon: Users, label: '用户管理', url: '/pages/admin/users/index', color: '#3B82F6' },
  ]

  const statCards = [
    { label: '服务项目', value: stats.services, color: 'text-primary' },
    { label: '总预约', value: stats.appointments, color: 'text-blue-500' },
    { label: '待服务', value: stats.pending, color: 'text-amber-500' },
    { label: '管理用户', value: stats.users, color: 'text-green-500' },
  ]

  return (
    <View className="flex flex-col min-h-full bg-muted">
      {/* Header */}
      <View className="bg-background px-4 py-4 shadow-sm">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center">
            <House size={20} color="#F97316" />
            <Text className="block text-lg font-bold text-foreground ml-2">管理后台</Text>
          </View>
          <View className="flex flex-row items-center gap-3">
            <View onClick={() => setShowPasswordDialog(true)}>
              <KeyRound size={18} color="#6B7280" />
            </View>
            <View onClick={handleLogout}>
              <LogOut size={18} color="#EF4444" />
            </View>
          </View>
        </View>
      </View>

      <View className="p-4">
        {/* Stats */}
        <View className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map((item) => (
            <View key={item.label} className="bg-background rounded-xl p-4 shadow-sm">
              <Text className={`block text-2xl font-bold ${item.color}`}>{item.value}</Text>
              <Text className="block text-sm text-muted-foreground mt-1">{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View className="bg-background rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, idx) => (
            <View
              key={item.label}
              className={`flex flex-row items-center px-4 py-4 ${idx < menuItems.length - 1 ? 'border-b border-border' : ''}`}
              onClick={() => Taro.navigateTo({ url: item.url })}
            >
              <View className="w-8 h-8 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: `${item.color}20` }}>
                <item.icon size={18} color={item.color} />
              </View>
              <Text className="block flex-1 text-base text-foreground">{item.label}</Text>
              <Text className="block text-gray-400">›</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Change Password Dialog */}
      {showPasswordDialog && (
        <View className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <View className="bg-background rounded-2xl p-6 mx-6 w-full max-w-sm">
            <Text className="block text-lg font-bold text-foreground mb-4">修改密码</Text>
            <View className="mb-3">
              <Text className="block text-sm text-muted-foreground mb-1">原密码</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type={'password' as any}
                  placeholder="请输入原密码"
                  value={oldPwd}
                  onInput={(e) => setOldPwd(e.detail.value)}
                />
              </View>
            </View>
            <View className="mb-4">
              <Text className="block text-sm text-muted-foreground mb-1">新密码</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type={'password' as any}
                  placeholder="请输入新密码（至少4位）"
                  value={newPwd}
                  onInput={(e) => setNewPwd(e.detail.value)}
                />
              </View>
            </View>
            <View className="flex flex-row gap-3">
              <View className="flex-1">
                <Button
                  className="w-full rounded-xl py-2 border border-border"
                  variant="outline"
                  onClick={() => { setShowPasswordDialog(false); setOldPwd(''); setNewPwd('') }}
                >
                  <Text>取消</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  className="w-full bg-primary text-primary-foreground rounded-xl py-2"
                  onClick={handleChangePassword}
                  disabled={changing}
                >
                  <Text className="text-primary-foreground">{changing ? '提交中...' : '确认'}</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
