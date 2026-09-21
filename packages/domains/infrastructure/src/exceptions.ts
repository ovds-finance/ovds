/**
 * Custom HTTP exceptions shared across all domain libraries.
 * Import from @ovds/domains-infrastructure — never redefine per domain.
 *
 * These match the implementations previously in apps/backend/src/common/exceptions/.
 * The originals now re-export from here (backward-compatible shim pattern).
 */
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 402 Payment Required — subscription or feature entitlement missing.
 *
 * The frontend api.ts interceptor redirects to /payment-required on 402,
 * passing the featureKey so the upgrade wall shows the correct plan requirement.
 *
 * @example
 *   throw new PaymentRequiredException('feature:gl');
 */
export class PaymentRequiredException extends HttpException {
  constructor(featureKeyOrMessage = 'This feature requires an active subscription.') {
    const isFeatureKey =
      featureKeyOrMessage.includes(':') && !featureKeyOrMessage.includes(' ');
    const message = isFeatureKey
      ? `This feature requires an active subscription. Missing: ${featureKeyOrMessage}`
      : featureKeyOrMessage;
    const featureKey = isFeatureKey ? featureKeyOrMessage : undefined;
    super(
      { statusCode: HttpStatus.PAYMENT_REQUIRED, error: 'Payment Required', message, featureKey, success: false },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

/**
 * 410 Gone — resource permanently deleted/archived.
 * Use over 404 when the resource existed but is intentionally gone.
 */
export class GoneException extends HttpException {
  constructor(message = 'This resource is no longer available.') {
    super(
      { statusCode: HttpStatus.GONE, error: 'Gone', message, success: false },
      HttpStatus.GONE,
    );
  }
}

/**
 * 501 Not Implemented — endpoint defined but not yet built.
 * Distinct from 404: the route exists, the server just doesn't support it yet.
 */
export class NotImplementedException extends HttpException {
  constructor(message = 'This feature is not yet implemented.') {
    super(
      { statusCode: HttpStatus.NOT_IMPLEMENTED, error: 'Not Implemented', message, success: false },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}

/**
 * 422 Unprocessable — domain-level validation failure.
 * Accepts a field → message map so the frontend can highlight specific fields.
 *
 * @example
 *   throw new ValidationException({
 *     vatNumber: 'VAT number already registered.',
 *     tin: 'TIN must be 10 digits.',
 *   });
 */
export class ValidationException extends HttpException {
  constructor(fields: Record<string, string>, message = 'Validation failed') {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Validation Failed',
        message,
        fields,
        success: false,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * 422 Unprocessable — business rule violated.
 * Accepts an optional rule code for frontend i18n key lookup.
 *
 * @example
 *   throw new BusinessRuleException(
 *     'Cannot void an invoice that has been partially paid.',
 *     'INVOICE_PARTIAL_PAYMENT',
 *   );
 */
export class BusinessRuleException extends HttpException {
  constructor(message: string, ruleCode?: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Business Rule Violation',
        message,
        ...(ruleCode
          ? { ruleCode, messageKey: `errors.business.${ruleCode.toLowerCase()}` }
          : {}),
        success: false,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
