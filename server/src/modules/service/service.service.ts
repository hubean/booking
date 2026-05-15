import { Injectable } from '@nestjs/common'
import { db } from '@/db'
import { services } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

@Injectable()
export class ServiceService {
  async findAll(category?: string) {
    const conditions = [eq(services.status, 'active')]
    if (category) {
      conditions.push(eq(services.category, category as 'beauty' | 'fitness' | 'food'))
    }
    return db.select().from(services).where(and(...conditions))
  }

  async findOne(id: number) {
    const result = await db.select().from(services).where(eq(services.id, id))
    return result[0] ?? null
  }
}
