import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface ServiceItem {
  id: number
  name: string
  description: string
  price: number
  duration: number
  imageUrl: string
  category: string
  categoryId: number | null
  status: string
}

interface CategoryItem {
  id: number
  name: string
  sortOrder: number
}

const IndexPage = () => {
  const [activeCategory, setActiveCategory] = useState('')
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchServices()
  }, [activeCategory])

  const fetchCategories = async () => {
    try {
      const res = await Network.request({ url: '/api/categories/active' })
      console.log('[Index] fetchCategories:', res.data)
      const data = res.data?.data ?? []
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Index] fetchCategories error:', err)
    }
  }

  const fetchServices = async () => {
    setLoading(true)
    try {
      const url = activeCategory ? `/api/services?categoryId=${activeCategory}` : '/api/services'
      const res = await Network.request({ url })
      console.log('[Index] fetchServices:', url, res.data)
      const data = res.data?.data ?? []
      setServices(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Index] fetchServices error:', err)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const goToDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/service-detail/index?id=${id}` })
  }

  const goToBooking = (id: number) => {
    Taro.navigateTo({ url: `/pages/booking/index?serviceId=${id}` })
  }

  const formatPrice = (priceInFen: number) => {
    return (priceInFen / 100).toFixed(0)
  }

  return (
    <View className="flex flex-col h-full bg-background">
      {/* 分类筛选标签栏 */}
      <View className="bg-surface sticky top-0 z-30 px-4 pt-3 pb-2 flex gap-2 overflow-x-auto">
        <View
          className={`px-4 py-1 rounded-full border flex-shrink-0 ${
            activeCategory === ''
              ? 'bg-primary border-primary'
              : 'bg-surface border-border'
          }`}
          onClick={() => setActiveCategory('')}
        >
          <Text className={`text-sm font-medium ${activeCategory === '' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            全部
          </Text>
        </View>
        {categories.map((cat) => (
          <View
            key={cat.id}
            className={`px-4 py-1 rounded-full border flex-shrink-0 ${
              activeCategory === String(cat.id)
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
            onClick={() => setActiveCategory(String(cat.id))}
          >
            <Text className={`text-sm font-medium ${activeCategory === String(cat.id) ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              {cat.name}
            </Text>
          </View>
        ))}
      </View>

      {/* 服务项目卡片列表 */}
      <View className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-sm text-muted-foreground">加载中...</Text>
          </View>
        ) : services.length === 0 ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-sm text-muted-foreground">暂无服务项目</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {services.map((item) => (
              <View
                key={item.id}
                className="bg-card rounded-2xl shadow-card p-3 flex gap-3"
                onClick={() => goToDetail(item.id)}
              >
                <Image
                  src={item.imageUrl}
                  className="w-24 h-24 rounded-xl flex-shrink-0"
                  mode="aspectFill"
                />
                <View className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <View>
                    <Text className="block text-base font-semibold text-foreground truncate">{item.name}</Text>
                    <Text className="block text-xs text-muted-foreground mt-1 truncate">{item.description}</Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <Text className="text-lg font-bold text-primary">¥{formatPrice(item.price)}</Text>
                    <View
                      className="bg-primary rounded-xl px-4 py-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        goToBooking(item.id)
                      }}
                    >
                      <Text className="text-xs font-semibold text-primary-foreground">预约</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage
