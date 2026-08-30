import { SetMetadata } from '@nestjs/common';

export const THROTTLE_OPTIONS = 'throttle_options';

export interface ThrottleOptions {
  ttl: number;
  limit: number;
}

export function Throttle(ttl: number, limit: number) {
  return SetMetadata(THROTTLE_OPTIONS, { ttl, limit } as ThrottleOptions);
}
