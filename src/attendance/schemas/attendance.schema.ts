import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance {
    @Prop({ type: String, required: true })
    firstName: string;

    @Prop({ type: String, required: true })
    lastName: string;

    @Prop({ type: Number, required: true })
    age: number;

    @Prop({ type: String, required: true})
    phoneNumber: string;

    @Prop({ type: [String], required: true })
    image: string[];

    @Prop({ type: String, required: true })
    city: string;

    @Prop({ type: String, required: false })
    province?: string;

    @Prop({ type: String, required: true })
    companyName: string;

    @Prop({ type: String, required: true })
    position: string;

    @Prop({ type: Date, required: false })
    date?: Date;

    @Prop({ type: String, required: false })
    remark?: string;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Add indexes for frequently queried fields
AttendanceSchema.index({ phoneNumber: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ city: 1 });
AttendanceSchema.index({ companyName: 1 });
AttendanceSchema.index({ createdAt: -1 });