import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Unauthenticated health check — returns minimal status only.
   * Version, deployment mode, and provider are intentionally omitted to
   * prevent reconnaissance.  Operators can query /health/detailed (ADMIN
   * role required) for the full picture.
   */
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
