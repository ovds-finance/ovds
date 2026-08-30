import React from 'react';

export interface ReceiptEvidence {
  receiptId: string;
  irn?: string;
  qrCode?: string;
  amount: number;
  currency: string;
  issuedAt: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  telecomRef?: string;
  telecomParsed?: {
    amount?: number | null;
    paidAt?: string | null;
    payer?: string | null;
  };
  interactionType?: string;
  archType?: string;
  processType?: string;
}

const ReceiptViewer = () => null;
export default ReceiptViewer;
