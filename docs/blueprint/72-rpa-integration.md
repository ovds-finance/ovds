# 72 — Robotic Process Automation (RPA) Integration

## 1. RPA Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Robotic Process Automation                       │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Bot       │  │   Process   │  │   Orchestrator           │ │
│  │   Manager   │  │   Designer  │  │                         │ │
│  │             │  │             │  │ - Scheduling            │ │
│  │ - Create    │  │ - Record    │  │ - Monitoring            │ │
│  │ - Deploy    │  │ - Design    │  │ - Scaling               │ │
│  │ - Monitor   │  │ - Test      │  │ - Error Handling        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Process Store     │                        │
│                   │   (Versioned)       │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Bot Manager

```typescript
// rpa/bots/bot-manager.service.ts
@Injectable()
export class BotManagerService {
  async createBot(dto: CreateBotDto): Promise<Bot> {
    return this.prisma.bot.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        type: dto.type,
        configuration: dto.configuration,
        status: 'draft',
        createdBy: dto.userId,
      },
    });
  }

  async deployBot(botId: string): Promise<DeploymentResult> {
    const bot = await this.prisma.bot.findFirst({ where: { id: botId } });

    if (!bot) throw new BotNotFoundException(botId);

    // Validate bot
    await this.validateBot(bot);

    // Deploy
    const deployment = await this.orchestrator.deploy({
      botId: bot.id,
      type: bot.type,
      configuration: bot.configuration,
    });

    await this.prisma.bot.update({
      where: { id: botId },
      data: { status: 'active', deployedAt: new Date() },
    });

    return deployment;
  }

  async executeBot(botId: string, input: BotInput): Promise<BotResult> {
    const bot = await this.prisma.bot.findFirst({ where: { id: botId } });

    if (!bot) throw new BotNotFoundException(botId);

    const execution = await this.orchestrator.execute({
      botId: bot.id,
      input,
    });

    await this.prisma.botExecution.create({
      data: {
        botId,
        organizationId: bot.organizationId,
        input,
        output: execution.result,
        status: execution.status,
        logs: execution.logs,
      },
    });

    return execution.result;
  }
}
```

## 3. Process Designer

```typescript
// rpa/designer/process-designer.service.ts
@Injectable()
export class ProcessDesignerService {
  async designProcess(dto: CreateProcessDto): Promise<Process> {
    return this.prisma.process.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        description: dto.description,
        steps: dto.steps,
        triggers: dto.triggers,
        createdBy: dto.userId,
        status: 'draft',
      },
    });
  }

  async recordProcess(name: string): Promise<RecordedProcess> {
    const recorder = new ProcessRecorder();

    const recording = await recorder.start({
      name,
      captureMouse: true,
      captureKeyboard: true,
      captureScreenshots: true,
    });

    return {
      recordingId: recording.id,
      steps: recording.steps,
      screenshots: recording.screenshots,
    };
  }

  async generateBotFromRecording(recordingId: string): Promise<Bot> {
    const recording = await this.getRecording(recordingId);

    const bot = await this.botManager.createBot({
      organizationId: recording.organizationId,
      name: `${recording.name} Bot`,
      type: 'recorded',
      configuration: {
        steps: recording.steps,
        screenshots: recording.screenshots,
      },
      userId: recording.createdBy,
    });

    return bot;
  }
}
```

## 4. Orchestrator

```typescript
// rpa/orchestrator/orchestrator.service.ts
@Injectable()
export class OrchestratorService {
  async schedule(processId: string, schedule: Schedule): Promise<void> {
    const process = await this.prisma.process.findFirst({ where: { id: processId } });

    if (!process) throw new ProcessNotFoundException(processId);

    // Create cron job
    await this.cronService.create({
      name: `rpa-${processId}`,
      cron: schedule.cron,
      handler: async () => {
        await this.executeProcess(process);
      },
    });
  }

  async executeProcess(process: Process): Promise<ProcessResult> {
    const context = await this.createExecutionContext(process);

    const results: StepResult[] = [];

    for (const step of process.steps) {
      const result = await this.executeStep(step, context);
      results.push(result);

      if (!result.success) {
        await this.handleFailure(process, step, result);
        break;
      }

      context.variables = { ...context.variables, ...result.output };
    }

    return {
      processId: process.id,
      status: 'completed',
      results,
      context: context.variables,
    };
  }

  private async executeStep(step: ProcessStep, context: ExecutionContext): Promise<StepResult> {
    switch (step.type) {
      case 'http_request':
        return this.executeHttpStep(step, context);
      case 'database_query':
        return this.executeDbStep(step, context);
      case 'file_operation':
        return this.executeFileStep(step, context);
      case 'email':
        return this.executeEmailStep(step, context);
      case 'decision':
        return this.executeDecisionStep(step, context);
      case 'delay':
        return this.executeDelayStep(step, context);
      default:
        throw new UnknownStepTypeException(step.type);
    }
  }
}
```

