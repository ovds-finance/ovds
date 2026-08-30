import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class EthiopianTinPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): string | unknown {
    if (metadata.type === 'param') {
      if (typeof value !== 'string') {
        throw new BadRequestException('Invalid Ethiopian TIN: must be a string');
      }
      if (!this.isValidTin(value)) {
        throw new BadRequestException('Invalid Ethiopian TIN: must be exactly 10 digits');
      }
      return value;
    }
    if (metadata.type === 'body' && value && typeof value === 'object') {
      const tin = (value as Record<string, unknown>).tin;
      if (tin === undefined || tin === null) return value;
      if (typeof tin !== 'string' || !this.isValidTin(tin)) {
        throw new BadRequestException('Invalid Ethiopian TIN: must be exactly 10 digits');
      }
      return value;
    }
    return value;
  }

  isValidTin(tin: string): boolean {
    if (typeof tin !== 'string') return false;
    const cleaned = tin.replace(/\s/g, '');
    return /^\d{10}$/.test(cleaned);
  }
}
