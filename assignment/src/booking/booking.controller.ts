import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BookingService } from './booking.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully.' })
  @ApiResponse({ status: 409, description: 'File uploaded fail.' })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'XML file',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileExists = await this.bookingService.checkFileNameExists(
      file.originalname,
    );
    if (fileExists) {
      return { message: 'File with the same name already exists.' };
    } else {
      await this.bookingService.saveFile(file);
      return { message: 'File uploaded successfully' };
    }
  }

  @Get(':confirmationNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Convert XML-JSON' })
  @ApiResponse({ status: 201, description: 'Successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(@Param('confirmationNo') confirmationNo: string) {
    return this.bookingService.getBookingByConfirmationNo(confirmationNo);
  }
}
