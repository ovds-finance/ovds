// reporting lib exports
export {
  STANDARD_REPORTS,
  MODULAR_REPORTS,
  ALL_TEMPLATES,
  findTemplate,
  templatesByCategory,
  BASIS_OPTIONS,
} from './reportRegistry';
export {
  normalizeReport,
  fmtMoney,
  fmtNumber,
  fmtCell,
} from './normalizers';
export type { RenderedReport } from './normalizers';
