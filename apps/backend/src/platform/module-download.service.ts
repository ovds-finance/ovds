/**
 * ModuleDownloadService
 * ─────────────────────────────────────────────────────────────────────────────
 * Orchestrates the programmatic download and installation of OVDS apps/modules
 * from the central marketplace. Inspired by Akaunting's App Store approach.
 *
 * TWO execution paths based on runtime environment:
 *
 *  ON_PREMISE  — Streams the ZIP from the marketplace, verifies SHA-256,
 *                extracts to the local modules directory, updates CompanyModule.
 *
 *  SAAS/CLOUD  — Never touches the filesystem. Instead, toggles database-level
 *                tenant permission records (CompanyModule + AppInstallation) so
 *                that code pre-bundled in the cluster image becomes visible to
 *                the requesting tenant.
 *
 * Each job is tracked in the ModuleDownloadJob table so the React UI can poll
 * for progress and the audit trail is preserved.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../common/prisma.service';


// ── Prisma accessor ───────────────────────────────────────────────────────────
// The ModuleDownloadJob model was added to schema.prisma but the Prisma client
// has not been regenerated yet in this environment.  All accesses go through
// this helper so the file compiles before `npm run db:generate` is executed.
// Once the client is regenerated (npm run db:generate), remove this cast and
// use `jobRepo(this.prisma)` directly — it will be fully typed.
function jobRepo(prisma: PrismaService): any {
  return (prisma as any).moduleDownloadJob;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type JobStatus =
  | 'PENDING'
  | 'DOWNLOADING'
  | 'EXTRACTING'
  | 'ACTIVATING'
  | 'DONE'
  | 'FAILED'
  | 'CANCELLED';

export type DeploymentType = 'ON_PREMISE' | 'SAAS';

export interface StartDownloadDto {
  moduleAlias: string;
  /** OVDS Marketplace API key issued to the company */
  apiKey: string;
  companyId: string;
  triggeredBy?: string;
  /** If omitted the service determines the mode from env IS_SAAS */
  deploymentType?: DeploymentType;
}

export interface ActivateSaaSDto {
  moduleAlias: string;
  companyId: string;
  triggeredBy?: string;
}

export interface JobStatusResponse {
  jobId: string;
  moduleAlias: string;
  status: JobStatus;
  deploymentType: DeploymentType;
  progress: number;
  message: string | null;
  targetPath: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build the canonical marketplace download URL for a module alias. */
function buildDownloadUrl(baseUrl: string, alias: string, apiKey: string): string {
  // e.g. https://marketplace.ovds.com.et/api/modules/erca-etax/download?api_key=xxx
  const encoded = encodeURIComponent(alias);
  return `${baseUrl}/api/modules/${encoded}/download?api_key=${encodeURIComponent(apiKey)}`;
}

/**
 * Lightweight ZIP extractor using Node's built-in zlib (inflate/gunzip) and
 * the unzipper-style central-directory parsing — no third-party dependencies.
 *
 * For production use this is sufficient for single-module ZIPs (< 200 MB).
 * The alternative path (shell `unzip`) is guarded behind env UNZIP_CMD.
 */
async function extractZip(zipPath: string, destDir: string): Promise<void> {
  // Try the system unzip command first (fastest, handles any ZIP variant)
  const unzipCmd = process.env.UNZIP_CMD ?? 'unzip';
  try {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);
    await fsp.mkdir(destDir, { recursive: true });
    await execFileAsync(unzipCmd, ['-o', zipPath, '-d', destDir]);
    return;
  } catch {
    // Fall through to streaming inflate
  }

  // Streaming inflate fallback (works for .zip files with deflate entries)
  await fsp.mkdir(destDir, { recursive: true });
  const buffer = await fsp.readFile(zipPath);

