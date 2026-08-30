export const ACCOUNTING_EVENTS = {
  ACCOUNT_CREATED: 'accounting.account.created',
  ACCOUNT_UPDATED: 'accounting.account.updated',
  JOURNAL_ENTRY_CREATED: 'accounting.journal.created',
  JOURNAL_ENTRY_POSTED: 'accounting.journal.posted',
  PERIOD_CLOSED: 'accounting.period.closed',
} as const;

export type AccountingEventType = typeof ACCOUNTING_EVENTS[keyof typeof ACCOUNTING_EVENTS];
