import { Controller, Get, Post, Delete, Put, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { Roles } from '@/common/decorators/roles'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.findAll()
  }

  @Post()
  async create(@Body() body: { username: string; password: string; role: string }) {
    if (!body.username || !body.password) {
      return { code: 400, msg: '用户名和密码不能为空', data: null }
    }
    return this.userService.create(body.username, body.password, body.role)
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id)
  }

  @Put(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { newPassword: string },
  ) {
    if (!body.newPassword) {
      return { code: 400, msg: '新密码不能为空', data: null }
    }
    return this.userService.resetPassword(id, body.newPassword)
  }
}
