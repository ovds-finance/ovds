import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import {
  GenerateInvoiceRequestDto,
  GenerateInvoiceResponseDto,
  InvoiceVerificationDto,
  InvoiceVerificationResponseDto,
} from './dto/fiscal-invoice.dto';
import { FiscalInvoiceService } from './fiscal-invoice.service';

@ApiTags('Fiscal Invoice')
@ApiBearerAuth()
@Controller('fiscal-invoices')
export class FiscalInvoiceController {
  constructor(private readonly fiscalInvoiceService: FiscalInvoiceService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a fiscal invoice PDF for an existing invoice' })
  @ApiResponse({ status: HttpStatus.OK, type: GenerateInvoiceResponseDto })
  async generate(@Body() request: GenerateInvoiceRequestDto): Promise<GenerateInvoiceResponseDto> {
    return this.fiscalInvoiceService.generate(request);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download a generated fiscal invoice PDF' })
  @ApiResponse({ status: HttpStatus.OK, description: 'application/pdf binary' })
  async downloadPdf(@Param('id') id: string, @Res() response: Response): Promise<void> {
    const result = await this.fiscalInvoiceService.render(id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${result.invoiceNumber}.pdf"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.status(HttpStatus.OK).send(result.pdf);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a fiscal invoice using its invoice number and verification code' })
  @ApiResponse({ status: HttpStatus.OK, type: InvoiceVerificationResponseDto })
  async verify(@Body() request: InvoiceVerificationDto): Promise<InvoiceVerificationResponseDto> {
    return this.fiscalInvoiceService.verify(request);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify a fiscal invoice from a QR verification link' })
  @ApiQuery({ name: 'invoiceNumber', required: true })
  @ApiQuery({ name: 'verificationCode', required: true })
  @ApiResponse({ status: HttpStatus.OK, type: InvoiceVerificationResponseDto })
  async verifyFromQuery(
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('verificationCode') verificationCode: string,
  ): Promise<InvoiceVerificationResponseDto> {
    return this.fiscalInvoiceService.verify({ invoiceNumber, verificationCode });
  }
}
