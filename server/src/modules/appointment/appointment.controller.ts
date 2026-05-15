import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common'
import { AppointmentService } from './appointment.service'
import { success, fail } from '@/common/utils/response'

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // POST /api/appointments
  @Post()
  async create(
    @Body()
    body: {
      serviceId: number
      appointmentDate: string
      timeSlot: string
      contactName: string
      contactPhone: string
    },
  ) {
    const { serviceId, appointmentDate, timeSlot, contactName, contactPhone } = body
    console.log('[AppointmentController] POST /api/appointments', body)

    // 基本校验
    if (!serviceId || !appointmentDate || !timeSlot || !contactName || !contactPhone) {
      return fail(400, '请填写完整的预约信息')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
      return fail(400, '日期格式不正确')
    }
    if (!/^\d{2}:\d{2}$/.test(timeSlot)) {
      return fail(400, '时段格式不正确')
    }
    if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
      return fail(400, '手机号格式不正确')
    }

    const result = await this.appointmentService.create({
      serviceId,
      appointmentDate,
      timeSlot,
      contactName,
      contactPhone,
    })

    if (result.error) {
      return fail(result.error.code, result.error.msg)
    }

    return success(result.data)
  }

  // GET /api/appointments?status=pending
  @Get()
  async findAll(@Query('status') status?: string) {
    const list = await this.appointmentService.findAll(status)
    console.log('[AppointmentController] GET /api/appointments', { status }, '→ count:', list.length)
    return success(list)
  }

  // PUT /api/appointments/:id/cancel
  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    const numId = Number(id)
    if (isNaN(numId) || numId <= 0) {
      return fail(400, '无效的预约ID')
    }
    const result = await this.appointmentService.cancel(numId)
    if (result.error) {
      return fail(result.error.code, result.error.msg)
    }
    console.log('[AppointmentController] PUT /api/appointments/:id/cancel', { id: numId }, '→ cancelled')
    return success(result.data)
  }
}
