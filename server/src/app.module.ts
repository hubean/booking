import { Module, OnModuleInit } from '@nestjs/common'
import { AppController } from '@/app.controller'
import { AppService } from '@/app.service'
import { ServiceModule } from '@/modules/service/service.module'
import { AppointmentModule } from '@/modules/appointment/appointment.module'
import { TimeSlotModule } from '@/modules/time-slot/time-slot.module'
import { initDb } from '@/db'

@Module({
  imports: [ServiceModule, AppointmentModule, TimeSlotModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    await initDb()
  }
}
