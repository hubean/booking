import { Injectable } from '@nestjs/common'
import { db } from '@/db'
import { timeSlots } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

@Injectable()
export class TimeSlotService {
  // 默认时段：09:00~18:00
  private defaultSlots = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00',
  ]

  async findAvailable(serviceId: number, date: string) {
    // 查询已有的时段记录
    const existing = await db
      .select()
      .from(timeSlots)
      .where(and(eq(timeSlots.serviceId, serviceId), eq(timeSlots.date, date)))

    const existingMap = new Map(existing.map((s) => [s.startTime, s]))

    // 判断是否为今天，过去时段标记不可用
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentHour = now.getHours()

    return this.defaultSlots.map((startTime) => {
      const slot = existingMap.get(startTime)
      const hour = parseInt(startTime.split(':')[0], 10)
      const isPast = date === today && hour <= currentHour
      const available = isPast ? false : (slot ? slot.bookedCount < slot.maxCapacity : true)

      return {
        startTime,
        maxCapacity: slot?.maxCapacity ?? 1,
        bookedCount: slot?.bookedCount ?? 0,
        available,
      }
    })
  }
}
