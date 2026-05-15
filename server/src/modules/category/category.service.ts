import { Injectable } from '@nestjs/common'
import { db } from '../../db'
import { categories } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { success, fail } from '../../common/utils/response'

@Injectable()
export class CategoryService {
  async findAll() {
    const result = await db.select().from(categories).orderBy(desc(categories.sortOrder))
    return success(result)
  }

  async findActive() {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.status, 'active'))
      .orderBy(desc(categories.sortOrder))
    return success(result)
  }

  async create(data: { name: string; key: string; icon?: string; sortOrder?: number }) {
    const existing = await db.select().from(categories).where(eq(categories.key, data.key))
    if (existing.length > 0) {
      return fail(400, '分类标识已存在')
    }
    const result = await db.insert(categories).values({
      name: data.name,
      key: data.key,
      icon: data.icon || null,
      sortOrder: data.sortOrder ?? 0,
    }).returning()
    return success(result[0])
  }

  async update(id: number, data: { name?: string; key?: string; icon?: string; sortOrder?: number; status?: 'active' | 'inactive' }) {
    const existing = await db.select().from(categories).where(eq(categories.id, id))
    if (existing.length === 0) {
      return fail(404, '分类不存在')
    }
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.key !== undefined) updateData.key = data.key
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.status !== undefined) updateData.status = data.status

    const result = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning()
    return success(result[0])
  }

  async delete(id: number) {
    const existing = await db.select().from(categories).where(eq(categories.id, id))
    if (existing.length === 0) {
      return fail(404, '分类不存在')
    }
    await db.delete(categories).where(eq(categories.id, id))
    return success(null, '删除成功')
  }

  /** 批量更新排序 */
  async updateSortOrder(items: { id: number; sortOrder: number }[]) {
    for (const item of items) {
      await db.update(categories).set({ sortOrder: item.sortOrder }).where(eq(categories.id, item.id))
    }
    return success(null, '排序更新成功')
  }
}
