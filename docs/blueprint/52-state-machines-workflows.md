# 53 — State Machines and Workflows

## 1. VAT Return State Machine

The VAT return lifecycle is modeled as a state machine with explicit transitions.

```
┌─────────────────────────────────────────────────────────────────┐
│                    VAT Return State Machine                     │
│                                                                 │
│  ┌──────────┐   submit   ┌─────────────┐   authority   ┌──────┐ │
│  │  draft   │────────────▶│ submitted   │───────────────▶│accepted│
│  └──────────┘             └─────────────┘                └──────┘ │
│       │                         │                              │    │
│       │                         │ reject                       │    │
│       │                         ▼                              │    │
│       │                  ┌─────────────┐                       │    │
│       │                  │  rejected   │                       │    │
│       │                  └─────────────┘                       │    │
│       │                         │                              │    │
│       │                         │ resubmit                     │    │
│       │                         │                              │    │
│       │    cancel               ▼                              │    │
│       │  ┌─────────────┐   ┌─────────────┐                    │    │
│       └──│  cancelled  │   │ pending_    │                    │    │
│          └─────────────┘   │  review     │                    │    │
│                            └─────────────┘                    │    │
│                                 │                              │    │
│                                 │ pay                          │    │
│                                 ▼                              │    │
│                          ┌─────────────┐                       │    │
│                          │    paid     │◀──────────────────────┘    │
│                          └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

### 1.1 State Definitions

```typescript
// vat-returns/vat-return-status.enum.ts
export enum VatReturnStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}
```

### 1.2 State Machine Configuration

```typescript
// vat-returns/vat-return-state-machine.config.ts
export const VAT_RETURN_STATES: Record<VatReturnStatus, StateConfig> = {
  [VatReturnStatus.DRAFT]: {
    name: 'draft',
    description: 'Return is being prepared',
    allowedTransitions: [VatReturnStatus.PENDING_REVIEW, VatReturnStatus.CANCELLED],
    permissions: {
      [VatReturnStatus.PENDING_REVIEW]: 'vat_returns.submit',
      [VatReturnStatus.CANCELLED]: 'vat_returns.cancel',
    },
  },
  [VatReturnStatus.PENDING_REVIEW]: {
    name: 'pending_review',
    description: 'Return is under review',
    allowedTransitions: [VatReturnStatus.SUBMITTED, VatReturnStatus.DRAFT],
    permissions: {
      [VatReturnStatus.SUBMITTED]: 'vat_returns.submit',
      [VatReturnStatus.DRAFT]: 'vat_returns.update',
    },
  },
  [VatReturnStatus.SUBMITTED]: {
    name: 'submitted',
    description: 'Return submitted to tax authority',
    allowedTransitions: [VatReturnStatus.ACCEPTED, VatReturnStatus.REJECTED],
    permissions: {},
  },
  [VatReturnStatus.ACCEPTED]: {
    name: 'accepted',
    description: 'Return accepted by tax authority',
    allowedTransitions: [VatReturnStatus.PAID],
    permissions: {
      [VatReturnStatus.PAID]: 'vat_returns.mark_paid',
    },
  },
  [VatReturnStatus.REJECTED]: {
    name: 'rejected',
    description: 'Return rejected by tax authority',
    allowedTransitions: [VatReturnStatus.DRAFT, VatReturnStatus.PENDING_REVIEW],
    permissions: {
      [VatReturnStatus.DRAFT]: 'vat_returns.update',
      [VatReturnStatus.PENDING_REVIEW]: 'vat_returns.submit',
    },
  },
  [VatReturnStatus.PAID]: {
    name: 'paid',
    description: 'Return paid',
    allowedTransitions: [],
    permissions: {},
  },
  [VatReturnStatus.CANCELLED]: {
    name: 'cancelled',
    description: 'Return cancelled',
    allowedTransitions: [VatReturnStatus.DRAFT],
    permissions: {
      [VatReturnStatus.DRAFT]: 'vat_returns.restore',
    },
  },
};
```

### 1.3 State Machine Service

```typescript
// vat-returns/vat-return-state-machine.service.ts
@Injectable()
export class VatReturnStateMachineService {
  async transition(
    returnId: string,
    toStatus: VatReturnStatus,
    userId: string,
    notes?: string,
  ): Promise<VatReturn> {
    const vatReturn = await this.vatReturnRepository.findById(returnId);
    if (!vatReturn) throw new VatReturnNotFoundException(returnId);

    const currentState = VAT_RETURN_STATES[vatReturn.status];
    if (!currentState.allowedTransitions.includes(toStatus)) {
      throw new InvalidStateTransitionException(vatReturn.status, toStatus);
    }

    // Check permissions
    const requiredPermission = currentState.permissions[toStatus];
    if (requiredPermission && !(await this.hasPermission(userId, requiredPermission))) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Update status
      const updated = await tx.vatReturn.update({
        where: { id: returnId },
        data: {
          status: toStatus,
          ...(toStatus === VatReturnStatus.SUBMITTED && { submittedAt: new Date() }),
          ...(toStatus === VatReturnStatus.ACCEPTED && { acceptedAt: new Date() }),
          ...(toStatus === VatReturnStatus.REJECTED && { rejectedAt: new Date() }),
          ...(toStatus === VatReturnStatus.PAID && { paidAt: new Date() }),
        },
      });

      // Create history entry
      await tx.vatReturnHistory.create({
        data: {
          vatReturnId: returnId,
          action: `status_changed_to_${toStatus}`,
          userId,
          notes: notes || `Status changed from ${vatReturn.status} to ${toStatus}`,
        },
      });

      // Emit event
      await this.eventBus.emit(new VatReturnStatusChangedEvent(returnId, vatReturn.status, toStatus, userId));

      return updated;
    });
  }
}
```

## 2. Document State Machine

Similar state machine for documents (invoices/bills):

```typescript
// documents/document-status.enum.ts
export enum DocumentStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  APPROVED = 'approved',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  UNPAID = 'unpaid',
  CANCELLED = 'cancelled',
}

