import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { ArrowLeft, Plus, ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react-taro'
import { useAuthGuard } from '@/hooks/use-auth-guard'

function getAdminHeaders() {
  const token = Taro.getStorageSync('admin_token')
  return { Authorization: `Bearer ${token}` }
}

export default function AdminCategories() {
  useAuthGuard()
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    try {
      const res = await Network.request({ url: '/api/categories', header: getAdminHeaders() })
      console.log('[AdminCategories] load:', res.data)
      setCategories(res.data?.data || [])
    } catch (err) {
      console.error('[AdminCategories] load error:', err)
    }
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }
    try {
      if (editingId) {
        await Network.request({
          url: `/api/categories/${editingId}`,
          method: 'PUT',
          data: { name: formName.trim() },
          header: getAdminHeaders(),
        })
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await Network.request({
          url: '/api/categories',
          method: 'POST',
          data: { name: formName.trim() },
          header: getAdminHeaders(),
        })
        Taro.showToast({ title: '创建成功', icon: 'success' })
      }
      setShowForm(false)
      setEditingId(null)
      setFormName('')
      loadCategories()
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setFormName(item.name)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    const { confirm } = await Taro.showModal({ title: '确认删除', content: '删除分类后，该分类下的服务将变为未分类，确定？' })
    if (!confirm) return
    try {
      await Network.request({
        url: `/api/categories/${id}`,
        method: 'DELETE',
        header: getAdminHeaders(),
      })
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadCategories()
    } catch (err) {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newOrder = categories.map((c: any) => c.sortOrder)
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    try {
      const orderedIds = categories.map((c: any) => c.id)
      const swapped = [...orderedIds]
      ;[swapped[index], swapped[index - 1]] = [swapped[index - 1], swapped[index]]
      await Network.request({
        url: '/api/categories/reorder',
        method: 'PUT',
        data: { orderedIds: swapped },
        header: getAdminHeaders(),
      })
      loadCategories()
    } catch (err) {
      Taro.showToast({ title: '排序失败', icon: 'none' })
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return
    const orderedIds = categories.map((c: any) => c.id)
    const swapped = [...orderedIds]
    ;[swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]]
    try {
      await Network.request({
        url: '/api/categories/reorder',
        method: 'PUT',
        data: { orderedIds: swapped },
        header: getAdminHeaders(),
      })
      loadCategories()
    } catch (err) {
      Taro.showToast({ title: '排序失败', icon: 'none' })
    }
  }

  return (
    <View className="flex flex-col min-h-full bg-muted">
      {/* Header */}
      <View className="bg-background px-4 py-3 shadow-sm flex flex-row items-center">
        <View onClick={() => Taro.navigateBack()}>
          <ArrowLeft size={20} color="#18181B" />
        </View>
        <Text className="block text-lg font-bold text-foreground ml-3">分类管理</Text>
        <View className="flex-1" />
        <View onClick={() => { setEditingId(null); setFormName(''); setShowForm(true) }}>
          <Plus size={22} color="#F97316" />
        </View>
      </View>

      {/* List */}
      <View className="p-4">
        {categories.map((item: any, index: number) => (
          <View key={item.id} className="bg-background rounded-xl p-4 mb-3 shadow-sm flex flex-row items-center">
            {/* Sort Controls */}
            <View className="flex flex-col mr-3 gap-1">
              <View
                className={`w-7 h-7 rounded-lg items-center justify-center ${index === 0 ? 'bg-muted opacity-40' : 'bg-muted'}`}
                onClick={() => handleMoveUp(index)}
              >
                <ChevronUp size={14} color="#6B7280" />
              </View>
              <View
                className={`w-7 h-7 rounded-lg items-center justify-center ${index === categories.length - 1 ? 'bg-muted opacity-40' : 'bg-muted'}`}
                onClick={() => handleMoveDown(index)}
              >
                <ChevronDown size={14} color="#6B7280" />
              </View>
            </View>
            {/* Info */}
            <View className="flex-1">
              <Text className="block text-base font-semibold text-foreground">{item.name}</Text>
            </View>
            {/* Actions */}
            <View className="flex flex-row gap-2">
              <View className="w-8 h-8 rounded-lg bg-muted items-center justify-center" onClick={() => handleEdit(item)}>
                <Pencil size={14} color="#6B7280" />
              </View>
              <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center" onClick={() => handleDelete(item.id)}>
                <Trash2 size={14} color="#EF4444" />
              </View>
            </View>
          </View>
        ))}
        {categories.length === 0 && (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-muted-foreground">暂无分类，点击右上角添加</Text>
          </View>
        )}
      </View>

      {/* Form Dialog */}
      {showForm && (
        <View className="fixed inset-0 flex items-end justify-center bg-black bg-opacity-50 z-50">
          <View className="bg-background rounded-t-2xl p-6 w-full">
            <Text className="block text-lg font-bold text-foreground mb-4">
              {editingId ? '编辑分类' : '新增分类'}
            </Text>
            <View className="mb-4">
              <Text className="block text-sm text-muted-foreground mb-1">分类名称 *</Text>
              <View className="bg-muted rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="请输入分类名称" value={formName} onInput={(e) => setFormName(e.detail.value)} />
              </View>
            </View>
            <View className="flex flex-row gap-3">
              <View className="flex-1">
                <Button className="w-full rounded-xl py-2 border border-border" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setFormName('') }}>
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
