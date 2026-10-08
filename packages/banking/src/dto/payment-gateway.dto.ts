export type PaymentProvider = 'TELEBIRR' | 'CBE_MOBILE' | 'BANK_TRANSFER';

export type PaymentProviderStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface InitPaymentInput {
  provider: PaymentProvider;
  amount: number;
  referenceNumber: string;
  currency?: string;
}

export interface PaymentCallbackPayload {
  provider: PaymentProvider;
  transactionId: string;
  referenceNumber: string;
  amount: string;
  currency: string;
  status: PaymentProviderStatus;
  providerSignature?: string;
  paidAt?: string;
}

export interface PaymentResult {
  paymentReference: string;
  status: PaymentProviderStatus;
  providerTransactionId?: string;
  amount: string;
  currency: string;
  paidAt?: string;
}