// documents/document-state-machine.config.ts
export const DOCUMENT_STATES: Record<DocumentStatus, StateConfig> = {
  [DocumentStatus.DRAFT]: {
    allowedTransitions: [DocumentStatus.SENT, DocumentStatus.CANCELLED],
    permissions: {
      [DocumentStatus.SENT]: 'documents.send',
      [DocumentStatus.CANCELLED]: 'documents.cancel',
    },
  },
  [DocumentStatus.SENT]: {
    allowedTransitions: [DocumentStatus.VIEWED, DocumentStatus.APPROVED, DocumentStatus.CANCELLED],
    permissions: {
      [DocumentStatus.CANCELLED]: 'documents.cancel',
    },
  },
  [DocumentStatus.VIEWED]: {
    allowedTransitions: [DocumentStatus.APPROVED, DocumentStatus.CANCELLED],
  },
  [DocumentStatus.APPROVED]: {
    allowedTransitions: [DocumentStatus.PARTIAL, DocumentStatus.PAID, DocumentStatus.OVERDUE],
  },
  [DocumentStatus.PARTIAL]: {
    allowedTransitions: [DocumentStatus.PAID, DocumentStatus.OVERDUE],
  },
  [DocumentStatus.PAID]: {
    allowedTransitions: [],
  },
  [DocumentStatus.OVERDUE]: {
    allowedTransitions: [DocumentStatus.PARTIAL, DocumentStatus.PAID],
  },
  [DocumentStatus.UNPAID]: {
    allowedTransitions: [DocumentStatus.PAID, DocumentStatus.CANCELLED],
  },
  [DocumentStatus.CANCELLED]: {
    allowedTransitions: [DocumentStatus.DRAFT],
  },
};
```

## 3. Number Generation Sequence

### 3.1 Next Number Pattern

```typescript
// common/services/number-generator.service.ts
@Injectable()
export class NumberGeneratorService {
  async getNextNumber(type: string, organizationId: string): Promise<string> {
    const sequence = await this.prisma.sequence.findFirst({
      where: { organizationId, type },
    });

    if (!sequence) {
      // Create new sequence
      const sequence = await this.prisma.sequence.create({
        data: {
          organizationId,
          type,
          prefix: this.getDefaultPrefix(type),
          nextNumber: 2,
          padding: this.getDefaultPadding(type),
        },
      });
      return this.formatNumber(sequence.prefix, 1, sequence.padding);
    }

    const number = sequence.nextNumber;
    await this.prisma.sequence.update({
      where: { id: sequence.id },
      data: { nextNumber: { increment: 1 } },
    });

    return this.formatNumber(sequence.prefix, number, sequence.padding);
  }

