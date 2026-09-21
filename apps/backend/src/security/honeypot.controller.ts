import {
  Controller,
  All,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { HoneypotGuard } from '../common/guards/honeypot.guard';

/**
 * HoneypotController
 *
 * Exposes URLs that no legitimate user or client ever visits.
 * Any request reaching these paths comes from:
 *   - Automated scanners / recon tools
 *   - Credential-stuffing bots
 *   - Directory-traversal probes
 *
 * The HoneypotGuard fires first, logs the event, and blacklists the IP.
 * The controller then returns a realistic-looking decoy payload so the
 * attacker does not realise the trap was triggered.
 *
 * IMPORTANT: These paths must NEVER be linked from any real UI or docs.
 * They must not appear in the OpenAPI spec (no @ApiTags).
 *
 * Covered paths (catch-all via @All so every HTTP verb is trapped):
 *   /admin/config
 *   /admin/env
 *   /admin/users/dump
 *   /.env
 *   /wp-admin          (common WordPress scan)
 *   /phpMyAdmin
 *   /config.json
 *   /server-status     (Apache status probe)
 *   /actuator          (Spring Boot actuator probe)
 *   /console           (Grails / JEE console probe)
 */
@Controller()
@UseGuards(HoneypotGuard)
export class HoneypotController {

  // ── Trap: /admin/config ──────────────────────────────────────────────────
  @All('admin/config')
  adminConfig(@Req() _req: Request, @Res() res: Response) {
    return res.status(HttpStatus.OK).json(this.decoyAdminPayload());
  }

  // ── Trap: /admin/env ──────────────────────────────────────────────────────
  @All('admin/env')
  adminEnv(@Req() _req: Request, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({ NODE_ENV: 'production', PORT: 3001 });
  }

  // ── Trap: /admin/users/dump ───────────────────────────────────────────────
  @All('admin/users/dump')
  adminUsersDump(@Req() _req: Request, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({ users: [], total: 0 });
  }

  // ── Trap: /.env ───────────────────────────────────────────────────────────
  @All('.env')
  dotEnv(@Req() _req: Request, @Res() res: Response) {
    // Return a plausible-looking but entirely fake .env to waste attacker time
    res.setHeader('Content-Type', 'text/plain');
    return res.status(HttpStatus.OK).send(
      'NODE_ENV=production\nPORT=3001\nDB_HOST=localhost\nDB_PASSWORD=changeme\n',
    );
  }

  // ── Trap: /wp-admin ───────────────────────────────────────────────────────
  @All('wp-admin')
  @All('wp-login.php')
  wpAdmin(@Req() _req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(HttpStatus.OK).send(
      '<!DOCTYPE html><html><head><title>WordPress &rsaquo; Error</title></head>' +
      '<body><h1>Error</h1><p>There has been a critical error on this website.</p></body></html>',
    );
  }

  // ── Trap: /phpMyAdmin ─────────────────────────────────────────────────────
  @All('phpMyAdmin')
  @All('phpmyadmin')
  phpMyAdmin(@Req() _req: Request, @Res() res: Response) {
    return res.status(HttpStatus.NOT_FOUND).json({ error: 'Not found' });
  }

  // ── Trap: /config.json ────────────────────────────────────────────────────
  @All('config.json')
  configJson(@Req() _req: Request, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({ version: '1.0.0', env: 'production' });
  }

  // ── Trap: /server-status, /actuator, /console ────────────────────────────
  @All('server-status')
  @All('actuator')
  @All('actuator/*')
  @All('console')
  serverProbes(@Req() _req: Request, @Res() res: Response) {
    return res.status(HttpStatus.FORBIDDEN).json({ error: 'Forbidden' });
  }

  // ── Trap: git/svn/env exposure probes ────────────────────────────────────
  @All('.git/config')
  @All('.git/HEAD')
  @All('.svn/entries')
  @All('.env.backup')
  @All('.env.bak')
  @All('env.js')
  @All('env.json')
  @All('credentials.json')
  @All('secrets.json')
  gitAndEnvProbes(@Req() _req: Request, @Res() res: Response) {
    return res.status(HttpStatus.NOT_FOUND).json({ error: 'Not found' });
  }

  // ── Trap: common backup/archive probes ───────────────────────────────────
  @All('backup.sql')
  @All('backup.zip')
  @All('dump.sql')
  @All('db.sql')
  @All('database.sql')
  @All('site.tar.gz')
  backupProbes(@Req() _req: Request, @Res() res: Response) {
    return res.status(HttpStatus.NOT_FOUND).json({ error: 'Not found' });
  }

  // ── Trap: common debug/trace endpoints ───────────────────────────────────
  @All('debug')
  @All('trace')
  @All('info')
  @All('env')
  @All('metrics')
  debugProbes(@Req() _req: Request, @Res() res: Response) {
    // Return plausible but entirely fake data to waste attacker time
    return res.status(HttpStatus.OK).json({ status: 'ok' });
  }

  // ── Decoy payload helpers ─────────────────────────────────────────────────
  private decoyAdminPayload(): Record<string, unknown> {
    return {
      version: '1.0.0',
      environment: 'production',
      features: { maintenance: false, debug: false },
    };
  }
}
