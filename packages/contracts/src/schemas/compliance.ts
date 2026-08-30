/**
 * @ovds/contracts — Compliance Schemas
 */
import { z } from 'zod';

export const ComplianceChecklistSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  assignee: z.string().optional(),
  notes: z.string().optional(),
});

export const EimsSourceSystemSchema = z.object({
  id: z.string().uuid(),
  systemNumber: z.string(),
  systemType: z.enum(['ERP', 'POS', 'MANUAL']),
  enterpriseId: z.string().optional(),
  establishmentId: z.string().optional(),
  clientId: z.string(),
  clientSecret: z.string().optional(),
  apiKey: z.string().optional(),
  callbackUrl: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'active']),
  tin: z.string(),
  createdAt: z.string(),
});

export const EimsCertificateSchema = z.object({
  id: z.string().uuid(),
  sourceSystemId: z.string().uuid(),
  certificatePem: z.string().optional(),
  csrPem: z.string().optional(),
  status: z.enum(['pending', 'generated', 'submitted', 'installed', 'expired']),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
});

export const EimsRegistrationSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  irn: z.string().optional(),
  status: z.enum(['pending', 'registered', 'failed', 'cancelled']),
  documentNumber: z.string(),
  registrationDate: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
});

export const EimsBulkJobSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string(),
  type: z.enum(['register', 'cancel']),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  totalItems: z.number().int(),
  processedItems: z.number().int(),
  successCount: z.number().int(),
  failureCount: z.number().int(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});

export const TaxReportSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['monthly_vat', 'monthly_wht', 'annual', 'custom']),
  period: z.string(),
  status: z.enum(['draft', 'submitted', 'accepted', 'rejected']),
  submittedAt: z.string().optional(),
  amount: z.number().optional(),
  createdAt: z.string(),
});