  private getDefaultPrefix(type: string): string {
    const prefixes: Record<string, string> = {
      invoice: 'INV-',
      bill: 'BILL-',
      transaction: 'TXN-',
      vat_return: 'RET-',
      quote: 'QUOTE-',
    };
    return prefixes[type] || 'DOC-';
  }

  private getDefaultPadding(type: string): number {
    const paddings: Record<string, number> = {
      invoice: 5,
      bill: 5,
      transaction: 8,
      vat_return: 6,
      quote: 5,
    };
    return paddings[type] || 6;
  }

  private formatNumber(prefix: string, number: number, padding: number): string {
    return `${prefix}${String(number).padStart(padding, '0')}`;
  }
}
```

### 3.2 Sequence Model

```prisma
model Sequence {
  id              String   @id @default(cuid())
  organizationId  String
  type            String   // "invoice", "bill", "transaction", "vat_return"
  prefix          String   // "INV-", "BILL-", etc.
  nextNumber      Int      @default(1)
  padding         Int      @default(6)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([organizationId, type])
}
```

## 4. Workflow Orchestration

### 4.1 Workflow Definition

```typescript
// workflows/workflow.interface.ts
export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly steps: WorkflowStep[];
}

export interface WorkflowStep {
  readonly id: string;
  readonly name: string;
  readonly action: string;
  readonly next?: string | string[];
  readonly guard?: WorkflowGuard;
}

export interface WorkflowContext {
  readonly returnId: string;
  readonly organizationId: string;
  readonly userId: string;
}

