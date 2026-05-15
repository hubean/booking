import { Controller, Get, Post, Put, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common'
import { AppointmentService } from './appointment.service'
import { success, fail } from '@/common/utils/response'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles'
import { Public } from '@/common/decorators/public'

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // POST /api/appointments - 创建预约（公开）
  @Public()
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

  // GET /api/appointments?status=pending - 小程序端查询（脱敏）
  @Public()
  @Get()
  async findAll(@Query('status') status?: string) {
    const list = await this.appointmentService.findAll(status)
    console.log('[AppointmentController] GET /api/appointments', { status }, '→ count:', list.length)
    return success(list)
  }

  // PUT /api/appointments/:id/cancel - 小程序端取消（公开）
  @Public()
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

  // ===== 管理端接口 =====

  // GET /api/appointments/admin/list?status=pending - 管理端查询（完整手机号）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/list')
  async findAllAdmin(@Query('status') status?: string) {
    const list = await this.appointmentService.findAllAdmin(status)
    console.log('[AppointmentController] GET /api/appointments/admin/list', { status }, '→ count:', list.length)
    return success(list)
  }

  // PUT /api/appointments/admin/:id/status - 管理端修改预约状态
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('admin/:id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    if (!['pending', 'completed', 'cancelled'].includes(body.status)) {
      return fail(400, '无效的状态值')
    }
    const result = await this.appointmentService.updateStatus(id, body.status)
    if (result.error) {
      return fail(result.error.code, result.error.msg)
    }
    console.log('[AppointmentController] PUT /api/appointments/admin/:id/status', id, '→', body.status)
    return success(result.data)
  }
}
