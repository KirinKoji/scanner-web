import { Injectable, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import QRCode from "qrcode";
import { Attendance, AttendanceDocument } from "./schemas/attendance.schema";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";

type AttendanceResponse = Record<string, unknown> & {
  _id?: string;
  id?: string;
};

type AttendanceWithQrCode = {
  attendance: AttendanceResponse;
  qrCode: string;
};

type PaginatedResponse = {
  data: AttendanceDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
  ) {}

  async create(dto: CreateAttendanceDto): Promise<AttendanceWithQrCode> {
    const attendance = await this.attendanceModel.create(dto);
    const qrCode = await this.generateQrCode(attendance);

    const response: AttendanceWithQrCode = {
      attendance: this.toAttendanceResponse(attendance),
      qrCode,
    };
    return response;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      // Sort by createdAt descending to get newest records first
      this.attendanceModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.attendanceModel.countDocuments().exec(),
    ]);

    return {
      data: data as AttendanceDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<AttendanceDocument> {
    try {
      const attendance = await this.attendanceModel.findById(id).orFail();
      return attendance as AttendanceDocument;
    } catch (error) {
      throw new NotFoundException(`Attendance with id ${id} not found`);
    }
  }

  async getQrCode(id: string): Promise<AttendanceWithQrCode> {
    const attendance = await this.findOne(id);
    const qrCode = await this.generateQrCode(attendance);

    const response: AttendanceWithQrCode = {
      attendance: this.toAttendanceResponse(attendance),
      qrCode,
    };
    return response;
  }

  async getQrCodeAsDataUrl(id: string): Promise<string> {
    const attendance = await this.findOne(id);
    return await this.generateQrCode(attendance);
  }

  async update(id: string, dto: UpdateAttendanceDto): Promise<AttendanceDocument> {
    try {
      const attendance = await this.attendanceModel
        .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
        .orFail()
        .exec();
      return attendance as AttendanceDocument;
    } catch (error) {
      throw new NotFoundException(`Attendance with id ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.attendanceModel.findByIdAndDelete(id).orFail();
    } catch (error) {
      throw new NotFoundException(`Attendance with id ${id} not found`);
    }
  }

  private async generateQrCode(attendance: AttendanceDocument): Promise<string> {
    try {
      const payload = this.buildQrPayload(attendance);
      const payloadString = JSON.stringify(payload);
      
      // Validate payload is not too large for QR code
      if (payloadString.length > 2000) {
        throw new Error('Payload too large for QR code generation');
      }

      const dataUrl = await QRCode.toDataURL(payloadString, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 300,
        type: "image/png",
      });

      // Validate the data URL format
      if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) {
        throw new Error('Invalid data URL format returned from QR code generator');
      }

      return dataUrl;
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new InternalServerErrorException(
        `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildQrPayload(attendance: AttendanceDocument): Record<string, string> {
    // Get first image, but if it's a data URL, truncate it or use a placeholder
    let imageValue = attendance.image[0] || '';
    
    // If image is a data URL (too large for QR), use a placeholder
    if (imageValue.startsWith('data:image/')) {
      imageValue = 'image-provided'; // Placeholder instead of full data URL
    }
    
    return {
      attendanceId: attendance.id || '',
      firstName: attendance.firstName || '',
      lastName: attendance.lastName || '',
      phoneNumber: attendance.phoneNumber || '',
      image: imageValue,
    };
  }

  private toAttendanceResponse(attendance: AttendanceDocument): AttendanceResponse {
    const data = attendance.toObject() as unknown as AttendanceResponse;
    const id = attendance.id;

    return {
      ...data,
      id,
      _id: id ?? data._id,
    };
  }
}