export interface WorkflowGuard {
  (context: WorkflowContext): Promise<boolean>;
}
```

### 4.2 VAT Return Submission Workflow

```typescript
// workflows/vat-return-submission.workflow.ts
export const VAT_RETURN_SUBMISSION_WORKFLOW: Workflow = {
  id: 'vat-return-submission',
  name: 'VAT Return Submission',
  steps: [
    {
      id: 'validate',
      name: 'Validate Return',
      action: 'validate',
      next: 'calculate_totals',
      guard: async (ctx) => {
        const vatReturn = await prisma.vatReturn.findUnique({
          where: { id: ctx.returnId },
          include: { items: true },
        });
        return vatReturn.items.length > 0;
      },
    },
    {
      id: 'calculate_totals',
      name: 'Calculate Totals',
      action: 'calculate_totals',
      next: 'check_integration',
    },
    {
      id: 'check_integration',
      name: 'Check Integration',
      action: 'check_integration',
      next: 'submit',
      guard: async (ctx) => {
        const integration = await prisma.integration.findFirst({
          where: { organizationId: ctx.organizationId, type: 'vat_authority', status: 'active' },
        });
        return !!integration;
      },
    },
    {
      id: 'submit',
      name: 'Submit to Authority',
      action: 'submit',
      next: 'handle_response',
    },
    {
      id: 'handle_response',
      name: 'Handle Response',
      action: 'handle_response',
      next: 'notify',
    },
    {
      id: 'notify',
      name: 'Send Notifications',
      action: 'notify',
      next: 'complete',
    },
    {
      id: 'complete',
      name: 'Complete',
      action: 'complete',
    },
  ],
};
```

### 4.3 Workflow Engine

```typescript
// workflows/workflow-engine.service.ts
@Injectable()
export class WorkflowEngineService {
  async execute(workflow: Workflow, context: WorkflowContext): Promise<WorkflowResult> {
    const history: WorkflowStepResult[] = [];
    let currentStep = workflow.steps[0];

    while (currentStep) {
      const result = await this.executeStep(currentStep, context);
      history.push(result);

      if (!currentStep.next || result.status === 'failed') {
        break;
      }

      const nextStepId = typeof currentStep.next === 'string' ? currentStep.next : currentStep.next[0];
      currentStep = workflow.steps.find((s) => s.id === nextStepId);
    }

    return {
      workflowId: workflow.id,
      context,
      history,
      status: history.every((h) => h.status === 'completed') ? 'completed' : 'failed',
    };
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<WorkflowStepResult> {
    try {
      if (step.guard && !(await step.guard(context))) {
        return { stepId: step.id, status: 'skipped', message: 'Guard condition not met' };
      }

      await this.executeAction(step.action, context);

      return { stepId: step.id, status: 'completed' };
    } catch (error) {
      return { stepId: step.id, status: 'failed', error: error.message };
    }
  }

  private async executeAction(action: string, context: WorkflowContext): Promise<void> {
    switch (action) {
      case 'validate':
        await this.validateReturn(context.returnId);
        break;
      case 'calculate_totals':
        await this.calculateTotals(context.returnId);
        break;
      case 'submit':
        await this.submitToAuthority(context.returnId);
        break;
      case 'notify':
        await this.sendNotifications(context);
        break;
      case 'complete':
        await this.completeWorkflow(context);
        break;
    }
  }
}
```

## 5. Recurring Document Workflow

### 5.1 Recurring Model

```prisma
model Recurring {
  id              String   @id @default(cuid())
  organizationId  String
  recurableType   String   // "document", "transaction"
  recurableId     String
  frequency       String   // "daily", "weekly", "monthly", "quarterly", "yearly"
  interval        Int      @default(1)
  startDate       DateTime
  endDate         DateTime?
  nextRecurDate   DateTime
  limitBy         String?  // "count", "date", "never"
  limitCount      Int?
  limitDate       DateTime?
  cron            String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 5.2 Recurring Engine

```typescript
// recurring/recurring-engine.service.ts
@Injectable()
export class RecurringEngineService {
  async processDueRecurrings(): Promise<void> {
    const dueRecurrings = await this.prisma.recurring.findMany({
      where: {
        isActive: true,
        nextRecurDate: { lte: new Date() },
      },
    });

    for (const recurring of dueRecurrings) {
      try {
        await this.processRecurring(recurring);
      } catch (error) {
        this.logger.error(`Failed to process recurring ${recurring.id}:`, error);
      }
    }
  }

  private async processRecurring(recurring: Recurring): Promise<void> {
    const nextDate = this.calculateNextDate(recurring);

    if (recurring.limitBy === 'count') {
      const count = await this.prisma.recurringHistory.count({
        where: { recurringId: recurring.id },
      });
      if (count >= recurring.limitCount!) {
        await this.prisma.recurring.update({
          where: { id: recurring.id },
          data: { isActive: false },
        });
        return;
      }
    }

    if (recurring.recurableType === 'document') {
      await this.createRecurringDocument(recurring);
    } else if (recurring.recurableType === 'transaction') {
      await this.createRecurringTransaction(recurring);
    }

    await this.prisma.recurring.update({
      where: { id: recurring.id },
      data: { nextRecurDate: nextDate },
    });
  }

  private calculateNextDate(recurring: Recurring): Date {
    const current = new Date(recurring.nextRecurDate);
    switch (recurring.frequency) {
      case 'daily':
        current.setDate(current.getDate() + recurring.interval);
        break;
      case 'weekly':
        current.setDate(current.getDate() + (7 * recurring.interval));
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + recurring.interval);
        break;
      case 'quarterly':
        current.setMonth(current.getMonth() + (3 * recurring.interval));
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + recurring.interval);
        break;
    }
    return current;
  }
}
```

## 6. Approval Workflow

### 6.1 Approval Configuration

```typescript
// workflows/approval-workflow.config.ts
export interface ApprovalWorkflow {
  id: string;
  organizationId: string;
  entityType: string; // "vat_return", "transaction"
  rules: ApprovalRule[];
}

export interface ApprovalRule {
  id: string;
  conditions: ApprovalCondition[];
  approvers: Approver[];
  timeoutHours: number;
  escalation: EscalationConfig;
}

export interface ApprovalCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'neq';
  value: any;
}

export interface Approver {
  userId?: string;
  roleId?: string;
  order: number;
}

export interface EscalationConfig {
  enabled: boolean;
  escalateTo: string[]; // user IDs or role IDs
  escalateAfterHours: number;
}
```

### 6.2 Approval Service

```typescript
// workflows/approval.service.ts
@Injectable()
export class ApprovalService {
  async createApprovalRequest(entityType: string, entityId: string): Promise<ApprovalRequest> {
    const workflow = await this.getWorkflow(entityType);
    const entity = await this.getEntity(entityType, entityId);

    const matchingRule = workflow.rules.find((rule) =>
      rule.conditions.every((condition) => this.evaluateCondition(entity, condition)),
    );

    if (!matchingRule) {
      return { status: 'auto_approved' };
    }

    const approvalRequest = await this.prisma.approvalRequest.create({
      data: {
        organizationId: entity.organizationId,
        entityType,
        entityId,
        workflowId: workflow.id,
        ruleId: matchingRule.id,
        status: 'pending',
        currentStep: 0,
        totalSteps: matchingRule.approvers.length,
        expiresAt: new Date(Date.now() + matchingRule.timeoutHours * 60 * 60 * 1000),
      },
    });

    // Send to first approver
    await this.sendToApprover(approvalRequest, matchingRule.approvers[0]);

    return approvalRequest;
  }

  async approve(requestId: string, userId: string, comments?: string): Promise<void> {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { workflow: { include: { rules: true } } },
    });

    const rule = request.workflow.rules.find((r) => r.id === request.ruleId)!;
    const approver = rule.approvers[request.currentStep];

    if (approver.userId !== userId && approver.roleId !== (await this.getUserRole(userId)).id) {
      throw new ForbiddenException('Not authorized to approve');
    }

    await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        currentStep: { increment: 1 },
      },
    });

    if (request.currentStep + 1 >= rule.approvers.length) {
      await this.prisma.approvalRequest.update({
        where: { id: requestId },
        data: { status: 'approved', approvedAt: new Date() },
      });
      await this.onApproved(request.entityType, request.entityId);
    } else {
      await this.sendToApprover(request, rule.approvers[request.currentStep + 1]);
    }
  }
}
```

## 7. Validation Pipelines

### 7.1 Validation Stages

```typescript
// vat-returns/validation/vat-return-validator.service.ts
@Injectable()
export class VatReturnValidatorService {
  async validate(returnId: string): Promise<ValidationResult> {
    const vatReturn = await this.vatReturnRepository.findByIdWithItems(returnId);
    if (!vatReturn) throw new VatReturnNotFoundException(returnId);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Stage 1: Structural validation
    await this.validateStructure(vatReturn, errors, warnings);

    // Stage 2: Business rule validation
    await this.validateBusinessRules(vatReturn, errors, warnings);

    // Stage 3: Tax authority specific validation
    await this.validateAuthorityRules(vatReturn, errors, warnings);

    // Stage 4: Consistency validation
    await this.validateConsistency(vatReturn, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private async validateStructure(vatReturn: VatReturn, errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    if (!vatReturn.vatRegistrationId) {
      errors.push({ field: 'vatRegistrationId', message: 'VAT registration is required' });
    }
    if (!vatReturn.periodStart) {
      errors.push({ field: 'periodStart', message: 'Period start is required' });
    }
    if (!vatReturn.periodEnd) {
      errors.push({ field: 'periodEnd', message: 'Period end is required' });
    }
    if (vatReturn.periodStart >= vatReturn.periodEnd) {
      errors.push({ field: 'period', message: 'Period start must be before period end' });
    }
  }

  private async validateBusinessRules(vatReturn: VatReturn, errors: ValidationError[], warnings: ValidationWarning[]): Promise<void> {
    // Check items exist
    if (vatReturn.items.length === 0) {
      warnings.push({ field: 'items', message: 'Return has no line items' });
    }

    // Check totals match
    const calculatedTotals = await this.vatCalculator.calculateReturn({
      items: vatReturn.items,
      jurisdictionId: vatReturn.vatRegistration.jurisdictionId,
    });

    if (Math.abs(calculatedTotals.totals.netVatDue - (vatReturn.netVatDue || 0)) > 0.01) {
      errors.push({
        field: 'netVatDue',
        message: 'Return total does not match sum of items',
        expected: calculatedTotals.totals.netVatDue,
        actual: vatReturn.netVatDue,
      });
    }
  }
}
```

## 8. Event Correlation

```typescript
// events/correlation.service.ts
@Injectable()
export class EventCorrelationService {
  private readonly correlationMap = new Map<string, string[]>();

  correlate(parentEventId: string, childEventId: string): void {
    if (!this.correlationMap.has(parentEventId)) {
      this.correlationMap.set(parentEventId, []);
    }
    this.correlationMap.get(parentEventId)!.push(childEventId);
  }

  getRelatedEvents(eventId: string): string[] {
    return this.correlationMap.get(eventId) || [];
  }

  async getEventChain(returnId: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      where: {
        streamId: `vat-return:${returnId}`,
      },
      orderBy: { version: 'asc' },
    });

    return events.map((e) => ({
      id: e.id,
      type: e.eventType,
      payload: e.payload,
      timestamp: e.createdAt,
    }));
  }
}
```
