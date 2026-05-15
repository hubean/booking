import { Controller, Get, Post, Put, Delete, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common'
import { ServiceService } from './service.service'
import { success, fail } from '@/common/utils/response'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles'
import { Public } from '@/common/decorators/public'

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  // GET /api/services?category=beauty&all=true (all=true 返回含下架的服务)
  @Public()
  @Get()
  async findAll(@Query('category') category?: string, @Query('all') all?: string) {
    const includeInactive = all === 'true'
    const list = await this.serviceService.findAll(category, includeInactive)
    console.log('[ServiceController] GET /api/services', { category, all }, '→ count:', list.length)
    return success(list)
  }

  // GET /api/services/:id
  @Public()
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

  // POST /api/services - 创建服务（管理员）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() body: { name: string; description: string; price: number; duration: number; imageUrl: string; category: string }) {
    if (!body.name || !body.price || !body.category) {
      return fail(400, '缺少必填字段')
    }
    const item = await this.serviceService.create(body)
    console.log('[ServiceController] POST /api/services → created id:', item.id)
    return success(item)
  }

  // PUT /api/services/:id - 更新服务（管理员）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<{ name: string; description: string; price: number; duration: number; imageUrl: string; category: string; status: string }>) {
    const item = await this.serviceService.update(id, body)
    if (!item) {
      return fail(404, '服务不存在')
    }
    console.log('[ServiceController] PUT /api/services/:id', id, '→ updated')
    return success(item)
  }

  // DELETE /api/services/:id - 删除服务（管理员）
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.serviceService.remove(id)
    console.log('[ServiceController] DELETE /api/services/:id', id, '→ deleted')
    return success(null, '删除成功')
  }
}
