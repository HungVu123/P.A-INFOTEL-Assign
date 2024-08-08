import { Controller, Param, Post, Res, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Response } from 'express';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':confirmation_no')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Process a payment' })
  @ApiParam({
    name: 'confirmation_no',
    description: 'The confirmation number of the payment',
  })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async handlePayment(
    @Param('confirmation_no') confirmationNo: string,
    @Res() res: Response,
  ): Promise<void> {
    const redirectUrl =
      await this.paymentService.processPayment(confirmationNo);
    res.redirect(302, redirectUrl);
  }
}
