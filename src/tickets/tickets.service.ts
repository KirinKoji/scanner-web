import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { ImportTicketDto, ScanTicketDto } from './dto/create-ticket.dto';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
  ) {}
  
  async scanTicket({ qrCode }: ScanTicketDto): Promise<Ticket> {
    // QR code typically contains the transactionId (e.g., "VISAKHAFC-690F24BB9564B")
    // Search by both qrCode and transactionId to handle both cases
    const ticket = await this.ticketModel.findOne({
      $or: [
        { qrCode },
        { transactionId: qrCode },
      ],
    });

    if (!ticket) {
      throw new NotFoundException(
        'Ticket not found. Please ensure the ticket data has been imported first.'
      );
    }

    if (ticket.scannedAt) {
      throw new BadRequestException('Ticket already scanned');
    }

    ticket.scannedAt = new Date();
    ticket.isValid = true;

    return ticket.save();
  }

  async importTickets(tickets: ImportTicketDto[] | undefined | null) {
    if (!Array.isArray(tickets) || tickets.length === 0) {
      throw new BadRequestException('No tickets provided');
    }

    const operations = tickets.map((ticket, index) => {
      // transactionId is the unique identifier from production dashboard
      // Format: "VISAKHAFC-690F24BB9564B"
      const transactionId = ticket.transactionId;
      
      if (!transactionId || !transactionId.trim()) {
        throw new BadRequestException(
          `Ticket at index ${index}: transactionId is required`
        );
      }

      // QR code is typically the transactionId, but can be provided separately
      const qrCode = ticket.qrCode || transactionId;

      // Build ticket data object, only including defined fields
      const ticketData: any = {
        qrCode,
        transactionId,
        isValid: ticket.isValid ?? true,
      };

      // Add optional fields only if they are provided (not undefined)
      if (ticket.eventDate !== undefined) ticketData.eventDate = ticket.eventDate;
      if (ticket.eventName !== undefined) ticketData.eventName = ticket.eventName; // Match Title
      if (ticket.customerName !== undefined) ticketData.customerName = ticket.customerName;
      if (ticket.customerId !== undefined) ticketData.customerId = ticket.customerId;
      if (ticket.branchName !== undefined) ticketData.branchName = ticket.branchName;
      if (ticket.ticketCount !== undefined) ticketData.ticketCount = ticket.ticketCount; // Tickets
      if (ticket.totalAmount !== undefined) ticketData.totalAmount = ticket.totalAmount; // Total
      if (ticket.revenueAmount !== undefined) ticketData.revenueAmount = ticket.revenueAmount; // Revenue
      if (ticket.ticketId !== undefined) ticketData.ticketId = ticket.ticketId;
      if (ticket.attendeeName !== undefined) ticketData.attendeeName = ticket.attendeeName;
      if (ticket.email !== undefined) ticketData.email = ticket.email;

      return {
        updateOne: {
          filter: { transactionId },
          update: {
            $setOnInsert: ticketData,
          },
          upsert: true,
        },
      };
    });

    const result = await this.ticketModel.bulkWrite(operations, {
      ordered: false,
    });

    return {
      inserted: result.upsertedCount,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      total: tickets.length,
    };
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketModel.find().sort({ scannedAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Ticket | null> {
    return this.ticketModel.findById(id).exec();
  }

  async exportToCSV(res: Response): Promise<void> {
    const tickets = await this.findAll();
    
    // CSV Header
    const headers = [
      'QR Code',
      'Ticket ID',
      'Event Name',
      'Attendee Name',
      'Scanned At',
      'Is Valid', 
    ];
    
    const csvRows = [headers.join(',')];
    
    tickets.forEach((ticket) => {
      const row = [
        `"${ticket.qrCode || ''}"`,
        `"${ticket.ticketId || ''}"`,
        `"${ticket.eventName || ''}"`,
        `"${ticket.attendeeName || ''}"`,
        `"${ticket.email || ''}"`,
        `"${ticket.scannedAt?.toISOString() || ''}"`,
        `"${ticket.isValid ? 'Yes' : 'No'}"`,
      ];
      csvRows.push(row.join(','));
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets.csv');
    res.send(csvRows.join('\n'));
  }

  async exportToExcel(res: Response): Promise<void> {
    const tickets = await this.findAll();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tickets');
    
    // Set headerss
    worksheet.columns = [
      { header: 'QR Code', key: 'qrCode', width: 30 },
      { header: 'Ticket ID', key: 'ticketId', width: 20 },
      { header: 'Event Name', key: 'eventName', width: 30 },
      { header: 'Attendee Name', key: 'attendeeName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Scanned At', key: 'scannedAt', width: 25 },
      { header: 'Is Valid', key: 'isValid', width: 12 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    
    // Add data rows
    tickets.forEach((ticket) => {
      worksheet.addRow({
        qrCode: ticket.qrCode || '',
        ticketId: ticket.ticketId || '',
        eventName: ticket.eventName || '',
        attendeeName: ticket.attendeeName || '',
        email: ticket.email || '',
        scannedAt: ticket.scannedAt?.toISOString() || '',
        isValid: ticket.isValid ? 'Yes' : 'No',
      });
    });
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=tickets.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  }
}

