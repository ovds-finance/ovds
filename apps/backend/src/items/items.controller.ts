﻿﻿import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { ItemsService } from './items.service';

@ApiTags('items')
@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List items' })
  list(@Query() query: Record<string, unknown>, @Request() req: any) {
    const companies = [((query.companyId as string) ?? req.user?.companyId) as string].filter(Boolean);
    return this.itemsService.findItems({ ...query, companies } as any);
  }

  @Get(':id')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get item by ID' })
  get(@Param('id') id: string) {
    return this.itemsService.findItem(id);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create item' })
  create(@Body() data: Record<string, unknown>) {
    return this.itemsService.createItem(data);
  }

  @Put(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update item' })
  update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.itemsService.updateItem(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete item' })
  remove(@Param('id') id: string) {
    return this.itemsService.removeItem(id);
  }
}
