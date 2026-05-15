import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ServiceService } from './service.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles'
import { Public } from '../../common/decorators/public'

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  /** 小程序端：服务列表 */
  @Public()
  @Get()
  async findAll(@Query('categoryId') categoryId?: string, @Query('all') all?: string) {
    return this.serviceService.findAll(all === 'true', categoryId ? Number(categoryId) : undefined)
  }

  /** 小程序端：服务详情 */
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.serviceService.findOne(Number(id))
  }

  /** 管理端：新增服务 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(
    @Body() body: {
      name: string
      description: string
      price: number
      duration: number
      imageUrl?: string
      category: string
      categoryId?: number
      sortOrder?: number
    },
  ) {
    return this.serviceService.create(body)
  }

  /** 管理端：更新服务 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.serviceService.update(Number(id), body)
  }

  /** 管理端：删除服务 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.serviceService.remove(Number(id))
  }

  /** 管理端：批量更新排序 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('sort/update')
  async updateSortOrder(@Body() body: { items: { id: number; sortOrder: number }[] }) {
    return this.serviceService.updateSortOrder(body.items)
  }
}
