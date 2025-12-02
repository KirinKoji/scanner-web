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

      if (!payload) {
        throw new Error('Attendance ID is required for QR code generation');
      }

      const dataUrl = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 300,
        type: "image/png",
      });

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

  private buildQrPayload(attendance: AttendanceDocument): string {
    return attendance.id || '';
  }

  private async convertToPdf(attendance: AttendanceDocument): Promise<string> {
    const pdf = await this.convertToPdf.apply(this, [attendance]);
    return pdf.toBuffer().toString('base64');
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
