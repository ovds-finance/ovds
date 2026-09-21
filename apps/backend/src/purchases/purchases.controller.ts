import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { PurchasesService } from './purchases.service';


@ApiTags('purchases')
@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get('bills')
  @Permissions('bills:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List bills' })
  listBills(@Query() query: Record<string, unknown>, @Request() req: any) {
    return this.purchasesService.findBills({ ...query, companyId: req.user?.companyId });
  }

  @Get('bills/:id')
  @Permissions('bills:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get bill by ID' })
  getBill(@Param('id') id: string) {
    return this.purchasesService.findBill(id);
  }

  @Post('bills')
  @Permissions('bills:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create bill' })
  createBill(@Body() data: Record<string, unknown>) {
    return this.purchasesService.createBill(data);
  }

  @Put('bills/:id')
  @Permissions('bills:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update bill' })
  updateBill(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.purchasesService.updateBill(id, data);
  }

  @Delete('bills/:id')
  @Permissions('bills:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete bill' })
  removeBill(@Param('id') id: string) {
    return this.purchasesService.removeBill(id);
  }

  @Get('orders')
  @Permissions('purchase_orders:read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List purchase orders' })
  listOrders(@Query() query: Record<string, unknown>, @Request() req: any) {
    return this.purchasesService.findPurchaseOrders({ ...query, companyId: req.user?.companyId });
  }

  @Get('orders/:id')
  @Roles('ADMIN', 'PURCHASES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get purchase order by ID' })
  getOrder(@Param('id') id: string) {
    return this.purchasesService.findPurchaseOrder(id);
  }

  @Post('orders')
  @Roles('ADMIN', 'PURCHASES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create purchase order' })
  createOrder(@Body() data: Record<string, unknown>) {
    return this.purchasesService.createPurchaseOrder(data);
  }

  @Put('orders/:id')
  @Roles('ADMIN', 'PURCHASES')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update purchase order' })
  updateOrder(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.purchasesService.updatePurchaseOrder(id, data);
  }

  @Delete('orders/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete purchase order' })
  removeOrder(@Param('id') id: string) {
    return this.purchasesService.removePurchaseOrder(id);
  }

  @Get('grn')
  @Roles('ADMIN', 'PURCHASES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List goods received notes' })
  listGrns(@Query() query: Record<string, unknown>, @Request() req: any) {
    return this.purchasesService.findGrns({ ...query, companyId: req.user?.companyId });
  }

  @Post('grn')
  @Roles('ADMIN', 'PURCHASES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create GRN' })
  createGrn(@Body() data: Record<string, unknown>) {
    return this.purchasesService.createGrn(data);
  }

  @Get('payments')
  @Roles('ADMIN', 'PURCHASES', 'FINANCE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List vendor payments' })
  listPayments(@Query() query: Record<string, unknown>, @Request() req: any) {
    return this.purchasesService.findVendorPayments({ ...query, companyId: req.user?.companyId });
  }

  @Post('payments')
  @Roles('ADMIN', 'FINANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create vendor payment' })
  createPayment(@Body() data: Record<string, unknown>) {
    return this.purchasesService.createVendorPayment(data);
  }
}
