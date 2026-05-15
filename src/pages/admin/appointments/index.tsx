import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import { ArrowLeft } from 'lucide-react-taro'

function getAdminHeaders() {
  const token = Taro.getStorageSync('admin_token')
  return { Authorization: `Bearer ${token}` }
}

const STATUS_MAP = {
  pending: { label: '待服务', color: 'text-amber-500', bg: 'bg-amber-50' },
  completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { label: '已取消', color: 'text-gray-400', bg: 'bg-gray-50' },
}

const TAB_LIST = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待服务' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => { loadAppointments() }, [activeTab])

  const loadAppointments = async () => {
    try {
      const url = activeTab ? `/api/appointments/admin/list?status=${activeTab}` : '/api/appointments/admin/list'
      const res = await Network.request({ url, header: getAdminHeaders() })
      console.log('[AdminAppointments] load:', res.data)
      setAppointments(res.data?.data || [])
    } catch (err) {
      console.error('[AdminAppointments] load error:', err)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await Network.request({
        url: `/api/appointments/admin/${id}/status`,
        method: 'PUT',
        data: { status },
        header: getAdminHeaders(),
      })
      Taro.showToast({ title: '操作成功', icon: 'success' })
      loadAppointments()
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 7) return phone
    return phone.slice(0, 3) + '****' + phone.slice(-4)
  }

  return (
    <View className="flex flex-col min-h-full bg-muted">
      {/* Header */}
      <View className="bg-background px-4 py-3 shadow-sm flex flex-row items-center">
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={20} color="#18181B" />
        </View>
        <Text className="block text-lg font-bold text-foreground ml-3">预约管理</Text>
      </View>

      {/* Tabs */}
      <View className="bg-background px-4 py-3 flex flex-row gap-2">
        {TAB_LIST.map((tab) => (
          <View
            key={tab.value}
            className={`px-4 py-2 rounded-full ${activeTab === tab.value ? 'bg-primary' : 'bg-muted'}`}
            onClick={() => setActiveTab(tab.value)}
          >
            <Text className={`block text-sm ${activeTab === tab.value ? 'text-primary-foreground' : 'text-foreground'}`}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      {/* List */}
      <View className="p-4">
        {appointments.map((item: any) => {
          const st = STATUS_MAP[item.status] || STATUS_MAP.pending
          return (
            <View key={item.id} className="bg-background rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="block text-base font-semibold text-foreground">{item.serviceName || `服务#${item.serviceId}`}</Text>
                <View className={`px-2 py-1 rounded-full ${st.bg}`}>
                  <Text className={`block text-xs font-medium ${st.color}`}>{st.label}</Text>
                </View>
              </View>
              <View className="flex flex-row items-center mb-1">
                <Text className="block text-sm text-muted-foreground">
                  {item.appointmentDate} {item.timeSlot}
                </Text>
              </View>
              <View className="flex flex-row items-center mb-1">
                <Text className="block text-sm text-muted-foreground">
                  {item.contactName} {maskPhone(item.contactPhone)}
                </Text>
              </View>
              <Text className="block text-base font-bold text-primary mb-3">
                ¥{item.servicePrice ? item.servicePrice / 100 : '--'}
              </Text>
              {item.status === 'pending' && (
                <View className="flex flex-row gap-2">
                  <View className="flex-1">
                    <Button className="w-full rounded-xl py-1 bg-green-500" onClick={() => handleStatusChange(item.id, 'completed')}>
                      <Text className="text-white text-sm">完成</Text>
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button className="w-full rounded-xl py-1 bg-gray-300" onClick={() => handleStatusChange(item.id, 'cancelled')}>
                      <Text className="text-gray-700 text-sm">取消</Text>
                    </Button>
                  </View>
                </View>
              )}
            </View>
          )
        })}
        {appointments.length === 0 && (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-muted-foreground">暂无预约记录</Text>
          </View>
        )}
      </View>
    </View>
  )
}
