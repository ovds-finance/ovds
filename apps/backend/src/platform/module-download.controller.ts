/**
 * ModuleDownloadController
 * ─────────────────────────────────────────────────────────────────────────────
 * REST surface for the programmatic module download/installation pipeline.
 *
 * Endpoints
 * ─────────
 *  POST /modules/download-local       On-premises: stream ZIP, extract to disk
 *  POST /modules/activate-saas        SaaS: logical DB activation only
 *  GET  /modules/download-status/:id  Poll job progress (0-100 %)
 *  GET  /modules/download-jobs        List recent jobs for the company
 *  POST /modules/download-jobs/:id/cancel  Cancel a pending/downloading job
 *
 * Guard chain: JwtAuthGuard → PermissionsGuard (apps:write)
 *
 * The `companyId` is always taken from the validated JWT (req.user.companyId)
 * and never trusted from the request body — tenant isolation is enforced here.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

import { Permissions }      from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard }     from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

import {
  ModuleDownloadService,
  type StartDownloadDto,
  type DeploymentType,
} from './module-download.service';

// ── DTOs (validated inline — class-validator decorators omitted to keep the
//          file self-contained; add them if you enable ValidationPipe globally)

class DownloadLocalDto {
  /** Module alias from the OVDS Marketplace (e.g. "erca-etax") */
  moduleAlias!: string;
  /** OVDS Marketplace API key for the authenticated company */
  apiKey!: string;
}

class ActivateSaaSModuleDto {
  /** Module alias from the OVDS Marketplace */
  moduleAlias!: string;
}

// ── Controller ─────────────────────────────────────────────────────────────────

@ApiTags('modules')
@ApiBearerAuth()
@Controller('modules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('apps:write')
export class ModuleDownloadController {
  constructor(private readonly svc: ModuleDownloadService) {}

  // ── On-premises: physical file download + extraction ──────────────────────

  /**
   * Trigger a programmatic download of a module ZIP from the OVDS Marketplace
   * and extract it to the server's local modules directory.
   *
   * Forbidden in IS_SAAS=true environments.
   *
   * Returns the created job record immediately. Poll /modules/download-status/:id
   * for live progress.
   */
  @Post('download-local')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:     'Download + install a module on-premises',
    description: [
      'Streams the module ZIP from the OVDS Marketplace, verifies its SHA-256 checksum,',
      'extracts it to OVDS_MODULES_PATH/<moduleAlias>/, then registers the module in the DB.',
      'Forbidden when IS_SAAS=true. Returns a job record that can be polled for progress.',
    ].join(' '),
  })
  @ApiBody({ type: DownloadLocalDto })
  async downloadLocal(
    @Request() req: any,
    @Body() body: DownloadLocalDto,
  ) {
    const companyId: string = req.user?.companyId;
    if (!companyId) throw new BadRequestException('Company context is required.');
    if (!body.moduleAlias?.trim()) throw new BadRequestException('moduleAlias is required.');
    if (!body.apiKey?.trim())      throw new BadRequestException('apiKey is required.');

    // Block SaaS containers from writing to the filesystem
    if (process.env['IS_SAAS'] === 'true') {
      throw new BadRequestException(
        'Physical file download is forbidden in cloud/SaaS mode. ' +
        'Use POST /modules/activate-saas instead.',
      );
    }

    const dto: StartDownloadDto = {
      moduleAlias:    body.moduleAlias.trim(),
      apiKey:         body.apiKey.trim(),
      companyId,
      triggeredBy:    req.user?.username ?? req.user?.userId,
      deploymentType: 'ON_PREMISE',
    };

    const job = await this.svc.startDownload(dto);
    return { success: true, data: job };
  }

  // ── SaaS: logical tenant activation ───────────────────────────────────────

  /**
   * Activate a module for the current tenant in SaaS/cloud mode.
   *
   * All module code is pre-bundled in the cluster image. "Activation" means
   * writing DB permission records so the tenant's UI can surface the module.
   * No filesystem writes occur. Forbidden when IS_SAAS=false.
   */
  @Post('activate-saas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Activate a module for this tenant (SaaS mode)',
    description: [
      'Writes a CompanyModule + AppInstallation record to enable the module for the',
      'requesting company. Module code is pre-bundled; no file I/O occurs.',
      'Forbidden when IS_SAAS=false — use POST /modules/download-local instead.',
    ].join(' '),
  })
  @ApiBody({ type: ActivateSaaSModuleDto })
  async activateSaaS(
    @Request() req: any,
    @Body() body: ActivateSaaSModuleDto,
  ) {
    const companyId: string = req.user?.companyId;
    if (!companyId)                throw new BadRequestException('Company context is required.');
    if (!body.moduleAlias?.trim()) throw new BadRequestException('moduleAlias is required.');

    const result = await this.svc.activateSaaS({
      moduleAlias: body.moduleAlias.trim(),
      companyId,
      triggeredBy: req.user?.username ?? req.user?.userId,
    });

    return { success: true, data: result };
  }

  // ── Job polling ────────────────────────────────────────────────────────────

  /**
   * Poll the status of a download job.
   * The React UI calls this every 2 s while the job is DOWNLOADING or EXTRACTING.
   */
  @Get('download-status/:jobId')
  @HttpCode(HttpStatus.OK)
  @Permissions('apps:read')   // Read permission is enough for polling
  @ApiOperation({ summary: 'Poll a module download/install job for progress' })
  @ApiParam({ name: 'jobId', description: 'UUID of the ModuleDownloadJob' })
  async getDownloadStatus(@Request() req: any, @Param('jobId') jobId: string) {
    const companyId: string = req.user?.companyId;
    if (!companyId) throw new BadRequestException('Company context is required.');

    const job = await this.svc.getJobStatus(jobId, companyId);
    return { success: true, data: job };
  }

  /**
   * List the 50 most recent download jobs for the current company.
   * Used to populate the "My Apps → Download History" tab in the App Store.
   */
  @Get('download-jobs')
  @HttpCode(HttpStatus.OK)
  @Permissions('apps:read')
  @ApiOperation({ summary: 'List recent module download jobs for the company' })
  async listDownloadJobs(@Request() req: any) {
    const companyId: string = req.user?.companyId;
    if (!companyId) throw new BadRequestException('Company context is required.');

    const jobs = await this.svc.listJobs(companyId);
    return { success: true, data: jobs };
  }

  /**
   * Cancel a PENDING or DOWNLOADING job.
   * Does not roll back files already extracted for on-premises jobs.
   */
  @Post('download-jobs/:jobId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending or in-progress download job' })
  @ApiParam({ name: 'jobId', description: 'UUID of the ModuleDownloadJob to cancel' })
  async cancelJob(@Request() req: any, @Param('jobId') jobId: string) {
    const companyId: string = req.user?.companyId;
    if (!companyId) throw new BadRequestException('Company context is required.');

    const job = await this.svc.cancelJob(jobId, companyId);
    return { success: true, data: job };
  }
}
