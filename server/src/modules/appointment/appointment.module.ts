import { Module } from '@nestjs/common'
import { AppointmentController } from './appointment.controller'
import { AppointmentService } from './appointment.service'
import { TimeSlotService } from '../time-slot/time-slot.service'

@Module({
  controllers: [AppointmentController],
  providers: [AppointmentService, TimeSlotService],
})
export class AppointmentModule {}
