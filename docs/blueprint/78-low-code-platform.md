# 78 — Low-Code/No-Code Platform Integration

## 1. Low-Code Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Low-Code/No-Code Platform                       │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Visual    │  │   Logic     │  │   Integration Layer      │ │
│  │   Designer  │  │   Builder   │  │                         │ │
│  │             │  │             │  │ - REST APIs             │ │
│  │ - Drag/Drop │  │ - Flow      │  │ - GraphQL               │ │
│  │ - Form      │  │   Based     │  │ - Webhooks              │ │
│  │ - Page      │  │ - Formula   │  │ - Events                │ │
│  │   Builder   │  │ - Script    │  │ - Custom Code           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                    │                  │
│         └────────────────┼────────────────────┘                  │
│                          ▼                                       │
│                   ┌─────────────────────┐                        │
│                   │   Runtime Engine    │                        │
│                   │   (Interpreted)     │                        │
│                   └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Visual Designer

```typescript
// lowcode/designer/visual-designer.service.ts
@Injectable()
export class VisualDesignerService {
  async createApp(dto: CreateAppDto): Promise<App> {
    return this.prisma.lowCodeApp.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        description: dto.description,
        schema: dto.schema,
        createdBy: dto.userId,
      },
    });
  }

  async renderApp(appId: string, context: RenderContext): Promise<RenderedApp> {
    const app = await this.prisma.lowCodeApp.findFirst({
      where: { id: appId },
      include: {
        pages: true,
        components: true,
        workflows: true,
      },
    });

    const pages = await Promise.all(
      app.pages.map((page) => this.renderPage(page, context)),
    );

    return {
      app: {
        id: app.id,
        name: app.name,
        pages,
      },
    };
  }

  private async renderPage(page: Page, context: RenderContext): Promise<RenderedPage> {
    const components = await Promise.all(
      page.components.map((component) => this.renderComponent(component, context)),
    );

    return {
      id: page.id,
      name: page.name,
      path: page.path,
      components,
    };
  }

  private async renderComponent(component: Component, context: RenderContext): Promise<RenderedComponent> {
    switch (component.type) {
      case 'form':
        return this.renderForm(component, context);
      case 'table':
        return this.renderTable(component, context);
      case 'chart':
        return this.renderChart(component, context);
      case 'text':
        return this.renderText(component, context);
      case 'button':
        return this.renderButton(component, context);
      default:
        throw new UnknownComponentTypeException(component.type);
    }
  }
}
```

## 3. Form Builder

```typescript
// lowcode/forms/form-builder.service.ts
@Injectable()
export class FormBuilderService {
  async createForm(dto: CreateFormDto): Promise<Form> {
    return this.prisma.lowCodeForm.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        fields: dto.fields,
        validation: dto.validation,
        createdBy: dto.userId,
      },
    });
  }

  async renderForm(formId: string, data?: any): Promise<RenderedForm> {
    const form = await this.prisma.lowCodeForm.findFirst({
      where: { id: formId },
    });

    const fields = form.fields.map((field) => ({
      ...field,
      value: data?.[field.name],
      error: data ? await this.validateField(field, data[field.name]) : null,
    }));

    return {
      id: form.id,
      name: form.name,
      fields,
      submitUrl: form.submitUrl,
      submitMethod: form.submitMethod,
    };
  }

  async handleSubmit(formId: string, data: any): Promise<FormSubmission> {
    const form = await this.prisma.lowCodeForm.findFirst({ where: { id: formId } });

    // Validate
    const validation = await this.validateForm(form, data);
    if (!validation.valid) {
      throw new ValidationFailedException(validation.errors);
    }

    // Submit
    if (form.submitUrl) {
      const response = await fetch(form.submitUrl, {
        method: form.submitMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      return {
        success: response.ok,
        data: await response.json(),
      };
    }

    // Store
    return this.prisma.formSubmission.create({
      data: {
        formId,
        organizationId: form.organizationId,
        data,
      },
    });
  }
}
```

## 4. Logic Builder

