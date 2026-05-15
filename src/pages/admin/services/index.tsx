import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { Plus, ArrowLeft, Pencil, Trash2 } from 'lucide-react-taro'
import { useAuthGuard } from '@/hooks/use-auth-guard'

function getAdminHeaders() {
  const token = Taro.getStorageSync('admin_token')
  return { Authorization: `Bearer ${token}` }
}

const CATEGORIES = [
  { value: 'beauty', label: '美业' },
  { value: 'fitness', label: '健身' },
  { value: 'food', label: '餐饮' },
]

export default function AdminServices() {
  useAuthGuard()
  const [services, setServices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', price: '', duration: '', imageUrl: '', category: 'beauty', status: 'active',
  })

  useEffect(() => { loadServices() }, [])

  const loadServices = async () => {
    try {
      const res = await Network.request({ url: '/api/services?all=true', header: getAdminHeaders() })
      console.log('[AdminServices] load:', res.data)
      setServices(res.data?.data || [])
    } catch (err) {
      console.error('[AdminServices] load error:', err)
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.category) {
      Taro.showToast({ title: '请填写必填项', icon: 'none' })
      return
    }
    const data = {
      name: form.name,
      description: form.description,
      price: Math.round(Number(form.price) * 100), // 元转分
      duration: Number(form.duration) || 60,
      imageUrl: form.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop',
      category: form.category,
    }

    try {
      if (editingId) {
        await Network.request({
          url: `/api/services/${editingId}`,
          method: 'PUT',
          data: { ...data, status: form.status },
          header: getAdminHeaders(),
        })
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await Network.request({
          url: '/api/services',
          method: 'POST',
          data,
          header: getAdminHeaders(),
        })
        Taro.showToast({ title: '创建成功', icon: 'success' })
      }
      setShowForm(false)
      resetForm()
      loadServices()
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price / 100),
      duration: String(item.duration),
      imageUrl: item.imageUrl,
      category: item.category,
      status: item.status,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    const { confirm } = await Taro.showModal({ title: '确认删除', content: '删除后不可恢复，确定？' })
    if (!confirm) return
    try {
      await Network.request({
        url: `/api/services/${id}`,
        method: 'DELETE',
        header: getAdminHeaders(),
      })
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadServices()
    } catch (err) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ name: '', description: '', price: '', duration: '', imageUrl: '', category: 'beauty', status: 'active' })
  }

  return (
    <View className="flex flex-col min-h-full bg-muted">
      {/* Header */}
      <View className="bg-background px-4 py-3 shadow-sm flex flex-row items-center">
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={20} color="#18181B" />
        </View>
        <Text className="block text-lg font-bold text-foreground ml-3">服务管理</Text>
        <View className="flex-1" />
        <View onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus size={22} color="#F97316" />
        </View>
      </View>

      {/* List */}
      <View className="p-4">
        {services.map((item: any) => (
          <View key={item.id} className="bg-background rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <View className="flex flex-row items-center mb-1">
                  <Text className="block text-base font-semibold text-foreground">{item.name}</Text>
                  {item.status === 'inactive' && (
                    <View className="ml-2 bg-muted px-2 py-1 rounded-full">
                      <Text className="block text-xs text-muted-foreground">已下架</Text>
                    </View>
                  )}
                </View>
                <Text className="block text-sm text-muted-foreground mb-1">
                  {CATEGORIES.find(c => c.value === item.category)?.label} · {item.duration}分钟
                </Text>
                <Text className="block text-lg font-bold text-primary">¥{item.price / 100}</Text>
              </View>
              <View className="flex flex-row gap-2">
                <View className="w-8 h-8 rounded-lg bg-muted items-center justify-center" onClick={() => handleEdit(item)}>
                  <Pencil size={14} color="#6B7280" />
                </View>
                <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center" onClick={() => handleDelete(item.id)}>
                  <Trash2 size={14} color="#EF4444" />
                </View>
              </View>
            </View>
          </View>
        ))}
        {services.length === 0 && (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-muted-foreground">暂无服务项目</Text>
          </View>
        )}
      </View>

      {/* Form Dialog */}
      {showForm && (
        <View className="fixed inset-0 flex items-end justify-center bg-black bg-opacity-50 z-50">
          <View className="bg-background rounded-t-2xl p-6 w-full max-h-[80vh] overflow-y-auto">
            <Text className="block text-lg font-bold text-foreground mb-4">
              {editingId ? '编辑服务' : '新增服务'}
            </Text>
            <View className="mb-3">
              <Text className="block text-sm text-muted-foreground mb-1">服务名称 *</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="请输入服务名称" value={form.name} onInput={(e) => setForm({ ...form, name: e.detail.value })} />
              </View>
            </View>
            <View className="mb-3">
              <Text className="block text-sm text-muted-foreground mb-1">分类 *</Text>
              <View className="flex flex-row gap-2">
                {CATEGORIES.map((cat) => (
                  <View
                    key={cat.value}
                    className={`px-4 py-2 rounded-xl ${form.category === cat.value ? 'bg-primary' : 'bg-muted'}`}
                    onClick={() => setForm({ ...form, category: cat.value })}
                  >
                    <Text className={`block text-sm ${form.category === cat.value ? 'text-primary-foreground' : 'text-foreground'}`}>{cat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className="mb-3">
              <Text className="block text-sm text-muted-foreground mb-1">价格（元） *</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" type="digit" placeholder="请输入价格" value={form.price} onInput={(e) => setForm({ ...form, price: e.detail.value })} />
              </View>
            </View>
            <View className="mb-3">
              <Text className="block text-sm text-muted-foreground mb-1">时长（分钟）</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" type="number" placeholder="60" value={form.duration} onInput={(e) => setForm({ ...form, duration: e.detail.value })} />
              </View>
            </View>
            <View className="mb-3">
              <Text className="block text-sm text-muted-foreground mb-1">描述</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="服务描述" value={form.description} onInput={(e) => setForm({ ...form, description: e.detail.value })} />
              </View>
            </View>
            {editingId && (
              <View className="mb-3">
                <Text className="block text-sm text-muted-foreground mb-1">状态</Text>
                <View className="flex flex-row gap-2">
                  <View className={`px-4 py-2 rounded-xl ${form.status === 'active' ? 'bg-green-500' : 'bg-muted'}`} onClick={() => setForm({ ...form, status: 'active' })}>
                    <Text className={`block text-sm ${form.status === 'active' ? 'text-white' : 'text-foreground'}`}>上架</Text>
                  </View>
                  <View className={`px-4 py-2 rounded-xl ${form.status === 'inactive' ? 'bg-red-500' : 'bg-muted'}`} onClick={() => setForm({ ...form, status: 'inactive' })}>
                    <Text className={`block text-sm ${form.status === 'inactive' ? 'text-white' : 'text-foreground'}`}>下架</Text>
                  </View>
                </View>
              </View>
            )}
            <View className="flex flex-row gap-3 mt-4">
              <View className="flex-1">
                <Button className="w-full rounded-xl py-2 border border-border" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                  <Text>取消</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button className="w-full bg-primary text-primary-foreground rounded-xl py-2" onClick={handleSubmit}>
                  <Text className="text-primary-foreground">{editingId ? '更新' : '创建'}</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
