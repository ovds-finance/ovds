import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

import { validatePassword, DEFAULT_PASSWORD_POLICY } from './password-policy';

@Injectable()
export class PasswordPolicyPipe implements PipeTransform {
  transform(value: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('Password must be a string');
    }

    const result = validatePassword(value, DEFAULT_PASSWORD_POLICY);
    if (!result.valid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: result.errors,
      });
    }

    return value;
  }
}
