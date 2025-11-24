import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TicketDocument = Ticket & Document; 

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true })
  qrCode: string;

  @Prop()
  ticketId?: string;

  @Prop()
  transactionId?: string;

  @Prop()
  eventName?: string;

  @Prop()
  attendeeName?: string;

  @Prop()
  email?: string;

  @Prop()
  eventDate?: string;

  @Prop()
  branchName?: string;

  @Prop()
  customerId?: string;

  @Prop()
  customerName?: string;

  @Prop()
  ticketCount?: number;

  @Prop()
  totalAmount?: number;

  @Prop()
  revenueAmount?: number;

  @Prop()
  scannedAt: Date;

  @Prop({ default: false })
  isValid: boolean;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
