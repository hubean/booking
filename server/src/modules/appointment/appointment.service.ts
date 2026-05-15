import { Injectable } from '@nestjs/common'
import { db } from '@/db'
import { appointments, services, timeSlots } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// 手机号脱敏
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

@Injectable()
export class AppointmentService {
  async create(data: {
    serviceId: number
    appointmentDate: string
    timeSlot: string
    contactName: string
    contactPhone: string
  }) {
    // 1. 校验服务存在且活跃
    const serviceResult = await db.select().from(services).where(eq(services.id, data.serviceId))
    const service = serviceResult[0]
    if (!service || service.status !== 'active') {
      return { error: { code: 404, msg: '服务不存在' } }
    }

    // 2. 校验日期不早于今天
    const today = new Date().toISOString().slice(0, 10)
    if (data.appointmentDate < today) {
      return { error: { code: 400, msg: '预约日期不能早于今天' } }
    }

    // 3. 校验时段未被约满（懒生成时段）
    const slotResult = await db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.serviceId, data.serviceId),
          eq(timeSlots.date, data.appointmentDate),
          eq(timeSlots.startTime, data.timeSlot),
        ),
      )
    const slot = slotResult[0]

    if (slot && slot.bookedCount >= slot.maxCapacity) {
      return { error: { code: 400, msg: '该时段已约满' } }
    }

    // 4. 创建预约记录
    const insertResult = await db.insert(appointments).values({
      serviceId: data.serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      appointmentDate: data.appointmentDate,
      timeSlot: data.timeSlot,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      status: 'pending',
    }).returning()

    const newAppointment = insertResult[0]

    // 5. 更新时段 bookedCount
    if (slot) {
      await db
        .update(timeSlots)
        .set({ bookedCount: slot.bookedCount + 1 })
        .where(eq(timeSlots.id, slot.id))
    } else {
      // 懒生成时段
      await db.insert(timeSlots).values({
        serviceId: data.serviceId,
        date: data.appointmentDate,
        startTime: data.timeSlot,
        maxCapacity: 1,
        bookedCount: 1,
      })
    }

    // 6. 返回（手机号脱敏）
    return {
      data: {
        id: newAppointment.id,
        serviceId: data.serviceId,
        serviceName: service.name,
        servicePrice: service.price,
        appointmentDate: data.appointmentDate,
        timeSlot: data.timeSlot,
        contactName: data.contactName,
        contactPhone: maskPhone(data.contactPhone),
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    }
  }

  async findAll(status?: string) {
    let list
    if (status) {
      list = await db.select().from(appointments).where(eq(appointments.status, status as 'pending' | 'completed' | 'cancelled')).orderBy(desc(appointments.createdAt))
    } else {
      list = await db.select().from(appointments).orderBy(desc(appointments.createdAt))
    }

    return list.map((item) => ({
      ...item,
      contactPhone: maskPhone(item.contactPhone),
    }))
  }

  async cancel(id: number) {
    const result = await db.select().from(appointments).where(eq(appointments.id, id))
    const appointment = result[0]
    if (!appointment) {
      return { error: { code: 404, msg: '预约不存在' } }
    }
    if (appointment.status !== 'pending') {
      return { error: { code: 400, msg: '仅待服务的预约可取消' } }
    }

    // 更新状态
    await db.update(appointments).set({ status: 'cancelled' }).where(eq(appointments.id, id))

    // 释放时段
    const slotResult = await db
      .select()
      .from(timeSlots)
      .where(
        and(
          eq(timeSlots.serviceId, appointment.serviceId),
          eq(timeSlots.date, appointment.appointmentDate),
          eq(timeSlots.startTime, appointment.timeSlot),
        ),
      )
    const slot = slotResult[0]
    if (slot && slot.bookedCount > 0) {
      await db
        .update(timeSlots)
        .set({ bookedCount: slot.bookedCount - 1 })
        .where(eq(timeSlots.id, slot.id))
    }

    return { data: { id, status: 'cancelled' } }
  }
}
