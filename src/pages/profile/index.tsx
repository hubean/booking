import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Calendar, Phone, Info, Settings, Camera, Pencil, Shield, Lock } from 'lucide-react-taro'
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
    nickname: Taro.getStorageSync('user_nickname') || '',
    phone: Taro.getStorageSync('user_phone') || '',
    totalAppointments: 0,
    pendingAppointments: 0,
  })
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const hasNickname = !!userInfo.nickname
  const hasPhone = !!userInfo.phone

  useEffect(() => {
    fetchUserStats()
    const handleRefresh = () => fetchUserStats()
    Taro.eventCenter.on('appointment:changed', handleRefresh)
    const onShow = () => fetchUserStats()
    Taro.eventCenter.on('onShow', onShow)
    return () => {
      Taro.eventCenter.off('appointment:changed', handleRefresh)
      Taro.eventCenter.off('onShow', onShow)
    }
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

  const handleEditPhone = () => {
    // 电话已设置则不可修改
    if (hasPhone) return
    setEditPhone('')
    setShowPhoneDialog(true)
  }

  const saveName = () => {
    if (editName.trim()) {
      setUserInfo((prev) => ({ ...prev, nickname: editName.trim() }))
      Taro.setStorageSync('user_nickname', editName.trim())
    }
    setShowNameDialog(false)
  }

  const savePhone = () => {
    if (editPhone.trim()) {
      const masked = editPhone.trim().replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      setUserInfo((prev) => ({ ...prev, phone: masked }))
      Taro.setStorageSync('user_phone', masked)
      Taro.setStorageSync('user_phone_raw', editPhone.trim())
    }
    setShowPhoneDialog(false)
  }

  const goAdminLogin = () => {
    Taro.navigateTo({ url: '/pages/admin/login/index' })
  }

  const goAppointments = () => {
    Taro.switchTab({ url: '/pages/appointments/index' })
  }

  const avatarLetter = hasNickname ? userInfo.nickname.charAt(0) : '?'

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
            {/* 昵称行 */}
            <View className="flex items-center gap-2" onClick={handleEditName}>
              {hasNickname ? (
                <Text className="text-lg font-semibold text-foreground">{userInfo.nickname}</Text>
              ) : (
                <Text className="text-lg text-muted-foreground">请输入昵称</Text>
              )}
              <Pencil size={14} color="#6B7280" />
            </View>
            {/* 电话行 */}
            <View className="flex items-center gap-2 mt-1" onClick={handleEditPhone}>
              {hasPhone ? (
                <>
                  <Text className="text-sm text-muted-foreground">{userInfo.phone}</Text>
                  <Lock size={12} color="#9CA3AF" />
                </>
              ) : (
                <Text className="text-sm text-muted-foreground">请输入电话</Text>
              )}
            </View>
          </View>
        </View>

        {/* 预约统计卡片 */}
        <View className="mx-4 mt-4">
          <View className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-4">
            <View className="flex-1 flex flex-col items-center bg-muted rounded-xl py-3" onClick={goAppointments}>
              <Text className="block text-2xl font-bold text-foreground">{userInfo.totalAppointments}</Text>
              <Text className="block text-xs text-muted-foreground mt-1">总预约</Text>
            </View>
            <View className="flex-1 flex flex-col items-center bg-muted rounded-xl py-3" onClick={goAppointments}>
              <Text className="block text-2xl font-bold text-primary">{userInfo.pendingAppointments}</Text>
              <Text className="block text-xs text-muted-foreground mt-1">待服务</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View className="mx-4 mt-4">
          <View className="bg-card rounded-2xl shadow-card overflow-hidden">
            <View
              className="flex items-center px-4 py-4"
              onClick={goAppointments}
            >
              <View className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center mr-3">
                <Calendar size={16} color="#F97316" />
              </View>
              <Text className="flex-1 text-sm text-foreground">我的预约</Text>
              <Text className="text-sm text-muted-foreground">›</Text>
            </View>
            <View className="flex items-center px-4 py-4">
              <View className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                <Phone size={16} color="#22c55e" />
              </View>
              <Text className="flex-1 text-sm text-foreground">联系客服</Text>
              <Text className="text-sm text-muted-foreground">›</Text>
            </View>
            <View className="flex items-center px-4 py-4">
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
            <View className="flex items-center px-4 py-4" onClick={goAdminLogin}>
              <View className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center mr-3">
                <Shield size={16} color="#F97316" />
              </View>
              <Text className="flex-1 text-sm text-foreground">管理后台</Text>
              <Text className="text-sm text-muted-foreground">›</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 编辑昵称弹窗 */}
      {showNameDialog && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View className="w-full bg-card rounded-t-2xl p-6" style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>
            <Text className="block text-base font-semibold text-foreground mb-4">
              {hasNickname ? '修改昵称' : '输入昵称'}
            </Text>
            <Input
              className="bg-muted border-none rounded-2xl mb-6"
              placeholder="请输入昵称"
              value={editName}
              onInput={(e) => setEditName(e.detail.value)}
              focus
            />
            <View style={{ display: 'flex', gap: '12px' }}>
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

      {/* 编辑电话弹窗 */}
      {showPhoneDialog && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View className="w-full bg-card rounded-t-2xl p-6" style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>
            <Text className="block text-base font-semibold text-foreground mb-2">输入电话号码</Text>
            <Text className="block text-xs text-muted-foreground mb-4">电话号码保存后不可修改，请谨慎填写</Text>
            <Input
              className="bg-muted border-none rounded-2xl mb-6"
              placeholder="请输入手机号"
              type={'number' as never}
              maxlength={11}
              value={editPhone}
              onInput={(e) => setEditPhone(e.detail.value)}
              focus
            />
            <View style={{ display: 'flex', gap: '12px' }}>
              <View
                className="flex-1 bg-muted rounded-xl py-3 flex items-center justify-center"
                onClick={() => setShowPhoneDialog(false)}
              >
                <Text className="text-sm font-medium text-foreground">取消</Text>
              </View>
              <View
                className="flex-1 bg-primary rounded-xl py-3 flex items-center justify-center"
                onClick={savePhone}
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
