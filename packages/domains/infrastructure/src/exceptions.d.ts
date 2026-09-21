/**
 * Custom HTTP exceptions shared across all domain libraries.
 * Import from @ovds/domains-infrastructure — never redefine per domain.
 *
 * These match the implementations previously in apps/backend/src/common/exceptions/.
 * The originals now re-export from here (backward-compatible shim pattern).
 */
import { HttpException } from '@nestjs/common';
/**
 * 402 Payment Required — subscription or feature entitlement missing.
 *
 * The frontend api.ts interceptor redirects to /payment-required on 402,
 * passing the featureKey so the upgrade wall shows the correct plan requirement.
 *
 * @example
 *   throw new PaymentRequiredException('feature:gl');
 */
export declare class PaymentRequiredException extends HttpException {
    constructor(featureKeyOrMessage?: string);
}
/**
 * 410 Gone — resource permanently deleted/archived.
 * Use over 404 when the resource existed but is intentionally gone.
 */
export declare class GoneException extends HttpException {
    constructor(message?: string);
}
/**
 * 501 Not Implemented — endpoint defined but not yet built.
 * Distinct from 404: the route exists, the server just doesn't support it yet.
 */
export declare class NotImplementedException extends HttpException {
    constructor(message?: string);
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
export declare class ValidationException extends HttpException {
    constructor(fields: Record<string, string>, message?: string);
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
export declare class BusinessRuleException extends HttpException {
    constructor(message: string, ruleCode?: string);
}
//# sourceMappingURL=exceptions.d.ts.map