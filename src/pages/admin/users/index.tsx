import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-taro'

function getAdminHeaders() {
  const token = Taro.getStorageSync('admin_token')
  return { Authorization: `Bearer ${token}` }
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('admin')
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const res = await Network.request({ url: '/api/users', header: getAdminHeaders() })
      console.log('[AdminUsers] load:', res.data)
      setUsers(res.data?.data || [])
    } catch (err) {
      console.error('[AdminUsers] load error:', err)
    }
  }

  const handleAddUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      Taro.showToast({ title: '请填写完整', icon: 'none' })
      return
    }
    if (newPassword.length < 4) {
      Taro.showToast({ title: '密码至少4位', icon: 'none' })
      return
    }
    setAdding(true)
    try {
      const res = await Network.request({
        url: '/api/users',
        method: 'POST',
        data: { username: newUsername.trim(), password: newPassword, role: newRole },
        header: getAdminHeaders(),
      })
      if (res.data?.code === 200) {
        Taro.showToast({ title: '创建成功', icon: 'success' })
        setShowAdd(false)
        setNewUsername('')
        setNewPassword('')
        setNewRole('admin')
        loadUsers()
      } else {
        Taro.showToast({ title: res.data?.msg || '创建失败', icon: 'none' })
      }
    } catch (err) {
      Taro.showToast({ title: '创建失败', icon: 'none' })
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: number, username: string) => {
    if (username === 'admin') {
      Taro.showToast({ title: '不能删除默认管理员', icon: 'none' })
      return
    }
    const { confirm } = await Taro.showModal({ title: '确认删除', content: `确定删除用户"${username}"？` })
    if (!confirm) return
    try {
      await Network.request({
        url: `/api/users/${id}`,
        method: 'DELETE',
        header: getAdminHeaders(),
      })
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadUsers()
    } catch (err) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const currentUser = JSON.parse(Taro.getStorageSync('admin_user') || '{}')

  return (
    <View className="flex flex-col min-h-full bg-muted">
      {/* Header */}
      <View className="bg-background px-4 py-3 shadow-sm flex flex-row items-center">
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={20} color="#18181B" />
        </View>
        <Text className="block text-lg font-bold text-foreground ml-3">用户管理</Text>
        <View className="flex-1" />
        <View onClick={() => setShowAdd(true)}>
          <Plus size={22} color="#F97316" />
        </View>
      </View>

      {/* List */}
      <View className="p-4">
        {users.map((item: any) => (
          <View key={item.id} className="bg-background rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex flex-row items-center mb-1">
                  <Text className="block text-base font-semibold text-foreground">{item.username}</Text>
                  <View className={`ml-2 px-2 py-1 rounded-full ${item.role === 'admin' ? 'bg-primary bg-opacity-10' : 'bg-blue-50'}`}>
                    <Text className={`block text-xs ${item.role === 'admin' ? 'text-primary' : 'text-blue-500'}`}>
                      {item.role === 'admin' ? '管理员' : '普通用户'}
                    </Text>
                  </View>
                  {item.mustChangePassword && (
                    <View className="ml-2 px-2 py-1 rounded-full bg-amber-50">
                      <Text className="block text-xs text-amber-500">待改密</Text>
                    </View>
                  )}
                </View>
                <Text className="block text-sm text-muted-foreground">
                  创建时间：{item.createdAt || '--'}
                </Text>
              </View>
              {item.username !== 'admin' && item.id !== currentUser.id && (
                <View
                  className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center"
                  onClick={() => handleDelete(item.id, item.username)}
                >
                  <Trash2 size={14} color="#EF4444" />
                </View>
              )}
            </View>
          </View>
        ))}
        {users.length === 0 && (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-muted-foreground">暂无用户</Text>
          </View>
        )}
      </View>

      {/* Add User Dialog */}
      {showAdd && (
        <View className="fixed inset-0 flex items-end justify-center bg-black bg-opacity-50 z-50">
          <View className="bg-background rounded-t-2xl p-6 w-full">
            <Text className="block text-lg font-bold text-foreground mb-4">新增用户</Text>
            <View className="mb-3">
              <Text className="block text-sm text-muted-foreground mb-1">用户名 *</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="请输入用户名" value={newUsername} onInput={(e) => setNewUsername(e.detail.value)} />
              </View>
            </View>
            <View className="mb-3">
              <Text className="block text-sm text-muted-foreground mb-1">密码 *</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" type={'password' as any} placeholder="请输入密码（至少4位）" value={newPassword} onInput={(e) => setNewPassword(e.detail.value)} />
              </View>
            </View>
            <View className="mb-4">
              <Text className="block text-sm text-muted-foreground mb-1">角色</Text>
              <View className="flex flex-row gap-2">
                <View
                  className={`px-4 py-2 rounded-xl ${newRole === 'admin' ? 'bg-primary' : 'bg-muted'}`}
                  onClick={() => setNewRole('admin')}
                >
                  <Text className={`block text-sm ${newRole === 'admin' ? 'text-primary-foreground' : 'text-foreground'}`}>管理员</Text>
                </View>
                <View
                  className={`px-4 py-2 rounded-xl ${newRole === 'user' ? 'bg-blue-500' : 'bg-muted'}`}
                  onClick={() => setNewRole('user')}
                >
                  <Text className={`block text-sm ${newRole === 'user' ? 'text-white' : 'text-foreground'}`}>普通用户</Text>
                </View>
              </View>
            </View>
            <View className="flex flex-row gap-3">
              <View className="flex-1">
                <Button className="w-full rounded-xl py-2 border border-border" variant="outline" onClick={() => { setShowAdd(false); setNewUsername(''); setNewPassword('') }}>
                  <Text>取消</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button className="w-full bg-primary text-primary-foreground rounded-xl py-2" onClick={handleAddUser} disabled={adding}>
                  <Text className="text-primary-foreground">{adding ? '创建中...' : '创建'}</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