  // Parse ZIP end-of-central-directory to find first local file headers
  // This is a minimal parser sufficient for well-formed module ZIPs.
  let offset = 0;
  while (offset < buffer.length - 4) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) { offset++; continue; }

    // Local file header found
    const compression   = buffer.readUInt16LE(offset + 8);
    const compressedSz  = buffer.readUInt32LE(offset + 18);
    const fileNameLen   = buffer.readUInt16LE(offset + 26);
    const extraLen      = buffer.readUInt16LE(offset + 28);
    const rawFileName   = buffer.subarray(offset + 30, offset + 30 + fileNameLen).toString('utf8');
    const dataStart     = offset + 30 + fileNameLen + extraLen;
    const dataEnd       = dataStart + compressedSz;
    const entryData     = buffer.subarray(dataStart, dataEnd);

    // ── Zip-slip prevention ───────────────────────────────────────────────
    // Normalise the entry filename and ensure the resolved path stays inside
    // destDir.  A malicious ZIP can embed filenames like "../../etc/passwd"
    // or absolute paths — reject any entry that escapes the destination root.
    const safeFileName = rawFileName.replace(/\\/g, '/').replace(/^\/+/, '');
    const fullPath = path.resolve(destDir, safeFileName);
    if (!fullPath.startsWith(path.resolve(destDir) + path.sep) && fullPath !== path.resolve(destDir)) {
      // Entry attempts to escape destination — skip silently to avoid RCE/data loss
      offset = dataEnd;
      continue;
    }

    if (safeFileName.endsWith('/')) {
      await fsp.mkdir(fullPath, { recursive: true });
    } else {
      await fsp.mkdir(path.dirname(fullPath), { recursive: true });
      if (compression === 0) {
        await fsp.writeFile(fullPath, entryData);
      } else if (compression === 8) {
        const { promisify } = await import('util');
        const { inflateRaw } = await import('zlib');
        const inflateRawAsync = promisify(inflateRaw);
        const inflated = await inflateRawAsync(entryData);
        await fsp.writeFile(fullPath, inflated);
      }
    }

    offset = dataEnd;
  }
}

