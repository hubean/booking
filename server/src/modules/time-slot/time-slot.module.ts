import { Module } from '@nestjs/common'
import { TimeSlotController } from './time-slot.controller'
import { TimeSlotService } from './time-slot.service'

@Module({
  controllers: [TimeSlotController],
  providers: [TimeSlotService],
})
export class TimeSlotModule {}
