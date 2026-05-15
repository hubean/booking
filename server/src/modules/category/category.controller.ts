import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { CategoryService } from './category.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles'
import { Public } from '../../common/decorators/public'

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /** 小程序端：获取启用的分类列表 */
  @Public()
  @Get('active')
  async findActive() {
    return this.categoryService.findActive()
  }

  /** 管理端：获取所有分类 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll() {
    return this.categoryService.findAll()
  }

  /** 管理端：新增分类 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(
    @Body() body: { name: string; key: string; icon?: string; sortOrder?: number },
  ) {
    return this.categoryService.create(body)
  }

  /** 管理端：更新分类 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; key?: string; icon?: string; sortOrder?: number; status?: 'active' | 'inactive' },
  ) {
    return this.categoryService.update(Number(id), body)
  }

  /** 管理端：删除分类 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.categoryService.delete(Number(id))
  }

  /** 管理端：批量更新排序 */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('sort/update')
  async updateSortOrder(@Body() body: { items: { id: number; sortOrder: number }[] }) {
    return this.categoryService.updateSortOrder(body.items)
  }
}
