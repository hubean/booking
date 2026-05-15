import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { CircleCheck } from 'lucide-react-taro'

const BookingSuccessPage = () => {
  const goAppointments = () => {
    Taro.switchTab({ url: '/pages/appointments/index' })
  }

  const goHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  return (
    <View className="flex flex-col h-full bg-background">
      <View className="flex-1 overflow-y-auto pt-12 px-4">
        {/* 成功图标 */}
        <View className="flex items-center justify-center mb-4">
          <CircleCheck size={64} color="#22c55e" />
        </View>

        {/* 成功标题 */}
        <Text className="block text-2xl font-bold text-foreground text-center mb-8">预约成功！</Text>

        {/* 预约摘要卡片 */}
        <View className="bg-card rounded-2xl shadow-card p-5">
          <View className="flex justify-between items-center py-3 border-b border-border">
            <Text className="text-sm text-muted-foreground">服务名称</Text>
            <Text className="text-sm font-medium text-foreground">预约服务</Text>
          </View>
          <View className="flex justify-between items-center py-3 border-b border-border">
            <Text className="text-sm text-muted-foreground">预约状态</Text>
            <Text className="text-sm font-medium text-primary">待服务</Text>
          </View>
          <View className="flex justify-between items-center py-3">
            <Text className="text-sm text-muted-foreground">温馨提示</Text>
            <Text className="text-sm text-muted-foreground">请准时到店</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="mt-8 flex flex-col gap-3">
          <View
            className="w-full bg-primary rounded-2xl py-3 flex items-center justify-center"
            onClick={goAppointments}
          >
            <Text className="text-base font-semibold text-primary-foreground">查看我的预约</Text>
          </View>
          <View
            className="w-full bg-card border border-border rounded-2xl py-3 flex items-center justify-center"
            onClick={goHome}
          >
            <Text className="text-base font-semibold text-foreground">返回首页</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default BookingSuccessPage
