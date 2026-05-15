import { Module, OnModuleInit } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { ServiceModule } from '@/modules/service/service.module'
import { AppointmentModule } from '@/modules/appointment/appointment.module'
import { TimeSlotModule } from '@/modules/time-slot/time-slot.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { UserModule } from '@/modules/user/user.module'
import { CategoryModule } from '@/modules/category/category.module'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { initDb } from '@/db'

@Module({
  imports: [ServiceModule, AppointmentModule, TimeSlotModule, AuthModule, UserModule, CategoryModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    await initDb()
  }
}
