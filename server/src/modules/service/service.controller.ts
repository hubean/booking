import { Controller, Get, Param, Query } from '@nestjs/common'
import { ServiceService } from './service.service'
import { success, fail } from '@/common/utils/response'

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  // GET /api/services?category=beauty
  @Get()
  async findAll(@Query('category') category?: string) {
    const list = await this.serviceService.findAll(category)
    console.log('[ServiceController] GET /api/services', { category }, '→ count:', list.length)
    return success(list)
  }

  // GET /api/services/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numId = Number(id)
    if (isNaN(numId) || numId <= 0) {
      return fail(400, '无效的服务ID')
    }
    const item = await this.serviceService.findOne(numId)
    if (!item) {
      return fail(404, '服务不存在')
    }
    console.log('[ServiceController] GET /api/services/:id', { id: numId }, '→ found')
    return success(item)
  }
}
