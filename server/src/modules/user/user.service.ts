import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import * as bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { success, fail } from '@/common/utils/response'

@Injectable()
export class UserService {
  async findAll() {
    const result = await db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    }).from(users)

    return success(result)
  }

  async create(username: string, password: string, role: string) {
    console.log('[User] create:', username, role)

    // 检查用户名是否已存在
    const existing = await db.select().from(users).where(eq(users.username, username))
    if (existing.length > 0) {
      return fail(400, '用户名已存在')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await db.insert(users).values({
      username,
      password: hashedPassword,
      role: (role || 'user') as any,
      mustChangePassword: true,
    }).returning()

    console.log('[User] created:', username)
    return success({
      id: result[0].id,
      username: result[0].username,
      role: result[0].role,
      mustChangePassword: result[0].mustChangePassword,
      createdAt: result[0].createdAt,
    })
  }

  async remove(id: number) {
    console.log('[User] delete:', id)

    const userList = await db.select().from(users).where(eq(users.id, id))
    if (userList.length === 0) {
      return fail(404, '用户不存在')
    }

    // 禁止删除自己
    await db.delete(users).where(eq(users.id, id))

    console.log('[User] deleted:', id)
    return success(null, '删除成功')
  }

  async resetPassword(id: number, newPassword: string) {
    console.log('[User] resetPassword:', id)

    const userList = await db.select().from(users).where(eq(users.id, id))
    if (userList.length === 0) {
      return fail(404, '用户不存在')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await db.update(users).set({
      password: hashedPassword,
      mustChangePassword: true,
    }).where(eq(users.id, id))

    console.log('[User] password reset for:', id)
    return success(null, '密码重置成功')
  }
}
