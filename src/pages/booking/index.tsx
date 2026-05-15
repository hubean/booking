import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { Scissors } from 'lucide-react-taro'

interface ServiceInfo {
  id: number
  name: string
  price: number
  duration: number
}

interface TimeSlotItem {
  startTime: string
  maxCapacity: number
  bookedCount: number
  available: boolean
}

const BookingPage = () => {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null)
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedTime, setSelectedTime] = useState('')
  const [dates, setDates] = useState<Array<{ weekday: string; day: string; fullDate: string }>>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlotItem[]>([])
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  useEffect(() => {
    // 从"我的"页面读取用户信息作为默认联系人
    const nickname = Taro.getStorageSync('user_nickname') || ''
    const phone = Taro.getStorageSync('user_phone_raw') || ''
    if (nickname) setContactName(nickname)
    if (phone) setContactPhone(phone)

    const params = Taro.getCurrentInstance().router?.params
    const serviceId = params?.serviceId
    if (serviceId) fetchService(Number(serviceId))

    // 生成近7天日期
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dateList: Array<{ weekday: string; day: string; fullDate: string }> = []
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      dateList.push({
        weekday: weekDays[d.getDay()],
        day: d.getDate().toString(),
        fullDate: d.toISOString().slice(0, 10),
      })
    }
    setDates(dateList)
  }, [])

  useEffect(() => {
    if (dates.length > 0 && serviceInfo) {
      fetchTimeSlots(serviceInfo.id, dates[selectedDate].fullDate)
    }
  }, [selectedDate, serviceInfo])

  const fetchService = async (id: number) => {
    try {
      const res = await Network.request({ url: `/api/services/${id}` })
      console.log('[Booking] fetchService:', res.data)
      const data = res.data?.data
      if (data) setServiceInfo(data)
    } catch (err) {
      console.error('[Booking] fetchService error:', err)
    }
  }

  const fetchTimeSlots = async (serviceId: number, date: string) => {
    try {
      const res = await Network.request({
        url: `/api/time-slots?serviceId=${serviceId}&date=${date}`,
      })
      console.log('[Booking] fetchTimeSlots:', res.data)
      const data = res.data?.data
      if (Array.isArray(data)) {
        setTimeSlots(data)
        setSelectedTime('')
      }
    } catch (err) {
      console.error('[Booking] fetchTimeSlots error:', err)
    }
  }

  const handleSubmit = async () => {
    if (!serviceInfo || !selectedTime || !contactName || !contactPhone) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    try {
      const res = await Network.request({
        url: '/api/appointments',
        method: 'POST',
        data: {
          serviceId: serviceInfo.id,
          appointmentDate: dates[selectedDate].fullDate,
          timeSlot: selectedTime,
          contactName,
          contactPhone,
        },
      })
      console.log('[Booking] createAppointment:', res.data)
      const data = res.data
      if (data?.code === 200) {
        // 通知其他页面刷新数据
        Taro.eventCenter.trigger('appointment:changed')
        const params = [
          `serviceName=${encodeURIComponent(serviceInfo.name)}`,
          `date=${encodeURIComponent(dates[selectedDate].fullDate)}`,
          `timeSlot=${encodeURIComponent(selectedTime)}`,
          `contactName=${encodeURIComponent(contactName)}`,
        ].join('&')
        Taro.redirectTo({ url: `/pages/booking-success/index?${params}` })
      } else {
        Taro.showToast({ title: data?.msg || '预约失败', icon: 'none' })
      }
    } catch (err) {
      console.error('[Booking] createAppointment error:', err)
      Taro.showToast({ title: '预约失败，请重试', icon: 'none' })
    }
  }

  const formatPrice = (priceInFen: number) => (priceInFen / 100).toFixed(0)

  if (!serviceInfo) {
    return (
      <View className="flex items-center justify-center h-full bg-background">
        <Text className="block text-sm text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-background">
      <View className="flex-1 overflow-y-auto pb-28">
        {/* 已选服务信息卡片 */}
        <View className="mx-4 mt-4">
          <View className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-4">
            <View className="w-16 h-16 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
              <Scissors size={28} color="#F97316" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="block text-base font-semibold text-foreground">{serviceInfo.name}</Text>
              <Text className="block text-xs text-muted-foreground mt-1">
                专业服务 · 约{serviceInfo.duration}分钟
              </Text>
            </View>
            <Text className="text-lg font-bold text-primary flex-shrink-0">¥{formatPrice(serviceInfo.price)}</Text>
          </View>
        </View>

        {/* 选择日期 */}
        <View className="mt-6">
          <Text className="block text-base font-semibold text-foreground px-4 mb-3">选择日期</Text>
          <View className="flex gap-2 px-4 overflow-x-auto" style={{ whiteSpace: 'nowrap' }}>
            {dates.map((d, idx) => (
              <View
                key={idx}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl flex-shrink-0 ${
                  selectedDate === idx ? 'bg-primary' : 'bg-card'
                }`}
                onClick={() => setSelectedDate(idx)}
              >
                <Text className={`text-xs font-medium ${selectedDate === idx ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {d.weekday}
                </Text>
                <Text className={`text-base font-bold mt-1 ${selectedDate === idx ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {d.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 选择时段 */}
        <View className="mt-6">
          <Text className="block text-base font-semibold text-foreground px-4 mb-3">选择时段</Text>
          <View className="grid grid-cols-4 gap-2 px-4">
            {timeSlots.map((slot) => {
              const isSelected = selectedTime === slot.startTime
              const isDisabled = !slot.available
              return (
                <View
                  key={slot.startTime}
                  className={`flex items-center justify-center py-2 rounded-xl ${
                    isDisabled
                      ? 'bg-muted opacity-50'
                      : isSelected
                        ? 'bg-primary'
                        : 'bg-card border border-border'
                  }`}
                  onClick={() => {
                    if (!isDisabled) setSelectedTime(slot.startTime)
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isDisabled ? 'text-muted-foreground' : isSelected ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {slot.startTime}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        <View className="mt-6 px-4">
          <Text className="block text-base font-semibold text-foreground mb-3">联系信息</Text>
          <View className="mb-3">
            <Input
              className="bg-muted border-none rounded-2xl"
              placeholder="请输入姓名"
              value={contactName}
              onInput={(e) => setContactName(e.detail.value)}
            />
          </View>
          <Input
            className="bg-muted border-none rounded-2xl"
            placeholder="请输入手机号"
            type="number"
            maxlength={11}
            value={contactPhone}
            onInput={(e) => setContactPhone(e.detail.value)}
          />
        </View>
      </View>

      {/* 底部确认预约按钮 */}
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
          onClick={handleSubmit}
        >
          <Text className="text-base font-semibold text-primary-foreground">确认预约</Text>
        </View>
      </View>
    </View>
  )
}

export default BookingPage
