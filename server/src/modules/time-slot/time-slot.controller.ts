import { Controller, Get, Query } from '@nestjs/common'
import { TimeSlotService } from './time-slot.service'
import { success, fail } from '@/common/utils/response'

@Controller('time-slots')
export class TimeSlotController {
  constructor(private readonly timeSlotService: TimeSlotService) {}

  // GET /api/time-slots?serviceId=1&date=2025-06-15
  @Get()
  async findAvailable(@Query('serviceId') serviceId?: string, @Query('date') date?: string) {
    if (!serviceId || !date) {
      return fail(400, '请提供 serviceId 和 date 参数')
    }
    const numId = Number(serviceId)
    if (isNaN(numId) || numId <= 0) {
      return fail(400, '无效的 serviceId')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return fail(400, '日期格式不正确')
    }
    const list = await this.timeSlotService.findAvailable(numId, date)
    console.log('[TimeSlotController] GET /api/time-slots', { serviceId: numId, date }, '→ count:', list.length)
    return success(list)
  }
}
