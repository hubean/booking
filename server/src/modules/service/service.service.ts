import { Injectable } from '@nestjs/common'
import { db } from '@/db'
import { services } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

@Injectable()
export class ServiceService {
  async findAll(category?: string, includeInactive = false) {
    const conditions = includeInactive ? [] : [eq(services.status, 'active')]
    if (category) {
      conditions.push(eq(services.category, category as 'beauty' | 'fitness' | 'food'))
    }
    return db.select().from(services).where(conditions.length > 0 ? and(...conditions) : undefined)
  }

  async findOne(id: number) {
    const result = await db.select().from(services).where(eq(services.id, id))
    return result[0] ?? null
  }

  async create(data: { name: string; description: string; price: number; duration: number; imageUrl: string; category: string }) {
    const result = await db.insert(services).values(data as any).returning()
    return result[0]
  }

  async update(id: number, data: Partial<{ name: string; description: string; price: number; duration: number; imageUrl: string; category: string; status: string }>) {
    const result = await db.update(services).set(data as any).where(eq(services.id, id)).returning()
    return result[0] ?? null
  }

  async remove(id: number) {
    await db.delete(services).where(eq(services.id, id))
  }
}