```typescript
// lowcode/logic/logic-builder.service.ts
@Injectable()
export class LogicBuilderService {
  async createWorkflow(dto: CreateWorkflowDto): Promise<Workflow> {
    return this.prisma.lowCodeWorkflow.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        trigger: dto.trigger,
        steps: dto.steps,
        createdBy: dto.userId,
      },
    });
  }

  async executeWorkflow(workflowId: string, context: WorkflowContext): Promise<WorkflowResult> {
    const workflow = await this.prisma.lowCodeWorkflow.findFirst({
      where: { id: workflowId },
    });

    const executor = new WorkflowExecutor(workflow);

    return executor.execute(context);
  }
}

class WorkflowExecutor {
  constructor(private workflow: Workflow) {}

  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    const results: StepResult[] = [];

    for (const step of this.workflow.steps) {
      const result = await this.executeStep(step, context);
      results.push(result);

      if (result.output) {
        context.variables[step.outputVariable] = result.output;
      }
    }

    return {
      workflowId: this.workflow.id,
      status: 'completed',
      results,
      context: context.variables,
    };
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult> {
    switch (step.type) {
      case 'http_request':
        return this.executeHttpRequest(step, context);
      case 'database_query':
        return this.executeDatabaseQuery(step, context);
      case 'condition':
        return this.executeCondition(step, context);
      case 'loop':
        return this.executeLoop(step, context);
      case 'delay':
        return this.executeDelay(step);
      case 'notification':
        return this.executeNotification(step, context);
      default:
        throw new UnknownStepTypeException(step.type);
    }
  }
}
```

## 5. Integration Layer

```typescript
// lowcode/integration/integration-layer.service.ts
@Injectable()
export class IntegrationLayerService {
  async connectExternal(connection: ExternalConnection): Promise<Connection> {
    const connector = this.getConnector(connection.type);

    const validated = await connector.validate(connection.credentials);

    if (!validated.valid) {
      throw new InvalidCredentialsException(validated.errors);
    }

    return this.prisma.externalConnection.create({
      data: {
        organizationId: connection.organizationId,
        type: connection.type,
        name: connection.name,
        credentials: await this.encrypt(connection.credentials),
        status: 'active',
      },
    });
  }

  async sync(connectionId: string, config: SyncConfig): Promise<SyncResult> {
    const connection = await this.prisma.externalConnection.findFirst({
      where: { id: connectionId },
    });

    const connector = this.getConnector(connection.type);
    const credentials = await this.decrypt(connection.credentials);

    const source = await connector.fetch(credentials, config.source);
    const target = await connector.push(credentials, config.target, source);

    return {
      synced: source.length,
      createdAt: new Date(),
    };
  }
}
```

## 6. Formula Engine

```typescript
// lowcode/formulas/formula-engine.service.ts
@Injectable()
export class FormulaEngineService {
  async evaluate(formula: string, context: any): Promise<any> {
    const parser = new FormulaParser();

    const ast = parser.parse(formula);

    const evaluator = new FormulaEvaluator(context);

    return evaluator.evaluate(ast);
  }
}

class FormulaEvaluator {
  constructor(private context: any) {}

  evaluate(node: ASTNode): any {
    switch (node.type) {
      case 'literal':
        return node.value;
      case 'identifier':
        return this.context[node.name];
      case 'binary':
        return this.evaluateBinary(node);
      case 'function':
        return this.evaluateFunction(node);
      default:
        throw new UnknownNodeTypeException(node.type);
    }
  }

  private evaluateBinary(node: BinaryNode): any {
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);

    switch (node.operator) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case '>':
        return left > right;
      case '<':
        return left < right;
      default:
        throw new UnknownOperatorException(node.operator);
    }
  }
}
```

## 7. Marketplace

```typescript
// lowcode/marketplace/marketplace.service.ts
@Injectable()
export class LowCodeMarketplaceService {
  async search(query: string, filters: MarketplaceFilters): Promise<MarketplaceItem[]> {
    return this.prisma.lowCodeTemplate.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        category: filters.category,
        isPublic: true,
      },
    });
  }

  async install(templateId: string, orgId: string): Promise<InstalledTemplate> {
    const template = await this.prisma.lowCodeTemplate.findFirst({
      where: { id: templateId },
    });

    const app = await this.prisma.lowCodeApp.create({
      data: {
        organizationId: orgId,
        name: template.name,
        description: template.description,
        schema: template.schema,
        fromTemplate: templateId,
      },
    });

    return { app, template };
  }
}
```

## 8. Runtime Engine

```typescript
// lowcode/runtime/runtime-engine.service.ts
@Injectable()
export class RuntimeEngineService {
  async execute(appId: string, action: string, context: any): Promise<any> {
    const app = await this.prisma.lowCodeApp.findFirst({
      where: { id: appId },
    });

    const runtime = new LowCodeRuntime(app);

    return runtime.execute(action, context);
  }
}

class LowCodeRuntime {
  constructor(private app: App) {}

  async execute(action: string, context: any): Promise<any> {
    const definition = this.app.workflows.find((w) => w.trigger === action);

    if (!definition) {
      throw new ActionNotFoundException(action);
    }

    const executor = new WorkflowExecutor(definition);

    return executor.execute(context);
  }
}
```
