import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Calendar, Phone, Info, Settings, Camera, Pencil } from 'lucide-react-taro'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface UserInfo {
  nickname: string
  phone: string
  totalAppointments: number
  pendingAppointments: number
}

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    nickname: '小初',
    phone: '138****0000',
    totalAppointments: 0,
    pendingAppointments: 0,
  })
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const res = await Network.request({ url: '/api/appointments' })
      console.log('[Profile] fetchUserStats:', res.data)
      const data = res.data?.data ?? []
      if (Array.isArray(data)) {
        setUserInfo((prev) => ({
          ...prev,
          totalAppointments: data.length,
          pendingAppointments: data.filter((a: { status: string }) => a.status === 'pending').length,
        }))
      }
    } catch (err) {
      console.error('[Profile] fetchUserStats error:', err)
    }
  }

  const handleEditName = () => {
    setEditName(userInfo.nickname)
    setShowNameDialog(true)
  }

  const saveName = () => {
    if (editName.trim()) {
      setUserInfo((prev) => ({ ...prev, nickname: editName.trim() }))
    }
    setShowNameDialog(false)
  }

  const goAppointments = () => {
    Taro.switchTab({ url: '/pages/appointments/index' })
  }

  const avatarLetter = userInfo.nickname.charAt(0)

  return (
    <View className="flex flex-col h-full bg-background">
      <View className="flex-1 overflow-y-auto">
        {/* 用户信息区 */}
        <View className="bg-surface px-4 pt-6 pb-5 flex items-center gap-4">
          <View className="relative">
            <View className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Text className="text-xl font-bold text-primary-foreground">{avatarLetter}</Text>
            </View>
            <View className="absolute bottom-0 right-0 w-5 h-5 bg-card rounded-full flex items-center justify-center border border-border">
              <Camera size={10} color="#F97316" />
            </View>
          </View>
          <View className="flex-1 min-w-0">
            <View className="flex items-center gap-2">
              <Text className="text-lg font-semibold text-foreground">{userInfo.nickname}</Text>
              <View onClick={handleEditName}>
                <Pencil size={14} color="#6B7280" />
              </View>
            </View>
            <Text className="block text-sm text-muted-foreground mt-1">{userInfo.phone}</Text>
          </View>
        </View>

        {/* 预约统计卡片 */}
        <View className="mx-4 mt-4">
          <View className="bg-card rounded-2xl shadow-card p-4 flex items-center">
            <View className="flex-1 flex flex-col items-center" onClick={goAppointments}>
              <Text className="block text-2xl font-bold text-foreground">{userInfo.totalAppointments}</Text>
              <Text className="block text-xs text-muted-foreground mt-1">总预约</Text>
            </View>
            <View className="w-px h-8 bg-border" />
            <View className="flex-1 flex flex-col items-center" onClick={goAppointments}>
              <Text className="block text-2xl font-bold text-primary">{userInfo.pendingAppointments}</Text>
              <Text className="block text-xs text-muted-foreground mt-1">待服务</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View className="mx-4 mt-4">
          <View className="bg-card rounded-2xl shadow-card overflow-hidden">
            <View
              className="flex items-center px-4 py-4 border-b border-border"
              onClick={goAppointments}
            >
              <View className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center mr-3">
                <Calendar size={16} color="#F97316" />
              </View>
              <Text className="flex-1 text-sm text-foreground">我的预约</Text>
              <Text className="text-sm text-muted-foreground">›</Text>
            </View>
            <View className="flex items-center px-4 py-4 border-b border-border">
              <View className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                <Phone size={16} color="#22c55e" />
              </View>
              <Text className="flex-1 text-sm text-foreground">联系客服</Text>
              <Text className="text-sm text-muted-foreground">›</Text>
            </View>
            <View className="flex items-center px-4 py-4 border-b border-border">
              <View className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center mr-3">
                <Info size={16} color="#F97316" />
              </View>
              <Text className="flex-1 text-sm text-foreground">关于我们</Text>
              <Text className="text-sm text-muted-foreground">›</Text>
            </View>
            <View className="flex items-center px-4 py-4">
              <View className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mr-3">
                <Settings size={16} color="#6B7280" />
              </View>
              <Text className="flex-1 text-sm text-foreground">设置</Text>
              <Text className="text-sm text-muted-foreground">›</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 编辑昵称弹窗 */}
      {showNameDialog && (
        <View
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View className="w-full bg-card rounded-t-2xl p-6 pb-8">
            <Text className="block text-base font-semibold text-foreground mb-4">修改昵称</Text>
            <Input
              className="bg-muted border-none rounded-2xl mb-6"
              placeholder="请输入昵称"
              value={editName}
              onInput={(e) => setEditName(e.detail.value)}
              focus
            />
            <View className="flex gap-3">
              <View
                className="flex-1 bg-muted rounded-xl py-3 flex items-center justify-center"
                onClick={() => setShowNameDialog(false)}
              >
                <Text className="text-sm font-medium text-foreground">取消</Text>
              </View>
              <View
                className="flex-1 bg-primary rounded-xl py-3 flex items-center justify-center"
                onClick={saveName}
              >
                <Text className="text-sm font-medium text-primary-foreground">保存</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default ProfilePage
