import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { eq } from 'drizzle-orm'
import * as bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { success, fail } from '@/common/utils/response'

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(username: string, password: string) {
    console.log('[Auth] login attempt:', username)

    const userList = await db.select().from(users).where(eq(users.username, username))
    const user = userList[0]

    if (!user) {
      console.log('[Auth] user not found:', username)
      return fail(401, '用户名或密码错误')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      console.log('[Auth] invalid password for:', username)
      return fail(401, '用户名或密码错误')
    }

    const payload = { sub: user.id, username: user.username, role: user.role }
    const token = this.jwtService.sign(payload)

    console.log('[Auth] login success:', username)
    return success({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    }, '登录成功')
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    console.log('[Auth] changePassword for userId:', userId)

    const userList = await db.select().from(users).where(eq(users.id, userId))
    const user = userList[0]

    if (!user) {
      return fail(404, '用户不存在')
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isPasswordValid) {
      return fail(400, '原密码错误')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await db
      .update(users)
      .set({ password: hashedPassword, mustChangePassword: false })
      .where(eq(users.id, userId))

    console.log('[Auth] password changed for userId:', userId)
    return success(null, '密码修改成功')
  }

  async getProfile(userId: number) {
    const userList = await db.select().from(users).where(eq(users.id, userId))
    const user = userList[0]

    if (!user) {
      return fail(404, '用户不存在')
    }

    return success({
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    })
  }
}
