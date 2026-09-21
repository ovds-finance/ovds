
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
  // ERCA / MCC fields
  mcc?: string;
  mccDescription?: string;
  qrType?: string;
  tinValidated?: boolean;
  isDuplicate?: boolean;
  orderNo?: string;
  orderType?: string;
}

const ReceiptViewer: React.FC<{
  onClose?: () => void;
  onApply?: (evidence: ReceiptEvidence) => void;
  initialRef?: string;
  invoiceId?: string | number;
}> = () => null;
export default ReceiptViewer;
