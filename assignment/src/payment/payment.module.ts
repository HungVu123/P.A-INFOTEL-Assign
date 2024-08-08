import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BookingModule } from 'src/booking/booking.module';

@Module({
  imports: [AuthModule, BookingModule],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