## 5. Common RPA Patterns

```typescript
// rpa/patterns/patterns.service.ts
@Injectable()
export class PatternsService {
  async extractInvoiceData(invoice: Invoice): Promise<ExtractedInvoice> {
    const bot = await this.getBot('invoice_extraction');

    const result = await this.executeBot(bot.id, {
      document: invoice.documentUrl,
    });

    return {
      invoiceNumber: result.invoiceNumber,
      date: result.date,
      vendor: result.vendor,
      amount: result.amount,
      tax: result.tax,
      lineItems: result.lineItems,
    };
  }

  async reconcileBankStatement(statement: BankStatement): Promise<ReconciliationResult> {
    const bot = await this.getBot('bank_reconciliation');

    const result = await this.executeBot(bot.id, {
      statement: statement.transactions,
      systemTransactions: await this.getSystemTransactions(),
    });

    return {
      matched: result.matched,
      unmatched: result.unmatched,
      discrepancies: result.discrepancies,
    };
  }

  async submitVatReturn(vatReturn: VatReturn): Promise<SubmissionResult> {
    const bot = await this.getBot('vat_submission');

    const result = await this.executeBot(bot.id, {
      returnData: vatReturn,
      jurisdiction: vatReturn.jurisdiction,
    });

    return {
      submitted: result.success,
      reference: result.reference,
      confirmation: result.confirmation,
    };
  }
}
```

## 6. Error Handling

```typescript
// rpa/errors/error-handler.service.ts
@Injectable()
export class ErrorHandlerService {
  async handleError(error: BotError, context: ErrorContext): Promise<ErrorHandlingResult> {
    const strategy = await this.determineStrategy(error, context);

    switch (strategy) {
      case 'retry':
        return this.retry(context, strategy.retryCount, strategy.retryDelay);
      case 'skip':
        return this.skipStep(context);
      case 'halt':
        return this.haltProcess(context);
      case 'notify':
        await this.notifyAdmin(error, context);
        return this.haltProcess(context);
      default:
        throw new UnknownErrorStrategyException(strategy);
    }
  }

  private async determineStrategy(error: BotError, context: ErrorContext): Promise<ErrorStrategy> {
    const strategies = await this.prisma.errorStrategy.findMany({
      where: { botId: context.botId, errorType: error.type },
    });

    if (strategies.length > 0) {
      return strategies[0];
    }

    return { type: 'halt', retryCount: 0, retryDelay: 0 };
  }
}
```

## 7. Monitoring Dashboard

```typescript
// apps/web/src/features/rpa/components/rpa-dashboard.tsx
export function RPADashboard() {
  const { data: bots, isLoading } = useBots();
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">RPA Dashboard</h1>
        <Button onClick={() => createBot()}>New Bot</Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>Active Bots</CardTitle></CardHeader>
          <CardContent>
            <Metric value={bots?.active || 0} label="Running" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Executions Today</CardTitle></CardHeader>
          <CardContent>
            <Metric value={bots?.executionsToday || 0} label="Executions" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Success Rate</CardTitle></CardHeader>
          <CardContent>
            <Metric value={`${bots?.successRate || 0}%`} label="Success" trend={bots?.successTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Avg Execution Time</CardTitle></CardHeader>
          <CardContent>
            <Metric value={`${bots?.avgExecutionTime || 0}s`} label="Average" />
          </CardContent>
        </Card>
      </div>

      <DataTable data={bots?.list || []} columns={botColumns}>
        <TableBody>
          {bots?.list.map((bot) => (
            <TableRow key={bot.id}>
              <TableCell>{bot.name}</TableCell>
              <TableCell><Badge variant={getStatusVariant(bot.status)}>{bot.status}</Badge></TableCell>
              <TableCell>{bot.type}</TableCell>
              <TableCell>{bot.executions}</TableCell>
              <TableCell>{bot.successRate}%</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => setSelectedBot(bot)}>View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}
```

## 8. Process Store

```typescript
// rpa/store/process-store.service.ts
@Injectable()
export class ProcessStoreService {
  async saveProcess(process: Process): Promise<void> {
    await this.prisma.process.update({
      where: { id: process.id },
      data: {
        version: { increment: 1 },
        steps: process.steps,
        updatedAt: new Date(),
      },
    });
  }

  async getProcessVersions(processId: string): Promise<ProcessVersion[]> {
    return this.prisma.processVersion.findMany({
      where: { processId },
      orderBy: { version: 'desc' },
    });
  }

  async rollback(processId: string, version: number): Promise<Process> {
    const versionData = await this.prisma.processVersion.findFirst({
      where: { processId, version },
    });

    if (!versionData) throw new ProcessVersionNotFoundException(version);

    return this.prisma.process.update({
      where: { id: processId },
      data: {
        steps: versionData.steps,
        version: { increment: 1 },
      },
    });
  }
}
```
