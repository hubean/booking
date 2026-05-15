import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface AppointmentItem {
  id: number
  serviceId: number
  serviceName: string
  servicePrice: number
  appointmentDate: string
  timeSlot: string
  contactName: string
  contactPhone: string
  status: string
  createdAt: string
}

const TABS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待服务' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const STATUS_MAP: Record<string, { text: string; colorClass: string }> = {
  pending: { text: '待服务', colorClass: 'text-primary' },
  completed: { text: '已完成', colorClass: 'text-success' },
  cancelled: { text: '已取消', colorClass: 'text-muted-foreground' },
}

const AppointmentsPage = () => {
  const [activeTab, setActiveTab] = useState('')
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [activeTab])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const url = activeTab ? `/api/appointments?status=${activeTab}` : '/api/appointments'
      const res = await Network.request({ url })
      console.log('[Appointments] fetchAppointments:', url, res.data)
      const data = res.data?.data ?? []
      setAppointments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Appointments] fetchAppointments error:', err)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: number) => {
    const confirmResult = await Taro.showModal({
      title: '取消预约',
      content: '确定要取消这个预约吗？',
    })
    if (!confirmResult.confirm) return

    try {
      const res = await Network.request({
        url: `/api/appointments/${id}/cancel`,
        method: 'PUT',
      })
      console.log('[Appointments] cancel:', res.data)
      const data = res.data
      if (data?.code === 200) {
        Taro.showToast({ title: '取消成功', icon: 'success' })
        fetchAppointments()
      } else {
        Taro.showToast({ title: data?.msg || '取消失败', icon: 'none' })
      }
    } catch (err) {
      console.error('[Appointments] cancel error:', err)
      Taro.showToast({ title: '取消失败', icon: 'none' })
    }
  }

  const formatPrice = (priceInFen: number) => (priceInFen / 100).toFixed(0)

  return (
    <View className="flex flex-col h-full bg-background">
      {/* Tab 切换栏 */}
      <View className="bg-surface sticky top-0 z-30 flex px-4 border-b border-border">
        {TABS.map((tab) => (
          <View
            key={tab.key}
            className={`flex-1 py-3 flex items-center justify-center relative ${
              activeTab === tab.key ? 'border-b-2 border-primary' : ''
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      {/* 预约记录列表 */}
      <View className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
        {loading ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-sm text-muted-foreground">加载中...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-sm text-muted-foreground">暂无预约记录</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {appointments.map((item) => {
              const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending
              return (
                <View key={item.id} className="bg-card rounded-2xl shadow-card p-4">
                  <View className="flex items-start justify-between">
                    <Text className="block text-base font-semibold text-foreground">{item.serviceName}</Text>
                    <Text className={`text-xs font-medium ${statusInfo.colorClass}`}>
                      {statusInfo.text}
                    </Text>
                  </View>
                  <View className="mt-2">
                    <Text className="block text-xs text-muted-foreground">
                      {item.appointmentDate} {item.timeSlot}
                    </Text>
                  </View>
                  <View className="flex items-center justify-between mt-3">
                    <Text className="text-sm font-bold text-foreground">¥{formatPrice(item.servicePrice)}</Text>
                    {item.status === 'pending' && (
                      <View
                        className="px-3 py-1 rounded-lg border border-destructive"
                        onClick={() => handleCancel(item.id)}
                      >
                        <Text className="text-xs text-destructive">取消预约</Text>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}

export default AppointmentsPage
