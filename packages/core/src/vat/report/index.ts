/**
 * @file packages/core/src/vat/report/index.ts
 *
 * Public barrel for the @ovds/core/vat/report subpath.
 *
 * Usage:
 *   import { VatReportEngine, getVatReportEngine } from '@ovds/core/vat/report';
 *   import type { IVatReportRenderer, VatRenderContext, VatRenderResult } from '@ovds/core/vat/report';
 */

export type {
  VatRenderContext,
  VatRenderResult,
  IVatReportRenderer,
}                           from './vat-report-engine';

export {
  VatReportEngine,
  getVatReportEngine,
  resetVatReportEngine,
}                           from './vat-report-engine';