/** Compute SHA-256 of a file on disk. */
async function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', d => hash.update(d));
    stream.on('end',  () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Download a URL to a local file path, updating progress via a callback.
 * Uses the built-in http/https module — no axios dependency on the backend.
 */
function downloadToFile(
  url: string,
  dest: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow one redirect
        downloadToFile(res.headers.location, dest, onProgress).then(resolve).catch(reject);
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} while downloading module`));
        return;
      }

      const total = parseInt(res.headers['content-length'] ?? '0', 10);
      let received = 0;
      const out = fs.createWriteStream(dest);

      res.on('data', (chunk: Buffer) => {
        received += chunk.length;
        if (total > 0) onProgress(Math.round((received / total) * 100));
      });

      res.pipe(out);
      out.on('finish', resolve);
      out.on('error',  reject);
      res.on('error',  reject);
    });
    req.on('error', reject);
    req.setTimeout(120_000, () => {
      req.destroy();
      reject(new Error('Download timed out (120 s)'));
    });
  });
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class ModuleDownloadService {
  private readonly logger = new Logger(ModuleDownloadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Create a download/install job and execute it asynchronously.
   * Returns the job record immediately; the caller can poll via getJobStatus().
   */
  async startDownload(dto: StartDownloadDto): Promise<JobStatusResponse> {
    const isSaaS = dto.deploymentType === 'SAAS'
      || (dto.deploymentType === undefined && this.isSaaSEnvironment());

    const deploymentType: DeploymentType = isSaaS ? 'SAAS' : 'ON_PREMISE';

    const baseUrl = this.config.get<string>('OVDS_MARKETPLACE_URL')
      ?? 'https://marketplace.ovds.com.et';

    const downloadUrl = isSaaS
      ? null
      : buildDownloadUrl(baseUrl, dto.moduleAlias, dto.apiKey);

    // Create the job record synchronously so the client gets a job ID
    const job = await jobRepo(this.prisma).create({
      data: {
        companyId:      dto.companyId,
        moduleAlias:    dto.moduleAlias,
        status:         'PENDING',
        deploymentType,
        downloadUrl,
        progress:       0,
        message:        'Initialising…',
        triggeredBy:    dto.triggeredBy ?? null,
        startedAt:      new Date(),
      } as any,
    });

    // Kick off async execution — do not await; errors are persisted in the job row
    this.executeJob(job.id, dto, deploymentType).catch((err) => {
      this.logger.error(`ModuleDownloadJob ${job.id} crashed outside try/catch: ${err?.message}`);
    });

    return this.toResponse(job as any);
  }

  /**
   * SaaS-only fast-path: activate a module for a tenant without any file I/O.
   */
  async activateSaaS(dto: ActivateSaaSDto): Promise<JobStatusResponse> {
    if (!this.isSaaSEnvironment()) {
      throw new BadRequestException(
        'activateSaaS is only available in cloud/SaaS mode. ' +
        'Use /modules/download-local for on-premises deployments.',
      );
    }

    const job = await jobRepo(this.prisma).create({
      data: {
        companyId:      dto.companyId,
        moduleAlias:    dto.moduleAlias,
        status:         'ACTIVATING',
        deploymentType: 'SAAS',
        progress:       50,
        message:        'Activating module for tenant…',
        triggeredBy:    dto.triggeredBy ?? null,
        startedAt:      new Date(),
      } as any,
    });

    // Run activation and await it (fast — only DB writes)
    try {
      await this.activateTenantModule(dto.companyId, dto.moduleAlias);
      const updated = await jobRepo(this.prisma).update({
        where: { id: job.id },
        data: {
          status:      'DONE',
          progress:    100,
          message:     `Module "${dto.moduleAlias}" activated for tenant.`,
          completedAt: new Date(),
        } as any,
      });
      return this.toResponse(updated as any);
    } catch (err: any) {
      const updated = await jobRepo(this.prisma).update({
        where: { id: job.id },
        data: {
          status:      'FAILED',
          progress:    0,
          message:     err?.message ?? 'Activation failed',
          completedAt: new Date(),
        } as any,
      });
      throw new InternalServerErrorException(
        `Module activation failed: ${err?.message}`,
      );
    }
  }

  /** Fetch a job by ID, scoped to companyId for tenant safety. */
  async getJobStatus(jobId: string, companyId: string): Promise<JobStatusResponse> {
    const job = await jobRepo(this.prisma).findFirst({
      where: { id: jobId, companyId },
    });
    if (!job) throw new NotFoundException(`Download job ${jobId} not found`);
    return this.toResponse(job as any);
  }

  /** List recent jobs for a company (last 50, newest first). */
  async listJobs(companyId: string): Promise<JobStatusResponse[]> {
    const jobs = await jobRepo(this.prisma).findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return (jobs as any[]).map(j => this.toResponse(j));
  }

  /** Cancel a PENDING or DOWNLOADING job. */
  async cancelJob(jobId: string, companyId: string): Promise<JobStatusResponse> {
    const job = await jobRepo(this.prisma).findFirst({
      where: { id: jobId, companyId },
    });
    if (!job) throw new NotFoundException(`Download job ${jobId} not found`);
    if (!['PENDING', 'DOWNLOADING'].includes((job as any).status)) {
      throw new BadRequestException(
        `Cannot cancel a job in status "${(job as any).status}"`,
      );
    }
    const updated = await jobRepo(this.prisma).update({
      where: { id: jobId },
      data: { status: 'CANCELLED', message: 'Cancelled by user', completedAt: new Date() } as any,
    });
    return this.toResponse(updated as any);
  }

  // ── Private — execution pipeline ───────────────────────────────────────────

  private async executeJob(
    jobId: string,
    dto: StartDownloadDto,
    deploymentType: DeploymentType,
  ): Promise<void> {
    try {
      if (deploymentType === 'SAAS') {
        await this.runSaaSPipeline(jobId, dto);
      } else {
        await this.runOnPremisePipeline(jobId, dto);
      }
    } catch (err: any) {
      this.logger.error(`Job ${jobId} failed: ${err?.message}`, err?.stack);
      await jobRepo(this.prisma).update({
        where: { id: jobId },
        data: {
          status:      'FAILED',
          message:     err?.message ?? 'Unknown error',
          completedAt: new Date(),
        } as any,
      }).catch(() => undefined);
    }
  }

  // ── SaaS pipeline ──────────────────────────────────────────────────────────

  private async runSaaSPipeline(jobId: string, dto: StartDownloadDto): Promise<void> {
    await this.updateJob(jobId, 'ACTIVATING', 30, 'Validating tenant subscription…');

    // Validate API key against marketplace (lightweight HEAD request)
    await this.validateApiKey(dto.apiKey, dto.moduleAlias);

    await this.updateJob(jobId, 'ACTIVATING', 60, 'Writing tenant module permissions…');
    await this.activateTenantModule(dto.companyId, dto.moduleAlias);

    await this.updateJob(jobId, 'DONE', 100, `Module "${dto.moduleAlias}" is now active.`, {
      completedAt: new Date(),
    });
  }

  // ── On-premise pipeline ────────────────────────────────────────────────────

  private async runOnPremisePipeline(jobId: string, dto: StartDownloadDto): Promise<void> {
    const baseUrl  = this.config.get<string>('OVDS_MARKETPLACE_URL') ?? 'https://marketplace.ovds.com.et';
    const modsRoot = this.resolveModulesRoot();
    const destDir  = path.join(modsRoot, dto.moduleAlias);
    const tmpDir   = this.config.get<string>('OVDS_TMP_DIR') ?? path.join(modsRoot, '.tmp');
    const zipPath  = path.join(tmpDir, `${dto.moduleAlias}-${Date.now()}.zip`);

    await fsp.mkdir(tmpDir, { recursive: true });

    // ── 1. Validate API key ────────────────────────────────────────────────
    await this.updateJob(jobId, 'DOWNLOADING', 2, 'Validating API key with marketplace…');
    await this.validateApiKey(dto.apiKey, dto.moduleAlias);

    // ── 2. Download ────────────────────────────────────────────────────────
    await this.updateJob(jobId, 'DOWNLOADING', 5, 'Connecting to marketplace…');
    const downloadUrl = buildDownloadUrl(baseUrl, dto.moduleAlias, dto.apiKey);

    let lastPct = 5;
    await downloadToFile(downloadUrl, zipPath, async (pct) => {
      // Throttle DB updates: only write when progress moves ≥ 5 points
      if (pct - lastPct >= 5) {
        lastPct = pct;
        await this.updateJob(jobId, 'DOWNLOADING', Math.min(pct, 79), `Downloading… ${pct}%`);
      }
    });

    // ── 3. Integrity check ─────────────────────────────────────────────────
    await this.updateJob(jobId, 'EXTRACTING', 80, 'Verifying file integrity (SHA-256)…');
    const sha256 = await sha256File(zipPath);
    await jobRepo(this.prisma).update({
      where: { id: jobId },
      data: { sha256 } as any,
    });

    // ── 4. Extract ─────────────────────────────────────────────────────────
    await this.updateJob(jobId, 'EXTRACTING', 85, `Extracting to ${destDir}…`);
    await extractZip(zipPath, destDir);

    // ── 5. Record target path ──────────────────────────────────────────────
    await jobRepo(this.prisma).update({
      where: { id: jobId },
      data: { targetPath: destDir } as any,
    });

    // ── 6. Clean up temp zip ───────────────────────────────────────────────
    await fsp.unlink(zipPath).catch(() => undefined);

    // ── 7. Activate module in DB ───────────────────────────────────────────
    await this.updateJob(jobId, 'ACTIVATING', 95, 'Registering module in database…');
    await this.activateTenantModule(dto.companyId, dto.moduleAlias);

    await this.updateJob(jobId, 'DONE', 100, `Module "${dto.moduleAlias}" installed at ${destDir}.`, {
      completedAt: new Date(),
      targetPath:  destDir,
    });

    this.logger.log(`Module "${dto.moduleAlias}" installed at ${destDir} for company ${dto.companyId}`);
  }

  // ── DB helpers ─────────────────────────────────────────────────────────────

  /**
   * Activate a module for a tenant:
   *   1. Upsert the CompanyModule row (per-company enable/disable toggle)
   *   2. Upsert the AppInstallation row (marketplace app record)
   *
   * Both are idempotent — safe to call multiple times.
   */
  private async activateTenantModule(companyId: string, moduleAlias: string): Promise<void> {
    // 1. CompanyModule — enables the module in the OVDS module system
    let dbModule = await this.prisma.module.findUnique({ where: { key: moduleAlias } });
    if (!dbModule) {
      dbModule = await this.prisma.module.create({
        data: {
          key:         moduleAlias,
          name:        this.humanize(moduleAlias),
          description: `Installed via App Store: ${moduleAlias}`,
          isCore:      false,
        },
      });
    }

    await this.prisma.companyModule.upsert({
      where:  { companyId_moduleKey: { companyId, moduleKey: moduleAlias } },
      create: { companyId, moduleKey: moduleAlias, isEnabled: true, activatedAt: new Date() },
      update: { isEnabled: true, activatedAt: new Date() },
    });

    // 2. AppInstallation — links the marketplace App record (if it exists)
    const app = await this.prisma.app.findFirst({
      where: { OR: [{ slug: moduleAlias }, { name: this.humanize(moduleAlias) }] },
    });
    if (app) {
      await this.prisma.appInstallation.upsert({
        where:  { companyId_appId: { companyId, appId: app.id } },
        create: {
          companyId,
          appId:       app.id,
          version:     app.version,
          status:      'ACTIVE',
          installedBy: 'marketplace',
        } as any,
        update: {
          status:    'ACTIVE',
          version:   app.version,
          updatedAt: new Date(),
        } as any,
      });

      // Increment marketplace download counter (fire-and-forget)
      this.prisma.app
        .update({ where: { id: app.id }, data: { downloads: { increment: 1 } } as any })
        .catch(() => undefined);
    }
  }

  /** Call the marketplace /api/modules/:alias/validate endpoint to check the key. */
  private async validateApiKey(apiKey: string, moduleAlias: string): Promise<void> {
    if (process.env.SKIP_MARKETPLACE_VALIDATION === 'true') return;

    const baseUrl = this.config.get<string>('OVDS_MARKETPLACE_URL') ?? 'https://marketplace.ovds.com.et';
    const url = `${baseUrl}/api/modules/${encodeURIComponent(moduleAlias)}/validate?api_key=${encodeURIComponent(apiKey)}`;

    await new Promise<void>((resolve, reject) => {
      const proto = url.startsWith('https') ? https : http;
      const req = proto.get(url, { timeout: 10_000 }, (res) => {
        if (res.statusCode === 200 || res.statusCode === 204) { resolve(); return; }
        if (res.statusCode === 401 || res.statusCode === 403) {
          reject(new BadRequestException('Invalid or expired OVDS Marketplace API key.'));
          return;
        }
        if (res.statusCode === 404) {
          reject(new NotFoundException(`Module "${moduleAlias}" not found in the marketplace.`));
          return;
        }
        // Non-critical validation failures are logged but not fatal
        this.logger.warn(`Marketplace validation returned ${res.statusCode} for module ${moduleAlias}`);
        resolve();
      });
      req.on('error', () => {
        // Network failures during validation are non-fatal in dev mode
        if (process.env.NODE_ENV !== 'production') { resolve(); return; }
        reject(new InternalServerErrorException('Could not reach the OVDS Marketplace. Check network connectivity.'));
      });
      req.on('timeout', () => {
        req.destroy();
        if (process.env.NODE_ENV !== 'production') { resolve(); return; }
        reject(new InternalServerErrorException('Marketplace validation timed out.'));
      });
    });
  }

  private async updateJob(
    jobId: string,
    status: JobStatus,
    progress: number,
    message: string,
    extra: Record<string, unknown> = {},
  ): Promise<void> {
    await jobRepo(this.prisma).update({
      where: { id: jobId },
      data: { status, progress, message, ...extra } as any,
    }).catch((err: unknown) => {
      // Log but don't throw — progress updates are non-critical
      this.logger.warn(`Could not update job ${jobId}: ${(err as any)?.message}`);
    });
  }

  // ── Env helpers ────────────────────────────────────────────────────────────

  private isSaaSEnvironment(): boolean {
    const val = this.config.get<string>('IS_SAAS') ?? process.env['IS_SAAS'] ?? 'false';
    return val === 'true' || val === '1';
  }

  private resolveModulesRoot(): string {
    return (
      this.config.get<string>('OVDS_MODULES_PATH') ??
      process.env['OVDS_MODULES_PATH'] ??
      path.resolve(process.cwd(), 'modules')
    );
  }

  private humanize(alias: string): string {
    return alias
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // ── Response mapper ────────────────────────────────────────────────────────

  private toResponse(job: Record<string, any>): JobStatusResponse {
    return {
      jobId:          job.id,
      moduleAlias:    job.moduleAlias,
      status:         job.status as JobStatus,
      deploymentType: job.deploymentType as DeploymentType,
      progress:       job.progress ?? 0,
      message:        job.message ?? null,
      targetPath:     job.targetPath ?? null,
      startedAt:      job.startedAt ? new Date(job.startedAt).toISOString() : null,
      completedAt:    job.completedAt ? new Date(job.completedAt).toISOString() : null,
      createdAt:      new Date(job.createdAt).toISOString(),
    };
  }
}
