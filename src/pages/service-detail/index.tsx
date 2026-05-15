import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Clock } from 'lucide-react-taro'

interface ServiceDetail {
  id: number
  name: string
  description: string
  price: number
  duration: number
  imageUrl: string
  category: string
}

const ServiceDetailPage = () => {
  const [detail, setDetail] = useState<ServiceDetail | null>(null)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    const id = params?.id
    if (id) fetchDetail(Number(id))
  }, [])

  const fetchDetail = async (id: number) => {
    try {
      const res = await Network.request({ url: `/api/services/${id}` })
      console.log('[ServiceDetail] fetchDetail:', res.data)
      const data = res.data?.data
      if (data) setDetail(data)
    } catch (err) {
      console.error('[ServiceDetail] fetchDetail error:', err)
    }
  }

  const goToBooking = () => {
    if (!detail) return
    const nickname = Taro.getStorageSync('user_nickname') || ''
    const phone = Taro.getStorageSync('user_phone_raw') || ''
    if (!nickname || !phone) {
      Taro.showModal({
        title: '提示',
        content: '请先在【我的】页面完善个人信息后再预约',
        confirmText: '去完善',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({ url: '/pages/profile/index' })
          }
        },
      })
      return
    }
    Taro.navigateTo({ url: `/pages/booking/index?serviceId=${detail.id}` })
  }

  const formatPrice = (priceInFen: number) => (priceInFen / 100).toFixed(0)

  if (!detail) {
    return (
      <View className="flex items-center justify-center h-full bg-background">
        <Text className="block text-sm text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-background">
      {/* 封面大图 */}
      <View className="px-4 pt-2">
        <Image
          src={detail.imageUrl}
          className="w-full h-56 rounded-2xl"
          mode="aspectFill"
        />
      </View>

      {/* 服务基本信息 */}
      <View className="px-4 pt-5">
        <Text className="block text-xl font-bold text-foreground">{detail.name}</Text>
        <View className="flex items-center gap-3 mt-3">
          <Text className="text-xl font-bold text-primary">¥{formatPrice(detail.price)}</Text>
          <View className="inline-flex items-center px-3 py-1 rounded-full bg-muted">
            <Clock size={12} color="#6B7280" className="mr-1" />
            <Text className="text-xs font-medium text-muted-foreground">{detail.duration}分钟</Text>
          </View>
        </View>
      </View>

      {/* 分隔线 */}
      <View className="h-px bg-border mx-4 my-6" />

      {/* 服务详细描述 */}
      <View className="px-4 pb-24 flex-1 overflow-y-auto">
        <Text className="block text-base font-semibold text-foreground mb-3">服务详情</Text>
        <Text className="block text-sm text-foreground leading-relaxed">{detail.description}</Text>
      </View>

      {/* 底部预约按钮 */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          zIndex: 100,
        }}
      >
        <View
          className="w-full bg-primary rounded-2xl py-3 flex items-center justify-center"
          onClick={goToBooking}
        >
          <Text className="text-base font-semibold text-primary-foreground">立即预约</Text>
        </View>
      </View>
    </View>
  )
}

export default ServiceDetailPage
