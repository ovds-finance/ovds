"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleException = exports.ValidationException = exports.NotImplementedException = exports.GoneException = exports.PaymentRequiredException = void 0;
/**
 * Custom HTTP exceptions shared across all domain libraries.
 * Import from @ovds/domains-infrastructure — never redefine per domain.
 *
 * These match the implementations previously in apps/backend/src/common/exceptions/.
 * The originals now re-export from here (backward-compatible shim pattern).
 */
const common_1 = require("@nestjs/common");
/**
 * 402 Payment Required — subscription or feature entitlement missing.
 *
 * The frontend api.ts interceptor redirects to /payment-required on 402,
 * passing the featureKey so the upgrade wall shows the correct plan requirement.
 *
 * @example
 *   throw new PaymentRequiredException('feature:gl');
 */
class PaymentRequiredException extends common_1.HttpException {
    constructor(featureKeyOrMessage = 'This feature requires an active subscription.') {
        const isFeatureKey = featureKeyOrMessage.includes(':') && !featureKeyOrMessage.includes(' ');
        const message = isFeatureKey
            ? `This feature requires an active subscription. Missing: ${featureKeyOrMessage}`
            : featureKeyOrMessage;
        const featureKey = isFeatureKey ? featureKeyOrMessage : undefined;
        super({ statusCode: common_1.HttpStatus.PAYMENT_REQUIRED, error: 'Payment Required', message, featureKey, success: false }, common_1.HttpStatus.PAYMENT_REQUIRED);
    }
}
exports.PaymentRequiredException = PaymentRequiredException;
/**
 * 410 Gone — resource permanently deleted/archived.
 * Use over 404 when the resource existed but is intentionally gone.
 */
class GoneException extends common_1.HttpException {
    constructor(message = 'This resource is no longer available.') {
        super({ statusCode: common_1.HttpStatus.GONE, error: 'Gone', message, success: false }, common_1.HttpStatus.GONE);
    }
}
exports.GoneException = GoneException;
/**
 * 501 Not Implemented — endpoint defined but not yet built.
 * Distinct from 404: the route exists, the server just doesn't support it yet.
 */
class NotImplementedException extends common_1.HttpException {
    constructor(message = 'This feature is not yet implemented.') {
        super({ statusCode: common_1.HttpStatus.NOT_IMPLEMENTED, error: 'Not Implemented', message, success: false }, common_1.HttpStatus.NOT_IMPLEMENTED);
    }
}
exports.NotImplementedException = NotImplementedException;
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
class ValidationException extends common_1.HttpException {
    constructor(fields, message = 'Validation failed') {
        super({
            statusCode: common_1.HttpStatus.UNPROCESSABLE_ENTITY,
            error: 'Validation Failed',
            message,
            fields,
            success: false,
        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
exports.ValidationException = ValidationException;
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
class BusinessRuleException extends common_1.HttpException {
    constructor(message, ruleCode) {
        super({
            statusCode: common_1.HttpStatus.UNPROCESSABLE_ENTITY,
            error: 'Business Rule Violation',
            message,
            ...(ruleCode
                ? { ruleCode, messageKey: `errors.business.${ruleCode.toLowerCase()}` }
                : {}),
            success: false,
        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
exports.BusinessRuleException = BusinessRuleException;
//# sourceMappingURL=exceptions.js.map