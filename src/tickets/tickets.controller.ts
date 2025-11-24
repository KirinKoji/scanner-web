import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import {
  ImportTicketDto,
  ScanTicketDto,
} from './dto/create-ticket.dto';
import type { Response } from 'express';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}
  
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  async import(
    @Body() body: ImportTicketDto[] | { tickets: ImportTicketDto[] },
  ) {
    const tickets = Array.isArray(body) ? body : body?.tickets;
    return this.ticketsService.importTickets(tickets);  
  }

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  async scan(@Body() scanTicketDto: ScanTicketDto) {
    return this.ticketsService.scanTicket(scanTicketDto);
  }

  @Get()
  async findAll() {
    return this.ticketsService.findAll(); 
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get('export/csv')
  async exportCSV(@Res() res: Response) {
    return this.ticketsService.exportToCSV(res);
  }

  @Get('export/excel')
  async exportExcel(@Res() res: Response) {
    return this.ticketsService.exportToExcel(res);
  }
}
