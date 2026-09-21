import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

import { SetupService } from './setup.service';

@ApiTags('settings/setup')
@Controller('settings/setup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'FINANCE', 'EMPLOYEE')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  // GET /settings/setup/steps
  @Get('steps')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all setup step definitions' })
  listSteps() {
    return { success: true, data: this.setupService.listSteps() };
  }

  // GET /settings/setup/steps-by-category
  @Get('steps-by-category')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List setup steps grouped by category' })
  listStepsByCategory() {
    return { success: true, data: this.setupService.listStepsByCategory() };
  }

  // GET /settings/setup/progress/:companyId
  @Get('progress/:companyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get setup progress for a company' })
  async getProgress(@Param('companyId') companyId: string) {
    const data = await this.setupService.getProgress(companyId);
    return { success: true, data };
  }

  // GET /settings/setup/summary/:companyId
  @Get('summary/:companyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get setup wizard completion summary' })
  async getSummary(@Param('companyId') companyId: string) {
    const data = await this.setupService.getSummary(companyId);
    return { success: true, data };
  }

  // POST /settings/setup/start/:companyId
  @Post('start/:companyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialise (or resume) the setup wizard for a company' })
  async startWizard(@Param('companyId') companyId: string) {
    const data = await this.setupService.startWizard(companyId);
    return { success: true, data };
  }

  // POST /settings/setup/complete-step/:companyId/:stepKey
  @Post('complete-step/:companyId/:stepKey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a setup step as completed' })
  async completeStep(
    @Param('companyId') companyId: string,
    @Param('stepKey') stepKey: string,
    @Body() body: { data?: Record<string, string> },
    @Request() req: any,
  ) {
    const completedBy: string | undefined = req.user?.email ?? req.user?.id;
    const data = await this.setupService.completeStep(companyId, stepKey, body?.data, completedBy);
    return { success: true, data };
  }

  // POST /settings/setup/skip-step/:companyId/:stepKey
  @Post('skip-step/:companyId/:stepKey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip a setup step' })
  async skipStep(
    @Param('companyId') companyId: string,
    @Param('stepKey') stepKey: string,
  ) {
    const data = await this.setupService.skipStep(companyId, stepKey);
    return { success: true, data };
  }

  // PATCH /settings/setup/undo-step/:companyId/:stepKey
  @Patch('undo-step/:companyId/:stepKey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Undo a completed or skipped step' })
  async undoStep(
    @Param('companyId') companyId: string,
    @Param('stepKey') stepKey: string,
  ) {
    const data = await this.setupService.undoStep(companyId, stepKey);
    return { success: true, data };
  }

  // DELETE /settings/setup/reset/:companyId
  @Delete('reset/:companyId')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset all setup progress for a company' })
  async resetProgress(@Param('companyId') companyId: string) {
    const data = await this.setupService.resetProgress(companyId);
    return { success: true, data };
  }

  // POST /settings/setup/sync-compliance/:companyId
  @Post('sync-compliance/:companyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-complete setup steps based on compliance readiness' })
  async syncComplianceSteps(
    @Param('companyId') companyId: string,
    @Body() body: { eimsReady?: boolean; securityScore?: number },
  ) {
    const data = await this.setupService.syncComplianceSteps(companyId, body);
    return { success: true, data };
  }
}
