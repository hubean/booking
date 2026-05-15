import { Injectable } from '@nestjs/common'
import { db } from '../../db'
import { services } from '../../db/schema'
import { eq, desc, and, SQL } from 'drizzle-orm'
import { success, fail } from '../../common/utils/response'

@Injectable()
export class ServiceService {
  /** 小程序端：列表查询（支持分类筛选，按排序字段降序） */
  async findAll(all?: boolean, categoryId?: number) {
    const conditions: SQL[] = []
    if (!all) {
      if (categoryId) {
        conditions.push(eq(services.categoryId, categoryId))
      }
    }
    const result = conditions.length > 0
      ? await db.select().from(services).where(and(...conditions)).orderBy(desc(services.sortOrder))
      : await db.select().from(services).orderBy(desc(services.sortOrder))
    return success(result)
  }

  /** 小程序端：详情查询 */
  async findOne(id: number) {
    const result = await db.select().from(services).where(eq(services.id, id))
    if (result.length === 0) {
      return fail(404, '服务不存在')
    }
    return success(result[0])
  }

  /** 管理端：新增服务 */
  async create(data: {
    name: string
    description: string
    price: number
    duration: number
    imageUrl?: string
    categoryId?: number
    sortOrder?: number
  }) {
    const result = await db.insert(services).values({
      name: data.name,
      description: data.description || '',
      price: data.price,
      duration: data.duration,
      imageUrl: data.imageUrl || '',
      categoryId: data.categoryId ?? 0,
      sortOrder: data.sortOrder ?? 0,
    } as any).returning()
    return success(result[0])
  }

  /** 管理端：更新服务 */
  async update(id: number, data: Record<string, unknown>) {
    const existing = await db.select().from(services).where(eq(services.id, id))
    if (existing.length === 0) {
      return fail(404, '服务不存在')
    }
    const result = await db.update(services).set(data).where(eq(services.id, id)).returning()
    return success(result[0])
  }

  /** 管理端：删除服务 */
  async remove(id: number) {
    const existing = await db.select().from(services).where(eq(services.id, id))
    if (existing.length === 0) {
      return fail(404, '服务不存在')
    }
    await db.delete(services).where(eq(services.id, id))
    return success(null, '删除成功')
  }

  /** 管理端：批量更新排序 */
  async updateSortOrder(items: { id: number; sortOrder: number }[]) {
    for (const item of items) {
      await db.update(services).set({ sortOrder: item.sortOrder }).where(eq(services.id, item.id))
    }
    return success(null, '排序更新成功')
  }
}
