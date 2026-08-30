/**
 * Re-export shim — invoice/billing logic now lives in the canonical
 *
 * All existing imports continue to work.
 * New code should import from the canonical path directly.
 */
export * from '@ovds/domains/invoice';
