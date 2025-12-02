import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { AttendanceService } from "./attendance.service";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async scan(@Body() dto: CreateAttendanceDto) {
    return await this.attendanceService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.attendanceService.findAll(pageNum, limitNum);
  }

  @Get(':id/qr')
  @HttpCode(HttpStatus.OK)
  async getQr(@Param('id') id: string) {
    return await this.attendanceService.getQrCode(id);
  }

  @Get(':id/qr/image')
  @HttpCode(HttpStatus.OK)
  async getQrImage(@Param('id') id: string, @Res() res: Response) {
    try {
      const qrCodeDataUrl = await this.attendanceService.getQrCodeAsDataUrl(id);

      // Validate data URL format
      if (!qrCodeDataUrl || !qrCodeDataUrl.startsWith('data:image/png;base64,')) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Invalid QR code data URL format',
          received: qrCodeDataUrl ? qrCodeDataUrl.substring(0, 50) + '...' : 'null'
        });
        return;
      }

      // Extract base64 data from data URL
      const base64Data = qrCodeDataUrl.split(',')[1];
      if (!base64Data) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'No base64 data found in QR code data URL'
        });
        return;
      }

      const imageBuffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', 'inline; filename="qrcode.png"');
      res.send(imageBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to generate QR code image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return await this.attendanceService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return await this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.attendanceService.remove(id);
  }
}
